# VAMO (formerly Travel AI) — Architecture and Engineering Decisions Record (ADR)

> **Authoritative Technical Decision Record**
> **Repository:** `travel-ai` | **Active Surface:** Native Mobile Client (`mobile/`) & FastAPI Engine (`engine/`)
> **Current Branches:** `main` (Production Release Baseline) | `ui-redesign` (Active VAMO Surface & Destination Experience Fix)
> **Document Status:** Authoritative, Historical, and Current Master Record
> **Last Updated:** 2026-10-24

---

## Table of Contents

1. [Purpose and Scope](#1-purpose-and-scope)
2. [Project Snapshot and Current State](#2-project-snapshot-and-current-state)
3. [Decision Status Definitions](#3-decision-status-definitions)
4. [Historical Timeline](#4-historical-timeline)
5. [Product and Branding Decisions](#5-product-and-branding-decisions)
6. [Architecture and Technology Stack Decisions](#6-architecture-and-technology-stack-decisions)
7. [Destination Identification and Confidence Decisions](#7-destination-identification-and-confidence-decisions)
8. [Photo and Visual Atmosphere Decisions](#8-photo-and-visual-atmosphere-decisions)
9. [Destination Overview and Evidence Presentation Decisions](#9-destination-overview-and-evidence-presentation-decisions)
10. [Weather and Seasonality Decisions](#10-weather-and-seasonality-decisions)
11. [Travel Tips and Budget Decisions](#11-travel-tips-and-budget-decisions)
12. [Performance, Timeouts, and Enrichment Decisions](#12-performance-timeouts-and-enrichment-decisions)
13. [API Policy and External Data Sources Matrix](#13-api-policy-and-external-data-sources-matrix)
14. [Authentication, Storage, and Security Decisions](#14-authentication-storage-and-security-decisions)
15. [Testing and Quality Standards](#15-testing-and-quality-standards)
16. [Git Branching and Development Workflow](#16-git-branching-and-development-workflow)
17. [Superseded Decisions Ledger](#17-superseded-decisions-ledger)
18. [Known Limitations, Deferred Decisions, and Open Questions](#18-known-limitations-deferred-decisions-and-open-questions)
19. [Evidence and Artifact Traceability Index](#19-evidence-and-artifact-traceability-index)

---

## 1. Purpose and Scope

This document serves as the single permanent engineering record of architectural, product, design-system, data-source, and performance decisions made across the lifecycle of **VAMO** (originally conceived and developed as **Travel AI**).

It reconstructs the project's decision history from actual repository artifacts, test suites, Git commits, benchmark evaluations, and the latest working-tree implementation from the **Destination Experience Fix**. Every entry is grounded in empirical code evidence. Where rationale was not formally documented at the time of commit, the outcome is documented and the rationale is explicitly marked as undocumented.

### Mandatory Decision Workflow
1. **Identify Constraint:** Inspect the codebase, establish requirements, and identify alternatives prior to writing production code.
2. **Draft Decision Entry:** Propose an entry with complete context, considered options, rationale, and trade-offs.
3. **Record as Proposed:** Mark the status as `Proposed` prior to modifying code.
4. **Approval Gate:** For decisions that require user approval (such as new external paid APIs or native binary dependencies), stop and await explicit sign-off.
5. **Implement & Validate:** Implement the approved design and execute verification tests.
6. **Update to Accepted:** Switch status to `Accepted` only after empirical automated verification passes.
7. **Maintain History:** When requirements change, do not erase previous decisions; mark them `Superseded` and link to the successor entry.

---

## 2. Project Snapshot and Current State

| Dimension | State | Evidence |
| :--- | :--- | :--- |
| **Product Identity** | **VAMO** (Editorial, Cosmos-inspired travel discovery companion) | [`mobile/constants/theme.ts`](../mobile/constants/theme.ts), [`docs/DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) |
| **Primary Client Surface** | **Native Mobile Application** (React Native, Expo SDK 57, TypeScript) | [`mobile/package.json`](../mobile/package.json), [`docs/PRD.md`](PRD.md), [`docs/AGENTS.md`](AGENTS.md) |
| **Secondary Client Surface** | **Web Prototype** (Next.js 15, React 19) — Retained as legacy desktop prototype | [`web/package.json`](../package.json), [`docs/PRD.md`](PRD.md) |
| **Backend Intelligence Engine** | **FastAPI Python Service** (`engine/`) — Multi-signal pipeline | [`engine/app/main.py`](../engine/app/main.py), [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) |
| **Places Provider** | **OpenStreetMap / Nominatim / Overpass / Wikimedia / Open-Meteo** (100% keyless, zero-cost) | [`engine/app/services/places/osm_provider.py`](../engine/app/services/places/osm_provider.py) |
| **Paid API Constraint** | **Google Places is strictly INACTIVE / DISABLED.** No paid APIs permitted without approval. | [`engine/app/services/places/factory.py`](../engine/app/services/places/factory.py) |
| **Authentication & Cloud Sync**| **Supabase Auth** (Google/Apple OAuth via PKCE) + PostgreSQL with Row-Level Security | [`docs/AUTHENTICATION.md`](AUTHENTICATION.md), [`mobile/lib/supabase/`](../mobile/lib/supabase/) |
| **Current Git Branch** | `ui-redesign` (Active development containing uncommitted Destination Experience Fix) | `git status`, `git branch` |
| **Baseline Production Branch** | `main` (Frozen release candidate baseline with verified Stage 8 benchmark accuracy) | Commit `1da29f6`, `7ee44c7` |

---

## 3. Decision Status Definitions

To maintain strict epistemic honesty, every decision in this record is categorized into one of the following states:

- **Accepted:** Explicitly agreed, fully implemented, and empirically verified by automated tests.
- **Implemented:** Evidenced in active source code and functioning in the repository, but lacking full end-to-end integration or production test automation.
- **Proposed:** Planned or drafted design under review; code changes have not yet been accepted.
- **Superseded:** Previously valid decision that was formally replaced by a successor decision.
- **Rejected:** Explored or considered alternative that was explicitly evaluated and dismissed.
- **Unverified:** Claim, reported finding, or external credential setup that is not yet verified by automated test suites or live production verification.

---

## 4. Historical Timeline

```text
2026-07 (Genesis)
 └── Next.js 15 Bootstrap & FastAPI Bootstrap (Travel AI)
 └── Instagram Reel Media Provider (yt-dlp) & Frame Extraction

2026-08 (AI Extraction & Scoring Milestone)
 └── Multi-Signal Pipeline: Whisper Audio + EasyOCR + Stopword Filtering
 └── Google Places Candidate Resolution & Gemini Multimodal Verification
 └── Stage 7 Benchmark (100% on 17 Scored Cases) & Stage 8 Expansion (89.4% on 47 Scored Cases)
 └── Production Hardening, Observability (RequestContext), and Security Policies

2026-08-25 to 2026-09 (Cloud & Mobile Foundation)
 └── Supabase Auth (Google/Apple OAuth via PKCE) & Row-Level Security (RLS)
 └── React Native / Expo SDK 57 Mobile Client established as Primary Product Surface
 └── Offline-First Locker Architecture with Async Queue

2026-10 (VAMO Transformation & Atmosphere Engine)
 └── Rebrand: Travel AI → VAMO (Cosmos Dark Editorial Visual Identity)
 └── Stages A, B, C: Honesty fix, Explore/Saved dossier, Auth & Accessibility
 └── Stage D1: Five-tier mathematical palette resolver (D-001 to D-007)
 └── Stage D1 Pivot: Photo-first cinematic destination atmosphere over flat palettes (D-008)

2026-10-23 to 2026-10-24 (Zero-Cost Places Migration & Destination Experience Fix)
 └── Migration from Google Places to OpenStreetMap (Nominatim, Overpass, Wikimedia)
 └── Enforce zero-cost API constraint: Google Places disabled
 └── Destination Experience Fix (Uncommitted working tree):
      ├── Canonical Display Name & Country Deduplication (Jeju, Kyoto, Bali, Paris, NYC)
      ├── Six-tier photo resolution chain with answering-tier telemetry
      ├── Factual 5-line Overview replacing raw debug evidence
      ├── Open-Meteo 5-year historical weather normals & tropical dry/wet season logic
      ├── Sourced travel tips only (removal of generic safety boilerplate)
      ├── Transparent macroeconomic budget model (World Bank ICP + ECB Frankfurter)
      └── Parallel tri-service enrichment execution with strict 4.0-second timeout caps
```

---

## 5. Product and Branding Decisions

### D-014 — Evolution from Travel AI to VAMO: Cosmos-Inspired Editorial Identity

- **Status:** Implemented
- **Date:** 2026-10-17
- **Decision:** Rebrand the application from "Travel AI" to **VAMO**, abandoning the generic alabaster/monochrome utility look in favor of a luxury, Cosmos-inspired, photography-led travel identity.
- **Context:** Early mobile prototypes utilized a warm alabaster background (`#F7F7F5`) with black text and basic card grids. While clean, user testing and product evaluation revealed it felt like a generic utility rather than an evocative, inspiring travel experience.
- **Rationale:** Travel discovery is fundamentally visual and emotional. Adopting deep onyx canvases (`#081218`), Ivory Mist typography (`#FBF4E3`), subtle frosted glass surfaces, and surgical Racing Red (`#EB2627`) CTAs creates an immersive, editorial aesthetic reminiscent of high-end travel journals and cinema.
- **Consequences:**
  - *Gain:* Distinctive, premium market positioning; dramatic visual hierarchy where destination photography is the hero.
  - *Risk:* Dark themes on mobile require strict WCAG contrast clamping to ensure readability across all ambient light conditions.
- **Evidence:** [`mobile/constants/theme.ts`](../mobile/constants/theme.ts), [`docs/DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md), commits `58eb9eb`, `ea12f43`.
- **Supersedes:** Early Alabaster Design System documented in [`docs/DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md).

---

### D-015 — Epistemic Honesty and Absolute Ban on Fabricated Facts or Progress

- **Status:** Accepted
- **Date:** 2026-10-20
- **Decision:** The application and backend must never fabricate data, invent star ratings, invent review counts, generate fake progress percentages, or produce false geographic certainty. When information is unavailable, the system must omit the field, show honest fallback states, or cleanly abstain.
- **Context:** Many consumer AI apps simulate certainty by generating plausible-sounding facts, fake star ratings (e.g. defaulting to 4.8 stars), or synthetic progress bars that crawl from 0% to 99%. In early Travel AI stages, places lacking Google ratings occasionally fell back to default synthetic numbers or unverified trivia.
- **Rationale:** Fabricated travel data is dangerous to travelers and destroys user trust. If an OSM node has no user rating, `rating` must be `None` (never `4.5`). If an Instagram Reel provides insufficient geographic evidence, the engine must return `best_guess: null` rather than a random guess. If analysis takes 40 seconds, the UI must show actual elapsed time, not a fake progress bar.
- **Consequences:**
  - *Gain:* Unimpeachable product integrity; travelers can trust every displayed metric.
  - *Trade-off:* The UI must gracefully handle sparse data (e.g. destinations with no ratings, no tips, or no weather normals).
- **Evidence:** [`docs/PRD.md`](PRD.md), [`engine/domain/schemas/responses.py`](../engine/domain/schemas/responses.py), [`mobile/components/ui/ConfidenceBadge.tsx`](../mobile/components/ui/ConfidenceBadge.tsx), commit `d10b3de`.

---

### D-035 — Product Scope Boundaries and Explicitly Deferred Features

- **Status:** Accepted
- **Date:** 2026-08-08 (Updated 2026-10-24)
- **Decision:** The core product loop is strictly defined as: **Instagram Reel URL $\rightarrow$ Identified Real-World Destination $\rightarrow$ Multimodal Verification $\rightarrow$ Contextual Dossier $\rightarrow$ Interactive Map $\rightarrow$ Offline Locker**. All other potential features are formally deferred.
- **Context:** Product discussions suggested adding social feeds, multi-city trip routing, live flight booking engines, and user comment systems.
- **Rationale:** Attempting to build a social network or booking engine would dilute focus from solving the hardest core problem: accurately identifying real-world destinations from messy, unstructured social video.
- **Consequences:**
  - *In-Scope:* Reel validation, multi-signal evidence extraction, candidate geocoding, multimodal verification, weather normals, budget estimation, nearby POIs, offline bookmarks.
  - *Deferred:* Live flight and hotel booking quotes, multi-user shared itineraries, user-submitted reels feed, public comment threads.
- **Evidence:** [`docs/PRD.md`](PRD.md), [`docs/DEVLOG.md`](DEVLOG.md).

---

## 6. Architecture and Technology Stack Decisions

### D-013 — Mobile-First Architecture: React Native / Expo as the Primary Product Surface

- **Status:** Accepted
- **Date:** 2026-08-15
- **Decision:** Establish the native mobile client (`mobile/`, built with React Native 0.86, Expo SDK 57, and Expo Router) as the primary, authoritative product surface. The web application (`web/`, Next.js 15) is relegated to an exploratory desktop prototype.
- **Context:** The project began with a Next.js web application (`0407a07`). However, travel content consumption (Instagram Reels) occurs almost exclusively on mobile devices.
- **Rationale:** Travelers discover reels inside the native Instagram mobile app. A native mobile client allows seamless clipboard pasteboard detection, native haptic feedback, offline bookmarking via encrypted device storage, and direct deep-linking to native Apple Maps and Google Maps.
- **Consequences:**
  - *Gain:* Native mobile ergonomics, 60fps gesture navigation, offline storage capability.
  - *Trade-off:* Requires managing mobile builds (Expo EAS, React Native architecture).
- **Evidence:** [`docs/AGENTS.md`](AGENTS.md), [`docs/PRD.md`](PRD.md), [`mobile/package.json`](../mobile/package.json), commits `cbcf984`, `025dd05`, `4d9eb34`.
- **Supersedes:** Next.js Web Application as primary surface.

---

### D-036 — Standalone FastAPI Python Intelligence Engine and Service Separation

- **Status:** Accepted
- **Date:** 2026-07-20
- **Decision:** Implement the backend as a standalone Python FastAPI service (`engine/`) completely decoupled from frontend runtimes, communicating exclusively via typed REST endpoints (`/analyze`, `/health`).
- **Context:** Initial consideration was given to running extraction scripts inside Next.js API route workers or Node.js child processes.
- **Rationale:** Heavy multimodal machine learning libraries (PyTorch, Whisper, OpenCV, EasyOCR) and video ingestion tools (`yt-dlp`) have first-class, high-performance support in Python. Running these inside Node.js or edge runtimes is inefficient and fragile.
- **Consequences:**
  - *Gain:* Clean separation of concerns; backend can be scaled independently on GPU/CPU compute instances.
  - *Trade-off:* Requires managing a separate Python virtual environment and dependency tree.
- **Evidence:** [`docs/ARCHITECTURE.md`](ARCHITECTURE.md), [`docs/DEVLOG.md`](DEVLOG.md), [`engine/app/main.py`](../engine/app/main.py), commits `d4d99c4`, `6ad2a79`.

---

### D-016 — Places Provider Migration: Transition from Google Places to OpenStreetMap (Nominatim & Overpass)

- **Status:** Implemented
- **Date:** 2026-10-23
- **Decision:** Replace Google Places with an open-source, zero-cost places architecture (`OsmProvider`) utilizing Nominatim for geocoding and Overpass API for categorized POI search.
- **Context:** Early backend versions relied on Google Places API (`37df366`, `6e7cec1`). However, high API call volumes during candidate resolution and nearby searches introduced significant cost exposure and strict quota limitations.
- **Rationale:** OpenStreetMap (OSM) data is free, open, and provides rich community-maintained geographic metadata (including `wikidata` and `wikipedia` tags). Pairing Nominatim for structured geocoding with Overpass for bounding-box POI queries eliminates external API cost.
- **Consequences:**
  - *Gain:* 100% zero API costs for place search; no API key dependencies; access to linked Wikidata QIDs.
  - *Trade-off:* Nominatim enforces a strict rate limit of 1 request/second and requires a descriptive User-Agent header; Overpass query execution can experience latency under heavy server load.
- **Evidence:** [`engine/app/services/places/osm_provider.py`](../engine/app/services/places/osm_provider.py), [`engine/app/services/places/nominatim_client.py`](../engine/app/services/places/nominatim_client.py), [`engine/app/services/places/overpass_client.py`](../engine/app/services/places/overpass_client.py), commit `75f5fb4`.
- **Supersedes:** Google Places Provider (`GooglePlacesProvider`).

---

### D-017 — Strict Architectural Ban on Paid Places APIs and Google Places Inactivation

- **Status:** Accepted
- **Date:** 2026-10-23
- **Decision:** Under active project constraints, Google Places must remain disabled. No paid places API may be introduced without an explicit decision changing this constraint and user sign-off.
- **Context:** The codebase contains legacy Google Places integration code in [`engine/app/services/places/google_provider.py`](../engine/app/services/places/google_provider.py).
- **Rationale:** Prevents unintended cloud billing and ensures the project remains 100% deployable on free/open-source tiers.
- **Consequences:**
  - All places, geocoding, and POI resolution must be satisfied via `OsmProvider` and open-source clients.
  - Google Places API keys must not be required for standard application operation.
- **Evidence:** [`engine/app/services/places/factory.py`](../engine/app/services/places/factory.py), commit `75f5fb4`.

---

### D-018 — Supabase Backend-as-a-Service for Authentication and Cloud Sync with Row-Level Security

- **Status:** Implemented (Evidenced in schemas and client; live cloud verification pending external credentials)
- **Date:** 2026-08-25 (Hardened 2026-10-24)
- **Decision:** Use Supabase for managed PostgreSQL storage, Google/Apple OAuth via PKCE flow, and cloud synchronization of user-saved places (`saved_places`) and analysis history (`analysis_history`), guarded by Row-Level Security (RLS).
- **Context:** Needed a secure, scalable authentication and persistence backend without maintaining custom authentication servers, token refresh daemons, or user databases.
- **Rationale:** Supabase provides built-in OAuth PKCE handling compatible with mobile deep links (`travelai://auth/callback`), automatic JWT token refresh, and PostgreSQL RLS policies that enforce tenant isolation directly at the database engine level.
- **Consequences:**
  - *Gain:* Zero custom auth server code; strict database-enforced row isolation (`auth.uid() = user_id`).
  - *Trade-off:* Requires configuring external OAuth consent screens in Google Cloud Console and Apple Developer portals.
- **Evidence:** [`docs/AUTHENTICATION.md`](AUTHENTICATION.md), [`docs/DATABASE.md`](DATABASE.md), [`supabase/migrations/`](../supabase/), [`mobile/lib/supabase/client.ts`](../mobile/lib/supabase/client.ts), commits `2935f64`, `d844cf5`, `2fe1cf5`, `686016e`.

---

### D-019 — Mobile Offline-First Architecture with Serialized Local Storage Queue

- **Status:** Accepted
- **Date:** 2026-08-26
- **Decision:** Implement an offline-first bookmarking architecture using `@react-native-async-storage/async-storage` backed by an in-memory cache and serialized write queue. Cloud synchronization operates as a background secondary layer.
- **Context:** Travelers frequently use travel apps in airplanes, subway transit, or remote destinations with poor cellular connectivity. An app that fails to save or load bookmarks offline is unusable.
- **Rationale:** Reading and toggling bookmarks must have 0ms latency. Queuing local writes to AsyncStorage ensures immediate UI responsiveness. When the user is signed in and online, bookmarks sync to Supabase in the background.
- **Consequences:**
  - *Gain:* Instant UI feedback; 100% offline availability of saved destinations.
  - *Trade-off:* Requires careful conflict resolution when syncing offline edits back to the cloud.
- **Evidence:** [`mobile/lib/storage/saved-places.ts`](../mobile/lib/storage/saved-places.ts), [`mobile/scripts/test-network.ts`](../mobile/scripts/test-network.ts), commits `e41cf50`, `be87e71`.

---

### D-020 — Structured Observability, Request Tracing, and Error Classification

- **Status:** Accepted
- **Date:** 2026-08-10
- **Decision:** Build a zero-dependency observability layer (`engine/observability/`) featuring `RequestContext` for tracking `X-Request-ID` across pipeline stages, timing individual external calls, and classifying failures into 10 deterministic categories with strict credential redaction.
- **Context:** Debugging multi-stage video extraction and candidate resolution pipelines across asynchronous network calls was difficult without end-to-end tracing.
- **Rationale:** Context vars (`contextvars.ContextVar`) provide async-safe, thread-safe request tracking without adding heavy APM dependencies (e.g. Datadog or OpenTelemetry). Deterministic error classification enables honest user feedback.
- **Consequences:**
  - *Gain:* Granular stage duration logging; zero credential leaks in logs; actionable HTTP error responses.
  - *Trade-off:* Developers must ensure `get_current_context()` is passed across thread pool boundaries.
- **Evidence:** [`engine/observability/context.py`](../engine/observability/context.py), [`engine/observability/errors.py`](../engine/observability/errors.py), [`docs/observability.md`](observability.md), commit `f3449dc`.

---

## 7. Destination Identification and Confidence Decisions

### D-009 — Multi-Signal Evidence Extraction Pipeline (Caption, OCR, Whisper, Frames)

- **Status:** Accepted
- **Date:** 2026-07-28
- **Decision:** Fuse evidence across four independent modalities: caption text, OCR overlay text, Whisper audio speech transcription, and keyframe image analysis, structured into an adaptive staged pipeline.
- **Context:** Travel creators often omit destination names from captions, mentioning them only in voiceovers or overlay text. Relying on a single modality resulted in high failure rates.
- **Rationale:** Staged extraction with early-exit allows fast resolution when captions are explicit, while falling back gracefully to Whisper speech transcription and OCR when captions are sparse or misleading.
- **Consequences:**
  - *Gain:* High extraction recall across diverse creator posting styles.
  - *Trade-off:* Full multi-modal processing (audio download + speech model + OCR) increases worst-case pipeline runtime.
- **Evidence:** [`engine/app/services/extraction/evidence_builder.py`](../engine/app/services/extraction/evidence_builder.py), [`engine/app/services/speech/speech_service.py`](../engine/app/services/speech/speech_service.py), [`engine/app/services/ocr/ocr_service.py`](../engine/app/services/ocr/ocr_service.py), commits `fe0f002`, `1ec7671`, `b27df62`.

---

### D-010 — Typo-Tolerant Candidate Generation, Geographic Normalization, and Stopword Filtering

- **Status:** Accepted
- **Date:** 2026-08-05 (Hardened 2026-10-24)
- **Decision:** Implement candidate extraction with geographic entity dictionaries (`KNOWN_GEOGRAPHIC_ENTITIES`), aggressive stopword removal, and `difflib.SequenceMatcher` typo tolerance (similarity $\ge 0.70$ for tokens $\ge 5$ characters).
- **Context:** Video compression artifacts and stylized fonts frequently corrupt OCR strings (e.g. `"Cnennai"` instead of `"Chennai"`). In Stage 5 benchmarks, this caused Case #3 to fail.
- **Rationale:** Combining normalized gazetteer lookups with controlled typo tolerance allows the engine to recover misrecognized text without accepting arbitrary dictionary noise.
- **Consequences:**
  - *Gain:* Fixed benchmark failures (Chennai Case #3); improved candidate extraction precision.
  - *Trade-off:* The recognized entities gazetteer must be continuously maintained.
- **Evidence:** [`engine/app/services/location/candidate_service.py`](../engine/app/services/location/candidate_service.py), [`docs/benchmark/stage-7-regression-report.md`](benchmark/stage-7-regression-report.md), commits `8e31049`, `2a11d14`.

---

### D-011 — Multi-Signal Scoring Engine and Truthful Abstention Architecture

- **Status:** Accepted
- **Date:** 2026-08-08 (Hardened 2026-10-24)
- **Decision:** Score candidate destinations across multiple independent signals (token matches, travel keywords, geographic hierarchy completeness, popularity, and commercial business penalties). When evidence is insufficient or contradictory, the engine must return `best_guess: null`.
- **Context:** Search results from geocoders often return irrelevant commercial businesses or distant homonymous towns when queried with sparse keywords.
- **Rationale:** Multi-dimensional scoring discounts commercial clutter (e.g. travel agencies or cafes named after famous places) and rewards true geographic destinations. Negative control tests (e.g. Benchmark Case #2) verify that unidentifiable reels produce clean abstention rather than hallucinated destinations.
- **Consequences:**
  - *Gain:* Robust protection against false certainty and incorrect destinations.
  - *Trade-off:* The threshold for claiming high confidence is intentionally conservative.
- **Evidence:** [`engine/app/services/scoring/scoring_service.py`](../engine/app/services/scoring/scoring_service.py), [`engine/domain/schemas/responses.py`](../engine/domain/schemas/responses.py), commit `2f6fbdf`, Stage 7 Benchmark Report Case #2.

---

### D-012 — Gemini Multimodal Verification as a Stage-Gated Final Arbiter

- **Status:** Accepted
- **Date:** 2026-08-08
- **Decision:** Use Google Gemini vision models not as open-ended search engines, but as a bounded, stage-gated verification arbiter comparing candidate landmarks against extracted video keyframes.
- **Context:** Sending raw video frames to LLMs without geographic candidates is expensive, slow, and prone to geographic hallucinations.
- **Rationale:** Restricting Gemini to verifying the top 3–5 scored candidates against keyframe visual evidence constrains the prompt space, reduces token costs, and provides deterministic verification scores (`gemini_confidence`).
- **Consequences:**
  - *Gain:* High verification accuracy with bounded latency and token consumption.
  - *Trade-off:* Requires valid Google Gemini API credentials.
- **Evidence:** [`engine/app/services/gemini/gemini_verifier.py`](../engine/app/services/gemini/gemini_verifier.py), [`engine/app/services/gemini/gemini_vision_service.py`](../engine/app/services/gemini/gemini_vision_service.py), commits `b37b34e`, `de1450c`.

---

### D-022 — Canonical Display Name Normalization and Country Deduplication (Destination Experience Fix)

- **Status:** Implemented (Uncommitted working tree & tests)
- **Date:** 2026-10-24
- **Decision:** Implement canonical display-name builders in both engine ([`canonical_display_name.py`](../engine/app/services/location/canonical_display_name.py)) and mobile ([`display-name.ts`](../mobile/lib/location/display-name.ts)) to eliminate duplicate country and alias tokens (e.g. `"Jeju Island, South Korea, South Korea"` $\rightarrow$ `"Jeju Island, South Korea"`). Crucially, this normalization is **presentation-only**: underlying structured fields (`city`, `region`, `country`, `coordinates`) remain completely untouched.
- **Context:** Nominatim and OSM reverse geocoding frequently concatenate administrative entities into the place name, while response builders appended the country again, resulting in jarring UI text like `"Jeju Island, South Korea, South Korea"` or `"Kyoto, Kansai, Japan, Japan"`.
- **Rationale:** A dedicated, case-insensitive, punctuation-aware normalizer with a comprehensive country alias mapping (`COUNTRY_ALIASES` mapping Korea, ROK, Republic of Korea $\rightarrow$ South Korea; US, USA $\rightarrow$ United States; UK $\rightarrow$ United Kingdom) cleans the display title without risking data loss in structured database fields.
- **Consequences:**
  - *Gain:* Clean, professional, duplicate-free destination titles across all screens.
  - *Preservation:* Underlying geocoding coordinates, administrative regions, and database columns remain 100% intact.
- **Evidence:** [`engine/app/services/location/canonical_display_name.py`](../engine/app/services/location/canonical_display_name.py), [`mobile/lib/location/display-name.ts`](../mobile/lib/location/display-name.ts), [`engine/tests/test_display_name_builder.py`](../engine/tests/test_display_name_builder.py), [`mobile/lib/location/__tests__/display-name.test.ts`](../mobile/lib/location/__tests__/display-name.test.ts).

---

### D-023 — Jeju Island as a Golden Regression Fixture, Not a Production Hardcode

- **Status:** Accepted
- **Date:** 2026-10-24
- **Decision:** Explicitly document and treat Jeju Island as a **golden regression fixture**, NOT a hardcoded production destination or default fallback.
- **Context:** Jeju Island has been extensively used during the Destination Experience Fix to stress-test country deduplication, Korean alias mapping, Wikidata overview parsing, Open-Meteo normals, and KRW/INR budget estimation.
- **Rationale:** Highlighting Jeju as a golden fixture ensures developers understand its role as an automated test baseline and prevents any developer from accidentally hardcoding Jeju into production fallback paths.
- **Consequences:**
  - Jeju fixtures exist strictly in automated test suites ([`test_display_name_builder.py`](../engine/tests/test_display_name_builder.py)) and dev harnesses ([`results-fixtures.ts`](../mobile/lib/fixtures/results-fixtures.ts)). Production code must resolve any global destination dynamically.
- **Evidence:** [`engine/tests/test_display_name_builder.py`](../engine/tests/test_display_name_builder.py), [`mobile/lib/fixtures/results-fixtures.ts`](../mobile/lib/fixtures/results-fixtures.ts), [`engine/tests/test_accuracy_regression_fixtures.py`](../engine/tests/test_accuracy_regression_fixtures.py).

---

## 8. Photo and Visual Atmosphere Decisions

### D-001 — Five-Tier Adaptive Atmosphere Palette Resolver Architecture

- **Date:** 2026-10-17
- **Status:** Superseded (in part by D-008)
- **Context:** VAMO screens must adapt their atmospheric background to reflect the verified destination without causing jarring color jumps, unreadable text, or hard failures when destination metadata is incomplete.
- **Options considered:**
  1. *Flat static background theme:* Single dark canvas (`#081218`) across all screens.
  2. *Single image-extraction-only system:* Rely entirely on extracting dominant colors from hero photography at runtime.
  3. *Five-tier priority resolver:* Hierarchical resolution: (1) Extracted hero photo palette $\rightarrow$ (2) Curated city preset $\rightarrow$ (3) Curated country preset $\rightarrow$ (4) Deterministic hue fallback derived from place string $\rightarrow$ (5) VAMO default atmosphere.
- **Decision:** Adopt the Five-Tier Priority Resolver (`extracted_photo` $\rightarrow$ `city_preset` $\rightarrow$ `country_preset` $\rightarrow$ `deterministic_fallback` $\rightarrow$ `system_default`).
- **Reasoning:** Guarantees that every place has a beautiful, rich cinematic atmosphere even when offline, when photos fail to load, or when third-party image extraction is unavailable. Prioritizing curated city and country palettes ensures intentional art direction while deterministic hashing ensures unknown destinations still receive an organic, reproducible identity.
- **Rejected alternatives:**
  * Option 1 was rejected because it removes the signature adaptive atmosphere that makes VAMO feel alive and place-aware.
  * Option 2 was rejected because user analysis can produce destinations without photos or network failures can drop images, leading to broken UI.
- **Trade-offs and risks:**
  * *Gain:* Deterministic, instant, offline-capable color resolution across 100% of destinations.
  * *Risk:* Caching or normalizing place names requires careful string normalization.
- **Affected files/modules:**
  * [`mobile/lib/atmosphere/palette-resolver.ts`](../mobile/lib/atmosphere/palette-resolver.ts)
  * [`mobile/lib/atmosphere/presets.ts`](../mobile/lib/atmosphere/presets.ts)
  * [`mobile/types/atmosphere.ts`](../mobile/types/atmosphere.ts)
  * [`mobile/components/ui/AtmosphereBackground.tsx`](../mobile/components/ui/AtmosphereBackground.tsx)
- **Validation:** Automated test verifying that all 5 tiers resolve correctly given mock inputs: hero photo, city name, country name, unlisted country, and null place. Verified across 351 palettes with 0 test failures.
- **Superseded by:** [D-008](#d-008--image-led-atmospheric-architecture-destination-photography-over-palette-theming) for full-screen background canvas; palette resolver retained for subtle glow highlights, border accents, and badge contrast.

---

### D-002 — Interface-Only Image-Color Extraction Contract Without Native Dependencies

- **Date:** 2026-10-17
- **Status:** Accepted
- **Context:** Tier 1 of the palette resolver accepts extracted colors from destination hero photos. Adding native libraries like `react-native-image-colors` or native image decoders requires native build changes (Expo Config Plugins / EAS custom client) and adds binary bloat.
- **Options considered:**
  1. *Install `react-native-image-colors` immediately.*
  2. *Simulate image color extraction with random/pseudo-generated palettes.*
  3. *Build a clean, typed image-color extraction contract interface in D1 with no native dependencies, deferring library installation to explicit approval.*
- **Decision:** Implement Option 3: Define a strongly-typed `ImagePaletteExtractor` interface and resolution pipeline that can ingest pre-extracted or externally extracted color swatches, without installing native dependencies in Stage D1.
- **Reasoning:** Adheres strictly to the project non-negotiable rule ("Do not add any dependency without explicit approval"). Prepares the app architecture cleanly for native extraction without blocking or destabilizing the standard Expo build workflow.
- **Rejected alternatives:**
  * Option 1 violated project rules against unapproved dependencies.
  * Option 2 violated the rule against fabricating extracted palette state.
- **Trade-offs and risks:**
  * *Gain:* Zero dependency bloat, 100% build stability across standard Expo runtime.
  * *Risk:* Tier 1 (hero photo extraction) cleanly passes through to Tier 2 (curated city) or Tier 3 (curated country) until a native extractor is approved.
- **Affected files/modules:**
  * [`mobile/types/atmosphere.ts`](../mobile/types/atmosphere.ts)
  * [`mobile/lib/atmosphere/palette-resolver.ts`](../mobile/lib/atmosphere/palette-resolver.ts)
- **Validation:** Type check and resolver execution verified that when `heroPhotoUrl` is provided without extracted swatch metadata, the resolver smoothly falls through to curated presets without runtime errors.

---

### D-003 — Curated Global City and Country Presets with Deterministic Hashed Fallback

- **Date:** 2026-10-17
- **Status:** Accepted
- **Context:** VAMO requires distinct, place-appropriate atmospheres for global destinations while preventing clashing colors, low contrast, or cultural stereotypes. Uncatalogued destinations must not crash or fall back to an ugly generic gray.
- **Options considered:**
  1. *Small list of 5 hardcoded country presets with generic black fallback.*
  2. *Dynamic LLM-generated hex colors from backend on every analysis.*
  3. *50 Curated presets (10 well-known cities + 40 diverse countries) with 32-bit hashed deterministic fallback clamped to safe lightness/saturation bands.*
- **Decision:** Implement Option 3: Curate 10 cities and 40 countries, with a mathematical 32-bit hash function (`djb2`) mapping normalized strings to clamped HSL color stops.
- **Reasoning:** Curated presets provide hand-crafted cinematic palettes grounded in natural light and landscape geography (e.g., Aegean caldera deep blue for Oia, Arashiyama moss for Kyoto). The deterministic fallback guarantees that any valid place string (e.g., "Faroe Islands") produces a stable, repeatable, high-contrast palette across app launches without network calls.
- **Rejected alternatives:**
  * Option 1 failed to provide useful global coverage and felt generic.
  * Option 2 added backend latency, token costs, and unpredictability to UI rendering.
- **Trade-offs and risks:**
  * *Gain:* Zero latency, zero API costs, repeatable colors, curated visual quality.
  * *Risk:* City/country presets require ongoing maintenance as new popular destinations emerge.
- **Affected files/modules:**
  * [`mobile/lib/atmosphere/presets.ts`](../mobile/lib/atmosphere/presets.ts)
  * [`mobile/lib/atmosphere/deterministic.ts`](../mobile/lib/atmosphere/deterministic.ts)
- **Validation:** 51/51 presets tested and passed; 300/300 randomly generated hashed fallbacks verified to pass 100% of contrast rules via automated test script `scripts/validate-atmosphere-contrast.ts`. Total: 351/351 passed (100%).

---

### D-004 — Global AtmosphereProvider Architecture and Active-Place State Ownership

- **Date:** 2026-10-17
- **Status:** Accepted
- **Context:** As users navigate between Explore, Analyze, Saved, History, and Place Details, the app atmosphere must remain cohesive. Results, Place Detail, and History detail screens must display their own destination's atmosphere, and navigating between general tabs must not randomly reset the active place.
- **Options considered:**
  1. *Local per-screen `AtmosphereBackground` state without global sharing.*
  2. *Global Redux / Zustand store holding active place.*
  3. *Lightweight React Context `AtmosphereProvider` integrated into Root Layout, coupled with existing `analysisStore`.*
- **Decision:** Adopt Option 3: Centralized `AtmosphereProvider` wrapping the root navigation stack, maintaining `activePlace` and `activePalette`, with screen-level overrides for detail screens.
- **Reasoning:** Respects the existing architecture (`analysisStore` for session state, `saved-places` for persisted bookmarks) without introducing heavy state libraries. Avoids duplicate sources of truth by accepting place models directly from screens when focused.
- **Rejected alternatives:**
  * Option 1 was rejected because returning from Results to Analyze would abruptly drop the atmosphere back to default, destroying the feeling of an active session.
  * Option 2 was rejected because introducing Redux or Zustand violates rules against unapproved dependencies.
- **Trade-offs and risks:**
  * *Gain:* Cohesive atmospheric continuity across tabs; zero external dependencies.
  * *Risk:* Navigation listeners must not trigger re-renders unless the active place identifier actually changes.
- **Affected files/modules:**
  * [`mobile/context/AtmosphereContext.tsx`](../mobile/context/AtmosphereContext.tsx)
  * [`mobile/app/_layout.tsx`](../mobile/app/_layout.tsx)
  * [`mobile/components/ui/AtmosphereBackground.tsx`](../mobile/components/ui/AtmosphereBackground.tsx)
- **Validation:** Integrated into RootLayout; verified across all tab routes and detail screens (`results.tsx`, `place/[id].tsx`, `history/[id].tsx`).

---

### D-005 — Two-Layer Gradient Opacity Crossfade with Accessible Reduced-Motion Support

- **Date:** 2026-10-17
- **Status:** Accepted
- **Context:** Switching between destinations or tabs with different palettes could cause a harsh color cut or visual flicker if rendered via a single gradient stop mutation.
- **Options considered:**
  1. *Immediate color cut (no transition).*
  2. *Color interpolation using Reanimated worklet.*
  3. *Two stacked `LinearGradient` layers with opacity crossfade (400–600ms), bypassing animation when Reduce Motion is enabled.*
- **Decision:** Implement Option 3: Maintain two stacked gradient surfaces (current palette underneath, incoming palette fading in over 450ms). Check `AccessibilityInfo.isReduceMotionEnabled()` to make transitions instantaneous for sensitive users.
- **Reasoning:** `expo-linear-gradient` natively re-renders gradient stop arrays on prop changes; crossfading opacity on a native layer view is hardware-accelerated, respects 60 FPS budgets, and avoids complex color-math interpolation on the JS thread.
- **Rejected alternatives:**
  * Option 1 was rejected as visually jarring and unpolished.
  * Option 2 was rejected because multi-stop gradient color interpolation across RGB/HSL vectors in JS or worklets introduces runtime overhead on low-end Android devices.
- **Trade-offs and risks:**
  * *Gain:* Silk-smooth 450ms transitions, native thread execution, accessible reduced-motion support.
  * *Risk:* Brief period during transition where two full-screen views are composited.
- **Affected files/modules:**
  * [`mobile/components/ui/AtmosphereBackground.tsx`](../mobile/components/ui/AtmosphereBackground.tsx)
  * [`mobile/context/AtmosphereContext.tsx`](../mobile/context/AtmosphereContext.tsx)
- **Validation:** Implemented with 450ms timing (within 400-600ms target). Tested `AccessibilityInfo.isReduceMotionEnabled()` listener and instant swap branch.

---

### D-006 — Automated WCAG 2.1 Contrast Clamping and Racing Red CTA Protection

- **Date:** 2026-10-17
- **Status:** Accepted
- **Context:** Dynamic backgrounds risk rendering white/ivory text unreadable if top or mid gradient stops become too bright ($L > 0.20$), or rendering Racing Red (`#EB2627`) CTAs invisible against warm terracotta/reddish backgrounds.
- **Options considered:**
  1. *Manual developer eyeballing of colors.*
  2. *Dynamic text color flipping (Ivory vs Black).*
  3. *Mathematical WCAG 2.1 contrast clamp on palette generation + 1px Ivory Mist outline ring around Racing Red CTAs.*
- **Decision:** Implement Option 3: Strictly enforce mathematical relative luminance limits on palette generation. Normal text on `mid` and `bottom` must achieve $\ge 4.5:1$; large text on `top` must achieve $\ge 3.0:1$. Racing Red CTAs on `bottom` must achieve $\ge 3.0:1$. When composited on mid/top or warm backgrounds, CTAs feature a 1px Ivory Mist ring.
- **Reasoning:** Preserves VAMO's strict aesthetic rule that primary text is Ivory Mist (`#FBF4E3`) and avoids ugly dark text inversions on the dark canvas. Automated clamping ensures deterministic fallback palettes can never violate readability.
- **Rejected alternatives:**
  * Option 1 was rejected as error-prone and non-deterministic.
  * Option 2 was rejected because black text on an atmospheric background destroys visual hierarchy and feels cheap.
- **Trade-offs and risks:**
  * *Gain:* 100% mathematically verified text legibility and AAA contrast across all screens.
  * *Risk:* Bright pastel gradient stops are prohibited by design.
- **Affected files/modules:**
  * [`mobile/lib/atmosphere/contrast.ts`](../mobile/lib/atmosphere/contrast.ts)
  * [`mobile/lib/atmosphere/deterministic.ts`](../mobile/lib/atmosphere/deterministic.ts)
  * [`mobile/components/ui/PillButton.tsx`](../mobile/components/ui/PillButton.tsx)
  * [`mobile/scripts/validate-atmosphere-contrast.ts`](../mobile/scripts/validate-atmosphere-contrast.ts)
- **Validation:** Verified via `scripts/validate-atmosphere-contrast.ts`. 51 presets + 300 deterministic fallbacks passed with 0 violations. Minimum Ivory on Mid ratio: 12.77:1 (well above 4.5:1 requirement); Minimum Ivory on Bottom ratio: 17.10:1; Minimum Racing Red on Bottom ratio: 4.32:1.

---

### D-007 — Isolated Development-Only Atmosphere Preview and Stress-Testing Fixtures

- **Date:** 2026-10-17
- **Status:** Accepted
- **Context:** Designers and engineers need a dedicated harness to inspect palettes, check contrast, and test fallbacks without having to trigger real network analyses or tamper with production storage.
- **Options considered:**
  1. *Storybook integration.*
  2. *Dev route at `/dev/atmosphere` with 9 required fixtures and live contrast badges.*
- **Decision:** Implement Option 2: Dedicated Expo Router screen at `mobile/app/dev/atmosphere.tsx`, strictly gated by `if (!__DEV__) return null;`, containing synthetic and real fixtures.
- **Reasoning:** Zero new dependencies, instant access in local dev builds, directly uses production React Native rendering and theme tokens.
- **Rejected alternatives:**
  * Option 1 was rejected because Storybook requires extensive native setup, extra dependencies, and is heavy to maintain in Expo Router.
- **Trade-offs and risks:**
  * *Gain:* Instant visual feedback, verified contrast scores, switchable test cases.
  * *Risk:* Must ensure the dev route cannot be accessed in production release builds.
- **Affected files/modules:**
  * [`mobile/app/dev/atmosphere.tsx`](../mobile/app/dev/atmosphere.tsx)
  * [`mobile/app/_layout.tsx`](../mobile/app/_layout.tsx)
- **Validation:** TypeScript type-check passing (`tsc --noEmit`), route gated with `__DEV__`, renders all 9 fixtures with live contrast badges and tier telemetry without crashing.

---

### D-008 — Image-Led Atmospheric Architecture: Destination Photography over Palette Theming

- **Date:** 2026-10-19
- **Status:** Accepted
- **Context:** While Stage D1 originally focused on an adaptive mathematical color palette resolver, the resulting user experience felt like a flat city/country color-themed app (blues, greens, terracottas) rather than an immersive, photography-first travel app. VAMO's signature visual identity is image-led, cinematic, and glassmorphic.
- **Options considered:**
  1. *Retain palette-dominant background with photography only on hero cards:* Keeps backgrounds colored by preset stops.
  2. *Full-bleed unblurred photography across all screens:* Distracts from text and makes complex forms/lists hard to read.
  3. *Full-screen destination photography with tasteful blur (20px), dark translucent scrim (60%), and double-buffered 450ms crossfade:* Places foreground content inside frosted/dark glass surfaces over authentic destination photography.
- **Decision:** Adopt Option 3: Replace palette-driven background gradients with full-screen blurred destination photography across all screens.
  * Before analysis: Displays local bundled discovery photography (`DEFAULT_DISCOVERY_IMAGE`).
  * On destination discovery: Resolves verified destination photos, curated city photography, or retains previous valid image on error.
  * Treatment: Tasteful 20px blur, 60% dark translucent overlay (`rgba(6, 12, 16, 0.60)`), top/bottom protective vignettes, and subtle ambient glow (`0.12` opacity) from the palette resolver.
  * Contrast: Preserves Ivory Mist (`#FBF4E3`) typography, Onyx surfaces, and Racing Red (`#EB2627`) CTAs.
  * Android performance: Wraps the background composite in `BlurTargetView` so all `GlassView` components sample the blurred composite natively without re-computing heavy blurs.
  * Palette resolver role: Retained for small accents, glow highlights, fallback contrast, and badge telemetry—never dictates overall background color.
- **Rejected alternatives:**
  * Option 1 was rejected because VAMO is fundamentally an image-led discovery experience, not a palette-themed app.
  * Option 2 was rejected because raw photography behind complex lists and cards causes severe text legibility issues and fails WCAG contrast standards.
- **Trade-offs and risks:**
  * *Gain:* Breathtaking, cinematic, place-aware discovery atmosphere that reacts immediately to destination identification; 100% offline-ready with local bundled fallback.
  * *Risk:* Image caching must avoid memory leaks; solved by utilizing Expo Image disk caching with zero redundant network requests on render.
- **Affected files/modules:**
  * [`mobile/lib/atmosphere/imagery-resolver.ts`](../mobile/lib/atmosphere/imagery-resolver.ts)
  * [`mobile/context/AtmosphereContext.tsx`](../mobile/context/AtmosphereContext.tsx)
  * [`mobile/components/ui/AtmosphereBackground.tsx`](../mobile/components/ui/AtmosphereBackground.tsx)
  * [`mobile/components/results/ResultHero.tsx`](../mobile/components/results/ResultHero.tsx)
- **Validation:** 52/52 presets audited and passed 100% WCAG 2.1 contrast; TypeScript check passing; Android Expo clean bundle passing with 0 warnings.
- **Supersedes:** D-001 for background canvas ownership.

---

### D-024 — Six-Tier Photo Resolution Hierarchy and Answering-Tier Telemetry (Destination Experience Fix)

- **Status:** Implemented (Uncommitted working tree & tests)
- **Date:** 2026-10-24
- **Decision:** In the engine and mobile imagery resolver, implement a strict 6-tier photo resolution chain:
  1. **Wikipedia lead image** (via `get_wikipedia_summary` $\rightarrow$ originalimage/thumbnail)
  2. **Wikidata P18** image claim
  3. **Wikimedia Commons geosearch** near coordinates (radius 3000m)
  4. **Wikimedia Commons text search** by place name
  5. **Bundled photo matching** through `manifest.place`
  6. **Slideshow fallback**
  The engine must annotate each returned photo with `photo_tier` and log which tier answered. Mobile [`imagery-resolver.ts`](../mobile/lib/atmosphere/imagery-resolver.ts) must cleanly prevent stale image leakage across destinations.
- **Context:** Destinations lacking high-resolution imagery previously fell back to generic placeholders or leaked images from the previously analyzed destination. Furthermore, engineers had no visibility into which photo provider tier was answering queries.
- **Rationale:** Prioritizing Wikipedia lead images and Wikidata P18 guarantees high-quality, verified representative photography. Wikimedia geosearch and text search provide deep fallback coverage. Bundled manifest assets ensure 100% offline availability. Storing `photo_tier` allows observability and regression benchmarking.
- **Consequences:**
  - *Gain:* Reliable, high-resolution photography without paid Google Places photo costs; full diagnostic transparency.
  - *Risk:* Wikimedia Commons contains historical or map images; the engine must filter by aspect ratio and license.
- **Evidence:** [`engine/app/services/places/wikimedia_client.py`](../engine/app/services/places/wikimedia_client.py), [`mobile/lib/atmosphere/imagery-resolver.ts`](../mobile/lib/atmosphere/imagery-resolver.ts), [`engine/domain/schemas/responses.py`](../engine/domain/schemas/responses.py).

---

### D-025 — Photo Attribution Policy: Credit Pills Restricted Exclusively to Remote Licensed Assets

- **Status:** Accepted
- **Date:** 2026-10-24
- **Decision:** In [`resolvePhotoAttribution`](../mobile/lib/atmosphere/imagery-resolver.ts), credit pills are strictly displayed ONLY for remote photos requiring license attribution (Creative Commons / Unsplash). Bundled and default discovery photographs never display credit pills anywhere in the UI.
- **Context:** Previously, the UI displayed empty or generic attribution pills like `"VAMO Discovery"` or `"Local Asset"`, cluttering the hero card.
- **Rationale:** Attribution exists to comply with legal copyright licenses (CC-BY, CC-BY-SA, Unsplash). Displaying attribution for internally bundled assets creates visual noise and confuses users.
- **Consequences:**
  - Remote photos with `author` display clean glass credit pills linking to source licenses.
  - Bundled/default assets render with zero visual clutter.
- **Evidence:** [`mobile/lib/atmosphere/imagery-resolver.ts`](../mobile/lib/atmosphere/imagery-resolver.ts), [`mobile/components/results/ResultHero.tsx`](../mobile/components/results/ResultHero.tsx), commit `686016e`.

---

### D-037 — Jeju Dark-Hero Investigation and Remediation Strategy

- **Status:** Unverified / Under Monitoring (Reported findings)
- **Date:** 2026-10-24
- **Decision:** Document reported findings regarding dark hero rendering for Jeju Island:
  1. *Reported Findings:* In certain local development environments and Android emulators, the Jeju hero card rendered with a solid dark canvas rather than the expected landscape photography.
  2. *Investigated Causes:*
     - Remote Unsplash CDN rate limiting or blocked image URL fetching under restricted development networks.
     - Over-aggressive dark translucent scrim + top/bottom vignettes composited over an image that had failed to load or was still buffering.
     - Missing OSM Wikipedia tag on specific Jeju node variants falling through without an active network connection, combined with race conditions in double-buffered image crossfade.
  3. *Implemented Remediation:* Added bundled offline backgrounds ([`background-manifest.ts`](../mobile/lib/atmosphere/background-manifest.ts)), background photo prefetch in [`mobile/app/analyze/results.tsx`](../mobile/app/analyze/results.tsx), and explicit fallback to local slideshow assets when remote fetching fails.
- **Consequences:**
  - Retained as a recognized diagnostic focus area; must be verified across physical iOS and Android hardware under cold network conditions.
- **Evidence:** [`mobile/lib/atmosphere/imagery-resolver.ts`](../mobile/lib/atmosphere/imagery-resolver.ts), [`mobile/lib/atmosphere/background-manifest.ts`](../mobile/lib/atmosphere/background-manifest.ts), commit `686016e`.

---

## 9. Destination Overview and Evidence Presentation Decisions

### D-026 — Concised Factual Overview Replacing Duplicate Evidence and Debug Notes

- **Status:** Implemented (Uncommitted working tree & tests)
- **Date:** 2026-10-24
- **Decision:** Replace duplicate and verbose "Identification evidence" and "Gemini vision notes" in the production Results dossier with a factual 5-line **Destination Overview**:
  1. **WHERE:** Instance of + country (from Wikidata P31 + P17 / OSM)
  2. **SIZE:** Land area in km² (from Wikidata P2046)
  3. **MAIN CITY / LANDMARK:** Capital / largest city (P36), highest point + elevation (P610 + P2044)
  4. **RECOGNITION:** Heritage designations with year (P1435 + P585/P580, e.g. UNESCO World Heritage)
  5. **CLIMATE:** Normals summary from Open-Meteo

  **Strict Rules:**
  - Rely exclusively on verifiable provider data.
  - Omit any line lacking verified data (never show "Unknown" or placeholder text).
  - Never fabricate or guess facts.
  - Raw evidence strings and Gemini vision notes are strictly moved into a `__DEV__`-only expandable debug drawer.
- **Context:** The Results screen previously rendered two large, overlapping text cards: "Why this place" (raw geocoder matching logs) and "Gemini Analysis" (internal prompt reasoning). This exposed internal pipeline debugging details to travelers while failing to provide basic geographic context (e.g. how big is the destination, what is its capital, is it a UNESCO site).
- **Rationale:** Travelers need concise, structured encyclopedic facts, not raw AI thought processes. Querying Wikidata entity claims provides verified geographic attributes while keeping the UI clean and authoritative.
- **Consequences:**
  - *Gain:* Elegant, factual 5-line summary; raw engine telemetry hidden from normal users but accessible in development via `__DEV__`.
  - *Trade-off:* Requires batch Wikidata entity requests (`wbgetentities`) during destination enrichment.
- **Evidence:** [`engine/app/services/places/overview_builder.py`](../engine/app/services/places/overview_builder.py), [`mobile/components/results/DestinationIdentity.tsx`](../mobile/components/results/DestinationIdentity.tsx), [`engine/domain/schemas/responses.py`](../engine/domain/schemas/responses.py).

---

## 10. Weather and Seasonality Decisions

### D-027 — Five-Year Historical Weather Normals and Climatology-Aware Travel Windows (Open-Meteo)

- **Status:** Implemented (Uncommitted working tree & tests)
- **Date:** 2026-10-24
- **Decision:** Sourced weather intelligence from the Open-Meteo Historical Weather Archive API covering the last **five complete calendar years** (e.g. 2021–2025). Replace the previous static or unsound list of recommended months with evidence-based travel windows derived from empirical temperature and precipitation thresholds. Explicitly label recommendations as `"based on historical weather"` and omit the section if weather data is unavailable.
- **Context:** Travel AI previously used static dictionary lookups or single-year forecasts that recommended arbitrary months without explanation (e.g. "Visit in October" with no data supporting why). Furthermore, single-year weather can suffer from extreme anomalies (droughts, unseasonal storms).
- **Rationale:** Five years of daily observations provide statistically sound climate normals. Deriving comfort scores from mean temperature (comfort band 18°C–26°C) and monthly rainfall ensures recommendations are grounded in reality (e.g. "Comfortable temperatures (18°C–24°C) and low rainfall (42 mm/mo)").
- **Consequences:**
  - *Gain:* Sourced, defensible travel recommendations with transparent weather basis.
  - *Trade-off:* Open-Meteo queries require ~200–400ms network roundtrip during enrichment.
- **Evidence:** [`engine/app/services/places/open_meteo_client.py`](../engine/app/services/places/open_meteo_client.py), [`engine/app/services/travel/season_service.py`](../engine/app/services/travel/season_service.py), [`mobile/components/results/DestinationBriefing.tsx`](../mobile/components/results/DestinationBriefing.tsx).

---

### D-028 — Tropical vs. Temperate Season Logic: Dry/Wet Seasons vs. Four-Season Cycles

- **Status:** Implemented (Uncommitted working tree & tests)
- **Date:** 2026-10-24
- **Decision:** Implement hemisphere-aware seasonal definitions and automatic tropical classification ($|\text{lat}| < 23.5^\circ$ or heavy seasonal monsoons). Tropical destinations generate **Dry Season** and **Wet Season** cards (with monthly rainfall in mm/mo and temperature ranges), preventing the application from forcing temperate four-season cycles (Spring/Autumn) onto tropical destinations like Bali or Phuket.
- **Context:** In earlier implementations, Bali was assigned "Spring" and "Autumn" seasons, which do not exist in equatorial climatology and appeared uneducated to travelers.
- **Rationale:** Climatological accuracy requires distinct models for temperate zones (astronomical Spring/Summer/Autumn/Winter, hemisphere-inverted for Southern Hemisphere) and tropical zones (monsoonal Dry/Wet seasons).
- **Consequences:**
  - *Gain:* Perfect geographic fidelity for tropical destinations; accurate rainfall warnings.
  - *Trade-off:* Season cards must dynamically render 2 cards (tropical) or 4 cards (temperate).
- **Evidence:** [`engine/app/services/places/open_meteo_client.py`](../engine/app/services/places/open_meteo_client.py), [`mobile/components/results/DestinationBriefing.tsx`](../mobile/components/results/DestinationBriefing.tsx), [`mobile/lib/fixtures/results-fixtures.ts`](../mobile/lib/fixtures/results-fixtures.ts).

---

## 11. Travel Tips and Budget Decisions

### D-029 — Complete Removal of Generic Travel Safety Boilerplate

- **Status:** Implemented (Uncommitted working tree & tests)
- **Date:** 2026-10-24
- **Decision:** Completely eliminate generic boilerplate filler tips such as `"Keep emergency contacts available"`, `"Carry a valid ID"`, and `"Respect local laws and customs"` from [`travel_tips_service.py`](../engine/app/services/travel/travel_tips_service.py). Tips must be destination-specific, activity-specific, or photography-specific. When no verified tips exist, the entire Tips card must be omitted from the UI.
- **Context:** When the engine lacked specific local advice, it generated generic safety platitudes that annoyed users and made the product look like a low-effort template.
- **Rationale:** High-quality editorial design values silence over meaningless noise. If the system does not possess authentic local knowledge for a remote village, saying nothing is far superior to telling the user to "carry a valid ID".
- **Consequences:**
  - *Gain:* Zero generic clutter; every displayed tip delivers authentic value.
  - *Trade-off:* Remote or sparse destinations will display no tips section.
- **Evidence:** [`engine/app/services/travel/travel_tips_service.py`](../engine/app/services/travel/travel_tips_service.py), [`mobile/components/results/DestinationBriefing.tsx`](../mobile/components/results/DestinationBriefing.tsx).

---

### D-030 — Transparent Macroeconomic Budget Model (World Bank ICP + ECB Frankfurter)

- **Status:** Implemented (Uncommitted working tree & tests)
- **Date:** 2026-10-24
- **Decision:** Replace arbitrary budget multipliers with a transparent macroeconomic estimation model across 3 tiers (Budget, Mid-range, Comfortable) scaled by World Bank ICP price-level ratios (`PA.NUS.PPPC.RF`) and dated European Central Bank (ECB) reference rates via the Frankfurter API.

  **Model Specification:**
  - **Tiers & US Baselines (US = 1.00):**
    - *Budget ($50/day):* Stay $22, Food $15, Local Transport $5, Activities $5, Buffer $3.
    - *Mid-range ($130/day):* Stay $65, Food $35, Local Transport $12, Activities $10, Buffer $8.
    - *Comfortable ($280/day):* Stay $150, Food $70, Local Transport $25, Activities $20, Buffer $15.
  - **Exact Arithmetic Guarantee:** Components are guaranteed to sum exactly to displayed totals across USD, local currency, and INR.
  - **Mandatory Metadata & Disclaimer:**
    - Per-person daily estimates.
    - Accommodation included.
    - Flights and visas excluded.
    - Disclaimer: `"Estimate from national price levels; not city-specific or live."`
  - **Missing Data Handling:** If a destination country has no verified price-level ratio, `estimate()` returns `None`, and the budget section is cleanly hidden.
- **Context:** Earlier versions used opaque multipliers (e.g. `Switzerland: 2.30`) that produced arbitrary numbers without currency conversion or methodology explanation.
- **Rationale:** Travel budgets cannot be quoted as real-time booking prices without a full travel agency integration. Grounding estimates in World Bank purchasing power parity (PPP) indices provides transparent, macroeconomic honesty.
- **Consequences:**
  - *Gain:* Transparent, defensible budget guidance in local currency and INR; exact mathematical consistency.
  - *Limitation:* National price indices do not capture intra-country variations (e.g. Zurich vs. rural Swiss Alps).
- **Evidence:** [`engine/app/services/travel/budget_estimator.py`](../engine/app/services/travel/budget_estimator.py), [`engine/tests/test_budget_model.py`](../engine/tests/test_budget_model.py), [`mobile/components/results/DestinationBriefing.tsx`](../mobile/components/results/DestinationBriefing.tsx).

---

## 12. Performance, Timeouts, and Enrichment Decisions

### D-021 — Thread-Safe Lazy Singleton ML Loading Architecture

- **Status:** Accepted
- **Date:** 2026-08-11
- **Decision:** Defer instantiation and weight loading of PyTorch, EasyOCR, and Whisper models via thread-safe lazy singletons. OpenCV metric calculations (sharpness, brightness, density) must execute without loading neural network weights.
- **Context:** Eager model instantiation previously caused cold starts to consume ~94 seconds and allocate several gigabytes of memory immediately upon process launch, even for health checks or caption-only analyses.
- **Rationale:** Lazy singletons ensure heavy ML models are loaded into RAM only when a video actually requires OCR or speech transcription.
- **Consequences:**
  - *Gain:* Instant server boot; caption-only analyses resolve in 6–8 seconds without touching neural weights.
  - *Trade-off:* The first request requiring OCR or Whisper absorbs a one-time cold load (~10–20s).
- **Evidence:** [`engine/app/services/ocr/ocr_service.py`](../engine/app/services/ocr/ocr_service.py), [`engine/app/services/speech/speech_service.py`](../engine/app/services/speech/speech_service.py), [`docs/performance/phase-7-results.md`](performance/phase-7-results.md), commit `b666af4`.

---

### D-031 — Parallel Tri-Service Enrichment Execution with Strict 4.0-Second Timeout Caps

- **Status:** Implemented (Uncommitted working tree & tests)
- **Date:** 2026-10-24
- **Decision:** In [`LocationResolver`](../engine/app/services/location/location_resolver.py), execute Place Details (Photos/Overview), Nearby POI Search, and Travel Intelligence (Weather/Budget) concurrently using `ThreadPoolExecutor(max_workers=3)` with strict **4.0-second timeout caps** per task. Core destination resolution is targeted at ~12 seconds warm runtime; enrichment failures must never block returning the core destination.
- **Context:** Serial execution of Wikidata queries, Overpass POI queries, Open-Meteo normals, and exchange rate lookups previously pushed total response latency beyond 25–30 seconds.
- **Rationale:** The primary user value is knowing the verified destination. Secondary contextual enrichment must run in parallel and fail fast if an external provider stalls.
- **Consequences:**
  - *Gain:* Dramatically faster response times; resilience against third-party network degradation.
  - *Trade-off:* If Overpass or Wikidata exceeds 4.0 seconds, the response returns with empty nearby POIs or a partial overview rather than failing the entire request.
- **Evidence:** [`engine/app/services/location/location_resolver.py`](../engine/app/services/location/location_resolver.py), commit `2a11d14`.

---

### D-032 — Additive Backward-Compatible Response Schema Extension Policy

- **Status:** Accepted
- **Date:** 2026-10-24
- **Decision:** All new features and enriched data structures (`overview`, `season_cards`, `budget_model`, `photo_tier`, `recommended_window`) must be strictly optional additions to existing Pydantic response models ([`responses.py`](../engine/domain/schemas/responses.py)) and TypeScript interfaces ([`analysis.ts`](../mobile/types/analysis.ts)). Legacy fields (`best_season`, `estimated_daily_budget`, `currency`, `confidence`) must be preserved.
- **Context:** Evolving the backend schema risked breaking persisted AsyncStorage bookmarks, Supabase history tables, and older mobile build clients.
- **Rationale:** Additive schemas guarantee that new backend releases do not crash older mobile app builds in the field.
- **Consequences:**
  - *Gain:* 100% backward compatibility with existing saved places and mobile screens.
  - *Trade-off:* Requires maintaining legacy field mappings in response builders.
- **Evidence:** [`engine/domain/schemas/responses.py`](../engine/domain/schemas/responses.py), [`engine/app/services/response/response_builder.py`](../engine/app/services/response/response_builder.py), [`mobile/types/analysis.ts`](../mobile/types/analysis.ts).

---

## 12b. Destination Results Experience and Precision Hardening

### D-038 — Destination-Tied Photo Architecture and Relevance Guards

- **Status:** Accepted
- **Date:** 2026-10-25
- **Decision:** All destination screen background imagery must be strictly tied to a unique `destinationKey` (`place_id|lat,lon|name`). Photos are only rendered when this key matches the active destination. The active photo is immediately purged on analysis start. A destination screen may only show photos verified for that destination; if none qualify or while loading, it renders a neutral place-tinted gradient (`[activePalette.top, activePalette.mid, activePalette.bottom]`). It must never display an unrelated place's photo or random slideshow frames. Furthermore, Wikimedia Commons retrieval enforces:
  1. Geosearch radius capped at $\le 25\text{ km}$ from coordinates.
  2. Entity validation against Wikipedia lead image and Wikidata P18 image.
  3. Text search token matching against destination name.
  4. Automatic rejection of SVGs, portrait orientations (`height > width`), images $< 1200\text{px}$ wide, and non-scenic imagery (diagrams, maps, flags, logos, coats of arms).
- **Context:** Jeju Island previously displayed a Roman Colosseum image due to cold-start slideshow fallback leak and stale active photo state.
- **Rationale:** Destination trust requires strict photographic accuracy; a neutral gradient is vastly superior to displaying an incorrect landmark.
- **Evidence:** [`mobile/context/AtmosphereContext.tsx`](../mobile/context/AtmosphereContext.tsx), [`mobile/lib/atmosphere/imagery-resolver.ts`](../mobile/lib/atmosphere/imagery-resolver.ts), [`engine/app/services/places/wikimedia_client.py`](../engine/app/services/places/wikimedia_client.py).

---

### D-039 — Hero Visual Clarity and Backplate Elimination

- **Status:** Accepted
- **Date:** 2026-10-25
- **Decision:** Eliminate all `BlurView`, dark gradient scrims (`bottomVignette`), and dark backplates behind the destination title and location line. Legibility is achieved exclusively through subtle text shadows (`shadowColor: '#000'`, `shadowRadius: 10`) combined with a uniform highlight tint capped at $\le 10\%$ (8% applied). The hero photo must look sharp and vibrant. The location pill is rendered only if it adds novel geographic hierarchy beyond the destination title (e.g., showing `"Jeju Province · South Korea"` for `"Jeju Island"`, but hiding redundant values like `"Kyoto · Kyoto"`).
- **Context:** Excessive blur layers and aggressive dark gradients obscured hero photography and flattened the cinematic feel.
- **Rationale:** Travel discovery is visual-first. Photos must remain crisp while keeping typography readable.
- **Evidence:** [`mobile/components/results/ResultHero.tsx`](../mobile/components/results/ResultHero.tsx), [`mobile/components/ui/RootAtmosphereBackground.tsx`](../mobile/components/ui/RootAtmosphereBackground.tsx).

---

### D-040 — Location Details Panel and Removal of Internal Model/Evidence Details

- **Status:** Accepted
- **Date:** 2026-10-25
- **Decision:** Delete the `__DEV__ DEBUG EVIDENCE` row and all user-facing mentions of pipeline extraction details (`caption`, `OCR`, `speech`, `transcript`, `Gemini`, `vision`, `candidate`, `evidence`, `"identified from"`) across all app screens, toasts, and accessibility labels. Replace the evidence card with an encyclopedic **Location Details** panel displaying up to 5 structured Wikidata/Wikipedia lines (Where, Size, Main city/landmark, Recognition with parsed year, Climate). If structured fields are absent, fall back to the first 1–2 sentences of the Wikipedia summary with a clear `"Wikipedia"` attribution badge. The panel must never render empty.
- **Context:** Exposing internal geocoding logs and model thought traces looked unpolished and confusing to end users.
- **Rationale:** Users want clear, authoritative destination information rather than engineering diagnostic telemetry.
- **Evidence:** [`mobile/components/results/DestinationIdentity.tsx`](../mobile/components/results/DestinationIdentity.tsx), [`engine/app/services/places/overview_builder.py`](../engine/app/services/places/overview_builder.py).

---

### D-041 — Denomination-Scaled Currency Rounding and Documented Stay Durations

- **Status:** Accepted
- **Date:** 2026-10-25
- **Decision:**
  1. **Currency-Scaled Rounding:** Budget estimations scale rounding according to currency denomination to prevent false precision (e.g. KRW, VND, IDR rounded to nearest 1,000; JPY/ISK/HUF to nearest 100; INR/THB/PHP to nearest 10; USD/EUR/GBP to nearest 1). Subcomponent amounts (`stay + food + local_transport + activities + buffer`) must always sum exactly to the rounded total.
  2. **Documented Stay Heuristics:** Recommended stay durations must derive from documented destination scope rules (Islands/Regions: `3–5 Days`, Major Metropolises: `3–4 Days`, Standard Cities / National Parks: `2–3 Days`, Landmarks/POIs: `1 Day`) or be omitted (`None`). Generic ungrounded ranges (`1-3 Days`) are strictly prohibited.
- **Context:** Displaying `"KRW 124,498"` gave a false sense of mathematical precision, and arbitrary trip durations diminished recommendations.
- **Rationale:** Sensible rounding aligns with real-world currency conventions, and grounded heuristics maintain travel credibility.
- **Evidence:** [`engine/app/services/travel/budget_estimator.py`](../engine/app/services/travel/budget_estimator.py), [`engine/app/services/travel/travel_intelligence_service.py`](../engine/app/services/travel/travel_intelligence_service.py), [`engine/tests/test_budget_model.py`](../engine/tests/test_budget_model.py).

---

## 13. API Policy and External Data Sources Matrix

The following matrix documents every external data source utilized across the VAMO architecture, its authorization requirements, operational constraints, and fallback behavior:

| Provider / API | Intended Use | Cost / Tier | Credential Required | Timeouts & Rate Limits | Caching / Storage | Fallback Behavior | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **OpenStreetMap / Nominatim** | Geocoding, reverse geocoding, bounding box lookup | Free / Open | None (Requires custom User-Agent) | 1 req/sec strict rate limit; 4.0s timeout | LRU cache in `nominatim_client.py` | Fallback to raw candidate text | Verified via unit tests & live geocoding |
| **OpenStreetMap / Overpass** | Nearby POI search (attractions, dining, transit) | Free / Open | None | Bounded bounding box queries; 4.0s timeout | Ephemeral in-memory | Return empty POI lists; do not block response | Verified via unit tests & mock harnesses |
| **Wikimedia / Wikipedia / Wikidata** | Editorial summaries, QID claims, P18 images, Commons search | Free / Open | None (Requires custom User-Agent) | 4.0s timeout cap per entity fetch | Disk/memory caching | Fallback to bundled backgrounds & slideshow | Verified via unit tests & image resolver |
| **Open-Meteo** | 5-year historical weather normals & climate stats | Free (Attribution required) | None | 4.0s timeout cap | File-based JSON caching in `open_meteo_client.py` | Hide weather/season dossier row | Verified via test suite & mock harnesses |
| **World Bank ICP (`PA.NUS.PPPC.RF`)** | National price-level ratios for PPP budget scaling | Free Public Data | None | Static bundled data table | Bundled in `budget_estimator.py` | Return `None`; omit budget section | Verified via `test_budget_model.py` |
| **Frankfurter / ECB** | Dated reference currency exchange rates (USD/EUR/INR/Local) | Free / Open | None | 3.5s timeout | In-memory session cache | Fallback to bundled reference exchange rates | Verified via `test_budget_model.py` |
| **Google Gemini (1.5 / 2.0 Flash)** | Candidate verification & multimodal keyframe match | Paid API (Tiered usage) | Yes (`GEMINI_API_KEY`) | 12.0s timeout with single retry | Ephemeral | Abstain or rely on heuristic scoring | Verified in backend benchmark suite |
| **Supabase (Auth & Postgres)** | User authentication, RLS cloud sync, analysis history | Free / Pro Cloud BaaS | Yes (Public Anon Key on mobile; Service Key server-only) | Standard HTTPS REST / Auth endpoints | AsyncStorage local cache + PostgreSQL cloud | Full offline operation via AsyncStorage | Verified in code & schema; OAuth live sign-in unverified |
| **Google Places API** | **INACTIVE / DISABLED** | Paid API | **DISABLED** | **N/A — MUST NOT BE CALLED** | **N/A** | **Delegates entirely to `OsmProvider`** | **Explicitly disabled by architecture policy** |

---

## 14. Authentication, Storage, and Security Decisions

### Authentication Architecture Summary
- **Client Protocol:** Expo / React Native (`mobile`) utilizing `@supabase/supabase-js` configured with PKCE flow (`travelai://auth/callback`).
- **In-App Browser:** Handled via `expo-web-browser` (`WebBrowser.openAuthSessionAsync`) and `expo-linking`.
- **Credential Boundary:** Mobile client strictly bundles the public project URL and publishable/anon key. Zero service-role keys, database passwords, or Google Cloud client secrets exist in client binaries.
- **Row-Level Security (RLS):** PostgreSQL policies on `saved_places` and `analysis_history` enforce `auth.uid() = user_id`. Signed-out writes are rejected at the database level with HTTP 401/403.
- **Diagnostic Verification (`DevCloudCheck.tsx`):** A development-only component validates project reachability, schema table existence, and RLS write rejection.

### Verification Status Boundary
- *Code & Schema Verified:* Supabase client configuration, table migration SQL, RLS security policies, and mobile auth parsers are verified in code and unit tests.
- *Unverified Assumption:* End-to-end Google OAuth sign-in and cross-user cloud sync remain unverified in production until external Google Cloud Console OAuth consent screen approvals and domain callbacks are finalized.

---

## 15. Testing and Quality Standards

### Testing Philosophy
1. **Mock External Network Calls:** Unit and integration tests must not depend on live external APIs (Wikimedia, Nominatim, Open-Meteo, Gemini). Network calls are mocked using `unittest.mock.patch` to guarantee deterministic, offline execution.
2. **Deterministic Regression Fixtures:** Core regression destinations (Jeju, Kyoto, Bali, Paris, New York City) serve as golden baselines across all development passes.
3. **Preserve Backward Compatibility:** Test suites must verify that sparse, empty, or failed-provider responses do not crash the frontend or backend.
4. **Automated WCAG 2.1 Contrast Testing:** All mobile themes and deterministic fallback palettes are mathematically validated via `scripts/validate-atmosphere-contrast.ts` ensuring $\ge 4.5:1$ contrast for normal text and $\ge 3.0:1$ for large text and CTAs.

### Active Test Suites and Execution Commands
- **Backend Regression Suite:** `pytest engine/tests/` (Executed across 92+ tests covering scoring, budget model, canonical names, and OSM resilience).
- **Mobile TypeScript Verification:** `npm run tsc -- --noEmit` inside `mobile/`.
- **Mobile Contrast Verification:** `npm run test:contrast` inside `mobile/` (Validates 52 curated presets + 300 random deterministic fallbacks).
- **Mobile Contract Verification:** `node mobile/scripts/test-mobile-contract.js`.

---

## 16. Git Branching and Development Workflow

### D-033 — Branch Topology and Staging Policy (`main` vs `ui-redesign`)

- **Status:** Accepted
- **Date:** 2026-10-15
- **Decision:** Maintain a two-branch topology:
  - `main`: Stable baseline branch holding validated release candidates and backend accuracy baselines.
  - `ui-redesign`: Active feature branch where the VAMO mobile redesign, atmosphere engine, and Destination Experience Fix are developed.

  **Staging and Safety Rules:**
  - Tasks explicitly marked as documentation-only or constrained tasks must never execute `git add`, `git commit`, `git push`, `git reset`, `git clean`, or `git checkout`.
  - Existing uncommitted working-tree modifications from previous development passes must be preserved without disruption.
- **Rationale:** Prevents accidental overwrites, premature commits of experimental work, and ensures clean auditability.
- **Evidence:** `git branch -a`, [`docs/AGENTS.md`](AGENTS.md).

---

### D-034 — Small-Screen and Touch Ergonomics Standards

- **Status:** Accepted
- **Date:** 2026-10-17
- **Decision:** Enforce minimum touch target sizes across all mobile components:
  - iOS: Minimum 44×44 pt (`TouchTarget.minWidth`, `TouchTarget.minHeight`).
  - Android: Minimum 48×48 pt.
  - All interactive icons smaller than 44pt must utilize `hitSlop={8}` to `hitSlop={12}`.
  - Primary CTAs must remain within the natural thumb zone (bottom 50% of the viewport).
- **Rationale:** Ensures accessible, error-free mobile interaction when holding the device single-handed on the move.
- **Evidence:** [`mobile/constants/theme.ts`](../mobile/constants/theme.ts), [`docs/DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md).

---

## 17. Superseded Decisions Ledger

| Superseded Decision | Successor Decision | Date of Change | Rationale for Supersession |
| :--- | :--- | :--- | :--- |
| **D-001 (Palette-Dominant Theming)** | **D-008 (Photo-Led Travel Atmosphere)** | 2026-10-19 | Palette-driven backgrounds felt like a flat colored utility app; travel discovery is fundamentally image-led and cinematic. |
| **Google Places Primary Provider** | **D-016 (OsmProvider Migration)** | 2026-10-23 | Google Places introduced heavy API billing and rate limits; OSM/Nominatim/Overpass provided 100% keyless zero-cost places intelligence. |
| **Next.js Web as Primary Surface** | **D-013 (React Native / Expo Mobile Client)** | 2026-08-15 | Instagram Reels travel discovery occurs natively on mobile devices; native mobile enables clipboard integration, offline locker, and native maps. |
| **Alabaster Light Theme (`#F7F7F5`)** | **D-014 (VAMO Cosmos Dark Editorial Identity)** | 2026-10-17 | Alabaster theme lacked emotional resonance and luxury editorial feel; VAMO dark theme elevates photography and contrast. |
| **Arbitrary Country Multipliers for Budget** | **D-030 (World Bank ICP + ECB Macro Model)** | 2026-10-24 | Static multipliers lacked transparency, methodology, and currency conversions; World Bank ICP PPP ratios provide defensible macroeconomic grounding. |
| **Generic Safety Boilerplate Tips** | **D-029 (Strict Sourced Tips Omission)** | 2026-10-24 | Generic filler ("carry a valid ID") annoyed users and diluted brand quality; silence is superior to unhelpful boilerplate. |
| **Eager ML Reader Instantiation** | **D-021 (Thread-Safe Lazy Singleton ML)** | 2026-08-11 | Eager PyTorch/EasyOCR initialization froze server boots and consumed gigabytes of RAM for simple requests. |
| **Duplicate Raw Evidence & Vision Notes** | **D-026 (Concised Factual 5-Line Overview)** | 2026-10-24 | Raw geocoding logs and AI thought processes cluttered the Results screen; replaced with encyclopedic facts (where, size, landmark, heritage, climate). |

---

## 18. Known Limitations, Deferred Decisions, and Open Questions

1. **Cold Start Latency:**
   - *Impact:* The first request requiring neural OCR (EasyOCR) or speech transcription (Whisper) incurs a 10–20 second weight-loading delay.
   - *Mitigation:* Caption-first early exits bypass neural models entirely when captions are unambiguous.
2. **Non-Latin Scripts and Multilingual Text:**
   - *Impact:* Benchmark evaluations (Stage 8 Case #26 Cyrillic, Case #29 Spanish hashtags) identified boundary failures when destination names appear in non-Latin scripts.
   - *Status:* Unresolved; requires expanding transliteration and multilingual NLP tokenization.
3. **Live OAuth Production Credentials:**
   - *Impact:* Google and Apple sign-in flows cannot be verified end-to-end in production without registered production client secrets and approved OAuth consent screens.
   - *Status:* Code and PKCE parsers verified; live production deployment unverified.
4. **Intra-Country Budget Variance:**
   - *Impact:* World Bank ICP price-level ratios are national indices. They accurately scale costs between countries (Switzerland vs. Vietnam), but cannot reflect price differences between expensive capitals and rural provinces (e.g. Zurich vs. Appenzell, or Seoul vs. rural Korea).
   - *Status:* Mitigated by the mandatory disclaimer: `"Estimate from national price levels; not city-specific or live."`
5. **Jeju Dark-Hero Monitoring:**
   - *Impact:* Intermittent dark hero backgrounds reported during local emulator runs.
   - *Status:* Remediated via bundled fallback backgrounds and prefetching; requires ongoing physical device validation across diverse network speeds.

---

## 19. Evidence and Artifact Traceability Index

| ADR ID | Decision Title | Primary Code Implementation | Automated Test / Verification | Commit Hash / Documentation |
| :--- | :--- | :--- | :--- | :--- |
| **D-001** | Five-Tier Atmosphere Palette Resolver | [`mobile/lib/atmosphere/palette-resolver.ts`](../mobile/lib/atmosphere/palette-resolver.ts) | `scripts/validate-atmosphere-contrast.ts` | Commit `a08db8a`, [`docs/DECISIONS.md`](DECISIONS.md) |
| **D-002** | Interface-Only Extraction Contract | [`mobile/types/atmosphere.ts`](../mobile/types/atmosphere.ts) | `tsc --noEmit` | Commit `a08db8a` |
| **D-003** | Curated Presets & Deterministic Fallback | [`mobile/lib/atmosphere/presets.ts`](../mobile/lib/atmosphere/presets.ts) | `scripts/validate-atmosphere-contrast.ts` | Commit `a08db8a` |
| **D-004** | Global AtmosphereProvider Architecture | [`mobile/context/AtmosphereContext.tsx`](../mobile/context/AtmosphereContext.tsx) | RootLayout integration tests | Commit `a08db8a` |
| **D-005** | Two-Layer Opacity Crossfade | [`mobile/components/ui/AtmosphereBackground.tsx`](../mobile/components/ui/AtmosphereBackground.tsx) | `AccessibilityInfo` reduced motion test | Commit `a08db8a` |
| **D-006** | Automated WCAG 2.1 Contrast Clamping | [`mobile/lib/atmosphere/contrast.ts`](../mobile/lib/atmosphere/contrast.ts) | `npm run test:contrast` (351/351 passed) | Commit `a08db8a` |
| **D-007** | Isolated Dev Atmosphere Harness | [`mobile/app/dev/atmosphere.tsx`](../mobile/app/dev/atmosphere.tsx) | `__DEV__` route gate check | Commit `a08db8a` |
| **D-008** | Photo-Led Atmosphere Architecture | [`mobile/lib/atmosphere/imagery-resolver.ts`](../mobile/lib/atmosphere/imagery-resolver.ts) | Android clean bundle export | Commit `faff87a`, `df6bf40` |
| **D-009** | Multi-Signal Evidence Pipeline | [`engine/app/services/extraction/evidence_builder.py`](../engine/app/services/extraction/evidence_builder.py) | `engine/tests/pipeline_test.py` | Commits `fe0f002`, `1ec7671` |
| **D-010** | Typo-Tolerant Candidate Generation | [`engine/app/services/location/candidate_service.py`](../engine/app/services/location/candidate_service.py) | `engine/tests/test_stage8_accuracy_and_expansion.py` | Commit `8e31049`, Stage 7 Report |
| **D-011** | Scoring Engine & Abstention | [`engine/app/services/scoring/scoring_service.py`](../engine/app/services/scoring/scoring_service.py) | Benchmark Case #2 (Negative Control) | Commit `2f6fbdf`, Stage 7 Report |
| **D-012** | Gemini Multimodal Verification | [`engine/app/services/gemini/gemini_verifier.py`](../engine/app/services/gemini/gemini_verifier.py) | `engine/tests/test_gemini_verifier.py` | Commits `b37b34e`, `de1450c` |
| **D-013** | Mobile-First Expo Architecture | [`mobile/app/`](../mobile/app/) | `mobile/package.json` | Commits `cbcf984`, `025dd05` |
| **D-014** | VAMO Brand & Design System | [`mobile/constants/theme.ts`](../mobile/constants/theme.ts) | `npm run test:contrast` | Commits `58eb9eb`, `ea12f43` |
| **D-015** | Epistemic Honesty Standard | [`mobile/components/ui/ConfidenceBadge.tsx`](../mobile/components/ui/ConfidenceBadge.tsx) | `engine/tests/test_response_builder.py` | Commit `d10b3de`, [`docs/PRD.md`](PRD.md) |
| **D-016** | OSM / Nominatim / Overpass Migration | [`engine/app/services/places/osm_provider.py`](../engine/app/services/places/osm_provider.py) | `engine/tests/test_osm_provider.py` | Commit `75f5fb4` |
| **D-017** | Paid Places API Ban | [`engine/app/services/places/factory.py`](../engine/app/services/places/factory.py) | `test_osm_provider.py` | Commit `75f5fb4` |
| **D-018** | Supabase Auth & RLS Cloud Sync | [`mobile/lib/supabase/client.ts`](../mobile/lib/supabase/client.ts) | `mobile/components/dev/DevCloudCheck.tsx` | Commits `2935f64`, `686016e` |
| **D-019** | Offline-First Storage Queue | [`mobile/lib/storage/saved-places.ts`](../mobile/lib/storage/saved-places.ts) | `mobile/scripts/test-network.ts` | Commits `e41cf50`, `be87e71` |
| **D-020** | RequestContext Observability | [`engine/observability/context.py`](../engine/observability/context.py) | `engine/tests/test_stage10_observability.py` | Commit `f3449dc`, [`docs/observability.md`](observability.md) |
| **D-021** | ML Singleton Lazy-Loading | [`engine/app/services/ocr/ocr_service.py`](../engine/app/services/ocr/ocr_service.py) | `engine/tests/test_stage11_performance.py` | Commit `b666af4`, [`docs/performance/phase-7-results.md`](performance/phase-7-results.md) |
| **D-022** | Canonical Display Name Builder | [`engine/app/services/location/canonical_display_name.py`](../engine/app/services/location/canonical_display_name.py) | [`engine/tests/test_display_name_builder.py`](../engine/tests/test_display_name_builder.py) | Commit `200f55b` |
| **D-023** | Jeju Golden Regression Fixture | [`mobile/lib/fixtures/results-fixtures.ts`](../mobile/lib/fixtures/results-fixtures.ts) | `engine/tests/test_accuracy_regression_fixtures.py` | Commit `e95f176` |
| **D-024** | Six-Tier Photo Resolution Chain | [`engine/app/services/places/wikimedia_client.py`](../engine/app/services/places/wikimedia_client.py) | `engine/tests/test_master_execution_regression.py` | Commit `200f55b` |
| **D-025** | Photo Attribution Credit Policy | [`mobile/lib/atmosphere/imagery-resolver.ts`](../mobile/lib/atmosphere/imagery-resolver.ts) | Mobile results render inspection | Commits `686016e`, `e95f176` |
| **D-026** | Factual 5-Line Destination Overview | [`engine/app/services/places/overview_builder.py`](../engine/app/services/places/overview_builder.py) | `mobile/app/dev/results-fixtures.tsx` | Commits `200f55b`, `e95f176` |
| **D-027** | Open-Meteo 5-Year Weather Normals | [`engine/app/services/places/open_meteo_client.py`](../engine/app/services/places/open_meteo_client.py) | `test_destination_resolution_accuracy_eval.py` | Commit `200f55b` |
| **D-028** | Tropical vs. Temperate Season Logic | [`engine/app/services/places/open_meteo_client.py`](../engine/app/services/places/open_meteo_client.py) | Bali fixture in `results-fixtures.ts` | Commit `200f55b` |
| **D-029** | Removal of Generic Safety Boilerplate | [`engine/app/services/travel/travel_tips_service.py`](../engine/app/services/travel/travel_tips_service.py) | `mobile/components/results/DestinationBriefing.tsx` | Commits `200f55b`, `e95f176` |
| **D-030** | World Bank ICP Transparent Budget Model | [`engine/app/services/travel/budget_estimator.py`](../engine/app/services/travel/budget_estimator.py) | [`engine/tests/test_budget_model.py`](../engine/tests/test_budget_model.py) | Commit `200f55b` |
| **D-031** | Parallel Enrichment & 4.0s Caps | [`engine/app/services/location/location_resolver.py`](../engine/app/services/location/location_resolver.py) | Stage timing telemetry in `RequestContext` | Commit `200f55b` |
| **D-032** | Backward-Compatible Response Schema | [`engine/domain/schemas/responses.py`](../engine/domain/schemas/responses.py) | `mobile/scripts/test-mobile-contract.js` | Commits `200f55b`, `e95f176` |
| **D-033** | Branch Topology & Staging Policy | Repository Git Workflow | `git status`, `git branch` | [`docs/AGENTS.md`](AGENTS.md) |
| **D-034** | Small-Screen & Touch Ergonomics | [`mobile/constants/theme.ts`](../mobile/constants/theme.ts) | `mobile/components/ui/` inspection | [`docs/DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) |
| **D-035** | Product Scope Boundaries | [`docs/PRD.md`](PRD.md) | PRD & Devlog verification | [`docs/DEVLOG.md`](DEVLOG.md) |
| **D-036** | Standalone FastAPI Service Separation | [`engine/app/main.py`](../engine/app/main.py) | Engine health probes (`/health`) | [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) |
| **D-037** | Jeju Dark-Hero Investigation | [`mobile/lib/atmosphere/imagery-resolver.ts`](../mobile/lib/atmosphere/imagery-resolver.ts) | Physical Android device inspection | Commit `686016e` |
| **D-038** | Destination-Tied Photo & Relevance Guards | [`mobile/context/AtmosphereContext.tsx`](../mobile/context/AtmosphereContext.tsx) | Live Commons verification & unit tests | Audited working tree |
| **D-039** | Hero Visual Clarity & Backplate Removal | [`mobile/components/results/ResultHero.tsx`](../mobile/components/results/ResultHero.tsx) | `npm run test:contrast` | Audited working tree |
| **D-040** | Location Details Panel & Evidence Ban | [`mobile/components/results/DestinationIdentity.tsx`](../mobile/components/results/DestinationIdentity.tsx) | `node ./scripts/test-mobile-contract.js` | Audited working tree |
| **D-041** | Denomination-Scaled Budget & Stay Rules | [`engine/app/services/travel/budget_estimator.py`](../engine/app/services/travel/budget_estimator.py) | `test_krw_rounding_no_false_precision` | Audited working tree |
