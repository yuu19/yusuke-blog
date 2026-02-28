---
title: 'Fourier-Cosine Series Expansions 法の理論解説'
description: 'Fang-Oosterlee (2008) のCOS法を、価格公式の導出・誤差解析・区間設計まで理論中心で解説する'
emoji: '🧮'
date: 2026-02-27
topics: ["finance", "option-pricing", "fourier"]
blog_published: True
published: False
---

## はじめに

この記事では、次の論文を理論面中心で解説します。

- Fang Fang, Cornelis W. Oosterlee,  
  **A Novel Pricing Method for European Options Based on Fourier-Cosine Series Expansions** (2008)  
  https://mpra.ub.uni-muenchen.de/8914/

この論文の本質は、

- 遷移密度を有限区間上の cosine 級数で展開し
- 係数を特性関数で直接計算し
- 欧州オプション価格を高速・高精度で評価する

という点にあります。現在「COS法」と呼ばれる方法の基礎論文です。

---

## 1. 問題設定

時刻 $t_0$ でのログ状態を $x$、満期を $T$、残存時間を $\Delta t=T-t_0$ とします。状態変数を $y$ とすると、リスク中立下の価格は

$$
v(x,t_0)=e^{-r\Delta t}\int_{\mathbb{R}} v(y,T)f(y\mid x)\,dy
$$

です。ここで $f(y\mid x)$ は遷移密度、$v(y,T)$ は満期ペイオフです。

COS 法では積分区間を $[a,b]$ に切って

$$
v(x,t_0)\approx e^{-r\Delta t}\int_a^b v(y,T)f(y\mid x)\,dy
$$

とします。

---

## 2. COS展開の導出

### 2.1 密度の cosine 展開

区間 $[a,b]$ で

$$
f(y\mid x)=\frac{A_0(x)}{2}+\sum_{k=1}^{\infty}A_k(x)\cos\left(k\pi\frac{y-a}{b-a}\right)
$$

$$
A_k(x)=\frac{2}{b-a}\int_a^b f(y\mid x)\cos\left(k\pi\frac{y-a}{b-a}\right)dy
$$

です。

この係数をそのまま積分してもよいですが、論文の肝は **特性関数で置き換える** 点です。特性関数

$$
\phi(\omega;x)=\int_{\mathbb{R}}e^{i\omega y}f(y\mid x)dy
$$

を使うと、

$$
A_k(x)\approx F_k(x):=\frac{2}{b-a}\Re\left(\phi\left(\frac{k\pi}{b-a};x\right)e^{-ik\pi a/(b-a)}\right)
$$

が得られます。

### 2.2 価格公式

ペイオフ側の係数

$$
V_k=\frac{2}{b-a}\int_a^b v(y,T)\cos\left(k\pi\frac{y-a}{b-a}\right)dy
$$

を定義すると、価格は

$$
\boxed{
v(x,t_0)\approx e^{-r\Delta t}
\sum_{k=0}^{N-1}{}'\Re\left(\phi\left(\frac{k\pi}{b-a};x\right)e^{-ik\pi a/(b-a)}\right)V_k
}
$$

となります（$\sum'$: $k=0$ 項に 1/2 重み）。

この式は「密度の数値積分」を「特性関数の評価 + 解析係数」に変換しているため、高速化しやすい構造です。

---

## 3. Vanilla（Call/Put）での解析係数

$y=\log(S_T/K)$ とすると

- Call: $g(y)=K(e^y-1)^+$
- Put:  $g(y)=K(1-e^y)^+$

です。

論文は次を導入して解析式を作ります。

$$
\chi_k(c,d)=\int_c^d e^y\cos\left(k\pi\frac{y-a}{b-a}\right)dy,
\quad
\psi_k(c,d)=\int_c^d \cos\left(k\pi\frac{y-a}{b-a}\right)dy.
$$

これらは閉形式で書けます（分母に $1+u_k^2$、$u_k=k\pi/(b-a)$ が現れる形）。

その結果、代表式は

$$
V_k^{\text{call}}=\frac{2K}{b-a}\left(\chi_k(0,b)-\psi_k(0,b)\right),
$$

