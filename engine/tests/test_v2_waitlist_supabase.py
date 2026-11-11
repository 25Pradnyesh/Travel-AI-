"""
Travel AI V2 — Supabase Waitlist Signups Schema & Security Validation Tests (Stage 3)

Verifies:
1. Migration file exists: supabase/migrations/20261103000000_waitlist_signups.sql.
2. public.waitlist_signups table is defined with all required columns.
3. Case-insensitive unique index on LOWER(BTRIM(email)).
4. Descending created_at index for performant backups and admin review.
5. Row Level Security is explicitly enabled.
6. Direct client roles (anon, authenticated) are revoked.
7. Backend service_role is granted administrative authority.
8. Consolidated supabase/schema.sql accurately mirrors the migration.
"""

from pathlib import Path
import re
import unittest


class TestWaitlistSupabaseSchema(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.repo_root = Path(__file__).resolve().parent.parent.parent
        cls.migration_file = (
            cls.repo_root / "supabase" / "migrations" / "20261103000000_waitlist_signups.sql"
        )
        cls.schema_file = cls.repo_root / "supabase" / "schema.sql"

    def test_migration_file_exists(self):
        """Verify the waitlist migration file exists."""
        self.assertTrue(
            self.migration_file.exists(),
            f"Waitlist migration file missing: {self.migration_file}",
        )

    def test_table_definition_and_columns(self):
        """Verify waitlist_signups table and columns match specification."""
        content = self.migration_file.read_text(encoding="utf-8")
        
        self.assertRegex(
            content,
            re.compile(r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?public\.waitlist_signups\b", re.IGNORECASE),
            "Missing CREATE TABLE public.waitlist_signups",
        )
        
        expected_columns = [
            r"id\s+UUID\s+PRIMARY\s+KEY\s+DEFAULT\s+gen_random_uuid\(\)",
            r"email\s+TEXT\s+NOT\s+NULL",
            r"created_at\s+TIMESTAMPTZ\s+NOT\s+NULL",
            r"source\s+TEXT\s+NOT\s+NULL\s+DEFAULT\s+'website'",
            r"consent\s+BOOLEAN\s+NOT\s+NULL\s+DEFAULT\s+true",
            r"consent_at\s+TIMESTAMPTZ\s+NOT\s+NULL",
            r"status\s+TEXT\s+NOT\s+NULL\s+DEFAULT\s+'active'",
            r"unsubscribed_at\s+TIMESTAMPTZ",
        ]
        for pattern in expected_columns:
            self.assertRegex(content, re.compile(pattern, re.IGNORECASE), f"Missing column matching: {pattern}")

    def test_indexes_defined(self):
        """Verify lowercase unique index and created_at index exist."""
        content = self.migration_file.read_text(encoding="utf-8")
        
        self.assertRegex(
            content,
            re.compile(
                r"CREATE\s+UNIQUE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?idx_waitlist_signups_email_lower\s+ON\s+public\.waitlist_signups\s*\(\s*LOWER\s*\(\s*BTRIM\s*\(\s*email\s*\)\s*\)\s*\);",
                re.IGNORECASE,
            ),
            "Missing unique index on LOWER(BTRIM(email))",
        )
        
        self.assertRegex(
            content,
            re.compile(
                r"CREATE\s+INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?idx_waitlist_signups_created_at\s+ON\s+public\.waitlist_signups\s*\(\s*created_at\s+DESC\s*\);",
                re.IGNORECASE,
            ),
            "Missing descending index on created_at",
        )

    def test_security_and_rls(self):
        """Verify RLS is enabled, public/anon access revoked, and service_role granted."""
        content = self.migration_file.read_text(encoding="utf-8")
        
        self.assertRegex(
            content,
            re.compile(r"ALTER\s+TABLE\s+public\.waitlist_signups\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY;", re.IGNORECASE),
            "Missing ENABLE ROW LEVEL SECURITY on waitlist_signups",
        )
        
        self.assertRegex(
            content,
            re.compile(r"REVOKE\s+ALL\s+ON\s+public\.waitlist_signups\s+FROM\s+anon,\s*authenticated;", re.IGNORECASE),
            "Missing REVOKE ALL FROM anon, authenticated on waitlist_signups",
        )
        
        self.assertRegex(
            content,
            re.compile(r"GRANT\s+ALL\s+ON\s+public\.waitlist_signups\s+TO\s+service_role;", re.IGNORECASE),
            "Missing GRANT ALL TO service_role on waitlist_signups",
        )

    def test_consolidated_schema_consistency(self):
        """Verify that consolidated schema.sql includes waitlist table and RLS permissions."""
        schema_content = self.schema_file.read_text(encoding="utf-8")
        
        self.assertIn("waitlist_signups", schema_content)
        self.assertIn("idx_waitlist_signups_email_lower", schema_content)
        self.assertIn("ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;", schema_content)
        self.assertIn("REVOKE ALL ON public.waitlist_signups FROM anon, authenticated;", schema_content)
        self.assertIn("GRANT ALL ON public.waitlist_signups TO service_role;", schema_content)

    def test_migration_sql_syntax_cleanliness(self):
        """Verify migration file contains clean, terminating SQL without stray tokens."""
        content = self.migration_file.read_text(encoding="utf-8").strip()
        self.assertTrue(content.endswith(";"), "Migration must terminate with a valid SQL statement ending in ';'")
        self.assertNotIn("`", content, "Migration must not contain stray Markdown backticks")

    def test_waitlist_api_route_contract(self):
        """Verify waitlist API route handler implements RLS service role isolation and 23505 duplicate handling."""
        route_file = self.repo_root / "landing" / "app" / "api" / "waitlist" / "route.ts"
        self.assertTrue(route_file.exists(), f"Route file missing: {route_file}")
        route_content = route_file.read_text(encoding="utf-8")
        
        # Must catch Postgres 23505 unique_violation
        self.assertIn("23505", route_content)
        self.assertIn("idx_waitlist_signups_email_lower", route_content)
        
        # Must use getSupabaseServerClient with service role
        self.assertIn("getSupabaseServerClient", route_content)
        
        # Must enforce rate limiting and consent
        self.assertIn("isRateLimited", route_content)
        self.assertIn("consent !== true", route_content)


if __name__ == "__main__":
    unittest.main()

