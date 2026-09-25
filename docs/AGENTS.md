# Travel AI — Operating Guide for AI Coding Agents

- **Document Role:** Canonical Operating Manual for AI Coding Agents
- **Repository:** Travel AI (`travel-ai`)
- **Primary Product Surface:** React Native Mobile Client (`mobile/`)
- **Backend Service:** Standalone Python FastAPI Intelligence Engine (`engine/`)
- **Status:** Mandatory Operating Standard

---

## A. Project Identity

**Travel AI** is an AI-native, mobile-first travel intelligence application designed to transform unstructured social media travel content (specifically public Instagram Reels) into verified real-world destinations, contextual travel dossiers, interactive cartography, and offline travel bookmarks.

The system pairs a high-performance native mobile client (**React Native · Expo SDK 57 · TypeScript**) with a multimodal intelligence engine (**Python · FastAPI**) that orchestrates media extraction, speech transcription, optical character recognition (OCR), Google Places candidate resolution, and Gemini multimodal vision verification.

---

## B. Current Product Direction

The mobile application is the primary product surface.

```text
The mobile application (mobile/) is the primary product surface.

Do not treat the old Next.js web application (web/) as the default place for new product work unless the task explicitly targets the web application.
```

The core product loop operates across native mobile and backend layers:

```text
Instagram Reel URL
        │
        ▼
   Mobile App (mobile/app/(tabs)/index.tsx)
        │  POST /analyze { reel_url }
        ▼
   FastAPI Engine (engine/app/api/analyze.py)
        │
        ▼
Location Intelligence Pipeline (engine/app/pipelines/location_pipeline.py)
[ProviderManager → Media Extraction → Whisper / OCR → Google Places → Gemini Vision]
        │
        ▼
Structured Travel Result (AnalysisResponse)
        │
        ▼
Mobile Presentation & Persistence
[Results Dossier → Interactive Map → Surrounding Places → Offline Saved Locker]
```

All new user-facing features, navigation flows, and visual experiences must be implemented inside the `mobile/` application directory.

---

## C. Repository Map

Ownership boundaries across the repository:

### 1. `mobile/` — Primary Mobile Application
The primary client codebase built with React Native and Expo (SDK 57) in strict TypeScript mode:
* `mobile/app/` — Expo Router file-based routes:
  * `mobile/app/(tabs)/` — Persistent 4-tab thumb navigation (`index.tsx` Analyze, `explore.tsx` Explore, `saved.tsx` Saved Locker, `profile.tsx` Diagnostics).
  * `mobile/app/analyze/` — Analysis workflow (`processing.tsx` Pipeline status, `results.tsx` Destination dossier, `map.tsx` Interactive cartography).
  * `mobile/app/place/[id].tsx` — Place detail inspection modal.
  * `mobile/app/_layout.tsx` — Root navigation stack and safe area provider.
* `mobile/components/` — Reusable, production-grade UI components:
  * `mobile/components/ui/` — Buttons, Badges, PlaceCards, ImageCards, EmptyState, SectionHeader, LoadingState.
  * `mobile/components/map/` — Native Map component (`TravelMap.tsx`), custom map markers (`MapMarker.tsx`), and bottom sheet integration (`PlaceBottomSheet.tsx`).
* `mobile/constants/` — Single sources of truth for configuration and design tokens:
  * `mobile/constants/config.ts` — Centralized API base URL, timeout budgets (180s analysis), and application identifiers.
  * `mobile/constants/theme.ts` — Canonical design system tokens (Colors, Spacing, Radius, Typography, TouchTarget).
* `mobile/lib/` — Client infrastructure, storage, and utility modules:
  * `mobile/lib/api/` — Typed HTTP client (`client.ts`), service layer (`travel-ai.ts`), and in-memory session cache (`analysis-store.ts`).
  * `mobile/lib/storage/` — Resilient offline bookmarking with serialized write queue (`saved-places.ts`).
  * `mobile/lib/maps.ts` — Coordinate validation and platform-aware external navigation handoffs (Apple Maps vs. Google Maps).
  * `mobile/lib/haptics.ts` — Platform-guarded native tactile feedback.
  * `mobile/lib/utils.ts` — Reel URL validation and unit formatting.
