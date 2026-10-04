-- ==============================================================================
-- Travel AI V2 — Supabase Consolidated Schema (Stages 1 & 2)
-- File: supabase/schema.sql
-- Description: Core cloud tables, performance indexes, and Row Level Security
--              (RLS) access control policies for profiles, analyses,
--              analysis_places, and saved_places.
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. Profiles Table
-- Stores user identity and presentation metadata linked to Supabase Auth.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 2. Analyses Table
-- Stores historical high-level Reel analysis records.
-- NOTE: Raw videos, extracted frames, and audio files are strictly ephemeral
-- and are NEVER stored in Supabase. Only structured intelligence is persisted.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    reel_url TEXT NOT NULL,
    reel_id TEXT,
    thumbnail_url TEXT,
    destination TEXT NOT NULL,
    country TEXT,
    confidence INTEGER CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 100)),
    travel_intelligence JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. Analysis Places Table
-- Stores granular points of interest (best guess & nearby places) associated
-- with an analysis run.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.analysis_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id UUID NOT NULL REFERENCES public.analyses(id) ON DELETE CASCADE,
    place_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    rating NUMERIC(3, 2),
    category TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. Saved Places Table
-- Bookmarked places saved by users for offline or future reference.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.saved_places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    place_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    rating NUMERIC(3, 2),
    category TEXT,
    photo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT saved_places_user_place_unique UNIQUE (user_id, place_id)
);

-- ==============================================================================
-- Indexes for Performance & Query Optimization
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_places_analysis_id ON public.analysis_places(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_places_place_id ON public.analysis_places(place_id);
CREATE INDEX IF NOT EXISTS idx_saved_places_user_id ON public.saved_places(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_places_place_id ON public.saved_places(place_id);

-- ==============================================================================
-- Row Level Security (RLS) Enablement (Stage 2)
-- All tables are private by default. Unauthenticated (anon) requests have zero access.
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_places ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_places ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Profiles Table Policies
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- Analyses Table Policies
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- Analysis Places Table Policies
-- ------------------------------------------------------------------------------
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

-- ------------------------------------------------------------------------------
-- Saved Places Table Policies
-- ------------------------------------------------------------------------------
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
