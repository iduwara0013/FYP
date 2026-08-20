"""Tests for the recommendation engine with data tools mocked (no network)."""
import pytest

import src.agent.recommendation_engine as engine


class FakeTool:
    def __init__(self, result):
        self._result = result

    def invoke(self, _kwargs):
        return self._result


@pytest.fixture(autouse=True)
def mock_tools(monkeypatch):
    monkeypatch.setattr(
        engine,
        "predict_crop_yield",
        FakeTool({"predictedYieldTPerHa": 12.0}),
    )
    monkeypatch.setattr(
        engine,
        "predict_crop_price",
        FakeTool({"marketPriceRsPerKg": 180.0}),
    )
    monkeypatch.setattr(
        engine,
        "get_market_prices",
        FakeTool({"Tomato": 200.0}),
    )
    monkeypatch.setattr(
        engine.demand_service,
        "estimate_demand",
        lambda crop, season: {
            "crop": crop,
            "season": season,
            "expectedDemandTonnes": 45.0,
            "source": "test-historical",
            "isEstimated": False,
            "status": "REAL",
        },
    )

    def raise_weather(_kwargs):
        raise RuntimeError("no network in tests")

    monkeypatch.setattr(engine, "get_weather", raise_weather)
    monkeypatch.setattr(
        engine.crop_plan_service,
        "get_planned_supply",
        lambda *a, **k: {
            "farmerCount": 0,
            "plannedAreaHa": 0.0,
            "expectedProductionTonnes": 0.0,
            "status": "REAL",
            "timestamp": "",
        },
    )


def test_candidate_crops_from_catalog():
    crops = engine.get_candidate_crops()
    assert "Tomato" in crops
    assert len(crops) > 0


def test_candidate_crops_prefers_preferred_first():
    crops = engine.get_candidate_crops(preferred=["Tomato", "Cabbage"])
    assert crops.index("Tomato") < crops.index("Cabbage")


def test_score_all_crops_returns_sorted(monkeypatch):
    result = engine.score_all_crops(
        region="Kandy",
        district="Kandy",
        land_area_ha=2.0,
        has_irrigation=True,
        season="Yala",
        year=2026,
    )
    scored = result["scored"]
    assert scored
    # sorted descending
    scores = [r["score"] for r in scored]
    assert scores == sorted(scores, reverse=True)
    # every score within 0..100
    assert all(0 <= r["score"] <= 100 for r in scored)
    assert all(r["competitionLevel"] in ("Low", "Medium", "High") for r in scored)
    assert all(r["riskLevel"] in ("Low", "Medium", "High") for r in scored)


def test_uses_harti_price_and_demand_model():
    result = engine.score_all_crops(
        region="Kandy",
        district="Kandy",
        land_area_ha=2.0,
        has_irrigation=True,
        season="Yala",
        year=2026,
    )
    tomato = next(r for r in result["scored"] if r["cropName"] == "Tomato")
    # HARTI live price (200) overrides the ML price (180) for Tomato
    assert tomato["marketPrice"] == 200.0
    # Demand comes from the (mocked, data-driven) demand model, not the catalog
    assert tomato["expectedDemand"] == 45.0
    assert tomato["dataStatus"] == "REAL"
    sources = {d["source"] for d in result["data_sources"]}
    assert "HARTI live" in sources
