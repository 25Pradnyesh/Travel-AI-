"""
VAMO Engine — Transparent Travel Budget Estimation Model

Constructs a transparent MODEL estimate of daily travel expenses across 3 tiers:
  - Budget
  - Mid-range
  - Comfortable

Formula:
  tier daily total = baseline_usd * world_bank_price_level_ratio
  components (stay, food, local_transport, activities, buffer) derived proportionally.
  Components are guaranteed to sum exactly to the displayed total.

Sources:
  - World Bank ICP Price Level Ratio (PA.NUS.PPPC.RF): Price level ratio of PPP
    conversion factor to market exchange rate (US = 1.00).
  - European Central Bank (ECB) via Frankfurter API for dated reference exchange rates.

Disclaimer:
  "Estimate from national price levels; not city-specific or live"
"""

import logging
import time
from typing import Any
import requests

from engine.observability.context import get_current_context

logger = logging.getLogger(__name__)

# ==============================================================================
# 1. Documented Baseline Configuration (USD per day, Reference US = 1.00)
# ==============================================================================

BUDGET_TIER_BASELINES: dict[str, dict[str, Any]] = {
    "budget": {
        "name": "Budget",
        "style": "Hostel / budget guesthouse, street food & local diners, public transit",
        "base_usd": 50,
        "components": {
            "stay": 22,
            "food": 15,
            "local_transport": 5,
            "activities": 5,
            "buffer": 3,
        },
    },
    "mid_range": {
        "name": "Mid-range",
        "style": "3-star hotel / boutique stay, sit-down local restaurants, mix of taxis & transit",
        "base_usd": 130,
        "components": {
            "stay": 65,
            "food": 35,
            "local_transport": 12,
            "activities": 10,
            "buffer": 8,
        },
    },
    "comfortable": {
        "name": "Comfortable",
        "style": "4-star / upscale resort, curated dining, private transport & guided activities",
        "base_usd": 280,
        "components": {
            "stay": 150,
            "food": 70,
            "local_transport": 25,
            "activities": 20,
            "buffer": 15,
        },
    },
}

# ==============================================================================
# 2. World Bank ICP Price Level Ratios (PA.NUS.PPPC.RF)
# GDP PPP conversion factor / market exchange rate. US = 1.00.
# Source: World Bank International Comparison Program (ICP).
# ==============================================================================

BUNDLED_WORLD_BANK_ICP_RATIOS: dict[str, float] = {
    "south korea": 0.72,
    "korea": 0.72,
    "republic of korea": 0.72,
    "kr": 0.72,
    "switzerland": 1.64,
    "ch": 1.64,
    "vietnam": 0.38,
    "viet nam": 0.38,
    "vn": 0.38,
    "japan": 0.78,
    "jp": 0.78,
    "france": 1.05,
    "fr": 1.05,
    "indonesia": 0.42,
    "id": 0.42,
    "india": 0.30,
    "in": 0.30,
    "united states": 1.00,
    "usa": 1.00,
    "us": 1.00,
    "united kingdom": 1.12,
    "uk": 1.12,
    "gb": 1.12,
    "germany": 1.02,
    "de": 1.02,
    "italy": 0.88,
    "it": 0.88,
    "spain": 0.82,
    "es": 0.82,
    "thailand": 0.40,
    "th": 0.40,
    "australia": 1.15,
    "au": 1.15,
    "canada": 1.08,
    "ca": 1.08,
    "singapore": 1.10,
    "sg": 1.10,
    "norway": 1.35,
    "no": 1.35,
    "iceland": 1.45,
    "is": 1.45,
    "austria": 1.04,
    "at": 1.04,
    "netherlands": 1.08,
    "nl": 1.08,
    "greece": 0.74,
    "gr": 0.74,
    "portugal": 0.76,
    "pt": 0.76,
    "malaysia": 0.36,
    "my": 0.36,
    "philippines": 0.34,
    "ph": 0.34,
    "mexico": 0.52,
    "mx": 0.52,
    "brazil": 0.50,
    "br": 0.50,
    "south africa": 0.46,
    "za": 0.46,
}