* `mobile/types/` — TypeScript type definitions (`analysis.ts`) mirroring backend engine schemas.
* `mobile/app.json`, `mobile/eas.json`, `mobile/package.json` — Expo manifest, EAS cloud build profiles, and dependency definitions.

### 2. `engine/` — Backend Intelligence Engine & API
The standalone Python FastAPI service orchestrating video ingestion, intelligence extraction, and geographic resolution:
* `engine/app/main.py` — FastAPI application root, CORS configuration, and router registration.
* `engine/app/api/` — API route handlers (`analyze.py` analysis endpoints, `health.py` service readiness probe).
* `engine/app/pipelines/` — Core processing pipelines (`location_pipeline.py` orchestrating multi-signal analysis).
* `engine/app/services/` — External integration clients (Google Places, Gemini multimodal verifier, OCR, Whisper transcription).
* `engine/app/models/` — Pydantic schemas defining request and response contracts.
* `engine/providers/` — Instagram media extraction abstraction (`ProviderManager`, `yt-dlp`).
* `engine/tests/` — Automated pytest test suites covering pipeline stages, verifiers, and response builders.
* `engine/requirements.txt` — Python dependencies.

### 3. `docs/` — Product, Architecture & Engineering Documentation
* `docs/architecture/` — Source-grounded Archify architecture artifacts:
  * `system-architecture.architecture.json` + `system-architecture.html` — Interactive system topology.
  * `backend-pipeline.dataflow.json` + `backend-pipeline.html` — Backend intelligence pipeline dataflow.
  * `mobile-dataflow.dataflow.json` + `mobile-dataflow.html` — Mobile client dataflow and state transitions.
* `docs/ARCHITECTURE.md` — Core architecture overview.
* `docs/mobile/` — Mobile UX roadmap (`mobile-ux-roadmap.md`) and screen specifications (`mobile-screen-spec.md`).

### 4. Authoritative Project Documents (`docs/`)
* `docs/PRD.md` — Authoritative Product Requirements Document (features, scope, user journeys, MVP DoD).
* `docs/AGENTS.md` — Authoritative Operating Guide for AI Coding Agents (this document).
* `docs/DESIGN_SYSTEM.md` — Authoritative Mobile Design System (tokens, components, typography, layout rules).
* `docs/ARCHITECTURE.md` — Core architecture overview and component boundaries.
* `docs/SECURITY.md` — Authoritative security and secrets-handling guide.
* `docs/CODE_STYLE.md` — Authoritative coding standards and maintainability guide.
* `docs/DATABASE.md` — Authoritative data architecture and storage management guide.
* `docs/API.md` — Authoritative API and integration communication guide.

### 5. Web Application Prototype (`web/`)
* Next.js web application (`web/app/`, `web/components/`, `web/lib/`, `web/types/`, `web/public/`). Preserved as a secondary desktop prototype. Do not touch or treat as the primary product unless a user request explicitly targets the web client.

### 6. Processing Pipelines (`pipelines/`)
* Baseline processing pipeline definitions (`pipelines/analysis_pipeline.py`). Production pipeline execution is actively orchestrated by `engine/app/pipelines/location_pipeline.py`.

### 7. Static Assets (`assets/`)
* Project static assets (`assets/frames/`). Temporary runtime extraction artifacts remain isolated under `engine/assets/`.

---

## D. Technology Rules

Only use established, verified technologies in this repository:

### Mobile Client
* **Framework:** React Native (`0.86.x`), Expo (SDK 57)
* **Language:** TypeScript (`~6.0.x`, strict mode)
* **Navigation:** Expo Router (`~57.0.x`, file-based typed routing)
* **Cartography:** `react-native-maps` (`1.27.x`, Apple MapKit on iOS, Google Play Services on Android)
* **Storage:** `@react-native-async-storage/async-storage` (`2.2.x`)
* **Safe Area & Gestures:** `react-native-safe-area-context`, `react-native-gesture-handler`, `react-native-reanimated`
* **Device Capabilities:** `expo-clipboard`, `expo-haptics`, `expo-image`

