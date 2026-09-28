# Benchmark Failure Analysis

## 1. Benchmark Summary

The 61-Reel Benchmark harness was executed against the Travel AI backend pipeline (`/analyze`). Results reflect the pipeline's deterministic evaluation against the uploaded 61-reel dataset.

- **Total cases**: 61
- **Completed cases**: 61
- **Scored cases**: 17
- **Untested cases**: 44
- **Passed**: 9
- **Failed**: 7
- **Errors**: 1
- **Accuracy**: 52.9% (calculated strictly from 17 scored cases: 9/17)
- **Performance**:
  - Average Duration: 34.1s
  - P95 Duration: 76.0s
- **Evidence Breakdown (Scored Cases)**:
  - Caption: 46.2% (6 passed / 13 scored)
  - OCR: 66.7% (2 passed / 3 scored)
  - Speech: 57.1% (4 passed / 7 scored)
  - Multi-location: 33.3% (1 passed / 3 scored)

---

## 2. Failure Classification

| Case | Expected | Actual | Primary Failure Category | Evidence Available | Failed Stage | Root Cause (Observed Fact vs Likely Root Cause) | Recommended Future Fix |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **#5** | 4 places in Meghalaya | Planning, India | `CANDIDATE_GENERATION_FAILURE` | OCR, Speech | Caption / Candidate Generation & Pipeline Preemption | **OBSERVED FACT:** The word "Planning" from caption sentence "Planning a trip to Meghalaya?" was extracted as candidate. Google Places returned an establishment in Kalyan, Maharashtra. Stage 1 resolved "Planning, India", halting pipeline.<br>**LIKELY ROOT CAUSE:** Single-word uppercase regex in `CandidateService` extracted English verb "Planning". Early-exit design in `LocationPipeline.run()` preempted OCR and Speech where the 4 destinations were presented. | 1. Filter generic verbs/grammatical words from single-word candidates.<br>2. Prevent premature short-circuiting on low-quality caption candidates when OCR/Speech stages are available. |
| **#6** | Itoya, Ginza, Tokyo - open since 1904 | Japanese, India | `CANDIDATE_GENERATION_FAILURE` | Speech, Caption | Caption / Candidate Generation & Pin Extraction | **OBSERVED FACT:** Caption contained `📍Itoya, Ginza, Tokyo - open since 1904 🕰️`. Detected winner was `Japanese, India` (Kalyan, Maharashtra).<br>**LIKELY ROOT CAUSE:** `CandidateService.clean()` collapses newlines into spaces (`re.sub(r"\s+", " ", text)`), breaking `extract_pin_location()` line splitting. The pin extraction consumed the entire preceding paragraph. Standalone adjective "Japanese" was extracted as candidate and resolved to an Indian business. | 1. Preserve newlines during caption cleaning so `extract_pin_location()` correctly isolates the pin line.<br>2. Filter language/demonym adjectives ("Japanese", "Italian") from standalone destination queries. |
| **#13** | St. Joseph's Cathederal (St. Philomena's shrine) | Built, India | `CANDIDATE_GENERATION_FAILURE` | Caption | Caption / Candidate Generation & Candidate Ranking | **OBSERVED FACT:** Caption contained "St. Joseph's Cathederal (St. Philomena's shrine)". Candidate list included "St Joseph", "Mysore", and "Built". Winner was `Built, India` (Dombivli, Maharashtra).<br>**LIKELY ROOT CAUSE:** Regex `\b[A-Z][A-Za-z]+\b` extracted past-participle "Built" from "Built in the 1930s...". Google Places resolved "Built" to an Indian point of interest, which outranked the real landmark due to lack of entity-type validation. | 1. Blacklist common participle verbs ("Built", "Located", "Designed") in `CandidateService`.<br>2. Implement entity-type / tourist landmark priority in candidate ranking. |
| **#14** | 18 US National Parks (Katmai, Yellowstone, Moab, etc.) | Mountains, Red Rocks, USA | `MULTI_LOCATION_FAILURE` | Caption | Candidate Extraction & Multi-Location Handling | **OBSERVED FACT:** Reel presented 18 US destinations. Caption concluded with "Mountains, Red Rocks, Beaches, USA road trip". System detected single destination `Mountains, Red Rocks, USA` (Morrison, Colorado).<br>**LIKELY ROOT CAUSE:** Pipeline currently only supports single-winner resolution (`best_guess`). Compound phrase extraction picked hashtag/footer text over the itemized national park list. | 1. Support multi-destination extraction and response models for itinerary/compilation reels.<br>2. Distinguish caption footer/generic tags from explicit itinerary items. |
| **#15** | Lago di Predil , Italy | Lago, India | `CANDIDATE_GENERATION_FAILURE` | Speech, Caption | Candidate Generation & Location Resolution | **OBSERVED FACT:** Caption mentioned "Lago di Predil" in Italy. Detected location was `Lago, India` (Nagaon, Maharashtra).<br>**LIKELY ROOT CAUSE:** Word splitting extracted Italian noun "Lago" as an independent candidate. Google Places resolved "Lago" to an establishment in India due to geographical bias, and scorer accepted it with 100 confidence because "lago" was in the caption. | 1. Require multi-word context for non-English generic geographical terms ("Lago", "Río", "Mont").<br>2. Apply country consistency filtering (caption mentioned Italy and Slovenia; Indian candidate should have been disqualified). |
| **#20** | Matera | Contact, India | `RANKING_FAILURE` | Caption | Candidate Generation & Ranking | **OBSERVED FACT:** Caption opened with "Matera is one of the oldest continuously inhabited cities...". Caption ended with "Contact for licensing and fee." Detected output was `Contact, India`.<br>**LIKELY ROOT CAUSE:** `CandidateService` extracted both "Contact" and "Matera". "Contact" resolved against Google Places to an establishment in Kalyan, Maharashtra, and was ranked ahead of or selected over the actual city of Matera. | 1. Blacklist administrative/boilerplate terms ("Contact", "Copyright", "Licensing", "DM").<br>2. Add geographic entity weighting (locality/city vs establishment). |
| **#23** | The Fulling Mill, Alresford, Hampshire | Wander, India | `CANDIDATE_GENERATION_FAILURE` | Caption | Candidate Generation (Pin Extraction) & Hashtag Extraction | **OBSERVED FACT:** Caption contained `📍The Fulling Mill, Alresford, Hampshire`. Detected output was `Wander, India` (Ghatkopar, Mumbai).<br>**LIKELY ROOT CAUSE:** Pin extraction was corrupted by newline normalization in `CandidateService.clean()`. The hashtag `#wanderlust` was normalized to "Wanderlust" and split to "Wander", which resolved to an Indian travel business and won. | 1. Fix newline preservation in `clean()`.<br>2. Strip generic travel hashtags ("wanderlust", "travelgram", "explore") from location candidate pool. |
| **#27** | Deqin | None (error) | `EXTRACTION_FAILURE` | Caption | Ingestion / Provider Extraction | **OBSERVED FACT:** Request rejected with HTTP 422 `Value error, Enter a valid public Instagram Reel URL.` yt-dlp reported `[Instagram] DbAvsNRsvX0: There is no video in this post`.<br>**LIKELY ROOT CAUSE:** URL `https://www.instagram.com/p/DbAvsNRsvX0/` is a static image/carousel post (`/p/`), not a video Reel (`/reel/`). The backend regex `INSTAGRAM_REEL_REGEX` strictly enforces `/reel/` or `/reels/`. | 1. Expand input normalization to accept `/p/` post links if Instagram photos/carousels are to be supported.<br>2. If video-only is intended, update error response to clarify video requirement. |