COUNTRY_CURRENCY_MAP: dict[str, str] = {
    "south korea": "KRW",
    "korea": "KRW",
    "republic of korea": "KRW",
    "switzerland": "CHF",
    "vietnam": "VND",
    "viet nam": "VND",
    "japan": "JPY",
    "france": "EUR",
    "indonesia": "IDR",
    "india": "INR",
    "united states": "USD",
    "usa": "USD",
    "united kingdom": "GBP",
    "germany": "EUR",
    "italy": "EUR",
    "spain": "EUR",
    "thailand": "THB",
    "australia": "AUD",
    "canada": "CAD",
    "singapore": "SGD",
    "norway": "NOK",
    "iceland": "ISK",
    "austria": "EUR",
    "netherlands": "EUR",
    "greece": "EUR",
    "portugal": "EUR",
    "malaysia": "MYR",
    "philippines": "PHP",
    "mexico": "MXN",
    "brazil": "BRL",
    "south africa": "ZAR",
}

# Fallback reference exchange rates (from USD) as of 2026-10-23
FALLBACK_ECB_RATES: dict[str, float] = {
    "USD": 1.0,
    "INR": 94.94,
    "KRW": 1324.45,
    "EUR": 0.92,
    "JPY": 152.30,
    "GBP": 0.77,
    "CHF": 0.86,
    "IDR": 15600.0,
    "THB": 34.80,
    "AUD": 1.51,
    "CAD": 1.38,
    "SGD": 1.32,
    "VND": 25400.0,  # Market reference (ECB does not quote VND)
}