### Backend Engine
* **Language & Runtime:** Python 3.11+, Uvicorn
* **API Framework:** FastAPI (`>=0.110.0`), Pydantic (`>=2.7.0`)
* **Media Ingestion:** `yt-dlp` via `ProviderManager` abstraction
* **Transcription & OCR:** OpenAI Whisper, EasyOCR, Tesseract, OpenCV, Pillow
* **AI & Verification:** Google Gemini (`google-generativeai>=0.5.0`, Gemini 2.5 Flash multimodal vision)
* **Geocoding & Places:** Google Places API (New & Legacy), Geocoding

### Operational Technology Boundaries
* Do not invent libraries or introduce unvetted third-party packages.
* Do not introduce external state management libraries (Redux, Zustand, MobX, Recoil) to the mobile app; state is maintained via React hooks, the synchronous `analysisStore`, and `savedPlaces` subscriber storage.
* Do not turn this document or codebase into an unvetted dependency dump.

---

## E. Source-of-Truth Rules

1. **Inspect source before modifying code:** Always use directory listings, file views, and ripgrep searches to inspect active code before formulating edits.
2. **Prefer actual implementation over assumptions:** If documentation and source code disagree, working source code is the ultimate ground truth.
3. **Read relevant architecture/product/design docs before structural changes:** Review `docs/ARCHITECTURE.md` (and `docs/architecture/`), `docs/DESIGN_SYSTEM.md`, and `docs/PRD.md` before making cross-module modifications.
4. **Do not infer undocumented APIs:** Verify endpoint signatures, query parameters, and payload schemas from `engine/app/api/` and `mobile/lib/api/`.
5. **Do not invent files or modules:** Place new functionality inside existing architectural structures following established naming conventions.
6. **Do not rewrite working systems unnecessarily:** Never refactor working production logic, helpers, or services without explicit instructions or failing test evidence.
7. **Search before proposing:** Always grep the repository for existing utilities, components, or tokens before writing new ones.

---

## F. Documentation Hierarchy

Each authoritative document serves a distinct, non-overlapping role:

```text
Actual source code
      ↓
Architecture / implementation evidence
      ↓
docs/ARCHITECTURE.md (and docs/architecture/)
      ↓
docs/DESIGN_SYSTEM.md
      ↓
docs/PRD.md
      ↓
docs/AGENTS.md operational guidance
```

### Document Responsibilities
* **Source Code & Implementation Evidence:** The ultimate ground truth of runtime behavior and system contracts.
* **`docs/ARCHITECTURE.md` (and `docs/architecture/`):** Defines *how the system is technically structured*, component boundaries, data flow, and pipeline stages.
* **`docs/DESIGN_SYSTEM.md`:** Defines *how the product looks and behaves visually*, tokens, layout, typography, and UI rules.
* **`docs/PRD.md`:** Defines *what the product is and must do*, feature boundaries, user journeys, and acceptance criteria.
* **`docs/AGENTS.md`:** Defines *how coding agents must operate*, inspect, modify, validate, and report changes within this repository.

### Conflict Resolution Protocol
If a documented statement in `docs/PRD.md`, `docs/ARCHITECTURE.md`, or `docs/DESIGN_SYSTEM.md` conflicts with working source code, agents must:
1. Inspect the active source code to understand current runtime behavior.
2. Formulate changes that respect the working source implementation.
3. Explicitly report the documentation discrepancy in the task report rather than blindly following stale documentation or breaking working code.

---

## G. Change-Scope Rules

