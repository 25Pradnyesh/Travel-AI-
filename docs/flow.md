# VAMO — Application Execution Flows

This document details how user interactions, API events, navigation updates, and data mutations travel through the VAMO codebase. It provides an authoritative runtime map for engineering and code auditing.

---

## 1. App Startup and Initial Theme/Atmosphere Flow

```text
App Launch (native)
        │
        ▼
mobile/app/_layout.tsx (RootLayout)
        │
        ├─► SplashScreen.preventAutoHideAsync()
        ├─► useFonts() (Inter & Instrument Serif)
        │
        ▼
        ▼
SafeAreaProvider ──► NetworkProvider ──► AuthProvider
        │
        ▼
AtmosphereProvider (mobile/context/AtmosphereContext.tsx)
        │   Initializes with VAMO_DEFAULT_PRESET (#1A2D3A -> #0F1D26 -> #060C10)
        │   activePlace: null
        ▼
Stack Navigation (Expo Router)
        │
        ▼
mobile/app/(tabs)/index.tsx (AnalyzeScreen / Home)
        │
        ▼
AtmosphereBackground (mobile/components/ui/AtmosphereBackground.tsx)
        │   Consumes activePalette from AtmosphereContext
        │   Mounts BlurTargetView for Android blur resolution
        ▼
Rendered Canvas (Deep Onyx / Celestial Slate-Teal Atmosphere)
```

- **Entry point:** Application launch in native runtime (`expo-router/entry`).
- **Call sequence:**
  1. `SplashScreen.preventAutoHideAsync()` keeps native splash visible.
  2. `useFonts()` loads `Inter_400Regular`, `Inter_500Medium`, `Inter_600SemiBold`, `Inter_700Bold`, and `InstrumentSerif_400Regular`.
  3. `RootLayout` mounts provider tree (`SafeAreaProvider` $\rightarrow$ `NetworkProvider` $\rightarrow$ `AuthProvider` $\rightarrow$ `AtmosphereProvider`).
  4. Expo Router mounts `(tabs)/index.tsx`.
  5. `AtmosphereBackground` renders initial canvas.
- **Data passed:** None at cold start. `activePlace` is `null`.
- **State ownership:** `AtmosphereContext` (`activePlace: null`, `activePalette: VAMO_DEFAULT_PRESET`).
- **Rendering/output:** Initial baseline canvas rendered in `AtmosphereBackground`.
- **Failure paths:** Missing fonts halt rendering until hydrated. Missing Supabase credentials fallback gracefully to guest mode.
- **Files/functions changed in Stage D1:**
  * `mobile/app/_layout.tsx` (Add `AtmosphereProvider`).
  * `mobile/components/ui/AtmosphereBackground.tsx` (Remove `#A6DCF8` sky system, connect to `AtmosphereContext`, double-buffered 450ms crossfade).
- **Verification:** Unit tests and local cold start verification.

---

## 2. Reel Submission, Processing, and Results Flow

```text
User pastes Reel URL ──► Taps "Analyze"
        │
        ▼
mobile/app/(tabs)/index.tsx: handleAnalyze()
        │   Validates Instagram URL structure
        │   hapticFeedback.selection()
        ▼
router.push('/analyze/processing?url=...')
        │
        ▼
mobile/app/analyze/processing.tsx (ProcessingScreen)
        │   Mounts rotating radar & status telemetry
        │   Calls analyzeReel(url) (mobile/lib/api/travel-ai.ts)
        ▼
POST /analyze (mobile/lib/api/client.ts)
        │
        ▼
FastAPI Engine Response (AnalysisResponse)
        │
        ├─► analysisStore.setAnalysisResult(response, url) (mobile/lib/api/analysis-store.ts)
        ├─► saveAnalysisHistory(response, url) (mobile/lib/supabase/history.ts)
        ▼
router.replace('/analyze/results')
        │
        ▼
mobile/app/analyze/results.tsx (ResultsScreen)
        │   Resolves place palette (City/Country/Deterministic)
        │   AtmosphereContext.setActivePlace(best_guess)
        ▼
ResultHero + DestinationIdentity + DestinationBriefing + SurroundingPlacesSection
```

- **Entry point:** User taps primary "Analyze Reel" CTA in `mobile/app/(tabs)/index.tsx`.
- **Call sequence:**
  1. `handleAnalyze()` validates URL and navigates to `/analyze/processing`.
  2. `processing.tsx` initiates `analyzeReel()` via `apiClient`.
  3. Response payload received; stored synchronously in `analysisStore`.
  4. If user is authenticated, history is persisted in Supabase asynchronously.
  5. Navigates via `router.replace('/analyze/results')`.
  6. `results.tsx` computes `placeAtmosphereInput` and calls `AtmosphereContext.setActivePlace(best_guess)`.
