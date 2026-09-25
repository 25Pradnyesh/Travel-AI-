# Travel AI — Product Requirements Document (PRD)

- **Document Status:** Authoritative Product Source
- **Product Version:** 1.0.0 (Mobile MVP)
- **Primary Surface:** Native Mobile Application (iOS & Android — React Native, Expo, TypeScript)
- **Backend Layer:** Travel AI Intelligence Engine (Python, FastAPI)
- **Last Updated:** Current Implementation Baseline

---

## 1. Product Overview

### 1.1 Product Definition
**Travel AI** is an AI-native mobile travel intelligence application that transforms unstructured social media travel content into verified real-world destinations, interactive cartography, and offline travel bookmarks.

### 1.2 The Problem
Modern travelers discover places primarily through short-form social video (e.g., Instagram Reels). While visually captivating, this medium is geographically opaque:
- Creators rarely list precise coordinates or standardized addresses.
- Audio cues, spoken foreign names, and background landmarks are difficult for viewers to identify manually.
- Point-of-interest details, practical transit advice, seasonality windows, and nearby amenities are fragmented or absent.
- Viewers save videos into disparate social app bookmarks without structured geographical context, making future trip planning difficult.

### 1.3 Target Audience
- **Independent Travelers & Explorers:** Individuals seeking specific, authentic locations seen in travel media.
- **Itinerary Planners:** Travelers wanting structured contextual data (seasonality, budget, recommended duration, nearby highlights) rather than generic blog posts.
- **Visual Content Consumers:** People who use Instagram as their primary travel discovery engine but need an actionable bridge to the real world.

### 1.4 Core Value Proposition
> **Instagram Reel URL → Identified Real-World Place → Multimodal Verification → Travel Briefing → Interactive Map → Offline Locker**

### 1.5 System Relationship & Primary Surface
The **primary product client** is the native mobile application built with React Native, Expo, and TypeScript. The web frontend (Next.js) serves as a legacy prototype and secondary desktop reference. The mobile app interfaces directly with the standalone Python FastAPI intelligence engine via typed REST endpoints (`/analyze`, `/health`).

```text
┌─────────────────────────────────────────────────────────┐
│                 Travel AI Mobile Client                 │
│         (React Native · Expo SDK 57 · TypeScript)       │
└───────────────────────────┬─────────────────────────────┘
                            │ POST /analyze { reel_url }
                            ▼
┌─────────────────────────────────────────────────────────┐
│            FastAPI Travel Intelligence Engine           │
│   (yt-dlp · Whisper · Tesseract OCR · Google Places ·   │
│                 Gemini Multimodal Vision)               │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Product Goal & MVP Scope

### 2.1 Primary MVP Goal
Provide a reliable, truthful, thumb-driven mobile experience that accepts an Instagram Reel URL and returns verified geographic intelligence and surrounding context within an interactive native canvas.

### 2.2 Measurable Capabilities
- **URL Ingestion:** Client-side validation, automatic protocol normalization (`https://`), and pasteboard handling for Instagram Reel links.
- **Multimodal Extraction:** Server-side ingestion of video frames, audio speech, caption text, and creator hashtags without client-side API credentials.
- **Geographic Resolution:** Identification of the primary candidate landmark and resolution against the Google Places directory.
- **Multimodal Verification:** Truthful verification scoring using Google Gemini multimodal vision to confirm visual landmark match against video frames.
- **Context Synthesis:** Extraction of practical travel intelligence: optimal visit season, daily budget tier, recommended stay days, and local guidance tips.
- **Surrounding Highlights:** Discovery of nearby points of interest clustered around the destination, categorized into Attractions, Dining, Cafes, and Hotels.
- **Interactive Cartography:** Native exploration map (`react-native-maps`) plotting the destination and nearby highlights with zero-client-key external map handoffs (Apple Maps on iOS, Google Maps on Android/Web).
- **Offline Travel Locker:** Fast, offline-first local bookmarking of places with zero-latency toggling, duplicate protection, and cold-start state preservation.

