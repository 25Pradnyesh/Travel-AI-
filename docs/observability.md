# Travel AI — Production Reliability & Observability Guide

- **Document Role:** Authoritative Observability Specification, Telemetry Contracts, and Diagnostics Runbook
- **Repository:** Travel AI (`travel-ai`)
- **Primary Surfaces:** FastAPI Intelligence Engine (`engine/`) & Observability Layer (`engine/observability/`)
- **Status:** Canonical Production Operating Standard (Stage 10)

---

## 1. Observability Architecture & Purpose

Travel AI transforms public Instagram Reels into ground-truth geographic destinations, travel intelligence dossiers, and nearby attractions. Because this workflow depends on multiple asynchronous, distributed, and AI-driven stages (video extraction, keyframe OCR, Whisper transcription, Google Places text search, place details, nearby clustering, and Gemini multimodal verification), production observability is critical for:

1. **Immediate Failure Diagnosis:** Pinpointing the exact pipeline stage where a request stalled, degraded, or failed.
2. **Deterministic Root-Cause Classification:** Mapping failures into standardized machine-readable error categories rather than generic `500 Internal Server Error` strings.
3. **Trace Propagation:** Correlating every external call, log line, and response back to a unique, end-to-end Request/Trace ID (`X-Request-ID`).
4. **Strict Privacy & Redaction:** Ensuring third-party API keys (`GOOGLE_PLACES_API_KEY`, `GEMINI_API_KEY`), session cookies, Bearer tokens, and raw media bytes never leak into logs or client-facing diagnostics.
5. **Contract Preservation:** Exposing granular timing and execution metadata without altering the mobile client's existing JSON response schema.

