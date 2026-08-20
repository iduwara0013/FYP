"""Best-effort live data providers for the demand model and market prices.

Every provider FAILS SOFTLY: on any error (network, parsing, missing config) it
returns an empty/None result so the agent falls back to local trusted data. It
never invents values.

- FaostatProvider : country-level crop production (tonnes) from FAOSTAT API,
                    used as a secondary REAL demand cross-check.
- DambullaPriceProvider : reads a simple crop,price CSV (e.g. the
                    vegetablesSriLanka Dambulla/Pettah data) from a configured
                    URL, used as an alternative live price source.
"""
from __future__ import annotations

import os
import time
from typing import Any
from urllib.request import Request, urlopen

from src.core.config import settings
from src.core.logging import get_logger

log = get_logger(__name__)


def fetch_text(url: str, timeout: int = 12) -> str:
    request = Request(url, headers={"User-Agent": "smartcrop-agent/1.0"})
    with urlopen(request, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="replace")


# Map catalog crops to FAOSTAT item names (secondary names are fallbacks).
FAOSTAT_ITEM_MAP: dict[str, list[str]] = {
    "Tomato": ["Tomatoes"],
    "Red pumpkin": ["Pumpkins"],
    "Ash pumpkin": ["Pumpkins"],
    "Cabbage": ["Cabbages and other brassicas", "Cabbages"],
    "Cucumber": ["Cucumbers"],
    "Bean (green)": ["Beans, green", "Beans"],
    "Brinjal": ["Eggplants", "Aubergines"],
    "Carrot": ["Carrots"],
    "Beetroot": ["Beetroots"],
    "Capsicum": ["Peppers", "Chillies and peppers"],
    "Ladies fingers": ["Okra"],
    "Leeks": ["Leeks", "Leek"],
    "Radish": ["Radishes"],
    "Ash plantain": ["Plantains", "Bananas"],
    "Bitter gourd": [],
    "Snake gourd": [],
    "Luffa": [],
    "Onion": ["Onions, dry", "Onions"],
}


def _norm(name: str) -> str:
    return "".join(ch for ch in str(name).lower() if ch.isalnum())


class FaostatProvider:
    ELEMENT_QUANTITY = "5510"
    AREA_SRI_LANKA = "247"

    def __init__(
        self,
        enabled: bool | None = None,
        years: list[int] | None = None,
    ) -> None:
        self.enabled = (
            settings.demo_mode is False
            and os.getenv("FAOSTAT_ENABLED", "true").strip().lower()
            in {"1", "true", "yes"}
        ) if enabled is None else enabled
        self.years = years or [
            int(time.strftime("%Y")) - 1,
            int(time.strftime("%Y")) - 2,
            int(time.strftime("%Y")) - 3,
        ]
        self._lookup: dict[str, float] | None = None
        self._tried = False

    def _base_url(self) -> str:
        return (
            "https://fenixservices.fao.org/faostat/api/v1/en/data"
            f"?area_code={self.AREA_SRI_LANKA}&element_code={self.ELEMENT_QUANTITY}&year="
        )

    def _load(self) -> dict[str, float] | None:
        """Fetch country-level production once and build a normalized lookup."""
        if self._tried:
            return self._lookup
        self._tried = True
        for year in self.years:
            try:
                import json

                raw = fetch_text(self._base_url() + str(year), timeout=12)
                payload = json.loads(raw)
                rows = payload.get("data") if isinstance(payload, dict) else []
                if not rows:
                    continue
                lookup: dict[str, float] = {}
                for row in rows:
                    item = row.get("item")
                    try:
                        value = float(row.get("value"))
                    except (TypeError, ValueError):
                        continue
                    if item:
                        lookup[_norm(item)] = value
                self._lookup = lookup
                log.info("FAOSTAT production loaded: %s items (year %s)", len(lookup), year)
                return lookup
            except Exception as error:  # noqa: BLE001
                log.info("FAOSTAT fetch failed (year %s): %s", year, error)
        self._lookup = None
        return None

    def production_tons(self, crop: str) -> float | None:
        """Return FAOSTAT production (tonnes) for a catalog crop, or None."""
        if not self.enabled:
            return None
        lookup = self._load()
        if not lookup:
            return None
        for candidate in FAOSTAT_ITEM_MAP.get(crop, [crop]):
            value = lookup.get(_norm(candidate))
            if value is not None and value > 0:
                return value
        return None

    def source_url(self) -> str:
        return "https://www.fao.org/faostat/en/#country/247"

class DambullaPriceProvider:
    """Reads a simple <crop, price> CSV (Dambulla/Pettah) from a URL."""

    def __init__(self, csv_url: str | None = None) -> None:
        self.csv_url = csv_url or ""
        self._prices: dict[str, float] | None = None
        self._tried = False

    def _load(self) -> dict[str, float]:
        if self._tried:
            return self._prices or {}
        self._tried = True
        if not self.csv_url:
            return {}
        try:
            import csv
            import io

            text = fetch_text(self.csv_url, timeout=12)
            reader = csv.DictReader(io.StringIO(text))
            prices: dict[str, float] = {}
            for row in reader:
                name = (
                    row.get("crop") or row.get("Crop") or row.get("item") or ""
                ).strip()
                price_raw = (
                    row.get("price")
                    or row.get("Price")
                    or row.get("pricePerKg")
                    or ""
                ).strip()
                if not name or not price_raw:
                    continue
                try:
                    prices[_norm(name)] = float(price_raw)
                except ValueError:
                    continue
            self._prices = prices
            log.info("Dambulla/Pettah prices loaded: %s crops", len(prices))
            return prices
        except Exception as error:  # noqa: BLE001
            log.info("Dambulla/Pettah price fetch failed: %s", error)
            self._prices = {}
            return {}

    def get_prices(self) -> dict[str, float]:
        return self._load()


import os  # noqa: E402  (os already imported at top; kept for clarity)


# Shared singletons (best-effort; each fails softly when no data is available).
faostat_provider = FaostatProvider()
dambulla_price_provider = DambullaPriceProvider(
    csv_url=os.getenv("DAMBULLA_PETTAH_PRICE_URL", "").strip()
)