- **Data passed:** `url` query param $\rightarrow$ `AnalysisResponse` (`best_guess`, `travel_intelligence`, `nearby_places`, `gemini`).
- **State ownership:** `analysisStore` holds active analysis. `AtmosphereContext` holds active place and resolved palette.
- **Rendering/output:** Full destination briefing and hero photograph rendered over destination's adaptive atmosphere.
- **Failure paths:** Invalid URL shows inline error toast. Engine or network failure redirects to `TravelOceanError` with retry CTA.
- **Files/functions changed in Stage D1:**
  * `mobile/app/analyze/processing.tsx` (Inherit active atmosphere).
  * `mobile/app/analyze/results.tsx` (Connect to `AtmosphereContext`, resolve place palette, pass to `AtmosphereBackground`).
- **Verification:** Mock reel analysis test running through results navigation.

---

## 3. Place Data Flowing into Destination Details

```text
User taps Nearby Place Card in Results / Explore
        │
        ▼
handleOpenPlace(place)
        │   hapticFeedback.light()
        ▼
router.push('/place/[id]?name=...')
        │
        ▼
mobile/app/place/[id].tsx (PlaceDetailScreen)
        │
        ├─► analysisStore.getPlaceById(id)
        └─► savedPlaces.find(p => p.id === id) (Fallback)
        │
        ▼
AtmosphereContext.setActivePlace(place)
        │   Resolves Place Palette immediately
        ▼
Rendered Place Dossier with Adaptive Atmosphere
```

- **Entry point:** Tapping a `PosterCard` in `SurroundingPlacesSection` or `ExploreScreen`.
- **Call sequence:**
  1. `handleOpenPlace(place)` navigates to `/place/[id]`.
  2. `PlaceDetailScreen` resolves place metadata from `analysisStore` in-memory index, falling back to persisted `savedPlaces`.
  3. Resolves and applies place palette immediately via `resolvePalette(placeAtmosphereInput)`.
  4. Updates global active place via `setActivePlace(placeAtmosphereInput)`.
- **Data passed:** `place_id`, `name`, `formatted_address`, `rating`, `photos`.
- **State ownership:** `analysisStore` / `savedPlaces` $\rightarrow$ `PlaceDetailScreen`.
- **Rendering/output:** Place details, photo gallery, action bar, external map directions.
- **Failure paths:** If ID is not found, renders `EmptyState` ("Place Not Found").
- **Files/functions changed in Stage D1:**
  * `mobile/app/place/[id].tsx` (Remove `atmosphereSky`, bind to place palette, sync `AtmosphereContext`).
- **Verification:** Navigation check opening nearby place from fixture.

---

## 4. Opening Saved Place or History Detail Flow

```text
User taps Saved Item or History Record in mobile/app/(tabs)/saved.tsx
        │
        ├──► Saved Place: router.push('/place/[id]')
        │
        └──► History Item: router.push('/history/[id]')
                │
                ▼
        mobile/app/history/[id].tsx (HistoryDetailScreen)
                │
                ▼
        getAnalysisDetail(id) (mobile/lib/supabase/history.ts)
                │
                ▼
        AtmosphereContext.setActivePlace({
          destination: detail.analysis.destination,
          country: detail.analysis.country
        })
                │
                ▼
        Renders ResultHero & Dossier under matching atmosphere
```

- **Entry point:** Saved tab item tap (`mobile/app/(tabs)/saved.tsx`).
- **Call sequence:**
  1. User selects item from "Saved Places" list or "History" list.
  2. For History: `getAnalysisDetail(id)` loads persisted dossier from Supabase PostgreSQL.
  3. `HistoryDetailScreen` sets `activePlace` based on persisted `destination` and `country`.
  4. Palette resolver matches curated city/country preset or deterministic fallback.
- **Data passed:** `AnalysisDetail` (`analysis`, `places`).
- **State ownership:** Supabase client cache and local React state.
- **Rendering/output:** Full historical intelligence dossier rendered in destination atmosphere.
- **Failure paths:** Network failure displays `ErrorState` with retry button.
- **Files/functions changed in Stage D1:**
  * `mobile/app/history/[id].tsx` (Set active atmosphere on load, bind to `placePalette`).
- **Verification:** Test loading mock history detail and checking palette resolution.

---

## 5. Navigation Focus and Active-Place Updates

