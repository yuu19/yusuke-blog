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
