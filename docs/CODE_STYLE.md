# Travel AI — Coding Standards & Maintainability Guide

- **Document Role:** Authoritative Coding Standards and Maintainability Guide
- **Repository:** Travel AI (`travel-ai`)
- **Primary Surfaces:** React Native Mobile Client (`mobile/`) & FastAPI Intelligence Engine (`engine/`)
- **Status:** Canonical Operating Standard

---

## 1. Purpose & Scope

This guide defines the engineering conventions, architecture rules, and code quality expectations for **Travel AI**. It applies across both primary surfaces:

```text
React Native Mobile Client (mobile/)
        │  Typed HTTP REST
        ▼
FastAPI Engine (engine/)
        │  Pipeline Orchestration
        ▼
External Services (Google Places, Gemini, yt-dlp)
```

All human developers and AI coding agents contributing to this repository must follow these conventions to ensure cross-stack consistency, strict type safety, reliable performance, and zero regression risk.

---

## 2. Convention Categories

To provide clear guidance, conventions throughout this document are categorized into three levels:

1. **[ENFORCED] Existing Enforced Conventions:** Strictly enforced by compilers, typecheckers, runtime validators, or configuration (`tsc --noEmit`, Pydantic models, Expo Router rules). Violations fail validation.
2. **[PROJECT] Existing Project Conventions:** Established architectural patterns consistently implemented across the active codebase. Must be followed to preserve stylistic and architectural coherence.
3. **[RECOMMENDED] Recommended Conventions:** Best-practice maintainability guidelines where automated tooling or static analysis is not currently active.

---

## 3. Core Coding Principles

1. **Truthful Over Decorative:** The user interface and backend telemetry must reflect actual system state. Never simulate artificial delays, fabricate percentage counters, or invent fallback location data.
2. **Source-Grounded Implementation:** Inspect existing code and established patterns before writing new modules. Working source code is the ultimate ground truth.
3. **Server-Side Secret Isolation:** Third-party credentials (`GOOGLE_PLACES_API_KEY`, `GEMINI_API_KEY`) reside exclusively in the backend environment. The mobile client owns zero third-party API keys.
4. **Defensive Graceful Degradation:** Optional fields (ratings, photos, reviews, tips) must fail softly. Missing data must never crash screens or abort pipelines.
5. **Maintainability Over Cleverness:** Prefer explicit, readable code over complex meta-programming, deep inheritance hierarchies, or dynamic monkey-patching.
6. **Minimal Change Surface:** Edits must be tightly scoped to the immediate requirement. Avoid sweeping refactors or unrelated whitespace modifications.

---

## 4. Repository Structure & Naming Conventions

### 4.1 File & Directory Naming

| Layer / Role | Format | Example | Convention Level |
| :--- | :--- | :--- | :--- |
| **Mobile UI Components** | `PascalCase.tsx` | `Button.tsx`, `PlaceCard.tsx`, `TopBar.tsx` | **[PROJECT]** |
| **Expo Router Routes** | `kebab-case.tsx` / `[param].tsx` | `index.tsx`, `processing.tsx`, `[id].tsx` | **[ENFORCED]** |
| **Route Group Folders** | `(folder)` | `(tabs)/_layout.tsx` | **[ENFORCED]** |
| **Mobile Lib & Services** | `kebab-case.ts` | `travel-ai.ts`, `saved-places.ts`, `maps.ts` | **[PROJECT]** |
| **Mobile Constants & Tokens** | `kebab-case.ts` | `theme.ts`, `config.ts` | **[PROJECT]** |
| **Python Modules & Scripts** | `snake_case.py` | `location_pipeline.py`, `places_service.py` | **[PROJECT]** |
| **Python Test Files** | `test_*.py` | `test_response_builder.py`, `test_gemini_verifier.py` | **[ENFORCED]** |
| **Documentation Files** | `UPPER_SNAKE.md` or `kebab-case.md` | `CODE_STYLE.md`, `mobile-screen-spec.md` | **[PROJECT]** |

### 4.2 Identifier Naming Conventions

