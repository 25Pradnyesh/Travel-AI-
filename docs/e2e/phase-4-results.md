# Phase 4 — Real Reel E2E Results & Post-Test Hardening

## Status

**PARTIAL** — All repository-documented public Reels were tested (n=1: `https://www.instagram.com/reel/DN2XxxY2O7-/`). A 5–10 Reel matrix has **not** been performed yet: broader manual Reel testing is required and will be conducted manually. No fabricated URLs or mock tests have been added to the test matrix.

**REAL REEL DATASET NOTE:** Broader manual E2E testing with 5–10 real Instagram Reels is still required to validate the pipeline across diverse creator styles, languages, and geographic regions.

---

## Test Summary

| Metric | Count |
|--------|------:|
| Total Tested | 1 |
| Correct Destination | 1 |
| Incorrect Destination | 0 |
| Unresolved | 0 |
| Technical Failures | 0 |
| Inaccessible | 0 |

---

## Test Matrix

| ID | Reel URL | Category | Expected destination | Actual destination | Result | Evidence | HTTP | Conf. | Verification | Time (wall) | Failure / Notes |
|----|----------|----------|----------------------|--------------------|--------|----------|------|-------|--------------|-------------|-----------------|
| R1 | `https://www.instagram.com/reel/DN2XxxY2O7-/` | Lake / hiking (Austria) | Seebensee, Austria (caption: “📍Seebensee hike in Austria”) | Seebensee, Austria | **CORRECT** | Caption + Google Places | 200 | 100 (VERY_HIGH) | FAILED (Gemini unavailable; scoring fallback) | 17.0s warm / 94.0s cold | Gemini API NotFound (external/config; non-blocking) |

### R1 Detail

| Field | Value |
|-------|--------|
| Caption used | Yes — resolved at pipeline stage `caption` (OCR/Speech not run) |
| OCR used | No |
| Speech used | No |
| Gemini used | Attempted — `used: false`, `status: FAILED`, reason: “Gemini verification unavailable. Used scoring fallback.” |
| Nearby places | 28 returned |
| Frontend rendering | Payload via `POST /api/analyze` matches `AnalysisResponse`; all destination UI sections have data. No null `best_guess`; build passes. |
| Backend `performance.total_seconds` | 13.04s (pipeline); now fully instrumented with stage-level breakdown |
| Creator / source | Tony & Lin (`noodlesandblisters`) — provider metadata |

Raw captures: `docs/e2e/r1_backend.json`, `docs/e2e/r1_nextjs.json`, `docs/e2e/r1_provider.json`.

---

## Evidence Analysis

| Source | R1 |
|--------|-----|
| Caption | Primary — “Seebensee”, “Austria” in caption; resolver sources logged as `caption` |
| OCR | Not used (early exit at caption stage) |
| Speech | Not used |
| Gemini / visual | Attempted; API `NotFound`; fallback to scoring |
| Google Places | Yes — place details, photos, nearby search |
| Combination | Caption + Google Places (matches `best_guess.why`) |

---

## Deterministic Engineering Fixes Implemented

Following Phase 4 test execution, four targeted improvements were implemented and validated:

### 1. Removal of Unsupported Google Places Type (`natural_feature`)
- **Root Cause:** Phase 4 logs revealed Google Places API (New) returning HTTP 400 `INVALID_ARGUMENT: Unsupported types: [natural_feature]` during nearby searches. While `natural_feature` exists in Table B (returned place details), it is not a supported search type for the `includedTypes` filter in `places:searchNearby`.
- **Resolution:** Removed `"natural_feature"` from `TRAVEL_CATEGORIES["nature"]` (retaining `"park"`) and from `SUPPORTED_PLACE_TYPES` in `nearby_search_service.py`. Any calls specifying `natural_feature` are rejected immediately without issuing upstream requests.
- **Impact:** Eliminates 400 errors during nearby place enrichment; preserves all valid nearby searches.

### 2. Truthful Gemini Verification Semantics
- **Root Cause:** Phase 4 exposed an inconsistent state (`verification_status = FAILED`, `confidence = 100`, `confidence_level = VERY_HIGH`), with `best_guess.why` claiming `"Verified from Reel's CAPTION..."` despite verification failure. Furthermore, `ScoringService.confidence()` previously mapped scores ≥ 95 to `"VERIFIED"`, conflating heuristic ranking with multimodal AI verification.
- **Resolution:**
  - `ScoringService.confidence()` now maps scores ≥ 90 to `"VERY_HIGH"`. Deterministic scoring evaluates match confidence, never verification status.
  - `GeminiVerifier.calculate_confidence_level()` and `resolve_decision()` ensure that when Gemini fails or is unavailable, `verification_status` is `FAILED`, `gemini_verified` is `False`, `gemini_confidence` is `0.0`, and the confidence level is never labeled as `VERIFIED`.
  - `ResponseBuilder.build_why_explanation()` truthfully distinguishes verified matches from unverified candidates: unverified candidates output `"Identified from Reel's {sources} and Google Places location data (unverified)."` rather than claiming `"Verified from..."`.
  - The deterministic destination result and numerical score (e.g., 100) are fully preserved.

### 3. Gemini `NotFound` Clarification
- **Status:** Known external provider/configuration issue. The engine is configured with `gemini-2.5-flash`, which returns `NotFound` from Google's Generative AI API in the current environment. Per instructions, API configurations and models were not altered; fallback scoring ensures resilient end-to-end resolution.

### 4. Stage-Level Performance Instrumentation
- **Root Cause:** Previously, only `performance.total_seconds` was exposed in the API response.
- **Resolution:** Instrumented lightweight elapsed timings using Python's `time.perf_counter()` across major pipeline stages, exposed under `performance.stages`:
  - `provider`: Reel acquisition / download
  - `location_extraction`: Caption, OCR, and speech evidence extraction
  - `candidate_resolution`: Candidate generation, Google Places candidate search, formatting, and scoring
  - `verification`: Gemini multimodal verification
  - `nearby_places`: Nearby place queries across travel categories
  - `travel_intelligence`: AI travel intelligence enrichment
  - `response_building`: Final response packaging
- Both `performance.total_seconds` and `performance.stages` are included in the response.

---

## Remaining Limitations

1. **Dataset Coverage:** Only 1 real Reel URL is currently documented and tested in the repository. Broader manual validation with 5–10 real travel Reels is still required.
2. **Gemini Upstream Availability:** The default model `gemini-2.5-flash` returns `NotFound` on the current API key/account. The fallback scoring pipeline successfully delivers the correct destination, but Gemini multimodal verification does not execute until a supported model/key is active.
3. **Cold-Start Overhead:** The first analysis request after engine boot loads heavy ML libraries (torch, easyocr, whisper), taking ~94s on cold start vs. ~17s wall-clock on warm runs.

---

## Conclusion

The in-repo Austria travel Reel (`DN2XxxY2O7-`) ingests successfully, resolves **Seebensee, Austria** at stage 1 (caption), and returns HTTP 200 with full enrichment. Post-test hardening has resolved the Google Places 400 errors, corrected verification semantics, and introduced comprehensive stage-level performance telemetry. Phase 4 remains **PARTIAL** pending broader manual multi-Reel validation.
