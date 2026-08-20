"""Crop plan persistence and supply aggregation.

Order of operations on confirmation:
1. Save the CropPlan to Firestore (source of truth for app state).
2. ONLY if that succeeds, synchronize the knowledge graph (Neo4j).
3. Recompute planned supply / competition for future recommendations.

If Firestore save fails, we never touch Neo4j. If Neo4j sync fails after a
successful Firestore write, we record the sync status so it can be retried
without losing the plan.
"""
from __future__ import annotations

import time
import uuid
from typing import Any

from src.core.logging import get_logger
from src.services import firebase_service
from src.services.neo4j_service import neo4j_sync

log = get_logger(__name__)

CROP_PLANS_COLLECTION = "cropPlans"


class CropPlanSaveError(RuntimeError):
    """Raised when the Firestore write (the authoritative step) fails."""


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def get_planned_supply(
    crop: str, season: str, year: int, location: str | None = None
) -> dict[str, Any]:
    """Aggregate planned supply for a crop/season/year from Firestore.

    Returns dict with farmerCount, plannedAreaHa and expectedProductionTonnes.
    Defaults to zero when Firestore is unavailable (no invented numbers).
    """
    empty = {
        "farmerCount": 0,
        "plannedAreaHa": 0.0,
        "expectedProductionTonnes": 0.0,
        "source": "firestore",
        "status": "UNAVAILABLE",
        "timestamp": _now_iso(),
    }
    try:
        plans = firebase_service.get_collection_documents(CROP_PLANS_COLLECTION)
    except Exception as error:  # noqa: BLE001
        log.warning("Could not read crop plans: %s", error)
        return empty

    matched = [
        plan
        for plan in plans
        if str(plan.get("cropId", "")).lower() == str(crop).lower()
        and plan.get("season") == season
        and int(plan.get("year") or 0) == int(year)
    ]
    if location:
        matched = [
            plan for plan in matched
            if str(plan.get("location", "")).lower() == str(location).lower()
        ]

    if not matched:
        return {
            "farmerCount": 0,
            "plannedAreaHa": 0.0,
            "expectedProductionTonnes": 0.0,
            "source": "firestore",
            "status": "REAL",
            "timestamp": _now_iso(),
        }

    farmer_ids = {str(plan.get("farmerId", "")) for plan in matched}
    return {
        "farmerCount": len(farmer_ids),
        "plannedAreaHa": round(sum(float(plan.get("cultivatedArea") or 0) for plan in matched), 2),
        "expectedProductionTonnes": round(
            sum(float(plan.get("predictedProduction") or 0) for plan in matched), 2
        ),
        "source": "firestore",
        "status": "REAL",
        "timestamp": _now_iso(),
    }


def save_crop_plan(
    *,
    farmer_id: str,
    crop_id: str,
    crop_name: str,
    season: str,
    year: int,
    cultivated_area: float,
    predicted_production: float,
    location: str,
    district: str,
    has_irrigation: bool,
    existing_plan_id: str | None = None,
) -> dict[str, Any]:
    """Firestore-first save, then Neo4j synchronization."""
    plan_id = existing_plan_id or f"CP-{uuid.uuid4().hex[:12].upper()}"
    plan_data: dict[str, Any] = {
        "id": plan_id,
        "farmerId": farmer_id,
        "cropId": crop_id,
        "cropName": crop_name,
        "season": season,
        "year": int(year),
        "cultivatedArea": float(cultivated_area),
        "predictedProduction": float(predicted_production),
        "location": location,
        "district": district,
        "hasIrrigation": bool(has_irrigation),
        "createdAt": _now_iso(),
        "status": "active",
        "syncStatus": "pending",
    }

    try:
        firebase_service.create_document(CROP_PLANS_COLLECTION, plan_id, plan_data)
    except Exception as error:  # noqa: BLE001
        log.error("Firestore crop plan save failed: %s", error)
        raise CropPlanSaveError(str(error)) from error

    # Firestore succeeded -> now sync Neo4j.
    sync_result = neo4j_sync.sync_crop_plan(
        plan_id=plan_id,
        farmer_id=farmer_id,
        crop_id=crop_id,
        season=season,
        year=year,
        cultivated_area=cultivated_area,
        predicted_production=predicted_production,
    )
    plan_data["syncStatus"] = "synced" if sync_result["synced"] else "failed"
    plan_data["syncMessage"] = sync_result["message"]

    return plan_data