```text
TypeScript / React Native (mobile/)
├── Components & JSX Elements:   PascalCase        (PlaceCard, URLInput)
├── Types & Interfaces:          PascalCase        (PlaceCardProps, AnalysisResponse)
├── Variables & Functions:       camelCase         (validateReelUrl, formatDistance)
├── Custom React Hooks:          camelCase (use*)  (useSavedPlaces)
├── Internal Event Handlers:     handle*           (handleAnalyze, handleSavePress)
├── Component Event Props:       on*               (onPress, onDirectionsPress)
└── Global Constant Objects:     PascalCase/UPPER  (Colors, Spacing, INSTAGRAM_REEL_REGEX)

Python / FastAPI (engine/)
├── Classes & Schemas:           PascalCase        (LocationPipeline, BestGuess)
├── Functions & Methods:         snake_case        (build_response, extract_frames)
├── Internal / Private Methods:  _snake_case       (_cleanup_temp_files, _enrich_candidate)
├── Variables & Arguments:       snake_case        (video_path, total_start)
└── Constants & Regex:           UPPER_SNAKE_CASE  (INSTAGRAM_REEL_REGEX, STORAGE_KEY)
```

---

## 5. TypeScript & React Native Conventions

### 5.1 Strict Typing Standards **[ENFORCED]**
* Mobile TypeScript configuration (`mobile/tsconfig.json`) enforces `"strict": true`.
* Path aliases: Use `@/*` pointing to `mobile/*` (e.g. `@/constants/theme`, `@/components/ui`, `@/lib/api/client`).
* Avoid `any`: Use `unknown`, proper generic constraints, or `Record<string, unknown>`.
* Use `interface` for data schemas and component props; use `type` for unions, primitives, and tuples:
  ```typescript
  // Interfaces for schemas and props
  export interface PlaceCardProps {
    name: string;
    rating?: number;
    onPress: () => void;
  }

  // Types for unions and aliases
  export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
  ```

### 5.2 Component Structure & Memoization **[PROJECT]**
1. **Component Signature:** Declare functional components with explicit props typing:
   ```typescript
   export const PlaceCard: React.FC<PlaceCardProps> = React.memo(({
     name,
     category = 'Highlight',
     onPress,
   }) => {
     // implementation
   });
   ```
2. **Dual Exports:** Provide named export and default export on reusable UI components:
   ```typescript
   export const Button: React.FC<ButtonProps> = ...;
   export default Button;
   ```
3. **Screen Routes:** Expo Router requires screen routes in `mobile/app/` to have a default function export:
   ```typescript
   export default function AnalyzeScreen() { ... }
   ```
4. **Leaf Component Memoization:** Wrap list items and heavy visual cards in `React.memo` to eliminate unnecessary parent re-renders (`PlaceCard`, `ImageCard`, `LoadingState`).

### 5.3 Design Token Consumption **[ENFORCED]**
* **Never use ad-hoc hex codes or arbitrary padding.**
* Always import tokens from `@/constants/theme`:
  ```typescript
  import { Colors, Spacing, Radius, Typography, TouchTarget } from '@/constants/theme';
  ```
* Standard palette mapping:
  * Primary Canvas: `Colors.canvas` (`#F7F7F5`)
  * Surface Containers: `Colors.surface` (`#FFFFFF`)
  * Primary Text: `Colors.textPrimary` (`#111111`)
  * Neutral Borders: `Colors.borderSubtle` (`#E5E5E2`)
  * Verified Badge: `Colors.verified` (`#2D6A4F`)

### 5.4 Mobile Styling Patterns **[PROJECT]**
* Use `StyleSheet.create({ ... })` positioned at the bottom of the component file.
* Keep dynamic styles minimal; use style arrays for pressed or disabled states:
  ```typescript
  style={({ pressed }) => [
    styles.base,
    styles[variant],
    disabled && styles.disabled,
    pressed && styles.pressed,
    style,
  ]}
  ```
* Never hardcode status bar or navigation notch offsets; use `useSafeAreaInsets` or `SafeAreaView` from `react-native-safe-area-context`.
* Enforce minimum touch target heights (`TouchTarget.minHeight` — 44pt iOS, 48pt Android) and provide `hitSlop` on small icons.

### 5.5 React Hooks & State Conventions **[PROJECT]**
1. **Custom Hooks:** Prefix with `use` (e.g. `useSavedPlaces`). Return structured objects rather than large tuples.
2. **Stable References:** Memoize static prop objects (e.g. image sources `{ uri: photoUrl }`) with `useMemo` and callbacks passed to child items with `useCallback`.
3. **Subscription Cleanup:** Every `useEffect` that attaches listeners, subscriptions, or timers must return an explicit cleanup function:
   ```typescript
   useEffect(() => {
     let mounted = true;
     const unsubscribe = subscribeToSavedPlaces((updated) => {
       if (mounted) setPlaces(updated);
     });
     return () => {
       mounted = false;
       unsubscribe();
     };
   }, []);
   ```