```text
User navigates between Tabs ((tabs)/index, explore, saved)
        │
        ▼
Navigation Focus Event (useFocusEffect)
        │
        ▼
[Planned for D1] AtmosphereProvider Context Check
        │
        ├──► Detail Screen (Results, Place, History):
        │       Overrides & updates activePlace immediately
        │
        └──► General Tabs (Analyze, Explore, Saved, Profile):
                Inherits activePlace (does NOT reset to default unexpectedly)
        │
        ▼
Smooth 450ms Palette Crossfade (if palette changed)
```

- **Entry point:** Tab bar press or stack navigation pop/push.
- **Call sequence:**
  1. React Navigation emits focus event on target screen.
  2. General tabs retain the prevailing `activePlace` established by user activity.
  3. Detail screens update the active place on focus.
- **State ownership:** `AtmosphereContext`.
- **Rendering/output:** Seamless atmospheric background maintained across tabs.
- **Failure paths:** If no place was ever analyzed, default palette (`VAMO_DEFAULT_PRESET`) is displayed.
- **Files/functions changed in Stage D1:**
  * `mobile/context/AtmosphereContext.tsx` (*Planned for D1*).
  * `mobile/app/(tabs)/_layout.tsx`.
- **Verification:** Tab switching manual inspection and focus listener assertions.

---

## 6. Palette Resolution Pipeline (Five Tiers)

```text
Place Input { city, region, country, heroPhotoUrl, heroColors }
        │
        ▼
Tier 1: Extracted Photo Colors Available?
        ├─► YES: Return Extracted Palette (Lightness/Saturation Clamped)
        ▼ NO
Tier 2: Match Curated City Preset (e.g., 'Positano', 'Kyoto')?
        ├─► YES: Return Curated City Palette
        ▼ NO
Tier 3: Match Curated Country Preset (e.g., 'Italy', 'Japan')?
        ├─► YES: Return Curated Country Palette
        ▼ NO
Tier 4: Valid Real Country or City String Exists?
        ├─► YES: djb2 32-bit Hash ──► Clamped HSL ──► Return Deterministic Palette
        ▼ NO
Tier 5: Return VAMO System Default Palette (#1A2D3A -> #0F1D26 -> #060C10)
```

- **Entry point:** `resolvePalette(placeInput)` in `mobile/lib/atmosphere/palette-resolver.ts` (*Planned for D1*).
- **Call sequence:**
  1. Check Tier 1 interface for extracted swatches.
  2. Normalize `placeInput.city` (lowercase, trim, punctuation strip) against curated city table.
  3. Normalize `placeInput.country` against curated country table.
  4. If uncatalogued place string exists, hash string and generate deterministic clamped palette.
  5. Fall back to system default.
- **Data passed:** `PlaceInput` object.
- **State ownership:** Pure mathematical resolution pipeline.
- **Rendering/output:** `AtmospherePalette` (`top`, `mid`, `bottom`, `glow`).
- **Failure paths:** Null or empty strings fall straight through to system default.
- **Files/functions changed in Stage D1:**
  * `mobile/lib/atmosphere/palette-resolver.ts` (*Planned for D1*).
  * `mobile/lib/atmosphere/presets.ts` (*Planned for D1*).
  * `mobile/lib/atmosphere/deterministic.ts` (*Planned for D1*).
- **Verification:** Unit tests verifying all 5 tiers and fallback chains.

---

## 7. Palette Transitions and Reduced-Motion Behavior

```text
AtmosphereBackground detects new palette
        │
        ▼
AccessibilityInfo.isReduceMotionEnabled()
        │
        ├──► TRUE:
        │       Set active palette immediately (0ms, no animation)
        │
        └──► FALSE:
                Mount incoming LinearGradient layer on top (opacity = 0)
                Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true })
                On complete: Swap base layer & unmount top layer
```

- **Entry point:** `AtmosphereBackground` receiving changed palette stops.
- **Call sequence:**
  1. Compares incoming `[top, mid, bottom]` against currently rendered stops.
  2. Checks system reduced-motion setting.
  3. Executes 450ms hardware-accelerated opacity crossfade.
- **Data passed:** Color arrays `colors={[top, mid, bottom]}`.
- **State ownership:** Internal component animation value.
- **Rendering/output:** Double-buffered gradient transition.
- **Failure paths:** If interrupted by rapid navigation, cancels in-flight animation and snaps to newest palette.
- **Files/functions changed in Stage D1:**
  * `mobile/components/ui/AtmosphereBackground.tsx`.
- **Verification:** Verified in development preview under simulated motion settings.

---

## 8. Poster Card Palette Selection (No Photo Fallback)

