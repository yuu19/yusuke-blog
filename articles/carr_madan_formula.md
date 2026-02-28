---
title: 'Carr-Madan公式の導出と証明、数値実装'
description: 'Carr-Madan (1999) のオプション価格公式を、仮定・導出・反転公式・実装例まで通して解説する'
emoji: '📈'
date: 2026-02-27
topics: ["finance", "option-pricing", "fourier"]
blog_published: True
published: False
---

## 概要

Carr-Madan (1999) は、**特性関数が分かるモデル**（Black-Scholes, Heston, VG など）でコール価格を安定かつ高速に計算するために、

1. ストライク方向に減衰因子をかける
2. Fourier 変換する
3. 逆変換で価格に戻す

という流れを与えました。

このページでは以下を順に示します。

- 公式の厳密な導出
- 成立条件（なぜ damping が必要か）
- 数値積分の実装例（`python3` のみ、外部ライブラリ不要）

---

## 1. 記法と前提

満期 $T$、無裁定金利 $r$、配当利回り $q$。リスク中立測度 $\mathbb{Q}$ の下で

$$
X_T := \log S_T
$$

とし、その密度を $f_T(x)$ とします（密度がない場合も特性関数ベースで同様に扱えますが、導出では密度で書きます）。

コール価格を

$$
C(K,T) = e^{-rT}\,\mathbb{E}^{\mathbb{Q}}[(S_T-K)^+]
$$

とし、対数ストライク $k = \log K$ を使って

$$
c_T(k) := C(e^k, T)
$$

と書きます。すると

$$
c_T(k)
= e^{-rT}\int_k^{\infty}(e^x-e^k)f_T(x)\,dx.
$$

さらに特性関数を

$$
\phi_T(u) := \mathbb{E}[e^{iuX_T}] = \int_{-\infty}^{\infty}e^{iux}f_T(x)\,dx
$$

で定義します（$u$ は複素数へ解析接続されるものとする）。

---

## 2. なぜ damping が必要か

そのまま $c_T(k)$ を $k$ 方向に Fourier 変換すると、$k\to -\infty$（超 ITM）で $c_T(k)$ はほぼ $S_0e^{-qT}$ に近づき、可積分性が悪くなります。

そこで $\alpha>0$ を取り、

$$
g_\alpha(k):=e^{\alpha k}c_T(k)
$$

を使います。$\alpha$ を適切に選べば $g_\alpha\in L^1(\mathbb{R})$ となり Fourier 変換が扱いやすくなります。

実務的には $\alpha\in[1,2]$ 付近から始めることが多いです（モデル・満期・尾の重さで調整）。

---

## 3. Carr-Madan 公式の導出（証明）

Fourier 変換の規約を

$$
\widehat{g}_\alpha(v):=\int_{-\infty}^{\infty}e^{ivk}g_\alpha(k)\,dk
$$

とします。

### 3.1 二重積分へ展開

$$
\begin{aligned}
\widehat{g}_\alpha(v)
&=\int_{-\infty}^{\infty}e^{ivk}e^{\alpha k}c_T(k)\,dk \\
&=e^{-rT}\int_{-\infty}^{\infty}e^{(\alpha+iv)k}\left(\int_k^{\infty}(e^x-e^k)f_T(x)\,dx\right)dk.
\end{aligned}
$$

可積分条件（例えば $\mathbb{E}[S_T^{\alpha+1}]<\infty$）の下で Fubini を使って積分順序を交換すると

$$
\widehat{g}_\alpha(v)
=e^{-rT}\int_{-\infty}^{\infty}
\left(\int_{-\infty}^{x}e^{(\alpha+iv)k}(e^x-e^k)\,dk\right)
f_T(x)\,dx.
$$

内側の積分を $I(x)$ とおくと

$$
\begin{aligned}
I(x)
&= e^x\int_{-\infty}^{x}e^{(\alpha+iv)k}dk
 -\int_{-\infty}^{x}e^{(\alpha+1+iv)k}dk \\
&= \frac{e^{(\alpha+1+iv)x}}{\alpha+iv}
 -\frac{e^{(\alpha+1+iv)x}}{\alpha+1+iv} \\
&= \frac{e^{(\alpha+1+iv)x}}{(\alpha+iv)(\alpha+1+iv)}.
\end{aligned}
$$

したがって

$$
\widehat{g}_\alpha(v)
=\frac{e^{-rT}}{(\alpha+iv)(\alpha+1+iv)}
\int_{-\infty}^{\infty}e^{(\alpha+1+iv)x}f_T(x)\,dx.
$$

ここで

$$
e^{(\alpha+1+iv)x}=e^{i(v-i(\alpha+1))x}
$$