---

## 3. Core User Journey

```text
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 1. ANALYZE   │ ──► │ 2. PROCESS   │ ──► │ 3. DISCOVER  │ ──► │ 4. EXPLORE   │
│ Paste Reel   │     │ Pipeline     │     │ Destination  │     │ Map & Nearby │
│ & Validate   │     │ Telemetry    │     │ Dossier      │     │ Highlights   │
└──────────────┘     └──────────────┘     └──────────────┘     └──────┬───────┘
                                                                      │
                                                                      ▼
                                                               ┌──────────────┐
                                                               │ 5. SAVE      │
                                                               │ Offline      │
                                                               │ Locker       │
                                                               └──────────────┘
```

1. **Input & Validation:** The user pastes a public Instagram Reel link into the Analyze input or taps "Paste". Format validation executes client-side.
2. **Analysis Execution:** The user initiates analysis. The app transitions to the full-screen Processing route with an active request controller and a 180-second timeout budget.
3. **Truthful Progress:** The user monitors honest pipeline stages (Media ingestion → Location clues → Candidate resolution → Travel intelligence).
4. **Dossier Discovery:** Upon 200 OK resolution, the app navigates to the Results screen displaying the destination identity, verification tier badge, identification evidence, travel briefing metrics, and local tips.
5. **Cartographic Exploration:** The user switches to the Places view or opens the full-screen Interactive Map. Tapping pins summons a gesture-driven bottom sheet with place details and one-tap directions handoff.
6. **Locker Preservation:** The user bookmarks the primary destination or individual nearby highlights. Places are stored locally on the device for offline retrieval.

---

## 4. Mobile Information Architecture

The mobile app implements a persistent 4-tab thumb navigation shell combined with focused stack and modal screens:

```text
Travel AI App Shell
├── Tabs (Bottom Navigation)
│   ├── [Tab 1] Analyze    — Reel URL input, pasteboard detection, pipeline trigger
│   ├── [Tab 2] Explore    — Discovered places feed, search, category chips
│   ├── [Tab 3] Saved      — Offline travel locker, filter by category, directions
│   └── [Tab 4] Profile    — Map preference, engine diagnostics, version info
│
└── Stack & Modal Screens
    ├── /analyze/processing — Full-screen modal: Live pipeline stages & timer
    ├── /analyze/results    — Stack screen: Editorial destination dossier & intelligence
    ├── /analyze/map        — Stack screen: Full-screen interactive cartography canvas
    └── /place/[id]         — Modal screen: Complete place inspection dossier
```

### Screen Directory & Roles

| Route | Role | Presentation | Data Source |
| :--- | :--- | :--- | :--- |
| **`/(tabs)/index`** | **Analyze Entry** | Tab Root | Local input state & pasteboard |
| **`/analyze/processing`** | **Processing Pipeline** | FullScreen Modal | Live fetch lifecycle & stage timer |
| **`/analyze/results`** | **Results Dossier** | Push Screen | Active `analysisStore` memory |
| **`/analyze/map`** | **Exploration Map** | Push Screen | Active `analysisStore` coordinates |
| **`/place/[id]`** | **Place Detail** | Modal Screen | `analysisStore` + fallback `savedPlaces` |
| **`/(tabs)/explore`** | **Explore Feed** | Tab Root | Active session discoveries |
| **`/(tabs)/saved`** | **Saved Locker** | Tab Root | Persistent `AsyncStorage` cache |
| **`/(tabs)/profile`** | **Diagnostics & Prefs** | Tab Root | Client config & `/health` endpoint |

---

## 5. Screen Specifications & Capabilities

