# Data Sources

This document lists every authoritative data source the Smart Crop Forecasting
system may draw on, how it is used, and its status. It mirrors the registry in
`src/core/data_sources.py` (which also powers the `dataSources` metadata in API
responses).

Every external source is wrapped in a best-effort provider that **fails softly**
(never crashes, never invents values). When a source is unavailable the system
falls back to the next trusted source in the chain.

## Sri Lankan national sources

| Source | URL | Used for | Status |
|---|---|---|---|
| Department of Census and Statistics | <http://www.statistics.gov.lk> | Production / census | external |
| HARTI – Hector Kobbekaduwa Agrarian Research and Training Institute | <http://harti.gov.lk> | Live market prices | **integrated** (via Spring `/api/market-prices/live`) |
| HARTI food consumption patterns report | <http://harti.gov.lk/images/download/reasearch_report/new1/172.pdf> | Demand | external |
| Central Bank of Sri Lanka Annual Reports | <https://www.cbsl.gov.lk/en/publications/economic-and-financial-reports/annual-reports> | Price context | external |
| Department of Agriculture | <https://www.doa.gov.lk> | Production | external |

## Global datasets

| Source | URL | Used for | Status |
|---|---|---|---|
| FAOSTAT (Sri Lanka, area 247) | <https://www.fao.org/faostat/en/#country/247> | Production cross-check for the demand model | **optional / live** (`data_providers.FaostatProvider`) |
| UN Comtrade | <https://comtradeplus.un.org> | Trade data | external |

## Price / market data

| Source | URL | Used for | Status |
|---|---|---|---|
| R package `vegetablesSriLanka` (Dambulla & Pettah) | <https://cran.r-project.org/web/packages/vegetablesSriLanka/index.html> | Alternative live price source | **optional** (`data_providers.DambullaPriceProvider`) |
| HARTI bulletin (via Spring) | `http://harti.gov.lk` | Live market price in scoring | **integrated** |
| Local historical dataset | `sri_lanka_vegetable_dataset.csv` | ML training + demand baseline | **integrated** |

## How the demand model uses them

Fallback chain in `src/services/demand_service.py`:

1. **Local historical dataset** — median historical production (tonnes) per
   crop+season. `status: REAL`.
2. **FAOSTAT** — country-level production (tonnes) for Sri Lanka used as a
   secondary REAL cross-check when the local crop is missing. `status: REAL`.
3. **Catalog estimate** — clearly-marked placeholder. `status: ESTIMATED`.

## How the market price is resolved

In `src/agent/recommendation_engine.py`, for each crop the price is resolved in
this order:

1. **ML price model** (`price_prediction_model.joblib`) — always computed.
2. **HARTI live price** (via Spring) — overrides the ML price when a match is
   found. `source: "HARTI live"`.
3. **Dambulla/Pettah price** — used when HARTI has no match and this source is
   configured (`DAMBULLA_PETTAH_PRICE_URL`). `source: "Dambulla/Pettah"`.

## Every data value carries a status

`REAL` (from a live/authoritative source), `ESTIMATED` (modelled/derived),
`DEMO` (sample), or `UNAVAILABLE` (source unreachable). The API returns these
with each `DataSource` plus its source `url`.
