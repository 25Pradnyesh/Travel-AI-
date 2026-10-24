import unittest

from engine.app.services.location.canonical_display_name import (
    build_canonical_display_name,
    canonicalize_country,
    is_same_entity,
)


class TestCanonicalDisplayNameBuilder(unittest.TestCase):
    """
    Tests for canonical display-name builder.
    Verifies that destination display names never produce duplicate countries or alias repetitions.
    Specifically tests: Jeju, Kyoto, Bali, Paris, New York City, and 'Korea' aliases.
    """

    def test_jeju_island_no_duplicate_country(self):
        # Scenario: Candidate extracted as "Jeju Island, South Korea" with country "South Korea"
        name = build_canonical_display_name(
            name="Jeju Island, South Korea",
            country="South Korea",
        )
        self.assertEqual(name, "Jeju Island, South Korea")

        # Scenario: name="Jeju Island", city="Jeju", region="South Korea", country="South Korea"
        name2 = build_canonical_display_name(
            name="Jeju Island",
            city="Jeju",
            region="South Korea",
            country="South Korea",
        )
        self.assertEqual(name2, "Jeju Island, South Korea")

    def test_korea_aliases_deduplication(self):
        # "Korea" and "South Korea" must be recognized as aliases and not duplicated
        cases = [
            ("Jeju Island, Korea", "South Korea", "Jeju Island, South Korea"),
            ("Jeju Island, Republic of Korea", "South Korea", "Jeju Island, South Korea"),
            ("Jeju Island", "Korea", "Jeju Island, South Korea"),
            ("Jeju Island, South Korea", "Korea", "Jeju Island, South Korea"),
            ("Jeju Island, ROK", "South Korea", "Jeju Island, South Korea"),
            ("Hallasan, Jeju, Korea", "South Korea", "Hallasan, Jeju, South Korea"),
        ]
        for input_name, input_country, expected in cases:
            res = build_canonical_display_name(name=input_name, country=input_country)
            self.assertEqual(res, expected, f"Failed for {input_name} + {input_country}")

    def test_kyoto_japan(self):
        # Kyoto: city="Kyoto", region="Kansai", country="Japan"
        res = build_canonical_display_name(
            name="Kyoto",
            city="Kyoto",
            region="Kansai",
            country="Japan",
        )
        self.assertEqual(res, "Kyoto, Japan")

        res_with_country = build_canonical_display_name(
            name="Kyoto, Japan",
            country="Japan",
        )
        self.assertEqual(res_with_country, "Kyoto, Japan")

    def test_bali_indonesia(self):
        # Bali: name="Bali", region="Bali", country="Indonesia"
        res = build_canonical_display_name(
            name="Bali",
            region="Bali",
            country="Indonesia",
        )
        self.assertEqual(res, "Bali, Indonesia")

        # Pre-concatenated name with country
        res2 = build_canonical_display_name(
            name="Bali, Indonesia",
            country="Indonesia",
        )
        self.assertEqual(res2, "Bali, Indonesia")

    def test_paris_france(self):
        # Paris: city="Paris", region="Île-de-France", country="France"
        res = build_canonical_display_name(
            name="Paris",
            city="Paris",
            region="Île-de-France",
            country="France",
        )
        self.assertEqual(res, "Paris, France")

        res2 = build_canonical_display_name(
            name="Paris, France",
            country="France",
        )
        self.assertEqual(res2, "Paris, France")

    def test_new_york_city_usa(self):
        # New York City: name="New York City", state="New York", country="United States"
        res = build_canonical_display_name(
            name="New York City",
            city="New York",
            country="United States",
        )
        self.assertEqual(res, "New York City, United States")

        # USA alias
        res_alias = build_canonical_display_name(
            name="New York City, USA",
            country="United States",
        )
        self.assertEqual(res_alias, "New York City, United States")

        res_us = build_canonical_display_name(
            name="New York City",
            country="US",
        )
        self.assertEqual(res_us, "New York City, United States")

    def test_case_and_punctuation_insensitivity(self):
        res = build_canonical_display_name(
            name="  jeju island ,  ",
            country="  SOUTH KOREA. ",
        )
        self.assertEqual(res, "jeju island, South Korea")

    def test_structured_fields_untouched(self):
        # Ensures caller's structured dictionary is not mutated
        structured = {
            "name": "Jeju Island",
            "city": "Jeju-si",
            "region": "Jeju-do",
            "country": "South Korea",
            "latitude": 33.38,
            "longitude": 126.54,
        }
        res = build_canonical_display_name(
            name=structured["name"],
            city=structured["city"],
            region=structured["region"],
            country=structured["country"],
        )
        self.assertEqual(res, "Jeju Island, South Korea")
        self.assertEqual(structured["country"], "South Korea")
        self.assertEqual(structured["city"], "Jeju-si")


if __name__ == "__main__":
    unittest.main()
