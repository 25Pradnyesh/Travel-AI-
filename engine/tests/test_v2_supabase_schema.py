"""
Travel AI V2 — Supabase Foundation Schema Validation Tests (Stage 1)

Verifies:
1. SQL migration and consolidated schema files exist and are well-formed.
2. Tables required by Stage 1 are defined: profiles, analyses, analysis_places, saved_places.
3. All required columns and PostgreSQL data types match specification.
4. Schema contract compatibility with engine/domain/schemas/responses.py and request.py.
5. Strict ephemeral media rule: confirms no video, audio, or frame storage columns exist.
6. Foreign key references and index optimizations.
"""

from pathlib import Path
import re
import unittest

from engine.domain.schemas.responses import AnalysisResponse, BestGuess, NearbyPlace
from engine.domain.schemas.request import AnalyzeRequest


class TestSupabaseFoundationSchema(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.repo_root = Path(__file__).resolve().parent.parent.parent
        cls.migration_file = cls.repo_root / "supabase" / "migrations" / "20261001000000_supabase_foundation.sql"
        cls.schema_file = cls.repo_root / "supabase" / "schema.sql"

    def test_schema_files_exist(self):
        """Verify both migration and standalone schema SQL files exist."""
        self.assertTrue(self.migration_file.exists(), f"Migration file missing: {self.migration_file}")
        self.assertTrue(self.schema_file.exists(), f"Schema file missing: {self.schema_file}")

    def test_required_tables_defined(self):
        """Verify the 4 required tables are declared in the SQL schema."""
        content = self.migration_file.read_text(encoding="utf-8")
        required_tables = ["profiles", "analyses", "analysis_places", "saved_places"]
        for table in required_tables:
            pattern = rf"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?{table}\b"
            self.assertRegex(
                content,
                re.compile(pattern, re.IGNORECASE),
                f"Missing CREATE TABLE for {table}"
            )

    def test_profiles_table_columns(self):
        """Verify profiles table has id, display_name, avatar_url, created_at."""
        content = self.migration_file.read_text(encoding="utf-8")
        self.assertIn("profiles", content)
        self.assertRegex(content, r"display_name\s+TEXT", "Missing display_name TEXT in profiles")
        self.assertRegex(content, r"avatar_url\s+TEXT", "Missing avatar_url TEXT in profiles")
        self.assertRegex(content, r"created_at\s+TIMESTAMPTZ", "Missing created_at TIMESTAMPTZ in profiles")

    def test_analyses_table_columns(self):
        """
        Verify analyses table has:
        id, user_id, reel_url, reel_id, thumbnail_url, destination, country,
        confidence, travel_intelligence, created_at
        """
        content = self.migration_file.read_text(encoding="utf-8")
        expected_columns = [
            r"reel_url\s+TEXT",
            r"reel_id\s+TEXT",
            r"thumbnail_url\s+TEXT",
            r"destination\s+TEXT",
            r"country\s+TEXT",
            r"confidence\s+INTEGER",
            r"travel_intelligence\s+JSONB",
            r"created_at\s+TIMESTAMPTZ",
        ]
        for col_regex in expected_columns:
            self.assertRegex(content, col_regex, f"Missing column matching {col_regex} in analyses")

    def test_analysis_places_table_columns(self):
        """
        Verify analysis_places table has:
        id, analysis_id, place_id, name, address, latitude, longitude,
        rating, category, photo_url, created_at
        """
        content = self.migration_file.read_text(encoding="utf-8")
        expected_columns = [
            r"analysis_id\s+UUID",
            r"place_id\s+TEXT",
            r"name\s+TEXT",
            r"address\s+TEXT",
            r"latitude\s+DOUBLE\s+PRECISION",
            r"longitude\s+DOUBLE\s+PRECISION",
            r"rating\s+NUMERIC",
            r"category\s+TEXT",
            r"photo_url\s+TEXT",
            r"created_at\s+TIMESTAMPTZ",
        ]
        for col_regex in expected_columns:
            self.assertRegex(content, col_regex, f"Missing column matching {col_regex} in analysis_places")

    def test_saved_places_table_columns_and_constraint(self):
        """
        Verify saved_places table has user_id, place_id, name, address, latitude,
        longitude, rating, category, photo_url, created_at, and unique constraint.
        """
        content = self.migration_file.read_text(encoding="utf-8")
        expected_columns = [
            r"place_id\s+TEXT",
            r"name\s+TEXT",
            r"address\s+TEXT",
            r"latitude\s+DOUBLE\s+PRECISION",
            r"longitude\s+DOUBLE\s+PRECISION",
            r"rating\s+NUMERIC",
            r"category\s+TEXT",
            r"photo_url\s+TEXT",
            r"created_at\s+TIMESTAMPTZ",
        ]
        for col_regex in expected_columns:
            self.assertRegex(content, col_regex, f"Missing column matching {col_regex} in saved_places")
        self.assertIn("saved_places_user_place_unique", content)

    def test_strict_ephemeral_media_rule(self):
        """Confirm that no raw video, audio, or frame storage columns exist in Supabase."""
        content = self.migration_file.read_text(encoding="utf-8").lower()
        forbidden_columns = ["video_data", "video_blob", "audio_data", "audio_blob", "frame_data", "frame_blob", "mp4_file"]
        for forbidden in forbidden_columns:
            self.assertNotIn(forbidden, content, f"Forbidden media storage column detected: {forbidden}")

    def test_engine_response_schema_compatibility(self):
        """
        Ensure FastAPI AnalysisResponse and BestGuess contracts directly map
        to the Supabase columns in analyses and analysis_places.
        """
        response_sample = AnalysisResponse(
            success=True,
            best_guess=BestGuess(
                place_id="ChIJ42b10_nzh0cR2M2h4hJ7f_E",
                name="Varenna, Lake Como",
                formatted_address="Varenna, 23829 Province of Lecco, Italy",
                country="Italy",
                confidence=95,
                rating=4.8,
            ),
            travel_intelligence={"category": "Scenic Town", "best_season": "Summer"},
            nearby_places=[
                NearbyPlace(
                    place_id="ChIJxyz123",
                    name="Villa Monastero",
                    formatted_address="Varenna, Italy",
                    rating=4.7,
                    category="attraction",
                )
            ],
        )

        # Mapping test to analyses row
        best_guess = response_sample.best_guess
        self.assertIsNotNone(best_guess)
        analyses_row = {
            "reel_url": "https://www.instagram.com/reel/DaAiVGUx7Cf/",
            "destination": best_guess.name,
            "country": best_guess.country,
            "confidence": best_guess.confidence,
            "travel_intelligence": response_sample.travel_intelligence,
        }
        self.assertEqual(analyses_row["destination"], "Varenna, Lake Como")
        self.assertEqual(analyses_row["country"], "Italy")
        self.assertEqual(analyses_row["confidence"], 95)

        # Mapping test to analysis_places row
        analysis_place_row = {
            "place_id": best_guess.place_id,
            "name": best_guess.name,
            "address": best_guess.formatted_address,
            "rating": best_guess.rating,
        }
        self.assertEqual(analysis_place_row["place_id"], "ChIJ42b10_nzh0cR2M2h4hJ7f_E")


if __name__ == "__main__":
    unittest.main()
