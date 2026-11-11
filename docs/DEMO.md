# VAMO — In-App Demo & Showcase Guide

This guide details how to run the VAMO engine and mobile application, activate the **offline Demo Mode**, configure tunnels for live remote testing, and execute seamless showcase presentations.

---

## 1. Quick Start: Local Run Steps

### Step 1.1: Engine (FastAPI Backend)
If you wish to test live analysis with Gemini Vision and Open-Meteo enrichment:

```bash
# 1. Activate virtual environment
# Windows:
.\engine\.venv\Scripts\activate
# macOS/Linux:
source engine/.venv/bin/activate

# 2. Configure environment variables (ensure GEMINI_API_KEY is present)
# copy engine/.env.example to engine/.env if not already present

# 3. Start FastAPI server
cd engine
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Verify engine health at `http://localhost:8000/health`.

### Step 1.2: Mobile App (Expo & React Native)
```bash
# 1. Configure local mobile env
# Edit mobile/.env.local:
EXPO_PUBLIC_API_URL=http://localhost:8000

# 2. Start Expo dev server
npm --workspace mobile run start
# or from root:
npm run mobile
```
Press `a` for Android Emulator, `i` for iOS Simulator, or scan the Expo QR code with the Expo Go app on your physical device.

---

## 2. In-App Demo Mode (100% Offline Presentation)

The in-app **Demo Mode** allows presenting VAMO anywhere with **zero network connectivity** (e.g., stage presentations, investor pitches, flights in airplane mode).

### Activating Demo Mode
1. Open the VAMO mobile app.
2. Tap the **Profile** icon in the top right.
3. Scroll down to **Section E: ABOUT**.
4. **Tap the `Version 1.0.0` text 5 times** in rapid succession (within 2.5 seconds).
5. A success haptic triggers and a toast confirms:
   > *"Demo mode enabled · Airplane mode ready"*
6. A **Demo ready** panel immediately appears in Profile > About:
   - **Demo Mode**: ON (Isolated)
   - **3 Scenarios loaded**: Jeju, Rome, Kyoto
   - **Images present**: 3/3 Bundled WebP
   - **Offline status**: OK (0 network required)
7. A persistent, subtle **`[• Demo mode · Destination ▾]`** pill stays visible in the application header.

### Switching Scenarios (Explicit Chooser)
VAMO includes 3 golden pre-analyzed destination scenarios:
1. **Jeju Island, South Korea** (Volcanic Island & UNESCO World Heritage)
2. **Rome, Italy** (Ancient Imperial Capital & Colosseum)
3. **Kyoto, Japan** (Imperial Cultural Capital & Historic Monuments)

- **On Analyze (Home) tab**:
  - A dedicated row of **3 chips** (`[Jeju Island]`, `[Rome]`, `[Kyoto]`) appears directly below the input field.
  - Tapping any chip immediately triggers the ~6s Processing animation, loads that scenario's results into memory, and crossfades the background to that place's bundled photo.
- **Header Pill Chooser Sheet**:
  - Tapping the **`Demo mode`** header pill on any screen opens an explicit bottom sheet listing all 3 destinations with thumbnail previews, badges, and landmarks.
  - Selecting a scenario updates the analysis store, sets the active destination, crossfades the background, and if currently on **Results**, **Map**, or **Place Detail**, instantly re-routes to Results with scroll reset to top.

### Recording Mode (Clean Video Capture)
- Located in **Profile > Preferences** (visible *only* when Demo Mode is active).
- When turned **ON**:
  - Automatically activates `LogBox.ignoreAllLogs(true)` to suppress any dev warnings.
  - Hides developer utility buttons (**Photos** and **UI Sink** dev pills) from the header.
  - Suppresses non-critical warning toasts.
  - Maintains an honest, subtle **`Demo data`** label on Results to preserve authenticity.

### Analyzing in Demo Mode
1. Navigate to the **Analyze** (Home) tab.
2. Either tap one of the 3 destination chips or paste **any link** into the input field.
3. Tap **Analyze Destination**.
4. The app transitions to the authentic **Processing animation (~6s)**:
   - Displays a visible status pill: **`[• Demo data]`**
   - Seamlessly advances through the 4 real visual stages:
     - *0.0s – 1.5s*: Reel received & decoding frames
     - *1.5s – 3.2s*: Inspecting scenery & architecture
     - *3.2s – 4.8s*: Resolving destination & climate normals
     - *4.8s – 6.0s*: Building destination dossier
5. The full **Destination Dossier** opens with:
   - High-contrast hero photo from bundled offline assets
   - 5-line verified overview (Where, Size, Landmark, Recognition, Climate)
   - 4-season climate breakdown (temperature ranges & monthly rainfall normals)
   - 3-tier transparent daily budget (Budget, Mid-range, Comfortable) labeled *"model estimate"*
   - 5 surrounding POIs with coordinates and distances
   - Interactive **Map** (using OpenStreetMap raster tiles with `(c) OpenStreetMap contributors` attribution and no Google tiles) and **Place Detail** screens
   - Bookmark / Save button (persists locally without network calls)