$$
V_k^{\text{put}}=\frac{2K}{b-a}\left(-\chi_k(a,0)+\psi_k(a,0)\right).
$$

よって COS 法では、vanilla のペイオフ積分を毎回数値積分する必要がありません。

---

## 4. Lévy過程での簡約

論文では

$$
Y_t = x + \zeta_t
$$

（$\zeta_t$ が Lévy 過程）として

$$
\phi(\omega;x)=e^{i\omega x}\varphi_{\text{levy}}(\omega)
$$

に分離します。これにより価格は

$$
v(x,t_0)\approx e^{-r\Delta t}\sum_{k=0}^{N-1}{}'
\Re\left(\varphi_{\text{levy}}\left(\frac{k\pi}{b-a}\right)e^{ik\pi(x-a)/(b-a)}\right)V_k
$$

となり、複数ストライク評価も効率的に計算できます。

---

## 5. 誤差分解と収束（理論上の要点）

論文は総誤差を

$$
\xi = \epsilon_1 + \epsilon_2 + \epsilon_3
$$

に分解します。

- $\epsilon_1$: 積分区間 $[a,b]$ への切断誤差
- $\epsilon_2$: cosine 級数打切り誤差（$N$ 項で止める誤差）
- $\epsilon_3$: 係数近似誤差（$A_k\to F_k$ 置換で出る tail 由来誤差）

### 5.1 級数打切り誤差のオーダー

論文の結果では、ペイオフが区分的に $\nu$ 回微分可能なら

$$
\epsilon_2 = O(N^{-\nu})
$$

です。さらに十分滑らか（解析的）なら指数収束が得られます。

### 5.2 総誤差の典型形

論文は設定に応じた上界を提示しています。代表的には

- 台が有限区間なら: 代数収束または指数収束（ペイオフ滑らかさ次第）
- 実線全体で指数 tail を持つ密度なら:

$$
\xi \lesssim c\,e^{-\mu L} + \frac{B}{N^{\nu}}
$$

（$[a,b]=[-L,L]$ のような対称切断）

つまり **区間幅 $L$ と項数 $N$ を同時に設計**する必要があります。

---

## 6. 切断区間 [a,b] の設計

論文で実務上推奨される設計は、ログ価格（あるいはログmoneyness）の累積量 $c_1,c_2,c_4$ を使うものです。

$$
[a,b]=\left[c_1 - L\sqrt{c_2+\sqrt{c_4}},\; c_1 + L\sqrt{c_2+\sqrt{c_4}}\right].
$$

- $L$ は通常 8〜12 付近から調整
- $L$ が小さすぎると tail 切断誤差増大
- $L$ が大きすぎると（特に call）係数計算で cancellation が強まりうる

このトレードオフが COS 法の実務チューニングの中心です。

---

## 7. 実装（Black-Scholesで検証）

論文式をそのまま実装したコードを以下に掲載します。