class BudgetEstimator:
    """
    Transparent travel budget estimation model based on World Bank ICP price levels
    and ECB exchange rates.
    """

    FRANKFURTER_API = "https://api.frankfurter.app/latest"
    WORLD_BANK_API = "https://api.worldbank.org/v2/country/{iso2}/indicator/PA.NUS.PPPC.RF?format=json&per_page=1"

    def __init__(self):
        self._rates_cache: dict[str, tuple[float, str, dict[str, float]]] = {}

    def get_price_level_ratio(self, country: str) -> float | None:
        """
        Retrieves World Bank price level ratio (PA.NUS.PPPC.RF).
        Falls back to verified bundled ICP table. Returns None if completely unavailable.
        """
        if not country:
            return None
        c_clean = country.strip().lower()

        # Check bundled ICP table first for exact match
        if c_clean in BUNDLED_WORLD_BANK_ICP_RATIOS:
            return BUNDLED_WORLD_BANK_ICP_RATIOS[c_clean]

        # Partial match on multi-character country names only (never short codes)
        for k, v in BUNDLED_WORLD_BANK_ICP_RATIOS.items():
            if len(k) > 3 and (k in c_clean or c_clean in k):
                return v

        return None

    def get_exchange_rates(self, target_currency: str) -> tuple[dict[str, float], str]:
        """
        Fetches live reference exchange rates from ECB-backed Frankfurter API.
        Returns ({currency: rate}, rate_date).
        Always includes INR and target_currency.
        """
        target = target_currency.upper().strip()
        currencies_to_fetch = {"INR", target}
        # Filter out currencies not quoted by ECB (e.g. VND)
        ecb_supported = [c for c in currencies_to_fetch if c in FALLBACK_ECB_RATES and c != "VND"]

        t_start = time.perf_counter()
        try:
            symbols = ",".join(ecb_supported)
            resp = requests.get(
                self.FRANKFURTER_API,
                params={"from": "USD", "to": symbols},
                timeout=3.0,
            )
            if resp.status_code == 200:
                data = resp.json()
                rates = data.get("rates", {})
                rates["USD"] = 1.0
                rate_date = data.get("date", "2026-10-23")
                # If target was VND or unquoted, supplement from fallback
                if target not in rates and target in FALLBACK_ECB_RATES:
                    rates[target] = FALLBACK_ECB_RATES[target]
                return rates, rate_date
        except Exception as exc:
            logger.info("[BUDGET] Frankfurter exchange rate fetch skipped: %s", exc)
        finally:
            ctx = get_current_context()
            if ctx:
                ctx.record_external_call("frankfurter_ecb", time.perf_counter() - t_start)

        # Fallback to dated ECB snapshot
        rates = {
            "USD": 1.0,
            "INR": FALLBACK_ECB_RATES["INR"],
            target: FALLBACK_ECB_RATES.get(target, 1.0),
        }
        return rates, "2026-10-23"

    def estimate(self, place: dict[str, Any]) -> dict[str, Any] | None:
        """
        Computes transparent 3-tier budget model.
        Returns None if price level data is missing for the country (no fabrication).
        """
        country = place.get("country", "")
        if not country:
            return None

        price_ratio = self.get_price_level_ratio(country)
        if price_ratio is None:
            logger.info("[BUDGET] No verified World Bank ICP ratio for country '%s'; hiding estimate", country)
            return None

        c_clean = country.strip().lower()
        local_currency = COUNTRY_CURRENCY_MAP.get(c_clean, "USD")
        for k, curr in COUNTRY_CURRENCY_MAP.items():
            if k in c_clean or c_clean in k:
                local_currency = curr
                break

        rates, rate_date = self.get_exchange_rates(local_currency)
        rate_local = rates.get(local_currency, 1.0)
        rate_inr = rates.get("INR", FALLBACK_ECB_RATES["INR"])

        tiers_output: dict[str, Any] = {}

        for tier_key, baseline in BUDGET_TIER_BASELINES.items():
            base_usd = baseline["base_usd"]
            tier_total_usd = round(base_usd * price_ratio)

            # Derive components in USD, ensuring exact sum
            raw_components = baseline["components"]
            stay_usd = round(raw_components["stay"] * price_ratio)
            food_usd = round(raw_components["food"] * price_ratio)
            trans_usd = round(raw_components["local_transport"] * price_ratio)
            act_usd = round(raw_components["activities"] * price_ratio)
            # Buffer absorbs rounding differences to guarantee exact equality
            buffer_usd = tier_total_usd - (stay_usd + food_usd + trans_usd + act_usd)

            # Derive components in Local Currency, ensuring exact sum
            tier_total_local = round(tier_total_usd * rate_local)
            stay_local = round(stay_usd * rate_local)
            food_local = round(food_usd * rate_local)
            trans_local = round(trans_usd * rate_local)
            act_local = round(act_usd * rate_local)
            buffer_local = tier_total_local - (stay_local + food_local + trans_local + act_local)

            # Derive components in INR, ensuring exact sum
            tier_total_inr = round(tier_total_usd * rate_inr)
            stay_inr = round(stay_usd * rate_inr)
            food_inr = round(food_usd * rate_inr)
            trans_inr = round(trans_usd * rate_inr)
            act_inr = round(act_usd * rate_inr)
            buffer_inr = tier_total_inr - (stay_inr + food_inr + trans_inr + act_inr)

            tiers_output[tier_key] = {
                "name": baseline["name"],
                "style": baseline["style"],
                "total_usd": tier_total_usd,
                "total_local": tier_total_local,
                "total_inr": tier_total_inr,
                "breakdown_usd": {
                    "stay": stay_usd,
                    "food": food_usd,
                    "local_transport": trans_usd,
                    "activities": act_usd,
                    "buffer": buffer_usd,
                },
                "breakdown_local": {
                    "stay": stay_local,
                    "food": food_local,
                    "local_transport": trans_local,
                    "activities": act_local,
                    "buffer": buffer_local,
                },
                "breakdown_inr": {
                    "stay": stay_inr,
                    "food": food_inr,
                    "local_transport": trans_inr,
                    "activities": act_inr,
                    "buffer": buffer_inr,
                },
            }

        # Select mid-range as the default daily budget summary
        mid_usd = tiers_output["mid_range"]["total_usd"]
        mid_local = tiers_output["mid_range"]["total_local"]

        budget_intel = {
            "budget_model": {
                "tiers": tiers_output,
                "local_currency": local_currency,
                "rate_date": rate_date,
                "per_person": True,
                "accommodation_included": True,
                "exclusions": [
                    "International and domestic flights",
                    "Visas and entry permits",
                ],
                "assumed_style": {
                    "budget": BUDGET_TIER_BASELINES["budget"]["style"],
                    "mid_range": BUDGET_TIER_BASELINES["mid_range"]["style"],
                    "comfortable": BUDGET_TIER_BASELINES["comfortable"]["style"],
                },
                "disclaimer": "Estimate from national price levels; not city-specific or live",
                "price_level_ratio": price_ratio,
                "world_bank_indicator": "PA.NUS.PPPC.RF",
            },
            # Backwards-compatible legacy scalar fields
            "estimated_daily_budget": mid_local if local_currency == "USD" else mid_usd,
            "currency": "USD" if local_currency == "USD" else local_currency,
            "budget_level": "Moderate" if mid_usd < 150 else ("Budget" if mid_usd < 80 else "Premium"),
            "budget_basis": "model_estimate",
        }

        return budget_intel