### 5.1 Analyze Surface (`/(tabs)/index.tsx`)
- **Input Field:** Clean URL input with automated protocol prepending (`instagram.com/...` → `https://instagram.com/...`).
- **Validation Engine:** Strict rejection of non-Reel URLs (IG photo posts `/p/`, expiring stories `/stories/`, user profiles) with actionable diagnostic error copy.
- **Clipboard Integration:** One-tap native clipboard reading via `expo-clipboard`.
- **Keyboard Ergonomics:** Automatic keyboard dismiss on outside tap, explicit `returnKeyType="go"`, and safe-area insets.
- **Action Trigger:** Disabled submit state when input is empty or invalid; triggers tactile feedback and state clearing upon submission.

### 5.2 Processing Pipeline (`/analyze/processing.tsx`)
- **Stage Progression:** Rotates honest, truthful milestone copy without fabricated percentage numbers:
  1. *Ingesting Reel media...* (Video frames, audio, caption metadata)
  2. *Analyzing location clues...* (Speech transcription, OCR text, visual landmarks)
  3. *Resolving geographic candidates...* (Candidate matching via Google Places)
  4. *Synthesizing travel intelligence...* (Seasonality, budget, nearby points of interest)
- **Elapsed Timer:** Real second counter informing the user of active progress.
- **Long-Running Reassurance:** Automatic explanatory notice rendered if processing exceeds 35 seconds.
- **Lifecycle Control:** AbortController integration allows the user to cancel analysis at any point and return to the input screen.
- **Concurrency Guard:** Mutex ref prevents accidental duplicate concurrent requests during retry attempts.

### 5.3 Results Dossier (`/analyze/results.tsx`)
- **Hero Imagery:** Visual card with scrim overlay, photo attribution, and photo counter badge.
- **Truthful Verification Badge:** Displays engine verification status:
  - `VERIFIED` (High confidence multimodal match)
  - `PARTIAL` (Consistent signals, partial visual confirmation)
  - `FAILED` / `SKIPPED` (Contextual match only; AI vision unverified)
- **Evidence Briefing:** Renders the AI rationale explaining *why* this place was identified, including Gemini vision notes when active.
- **Travel Intelligence Metrics:**
  - Optimal window & peak months
  - Daily estimated budget tier and currency
  - Recommended stay duration
  - Curated practical local tips
- **Segment Control:** Seamless toggle between *Overview & Briefing* and *Points of Interest*.
- **Source Reel Attribution:** Card linking directly to the original Instagram post.
- **Performance Telemetry:** Displays total backend resolution time in seconds.

### 5.4 Interactive Cartography (`/analyze/map.tsx` & `TravelMap.tsx`)
- **Native Canvas:** Powered by `react-native-maps` using Apple Maps (MapKit) on iOS and Google Play Maps on Android.
- **Pin Hierarchy:** Distinct visual styling for Primary Destination (dark star badge with selection halo) versus Nearby Highlights (minimalist dot pins).
- **Zero-Delta Coordinate Safety:** Automated bounding box calculation with single-point zero-delta detection to prevent native camera crashes.
- **Place Bottom Sheet (`PlaceBottomSheet.tsx`):** Gesture-driven bottom sheet supporting peek preview (thumbnail, rating, distance, quick directions) and expanded dossier view.
- **Direct Directions Launch:** One-tap handoff to external navigation applications.

### 5.5 Place Detail Inspection (`/place/[id].tsx`)
- **Inspection Dossier:** Dedicated modal displaying full location name, formatted address, category tags, rating, review count, and distance from primary destination.
- **Dual Resolution:** Resolves place data reactively from the active in-memory analysis store or falls back to offline saved storage, ensuring bookmarked places open seamlessly after app reload.
- **Action Suite:** Direct bookmark toggle, external directions trigger, and "View on Map" navigation.

### 5.6 Explore Feed (`/(tabs)/explore.tsx`)
- **Aggregated Discovery Stream:** Unifies the primary destination and surrounding highlights into a scannable feed.
- **Search Filtering:** Instant query filtering across landmark names, categories, and street addresses.
- **Category Chips:** Horizontal carousel of dynamically extracted categories (`All`, `Destinations`, `Attractions`, `Dining`, `Cafes`, `Hotels`) with live item counts.
- **Virtualized Rendering:** Built on `<FlatList>` with windowing and view recycling for 60fps scrolling performance.