---

## 3. Failure Patterns

Cross-case analysis across all 61 cases (both scored and untested) revealed distinct, recurring failure patterns:

### Pattern A: "The Kalyan/India False-Positive Magnet" (Dominant Pattern)
- **Observed in**: Case #5 (`Planning, India`), Case #6 (`Japanese, India`), Case #13 (`Built, India`), Case #15 (`Lago, India`), Case #20 (`Contact, India`), Case #23 (`Wander, India`), and across 13 untested cases (`Trying, India`, `Standing, India`, `Taylor, India`, `Proof, India`, `August, India`, `Especially, India`, `Parking, India`, `Thrones, India`, `Pinterest, India`, `Saves, India`, `Cero, India`).
- **Mechanism**:
  1. `CandidateService.extract_compound_locations()` includes a regex `\b[A-Z][A-Za-z]+\b` that extracts every single capitalized English word as an independent candidate.
  2. Common verbs ("Planning", "Built", "Trying", "Standing"), adjectives ("Japanese"), boilerplate nouns ("Contact", "Proof"), and hashtags ("Wanderlust" → "Wander") enter the candidate queue.
  3. When queried with generic words like `textQuery: "Planning"`, Google Places Text Search (without country/location bias) frequently matches small businesses, clinics, or commercial establishments in India (often around Mumbai/Kalyan or regional centers).
  4. The business filter in `LocationResolver` only checks `BUSINESS_TYPES` (`restaurant`, `store`, `lodging`, etc.). Many of these places have `types: ["point_of_interest", "establishment"]` or administrative classifications, bypassing the filter.
  5. `ScoringService` awards maximum score (100.0) because the exact token ("planning", "built", "contact") was present in the source caption!
  6. The false candidate wins and short-circuits the pipeline.

