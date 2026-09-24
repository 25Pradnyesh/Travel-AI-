# Travel AI — Mobile Client

> Native iOS & Android application for Travel AI, translating social media travel content into verified real-world destinations and interactive cartography.

---

## 1. Purpose

The Travel AI mobile client is the primary native interface for travelers. It implements the core product loop:

```text
Analyze (Reel URL) → Process (Multimodal) → Discover (Dossier) → Explore (Map/Places) → Save (Locker)
```

This application connects directly to the existing FastAPI Travel AI engine without reinventing the backend contract, maintaining full compatibility with the existing Python intelligence layer.

---

## 2. Tech Stack

- **Framework:** React Native + Expo (SDK 57)
- **Routing:** Expo Router (File-based navigation)
- **Language:** TypeScript (Strict mode)
- **Safe Area & Ergonomics:** `react-native-safe-area-context`
- **Gestures & Animations:** `react-native-gesture-handler`, `react-native-reanimated`
- **Native Icons & Clipboard:** `@expo/vector-icons`, `expo-clipboard`

---

## 3. Project Structure

```text
mobile/
├── app/                      # Expo Router navigation routes
│   ├── _layout.tsx           # Root stack layout (Safe Area & Navigation)
│   ├── (tabs)/               # Bottom tab navigation shell
│   │   ├── _layout.tsx       # Custom BottomTabBar registration
│   │   ├── index.tsx         # 01 — Analyze (Primary product surface)
│   │   ├── explore.tsx       # 08 — Explore (Discovery placeholder)
│   │   ├── saved.tsx         # 09 — Saved (Travel locker placeholder)
│   │   └── profile.tsx       # 10 — Profile (Preferences & diagnostics)
│   ├── analyze/
│   │   ├── processing.tsx    # 02 — Processing (Real API integration & truthful states)
│   │   └── results.tsx       # 03 — Results (Real destination dossier & places)
│   └── place/
│       └── [id].tsx          # 06 — Place Detail (Real place inspection)
│
├── components/               # Production-grade design system components
│   ├── ui/
│   │   ├── Button.tsx        # Primary, secondary, outline, ghost buttons
│   │   ├── IconButton.tsx    # Square/circular 44x44pt touch target buttons
│   │   ├── URLInput.tsx      # Instagram Reel input with paste & clear
│   │   ├── SearchBar.tsx     # Clean query input with clear trigger
│   │   ├── Chip.tsx          # Category filter pill with item counts
│   │   ├── Badge.tsx         # Status & category pills
│   │   ├── ConfidenceBadge.tsx # Truthful verification tier indicators
│   │   ├── PlaceCard.tsx     # Scannable POI card with distance & rating
│   │   ├── ImageCard.tsx     # Hero photography card with scrim overlay
│   │   ├── StatCard.tsx      # Travel briefing metric container
│   │   ├── SectionHeader.tsx # Editorial section headline with eyebrow
│   │   ├── TopBar.tsx        # Screen header with safe-area spacing
│   │   ├── BottomTabBar.tsx  # Ergonomic 4-tab thumb navigation
│   │   ├── LoadingState.tsx  # Honest pipeline stage spinner
│   │   ├── EmptyState.tsx    # Minimalist empty state container
│   │   ├── ErrorState.tsx    # Error recovery & retry presentation
│   │   └── Toast.tsx         # Transient floating feedback notice
│   └── index.ts
│
├── constants/
│   ├── config.ts             # Centralized API base URL & timeout configuration
│   ├── theme.ts              # Centralized colors, spacing, typography, radii
│   └── index.ts
│
├── hooks/
│   ├── useTheme.ts           # Access design system tokens
│   └── index.ts
│
├── lib/
│   ├── api/
│   │   ├── client.ts         # Typed HTTP client with 180s timeout budget
│   │   ├── travel-ai.ts      # Travel AI service (analyzeReel, checkHealth)
│   │   └── analysis-store.ts # In-memory store for active analysis results
│   ├── utils.ts              # Reel URL validation, coordinate formatting
│   └── index.ts
│
├── types/
│   ├── analysis.ts           # Exact backend schema types (BestGuess, NearbyPlace, etc.)
│   ├── navigation.ts         # Route parameter definitions
│   ├── theme.ts              # Token types & verification statuses
│   └── index.ts
│
├── assets/                   # App icons, splash screens, vector assets
├── app.json                  # Expo project manifest
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration with @/* alias
```