### 5.7 Saved Locker (`/(tabs)/saved.tsx`)
- **Offline Persistence:** Permanent local storage powered by `@react-native-async-storage/async-storage`.
- **Category Segmentation:** Fast category filtering across user-saved places.
- **Instant Unsave:** Optimistic bookmark removal with haptic confirmation.
- **Empty States:** Clear empty locker and empty filter notices with direct navigation back to Analyze.

### 5.8 Profile & Diagnostics (`/(tabs)/profile.tsx`)
- **Navigation Preferences:** User toggle for preferred directions app (Apple Maps vs Google Maps).
- **System Health Diagnostics:** Direct health check probe to the FastAPI engine (`/health`), verifying Places service readiness, Gemini vision readiness, and API base URL connectivity.
- **About Dossier:** Mobile client version (`1.0.0`), engine architecture version, and analysis timeout policy.

---

## 6. Product Principles

1. **Truthful Over Decorative:** Never display fake progress percentages, simulated AI thinking counters, or fabricated certainty metrics. If confidence is low or visual verification fails, state it clearly.
2. **Source-Backed Intelligence:** Every resolved place must trace back to real-world coordinates and verified directory records. No hallucinations.
3. **Ergonomic Native Thumb-Zone:** Core actions (Analyze, Search, Map selection, Bookmark, Directions) are positioned in the lower two-thirds of the screen for one-handed mobile usability.
4. **Editorial Visual Restraint:** Clean, warm canvas palette (`#F7F7F5`), monochromatic high-contrast text (`#111111`), subtle borders (`#E5E5E0`), and purposeful typography. No neon gradients or generic stock aesthetics.
5. **Separation of Concerns:** The mobile client is responsible for presentation, native interaction, cartography, and offline bookmarks; the Python engine is strictly responsible for scraping, extraction, OCR, transcription, and intelligence synthesis.
6. **Graceful Degradation:** The application must remain completely usable when optional backend fields (photos, ratings, tips, reviews) are absent or null.

---

## 7. Explicit Non-Goals (Out of Scope for MVP)

The following capabilities are deliberately **excluded** from the current MVP:
- **User Accounts & Authentication:** No login, OAuth, passwords, or personal profiles.
- **Cloud Database Synchronization:** Bookmarks remain local to the device; no remote database sync across multiple devices.
- **In-App Video Playback:** The app does not embed the Instagram video player or re-host video media.
- **In-App Turn-by-Turn Navigation:** Directions are handed off to native navigation apps (Apple Maps / Google Maps) rather than rendering turn-by-turn routing internally.
- **Itinerary Generator / Day Planners:** The app provides contextual intelligence and saved lists, not drag-and-drop itinerary builders.
- **Social & Collaborative Features:** No public feeds, friend lists, shared lockers, or comments.
- **Background Location & GPS Tracking:** The app does not request or track continuous user location.
- **Monetization & Bookings:** No affiliate ticket sales, hotel booking integrations, or payment gateways.

---

## 8. Technical Boundaries & System Architecture

### 8.1 Technology Stack

| Layer | Technologies | Responsibilities |
| :--- | :--- | :--- |
| **Mobile Client** | React Native, Expo (SDK 57), Expo Router, TypeScript | UI rendering, animations, user input, offline bookmarks, native maps |
| **Cartography** | `react-native-maps`, Apple MapKit, Google Maps URL schemes | Coordinate rendering, pin layout, external map handoff |
| **Offline Storage** | `@react-native-async-storage/async-storage` | Local JSON bookmark persistence with serialized write queue |
| **Backend Engine** | Python 3.11+, FastAPI, Pydantic, Uvicorn | Request routing, pipeline orchestration, JSON serialization |
| **Media Extraction** | yt-dlp, ProviderManager abstraction | Video downloading, audio separation, frame extraction |
| **Extraction AI** | OpenAI Whisper, Tesseract OCR | Speech-to-text transcription, video frame text extraction |
| **Places Directory** | Google Places API (New & Legacy), Geocoding | Coordinate verification, place details, nearby POI discovery |
| **Multimodal Vision** | Google Gemini 2.5 Flash | Visual landmark identification, verification scoring, travel synthesis |