### Pattern B: Pin Location Extraction Bug Corrupting Explicit Mentions
- **Observed in**: Case #6 (`📍Itoya, Ginza, Tokyo...`), Case #23 (`📍The Fulling Mill, Alresford, Hampshire...`).
- **Mechanism**:
  - In `CandidateService.clean()`, `text = text.replace("📍", "\n📍 ")` attempts to isolate pin markers.
  - However, two lines later, `text = re.sub(r"\s+", " ", text)` collapses all whitespace (including newlines `\n`) into a single space.
  - Subsequently, `extract_pin_location()` calls `text.splitlines()`, which only finds one giant single line.
  - The extraction loops from the beginning of the text until it encounters a travel terminator word ("trip", "tour", "view"), turning hundreds of characters of conversational caption text into a meaningless query that returns 0 Google Places results.

### Pattern C: Premature Pipeline Short-Circuiting (Cascade Preemption)
- **Observed in**: Case #5, Case #6, Case #15.
- **Mechanism**:
  - In `LocationPipeline.run()`, Stage 1 (Caption) runs first. If `resolver` returns any winner (even a spurious 100-score false positive like `Planning, India`), the pipeline immediately returns `build_response("caption", ...)`.
  - Stages 2 (OCR) and 3 (Speech) are **never executed**, even when the video has prominent on-screen text or audio clearly stating the destination.
  - A false positive in caption analysis completely preempts accurate multimodal extraction.