---

## 6. Python & FastAPI Conventions

### 6.1 Python Language Standards **[PROJECT]**
* Target Python runtime: **3.11+**.
* Format code with standard 4-space indentation.
* Use modern Python type union syntax (`int | None = None` rather than `Optional[int]`).
* Import grouping order:
  1. Standard library (`import os`, `import time`, `from pathlib import Path`)
  2. Third-party packages (`from fastapi import APIRouter`, `import requests`, `from pydantic import BaseModel`)
  3. Internal application modules (`from engine.app.services...`)

### 6.2 Pydantic Data Models **[ENFORCED]**
* Use Pydantic v2 schemas for all API request bodies and response structures (`engine/domain/schemas/responses.py`):
  ```python
  class BestGuess(BaseModel):
      place_id: str = ""
      name: str = ""
      rating: float = 0.0
      types: list[str] = Field(default_factory=list)
      photos: list[DestinationPhoto] = Field(default_factory=list)
  ```
* Mutable defaults must use `Field(default_factory=list)` or `Field(default_factory=dict)` to avoid shared state across model instances.
* Request input validation must use `@model_validator(mode="after")` to enforce data constraints cleanly.

### 6.3 FastAPI Route Conventions **[PROJECT]**
* Define routes inside domain routers using `APIRouter(tags=["..."])` (`engine/app/api/analyze.py`).
* Never handle business logic directly in route functions; delegate to modular services or pipeline controllers.
* Enforce explicit HTTP status codes using `fastapi.status` constants (`status.HTTP_400_BAD_REQUEST`, `status.HTTP_422_UNPROCESSABLE_ENTITY`).
* Always provide user-friendly error messages that do not expose backend tracebacks or system paths.

### 6.4 External Service Integration & Timeouts **[ENFORCED]**
* **Mandatory Timeouts:** Every outbound network call (`requests.get`, `requests.post`) must declare an explicit `timeout` parameter:
  * Google Places API: `timeout=15`
  * Photo Proxy: `timeout=10`
  * yt-dlp Socket: `socket_timeout=30`
* **Header Authorization:** Pass API credentials in HTTP headers (e.g. `X-Goog-Api-Key`), never in URL query strings.
* **Error Isolation:** Catch `requests.RequestException` and external provider errors, return graceful fallbacks, and log only exception class names:
  ```python
  try:
      resp = requests.post(self.url, headers=headers, json=body, timeout=15)
  except requests.RequestException as e:
      logger.error("[API] Places request failed: %s", type(e).__name__)
      return []
  ```

---

## 7. Media Ingestion & Filesystem Hygiene **[ENFORCED]**

1. **UUID Filename Isolation:** Media downloaded via `yt-dlp` must use unique UUIDs (`uuid.uuid4().hex`) to prevent collisions and path-traversal risks.
2. **Guaranteed Cleanup in `finally` Blocks:**
   * `LocationPipeline.run()` must call `self._cleanup_temp_files(video_path, frame_paths)` in a top-level `finally` block.
   * `engine/app/api/analyze.py` must maintain an outer `finally` block to delete `video_path` if an unexpected exception occurs before the pipeline executes.
   * `InstagramYtDlpProvider` must clean up leftover `.part` and `.ytdl` files on download aborts.
3. **File Lock Prevention (Windows):** Always explicitly release `cv2.VideoCapture` instances and open PIL images using context managers (`with Image.open(...) as img: img.load()`) before deleting.

---

## 8. State Management & Offline Persistence

### 8.1 State Management Paradigm **[PROJECT]**
* **No Redux / Zustand / MobX:** Do not add external state libraries.
* Maintain transient UI state via React hooks (`useState`, `useReducer`).
* Maintain active session state via the synchronous `analysisStore` (`mobile/lib/api/analysis-store.ts`).
* Maintain offline bookmarks via `savedPlaces` subscriber storage (`mobile/lib/storage/saved-places.ts`).

### 8.2 Serialized Local Persistence **[ENFORCED]**
* To prevent race conditions and corrupted data during rapid bookmark toggling, all writes to `@react-native-async-storage/async-storage` must be chained through a serialized promise queue:
  ```typescript
  let persistQueue = Promise.resolve();

  function persistCacheToStorage(): Promise<void> {
    persistQueue = persistQueue.then(async () => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(memoryCache));
    });
    return persistQueue;
  }
  ```
* Storage hydration must safely handle JSON decode errors, validate schema fields, clamp numerical ratings to `[0, 5]`, and discard malformed items without crashing.

