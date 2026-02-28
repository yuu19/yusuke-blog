---
title: 'Stable Fourier-Cosine Series Expansions 論文解説'
description: 'Wang (2017) による Stable COS 法を、通常 COS 法との違い・導出・誤差解析を中心に解説する'
emoji: '📘'
date: 2026-02-27
topics: ["finance", "option-pricing", "fourier"]
blog_published: True
published: False
---

## はじめに

この記事は、次の論文を理論中心で解説するものです。

- Chunfa Wang, *Pricing European Options by Stable Fourier-Cosine Series Expansions* (2017)  
  https://arxiv.org/abs/1701.00886

論文の主張を一言でいうと、

- 従来の COS 法は **コールのような非有界 payoff** で数値的に不安定化しやすい
- その不安定性を、**密度側に指数重みを掛ける再展開**で抑えられる

という点です。

---

## 1. 問題設定

満期 $T$、割引率 $r$、ストライク $K$。論文に合わせて

$$
Y_t := \log\frac{S_t}{K},\qquad x := Y_0
$$

とおき、European payoff を $g(Y_T)$ と書きます。価格は

$$
v(0,x)=e^{-rT}\mathbb{E}[g(Y_T)\mid Y_0=x]
= e^{-rT}\int_{\mathbb{R}} g(y) f_T(y\mid x)\,dy
$$

です。ここで $f_T(y\mid x)$ は条件付き密度です。

数値計算では区間 $[a,b]$ に切って

$$
v(0,x)\approx e^{-rT}\int_a^b g(y)f_T(y\mid x)\,dy
$$

とします。論文は Fang-Oosterlee の慣習に従い、累積量（cumulant）から $[a,b]$ を決める形を採用しています。

---

## 2. 通常の COS 法（復習）

通常 COS は、密度を

$$
f_T(y\mid x) \approx \frac{2}{b-a}\sum_{n=0}^{N-1}{}' A_n(x)\cos\big(u_n(y-a)\big),
\qquad u_n=\frac{n\pi}{b-a}
$$

で展開し、価格を

$$
v(0,x)\approx e^{-rT}\frac{b-a}{2}\sum_{n=0}^{N-1}{}' A_n(x)V_n
$$

と計算します（$V_n$ は payoff の cosine 係数）。

この方法は基本的に高速かつ高精度ですが、コールでは次の不安定要因があります。

- $g_{\text{call}}(y)=K(e^y-1)^+$ は $y\to\infty$ で指数増大
- 区間を広くすると、係数計算で大きい量どうしの差が増え、**桁落ち（cancellation error）** が強くなる

Fang-Oosterlee の実務上の回避は「put を COS で計算し put-call parity で call へ戻す」でした。

---

## 3. Stable COS の核心

### 3.1 アイデア

論文の中心は、密度を直接展開する代わりに

$$
\widetilde f_T(y\mid x):=e^{\alpha y}f_T(y\mid x)
$$

を cosine 展開することです（$\alpha\in\mathbb{R}$）。

$$
\widetilde f_T(y\mid x)
=\sum_{n=0}^{\infty}{}'\widetilde A_n(x)\cos\big(u_n(y-a)\big).
$$

元の積分に戻すと

$$
f_T(y\mid x)=e^{-\alpha y}\widetilde f_T(y\mid x)
$$

なので

$$
v(0,x)
\approx e^{-rT}\int_a^b e^{-\alpha y}g(y)
\sum_{n=0}^{\infty}{}'\widetilde A_n(x)\cos\big(u_n(y-a)\big)\,dy.
$$

和と積分を交換して

$$
v(0,x)
\approx e^{-rT}\frac{b-a}{2}\sum_{n=0}^{\infty}{}'\widetilde A_n(x)\widetilde V_n,
$$

$$
\widetilde V_n:=\frac{2}{b-a}\int_a^b e^{-\alpha y}g(y)\cos\big(u_n(y-a)\big)dy.
$$

ここで重要なのは、payoff 側が $e^{-\alpha y}$ で抑えられる点です。特にコールなら

$$
e^{-\alpha y}(e^y-1)^+\sim e^{-(\alpha-1)y}
$$

なので $\alpha>1$ で増大が抑制されます。

### 3.2 特性関数による係数化

Stable COS でも、係数は特性関数から評価できます。論文の形では

$$
\widetilde A_n(x)
\approx \frac{2}{b-a}\Re\left(e^{-iu_n a}\,\widetilde\phi_T(u_n-i\alpha\mid x)\right),
$$

ここで $\widetilde\phi_T$ は $Y_T$ の条件付き特性関数。

さらに $Y_T=x+X_T$（$X_T$ の特性関数を $\phi_T$）とすれば

$$
\widetilde A_n(x)
\approx \frac{2e^{\alpha x}}{b-a}
\Re\left(e^{iu_n(x-a)}\phi_T(u_n-i\alpha)\right).
$$

したがって最終的な数値式は

$$
v(0,x)
\approx e^{-rT}\frac{b-a}{2}\sum_{n=0}^{N-1}{}'\widetilde A_n(x)\widetilde V_n.
$$

構造は通常 COS とほぼ同じで、変わるのは