### Pattern D: Multi-Destination Representation Deficiency
- **Observed in**: Case #5 (4 places in Meghalaya), Case #14 (18 US national parks).
- **Mechanism**:
  - The current backend response contract and pipeline architecture only select one top `winner` (`best_guess`).
  - For compilation reels containing multiple destinations, the pipeline cannot output a list of distinct destinations. It either selects one arbitrary candidate (e.g. `Tongue Point` in Case #21) or an umbrella/footer entity (e.g. `Mountains, Red Rocks, USA` in Case #14).

### Pattern E: Instagram Ingestion Boundary Failures
- **Observed in**: Case #27 (`https://www.instagram.com/p/DbAvsNRsvX0/`).
- **Mechanism**:
  - The API endpoint regex `INSTAGRAM_REEL_REGEX` only matches `instagram.com/reel/` or `instagram.com/reels/`.
  - Post URLs with `/p/` fail validation immediately with HTTP 422 before extraction begins. Furthermore, yt-dlp cannot extract video from photo carousel posts.

---

## 4. Pipeline Weaknesses

Analysis of the 61 executed cases highlights four primary structural weaknesses in the current backend engine:

```
[Ingestion]
    │  ⚠️ Strict /reel/ regex rejects /p/ posts (Case #27)
    ▼
[Evidence Builder]
    │  ✅ Robust Whisper transcription & frame extraction
    ▼
[Candidate Extraction] ───► ❌ CRITICAL WEAKNESS #1
    │  • \b[A-Z][A-Za-z]+\b extracts English verbs/adjectives ("Planning", "Built", "Contact")
    │  • Newline collapsing destroys 📍 pin extraction
    ▼
[Google Places Search] ───► ⚠️ WEAKNESS #2
    │  • Text search has no geographic bias or contextual anchoring
    │  • Generic words resolve to arbitrary commercial POIs in India
    ▼
[Scoring & Ranking] ──────► ❌ CRITICAL WEAKNESS #3
    │  • Exact word presence in caption gives 100.0 score to spurious words
    │  • No verification of geographical entity type (locality vs shop)
    ▼
[Pipeline Control Flow] ──► ❌ CRITICAL WEAKNESS #4
    │  • Caption false positive short-circuits pipeline, killing OCR & Speech
    ▼
[Response Builder]
    │  ⚠️ Single-winner schema cannot represent multi-location itineraries
```

1. **Over-permissive Candidate Generation (`candidate_service.py`)**:
   Extracting arbitrary single capitalized words without Part-of-Speech (POS) filtering or a comprehensive stop-word dictionary is the root cause of 6 out of 7 failures.

2. **Scoring Favoritism for Caption Noise (`scoring_service.py`)**:
   `ScoringService` computes term overlap against caption evidence. Because the spurious candidate was literally extracted from the caption, it achieves high term overlap and confidence, outranking legitimate geographic entities.

3. **Rigid Serial Short-Circuiting (`location_pipeline.py`)**:
   The sequential `if resolver: return` pattern assumes that if any candidate resolves in caption, it is trustworthy. Without confidence gating or multi-stage consensus, spurious caption candidates prevent OCR and Speech from contributing.

4. **Geographic Hallucination / Unanchored Resolution (`google_places_service.py`)**:
   Queries are sent to Google Places without location constraints or context words. Searching for "Wander" returns a local shop in Mumbai rather than recognizing the word as non-geographic noise.

---

## 5. Recommended Fix Order

Based on frequency, failure severity, and implementation dependencies, fixes should be executed in this order:

```text
Priority 1: Fix Candidate Generation Heuristics (candidate_service.py)
   ├── A. Preserve newlines in clean() to fix 📍 Pin extraction
   ├── B. Remove or restrict single-word regex \b[A-Z][A-Za-z]+\b
   └── C. Expand stop-words with common verbs, boilerplate, and travel tags
         (Planning, Built, Contact, Trying, Standing, Wanderlust, Copyright)
   Impact: Resolves root cause of 6 out of 7 failed cases (#5, #6, #13, #15, #20, #23).

Priority 2: Context-Anchored Place Resolution & Entity Filtering (location_resolver.py)
   ├── A. Require candidates to have recognized geographic types (locality, tourist_attraction, park)
   └── B. Check place country against country/region clues already identified in caption
   Impact: Prevents generic words from resolving to unrelated Indian businesses.

Priority 3: Multi-Stage Evidence Consensus / Quality Gating (location_pipeline.py)
   ├── A. Do not short-circuit caption stage if confidence is low or candidate is weak
   └── B. Allow OCR and Speech to corroborate or override caption candidates
   Impact: Ensures high-value OCR and Speech evidence is not silenced by caption noise (#5, #6).

Priority 4: URL Ingestion Normalization (analyze.py)
   ├── A. Normalize /p/ Instagram post URLs to /reel/ or add friendly error handling
   Impact: Resolves Case #27.

Priority 5: Multi-Location Architecture Support (response_builder.py & schemas)
   ├── A. Detect compilation/itinerary format in caption or OCR
   └── B. Support extracting and returning structured lists of destinations
   Impact: Addresses compilation reels (#5, #14, #21).
```

---

## 6. Cases Requiring Manual Investigation

1. **Case #5 (`https://www.instagram.com/reel/Db3Iw9dPZjT/`)**:
   - *Status*: FAILED
   - *Issue*: The reel is expected to contain 4 specific places in Meghalaya (e.g. Cherrapunji, Nohkalikai, etc.) across OCR and Speech. Because caption stage short-circuited on "Planning, India", the exact OCR and Speech transcriptions were not logged in `latest.json`.
   - *Action Needed*: Run standalone OCR/Speech extraction on this Reel to verify whether Whisper and EasyOCR successfully capture the 4 Meghalaya place names.

2. **Case #27 (`https://www.instagram.com/p/DbAvsNRsvX0/`)**:
   - *Status*: ERROR
   - *Issue*: Instagram returned `There is no video in this post`.
   - *Action Needed*: Manually inspect the Instagram URL in a browser to confirm whether it is an image carousel or if Instagram has restricted media delivery for this post.