### Strict Data Isolation
- Any destinations saved while Demo Mode is active are tagged with `__demo_mode__` and stored in local cache; they are **never uploaded to your Supabase cloud**.
- When Demo Mode is turned **OFF** (by tapping the version 5 times in Profile > About):
  - Real analyses and genuine bookmarks are restored.
  - Demo entries are automatically filtered out from Saved and History.
  - Real data is never mixed or polluted with demo fixtures.

---

## 3. Optional Tunnel Instructions (Live Remote Testing)

When presenting on a physical phone connected over mobile data or external Wi-Fi, you can expose the local engine via a secure tunnel without modifying router settings.

### Option A: Cloudflare Tunnel (Recommended — No Account Required)
```bash
# 1. Start tunnel to local port 8000
cloudflared tunnel --url http://127.0.0.1:8000

# 2. Copy the generated public URL, for example:
# https://random-name.trycloudflare.com

# 3. Update mobile/.env.local:
EXPO_PUBLIC_API_URL=https://random-name.trycloudflare.com
```
Restart the Expo development server to load the new URL.

### Option B: ngrok
```bash
# 1. Start ngrok HTTP tunnel
ngrok http 8000

# 2. Copy the Forwarding HTTPS URL:
# https://xxxx-xx-xx.ngrok-free.app

# 3. Update mobile/.env.local:
EXPO_PUBLIC_API_URL=https://xxxx-xx-xx.ngrok-free.app
```

---

## 4. Pre-Demo Checklist

Run through this checklist 5 minutes before handing the device to a tester or presenting on stage:

- [ ] **1. Clear Clipboard**: Clear junk or stack traces from your clipboard. Optionally pre-copy a sample Instagram reel link so tapping paste works immediately.
- [ ] **2. Airplane Mode Test**: 
  - Turn ON Airplane Mode (disconnect Wi-Fi & Cellular).
  - Activate Demo Mode (Profile > About > tap Version 5x).
  - Verify that `OfflineGuard` does not block the screen and that all 3 scenarios load with bundled photos.
- [ ] **3. Battery Check**: Ensure device battery is above **80%** (avoids Low Power Mode throttling screen brightness or animations).
- [ ] **4. Fixed Brightness**: Lock display brightness to **~80%** with Auto-Brightness disabled for optimal contrast of the dark atmosphere.
- [ ] **5. Do Not Disturb**: Turn ON **Do Not Disturb** to prevent incoming phone calls, WhatsApp messages, or push notification banners from interrupting the demo.
- [ ] **6. Screen Recording**: If capturing a showcase video, enable the iOS/Android built-in screen recorder and verify mic audio is muted.

---

## 5. Demo Mode Data Sources & Verification Audit

All demo mode scenarios are strictly backed by live data fetched via `scripts/build-demo-data.ts` and stored in `mobile/lib/fixtures/demo-scenarios.json`. No numbers or coordinates are hand-typed. Anything not returned by an authoritative API is marked `null` and hidden.

