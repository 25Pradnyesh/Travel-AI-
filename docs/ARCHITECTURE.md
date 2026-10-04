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

- **Apple & Google OAuth Integration & Mobile Session Architecture (Stages 3 & 4):**
  - Unified mobile authentication leverages Supabase Auth with both Google and Apple OAuth providers via `expo-web-browser` and `expo-linking`.
  - Reusable deep-link redirect handling: `travelai://auth/callback` handles PKCE authorization code exchange and implicit token sets for all OAuth providers.
  - Multi-Provider Identity Linking: Supabase automatically links authenticated identities to a unified `auth.users` profile, preserving identical RLS security contracts across all providers.
  - Session restoration: Automatically hydrates valid sessions on app boot from `@react-native-async-storage/async-storage`.
  - **Zero-Friction Guest Mode:** Guest access to Reel analysis, destination exploration, and local bookmarks is 100% preserved. Authentication is strictly opt-in for multi-device sync.
  - Zero Credential Exposure: Google and Apple client secrets, Team IDs, Service IDs, and Private Keys reside exclusively within the Supabase Dashboard.

- **Cloud Analysis History Persistence Architecture (Stage 5):**
  - **Authenticated Cloud Sync:** Signed-in users automatically persist structured Reel analysis results and discovered points of interest to Supabase cloud tables (`analyses` and `analysis_places`).
  - **Zero Cloud Writes for Guests:** Guest analysis remains 100% functional locally with zero Supabase database queries performed.
  - **Strict Ephemeral Media Boundary:** Supabase stores zero raw video files, audio tracks, keyframes, or extracted clips. Only verified destination metadata, coordinates, confidence scores, and travel intelligence JSON are persisted.
  - **Parent-Child RLS Compliance:** Preserves strict PostgreSQL RLS policies by writing the parent `analyses` record first with the verified `auth.uid()`, then inserting child `analysis_places` referencing the generated parent ID.
  - **Partial Failure & Atomic Cleanup:** If child place insertion fails, the orphaned parent analysis record is immediately cleaned up under RLS (`analyses_delete_own` with foreign key `ON DELETE CASCADE`), preventing corrupt or partial history state.
  - **Resilient & Non-Blocking Analysis Flow:** Cloud persistence is triggered asynchronously. Any cloud failure or network interruption is logged as a development diagnostic and never blocks or fails the user's active analysis experience.
  - **Accidental Duplicate Guard:** An in-memory WeakSet and execution debounce cooldown window prevent accidental duplicate rows caused by rapid component re-renders or duplicate callbacks.
- **History and Saved Places Experience (Stage 6):**
  - **Zero Tab Bar Disruptions:** History is accessed exclusively through the existing Profile tab without adding, removing, or reordering the 4 core navigation tabs (Analyze, Explore, Saved, Profile).
  - **Analysis History Flow:** Signed-in users can browse their historical Reel analyses at `/history` (showing destination, country, thumbnail, confidence badge, date) and inspect full travel intelligence dossiers with child places at `/history/[id]`.
  - **Cloud-Backed Saved Places:** The existing Saved tab (`mobile/app/(tabs)/saved.tsx`) and place bookmark actions are backed by `public.saved_places` with Row Level Security and unique constraint `(user_id, place_id)`.
  - **Guest In-Memory Pending Action & OAuth Resumption:** If a guest taps Save on a destination or place, the pending action is retained in memory (`setPendingSaveAction`), and the existing Google/Apple OAuth modal (`/(auth)/login`) is requested. Upon successful authentication, `executePendingSaveAction` automatically executes the save to Supabase without rerunning the Instagram Reel.
  - **Safe Cancellation & Error Non-Destruction:** If a guest dismisses or cancels authentication, the pending action is safely cleared (`clearPendingSaveAction`), the active analysis view or place detail is preserved untouched, and the item is not falsely claimed as saved.
  - **Multi-Device & Offline Sync:** Synchronizes seamlessly with local cache (`AsyncStorage`) and provides pull-to-refresh for on-demand cloud sync.
- **Cross-Device Synchronization & Final QA Hardening (Stage 7):**
  - **Account Isolation & Cache Purging:** On sign-out or account switching, local `AsyncStorage` bookmarks and in-memory caches are completely purged via `clearSavedPlacesCache()`, preventing any cross-user data bleed.
  - **Supabase as Single Source of Truth:** Authenticated saved places and history are strictly synchronized against Supabase PostgreSQL tables; cloud save and removal errors do not falsely claim success or desynchronize state.
  - **Robust Pending-Action Lifecycle:** Modal gesture dismissal (swipe down), explicit cancellation, or network error safely purges pending guest save actions (`clearPendingSaveAction()`), preventing stale or duplicate save loops.
  - **Zero-Flicker Loading States:** Replaces empty-state flashes during initial cloud sync with graceful loading indicators on the Saved and History screens.
