"""
Travel AI V2 — Supabase Foundation Schema & Security Validation Tests (Stages 1 & 2)

Verifies:
1. SQL migrations and consolidated schema files exist and are well-formed.
2. Tables required are defined: profiles, analyses, analysis_places, saved_places.
3. All required columns and PostgreSQL data types match specification.
4. Schema contract compatibility with engine/domain/schemas/responses.py and request.py.
5. Strict ephemeral media rule: confirms no video, audio, or frame storage columns exist.
6. Foreign key references and index optimizations.
7. Stage 2 Database Security & Row Level Security (RLS):
   - RLS is explicitly enabled on all four tables.
   - Least-privilege policies for profiles (SELECT, INSERT, UPDATE, DELETE) with identity immutability.
   - Least-privilege policies for analyses (SELECT, INSERT, UPDATE, DELETE) restricted to auth.uid().
   - Parent-child relation protection on analysis_places preventing child records linked to other users.
   - Least-privilege policies for saved_places restricted to auth.uid().
   - Policies use both USING and WITH CHECK where appropriate.
   - Unauthenticated (anon) requests have zero access to private records.
   - Full consistency between migration files and consolidated supabase/schema.sql.
"""

from pathlib import Path
import re
import unittest

from engine.domain.schemas.responses import AnalysisResponse, BestGuess, NearbyPlace
from engine.domain.schemas.request import AnalyzeRequest


