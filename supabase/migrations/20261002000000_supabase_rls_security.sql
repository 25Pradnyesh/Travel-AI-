-- ==============================================================================
-- Travel AI V2 — Supabase Database Security & Row Level Security (Stage 2)
-- Migration: 20261002000000_supabase_rls_security.sql
-- Description: Enables Row Level Security (RLS) on profiles, analyses,
--              analysis_places, and saved_places tables. Establishes least-privilege
--              access policies for authenticated users and blocks unauthenticated access.
-- ==============================================================================

-- ==============================================================================
-- 1. Enable Row Level Security (RLS) on All Tables
-- When RLS is enabled, all rows are inaccessible by default unless permitted
-- by an explicit policy. Unauthenticated (anon) requests have zero access.
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 2. Profiles Table Policies
-- - Authenticated users can view their own profile.
-- - Authenticated users can insert their own profile matching auth.uid().
-- - Authenticated users can update their own profile; identity immutability is
--   enforced via WITH CHECK (auth.uid() = id) to prevent identity hijacking.
-- - Authenticated users can delete their own profile.
-- ==============================================================================
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
CREATE POLICY "profiles_select_own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_own" ON public.profiles;
CREATE POLICY "profiles_delete_own"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- ==============================================================================
-- 3. Analyses Table Policies
-- - Authenticated users can view, insert, update, and delete only rows
--   where user_id = auth.uid().
-- - WITH CHECK ensures a user cannot insert or reassign analyses to another user.
-- ==============================================================================
DROP POLICY IF EXISTS "analyses_select_own" ON public.analyses;
CREATE POLICY "analyses_select_own"
ON public.analyses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "analyses_insert_own" ON public.analyses;
CREATE POLICY "analyses_insert_own"
ON public.analyses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "analyses_update_own" ON public.analyses;
CREATE POLICY "analyses_update_own"
ON public.analyses
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "analyses_delete_own" ON public.analyses;
CREATE POLICY "analyses_delete_own"
ON public.analyses
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- ==============================================================================
-- 4. Analysis Places Table Policies (Granular Points of Interest)
-- - Parent-child authorization: users can access rows only when their parent
--   analysis record belongs to auth.uid().
-- - WITH CHECK prevents inserting child POIs linked to another user's analysis.
-- ==============================================================================
DROP POLICY IF EXISTS "analysis_places_select_own" ON public.analysis_places;
CREATE POLICY "analysis_places_select_own"
ON public.analysis_places
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.analyses
        WHERE public.analyses.id = public.analysis_places.analysis_id
          AND public.analyses.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "analysis_places_insert_own" ON public.analysis_places;
CREATE POLICY "analysis_places_insert_own"
ON public.analysis_places
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.analyses
        WHERE public.analyses.id = public.analysis_places.analysis_id
          AND public.analyses.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "analysis_places_update_own" ON public.analysis_places;
CREATE POLICY "analysis_places_update_own"
ON public.analysis_places
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.analyses
        WHERE public.analyses.id = public.analysis_places.analysis_id
          AND public.analyses.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.analyses
        WHERE public.analyses.id = public.analysis_places.analysis_id
          AND public.analyses.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "analysis_places_delete_own" ON public.analysis_places;
CREATE POLICY "analysis_places_delete_own"
ON public.analysis_places
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.analyses
        WHERE public.analyses.id = public.analysis_places.analysis_id
          AND public.analyses.user_id = auth.uid()
    )
);

-- ==============================================================================
-- 5. Saved Places Table Policies (User Bookmarks)
-- - Authenticated users can view, insert, update, and delete only their own
--   bookmarked places where user_id = auth.uid().
-- - WITH CHECK ensures bookmarks cannot be created or modified under other users.
-- ==============================================================================
DROP POLICY IF EXISTS "saved_places_select_own" ON public.saved_places;
CREATE POLICY "saved_places_select_own"
ON public.saved_places
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_places_insert_own" ON public.saved_places;
CREATE POLICY "saved_places_insert_own"
ON public.saved_places
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_places_update_own" ON public.saved_places;
CREATE POLICY "saved_places_update_own"
ON public.saved_places
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "saved_places_delete_own" ON public.saved_places;
CREATE POLICY "saved_places_delete_own"
ON public.saved_places
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