```text
Incoming HTTP Request (POST /analyze)
      │
      ▼
┌──────────────────────────────────────────────────────────┐
│ FASTAPI TRACING MIDDLEWARE                               │
│ • Extract incoming X-Request-ID or generate UUID4        │
│ • Bind RequestContext into thread/async-local context    │
│ • Inject X-Request-ID into outgoing HTTP Response header │
└─────────────────────────────┬────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────┐
│ MULTI-STAGE LOCATION PIPELINE                            │
│ 1. Instagram Ingestion (yt-dlp video & metadata)         │
│ 2. Evidence Extraction (Caption, Keyframe OCR, Speech)   │
│ 3. Candidate Generation (CandidateService)               │
│ 4. Places Grounding (Google Places Search & Details)     │
│ 5. Multi-Factor Scoring (ScoringService)                 │
│ 6. Multimodal Verification (Gemini 2.5 Flash Vision)     │
│ 7. Destination Enrichment (Nearby POIs & Travel Dossier) │
│ 8. Response Construction (ResponseBuilder)               │
└─────────────────────────────┬────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────┐
│ TELEMETRY & EVENT EMISSION                               │
│ • Granular stage durations (ms/s)                        │
│ • External API latencies (Places, Gemini, Instagram)     │
│ • Error classification (10 standard categories)          │
│ • In-memory Metrics Aggregator (p50/p95, error rates)    │
│ • Redacted structured production logs                    │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Request Lifecycle & Trace Propagation

### 2.1 Trace ID Lifecycle
1. **Client / Gateway Ingress:** The client (mobile app or reverse proxy) can provide an `X-Request-ID` or `X-Trace-ID` HTTP header.
2. **Middleware Initialization:** `engine/app/main.py` detects the header or generates a cryptographically random UUID4.
3. **Context Binding:** `start_request_context(request_id)` registers the `RequestContext` in Python `contextvars.ContextVar`, ensuring async and thread-safe isolation across concurrent requests.
4. **Pipeline Handoff:** The `request_id` is passed through `LocationPipeline.run(..., request_id=ctx.request_id)`.
5. **Log Correlation:** Every message emitted via `StructuredLogger` automatically prefixes logs with `[<request_id>] [<stage_name>]`.
6. **Response Injection:** The trace ID is returned in:
   - The HTTP response header `X-Request-ID`.
   - The top-level response field `AnalysisResponse.request_id`.
   - The telemetry block `AnalysisResponse.performance["request_id"]`.

---

## 3. Pipeline Stages & Telemetry Data Contract

### 3.1 Canonical Pipeline Stage Names
Stage identifiers are formally defined in `engine/observability/stages.py`:

| Stage Identifier | Pipeline Component | Description |
| :--- | :--- | :--- |
| `instagram_extraction` | `ProviderManager` / `yt-dlp` | Reel video stream download and metadata extraction. |
| `evidence_caption` | `EvidenceBuilder.build_caption` | Caption, title, and hashtag token parsing. |
| `frame_extraction` | `FrameExtractor` | Sampling representative video keyframes into temp files. |
| `evidence_ocr` | `EvidenceBuilder.build_ocr` | EasyOCR on-screen text recognition and bounding box parsing. |
| `evidence_speech` | `EvidenceBuilder.build_speech` | Audio track extraction and Whisper transcription. |
| `candidate_generation` | `CandidateService.generate` | Heuristic entity extraction and location candidate generation. |
| `google_places_search` | `GooglePlacesService.search` | Text Search API queries for destination candidates. |
| `google_places_details` | `GooglePlaceDetailsService` | Place Details API lookups for verified Place IDs. |
| `scoring` | `ScoringService.rank_places` | Multi-source weighted scoring, type checking, and geo validation. |
| `gemini_verification` | `GeminiVerifier.verify` | Google Gemini 2.5 Flash multimodal vision and reasoning. |
| `enrichment` | `LocationResolver._enrich_candidate` | Nearby POI search (`google_places_nearby`) and travel dossier intelligence. |
| `response_construction` | `ResponseBuilder.build` | Final response schema formatting, geo-normalization, and payload validation. |
| `total` | Request-level | End-to-end request duration from ingress to egress. |

### 3.2 Standard Telemetry Payload (14 Metrics)
Every request records a complete telemetry dictionary accessible via `RequestContext.get_telemetry_dict()` and serialized inside `AnalysisResponse.performance["metrics"]`:

```json
{
  "request_id": "9f2d1e0c-3b4a-4d7e-8f90-1a2b3c4d5e6f",
  "total_request_duration_seconds": 6.842,
  "stage_durations": {
    "instagram_extraction": 1.945,
    "evidence_caption": 0.012,
    "candidate_generation": 0.008,
    "google_places_search": 0.382,
    "google_places_details": 0.194,
    "scoring": 0.004,
    "enrichment": 0.825,
    "gemini_verification": 1.482,
    "response_building": 0.003
  },
  "success": true,
  "failure_stage": null,
  "error_category": null,
  "external_service_latency": {
    "instagram_download": 1.945,
    "google_places_search": 0.382,
    "google_places_details": 0.194,
    "google_places_nearby": 0.825,
    "gemini_verification": 1.482
  },
  "retry_counts": {
    "google_places_search": 0,
    "gemini_verification": 0
  },
  "evidence_sources_used": ["caption", "ocr"],
  "candidate_count": 4,
  "selected_candidate": "Lake Como, Italy",
  "confidence": 96.0,
  "confidence_level": "VERY_HIGH",
  "google_places_resolution_status": "FOUND",
  "gemini_verification_status": "VERIFIED",
  "final_pipeline_stage": "caption"
}
```

---

## 4. Structured Error Categorization

When a request cannot resolve a destination or encounters an upstream failure, it is classified into one of 10 standard categories defined in `engine/observability/errors.py`:

| Error Category | HTTP Code | Trigger Conditions | Client Diagnostic Action |
| :--- | :--- | :--- | :--- |
| `MEDIA_UNAVAILABLE` | `422` | Reel is private, deleted, requires Instagram login, or video file could not be downloaded. | Prompt user to check Reel visibility or verify URL. |
| `EXTRACTION_FAILURE` | `400` / `500` | Malformed URL or unrecoverable yt-dlp metadata extraction failure. | Verify URL format or retry analysis. |
| `OCR_FAILURE` | `200` (soft) / `500` | Frame decoding error, OpenCV failure, or EasyOCR initialization failure. | Check server GPU/CPU memory and temp frame permissions. |
| `SPEECH_FAILURE` | `200` (soft) / `500` | Audio stream extraction failed or Whisper model failed to transcribe. | Check ffmpeg binary availability and system memory. |
| `CANDIDATE_GENERATION_FAILURE` | `500` | Unhandled exception or syntax error in entity extraction heuristics. | Inspect entity tokenization rules in `candidate_service.py`. |
| `RESOLUTION_FAILURE` | `200` (`success: false`) | Candidates generated, but none achieved sufficient confidence or resolved in Google Places. | Normal for generic Reels lacking travel location clues. |
| `EXTERNAL_API_FAILURE` | `502` / `503` | Google Places API quota exceeded (`429`), permission denied (`403`), or network failure. | Check Google Cloud Console Places API billing and quotas. |
| `TIMEOUT` | `504` | Upstream network timeout to Instagram, Google Places, or Gemini. | Check network connectivity or increase upstream timeout threshold. |
| `VERIFICATION_FAILURE` | `200` (soft fallback) | Gemini Vision API returned an error, model quota exceeded, or parsing failed. | Falls back to rule-based scoring winner; check Gemini API key. |
| `UNEXPECTED_INTERNAL_FAILURE` | `500` | Uncaught Python exception in pipeline orchestration. | Inspect server error logs referencing the `X-Request-ID`. |

---

## 5. Safe Production Logging & Privacy Policy

### 5.1 Redaction Standard
The observability layer enforces strict credential redaction via `engine/observability/redactor.py`:

1. **Google Cloud API Keys:** Any string matching `AIza[0-9A-Za-z-_]{35}` is redacted to `AIza...[REDACTED_API_KEY]`.
2. **Bearer Tokens:** Any `Bearer <token>` authorization header is masked to `Bearer [REDACTED_TOKEN]`.
3. **Session Cookies:** Cookie values such as `sessionid=...`, `csrftoken=...`, `ds_user_id=...` are masked to `[REDACTED]`.
4. **URL Parameters:** Sensitive query parameters (`?key=...`, `?token=...`, `?access_token=...`, `?secret=...`) are stripped from log lines.
5. **Media Payloads:** Base64 image data strings (`data:image/...;base64,...`) are replaced with `[REDACTED_MEDIA]`.
6. **No Stack Trace Leakage:** Raw Python tracebacks and system directory paths are NEVER transmitted in API JSON responses.

### 5.2 Structured Log Format
Logs emitted via `StructuredLogger` follow a standardized format:

```text
[<request_id>] [<stage_name>] <message> | meta=<json_metadata>
```

Example Production Log Stream:
```text
INFO:  [d1b2c3a4-e5f6-7890] [http] HTTP POST /analyze initiated
INFO:  [d1b2c3a4-e5f6-7890] [analyze] Starting reel analysis | meta={"url": "https://www.instagram.com/reel/C8XYZ123/"}
INFO:  [d1b2c3a4-e5f6-7890] [instagram_extraction] stage_start
INFO:  [d1b2c3a4-e5f6-7890] [instagram_extraction] stage_complete | meta={"duration": 1.842}
INFO:  [d1b2c3a4-e5f6-7890] [candidate_generation] stage_start
INFO:  [d1b2c3a4-e5f6-7890] [candidate_generation] stage_complete | meta={"duration": 0.005}
INFO:  [d1b2c3a4-e5f6-7890] [scoring] stage_complete | meta={"duration": 0.002}
INFO:  [d1b2c3a4-e5f6-7890] [pipeline] Analysis resolved successfully at stage 'caption' | meta={"winner": "Matterhorn, Zermatt", "confidence": 98.0}
INFO:  [d1b2c3a4-e5f6-7890] [http] HTTP POST /analyze completed with status 200
```

---

## 6. How Developers Diagnose a Failed Analysis

When a production analysis request fails or returns an unresolved destination, follow this diagnostic runbook:

### Step 1: Capture the Request ID
Look for the `X-Request-ID` header in the client response or inspect the client network panel:
```bash
curl -i -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{"reel_url": "https://www.instagram.com/reel/DaxYL5YPwMg/"}'
```
Response header:
```text
X-Request-ID: 7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d
```

### Step 2: Query Logs for the Trace ID
Filter your log aggregator (or terminal output) using the Request ID:
```powershell
Get-Content logs/engine.log | Select-String "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d"
```

### Step 3: Inspect the `performance.metrics` Object
In the returned JSON payload, inspect the `performance` object:
1. **`success: false`?** Check `failure_stage` and `error_category`.
   - If `error_category: "RESOLUTION_FAILURE"`, check `extracted_candidates`. Did candidate generation extract the correct landmark name?
   - If `error_category: "EXTERNAL_API_FAILURE"`, verify `external_service_latency` and check if Google Places API returned rate limits (`429`) or auth errors (`403`).
   - If `error_category: "MEDIA_UNAVAILABLE"`, the Reel may have been deleted, restricted by age/geo, or made private.
2. **Slow Request?** Compare `stage_durations`:
   - High `instagram_extraction` (> 5s): Video file is large or Instagram rate-limiting downloads.
   - High `google_places_search` / `google_places_details`: Network latency to Google Places API.
   - High `gemini_verification` (> 3s): Gemini Vision API cold-start or large keyframe payload.

### Step 4: Inspect Aggregated Engine Health & Metrics
Developers can inspect engine performance metrics in Python via `get_metrics_aggregator().get_summary()`:
```python
from engine.observability import get_metrics_aggregator

summary = get_metrics_aggregator().get_summary()
print(summary)
# {
#   "total_requests": 142,
#   "successful_requests": 128,
#   "failed_requests": 14,
#   "success_rate_percent": 90.1,
#   "average_request_duration_seconds": 5.42,
#   "error_categories": {"RESOLUTION_FAILURE": 10, "MEDIA_UNAVAILABLE": 4},
#   "average_stage_durations": {"instagram_extraction": 2.1, "gemini_verification": 1.2}
# }
```

---

## 7. Architecture & API Documentation Consistency

To reflect the Stage 10 observability architecture, the following documents are in sync:
- `docs/observability.md`: This comprehensive telemetry and diagnostics guide.
- `docs/API.md`: Updated to document the `X-Request-ID` header and non-breaking telemetry fields.
- `docs/ARCHITECTURE.md`: Updated with the tracing middleware and observability layer.
- `docs/SECURITY.md`: Affirms the data redaction rules and zero-credential logging standard.
