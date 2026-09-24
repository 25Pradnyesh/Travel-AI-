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
- **Cartography:** `react-native-maps` (MapKit on iOS, Google Play Services on Android)
- **Safe Area & Ergonomics:** `react-native-safe-area-context`
- **Gestures & Animations:** `react-native-gesture-handler`, `react-native-reanimated`
- **Native Icons & Clipboard:** `@expo/vector-icons`, `expo-clipboard`
- **Offline Storage:** `@react-native-async-storage/async-storage`

---

## 3. Project Structure

```text
mobile/
├── app/                      # Expo Router navigation routes
│   ├── _layout.tsx           # Root stack layout (Safe Area & Navigation)
│   ├── (tabs)/               # Bottom tab navigation shell
│   │   ├── _layout.tsx       # Custom BottomTabBar registration
│   │   ├── index.tsx         # 01 — Analyze (Primary product surface)
│   │   ├── explore.tsx       # 08 — Explore (Virtualized discoveries feed)
│   │   ├── saved.tsx         # 09 — Saved (Virtualized travel locker)
│   │   └── profile.tsx       # 10 — Profile (Preferences & diagnostics)
│   ├── analyze/
│   │   ├── processing.tsx    # 02 — Processing (Real API integration & truthful states)
│   │   ├── results.tsx       # 03 — Results (Real destination dossier & places)
│   │   └── map.tsx           # 04 — Interactive cartography & bottom sheet
│   └── place/
│       └── [id].tsx          # 06 — Place Detail (Real place inspection)
│
├── components/               # Production-grade design system components
│   ├── ui/                   # Buttons, Badges, PlaceCards, ImageCards, EmptyState, etc.
│   ├── map/                  # TravelMap and MapMarker components
│   └── index.ts
│
├── constants/
│   ├── config.ts             # Centralized API base URL, timeout & bundle identifiers
│   ├── theme.ts              # Design tokens (Colors, Typography, Spacing, Radius)
│   └── index.ts
│
├── lib/
│   ├── api/
│   │   ├── client.ts         # Typed HTTP client with 180s budget & abort controls
│   │   ├── travel-ai.ts      # Travel AI service layer (analyzeReel, checkHealth)
│   │   └── analysis-store.ts # In-memory indexed cache for active session lookups
│   ├── storage/
│   │   └── saved-places.ts   # Resilient offline persistence with write queue
│   ├── maps.ts               # Geographic coordinate validation & map handoffs
│   ├── haptics.ts            # Native tactile feedback wrapper
│   └── utils.ts              # Reel URL validation & unit formatters
│
├── types/                    # TypeScript interfaces matching FastAPI engine schemas
├── assets/                   # App icons, splash screens, vector assets
├── app.json                  # Expo production manifest & native metadata
├── eas.json                  # EAS Build profiles (development, preview, production)
├── package.json              # Dependencies and scripts
└── tsconfig.json             # TypeScript configuration with @/* alias
```

---

## 4. Application Identifiers & Versioning

| Property | Value | Notes |
| :--- | :--- | :--- |
| **App Name** | Travel AI | User-facing display name |
| **Slug** | `travel-ai` | Expo project identifier |
| **Scheme** | `travelai` | Deep-linking scheme |
| **App Version** | `1.0.0` | Initial production MVP release |
| **iOS Bundle Identifier** | `com.travelai.mobile` | Configured in `app.json` |
| **iOS Build Number** | `1` | Auto-incremented in EAS production profile |
| **Android Package** | `com.travelai.mobile` | Configured in `app.json` |
| **Android Version Code** | `1` | Auto-incremented in EAS production profile |

---

## 5. API Configuration & Environment Setup

All API connection settings are centralized in `constants/config.ts`. The API URL is never hardcoded inside visual components.

### Setting the Backend URL

Configure via environment variable in `mobile/.env` (see `mobile/.env.example`):

```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
```

### Environment Behavior (Development vs Production)

| Mode | Target | Default Behavior |
| :--- | :--- | :--- |
| **Development (`__DEV__ = true`)** | iOS Simulator / Web | Uses `EXPO_PUBLIC_API_URL` or defaults to `http://localhost:8000`. |
| **Development (`__DEV__ = true`)** | Android Emulator | Uses `EXPO_PUBLIC_API_URL` or defaults to `http://10.0.2.2:8000` (host loopback). |
| **Development (`__DEV__ = true`)** | Physical Phone (LAN) | Set `EXPO_PUBLIC_API_URL=http://<YOUR-LAN-IP>:8000` (phone & computer on same Wi-Fi). |
| **Production (`__DEV__ = false`)** | App Store / Play Store | **Requires** `EXPO_PUBLIC_API_URL` pointing to your hosted HTTPS backend. Does not fall back to localhost. |

### API Security & Client Secrets
The mobile client never contains backend API keys (`GOOGLE_PLACES_API_KEY`, `GEMINI_API_KEY`, `OPENWEATHER_API_KEY`). All third-party services are accessed exclusively via the FastAPI engine proxy.

---

## 6. End-to-End Analysis Flow

```text
[Analyze Screen]
       │
       ▼ (User pastes public Instagram Reel)
[Validate Format] (Client-side regex & scheme normalization)
       │
       ▼ (Valid URL pattern detected)
[Processing Screen] ──► [POST /analyze] ──► [FastAPI Engine]
       │                                           │
  (Honest Stages)                             (180s Budget)
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

---

## 7. EAS Build & Release Configuration

The project is configured for cloud builds via Expo Application Services (EAS).

### Prerequisites

```bash
npm install -g eas-cli
eas login
```

### Build Profiles (`mobile/eas.json`)

1. **Development Build:**
   ```bash
   eas build --profile development --platform ios
   eas build --profile development --platform android
   ```
   Generates a standalone debug client with Expo Dev Client embedded.

2. **Preview Build (Internal Ad-Hoc / TestFlight / Firebase):**
   ```bash
   eas build --profile preview --platform all
   ```
   Generates an internal distribution build for testing on physical devices before store submission.

3. **Production Release Build:**
   ```bash
   eas build --profile production --platform all
   ```
   Generates production `.ipa` (iOS) and `.aab` (Android App Bundle) artifacts ready for App Store and Google Play Store submission.
   *Note: Ensure `EXPO_PUBLIC_API_URL` is set in your EAS Environment Secrets for the production environment.*

---

## 8. Development & Diagnostic Commands

Run from the `mobile/` directory:

```bash
# Start Expo local dev server
npm start

# Run TypeScript strict typecheck
npx tsc --noEmit

# Run Expo project configuration & dependency check
npx expo-doctor

# Run ESLint
npm run lint
```
