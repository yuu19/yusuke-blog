#!/usr/bin/env python3
"""Carr-Madan call pricing demo (no external dependencies)."""

from __future__ import annotations

import argparse
import cmath
import math
from dataclasses import dataclass


@dataclass(frozen=True)
class MarketParams:
    s0: float
    r: float
    q: float
    sigma: float
    maturity: float



def norm_cdf(x: float) -> float:
    return 0.5 * (1.0 + math.erf(x / math.sqrt(2.0)))



def black_scholes_call_price(params: MarketParams, strike: float) -> float:
    if params.maturity <= 0.0:
        return max(params.s0 - strike, 0.0)

    vol_sqrt_t = params.sigma * math.sqrt(params.maturity)
    d1 = (
        math.log(params.s0 / strike)
        + (params.r - params.q + 0.5 * params.sigma * params.sigma) * params.maturity
    ) / vol_sqrt_t
    d2 = d1 - vol_sqrt_t

    return (
        params.s0 * math.exp(-params.q * params.maturity) * norm_cdf(d1)
        - strike * math.exp(-params.r * params.maturity) * norm_cdf(d2)
    )



def bs_characteristic_log_price(u: complex, params: MarketParams) -> complex:
    mean_log_s = math.log(params.s0) + (
        params.r - params.q - 0.5 * params.sigma * params.sigma
    ) * params.maturity
    variance = params.sigma * params.sigma * params.maturity
    return cmath.exp(1j * u * mean_log_s - 0.5 * variance * (u * u))



def carr_madan_call_price(
    params: MarketParams,
    strike: float,
    alpha: float = 1.5,
    v_max: float = 200.0,
    n_steps: int = 20_000,
) -> float:
    if alpha <= 0.0:
        raise ValueError("alpha must be > 0.")
    if n_steps <= 0:
        raise ValueError("n_steps must be positive.")
    if n_steps % 2 == 1:
        n_steps += 1

    log_strike = math.log(strike)

    def psi(v: float) -> complex:
        shifted_u = v - 1j * (alpha + 1.0)
        phi = bs_characteristic_log_price(shifted_u, params)
        denom = (alpha + 1j * v) * (alpha + 1.0 + 1j * v)
        return math.exp(-params.r * params.maturity) * phi / denom

    step = v_max / n_steps
    weighted_sum = 0.0

    for j in range(n_steps + 1):
        v = j * step
        integrand = (cmath.exp(-1j * v * log_strike) * psi(v)).real

        if j == 0 or j == n_steps:
            weight = 1.0
        elif j % 2 == 1:
            weight = 4.0
        else:
            weight = 2.0

        weighted_sum += weight * integrand

    integral = step * weighted_sum / 3.0
    return math.exp(-alpha * log_strike) * integral / math.pi



def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Carr-Madan call pricing demo under Black-Scholes model."
    )
    parser.add_argument("--s0", type=float, default=100.0)
    parser.add_argument("--r", type=float, default=0.03)
    parser.add_argument("--q", type=float, default=0.0)
    parser.add_argument("--sigma", type=float, default=0.2)
    parser.add_argument("--T", type=float, default=1.0)
    parser.add_argument("--alpha", type=float, default=1.5)
    parser.add_argument("--v-max", type=float, default=200.0)
    parser.add_argument("--n-steps", type=int, default=20_000)
    parser.add_argument(
        "--strikes",
        type=str,
        default="80,90,100,110,120",
        help="Comma-separated strike list.",
    )
    return parser.parse_args()



def main() -> None:
    args = parse_args()
    strikes = [float(v.strip()) for v in args.strikes.split(",") if v.strip()]

    params = MarketParams(
        s0=args.s0,
        r=args.r,
        q=args.q,
        sigma=args.sigma,
        maturity=args.T,
    )

    print(
        "Parameters: "
        f"S0={params.s0}, r={params.r}, q={params.q}, "
        f"sigma={params.sigma}, T={params.maturity}, "
        f"alpha={args.alpha}, v_max={args.v_max}, n_steps={args.n_steps}"
    )
    print("Strike | Carr-Madan | Black-Scholes | Abs Error")
    print("-------+------------+---------------+----------")

    for strike in strikes:
        cm_price = carr_madan_call_price(
            params=params,
            strike=strike,
            alpha=args.alpha,
            v_max=args.v_max,
            n_steps=args.n_steps,
        )
        bs_price = black_scholes_call_price(params=params, strike=strike)
        abs_error = abs(cm_price - bs_price)

        print(
            f"{strike:6.2f} | {cm_price:10.6f} | {bs_price:13.6f} | {abs_error:10.3e}"
        )


if __name__ == "__main__":
    main()
