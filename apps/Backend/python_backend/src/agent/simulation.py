"""What-if simulation.

Simulates the farmer's own crop choice against current demand/supply and
re-runs deterministic scoring so 'before' and 'after' are comparable.
"""
from __future__ import annotations

from dataclasses import dataclass

from src.agent import scoring
from src.agent.scoring import (
    CompetitionResult,
    FactorScores,
    RevenueResult,
    calculate_crop_score,
)
from src.core.config import settings


@dataclass
class CropSnapshot:
    crop_id: str
    crop_name: str
    expected_demand: float
    expected_supply: float
    farmer_count: int
    predicted_yield: float
    market_price: float
    weather_suitability: float
    risk_score: float

    @property
    def gap(self) -> float:
        return scoring.demand_gap(self.expected_demand, self.expected_supply)

    def score(self) -> float:
        comp = self._competition()
        factors = self._factors(comp.score)
        return calculate_crop_score(factors, settings.weights)

    def _competition(self) -> CompetitionResult:
        return scoring.calculate_competition(
            self.farmer_count,
            0.0,
            self.expected_supply,
            self.expected_demand,
        )

    def _factors(self, competition_score: float) -> FactorScores:
        demand = self.expected_demand or 1.0
        supply_gap_score = max(0, min(100, 50 + (self.gap / demand) * 50))
        return FactorScores(
            yield_score=min(100, self.predicted_yield / 20 * 100),
            price_score=min(100, self.market_price / 300 * 100),
            demand_score=min(100, self.expected_demand / 120 * 100),
            supply_gap_score=supply_gap_score,
            competition_score=competition_score,
            weather_score=self.weather_suitability,
            revenue_score=min(100, (self._production_value()) / 1000000 * 100),
            risk_score=self.risk_score,
        )

    def _production_value(self) -> float:
        prod_kg = self.predicted_yield * 1000.0
        return prod_kg * self.market_price


@dataclass
class SimulationResult:
    crop_id: str
    crop_name: str
    own_production_tonnes: float
    before_supply: float
    after_supply: float
    before_gap: float
    after_gap: float
    before_score: float
    after_score: float
    before_competition: str
    after_competition: str
    revenue: RevenueResult
    message: str


def run_what_if(snapshot: CropSnapshot, cultivated_area: float) -> SimulationResult:
    """Simulate adding the farmer's own production to the planned supply."""
    own_production = snapshot.predicted_yield * cultivated_area
    before_supply = snapshot.expected_supply
    after_supply = before_supply + own_production

    before = snapshot

    before_score = before.score()

    # After: farmer count +1, supply grows by the farmer's production.
    after = CropSnapshot(
        crop_id=snapshot.crop_id,
        crop_name=snapshot.crop_name,
        expected_demand=snapshot.expected_demand,
        expected_supply=after_supply,
        farmer_count=snapshot.farmer_count + 1,
        predicted_yield=snapshot.predicted_yield,
        market_price=snapshot.market_price,
        weather_suitability=snapshot.weather_suitability,
        risk_score=snapshot.risk_score,
    )
    after_score = after.score()

    before_gap = before.gap
    after_gap = after.gap
    before_comp = before._competition().level
    after_comp = after._competition().level

    revenue = scoring.calculate_expected_revenue(
        snapshot.predicted_yield,
        cultivated_area,
        snapshot.market_price,
    )

    if own_production > 0 and after_gap < before_gap:
        message = (
            f"Your planned production of {own_production:.1f} t would reduce the "
            f"estimated demand gap from {before_gap:+.1f} t to {after_gap:+.1f} t. "
            "Estimated gross revenue: %s %.1f."
        ) % (revenue.currency, revenue.expected_gross_revenue)
    else:
        message = (
            "Your planned production would not reduce the demand gap further; "
            "oversupply risk may increase."
        )

    return SimulationResult(
        crop_id=snapshot.crop_id,
        crop_name=snapshot.crop_name,
        own_production_tonnes=round(own_production, 2),
        before_supply=round(before_supply, 1),
        after_supply=round(after_supply, 1),
        before_gap=round(before_gap, 1),
        after_gap=round(after_gap, 1),
        before_score=before_score,
        after_score=after_score,
        before_competition=before_comp,
        after_competition=after_comp,
        revenue=revenue,
        message=message,
    )