### 8.2 Client-Server Separation of Responsibility

```text
CLIENT RESPONSIBILITY                  SERVER RESPONSIBILITY
──────────────────────                  ──────────────────────
• URL format validation                 • Instagram video extraction
• Pasteboard clipboard capture          • Audio transcription (Whisper)
• Request abort / cancellation          • On-screen OCR extraction
• 180s timeout budget control           • Location candidate generation
• Session state management              • Google Places verification
• Offline bookmark persistence          • Gemini multimodal confirmation
• Native cartography & gestures         • Seasonality & budget intelligence
• External maps application launch      • Photo proxy URL formatting
```

---

## 9. Reliability, Edge-Case & Performance Standards

### 9.1 Network & API Resilience
- **Extended Timeout Budget:** Client enforces a 180,000ms (3-minute) timeout budget to accommodate server-side video download, frame OCR, Whisper audio transcription, and Gemini analysis.
- **Network Error Classification:** Distinct, actionable user-facing messages for connection refused, gateway timeouts, 4xx client errors, 5xx engine errors, and aborted requests.
- **Request Mutex:** Processing screen uses an execution ref guard to prevent concurrent duplicate analysis requests during rapid retry attempts.
- **Session Cache Purging:** Active analysis results are purged upon initiating a new analysis or canceling, preventing stale state leakage across different Reel queries.

### 9.2 Data Defensiveness
- **Schema Safety:** Defensive guards (`Array.isArray`, null checks, finite number checks) on all backend fields (`photos`, `nearby_places`, `peak_months`, `ratings`). Missing data defaults to honest labels (*"Location unavailable"*, *"No rating"*, *"Point of Interest"*).
- **Coordinate Validation:** Geographic coordinates must parse to finite numbers within `[-90, 90]` latitude and `[-180, 180]` longitude. Null Island `(0, 0)` coordinates are rejected.

### 9.3 Persistence Resilience
- **Serialized Write Queue:** Local bookmark writes are chained through a sequential promise queue (`persistQueue = persistQueue.then(...)`) to prevent race conditions during rapid bookmark toggling.
- **Corrupted Storage Recovery:** Storage hydration validates JSON parsing and discards malformed entries without crashing the application.
- **Data Normalization:** Clamps stored ratings to `[0, 5]`, review counts to non-negative integers, and sanitizes strings.

### 9.4 Runtime & Memory Optimization
- **Virtualized Lists:** Explore and Saved feeds utilize `<FlatList>` with windowing (`initialNumToRender={6-8}`, `windowSize={5}`) to prevent unbounded view mounting.
- **Component Memoization:** `PlaceCard`, `ImageCard`, `PlaceBottomSheet`, and `LoadingState` are wrapped in `React.memo` to eliminate cascading re-renders.
- **Stable Object References:** Image URIs and map marker coordinate objects are memoized to eliminate native image and marker diffing overhead.
- **$O(1)$ Hash Lookups:** In-memory analysis store and saved storage maintain indexed maps (`Map<string, NearbyPlace>`, `Set<string>`) for instant constant-time lookups.

---

## 10. Production & Release Configuration

### 10.1 Application Identifiers
- **App Name:** `Travel AI`
- **Expo Slug:** `travel-ai`
- **URL Scheme:** `travelai://`
- **iOS Bundle Identifier:** `com.travelai.mobile`
- **Android Package Identifier:** `com.travelai.mobile`
- **Release Version:** `1.0.0`
- **iOS Build Number:** `1` (Auto-incremented on EAS build)
- **Android Version Code:** `1` (Auto-incremented on EAS build)