```text
PosterCard rendering item
        │
        ▼
Does card have valid photo?
        │
        ├──► YES: Render Image (expo-image) with disk cache & scrim
        │
        └──► NO:
                Call resolvePalette({ name, address, category }) for THIS card
                Render LinearGradient with card's own resolved palette
                (Never uses global active-place palette)
```

- **Entry point:** `PosterCard` rendering in Explore feed or Surrounding Places.
- **Call sequence:**
  1. Card verifies `imageUrl && !imageError`.
  2. When no image is present, resolves a palette specifically derived from the card's place fields.
  3. Renders card's own gradient background.
- **Data passed:** Card's `title`, `subtitle`, `imageUrl`.
- **State ownership:** Component props.
- **Rendering/output:** Individual card gradient fallback with watermarked icon.
- **Failure paths:** Unknown place uses card-level deterministic fallback or VAMO default.
- **Files/functions changed in Stage D1:**
  * `mobile/components/ui/PosterCard.tsx` (Replace `Colors.atmosphereSky` with per-card palette).
- **Verification:** Kitchen sink and explore test scenarios with photo-less cards.

---

## 9. Loading, Error, Empty, and Offline States Flow

```text
Network Disconnect / API 500 / Zero Results
        │
        ▼
Screen State Evaluation
        │
        ├──► Offline: NetworkProvider broadcasts state -> OfflineGuard displays banner
        ├──► Loading: SkeletonShimmer / ProcessingIndicator over atmosphere
        ├──► Empty: EmptyState component with Ivory Mist typography
        └──► Error: ErrorState / TravelOceanError with retry CTA
        │
        ▼
Background Contrast Guarantee:
All text rendered in Ivory Mist (#FBF4E3) with >= 4.5:1 contrast against mid/bottom
```

- **Entry point:** Network drop or empty query in Explore/Results.
- **Call sequence:**
  1. Relevant state hook triggers (`useNetwork()`, query observer).
  2. Renders matching state component inside `AtmosphereBackground`.
  3. High-contrast typography ensures readability against any destination palette.
- **Data passed:** Error codes, retry callbacks.
- **State ownership:** Local screen state + `NetworkProvider`.
- **Rendering/output:** Consistent, accessible state presentation.
- **Failure paths:** User can tap "Retry" to re-execute failed request.
- **Files/functions changed in Stage D1:**
  * Verified screen legibility across all 16 designated surfaces.
- **Verification:** Scripted network offline tests and component rendering tests.

---

## 10. Development-Only Atmosphere Fixtures Flow

```text
User in __DEV__ opens /dev/atmosphere (via UI Sink or direct route)
        │
        ▼
mobile/app/dev/atmosphere.tsx (AtmosphereDevScreen)
        │
        ├─► Guard: if (!__DEV__) return null
        │
        ├─► Load 9 Fixtures (DEV_FIXTURES):
        │     1. Positano (City Preset)
        │     2. Kyoto (City Preset)
        │     3. Reykjavik (City Preset)
        │     4. Marrakech (City Preset)
        │     5. Phuket (City Preset)
        │     6. Oia (City Preset)
        │     7. Norway (Country-only Preset)
        │     8. Freedonia (Synthetic Unknown Country -> Deterministic Fallback)
        │     9. No place (VAMO System Default)
        │
        ├─► Load All 50 Presets Browser (CITY_PRESETS + COUNTRY_PRESETS)
        │
        ▼
Live WCAG Calculation: getRelativeLuminance() & getContrastRatio()
        │
        ▼
Interactive Preview with Swatches, Real-time Pass/Fail Badges, and Live UI Samples
```

- **Entry point:** `router.push('/dev/atmosphere')` in development builds.
- **Call sequence:**
  1. Screen asserts `__DEV__`.
  2. Mounts fixture switcher and preset browser.
  3. Calculates live WCAG 2.1 relative luminance and contrast ratios for selected fixture.
  4. Renders live interactive Racing Red CTA, destination pin, and typography.
- **Data passed:** `DEV_FIXTURES` fixture objects (synthetic data clearly labeled).
- **State ownership:** Local component state `activeFixtureId`.
- **Rendering/output:** Interactive test harness.
- **Failure paths:** Gated from release bundles.
- **Files/functions changed in Stage D1:**
  * `mobile/app/dev/atmosphere.tsx` (Created).
  * `mobile/app/_layout.tsx` (Registered stack screen).
  * `mobile/app/dev/kitchen-sink.tsx` (Added shortcut).
- **Verification:** TypeScript validation (`tsc --noEmit`), automated test script `validate-atmosphere-contrast.ts`.
