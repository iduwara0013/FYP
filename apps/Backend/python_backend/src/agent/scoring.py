"""Deterministic scoring, competition, revenue and demand-gap calculations.

These functions are the source of truth for numbers. The LLM may explain the
results but MUST NOT invent or modify them. All weights come from config.
"""
from __future__ import annotations

from dataclasses import dataclass

from src.core.config import ScoringWeights


def demand_gap(expected_demand: float, expected_supply: float) -> float:
    """positive => unmet demand; negative => potential oversupply."""
    return expected_demand - expected_supply


@dataclass(frozen=True)
class CompetitionResult:
    level: str  # "Low" | "Medium" | "High"
    score: float  # 0..100 (higher = more favourable / less competition-adjusted)
    reason: str


def calculate_competition(
    farmer_count: int,
    planned_area_ha: float,
    expected_supply: float,
    expected_demand: float,
) -> CompetitionResult:
    """Compute a competition level and a normalized competition score.

    Competition rises with the number of farmers already growing the crop and
    falls as the demand gap widens. No arbitrary fixed constants are used for
    the level thresholds beyond documented cut-offs.
    """
    gap = demand_gap(expected_demand, expected_supply)

    # Competition score: start neutral (50), reduce as farmer count grows,
    # increase (more favourable) when demand exceeds supply.
    score = 50.0
    score -= min(40.0, farmer_count * 4.0)
    if expected_demand > 0:
        score += min(30.0, (gap / expected_demand) * 30.0)
    score = max(0.0, min(100.0, round(score, 1)))

    if farmer_count >= 30 or (expected_demand > 0 and gap / expected_demand < 0.1):
        level = "High"
        reason = "Many farmers already grow this crop and demand is nearly met."
    elif farmer_count >= 10 or (expected_demand > 0 and gap / expected_demand < 0.3):
        level = "Medium"
        reason = "Moderate number of growers; limited remaining demand gap."
    else:
        level = "Low"
        reason = "Few farmers grow this crop and unmet demand remains."
    return CompetitionResult(level=level, score=score, reason=reason)


@dataclass(frozen=True)
class RevenueResult:
    expected_production_kg: float
    expected_gross_revenue: float
    currency: str
    label: str  # "Expected Gross Revenue" (no cost data -> not called profit)


def calculate_expected_revenue(
    yield_per_hectare: float,
    area_hectares: float,
    market_price_per_kg: float,
    production_cost_per_kg: float | None = None,
    currency: str = "Rs",
) -> RevenueResult:
    expected_production_kg = yield_per_hectare * area_hectares * 1000.0
    gross_revenue = expected_production_kg * market_price_per_kg
    if production_cost_per_kg is not None and production_cost_per_kg > 0:
        net = gross_revenue - (expected_production_kg * production_cost_per_kg)
        label = "Expected Profit"
        return RevenueResult(
            expected_production_kg=round(expected_production_kg, 2),
            expected_gross_revenue=round(max(net, 0.0), 2),
            currency=currency,
            label=label,
        )
    return RevenueResult(
        expected_production_kg=round(expected_production_kg, 2),
        expected_gross_revenue=round(gross_revenue, 2),
        currency=currency,
        label="Expected Gross Revenue",
    )


@dataclass(frozen=True)
class FactorScores:
    yield_score: float
    price_score: float
    demand_score: float
    supply_gap_score: float
    competition_score: float
    weather_score: float
    revenue_score: float
    risk_score: float


def calculate_crop_score(
    factors: FactorScores,
    weights: ScoringWeights | None = None,
) -> float:
    """Weighted, normalized final score in 0..100. LLM must not touch this."""
    w = weights or ScoringWeights()
    raw = (
        factors.yield_score * w.YIELD_WEIGHT
        + factors.price_score * w.PRICE_WEIGHT
        + factors.demand_score * w.DEMAND_WEIGHT
        + factors.supply_gap_score * w.SUPPLY_GAP_WEIGHT
        + factors.competition_score * w.COMPETITION_WEIGHT
        + factors.weather_score * w.WEATHER_WEIGHT
        + factors.revenue_score * w.REVENUE_WEIGHT
        - factors.risk_score * w.RISK_WEIGHT
    )
    return max(0.0, min(100.0, round(raw, 1)))
