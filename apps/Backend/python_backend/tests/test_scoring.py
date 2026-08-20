"""Unit tests for deterministic scoring, competition, revenue and demand gap."""
import pytest

from src.agent.scoring import (
    FactorScores,
    calculate_competition,
    calculate_crop_score,
    calculate_expected_revenue,
    demand_gap,
)


def test_demand_gap_positive_and_negative():
    assert demand_gap(50, 30) == 20
    assert demand_gap(50, 60) == -10


def test_competition_levels():
    low = calculate_competition(2, 1.0, 10.0, 50.0)
    assert low.level == "Low"
    high = calculate_competition(40, 20.0, 50.0, 50.0)
    assert high.level == "High"
    medium = calculate_competition(15, 8.0, 40.0, 50.0)
    assert medium.level == "Medium"


def test_competition_score_within_bounds():
    for i in range(0, 60):
        res = calculate_competition(i, 1.0, 20.0, 50.0)
        assert 0.0 <= res.score <= 100.0


def test_revenue_without_cost_is_gross_revenue():
    res = calculate_expected_revenue(12.0, 2.0, 180.0)
    assert res.label == "Expected Gross Revenue"
    assert res.expected_production_kg == pytest.approx(12.0 * 2.0 * 1000.0)
    assert res.expected_gross_revenue == pytest.approx(
        12.0 * 2.0 * 1000.0 * 180.0
    )


def test_revenue_with_cost_is_profit():
    res = calculate_expected_revenue(12.0, 1.0, 180.0, production_cost_per_kg=80.0)
    assert res.label == "Expected Profit"


def test_crop_score_normalized_to_100():
    factors = FactorScores(
        yield_score=80,
        price_score=80,
        demand_score=90,
        supply_gap_score=85,
        competition_score=75,
        weather_score=84,
        revenue_score=70,
        risk_score=10,
    )
    score = calculate_crop_score(factors)
    assert 0.0 <= score <= 100.0

    perfect = FactorScores(100, 100, 100, 100, 100, 100, 100, 0)
    # Positive weights sum to 0.95 and risk (weight 0.05) is subtracted, so the
    # theoretical ceiling with zero risk is 95 (still normalised within 0-100).
    assert calculate_crop_score(perfect) == pytest.approx(95.0)
