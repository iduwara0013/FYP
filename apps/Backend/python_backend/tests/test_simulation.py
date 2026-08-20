"""Unit tests for the what-if simulation."""
import pytest

from src.agent.simulation import CropSnapshot, run_what_if


def test_what_if_reduces_gap():
    snap = CropSnapshot(
        crop_id="pumpkin",
        crop_name="Pumpkin",
        expected_demand=50.0,
        expected_supply=30.0,
        farmer_count=2,
        predicted_yield=12.0,
        market_price=180.0,
        weather_suitability=80.0,
        risk_score=10.0,
    )
    sim = run_what_if(snap, cultivated_area=2.0)

    assert sim.before_supply == 30.0
    assert sim.after_supply == pytest.approx(30.0 + 12.0 * 2.0)
    assert sim.before_gap == 20.0
    assert sim.after_gap < sim.before_gap
    assert sim.own_production_tonnes == pytest.approx(24.0)
    assert sim.revenue.expected_gross_revenue > 0


def test_what_if_supply_exceeds_demand():
    snap = CropSnapshot(
        crop_id="pumpkin",
        crop_name="Pumpkin",
        expected_demand=30.0,
        expected_supply=60.0,
        farmer_count=30,
        predicted_yield=12.0,
        market_price=180.0,
        weather_suitability=80.0,
        risk_score=30.0,
    )
    sim = run_what_if(snap, cultivated_area=2.0)
    assert sim.after_gap < sim.before_gap

