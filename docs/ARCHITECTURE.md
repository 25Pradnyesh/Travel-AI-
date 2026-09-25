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