Coding agents must maintain strict control over change surfaces:
* **Identify exact files before editing:** Name target files in advance; do not make speculative edits across unrelated directories.
* **Minimize the change surface:** Modify only the exact lines and files needed to fulfill the request.
* **Preserve existing architecture:** Respect established directory ownership, module interfaces, and export structures.
* **Avoid unrelated refactors:** Do not reformat files, adjust unrelated whitespace, or rename variables outside the target scope.
* **Avoid changing working code without evidence:** Never modify working logic based on stylistic preference or speculative improvements.
* **Avoid modifying multiple layers when one is sufficient:** If a problem exists solely in mobile presentation, do not alter backend API routes or pipeline stages.
* **Explicitly state exclusions:** State clearly what was intentionally left untouched in your task summary.
* **Report files changed:** Provide a precise list of modified files in the final report.
* **Never silently expand scope:** Do not implement features or architectural changes beyond the user's explicit prompt.

---

## H. Mobile Development Rules

The mobile client (`mobile/`) is the primary application surface:
* **Use existing design tokens:** Import tokens strictly from `mobile/constants/theme.ts` (`Colors`, `Spacing`, `Radius`, `Typography`, `TouchTarget`). Never introduce ad-hoc hex colors, arbitrary padding, or custom font sizes.
* **Reuse existing UI components:** Check `mobile/components/ui/` (`Button`, `Badge`, `PlaceCard`, `ImageCard`, `EmptyState`, etc.) and `mobile/components/map/` before authoring new UI elements.
* **Preserve Expo Router structure:** Respect the file-based route hierarchy under `mobile/app/`. Do not bypass layouts (`_layout.tsx`) or compromise typed route parameters.
* **Preserve safe-area behavior:** Always wrap screen contents using `useSafeAreaInsets` or `SafeAreaView` from `react-native-safe-area-context`. Never hardcode top/bottom notch padding.
* **Preserve native mobile interaction patterns:** Provide responsive touch states (`activeOpacity`, transform scale feedback), dismiss keyboards on outside taps, and handle hardware/software back navigation.
* **Preserve accessibility behavior:** Ensure touch targets satisfy minimum dimensions (44×44 pt on iOS, 48×48 pt on Android). Apply `hitSlop` on smaller icons.
* **Preserve haptics and motion conventions:** Utilize `hapticFeedback` from `mobile/lib/haptics.ts` for user triggers (`light`, `medium`, `selection`, `success`). Keep animations purposeful and subtle via `react-native-reanimated`.
* **Avoid duplicating components:** Extend existing components with optional props rather than creating cloned variations.
* **Avoid introducing a new UI system:** Do not install or introduce Tailwind, NativeWind, Tamagui, or UI kits without explicit user direction.
* **Mandatory inspection step:** Inspect `mobile/constants/theme.ts` and `mobile/components/ui/` before creating or modifying UI patterns.

---

## I. Backend Development Rules

Preserve the strict backend/mobile boundary:

```text
Mobile Client (mobile/)
       │  HTTP REST (POST /analyze, GET /health)
       ▼
FastAPI Engine (engine/app/main.py)
       │
       ▼
Intelligence Pipeline (engine/app/pipelines/)
       │
       ▼
External Services (Google Places, Gemini, yt-dlp)
```

* **Client credential isolation:** The mobile client must NEVER own, store, or receive backend API credentials (`GOOGLE_PLACES_API_KEY`, `GEMINI_API_KEY`). All third-party services are proxied through FastAPI.
* **Third-party secrets remain server-side:** Environment variables for external APIs are defined only in engine-level `.env` or root `.env`.
* **API contracts must not be changed casually:** Modifications to endpoint paths, request bodies, or response schemas directly impact mobile consumers and require coordinated updates.
* **Preserve pipeline compatibility:** Pipeline changes must return responses compatible with `AnalysisResponse` (`mobile/types/analysis.ts`) unless the task explicitly orders a schema revision.
* **Backend changes require backend validation:** Any changes under `engine/` must be validated with pytest test runs.
* **No speculative infrastructure:** Do not introduce Celery, Redis, RabbitMQ, Kafka, Postgres, or microservices unless explicitly requested and justified.

---

## J. API Rules