---

## 9. Error Handling & Information Leakage

### 9.1 Information Leakage Defense **[ENFORCED]**
* **Mobile Client Sanitization:** `mobile/lib/api/travel-ai.ts` filters backend errors using `isLeakingInternal`. Any message containing `Traceback`, `File "`, `AIzaSy`, `key=`, or raw 500 error strings is suppressed and replaced with generic user copy.
* **Backend Log Sanitization:** Never log API keys, request headers containing authorization, or raw external error bodies in server output.

### 9.2 HTTP Status Code Semantics **[PROJECT]**
* `400 Bad Request`: Malformed or non-Reel URL submitted.
* `422 Unprocessable Entity`: Inaccessible, private, or deleted Instagram Reel.
* `500 Internal Server Error`: Processing pipeline failure.
* `502 Bad Gateway`: Upstream extraction or external provider failure.
* `503 Service Unavailable`: Required service unconfigured (e.g. missing API key).
* `504 Gateway Timeout`: Analysis or upstream request exceeded time budget.

---

## 10. Performance Conventions

### 10.1 Mobile Performance **[PROJECT]**
* **List Virtualization:** Always use `<FlatList>` for dynamic feeds (`explore.tsx`, `saved.tsx`). Configure performance windowing:
  ```typescript
  <FlatList
    data={items}
    initialNumToRender={6}
    maxToRenderPerBatch={8}
    windowSize={5}
    removeClippedSubviews={Platform.OS === 'android'}
    keyExtractor={(item) => item.id}
  />
  ```
* **Map Rendering:** Coordinate validation via `isValidCoordinate` must reject invalid values and Null Island `(0, 0)` before rendering map pins or computing delta bounding boxes.
* **$O(1)$ Hash Lookups:** Cache active session items and saved places using indexed `Map<string, T>` and `Set<string>` collections for constant-time ID lookups.
* **Isolated Timers:** Processing second timers must update local isolated components to avoid re-rendering entire screen trees.

### 10.2 Backend Performance **[PROJECT]**
* **Lazy Module Imports:** Defer heavy imports (such as `cv2`, `torch`, `easyocr`, `whisper`) until execution time using helper functions (`get_provider()`, `get_pipeline()`).
* **Singletons & Cached Models:** Model weights and OCR readers should initialize once and remain cached in memory across requests.

---

## 11. Code Size & Complexity Guidelines **[RECOMMENDED]**

* **Component Size:** Aim to keep individual React components under **250 lines**. Extract child components (e.g. headers, cards, bottom sheets) when complexity grows.
* **Function Size:** Keep individual helper functions under **50 lines** with a single clear responsibility.
* **Cyclomatic Complexity:** Avoid deep nesting beyond 3 levels; use early return statements (`guard clauses`) to reduce indentation.
* **Premature Abstraction:** Do not create generic "factories" or abstraction wrappers for single-use classes or components. Two concrete implementations are required before extracting a common abstraction.

---

## 12. Git & Diff Hygiene **[ENFORCED]**

1. **No Automatic Commit / Push:** Coding agents must **never** run `git commit` or `git push` unless explicitly ordered by the user.
2. **Minimal Change Scope:** Modify only the files and lines necessary to accomplish the task.
3. **No Unrelated Reformatting:** Do not reformat files, adjust unrelated whitespace, or reorder exports outside the target feature scope.
4. **Pre-Commit Verification:** Run `git diff --check` and `git status --short` before finishing any task to guarantee no whitespace errors or untracked scratch files remain.
5. **No Secrets in Git:** Never stage `.env` files or raw credentials.

---

## 13. Maintainable Code Checklist for Coding Agents

Before declaring any implementation complete, verify:

- [ ] **Type Safety:** Does `npx tsc --noEmit` pass with zero errors in `mobile/`?
- [ ] **Design Tokens:** Are all colors, margins, paddings, and font sizes imported from `@/constants/theme`?
- [ ] **No Secrets Exposed:** Are third-party keys isolated strictly to the backend engine?
- [ ] **Defensive Checks:** Are all optional backend response fields guarded with null checks or defaults?
- [ ] **Resource Cleanup:** Are temporary video files and frames unlinked in a `finally` block?
- [ ] **Touch Ergonomics:** Are touch targets at least 44×44 pt (iOS) or 48×48 pt (Android)?
- [ ] **Clean Diff:** Does `git diff --check` return zero whitespace warnings?
- [ ] **Scope Disciplinary:** Were only the requested files modified without unrelated refactors?
