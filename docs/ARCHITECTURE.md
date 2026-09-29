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
