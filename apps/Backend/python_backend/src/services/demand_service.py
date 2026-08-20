"""Demand model derived from the historical Sri Lankan vegetable dataset.

The training/historical CSV (`sri_lanka_vegetable_dataset.csv`, ~20k rows for
2016-2024) does not contain a "demand" column, so we derive an evidence-based
demand baseline per (crop, season) from historical realized production
(tonnes) — the quantity the market actually absorbed. This is a real,
data-driven estimate rather than a hardcoded constant.

If historical data is unavailable for a crop, we fall back to a clearly-marked
ESTIMATED default.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[2]
CSV_PATH = BASE_DIR / "sri_lanka_vegetable_dataset.csv"

_cache: dict[str, Any] = {"baseline": None, "loaded": False}


def _load_baseline() -> dict[tuple[str, str], float] | None:
    """Median historical production (tonnes) per (crop, season)."""
    if _cache["loaded"]:
        return _cache["baseline"]
    _cache["loaded"] = True
    if not CSV_PATH.exists():
        return None
    try:
        df = pd.read_csv(CSV_PATH)
        if "production_kg" not in df.columns or "crop" not in df.columns:
            return None
        df["production_tonnes"] = df["production_kg"] / 1000.0
        group = df.groupby(["crop", "season"])["production_tonnes"].median()
        baseline: dict[tuple[str, str], float] = {}
        for (crop, season), value in group.items():
            baseline[(str(crop).strip().lower(), str(season).strip().lower())] = float(value)
        _cache["baseline"] = baseline
        return baseline
    except Exception:  # noqa: BLE001 - never block the agent
        _cache["baseline"] = None
        return None


def _catalog_fallback(crop: str, season: str) -> dict[str, Any]:
    try:
        from src.agent.tools import CROP_CATALOG
        base = float(CROP_CATALOG.get(crop, {}).get("estimatedDemandTonnes", 20.0))
    except Exception:  # noqa: BLE001
        base = 20.0
    factor = 1.1 if str(season).strip().lower() == "maha" else 0.95
    return {
        "crop": crop,
        "season": season,
        "expectedDemandTonnes": round(base * factor, 1),
        "source": "catalog-estimate",
        "url": "",
        "isEstimated": True,
        "status": "ESTIMATED",
    }


def estimate_demand(crop: str, season: str = "Yala") -> dict[str, Any]:
    """Real, data-driven expected demand (tonnes) for a crop+season.

    Fallback chain:
      1. Local historical dataset baseline        (REAL)
      2. FAOSTAT country production cross-check   (REAL)
      3. Catalog estimate                         (ESTIMATED)
    """
    baseline = _load_baseline()
    key = (str(crop).strip().lower(), str(season).strip().lower())
    if baseline is not None and key in baseline:
        return {
            "crop": crop,
            "season": season,
            "expectedDemandTonnes": round(baseline[key], 1),
            "source": "historical-production (sri_lanka_vegetable_dataset)",
            "url": "apps/Backend/python_backend/sri_lanka_vegetable_dataset.csv",
            "isEstimated": False,
            "status": "REAL",
        }

    # Secondary REAL source: FAOSTAT country production cross-check.
    from src.services.data_providers import faostat_provider

    try:
        fao = faostat_provider.production_tons(crop)
    except Exception:  # noqa: BLE001
        fao = None
    if fao is not None and fao > 0:
        return {
            "crop": crop,
            "season": season,
            "expectedDemandTonnes": round(fao, 1),
            "source": "FAOSTAT",
            "url": faostat_provider.source_url(),
            "isEstimated": False,
            "status": "REAL",
        }

    return _catalog_fallback(crop, season)