### 10.2 Native Permissions Policy
The application enforces a **zero-permission footprint** in its native manifest:
- No background GPS / fine location permission (`permissions: []` in `app.json`)
- No camera permission
- No microphone permission
- No contact list access
- No photo library access

### 10.3 Build Profiles (`eas.json`)
- **`development`:** Debug client with `expo-dev-client` embedded, pointing to local loopback.
- **`preview`:** Internal distribution build (`.apk` / ad-hoc `.ipa`) for real-device testing.
- **`production`:** Store-ready `.aab` (Android App Bundle) and `.ipa` (iOS Archive) with automated version incrementing.

### 10.4 Production Environment Requirements
- In production release builds (`__DEV__ = false`), silent loopback fallbacks (`localhost`, `10.0.2.2`) are strictly disabled.
- The application requires `EXPO_PUBLIC_API_URL` to be explicitly provided at build time pointing to a live, publicly accessible HTTPS FastAPI deployment.
- If `EXPO_PUBLIC_API_URL` is omitted, the client cleanly informs the user that the backend endpoint is unconfigured rather than attempting dead local connections.

---

## 11. Future Scope (Post-MVP Roadmap)

The following features represent potential V2 extensions once the core MVP has achieved real-world release stability:
1. **Native OS Share Sheet Extension:** Ingest Reels directly from the native Instagram "Share To..." sheet without manually copying and switching apps.
2. **Cloud Account Synchronization:** Optional cross-device sync of saved places via lightweight authenticated cloud accounts.
3. **Trip Day Planner:** Light clustering of saved bookmarks into simple multi-day travel routes.
4. **Offline City Dossier Downloads:** Ability to cache analyzed destination guides and nearby places locally for use during international flights.
5. **Curated Exploration Feed:** Community-aggregated discoveries organized by global region.

---

## 12. Product Acceptance Criteria (MVP Definition of Done)

For the Travel AI mobile MVP to be considered complete, the following criteria must be satisfied:

- [x] **Reel URL Ingestion:** Valid public Instagram Reel URLs are accepted, sanitized, and sent to `/analyze`.
- [x] **URL Rejection:** Invalid URLs, non-Reel links, empty strings, and whitespace are rejected with actionable error messages.
- [x] **Analysis Pipeline:** Analysis transitions through truthful progress stages with a functioning cancel trigger and elapsed second timer.
- [x] **Dossier Presentation:** Successful analysis renders the primary destination name, location hierarchy, hero photography, verification badge, and identification reason.
- [x] **Travel Intelligence:** Practical metrics (seasonality, budget tier, duration, local tips) display cleanly when provided by the backend.
- [x] **Surrounding Highlights:** Nearby places render as scannable cards with category tags, ratings, review counts, and distances.
- [x] **Interactive Cartography:** Destination and nearby points of interest render as interactive pins on a native map; tapping a pin summons the place bottom sheet.
- [x] **Navigation Handoff:** Tapping "Open in Maps" cleanly launches the destination in Apple Maps (iOS) or Google Maps (Android/Web).
- [x] **Place Detail Inspection:** Modal route `/place/[id]` displays complete place information and resolves data from both session memory and offline storage.
- [x] **Explore Surface:** Aggregates session discoveries with search filtering and category chip filtering using virtualized rendering.
- [x] **Saved Locker:** Toggling the bookmark icon immediately saves or removes places from local device storage without network dependency.
- [x] **Cold-Start Resilience:** Bookmarked places persist across app restarts and can be opened in Place Detail without an active analysis session.
- [x] **Defensive Degradation:** Null, missing, or malformed backend fields do not crash the application.
- [x] **Zero Permission Leakage:** Manifest specifies zero invasive permissions.
- [x] **Production Build Configuration:** `app.json` and `eas.json` are fully configured with canonical bundle identifiers and build profiles.
