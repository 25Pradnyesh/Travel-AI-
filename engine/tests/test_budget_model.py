"""
Tests for Transparent Travel Budget Estimation Model (World Bank ICP + ECB Frankfurter).
"""

import unittest
from unittest.mock import patch, MagicMock
from engine.app.services.travel.budget_estimator import (
    BudgetEstimator,
    BUDGET_TIER_BASELINES,
)


class TestBudgetModel(unittest.TestCase):

    def setUp(self):
        self.estimator = BudgetEstimator()
        # Mock external HTTP calls so tests are completely offline and deterministic
        self.patcher = patch("requests.get")
        self.mock_get = self.patcher.start()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "amount": 1.0,
            "base": "USD",
            "date": "2026-10-23",
            "rates": {"INR": 94.94, "KRW": 1324.45, "CHF": 0.86, "EUR": 0.92, "JPY": 152.30},
        }
        self.mock_get.return_value = mock_resp

    def tearDown(self):
        self.patcher.stop()

    def test_baseline_config_component_sums(self):
        """All tiers in documented baseline config must sum exactly to base_usd."""
        for tier_name, tier_cfg in BUDGET_TIER_BASELINES.items():
            base_usd = tier_cfg["base_usd"]
            components = tier_cfg["components"]
            comp_sum = sum(components.values())
            self.assertEqual(
                comp_sum,
                base_usd,
                f"Baseline tier {tier_name} component sum {comp_sum} != {base_usd}",
            )

    def test_component_arithmetic_sums_to_totals(self):
        """In calculated estimates, components must sum exactly to displayed totals in USD, local, and INR."""
        test_countries = ["South Korea", "Switzerland", "Vietnam", "Japan", "France"]
        for country in test_countries:
            res = self.estimator.estimate({"country": country})
            self.assertIsNotNone(res)
            model = res["budget_model"]
            tiers = model["tiers"]

            for tier_name in ["budget", "mid_range", "comfortable"]:
                t = tiers[tier_name]

                # USD sum check
                usd_sum = sum(t["breakdown_usd"].values())
                self.assertEqual(
                    usd_sum,
                    t["total_usd"],
                    f"{country} {tier_name} USD breakdown sum {usd_sum} != total {t['total_usd']}",
                )

                # Local currency sum check
                local_sum = sum(t["breakdown_local"].values())
                self.assertEqual(
                    local_sum,
                    t["total_local"],
                    f"{country} {tier_name} Local breakdown sum {local_sum} != total {t['total_local']}",
                )

                # INR sum check
                inr_sum = sum(t["breakdown_inr"].values())
                self.assertEqual(
                    inr_sum,
                    t["total_inr"],
                    f"{country} {tier_name} INR breakdown sum {inr_sum} != total {t['total_inr']}",
                )

    def test_destination_differences(self):
        """Jeju (South Korea), Switzerland, and Vietnam must produce substantially different estimates."""
        jeju_res = self.estimator.estimate({"country": "South Korea"})
        swiss_res = self.estimator.estimate({"country": "Switzerland"})
        viet_res = self.estimator.estimate({"country": "Vietnam"})

        self.assertIsNotNone(jeju_res)
        self.assertIsNotNone(swiss_res)
        self.assertIsNotNone(viet_res)

        jeju_mid = jeju_res["budget_model"]["tiers"]["mid_range"]["total_usd"]
        swiss_mid = swiss_res["budget_model"]["tiers"]["mid_range"]["total_usd"]
        viet_mid = viet_res["budget_model"]["tiers"]["mid_range"]["total_usd"]

        # Switzerland (1.64) > South Korea (0.72) > Vietnam (0.38)
        self.assertGreater(swiss_mid, jeju_mid)
        self.assertGreater(jeju_mid, viet_mid)

        # Significant variance (> 2x between Swiss and Vietnam)
        self.assertGreater(swiss_mid, viet_mid * 2)

    def test_missing_data_returns_none(self):
        """A country or place with no verified price-level data must return None (no fake prices)."""
        res = self.estimator.estimate({"country": "Atlantis Fantasy Realm"})
        self.assertIsNone(res)

        res_empty = self.estimator.estimate({"country": ""})
        self.assertIsNone(res_empty)

    def test_transparency_metadata_present(self):
        """Estimate must contain required transparency metadata, rate date, and disclaimer."""
        res = self.estimator.estimate({"country": "South Korea"})
        self.assertIsNotNone(res)
        model = res["budget_model"]

        self.assertTrue(model["per_person"])
        self.assertTrue(model["accommodation_included"])
        self.assertIn("flights", " ".join(model["exclusions"]).lower())
        self.assertIn("visas", " ".join(model["exclusions"]).lower())
        self.assertIn("Estimate from national price levels; not city-specific or live", model["disclaimer"])
        self.assertEqual(model["world_bank_indicator"], "PA.NUS.PPPC.RF")
        self.assertTrue(len(model["rate_date"]) > 0)


if __name__ == "__main__":
    unittest.main()