* **Inspect existing contracts first:** Check `engine/app/api/analyze.py` and `mobile/types/analysis.ts` before altering client or server network code.
* **Inspect request/response models before touching mobile types:** Ensure TypeScript types in `mobile/types/` mirror Pydantic models in `engine/app/models/`.
* **Preserve error semantics:** Maintain accurate HTTP status codes:
  * `400 Bad Request`: Invalid or malformed Instagram Reel URL.
  * `422 Unprocessable Entity`: Inaccessible or private Reel.
  * `500 Internal Server Error`: Engine processing failure.
  * `502 Bad Gateway`: Upstream extraction failure.
  * `504 Gateway Timeout`: External timeout.
* **Preserve timeout behavior:** Maintain the 180,000ms (180s) client timeout budget in `mobile/constants/config.ts` to accommodate deep video download, OCR, Whisper, and Gemini calls.
* **Preserve retry safeguards:** Preserve the mutex ref lock in `mobile/app/analyze/processing.tsx` preventing concurrent duplicate submissions.
* **No fake/mock responses in production paths:** Never return dummy or hardcoded analysis data on production endpoints.
* **Never fabricate backend fields:** Every response property must correspond to real pipeline extraction data.
* **API Change Justification Protocol:** If an API change is genuinely necessary, document:
  1. *Why it is necessary*
  2. *What changes*
  3. *Which consumers are affected*
  4. *How backwards compatibility is preserved*

---

## K. Design-System Rules

Adhere strictly to `docs/DESIGN_SYSTEM.md`:
* **Prohibited practices:**
  * Arbitrary hex / rgba colors (e.g. random `#3b82f6` or `#ff0000`).
  * Arbitrary typography styles, unvetted fonts, or non-standard weights.
  * Random margins and paddings not in the 4pt `Spacing` scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64).
  * Inconsistent corner radii outside `Radius` tokens (4, 6, 8, 12, 16, 9999).
  * Heavy drop shadows, glowing borders, or decorative neon gradients.
  * Fabricated progress bars (e.g. animating 0% to 100% fake counters).
  * Speculative UI patterns or duplicate card/button variants.
* **Mandatory practice:** Always consume tokens from `mobile/constants/theme.ts` (`Colors`, `Spacing`, `Radius`, `Typography`, `TouchTarget`).

---

## L. Architecture Rules

Adhere strictly to `docs/ARCHITECTURE.md` and existing architecture artifacts:
* **Pre-change architectural checklist:**
  1. Inspect the current implementation and established patterns.
  2. Identify all affected layer boundaries (Mobile, FastAPI, Pipeline, Providers).
  3. Identify downstream and upstream dependencies.
  4. Determine whether the change is strictly necessary or can be solved within existing boundaries.
  5. Document architectural impact before writing code.
* **Strictly prohibited architectural additions:**
  * Unnecessary abstraction layers or "factory" patterns for single implementations.
  * Speculative microservices, worker processes, or task brokers.
  * External databases or ORMs for features requiring only local device storage.
  * Complex caching layers, message buses, or state-management frameworks.
* **Rule:** New architectural components must be justified by concrete repository evidence and explicit user instruction.

---

## M. Archify Rules