- 密度係数: $A_n \to \widetilde A_n$（引数が $u_n-i\alpha$ にシフト）
- payoff 係数: $V_n \to \widetilde V_n$（$e^{-\alpha y}$ 重み付き）

の 2 点だけです。

---

## 4. 誤差解析の論文上のポイント

論文は COS 型の誤差を 3 つに分けます。

1. 積分区間切断誤差 $\varepsilon_1$  
2. cosine 級数打切り誤差 $\varepsilon_2$  
3. 係数を特性関数で近似することに伴う誤差 $\varepsilon_3$

通常の COS でもこの分解自体は同様ですが、本論文は **call payoff と区間幅の相互作用** を強調します。

### 4.1 主要な不等式

論文では

$$
I_1:=\int_{\mathbb{R}\setminus[a,b]} g(y)f_T(y\mid x)dy,
\qquad
I_2:=\int_{\mathbb{R}\setminus[a,b]} e^{\alpha y}f_T(y\mid x)dy
$$

を導入し、

- $\varepsilon_1$ は $I_1$ に支配
- $\varepsilon_3$ は $I_2$ に支配

と整理します。

コール $g(y)=K(e^y-1)^+$ では $\alpha>1$ のとき

$$
e^{-\alpha y}g(y)\le Q_2(\alpha)
$$

（有限定数）となるため

$$
I_1\le Q_2(\alpha)I_2
$$

が成立し、結果として $\varepsilon_1$ も $\varepsilon_3$ と同じ型の tail 制御で扱いやすくなります。これが「安定化」の理論的中核です。

### 4.2 トレードオフ

ただし $\alpha$ は大きければよいわけではありません。

- 大きい $\alpha$: payoff 側の桁落ちは減る
- しかし $e^{\alpha y}$ 重みで $I_2$ が増え、tail 由来誤差が悪化しうる

特に fat tail（例: CGMY の重尾側）では、$\alpha$ を 1 に近い値に抑える必要がある、というのが論文の実験的結論です。

---

## 5. 係数の閉形式（vanilla）

論文は

$$
\chi(u,v;c,d):=\int_c^d e^{vy}\cos(u(y-a))dy
$$

を使って vanilla の $\widetilde V_n$ を閉形式化しています。

- Call: $g(y)=K(e^y-1)^+$
- Put:  $g(y)=K(1-e^y)^+$

どちらも $\chi$ の差の形に落ちるため、実装は積分数値化なしで進められます。

Stable COS は

- 密度係数は特性関数評価
- payoff 係数は解析式

という COS の長所を保持したまま、call の不安定性だけを抑える設計です。

---

## 6. 論文の位置づけ（理論面）

この論文を理論的に見ると、貢献は「新しい transform を作った」よりも、

- COS の誤差分解に対して
- call payoff の非有界性を直接取り込んだ上で
- damping による有界化で制御パスを作った

点にあります。

言い換えると、通常 COS は「密度展開の精度」は高いが「payoff の増大」に弱い。Stable COS は、**展開対象を $f$ から $e^{\alpha y}f$ へ移すだけで、payoff 側の悪条件を吸収**しています。

---

## 7. 実務上の読み替え

理論を実装に落とすと、パラメータは次の 3 つです。

- $L$（区間幅）: 小さすぎると切断誤差、大きすぎると call の cancellation が悪化
- $N$（項数）: 級数打切り誤差を制御
- $\alpha$（damping）: cancellation 抑制と tail 重み増幅のバランサ

Stable COS の利点は、put-call parity へ迂回せず **call を直接・安定に** 計算できることです。

---

## 8. 関連手法との関係

### Carr-Madan 法との違い

Carr-Madan は「ストライク方向の価格関数」を damping して Fourier 反転する方法です。Stable COS は「状態変数方向の密度展開」を damping する方法です。

- Carr-Madan: 価格関数側の可積分化
- Stable COS: payoff 側の指数増大を密度再重みで抑える

どちらも damping を使いますが、作用させる対象が違います。

### Fang-Oosterlee COS との違い

- 共通: COS 展開 + 特性関数評価 + 解析的 payoff 係数
- 差分: $f$ ではなく $e^{\alpha y}f$ を展開、payoff 係数を $e^{-\alpha y}$ 重み付きに置換

---

## 9. まとめ

- Stable COS は、通常 COS の call 不安定性（非有界 payoff による桁落ち）を、密度の指数重み付き展開で抑える方法
- 価格公式の構造は通常 COS とほぼ同じで、導入コストが低い
- 理論上のポイントは誤差分解にあり、$\alpha>1$ で call payoff の実効有界化が効く
- ただし heavy tail では $\alpha$ を過大にすると逆効果になり得るため、$\alpha, L, N$ の同時設計が必要

---

## 参考文献

1. Chunfa Wang (2017), *Pricing European Options by Stable Fourier-Cosine Series Expansions*  
   https://arxiv.org/abs/1701.00886
2. Fang Fang and Cornelis W. Oosterlee (2008), *A Novel Pricing Method for European Options Based on Fourier-Cosine Series Expansions*  
   https://mpra.ub.uni-muenchen.de/7700/