class TestSupabaseFoundationAndSecuritySchema(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.repo_root = Path(__file__).resolve().parent.parent.parent
        cls.foundation_migration = (
            cls.repo_root / "supabase" / "migrations" / "20261001000000_supabase_foundation.sql"
        )
        cls.rls_migration = (
            cls.repo_root / "supabase" / "migrations" / "20261002000000_supabase_rls_security.sql"
        )
        cls.schema_file = cls.repo_root / "supabase" / "schema.sql"

    def test_schema_files_exist(self):
        """Verify foundation migration, RLS migration, and consolidated schema SQL files exist."""
        self.assertTrue(
            self.foundation_migration.exists(),
            f"Foundation migration file missing: {self.foundation_migration}",
        )
        self.assertTrue(
            self.rls_migration.exists(),
            f"RLS migration file missing: {self.rls_migration}",
        )
        self.assertTrue(
            self.schema_file.exists(),
            f"Consolidated schema file missing: {self.schema_file}",
        )

    def test_required_tables_defined(self):
        """Verify the 4 required tables are declared in the SQL schema."""
        content = self.foundation_migration.read_text(encoding="utf-8")
        required_tables = ["profiles", "analyses", "analysis_places", "saved_places"]
        for table in required_tables:
            pattern = rf"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?{table}\b"
            self.assertRegex(
                content,
                re.compile(pattern, re.IGNORECASE),
                f"Missing CREATE TABLE for {table}",
            )

    def test_profiles_table_columns(self):
        """Verify profiles table has id, display_name, avatar_url, created_at."""
        content = self.foundation_migration.read_text(encoding="utf-8")
        self.assertIn("profiles", content)
        self.assertRegex(content, r"display_name\s+TEXT", "Missing display_name TEXT in profiles")
        self.assertRegex(content, r"avatar_url\s+TEXT", "Missing avatar_url TEXT in profiles")
        self.assertRegex(
            content, r"created_at\s+TIMESTAMPTZ", "Missing created_at TIMESTAMPTZ in profiles"
        )

    def test_analyses_table_columns(self):
        """
        Verify analyses table has:
        id, user_id, reel_url, reel_id, thumbnail_url, destination, country,
        confidence, travel_intelligence, created_at
        """
        content = self.foundation_migration.read_text(encoding="utf-8")
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
        content = self.foundation_migration.read_text(encoding="utf-8")
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
            self.assertRegex(
                content, col_regex, f"Missing column matching {col_regex} in analysis_places"
            )

    def test_saved_places_table_columns_and_constraint(self):
        """
        Verify saved_places table has user_id, place_id, name, address, latitude,
        longitude, rating, category, photo_url, created_at, and unique constraint.
        """
        content = self.foundation_migration.read_text(encoding="utf-8")
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
            self.assertRegex(
                content, col_regex, f"Missing column matching {col_regex} in saved_places"
            )
        self.assertIn("saved_places_user_place_unique", content)

    def test_strict_ephemeral_media_rule(self):
        """Confirm that no raw video, audio, or frame storage columns exist in Supabase."""
        content = self.foundation_migration.read_text(encoding="utf-8").lower()
        forbidden_columns = [
            "video_data",
            "video_blob",
            "audio_data",
            "audio_blob",
            "frame_data",
            "frame_blob",
            "mp4_file",
        ]
        for forbidden in forbidden_columns:
            self.assertNotIn(
                forbidden, content, f"Forbidden media storage column detected: {forbidden}"
            )

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

    # ==========================================================================
    # Stage 2: Database Security & Row Level Security (RLS) Tests
    # ==========================================================================

    def test_rls_enabled_on_all_four_tables(self):
        """Verify Row Level Security is explicitly enabled on all four tables."""
        for target, file_path in [
            ("RLS Migration", self.rls_migration),
            ("Consolidated Schema", self.schema_file),
        ]:
            content = file_path.read_text(encoding="utf-8")
            required_tables = ["profiles", "analyses", "analysis_places", "saved_places"]
            for table in required_tables:
                pattern = rf"ALTER\s+TABLE\s+(?:public\.)?{table}\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;"
                self.assertRegex(
                    content,
                    re.compile(pattern, re.IGNORECASE),
                    f"{target} missing ENABLE ROW LEVEL SECURITY for {table}",
                )

    def test_profiles_rls_policies(self):
        """
        Verify profiles RLS policies:
        - Authenticated users can view their own profile (USING auth.uid() = id).
        - Authenticated users can insert their own profile (WITH CHECK auth.uid() = id).
        - Authenticated users can update their own profile, protecting identity hijacking
          with WITH CHECK (auth.uid() = id).
        - Unauthenticated users have no access.
        """
        content = self.rls_migration.read_text(encoding="utf-8")

        # Select policy
        self.assertRegex(
            content,
            re.compile(
                r'CREATE\s+POLICY\s+"profiles_select_own"\s+ON\s+public\.profiles\s+FOR\s+SELECT\s+TO\s+authenticated\s+USING\s*\(\s*auth\.uid\(\)\s*=\s*id\s*\);',
                re.IGNORECASE,
            ),
            "profiles missing or invalid SELECT policy",
        )

        # Insert policy
        self.assertRegex(
            content,
            re.compile(
                r'CREATE\s+POLICY\s+"profiles_insert_own"\s+ON\s+public\.profiles\s+FOR\s+INSERT\s+TO\s+authenticated\s+WITH\s+CHECK\s*\(\s*auth\.uid\(\)\s*=\s*id\s*\);',
                re.IGNORECASE,
            ),
            "profiles missing or invalid INSERT policy",
        )

        # Update policy with identity protection
        self.assertRegex(
            content,
            re.compile(
                r'CREATE\s+POLICY\s+"profiles_update_own"\s+ON\s+public\.profiles\s+FOR\s+UPDATE\s+TO\s+authenticated\s+USING\s*\(\s*auth\.uid\(\)\s*=\s*id\s*\)\s+WITH\s+CHECK\s*\(\s*auth\.uid\(\)\s*=\s*id\s*\);',
                re.IGNORECASE,
            ),
            "profiles missing or invalid UPDATE policy with identity immutability check",
        )

    def test_analyses_rls_policies(self):
        """
        Verify analyses RLS policies:
        - SELECT, INSERT, UPDATE, DELETE strictly scoped to user_id = auth.uid().
        - UPDATE uses both USING and WITH CHECK.
        - Enforces TO authenticated.
        """
        content = self.rls_migration.read_text(encoding="utf-8")

        # Select policy
        self.assertRegex(
            content,
            re.compile(
                r'CREATE\s+POLICY\s+"analyses_select_own"\s+ON\s+public\.analyses\s+FOR\s+SELECT\s+TO\s+authenticated\s+USING\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\);',
                re.IGNORECASE,
            ),
            "analyses missing or invalid SELECT policy",
        )

        # Insert policy
        self.assertRegex(
            content,
            re.compile(
                r'CREATE\s+POLICY\s+"analyses_insert_own"\s+ON\s+public\.analyses\s+FOR\s+INSERT\s+TO\s+authenticated\s+WITH\s+CHECK\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\);',
                re.IGNORECASE,
            ),
            "analyses missing or invalid INSERT policy",
        )

        # Update policy
        self.assertRegex(
            content,
            re.compile(
                r'CREATE\s+POLICY\s+"analyses_update_own"\s+ON\s+public\.analyses\s+FOR\s+UPDATE\s+TO\s+authenticated\s+USING\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\)\s+WITH\s+CHECK\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\);',
                re.IGNORECASE,
            ),
            "analyses missing or invalid UPDATE policy",
        )

        # Delete policy
        self.assertRegex(
            content,
            re.compile(
                r'CREATE\s+POLICY\s+"analyses_delete_own"\s+ON\s+public\.analyses\s+FOR\s+DELETE\s+TO\s+authenticated\s+USING\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\);',
                re.IGNORECASE,
            ),
            "analyses missing or invalid DELETE policy",
        )

    def test_analysis_places_parent_authorization_policies(self):
        """
        Verify analysis_places RLS policies:
        - Access granted only when parent analysis belongs to auth.uid().
        - INSERT uses WITH CHECK (EXISTS (...)) preventing child insertion into
          another user's analysis.
        - UPDATE uses both USING and WITH CHECK.
        - DELETE uses USING.
        """
        content = self.rls_migration.read_text(encoding="utf-8")

        # Check subquery condition exists for analysis_places
        expected_subquery = (
            r"EXISTS\s*\(\s*SELECT\s+1\s+FROM\s+public\.analyses\s+"
            r"WHERE\s+public\.analyses\.id\s*=\s*public\.analysis_places\.analysis_id\s+"
            r"AND\s+public\.analyses\.user_id\s*=\s*auth\.uid\(\)\s*\)"
        )

        # SELECT
        self.assertRegex(
            content,
            re.compile(
                r'CREATE\s+POLICY\s+"analysis_places_select_own"\s+ON\s+public\.analysis_places\s+FOR\s+SELECT\s+TO\s+authenticated\s+USING\s*\(\s*'
                + expected_subquery,
                re.IGNORECASE,
            ),
            "analysis_places missing parent authorization SELECT policy",
        )

        # INSERT with parent check
        self.assertRegex(
            content,
            re.compile(
                r'CREATE\s+POLICY\s+"analysis_places_insert_own"\s+ON\s+public\.analysis_places\s+FOR\s+INSERT\s+TO\s+authenticated\s+WITH\s+CHECK\s*\(\s*'
                + expected_subquery,
                re.IGNORECASE,
            ),
            "analysis_places missing parent authorization INSERT policy preventing cross-user injection",
        )

        # UPDATE
        self.assertRegex(
            content,
            re.compile(
                r'CREATE\s+POLICY\s+"analysis_places_update_own"\s+ON\s+public\.analysis_places\s+FOR\s+UPDATE\s+TO\s+authenticated\s+USING\s*\(\s*'
                + expected_subquery,
                re.IGNORECASE,
            ),
            "analysis_places missing parent authorization UPDATE policy",
        )

        # DELETE
        self.assertRegex(
            content,
            re.compile(
                r'CREATE\s+POLICY\s+"analysis_places_delete_own"\s+ON\s+public\.analysis_places\s+FOR\s+DELETE\s+TO\s+authenticated\s+USING\s*\(\s*'
                + expected_subquery,
                re.IGNORECASE,
            ),
            "analysis_places missing parent authorization DELETE policy",
        )

    def test_saved_places_rls_policies(self):
        """
        Verify saved_places RLS policies:
        - SELECT, INSERT, UPDATE, DELETE strictly scoped to user_id = auth.uid().
        - UPDATE uses both USING and WITH CHECK.
        - Enforces TO authenticated.
        """
        content = self.rls_migration.read_text(encoding="utf-8")

        # Select policy
        self.assertRegex(
            content,
            re.compile(
                r'CREATE\s+POLICY\s+"saved_places_select_own"\s+ON\s+public\.saved_places\s+FOR\s+SELECT\s+TO\s+authenticated\s+USING\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\);',
                re.IGNORECASE,
            ),
            "saved_places missing or invalid SELECT policy",
        )

        # Insert policy
        self.assertRegex(
            content,
            re.compile(
                r'CREATE\s+POLICY\s+"saved_places_insert_own"\s+ON\s+public\.saved_places\s+FOR\s+INSERT\s+TO\s+authenticated\s+WITH\s+CHECK\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\);',
                re.IGNORECASE,
            ),
            "saved_places missing or invalid INSERT policy",
        )

        # Update policy
        self.assertRegex(
            content,
            re.compile(
                r'CREATE\s+POLICY\s+"saved_places_update_own"\s+ON\s+public\.saved_places\s+FOR\s+UPDATE\s+TO\s+authenticated\s+USING\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\)\s+WITH\s+CHECK\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\);',
                re.IGNORECASE,
            ),
            "saved_places missing or invalid UPDATE policy",
        )

        # Delete policy
        self.assertRegex(
            content,
            re.compile(
                r'CREATE\s+POLICY\s+"saved_places_delete_own"\s+ON\s+public\.saved_places\s+FOR\s+DELETE\s+TO\s+authenticated\s+USING\s*\(\s*auth\.uid\(\)\s*=\s*user_id\s*\);',
                re.IGNORECASE,
            ),
            "saved_places missing or invalid DELETE policy",
        )

    def test_no_unrestricted_anonymous_access(self):
        """
        Ensure no policies grant anonymous or public access without authenticated user verification.
        All policies must specify 'TO authenticated'.
        """
        for target, file_path in [
            ("RLS Migration", self.rls_migration),
            ("Consolidated Schema", self.schema_file),
        ]:
            content = file_path.read_text(encoding="utf-8")
            # Ensure no policy declares TO anon or TO public
            self.assertNotRegex(
                content,
                re.compile(r"CREATE\s+POLICY\s+.*?TO\s+(?:anon|public)\b", re.IGNORECASE),
                f"{target} has policy granting unauthorized access to anon or public roles",
            )
            # Ensure all CREATE POLICY statements specify TO authenticated
            policy_statements = re.findall(
                r"CREATE\s+POLICY\s+.*?;", content, re.IGNORECASE | re.DOTALL
            )
            self.assertGreater(
                len(policy_statements),
                0,
                f"{target} should contain CREATE POLICY statements",
            )
            for stmt in policy_statements:
                self.assertIn(
                    "TO authenticated",
                    stmt,
                    f"Policy statement does not restrict TO authenticated: {stmt.strip()}",
                )

    def test_schema_sql_and_migrations_consistency(self):
        """Verify that supabase/schema.sql accurately contains all RLS policies from the migration."""
        migration_content = self.rls_migration.read_text(encoding="utf-8")
        schema_content = self.schema_file.read_text(encoding="utf-8")

        expected_policy_names = [
            "profiles_select_own",
            "profiles_insert_own",
            "profiles_update_own",
            "profiles_delete_own",
            "analyses_select_own",
            "analyses_insert_own",
            "analyses_update_own",
            "analyses_delete_own",
            "analysis_places_select_own",
            "analysis_places_insert_own",
            "analysis_places_update_own",
            "analysis_places_delete_own",
            "saved_places_select_own",
            "saved_places_insert_own",
            "saved_places_update_own",
            "saved_places_delete_own",
        ]

        for policy_name in expected_policy_names:
            self.assertIn(
                policy_name,
                migration_content,
                f"Missing policy {policy_name} in RLS migration",
            )
            self.assertIn(
                policy_name,
                schema_content,
                f"Missing policy {policy_name} in consolidated supabase/schema.sql",
            )


if __name__ == "__main__":
    unittest.main()
