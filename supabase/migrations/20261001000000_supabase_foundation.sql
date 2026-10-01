-- ==============================================================================
-- Travel AI V2 — Supabase Foundation Schema (Stage 1)
-- Migration: 20261001000000_supabase_foundation.sql
-- Description: Core cloud tables for profiles, analyses, analysis_places, and saved_places.
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

-- Note: Row Level Security (RLS) policies and OAuth authentication hooks are intentionally
-- excluded in Stage 1 and will be introduced in subsequent stages.
