"""Registry of authoritative data sources.

Every external source the agent may draw on is listed here with its URL, type,
scope and how it is used. This powers the `dataSources` metadata returned by the
API and serves as documentation. Credential-free sources only; no secrets live
here.
"""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class DataSource:
    key: str
    name: str
    url: str
    source_type: str  # demand | price | production | trade | weather | catalog
    scope: str  # lk | global
    status: str  # integrated | optional | external
    used_in: str = ""


SOURCES: list[DataSource] = [
    DataSource(
        key="census",
        name="Department of Census and Statistics (Sri Lanka)",
        url="http://www.statistics.gov.lk",
        source_type="production",
        scope="lk",
        status="external",
    ),
    DataSource(
        key="harti",
        name="HARTI - Hector Kobbekaduwa Agrarian Research and Training Institute",
        url="http://harti.gov.lk",
        source_type="price",
        scope="lk",
        status="integrated",
        used_in="Live market prices (via Spring /api/market-prices/live)",
    ),
    DataSource(
        key="harti_food_consumption",
        name="HARTI food consumption patterns report",
        url="http://harti.gov.lk/images/download/reasearch_report/new1/172.pdf",
        source_type="demand",
        scope="lk",
        status="external",
    ),
    DataSource(
        key="cbsl",
        name="Central Bank of Sri Lanka - Annual Reports",
        url="https://www.cbsl.gov.lk/en/publications/economic-and-financial-reports/annual-reports",
        source_type="price",
        scope="lk",
        status="external",
    ),
    DataSource(
        key="doa",
        name="Department of Agriculture (Sri Lanka)",
        url="https://www.doa.gov.lk",
        source_type="production",
        scope="lk",
        status="external",
    ),
    DataSource(
        key="faostat",
        name="FAOSTAT (Sri Lanka)",
        url="https://www.fao.org/faostat/en/#country/247",
        source_type="production",
        scope="global",
        status="optional",
        used_in="Demand cross-check (FaostatProvider)",
    ),
    DataSource(
        key="uncomtrade",
        name="UN Comtrade (trade data)",
        url="https://comtradeplus.un.org",
        source_type="trade",
        scope="global",
        status="external",
    ),
    DataSource(
        key="vegetables_srilanka",
        name="R package vegetablesSriLanka (Dambulla & Pettah prices)",
        url="https://cran.r-project.org/web/packages/vegetablesSriLanka/index.html",
        source_type="price",
        scope="lk",
        status="optional",
        used_in="Alternative live price source (DambullaPriceProvider)",
    ),
    DataSource(
        key="local_dataset",
        name="Historical Sri Lankan vegetable dataset (training)",
        url="apps/Backend/python_backend/sri_lanka_vegetable_dataset.csv",
        source_type="production",
        scope="lk",
        status="integrated",
        used_in="ML training + demand model baseline",
    ),
]


def get_by_key(key: str) -> DataSource | None:
    return next((s for s in SOURCES if s.key == key), None)
