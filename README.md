<div align="center">

# Travel AI

### AI-powered travel discovery from Instagram Reels.

Turn short-form travel video inspiration into verified real-world destinations, interactive cartography, and offline bookmarks.

<br />

[![React Native](https://img.shields.io/badge/React%20Native-0.86-18181B?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK%2057-18181B?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-18181B?style=for-the-badge&logo=typescript&logoColor=3178C6)](https://www.typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-18181B?style=for-the-badge&logo=fastapi&logoColor=009688)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11+-18181B?style=for-the-badge&logo=python&logoColor=3776AB)](https://www.python.org)
[![Google Places](https://img.shields.io/badge/Google%20Places-API-18181B?style=for-the-badge&logo=googlemaps&logoColor=EA4335)](https://developers.google.com/maps)
[![Google Gemini](https://img.shields.io/badge/Gemini%202.5-Flash%20Vision-18181B?style=for-the-badge&logo=googlegemini&logoColor=8E75B2)](https://ai.google.dev)

</div>

---

## What is Travel AI?

Travelers discover extraordinary destinations through short-form social video every day: a secluded cove in Mallorca, a cliffside cafe in Amalfi, or an alpine refuge in the Dolomites. However, these videos are geographically opaque: creators omit coordinates, location tags are vague, and audio tracks rarely provide standardized addresses.

**Travel AI bridges social media inspiration and real-world travel.**

The primary product is a native mobile application (**React Native · Expo SDK 57 · TypeScript**) backed by a multimodal Python intelligence engine (**FastAPI**). The system reverse-engineers public Instagram Reels by extracting audio speech, on-screen text (OCR), video frames, and caption clues, resolving candidates against the Google Places directory, verifying visual landmark features using Google Gemini, and presenting actionable travel dossiers on an interactive native map.

---

## What Travel AI Does

```text
1. Paste an Instagram Reel URL
      ↓
2. Travel AI analyzes the Reel
      ↓
3. Extracts location evidence (Whisper audio, OCR frames, caption entities)
      ↓
4. Resolves the destination (Google Places candidate matching & ranking)
      ↓
5. Verifies and enriches the result (Gemini multimodal vision verification)
      ↓
6. Shows travel intelligence (Seasonality, budget tier, recommended duration, tips)
      ↓
7. Finds nearby places (Clustered attractions, dining, cafes, hotels)
      ↓
8. Displays them on an interactive map (Native cartography with bottom sheet preview)
      ↓
9. Lets the user save places (Resilient offline travel locker)
```

---

## Product Flow

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

---

## Current Features

* **Instagram Reel Analysis:** Client-side URL validation, protocol normalization, and clipboard auto-detection for public Reels.
* **Evidence-Based Identification:** Multimodal extraction combining OpenAI Whisper speech transcription, frame OCR text extraction, and caption entity mining.
* **Destination Verification:** Truthful verification tiers (`VERIFIED`, `PARTIAL`, `SKIPPED`) backed by Google Gemini 2.5 Flash multimodal vision.
* **Travel Intelligence:** Practical metrics including optimal visit season, daily budget tier, recommended stay duration, and curated local guidance tips.
* **Nearby Places Discovery:** Automatically clusters surrounding points of interest categorized into Attractions, Dining, Cafes, and Hotels with ratings and distances.
* **Interactive Cartography:** Native map canvas powered by `react-native-maps` featuring custom markers, zero-delta camera protection, and gesture-driven place bottom sheets.
* **Place Detail Inspection:** Dedicated inspection modal (`/place/[id]`) with dual resolution across active session memory and offline storage.
* **Explore Surface:** Aggregated discovery feed with real-time search filtering, dynamic category chips, and virtualized `<FlatList>` rendering.
* **Saved Places Locker:** Offline bookmarking backed by `@react-native-async-storage/async-storage` with optimistic bookmark removal.
* **Local Persistence Resilience:** Serialized asynchronous write queue (`persistQueue`) preventing race conditions and corrupted storage recovery.
* **Production-Safe API Configuration:** Centralized environment configuration with strict loopback isolation guards in production release builds.
* **Native Mobile Ergonomics:** Single-thumb mobile layout, platform-aware external navigation handoffs (Apple Maps vs. Google Maps), and native tactile haptics.

---

## Mobile Application

The native mobile client in `mobile/` is the primary application surface for Travel AI.

### Navigation Architecture

The mobile app implements a persistent 4-tab thumb navigation shell combined with focused stack and modal screens:

```text
Travel AI App Shell
├── Tabs (Bottom Navigation)
│   ├── Analyze    — Reel URL input, clipboard detection, pipeline trigger
│   ├── Explore    — Aggregated discoveries feed with search & category filtering
│   ├── Saved      — Resilient offline travel locker with instant bookmark access
│   └── Profile    — Navigation preferences (Apple vs Google Maps), engine diagnostics
│
└── Stack & Modal Screens
    ├── /analyze/processing — Truthful multi-stage pipeline status & elapsed timer
    ├── /analyze/results    — Editorial destination dossier & travel intelligence
    ├── /analyze/map        — Full-screen interactive cartography canvas
    └── /place/[id]         — Place detail inspection modal
```

### Key Technologies
* **Framework:** React Native (`0.86.x`), Expo (SDK 57)
* **Routing:** Expo Router (`~57.0.x`, file-based typed routing)
* **Language:** TypeScript (`~6.0.x`, strict mode)
* **Cartography:** `react-native-maps` (`1.27.x`, Apple MapKit on iOS, Google Play Services on Android)
* **Storage:** `@react-native-async-storage/async-storage` (`2.2.x`)
* **Gestures & Motion:** `react-native-safe-area-context`, `react-native-gesture-handler`, `react-native-reanimated`
* **Device Capabilities:** `expo-clipboard`, `expo-haptics`, `expo-image`

For visual specifications and component tokens, see [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md).

---

## Architecture Overview

```text
Mobile App (React Native · Expo SDK 57)
        │
        ▼ HTTP REST (POST /analyze, GET /health)
FastAPI Backend (Python 3.11+)
        │
        ▼ Orchestration
Intelligence Pipeline (ProviderManager → Whisper → OCR → Google Places → Gemini Vision)
        │
        ▼ Upstream Services
External Providers (yt-dlp, Google Places API, Gemini 2.5 Flash)
```

The system strictly isolates responsibilities across architectural boundaries:
* **Mobile Client (`mobile/`):** Owns UI rendering, touch ergonomics, native cartography, and offline bookmark persistence. It holds **zero** third-party API credentials.
* **FastAPI Engine (`engine/`):** Manages video ingestion, media extraction, transcription, optical character recognition, places resolution, and multimodal verification.
* **External Services:** Google Places API and Gemini Vision are proxied exclusively through FastAPI.

For comprehensive technical specifications and dataflow models, see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and the interactive Archify specifications in [docs/architecture/](docs/architecture/).

---

## Repository Structure

```text
Travel-AI/
├── mobile/                  # React Native + Expo mobile application (primary client)
│   ├── app/                 # Expo Router navigation routes
│   │   ├── (tabs)/          # Persistent 4-tab bottom navigation shell
│   │   ├── analyze/         # Processing, results, and full-screen map screens
│   │   └── place/[id].tsx   # Place detail inspection modal
│   ├── components/          # Production UI & map components (buttons, badges, cards)
│   ├── constants/           # Design tokens (theme.ts) & API configuration (config.ts)
│   ├── lib/                 # HTTP client, analysis store, saved storage, maps handoff
│   ├── types/               # TypeScript interfaces mirroring backend schemas
│   ├── app.json             # Expo native manifest & application identifiers
│   ├── eas.json             # EAS cloud build profiles (development, preview, production)
│   └── package.json         # Mobile dependencies and npm scripts
│
├── web/                     # Next.js web application (desktop prototype)
│   ├── app/                 # App Router pages and API routes
│   ├── components/          # Web React components (destination, landing, analysis)
│   ├── lib/                 # Web client API and context utilities
│   ├── types/               # Web TypeScript definitions
│   ├── public/              # Static SVG and web icons
│   ├── next.config.ts       # Next.js compiler and build configuration
│   └── package.json         # Web dependencies and scripts
│
├── engine/                  # FastAPI intelligence engine & pipelines (backend service)
│   ├── app/                 # FastAPI application, API routes (/analyze, /health), pipelines
│   │   ├── api/             # HTTP route handlers
│   │   ├── pipelines/       # LocationPipeline execution controller
│   │   └── services/        # Google Places, Gemini verifier, OCR, Whisper services
│   ├── providers/           # Video metadata & extraction abstraction (ProviderManager)
│   ├── tests/               # Pytest automated test suites
│   └── requirements.txt     # Python dependencies
│
├── pipelines/               # Processing pipelines & pipeline prototypes
│   └── analysis_pipeline.py # Baseline location analysis pipeline
│
├── docs/                    # Authoritative engineering & product documentation
│   ├── PRD.md               # Product Requirements Document & MVP Acceptance Criteria
│   ├── AGENTS.md            # Operating guide for AI coding agents
│   ├── DESIGN_SYSTEM.md     # Authoritative Mobile Design System Specification
│   ├── ARCHITECTURE.md      # Core architecture overview
│   ├── SECURITY.md          # Security policy and secrets handling guide
│   ├── CODE_STYLE.md        # Coding standards and style guide
│   ├── DATABASE.md          # Data architecture and management guide
│   ├── API.md               # API & integration communication guide
│   ├── architecture/        # Source-grounded Archify architecture & dataflow specifications
│   └── mobile/              # Mobile UX roadmap and screen specifications
│
├── assets/                  # Project static assets
│   └── frames/              # Sample extraction video frames
│
├── .gitignore               # Repository-wide ignore rules
├── .env.example             # Template environment variables
├── LICENSE                  # Repository license
├── package.json             # Root monorepo workspace configuration
├── pnpm-workspace.yaml      # Monorepo workspace package definitions
└── README.md                # Public overview and developer entry point
```

---

## Local Development

### Prerequisites
* **Node.js**: 18.0 or newer
* **Python**: 3.11 or newer
* **Google Places API Key**: Required for candidate resolution and nearby highlights
* **Gemini API Key**: Required for multimodal verification

---

### 1. Backend Setup (FastAPI Engine)

1. Navigate to the `engine` directory and create a virtual environment:
   ```bash
   cd engine
   python -m venv .venv
   ```

2. Activate the virtual environment:
   * **Windows (PowerShell):**
     ```powershell
     .\.venv\Scripts\Activate.ps1
     ```
   * **macOS / Linux:**
     ```bash
     source .venv/bin/activate
     ```

3. Install Python dependencies:
   ```bash
   python -m pip install -r requirements.txt
   ```

4. Configure environment secrets in `engine/.env` (or root `.env`):
   ```env
   GOOGLE_PLACES_API_KEY=your_google_places_api_key
   GEMINI_API_KEY=your_gemini_api_key
   ```

5. Start the FastAPI engine from the repository root:
   ```bash
   python -m uvicorn engine.app.main:app --reload --port 8000
   ```
   * Engine runs at `http://127.0.0.1:8000`
   * Health status: `http://127.0.0.1:8000/health`
   * Interactive API docs: `http://127.0.0.1:8000/docs`

---

### 2. Mobile Setup (React Native + Expo)

1. Navigate to the `mobile` directory and install dependencies:
   ```bash
   cd mobile
   npm install
   ```

2. Configure environment settings in `mobile/.env` (optional in development):
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:8000
   ```
   *(Defaults to `http://localhost:8000` on iOS Simulator/Web and `http://10.0.2.2:8000` on Android Emulator).*

3. Start the Expo development server:
   ```bash
   npm start
   ```

4. Run on your desired target:
   * Press `i` to launch in the **iOS Simulator** (or `npm run ios`)
   * Press `a` to launch in the **Android Emulator** (or `npm run android`)
   * Press `w` to preview on the **Web** (or `npm run web`)

5. Validate mobile health and types:
   ```bash
   # Run TypeScript strict typecheck
   npx tsc --noEmit

   # Check Expo project configuration & dependencies
   npx expo-doctor
   ```

---

## Environment Configuration

API endpoints and credentials follow a strict separation of concerns:

| Variable | Scope | Target | Purpose |
| :--- | :--- | :--- | :--- |
| `EXPO_PUBLIC_API_URL` | Mobile (`mobile/.env`) | Client | Base URL pointing to the FastAPI engine. Required for production release builds. |
| `GOOGLE_PLACES_API_KEY` | Backend (`engine/.env`) | Server | Google Places API (New & Legacy) for location candidate resolution and nearby highlights. |
| `GEMINI_API_KEY` | Backend (`engine/.env`) | Server | Google Gemini API for multimodal vision verification and travel synthesis. |

> [!IMPORTANT]
> Third-party credentials (`GOOGLE_PLACES_API_KEY`, `GEMINI_API_KEY`) remain strictly server-side. The mobile application never owns or transmits third-party API keys.
>
> In production builds (`__DEV__ = false`), silent loopback fallbacks are disabled. You must provide an explicit HTTPS `EXPO_PUBLIC_API_URL` pointing to your hosted FastAPI deployment.

---

## Production Builds

The mobile application is configured for cloud compilation via **Expo Application Services (EAS)**:

* **Bundle Identifier (iOS):** `com.travelai.mobile`
* **Package Identifier (Android):** `com.travelai.mobile`
* **Configuration:** Centralized in [mobile/app.json](mobile/app.json) and [mobile/eas.json](mobile/eas.json)

### EAS Build Profiles (`mobile/eas.json`)

* **`development`:** Standalone debug build with Expo Dev Client embedded.
* **`preview`:** Internal distribution build (`.apk` / ad-hoc `.ipa`) for testing on physical devices.
* **`production`:** Store-ready `.aab` (Android App Bundle) and `.ipa` (iOS Archive) with automated version increments.

### Build Commands

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Trigger a preview build for physical device testing
eas build --profile preview --platform all

# Trigger production release artifacts
eas build --profile production --platform all
```

*Note: Production store releases require an active HTTPS FastAPI engine deployment and registered developer accounts with Apple and Google. The application is not yet published on the App Store or Google Play Store.*

---

## Documentation Map

Detailed engineering, architecture, and design specifications are maintained in dedicated reference documents:

* **[docs/PRD.md](docs/PRD.md):** Authoritative Product Requirements Document, core user journeys, technical boundaries, and MVP Definition of Done.
* **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md):** Core architecture overview and system flow documentation.
* **[docs/architecture/](docs/architecture/):** Source-grounded Archify architecture artifacts, interactive system topologies, and pipeline dataflow diagrams.
* **[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md):** Authoritative Mobile Design System, Swiss editorial styling, design tokens, typography, and component specifications.
* **[docs/AGENTS.md](docs/AGENTS.md):** Canonical operating guide, change-scope rules, security boundaries, and validation protocols for AI coding agents.
* **[docs/SECURITY.md](docs/SECURITY.md):** Authoritative security and secrets-handling guide.
* **[docs/CODE_STYLE.md](docs/CODE_STYLE.md):** Authoritative coding standards and maintainability guide.
* **[docs/DATABASE.md](docs/DATABASE.md):** Authoritative data architecture and storage management guide.
* **[docs/API.md](docs/API.md):** Authoritative API and integration communication guide.
* **[docs/mobile/](docs/mobile/):** Mobile UX roadmap ([mobile-ux-roadmap.md](docs/mobile/mobile-ux-roadmap.md)) and complete 10-screen specifications ([mobile-screen-spec.md](docs/mobile/mobile-screen-spec.md)).

---

## Development Principles

* **Source-Grounded Implementation:** Active source code and verified repository evidence are the ultimate ground truth.
* **Mobile-First Priority:** The React Native mobile client is the primary application surface for all user-facing product features.
* **Truthful System State:** No simulated AI progress percentages or fabricated thinking counters. Processing shows actual elapsed timers and rotating status milestones.
* **Zero Fabricated Data:** Locations must resolve to real geographic coordinates verified against the Google Places directory.
* **Server-Side Secrets:** Third-party credentials remain strictly isolated on the backend server.
* **Disciplined Design Tokens:** UI components strictly consume tokens from [mobile/constants/theme.ts](mobile/constants/theme.ts) without ad-hoc styling.
* **Minimal Change Surface:** Edits are focused, atomic, and verified before completion.
* **Architecture Before Abstraction:** Speculative microservices, databases, or state-management frameworks are rejected in favor of simple, working native patterns.

---

## Current Status

* **Mobile MVP Implementation:** Substantially complete across all 10 core screens (Analyze, Processing, Results, Map, Place Detail, Explore, Saved, Profile).
* **Native Configuration:** Expo manifest (`app.json`) and EAS profiles (`eas.json`) are configured with canonical bundle identifiers and zero-permission footprints.
* **Backend Intelligence Engine:** Fully functional FastAPI service with multimodal media ingestion, transcription, OCR, Places resolution, and Gemini vision verification.
* **Deployment Readiness:** Requires a publicly accessible HTTPS backend deployment before production store release. App Store and Google Play Store submissions are pending backend hosting and developer account credentials.

---

<div align="center">

**Travel AI** · *AI-native travel discovery from social media video.*

</div>
