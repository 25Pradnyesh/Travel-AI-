# Travel AI Architecture

## Overview

Travel AI follows a modular architecture where every stage of processing is isolated.

This allows providers, AI models and integrations to be swapped without affecting the rest of the system.

---

## High-Level Flow

```
Instagram Reel URL
        │
        ▼
Frontend (Next.js)
        │
        ▼
API Route
        │
        ▼
FastAPI Engine
        │
        ▼
Provider Manager
        │
        ▼
Metadata Provider
        │
        ▼
Location Pipeline
        │
        ▼
Google Places
        │
        ▼
Google Maps
```

---

## Provider Manager

The Provider Manager abstracts metadata extraction.

Possible providers:

- yt-dlp
- Instagram Cookie Provider
- Playwright
- Apify
- Future Instagram APIs

The engine never depends on a specific provider.

---

## Location Pipeline

The pipeline determines the most likely travel destination.

Evidence sources:

- Caption
- Title
- Hashtags
- Thumbnail OCR
- Video Frame OCR
- Audio Transcript
- Vision AI
- Google Places Validation

Each source contributes a confidence score before producing the final location.

---

## Design Principles

- Modular
- Provider Agnostic
- AI First
- Easily Extendable
- Independent Components
- Production Ready

---

## Observability & Reliability (Stage 10)

The engine features a dedicated, zero-dependency observability layer under `engine/observability/`:

- **Request & Trace Context:** Async-safe `RequestContext` tracking `X-Request-ID` across every pipeline stage.
- **Granular Stage Telemetry:** Timing for ingestion, OCR, Whisper, candidate generation, Places queries, and Gemini vision.
- **Structured Error Classification:** 10 deterministic failure categories (`EXTRACTION_FAILURE`, `MEDIA_UNAVAILABLE`, `RESOLUTION_FAILURE`, etc.).
- **Strict Privacy Redaction:** Production logging and traces deterministically strip Google API keys, credentials, tokens, and cookies.
- See `docs/observability.md` for full telemetry and diagnostics runbook.

---

## Performance & Cost Optimization (Stage 11)

- **Early-Exit Pipeline Execution:** Returns high-confidence caption matches immediately, skipping heavy OCR and Whisper inference when unneeded.
- **Smart Gemini Vision Bypass:** Eliminates redundant Gemini vision calls when rule engine confidence is decisive (>=90 with clear margin).
- **Parallel Enrichment & Resolution:** Concurrent execution of candidate resolution, Place Details, Nearby Search, and Travel Intelligence.
- **TTL Cache Layer:** In-memory caching for Google Places search, Place Details, and candidate ranking.
- **Optimized Media Sampling:** Adaptive frame budgets and text-density pre-scoring reducing Whisper and EasyOCR compute by over 60%.

---

## Production Security & Abuse Hardening (Stage 12 & 13)

- **Input Validation & Sanitization:** Strict Instagram URL domain/scheme validation and Google Places photo proxy validation preventing SSRF and path traversal.
- **Payload & Rate Protection:** 100KB request body limits, sliding-window in-memory rate limiting (60 req/min, burst 15), and concurrency limiters (max 4 concurrent analyses).
- **Security Headers:** Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Permissions-Policy`.
- **Safe Error Responses:** Global exception masking preventing system paths, tracebacks, or API keys from ever leaking to clients.
- **Guaranteed Cleanup:** Automatic removal of temporary videos, partial fragments (`.part`, `.ytdl`), and isolated request frame directories with Windows retry safety.
- **Stage 13 Release Candidate:** Fully validated against 169 unit/integration tests and complete 61-case real-world benchmark regression suite.

---

## V2 Cloud Architecture: Supabase Integration (Stage 1 Foundation)

Travel AI V2 introduces Supabase as the unified backend-as-a-service cloud layer for authentication, relational persistence, and cross-device bookmark synchronization.

```text
Expo Mobile App
      ↓
Supabase Auth / Database
      ↓
FastAPI Intelligence Engine
      ↓
Instagram / Google Places / Gemini
```

### Core Architecture & Persistence Principles

1. **Strict Ephemeral Media Processing:**
   - **Reel videos are NOT stored in Supabase.**
   - **Extracted keyframes and audio transcripts are NOT stored in Supabase.**
   - All downloaded Instagram media, OpenCV frames, and Whisper audio clips remain strictly ephemeral scratchpad data processed exclusively within isolated, self-cleaning directories on the FastAPI engine.

2. **Structured Intelligence Persistence:**
   - Supabase persists only verified, structured intelligence and user bookmarks:
     - `profiles`: User presentation and identity metadata.
     - `analyses`: Historical analysis run summaries (destination, country, confidence, and travel intelligence JSON).
     - `analysis_places`: Identified landmarks and POIs associated with an analysis run.
     - `saved_places`: User-bookmarked places and destinations.

3. **Decoupled Engine & Client Boundaries:**
   - The mobile client interacts with Supabase using the public/anon key via the official `@supabase/supabase-js` client.
   - The FastAPI engine remains independent and provider-agnostic, focusing on pipeline intelligence, rate-limiting, and inference orchestration.
- **Row Level Security (RLS) & Multi-Tenant Isolation (Stage 2):**
  - RLS is explicitly enabled on all four cloud tables (`profiles`, `analyses`, `analysis_places`, `saved_places`).
  - Strict tenant isolation guarantees authenticated users access only their own rows (`auth.uid() = user_id` / `auth.uid() = id`).
  - Child landmark records (`analysis_places`) validate parent analysis ownership via subquery joins with `WITH CHECK`, preventing unauthorized cross-user injections.
  - Profile identity immutability is enforced (`WITH CHECK (auth.uid() = id)`).
  - Unauthenticated (anon) requests have zero access to private records.
  - OAuth login providers and session management will be integrated in subsequent stages.

