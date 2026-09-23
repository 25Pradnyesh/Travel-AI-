# Travel AI — Phase 7: Performance + Scalability Engineering Results

## 1. Performance Baseline (Recorded from Phase 4 & Phase 5)

* **Cold Analysis Latency**: Approximately **~94 seconds**
  * Dominated by cold model initialization (PyTorch, EasyOCR CRAFT detection model, recognition network, Whisper weights loading).
* **Warm Analysis Latency**: Approximately **~13–17 seconds**
  * Dominated by repeated Google Places API roundtrips across multiple candidates and categories, Whisper transcription, and Gemini verification.
* **Stage Telemetry Source of Truth**:
  * `performance.total_seconds`
  * `performance.stages` (`provider`, `location_extraction`, `candidate_resolution`, `verification`, `nearby_places`, `travel_intelligence`, `response_building`)

---

## 2. Identified Bottlenecks

1. **Eager EasyOCR Reader Instantiation in `OCRService`**:
   - `easyocr.Reader(["en"], gpu=False)` was unconditionally created upon `OCRService()` initialization.
   - Consumers like `FrameExtractor` only invoked OpenCV-based metrics (`estimate_text_density`, `calculate_sharpness`, `calculate_brightness`), but were forced to load EasyOCR weights into memory.
   - Multiple `OCRService()` instances each loaded their own reader, causing repeated PyTorch allocation.

2. **5x Candidate Over-Enrichment in `LocationResolver`**:
   - For all top 5 candidates in `ranked`, `LocationResolver.resolve()` executed `self.nearby.search(lat, lng)` and `self.travel.enrich(place)`.
   - Each nearby search dispatched requests across 6 categories (~15–25 Google Places requests per candidate). Multiplying across 5 candidates resulted in ~75–125 API calls, when only 1 candidate was ever returned as the winner or rendered on the frontend.

3. **Serial Place Types in `NearbySearchService.search_category()`**:
   - While top-level categories were searched concurrently via `ThreadPoolExecutor(max_workers=6)`, the specific place types within each category (e.g. 4 types in `must_visit`, 3 in `food`) were processed sequentially, adding serialized network roundtrip delays.

4. **Duplicate Travel Intelligence Enrichment in `ResponseBuilder`**:
   - `ResponseBuilder.build_travel_intelligence()` executed `self.travel_service.enrich(place)` a second time on the already-enriched winner place object, performing redundant category classification, budget estimation, and itinerary generation.

---

## 3. Optimizations Applied

### Target B — Lazy Singleton Reuse for Heavy ML
* **Thread-Safe Lazy EasyOCR Singleton**: Added `get_ocr_reader()` with a thread lock in `engine/app/services/ocr/ocr_service.py`.
* Moved `import easyocr` inside `get_ocr_reader()` to ensure module import does not trigger PyTorch or CUDA checks.
* `OCRService.reader` now accesses `get_ocr_reader()` as a property. OpenCV-only operations (frame selection, sharpness, density) run instantly without touching model weights.
* Reused `SpeechService`'s existing thread-safe `get_whisper_model()` singleton.

### Target D & E — Winner-Only Candidate Enrichment & Places Concurrency
* **Winner-Only Enrichment in `LocationResolver`**:
  * Extracted enrichment into `_enrich_candidate(item)`.
  * `LocationResolver.resolve()` only enriches candidate 1 (`ranked[0]`), while setting safe default structures on remaining candidates.
  * In `LocationPipeline.build_response()`, if Gemini verification selects a non-top candidate, `_enrich_candidate()` runs on demand.
  * **Impact**: Eliminates ~80% of downstream Google Places network requests and reduces warm candidate resolution latency drastically.
* **Bounded Concurrency in `NearbySearchService.search_category()`**:
  * Place types within a category are now queried concurrently using a bounded `ThreadPoolExecutor(max_workers=min(4, len(place_types)))`.
  * Preserved deterministic category result ordering, strict deduplication by `id`, and per-type error isolation.

### Target F & G — Travel Intelligence & Redundant Processing Elimination
* In `ResponseBuilder.build_travel_intelligence()`, added an idempotency check: if `travel_summary` and `category_emoji` already exist on `place`, `self.travel_service.enrich()` is skipped.
* Graceful degradation preserved: any unexpected exception in enrichment returns `{}` without failing the destination resolution.

### Target H — Resource Lifecycle Guarantees
* Maintained Phase 5 resource cleanup in `LocationPipeline.run()` (`finally: self._cleanup_temp_files(video_path, frame_paths)`).
* Maintained `cv2.VideoCapture` release in `FrameExtractor._extract_with_cap()` via `try ... finally: cap.release()`.

---

## 4. Expected Impact

| Area | Baseline Behavior | Optimized Behavior | Impact |
| :--- | :--- | :--- | :--- |
| **EasyOCR Initialization** | Eager on every `OCRService()` instantiation | Lazy singleton on first OCR text extraction | Eliminates model overhead for caption-only resolutions & frame metrics |
| **Candidate Nearby Search** | Up to 5 candidates × 6 categories = ~75–125 API calls | 1 winner candidate × 6 categories = ~15–25 API calls | **~80% reduction** in Google Places API calls & latency |
| **Nearby Type Concurrency** | Serial execution within categories (up to 4 serial HTTP calls) | Concurrent execution with bounded workers (`max_workers=4`) | Near-instant category aggregation (~1 roundtrip per category) |
| **Travel Intelligence** | Double enrichment (`LocationResolver` + `ResponseBuilder`) | Single enrichment with memoization check | Eliminates redundant object copying and regex processing |

---

## 5. Remaining Physical Constraints

1. **First-Time Model Weights Download/Loading**: On cold starts, PyTorch / EasyOCR / Whisper must still load weights from disk on their very first invocation (~10–30s depending on disk I/O and CPU). By design, this is kept on-demand rather than freezing server startup.
2. **Instagram Video Download & Ingestion**: yt-dlp download latency remains network-bound to Instagram CDN servers (~2–6s).
3. **Google Places Rate Limits**: Preserving API stability and respecting Google Places quota is prioritized over unbounded parallelism. Concurrency remains strictly bounded.
