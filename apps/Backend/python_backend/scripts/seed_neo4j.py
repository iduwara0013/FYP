"""Seed the Neo4j Aura knowledge graph (idempotent).

Creates uniqueness constraints and seeds Crop and Location nodes from the
existing application catalog. Uses only parameterized queries through
Neo4jService — never raw user input.

Run from apps/Backend/python_backend:
    python scripts/seed_neo4j.py
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.agent.tools import CROP_CATALOG  # noqa: E402
from src.core.config import settings  # noqa: E402
from src.services.neo4j_service import Neo4jUnavailableError, neo4j_service  # noqa: E402

LOCATIONS = [
    "Nuwara Eliya",
    "Badulla",
    "Kandy",
    "Gampaha",
    "Kalutara",
    "Ratnapura",
    "Kurunegala",
]

CONSTRAINTS = [
    "CREATE CONSTRAINT crop_id IF NOT EXISTS FOR (n:Crop) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT farmer_id IF NOT EXISTS FOR (n:Farmer) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT cropplan_id IF NOT EXISTS FOR (n:CropPlan) REQUIRE n.id IS UNIQUE",
    "CREATE CONSTRAINT location_name IF NOT EXISTS FOR (n:Location) REQUIRE n.name IS UNIQUE",
]


def slugify(name: str) -> str:
    return name.strip().lower().replace(" ", "-")


def seed() -> None:
    if not settings.neo4j.configured:
        print("Neo4j not configured. Set NEO4J_* env vars (see .env.example).")
        return

    # Constraints
    for cypher in CONSTRAINTS:
        neo4j_service.execute_query(cypher)
    print("Constraints ensured.")

    # Crops from the existing catalog
    crop_rows = [
        {"id": slugify(name), "name": name}
        for name in CROP_CATALOG.keys()
    ]
    for row in crop_rows:
        neo4j_service.execute_query(
            "MERGE (c:Crop {id: $id}) SET c.name = $name",
            row,
        )
    print(f"Seeded {len(crop_rows)} Crop nodes.")

    # Locations (districts)
    for name in LOCATIONS:
        neo4j_service.execute_query(
            "MERGE (l:Location {name: $name}) SET l.district = $name",
            {"name": name},
        )
    print(f"Seeded {len(LOCATIONS)} Location nodes.")

    # Demand nodes with HAS_DEMAND relationships (for get_crop_demand).
    # Demand values are derived deterministically from the catalog so we never
    # invent numbers in the graph.
    demand_seasons = ["Yala", "Maha"]
    demand_years = [2025, 2026]
    demand_rows = 0
    for name in CROP_CATALOG:
        base_demand = float(
            CROP_CATALOG[name].get("estimatedDemandTonnes", 20.0)
        )
        crop_key = slugify(name)
        for season in demand_seasons:
            for year in demand_years:
                demand_id = f"{crop_key}-{season}-{year}"
                neo4j_service.execute_query(
                    "MERGE (d:Demand {id: $id, cropId: $crop_id, "
                    "season: $season, year: $year}) "
                    "SET d.expectedTonnes = $expected, d.source = $source, "
                    "d.isEstimated = $isEstimated",
                    {
                        "id": demand_id,
                        "crop_id": crop_key,
                        "season": season,
                        "year": year,
                        "expected": base_demand,
                        "source": "catalog-seed",
                        "isEstimated": True,
                    },
                )
                neo4j_service.execute_query(
                    "MATCH (c:Crop {id: $crop_id}), (d:Demand {id: $demand_id}) "
                    "MERGE (c)-[:HAS_DEMAND]->(d)",
                    {"crop_id": crop_key, "demand_id": demand_id},
                )
                demand_rows += 1
    print(f"Seeded {demand_rows} Demand nodes.")

    # Verify
    counts = neo4j_service.execute_query(
        "MATCH (n) RETURN labels(n) AS Label, count(*) AS c"
    )
    for row in counts:
        print(f"  {row['Label']}: {row['c']}")


if __name__ == "__main__":
    try:
        seed()
    except Neo4jUnavailableError as error:
        print(f"Neo4j unavailable: {error}")
        sys.exit(1)
    except Exception as error:  # noqa: BLE001
        print(f"Seeding failed: {error}")
        sys.exit(1)
