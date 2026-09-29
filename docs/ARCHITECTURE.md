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