---

## 4. API Configuration & Environment Setup

All API connection settings are centralized in `constants/config.ts`. The API URL is never hardcoded inside visual components.

### Setting the Backend URL

Configure via environment variable in `mobile/.env` or shell:

```bash
# Example for local development
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
```

### Platform Networking Behavior

| Target Environment | Default API Base URL | Critical Note |
| :--- | :--- | :--- |
| **iOS Simulator** | `http://localhost:8000` | Shares localhost with host Mac. |
| **Android Emulator** | `http://10.0.2.2:8000` | Android emulators map `10.0.2.2` to the host machine's loopback interface. Automatically handled by `config.ts`. |
| **Physical Phone (iOS/Android)** | `http://<YOUR-LAN-IP>:8000` | **IMPORTANT:** A physical phone cannot access `127.0.0.1` or `localhost` on your computer. You must set `EXPO_PUBLIC_API_URL=http://<MACHINE_IP>:8000` and ensure your phone and computer are on the same Wi-Fi network. |
| **Web Preview** | `http://localhost:8000` | Standard browser loopback. |

### API Security & Secrets
The mobile client never contains backend API keys (`GOOGLE_PLACES_API_KEY`, `GEMINI_API_KEY`, etc.). All third-party services are accessed exclusively via the FastAPI engine proxy.

---

## 5. End-to-End Analysis Flow

```text
[Analyze Screen]
       │
       ▼ (User pastes public Instagram Reel)
[Validate Format]
       │
       ▼ (Valid URL pattern detected)
[Processing Screen] ──► [POST /analyze] ──► [FastAPI Engine]
       │                                           │
  (Honest Stages)                             (180s Window)
       │                                           │
       ▼                                           ▼
[Handle Response] ◄─────────────────────── [AnalysisResponse]
       │
  ┌────┴──────────────────────────┐
  ▼                               ▼
[Success]                  [Application Failure]
(best_guess resolved)      (success: false / error detail)
  │                               │
  ▼                               ▼
[Results Screen]           [Error State with Retry]
  • Hero photography card
  • Truthful verification badge
  • Seasonality & budget briefing
  • Surrounding POI cards (PlaceCard)
  • Source Reel attribution
  • External maps launch
```

### Truthful Verification Hierarchy

The mobile UI maps backend verification levels directly:

* **`VERIFIED`** → **Verified Match** (Forest Green badge, confirmed multimodal evidence).
* **`PARTIAL`** → **Partially Verified** (Amber badge, consistent signals, partial confirmation).
* **`FAILED`** → **Location Identified · AI Unverified** (Slate badge, identified via context and Places, AI visual confirmation unavailable).
* **`SKIPPED`** → **Algorithmic Placement** (Muted badge, top scoring candidate ranking).

---

## 6. Timeout & Error Handling

- **180-Second Timeout Budget:** Video ingestion, frame OCR, Whisper audio transcription, and Gemini landmark verification can take up to 60–90 seconds during heavy processing. The mobile client allocates a full 180s budget in `client.ts` before triggering a timeout error.
- **Application Failures (`HTTP 200` + `success: false`):** The backend returns 200 OK with `success: false` when a Reel lacks geographic clues. The mobile client treats this as an application failure, displaying an informative "Destination Unresolved" screen with tips and retry options.
- **Network Failures:** If the engine is offline, the client displays a clear error indicating the target base URL and offers one-tap retry.

---

## 7. Development Commands

From the `mobile/` directory:

```bash
# Start Expo development server
npm start

# Run TypeScript compilation check
npx tsc --noEmit

# Run Expo doctor diagnostics
npx expo-doctor
```
