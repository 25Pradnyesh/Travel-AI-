-- ==============================================================================
-- Travel AI V2 — Supabase Waitlist Signups Schema (Stage 3)
-- Migration: 20261103000000_waitlist_signups.sql
-- Description: Stores early access waitlist registrations from the landing page.
--              Enforces case-insensitive email uniqueness, explicit marketing consent,
--              Row Level Security (RLS) isolation, and backend service-role access.
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. Waitlist Signups Table
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.waitlist_signups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    source TEXT NOT NULL DEFAULT 'website',
    consent BOOLEAN NOT NULL DEFAULT true,
    consent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed')),
    unsubscribed_at TIMESTAMPTZ
);

-- ==============================================================================
-- 2. Indexes for Performance & Data Integrity
-- - Unique index on lowercase trimmed email guarantees zero duplicates.
-- - Descending created_at index optimizes export, pagination, and admin triage.
-- ==============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_waitlist_signups_email_lower 
    ON public.waitlist_signups (LOWER(BTRIM(email)));

CREATE INDEX IF NOT EXISTS idx_waitlist_signups_created_at 
    ON public.waitlist_signups (created_at DESC);

-- ==============================================================================
-- 3. Row Level Security (RLS) & Access Control
-- - By default, enabling RLS blocks all operations.
-- - Anonymously and Authenticated clients on the web are completely locked out
--   to prevent subscriber harvesting, scraping, or client-side tampering.
-- - Only trusted backend server routes utilizing the SUPABASE_SERVICE_ROLE_KEY
--   can insert, query, or manage waitlist entries.
-- ==============================================================================
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;

-- Revoke all direct permissions from anon and authenticated client roles
REVOKE ALL ON public.waitlist_signups FROM anon, authenticated;

-- Grant full management permissions strictly to service_role (backend API)
GRANT ALL ON public.waitlist_signups TO service_role;

 `