```python
#!/usr/bin/env python3
"""COS method for pricing European vanilla options (Fang & Oosterlee, 2008).

- No third-party dependencies.
- Demonstration is done under Black-Scholes (closed-form characteristic function).
- The core pricing routine is written to accept any characteristic function of y = ln(S_T/K).
"""

from __future__ import annotations

import argparse
import cmath
import math
from dataclasses import dataclass
from typing import Callable, Iterable


@dataclass(frozen=True)
class MarketParams:
    s0: float
    r: float
    q: float
    sigma: float
    maturity: float


@dataclass(frozen=True)
class COSConfig:
    n_terms: int = 256
    l_trunc: float = 10.0


def norm_cdf(x: float) -> float:
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))


def black_scholes_price(params: MarketParams, strike: float, is_call: bool) -> float:
    if params.maturity <= 0.0:
        intrinsic = max(params.s0 - strike, 0.0)
        return intrinsic if is_call else intrinsic - params.s0 + strike

    vol_sqrt_t = params.sigma * math.sqrt(params.maturity)
    d1 = (
        math.log(params.s0 / strike)
        + (params.r - params.q + 0.5 * params.sigma * params.sigma) * params.maturity
    ) / vol_sqrt_t
    d2 = d1 - vol_sqrt_t

    discounted_s = params.s0 * math.exp(-params.q * params.maturity)
    discounted_k = strike * math.exp(-params.r * params.maturity)

    if is_call:
        return discounted_s * norm_cdf(d1) - discounted_k * norm_cdf(d2)
    return discounted_k * norm_cdf(-d2) - discounted_s * norm_cdf(-d1)


def bs_cf_log_moneyness(
    u: complex,
    params: MarketParams,
    strike: float,
) -> complex:
    """Characteristic function of y = ln(S_T / K) under Black-Scholes."""
    x = math.log(params.s0 / strike)
    mean = x + (params.r - params.q - 0.5 * params.sigma * params.sigma) * params.maturity
    variance = params.sigma * params.sigma * params.maturity
    return cmath.exp(1j * u * mean - 0.5 * variance * (u * u))


def truncation_interval(c1: float, c2: float, c4: float, l_trunc: float) -> tuple[float, float]:
    width = l_trunc * math.sqrt(max(c2 + math.sqrt(max(c4, 0.0)), 1e-16))
    return c1 - width, c1 + width


def chi_k(k: int, a: float, b: float, c: float, d: float) -> float:
    if d <= c:
        return 0.0
    u = k * math.pi / (b - a)
    exp_d = math.exp(d)
    exp_c = math.exp(c)
    cos_d = math.cos(u * (d - a))
    cos_c = math.cos(u * (c - a))
    sin_d = math.sin(u * (d - a))
    sin_c = math.sin(u * (c - a))
    return ((cos_d * exp_d - cos_c * exp_c) + u * (sin_d * exp_d - sin_c * exp_c)) / (1.0 + u * u)


def psi_k(k: int, a: float, b: float, c: float, d: float) -> float:
    if d <= c:
        return 0.0
    if k == 0:
        return d - c
    u = k * math.pi / (b - a)
    return (math.sin(u * (d - a)) - math.sin(u * (c - a))) / u


def vk_vanilla(k: int, a: float, b: float, strike: float, is_call: bool) -> float:
    """Payoff cosine coefficient V_k in Fang & Oosterlee (eq. 24, 25 generalized)."""
    if is_call:
        c = max(0.0, a)
        d = b
        if d <= c:
            return 0.0
        return (2.0 / (b - a)) * strike * (chi_k(k, a, b, c, d) - psi_k(k, a, b, c, d))

    c = a
    d = min(0.0, b)
    if d <= c:
        return 0.0
    return (2.0 / (b - a)) * strike * (psi_k(k, a, b, c, d) - chi_k(k, a, b, c, d))


def cos_price_from_cf(
    cf: Callable[[complex], complex],
    strike: float,
    r: float,
    maturity: float,
    a: float,
    b: float,
    n_terms: int,
    is_call: bool,
) -> float:
    """COS pricing formula (paper eq. 19 with analytic V_k)."""
    total = 0.0
    for k in range(n_terms):
        u = k * math.pi / (b - a)
        fk = (cf(u) * cmath.exp(-1j * u * a)).real
        vk = vk_vanilla(k=k, a=a, b=b, strike=strike, is_call=is_call)
        weight = 0.5 if k == 0 else 1.0
        total += weight * fk * vk
    return math.exp(-r * maturity) * total


def cos_price_black_scholes(
    params: MarketParams,
    strike: float,
    config: COSConfig,
    is_call: bool,
) -> float:
    x = math.log(params.s0 / strike)
    c1 = x + (params.r - params.q - 0.5 * params.sigma * params.sigma) * params.maturity
    c2 = params.sigma * params.sigma * params.maturity
    c4 = 0.0
    a, b = truncation_interval(c1=c1, c2=c2, c4=c4, l_trunc=config.l_trunc)

    return cos_price_from_cf(
        cf=lambda u: bs_cf_log_moneyness(u=u, params=params, strike=strike),
        strike=strike,
        r=params.r,
        maturity=params.maturity,
        a=a,
        b=b,
        n_terms=config.n_terms,
        is_call=is_call,
    )


def parse_strikes(raw: str) -> list[float]:
    values: list[float] = []
    for chunk in raw.split(","):
        chunk = chunk.strip()
        if chunk:
            values.append(float(chunk))
    if not values:
        raise ValueError("At least one strike must be provided.")
    return values


def format_option_type(is_call: bool) -> str:
    return "Call" if is_call else "Put"


def run_demo(params: MarketParams, config: COSConfig, strikes: Iterable[float], is_call: bool) -> None:
    print(
        "Parameters: "
        f"S0={params.s0}, r={params.r}, q={params.q}, sigma={params.sigma}, T={params.maturity}, "
        f"N={config.n_terms}, L={config.l_trunc}, type={format_option_type(is_call)}"
    )
    print("Strike | COS Price  | Black-Scholes | Abs Error")
    print("-------+------------+---------------+----------")

    for strike in strikes:
        cos_price = cos_price_black_scholes(
            params=params,
            strike=strike,
            config=config,
            is_call=is_call,
        )
        bs_price = black_scholes_price(params=params, strike=strike, is_call=is_call)
        abs_error = abs(cos_price - bs_price)
        print(f"{strike:6.2f} | {cos_price:10.6f} | {bs_price:13.6f} | {abs_error:10.3e}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="COS method demo for European vanilla options (Fang-Oosterlee, 2008)."
    )
    parser.add_argument("--s0", type=float, default=100.0)
    parser.add_argument("--r", type=float, default=0.03)
    parser.add_argument("--q", type=float, default=0.0)
    parser.add_argument("--sigma", type=float, default=0.2)
    parser.add_argument("--T", type=float, default=1.0)
    parser.add_argument("--n-terms", type=int, default=256)
    parser.add_argument("--L", type=float, default=10.0)
    parser.add_argument("--option-type", choices=["call", "put"], default="call")
    parser.add_argument("--strikes", type=str, default="80,90,100,110,120")
    args = parser.parse_args()

    if args.n_terms <= 1:
        raise ValueError("--n-terms must be >= 2.")

    params = MarketParams(
        s0=args.s0,
        r=args.r,
        q=args.q,
        sigma=args.sigma,
        maturity=args.T,
    )
    config = COSConfig(n_terms=args.n_terms, l_trunc=args.L)
    strikes = parse_strikes(args.strikes)

    run_demo(
        params=params,
        config=config,
        strikes=strikes,
        is_call=(args.option_type == "call"),
    )


if __name__ == "__main__":
    main()
```