| Destination | Field / Fact | Value | Authoritative Source API / Authority | Fetch Timestamp | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Jeju Island** | Coordinates | `33.3803° N, 126.5483° E` | OpenStreetMap Nominatim (OSM Node 9740744) | 2026-10-31 19:12 UTC | **Verified (OSM)** |
| **Jeju Island** | Area | `1,848 km²` | Wikidata (Q29151, Property P2046) | 2026-10-31 19:12 UTC | **Verified (Wikidata)** |
| **Jeju Island** | Elevation / Peak | `Hallasan (1,947 m)` | Wikidata (Q29151 P610 & Q494645 P2044) | 2026-10-31 19:12 UTC | **Verified (Wikidata)** |
| **Jeju Island** | Heritage Status | `UNESCO World Heritage (2007)` | Wikidata (Q495733, Property P1435 + P580) | 2026-10-31 19:12 UTC | **Verified (Wikidata)** |
| **Jeju Island** | Monthly Climate | 4 Seasons temp & rain | Open-Meteo Historical Archive (2021–2025) | 2026-10-31 19:12 UTC | **Verified (Open-Meteo)** |
| **Jeju Island** | 5 Surrounding POIs | Coordinates & distances | OpenStreetMap Nominatim (1 req/s) | 2026-10-31 19:12 UTC | **Verified (OSM)** |
| **Jeju Island** | Daily Budget | $36 / $94 / $207 (KRW/USD/INR) | World Bank ICP Price Level Ratio (KRW ~0.72) | N/A | **Model Estimate** |
| **Jeju Island** | User Ratings | Hidden (`null`) | None (no free authority) | N/A | **Omitted / Hidden** |
| **Rome** | Coordinates | `41.8933° N, 12.4829° E` | OpenStreetMap Nominatim (OSM Node 41485) | 2026-10-31 19:12 UTC | **Verified (OSM)** |
| **Rome** | Area | `1,287.4 km²` | Wikidata (Q220, Property P2046) | 2026-10-31 19:12 UTC | **Verified (Wikidata)** |
| **Rome** | Elevation | `21 m` | Wikidata (Q220, Property P2044) | 2026-10-31 19:12 UTC | **Verified (Wikidata)** |
| **Rome** | Heritage Status | `UNESCO World Heritage (1980)` | Wikidata (Q18448486, Property P1435 + P580) | 2026-10-31 19:12 UTC | **Verified (Wikidata)** |
| **Rome** | Monthly Climate | 4 Seasons temp & rain | Open-Meteo Historical Archive (2021–2025) | 2026-10-31 19:12 UTC | **Verified (Open-Meteo)** |
| **Rome** | 5 Surrounding POIs | Coordinates & distances | OpenStreetMap Nominatim (1 req/s) | 2026-10-31 19:12 UTC | **Verified (OSM)** |
| **Rome** | Daily Budget | $44 / $114 / $246 (EUR/USD/INR) | World Bank ICP Price Level Ratio (IT ~0.88) | N/A | **Model Estimate** |
| **Rome** | User Ratings | Hidden (`null`) | None (no free authority) | N/A | **Omitted / Hidden** |
| **Kyoto** | Coordinates | `35.0116° N, 135.7681° E` | OpenStreetMap Nominatim (OSM Node 357794) | 2026-10-31 19:12 UTC | **Verified (OSM)** |
| **Kyoto** | Area | `827.8 km²` | Wikidata (Q34600, Property P2046) | 2026-10-31 19:12 UTC | **Verified (Wikidata)** |
| **Kyoto** | Elevation / Peak | `Mount Minako (972 m)` | Wikidata (Q34600 P610 & Q11580925 P2044) | 2026-10-31 19:12 UTC | **Verified (Wikidata)** |
| **Kyoto** | Heritage Status | `UNESCO World Heritage (1994)` | Wikidata (Q874027, Property P1435 + P580) | 2026-10-31 19:12 UTC | **Verified (Wikidata)** |
| **Kyoto** | Monthly Climate | 4 Seasons temp & rain | Open-Meteo Historical Archive (2021–2025) | 2026-10-31 19:12 UTC | **Verified (Open-Meteo)** |
| **Kyoto** | 5 Surrounding POIs | Coordinates & distances | OpenStreetMap Nominatim (1 req/s) | 2026-10-31 19:12 UTC | **Verified (OSM)** |
| **Kyoto** | Daily Budget | $39 / $101 / $218 (JPY/USD/INR) | World Bank ICP Price Level Ratio (JP ~0.78) | N/A | **Model Estimate** |
| **Kyoto** | User Ratings | Hidden (`null`) | None (no free authority) | N/A | **Omitted / Hidden** |

### Bundled Photographic Assets
- **Jeju Island**: `mobile/assets/backgrounds/jeju_island.webp` — Authentic photo from `homepage img/Jeju Island.jpg` showing the staircase descending down Seongsan Ilchulbong toward the black sand cove. Zero Wikimedia attribution.
- **Rome**: `mobile/assets/backgrounds/rome_colosseum.webp` — Authentic photo from `homepage img/ROME.jpg` showing the Colosseum arcade in golden afternoon sunlight. Zero Wikimedia attribution.
- **Kyoto**: `mobile/assets/backgrounds/cherry_blossom_pagoda.webp` — Authentic photo from `homepage img/download (8).jpg` showing Kiyomizu-dera's three-story pagoda among cherry blossoms overlooking Kyoto Tower at sunset. Zero Wikimedia attribution.

### Automated Integrity Audit
To programmatically verify all 3 scenarios against honesty and integrity constraints:
```bash
npx tsx scripts/verify-demo-scenarios.ts
```
Audit output:
```text
| Destination | Photo Match | Zero Ratings | Zero Photo Credit | Overview >= 3 | Window + Reason | Budget Estimate | Zero Forbidden | Status |
|-------------|-------------|--------------|-------------------|---------------|-----------------|-----------------|----------------|--------|
| Jeju Island | PASS (Exists)| PASS (null)  | PASS (0)          | PASS (5 lines)| PASS            | PASS (model est)| PASS (0)       | PASS   |
| Rome        | PASS (Exists)| PASS (null)  | PASS (0)          | PASS (5 lines)| PASS            | PASS (model est)| PASS (0)       | PASS   |
| Kyoto       | PASS (Exists)| PASS (null)  | PASS (0)          | PASS (5 lines)| PASS            | PASS (model est)| PASS (0)       | PASS   |
```



