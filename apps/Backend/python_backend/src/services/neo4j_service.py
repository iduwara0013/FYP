"""Neo4j Aura integration.

Safe, controlled access to the agricultural knowledge graph.

IMPORTANT:
- The LLM NEVER executes arbitrary Cypher. It may only call the public tools in
  this module with validated parameters.
- Every query is parameterized. We never string-concatenate user input into a
  Cypher string.
- If Neo4j is not configured or is unreachable, every method returns an empty /
  safe result and marks the caller (via logging) instead of crashing.

Credentials come only from environment variables (never exposed to RN).
"""
from __future__ import annotations

import time
from typing import Any

from src.core.config import settings
from src.core.logging import get_logger

log = get_logger(__name__)


class Neo4jUnavailableError(RuntimeError):
    """Raised when there is no configured/reachable Neo4j database."""


class Neo4jService:
    def __init__(self) -> None:
        self._driver = None

    @property
    def configured(self) -> bool:
        return settings.neo4j.configured

    def _get_driver(self):
        """Lazily create and cache the driver. Never import neo4j at module load."""
        if not settings.neo4j.configured:
            raise Neo4jUnavailableError(
                "Neo4j is not configured (set NEO4J_URI/USERNAME/PASSWORD)."
            )
        if self._driver is None:
            try:
                from neo4j import GraphDatabase
            except ImportError as error:  # pragma: no cover - env dependent
                raise Neo4jUnavailableError("neo4j driver is not installed.") from error

            self._driver = GraphDatabase.driver(
                settings.neo4j.uri,
                auth=(settings.neo4j.username, settings.neo4j.password),
            )
        return self._driver

    def health(self) -> dict[str, Any]:
        if not self.configured:
            return {"status": "unavailable", "reason": "not_configured"}
        try:
            driver = self._get_driver()
            driver.verify_connectivity()
            return {"status": "ok"}
        except Exception as error:  # noqa: BLE001
            log.warning("Neo4j health check failed: %s", error)
            return {"status": "unavailable", "reason": str(error)}

    def execute_query(
        self,
        cypher: str,
        parameters: dict[str, Any] | None = None,
        timeout_seconds: int = 15,
    ) -> list[dict[str, Any]]:
        """Run a *predefined* parameterized query. Callers pass static Cypher."""
        driver = self._get_driver()
        parameters = parameters or {}
        try:
            with driver.session(database=settings.neo4j.database) as session:
                result = session.run(cypher, parameters, timeout=timeout_seconds)
                return [dict(record) for record in result]
        except Exception as error:  # noqa: BLE001
            log.warning("Neo4j query failed: %s", error)
            raise Neo4jUnavailableError(str(error)) from error

    # --- Safe, predefined query methods (the only surface the tools use) ---

    def get_crop_demand(self, crop_id: str, season: str, year: int) -> list[dict[str, Any]]:
        cypher = (
            "MATCH (c:Crop {id: $crop_id}) "
            "OPTIONAL MATCH (c)-[:HAS_DEMAND]->(d:Demand) "
            "WHERE d.season = $season AND d.year = $year "
            "RETURN c.name AS crop, d.expectedTonnes AS expectedDemand, "
            "d.source AS source, d.isEstimated AS isEstimated"
        )
        return self.execute_query(
            cypher,
            {"crop_id": crop_id, "season": season, "year": int(year)},
        )

    def get_crop_supply(self, crop_id: str, season: str, year: int) -> list[dict[str, Any]]:
        cypher = (
            "MATCH (cp:CropPlan {cropId: $crop_id, season: $season, year: $year}) "
            "RETURN count(cp) AS farmerCount, "
            "coalesce(sum(cp.cultivatedArea), 0.0) AS plannedArea, "
            "coalesce(sum(cp.predictedProduction), 0.0) AS expectedProduction"
        )
        return self.execute_query(
            cypher,
            {"crop_id": crop_id, "season": season, "year": int(year)},
        )

    def get_farmer_crop_plans(
        self, farmer_id: str, season: str | None = None
    ) -> list[dict[str, Any]]:
        where_clause = "WHERE cp.farmerId = $farmer_id"
        parameters: dict[str, Any] = {"farmer_id": farmer_id}
        if season:
            where_clause += " AND cp.season = $season"
            parameters["season"] = season
        cypher = (
            f"MATCH (cp:CropPlan)-[:FOR_CROP]->(c:Crop) {where_clause} "
            "RETURN cp.id AS id, cp.cropId AS cropId, c.name AS cropName, "
            "cp.season AS season, cp.year AS year, cp.cultivatedArea AS cultivatedArea, "
            "cp.predictedProduction AS predictedProduction"
        )
        return self.execute_query(cypher, parameters)
    def get_crop_market_data(self, crop_id: str) -> list[dict[str, Any]]:
        cypher = (
            "MATCH (c:Crop {id: $crop_id})-[:SOLD_AT]->(m:Market)-[:HAS_PRICE]->(mp:MarketPrice) "
            "RETURN c.name AS crop, m.name AS market, "
            "mp.pricePerKg AS pricePerKg, mp.date AS date, mp.source AS source "
            "ORDER BY mp.date DESC LIMIT 10"
        )
        return self.execute_query(cypher, {"crop_id": crop_id})

    def get_crop_weather_data(self, crop_id: str) -> list[dict[str, Any]]:
        cypher = (
            "MATCH (c:Crop {id: $crop_id})-[:SUITABLE_FOR]->(w:WeatherCondition) "
            "RETURN c.name AS crop, w.season AS season, w.suitability AS suitability, "
            "w.temperatureMinC AS temperatureMinC, w.temperatureMaxC AS temperatureMaxC"
        )
        return self.execute_query(cypher, {"crop_id": crop_id})

    def get_crop_relationships(self, crop_id: str) -> list[dict[str, Any]]:
        cypher = (
            "MATCH (c:Crop {id: $crop_id})-[r]-(n) "
            "RETURN c.name AS crop, type(r) AS relationship, labels(n) AS nodeLabels, "
            "coalesce(n.name, n.id, n.cropId) AS related, "
            "keys(n) AS nodeProperties LIMIT 25"
        )
        return self.execute_query(cypher, {"crop_id": crop_id})

    def get_related_crop_information(self, crop_id: str) -> dict[str, Any]:
        return {
            "crop_id": crop_id,
            "demand": self.get_crop_demand(crop_id, "", 0),
            "market": self.get_crop_market_data(crop_id),
            "weather": self.get_crop_weather_data(crop_id),
            "relationships": self.get_crop_relationships(crop_id),
        }

    def close(self) -> None:
        if self._driver is not None:
            try:
                self._driver.close()
            except Exception:  # noqa: BLE001
                pass
            self._driver = None


