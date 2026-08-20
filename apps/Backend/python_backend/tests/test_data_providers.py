"""Tests for the best-effort data providers and the FAOSTAT demand fallback."""
import json

import pytest

from src.services import data_providers
from src.services.data_providers import DambullaPriceProvider, FaostatProvider


def test_faostat_production_maps_crop(monkeypatch):
    payload = {
        "data": [
            {"item": "Tomatoes", "value": "500000", "unit": "tonnes"},
            {"item": "Carrots", "value": "120000", "unit": "tonnes"},
        ]
    }

    def fake_fetch(url, timeout=12):
        return json.dumps(payload)

    monkeypatch.setattr(data_providers, "fetch_text", fake_fetch)
    provider = FaostatProvider(enabled=True, years=[2023])
    assert provider.production_tons("Tomato") == 500000
    assert provider.production_tons("Cabbage") is None


def test_faostat_disabled_returns_none(monkeypatch):
    def fake_fetch(url, timeout=12):
        return json.dumps({"data": [{"item": "Tomatoes", "value": "1"}]})

    monkeypatch.setattr(data_providers, "fetch_text", fake_fetch)
    provider = FaostatProvider(enabled=False, years=[2023])
    assert provider.production_tons("Tomato") is None


def test_faostat_soft_fails_on_bad_resp(monkeypatch):
    def fake_fetch(url, timeout=12):
        raise OSError("no network")

    monkeypatch.setattr(data_providers, "fetch_text", fake_fetch)
    provider = FaostatProvider(enabled=True, years=[2023])
    assert provider.production_tons("Tomato") is None


def test_dambulla_parses_csv(monkeypatch):
    csv_text = "crop,price\nTomato,200\nCabbage,120\n"

    monkeypatch.setattr(data_providers, "fetch_text", lambda url, timeout=12: csv_text)
    provider = DambullaPriceProvider(csv_url="https://example.test/prices.csv")
    prices = provider.get_prices()
    assert prices["tomato"] == 200
    assert prices["cabbage"] == 120


def test_dambulla_empty_when_no_url():
    provider = DambullaPriceProvider(csv_url="")
    assert provider.get_prices() == {}


def test_demand_falls_back_to_faostat(monkeypatch):
    from src.services import demand_service
    from src.services.data_providers import faostat_provider

    # "Grape" is not in the local historical dataset -> should use FAOSTAT.
    monkeypatch.setattr(
        faostat_provider, "production_tons", lambda crop: 123.0
    )
    result = demand_service.estimate_demand("Grape", "Yala")
    assert result["status"] == "REAL"
    assert result["source"] == "FAOSTAT"
    assert result["expectedDemandTonnes"] == 123.0


def test_demand_prefers_local_dataset(monkeypatch):
    from src.services import demand_service
    from src.services.data_providers import faostat_provider

    monkeypatch.setattr(
        faostat_provider, "production_tons", lambda crop: 9999.0
    )
    # "Tomato"/"Yala" exists in the local historical CSV -> local wins.
    result = demand_service.estimate_demand("Tomato", "Yala")
    assert result["source"].startswith("historical-production")
    assert result["expectedDemandTonnes"] != 9999.0