**Archify** is the designated architecture-analysis and documentation tool for the Travel AI repository:
* **Installation Location:** Installed as a system skill at `C:\Users\pradn\.agents\skills\archify\`.
* **Execution CLI:**
  ```bash
  node C:/Users/pradn/.agents/skills/archify/bin/archify.mjs <command>
  ```
* **When to use Archify:**
  * Understanding repository architecture and component relationships.
  * Tracing system interactions and cross-layer data flows.
  * Generating source-grounded architecture or dataflow diagrams.
  * Validating and updating architecture artifacts when structural changes occur.
* **Operating Rules:**
  * Diagrams must be grounded strictly in actual repository source code.
  * Do not use Archify as an application runtime dependency.
  * Do not vendor the Archify codebase into `travel-ai`.
  * Do not generate architecture diagrams merely for decorative purposes.
  * For significant architectural modifications, follow the Archify workflow:
    ```text
    Inspect Source → Trace Dataflow → Analyze → Generate Spec (.json) → Validate / Deliver (.html) → Document
    ```
* **Existing Archify Artifacts in Repository (`docs/architecture/`):**
  * `docs/architecture/system-architecture.architecture.json` + `system-architecture.html`
  * `docs/architecture/backend-pipeline.dataflow.json` + `backend-pipeline.html`
  * `docs/architecture/mobile-dataflow.dataflow.json` + `mobile-dataflow.html`

---

## N. Validation Rules

Every change must be validated against its affected layer before declaring completion:

### 1. Mobile Layer Changes
Run from the `mobile/` directory:
```bash
cd mobile
npx tsc --noEmit
npx expo-doctor
```

### 2. Backend Layer Changes
Run from the workspace root or `engine/`:
```bash
python -m pytest engine/tests/
# Or run targeted test suites:
python -m pytest engine/tests/test_response_builder.py
python -m pytest engine/tests/test_gemini_verifier.py
```

### 3. Documentation-Only Changes
Run from the repository root:
```bash
git diff --check
git status --short
```

### Validation Constraints
* Do not invent validation commands that do not exist in the project.
* Report exact commands executed and their output/exit status.
* Never claim validation passed without actually executing it.

---

## O. Git Rules

* **No Automatic Commit / Push:** Agents must NEVER run `git commit` or `git push` unless explicitly and unambiguously instructed by the user.
* **Pre-commit inspection commands:**
  ```bash
  git status
  git diff --check
  ```
* **Commit discipline (when explicitly requested):**
  * Keep commits focused, cohesive, and atomic.
  * Write clear, conventional commit messages (e.g. `docs: update agent operating guide`).
  * Never commit unrelated files, debug logs, or scratch files.
  * Never commit generated artifacts or ignored files (`node_modules/`, `.expo/`, `.venv/`, `.env`).
* **Never push without explicit user instruction.**

---

## P. Secrets & Environment Rules

* **Never hardcode secrets:** No API keys, credentials, tokens, or private URLs in code.
* **Never commit secrets:** Never track `.env`, `.env.local`, or any file containing private keys.
* **Inspect `.gitignore`:** Verify that any new environment or secret file is covered by `.gitignore` before creating it.
* **Use `.env.example`:** Document all required environment variables in `.env.example` (or `mobile/.env.example`) with dummy values and explanatory comments.
* **Keep secrets server-side:** `GOOGLE_PLACES_API_KEY`, `GEMINI_API_KEY`, and other third-party provider keys must remain exclusively in the backend environment.
* **Never log secrets:** Sanitize log statements and error messages to prevent leaking API keys or authorization headers.
* **Production API Safety:** Preserve the `__DEV__` guard in `mobile/constants/config.ts` requiring explicit HTTPS `EXPO_PUBLIC_API_URL` for production builds without silent loopback fallbacks.

---

## Q. Reliability Rules

Preserve existing safeguards unless the task explicitly targets modifying them:
* **API timeout handling:** Maintain the 180s budget on deep analysis requests.
* **Request abort handling:** Propagate `AbortSignal` through `HttpClient` to allow clean user cancellation without hanging sockets.
* **Retry concurrency locks:** Keep the mutex ref guards in `mobile/app/analyze/processing.tsx` preventing concurrent duplicate submissions.
* **Stale analysis protection:** Ensure `analysisStore.clearAnalysisResult()` is invoked when starting a new query or canceling.
* **Defensive response parsing:** Preserve null checks, array checks (`Array.isArray`), and fallback strings for all backend response fields.
* **Map coordinate validation:** Preserve `isValidCoordinate()` in `mobile/lib/maps.ts` (finite numbers within `[-90, 90]` and `[-180, 180]`, rejecting Null Island `(0, 0)`).
* **Persistence resilience:** Preserve the serialized write queue (`persistQueue = persistQueue.then(...)`) in `mobile/lib/storage/saved-places.ts` to prevent race conditions during rapid bookmark toggling.
* **Corrupted storage recovery:** Keep JSON parse error handling and invalid schema sanitization during storage hydration.
* **Navigation guards:** Preserve deep-link handling and route safety checks.
* **Rule:** Never delete or bypass safeguards simply to make code shorter or cleaner.

---

## R. Performance Rules

Maintain performance standards across all layers:
* **List virtualization:** Use `<FlatList>` with appropriate windowing props (`initialNumToRender={6-8}`, `windowSize={5}`) for feeds (`explore.tsx`, `saved.tsx`).
* **Cartography performance:** Memoize coordinate objects and pin markers to prevent redundant native map redraws.
* **Image optimization:** Use `expo-image` or memoized image cards with cached URIs and proxy URL resolution.
* **State minimization:** Keep high-frequency timer state (e.g. elapsed seconds counter) isolated to avoid re-rendering entire screen trees.
* **Data structures:** Maintain $O(1)$ lookups via in-memory maps (`placeMap`, `photoMap`, `memoryCacheMap`).
* **Component memoization:** Preserve `React.memo` on leaf components (`PlaceCard`, `ImageCard`, `PlaceBottomSheet`).
* **Avoid premature optimization:** Do not add unmeasured caching or convoluted caching layers without profiling evidence.

---

## S. Testing / QA Rules

* **Distinguish Automated Validation vs Manual Device Verification:**
  * Automated validation (TypeScript `tsc --noEmit`, `expo-doctor`, `pytest`) confirms syntax, types, and automated unit contracts.
  * Manual device verification confirms native touch responsiveness, gesture coordination, MapKit/Google Maps rendering, haptics, clipboard access, and external navigation handoffs.
* **Identify when physical-device testing is required:** If a task touches gestures, native maps, camera insets, or haptics, state explicitly that physical device or emulator testing is needed.
* **No false claims:**
  * Never claim a mobile feature is verified on-device if you only ran `tsc`.
  * Never claim production readiness from static checks alone.
  * Report exact test command outputs truthfully.

---

## T. Explicit "Do Not" Rules

AI coding agents operating in this repository must NEVER:
1. **Invent requirements** not stated in the task or PRD.
2. **Invent architecture** (no unnecessary microservices, databases, queues, or frameworks).
3. **Fabricate data or mock responses** in production execution paths.
4. **Modify unrelated files** or perform unrequested cosmetic refactorings.
5. **Silently change API contracts** between backend and mobile clients.
6. **Expose secrets** or move server-side credentials to the mobile client.
7. **Redesign existing UI** without explicit instructions and design-system alignment.
8. **Replace working architecture** without concrete failure evidence.
9. **Introduce dependencies casually** without approval or verified project need.
10. **Create duplicate components** instead of reusing `mobile/components/ui/`.
11. **Commit automatically** without explicit user instruction.
12. **Push automatically** under any circumstances.
13. **Claim tests passed** when they were not executed.

---

## U. Task Execution Protocol

Standard operating workflows for coding agents in Travel AI:

### 1. Standard Implementation Workflow
```text
1. Understand the task & requirements
2. Inspect relevant files & existing patterns
3. Read applicable documentation (docs/PRD.md / docs/ARCHITECTURE.md / docs/DESIGN_SYSTEM.md)
4. Identify exact change surface (list target files)
5. Implement the smallest correct change
6. Validate (run layer-specific validation commands)
7. Inspect diff (git diff --check, git status)
8. Report results with exact files and validation outputs
9. STOP
```

### 2. Architectural Change Workflow
```text
1. Inspect current implementation & boundaries
2. Trace dataflow and dependencies
3. Use Archify (node C:/Users/pradn/.agents/skills/archify/bin/archify.mjs)
4. Validate architectural impact
5. Implement minimal structural changes
6. Validate (layer-specific tests & typechecks)
7. Update architecture documentation & Archify artifacts
8. STOP
```

### 3. Documentation-Only Workflow
```text
1. Inspect relevant files & source-of-truth code
2. Update target documentation
3. Validate (git diff --check, git status --short)
4. Report updates & any unverified rules
5. STOP
```