実行例:

```bash
python3 scripts/cos_european_option_pricing.py --option-type call
python3 scripts/cos_european_option_pricing.py --option-type put
```

出力例（抜粋）:

```text
Parameters: S0=100.0, r=0.03, q=0.0, sigma=0.2, T=1.0, N=256, L=10.0, type=Call
Strike | COS Price  | Black-Scholes | Abs Error
 80.00 |  23.223991 |     23.223991 |  1.066e-14
100.00 |   9.413403 |      9.413403 |  8.882e-15
120.00 |   2.766558 |      2.766558 |  1.332e-15
```

```text
Parameters: S0=100.0, r=0.03, q=0.0, sigma=0.2, T=1.0, N=256, L=10.0, type=Put
Strike | COS Price  | Black-Scholes | Abs Error
 80.00 |   0.859634 |      0.859634 |  1.887e-15
100.00 |   6.457957 |      6.457957 |  1.776e-15
120.00 |  19.220022 |     19.220022 |  1.421e-14
```

Black-Scholes 閉形式と機械精度レベルで一致しています。

---

## 8. まとめ

- COS 法は「密度の cosine 展開 + 特性関数評価」による高効率な欧州価格法
- 理論上の核は誤差分解（$\epsilon_1,\epsilon_2,\epsilon_3$）と収束オーダー
- 実務上の核は区間幅 $L$ と項数 $N$ のトレードオフ
- vanilla では係数が解析式で書けるため、実装が非常に軽い

この論文は、その後の Stable COS や他の Fourier 系価格法を理解するための基礎文献です。

---

## 参考文献

1. Fang, F., Oosterlee, C. W. (2008), *A Novel Pricing Method for European Options Based on Fourier-Cosine Series Expansions*  
   https://mpra.ub.uni-muenchen.de/8914/
2. Wang, C. (2017), *Pricing European Options by Stable Fourier-Cosine Series Expansions*  
   https://arxiv.org/abs/1701.00886