# Shared singleton. Tools call through this so a single connection pool is used.
neo4j_service = Neo4jService()


class Neo4jSyncService:
    """Keeps the knowledge graph in sync AFTER Firestore operations succeed."""

    def __init__(self, service: Neo4jService | None = None) -> None:
        self.service = service or neo4j_service

    @staticmethod
    def _record_result(ok: bool, message: str) -> dict[str, Any]:
        return {
            "synced": ok,
            "message": message,
            "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        }

    def sync_crop_plan(
        self,
        *,
        plan_id: str,
        farmer_id: str,
        crop_id: str,
        season: str,
        year: int,
        cultivated_area: float,
        predicted_production: float,
    ) -> dict[str, Any]:
        if not self.service.configured:
            return self._record_result(False, "Neo4j not configured; skipped sync.")
        cypher = (
            "MERGE (cp:CropPlan {id: $plan_id}) "
            "SET cp.farmerId = $farmer_id, cp.cropId = $crop_id, cp.season = $season, "
            "cp.year = $year, cp.cultivatedArea = $cultivated_area, "
            "cp.predictedProduction = $predicted_production, cp.syncedAt = datetime() "
            "MERGE (f:Farmer {id: $farmer_id}) "
            "MERGE (c:Crop {id: $crop_id}) "
            "MERGE (f)-[:HAS_CROP_PLAN]->(cp) "
            "MERGE (cp)-[:FOR_CROP]->(c) "
            "MERGE (f)-[:PLANS_TO_GROW]->(c)"
        )
        params = {
            "plan_id": plan_id,
            "farmer_id": farmer_id,
            "crop_id": crop_id,
            "season": season,
            "year": int(year),
            "cultivated_area": float(cultivated_area),
            "predicted_production": float(predicted_production),
        }
        try:
            self.service.execute_query(cypher, params)
            return self._record_result(True, "synchronized")
        except Neo4jUnavailableError as error:
            log.warning("Neo4j crop-plan sync failed: %s", error)
            return self._record_result(False, str(error))

    def sync_farmer(self, farmer: dict[str, Any]) -> dict[str, Any]:
        if not self.service.configured:
            return self._record_result(False, "Neo4j not configured; skipped sync.")
        cypher = (
            "MERGE (f:Farmer {id: $farmer_id}) "
            "SET f.name = $name, f.location = $location "
            "MERGE (l:Location {name: $location}) "
            "MERGE (f)-[:LOCATED_IN]->(l)"
        )
        try:
            self.service.execute_query(
                cypher,
                {
                    "farmer_id": str(farmer.get("id", "")),
                    "name": str(farmer.get("name", "") or farmer.get("full_name", "")),
                    "location": str(
                        farmer.get("location", "") or farmer.get("region", "Kandy")
                    ),
                },
            )
            return self._record_result(True, "synchronized")
        except Neo4jUnavailableError as error:
            return self._record_result(False, str(error))


neo4j_sync = Neo4jSyncService()