なので、右端積分は $\phi_T(v-i(\alpha+1))$ です。ゆえに

$$
\boxed{
\widehat{g}_\alpha(v)
=\frac{e^{-rT}\,\phi_T\bigl(v-i(\alpha+1)\bigr)}{(\alpha+iv)(\alpha+1+iv)}
}
$$

を得ます。これが Carr-Madan の中心式です。

### 3.2 逆変換で価格へ戻す

逆 Fourier 変換より

$$
g_\alpha(k)=\frac{1}{2\pi}\int_{-\infty}^{\infty}e^{-ivk}\widehat{g}_\alpha(v)\,dv.
$$

$c_T(k)=e^{-\alpha k}g_\alpha(k)$ なので

$$
c_T(k)=\frac{e^{-\alpha k}}{2\pi}\int_{-\infty}^{\infty}e^{-ivk}\widehat{g}_\alpha(v)\,dv.
$$

価格が実数であることから対称性を使うと、実装で使う片側積分形

$$
\boxed{
C(K,T)
=\frac{e^{-\alpha k}}{\pi}\int_0^{\infty}
\Re\left[e^{-ivk}\widehat{g}_\alpha(v)\right]dv,
\quad k=\log K
}
$$

が得られます。

---

## 4. Black-Scholes での具体式

Black-Scholes 下では

$$
X_T\sim \mathcal{N}\left(m,\sigma^2T\right),
\quad m=\log S_0 + (r-q-\tfrac{1}{2}\sigma^2)T
$$

なので、複素引数に対する特性関数は

$$
\phi_T(u)=\exp\left(iu m -\frac{1}{2}\sigma^2T u^2\right).
$$

これを Carr-Madan 公式に代入すれば、数値積分でコール価格が求まります。

---

## 5. 数値実装例


```python
# scripts/carr_madan_call_pricing.py から抜粋

def carr_madan_call_price(params, strike, alpha=1.5, v_max=200.0, n_steps=20_000):
    if n_steps % 2 == 1:
        n_steps += 1

    log_strike = math.log(strike)

    def psi(v):
        shifted_u = v - 1j * (alpha + 1.0)
        phi = bs_characteristic_log_price(shifted_u, params)
        denom = (alpha + 1j * v) * (alpha + 1.0 + 1j * v)
        return math.exp(-params.r * params.maturity) * phi / denom

    step = v_max / n_steps
    weighted_sum = 0.0
    for j in range(n_steps + 1):
        v = j * step
        integrand = (cmath.exp(-1j * v * log_strike) * psi(v)).real
        weight = 1.0 if j == 0 or j == n_steps else (4.0 if j % 2 == 1 else 2.0)
        weighted_sum += weight * integrand

    integral = step * weighted_sum / 3.0
    return math.exp(-alpha * log_strike) * integral / math.pi
```


上記実行時の出力（デフォルトパラメータ）:

```text
Parameters: S0=100.0, r=0.03, q=0.0, sigma=0.2, T=1.0, alpha=1.5, v_max=200.0, n_steps=20000
Strike | Carr-Madan | Black-Scholes | Abs Error
-------+------------+---------------+----------
 80.00 |  23.223991 |     23.223991 |  1.066e-13
 90.00 |  15.429227 |     15.429227 |  7.816e-14
100.00 |   9.413403 |      9.413403 |  5.329e-14
110.00 |   5.293398 |      5.293398 |  1.688e-14
120.00 |   2.766558 |      2.766558 |  4.441e-15
```

Black-Scholes の閉形式と高精度で一致しています。

---

## 6. FFT 化する場合の離散化（要点）

Carr-Madan の高速化は、上の積分を離散化した後に DFT/FFT へ落とす点です。代表的には

$$
v_j = j\eta,\quad
\lambda=\frac{2\pi}{N\eta},\quad
k_m=-b+m\lambda,\quad
b=\frac{N\lambda}{2}
$$

を使い、$e^{-iv_jk_m}$ を DFT の核に一致させます。これで **多数ストライクを同時に** $O(N\log N)$ で計算できます。

1ストライクだけなら本稿のような直接積分でも十分です。ストライクを大量に打つ場合に FFT の効果が大きくなります。

---

## 7. まとめ

- Carr-Madan 公式の本質は、`価格そのもの`ではなく`減衰させた価格`を Fourier 変換する点にある
- 導出は、(i) payoff の積分表示、(ii) Fubini、(iii) 特性関数への置換、で完結する
- 実装では `alpha`, `v_max`, `n_steps` が精度と安定性を左右する

次段階としては、同じ実装フレームに Heston などの特性関数を差し替えるだけで、閉形式がないモデルにも展開できます。
