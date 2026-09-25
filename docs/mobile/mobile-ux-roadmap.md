# TRAVEL AI — MOBILE APP UX ROADMAP & PRODUCT ARCHITECTURE

**Document Version:** 1.0.0  
**Target Platforms:** iOS & Android (React Native + Expo + TypeScript)  
**Status:** UX Foundation & Design-System Specification (Pre-Implementation)  
**Design Reference:** Travel AI Editorial Travel System  

---

## 1. Product Vision

Travel AI bridges the gap between passive social media inspiration and actionable, real-world exploration.

> **Core Value Proposition:**  
> *Instagram travel content → identify real-world places → explore them on interactive cartography → save them for real journeys.*

Social media travel content is visually captivating but geographically opaque. Creators showcase dramatic vistas, secluded dining spots, and historic architectural sites without providing exact geographic coordinates, structured context, or reliable transit details.

Travel AI solves this by transforming unindexed video content into structured, verified geographic intelligence. The mobile application is built from the ground up as a native mobile utility: fast, thumb-driven, truthful about AI confidence, and focused on cartographic clarity.

### Core Product Loop
```text
┌─────────────────────────────────────────────────────────────┐
│                        TRAVEL AI LOOP                       │
│                                                             │
│   ANALYZE ───► PROCESS ───► DISCOVER ───► EXPLORE ───► SAVE │
│    (Reel)     (Multimodal)  (Overview)    (Map/Places) (Local)
└─────────────────────────────────────────────────────────────┘
```

1. **Analyze:** Receive a public Instagram Reel URL (via in-app paste or native mobile Share Sheet extension).
2. **Process:** Execute multimodal analysis (audio transcript, OCR frame text, vision landmarks, Google Places ranking) with truthful pipeline status indicators.
3. **Discover:** Present the primary verified destination immediately with hero imagery, verification badge, and travel briefing.
4. **Explore:** Inspect clustered points of interest on a native exploration map and expand places via gesture-driven bottom sheets.
5. **Save:** Bookmark verified destinations and points of interest for future travel planning with one tap.

---

## 2. Mobile Information Architecture

The mobile application is organized into **four primary top-level surfaces** hosted inside a persistent, thumb-accessible bottom navigation bar:

```text
TRAVEL AI (Mobile App Shell)
│
├── 1. Analyze (Primary Anchor)
│   ├── Reel URL Input Surface
│   ├── Share Extension Receiver
│   ├── Processing Pipeline Status Screen
│   ├── Analysis Results Overview
│   │   ├── Destination Hero & Identity
│   │   ├── Verification Dossier & Evidence
│   │   ├── Travel Intelligence (Seasonality, Budget, Timing)
│   │   ├── Detected Places (Segment / Sheet)
│   │   ├── Exploration Map (Interactive Canvas)
│   │   └── Source Reel Metadata
│   └── Place Detail Modal / Sheet
│
├── 2. Explore (Discovery Surface)
│   ├── Featured Verified Destinations
│   ├── Category Highlights (Nature, Attractions, Dining, Culture)
│   └── Trending Places Resolved by Travel AI
│
├── 3. Saved (Travel Locker)
│   ├── Saved Places Feed
│   ├── Quick Filter by Category (Stay, Food, Nature, Must Visit)
│   ├── Direct Route / Maps Handoff
│   └── Offline-Ready Bookmarks
│
└── 4. Profile (Utility Surface)
    ├── App Preferences (Default Maps App: Apple vs. Google)
    ├── Analysis History & Cache Management
    ├── Engine Status & API Connection
    └── About / Version / Privacy
```

### Desktop Web to Native Mobile Surface Mapping

| Web Surface (Desktop Next.js) | Native Mobile Mapping | Mobile UX Transformation |
| :--- | :--- | :--- |
| **01. Landing Page / Hero** | **Analyze Entry Tab** | Removed long marketing scroll; replaced with focused input canvas, quick paste clipboard trigger, and recent analyses. |
| **02. Reel Input Bar** | **Analyze Input View** | Native keyboard management, paste button with clipboard auto-detection, and native Share Extension handoff. |
| **03. Processing Loader** | **Processing Screen** | Full-screen immersive pipeline card with honest animated phase progression and cancel option. |
| **04. Results Overview** | **Results Screen** | Vertical scrolling editorial layout with high-impact hero header, sticky segment tabs, and immediate destination clarification. |
| **05. Places List** | **Places Section / Bottom Sheet** | Thumb-scrollable cards with categorical filters, ratings, distance tags, and tap-to-inspect gestures. |
| **06. Map View (Desktop 420px)** | **Full Exploration Map** | Elevated from side widget to full-screen interactive mobile map with marker selection, gestures, and bottom-sheet preview. |
| **07. Place Detail Side Panel** | **Place Detail Bottom Sheet** | Converted from desktop 400px fixed slide-in to native multi-snap bottom sheet (35% preview → 90% expanded full detail). |
| **08. Source Reel Card** | **Source Section** | Compact native card with external deep link into Instagram app. |

---

## 3. Navigation Architecture

Travel AI utilizes a standard native navigation paradigm combining a **Bottom Tab Navigator** and a **Native Stack Navigator**.

```text
Root Stack Navigator
├── Main Tab Navigator
│   ├── AnalyzeTab (Stack)
│   │   ├── AnalyzeScreen (Root)
│   │   ├── ProcessingScreen (Modal / Push)
│   │   └── ResultsScreen (Push)
│   ├── ExploreTab (Stack)
│   │   └── ExploreScreen (Root)
│   ├── SavedTab (Stack)
│   │   └── SavedScreen (Root)
│   └── ProfileTab (Stack)
│       └── ProfileScreen (Root)
│
└── Modal Overlays (Root Presentation)
    ├── PlaceDetailSheet (Interactive Bottom Sheet / Detent Modal)
    ├── FullscreenMapModal (Expanded Cartographic Canvas)
    └── ErrorModal / RecoveryDialog
```

### Tab Bar Behavior
* **Persistent Visibility:** The Bottom Tab Bar remains visible on the four root screens (`Analyze`, `Explore`, `Saved`, `Profile`).
* **Auto-Hide on Deep Flows:** The Tab Bar smoothly slides off-screen when entering `ProcessingScreen` or `FullscreenMapModal` to maximize screen real estate.
* **Haptic Feedback:** Subtle selection haptic on tab switch (`selectionAsync` on iOS / light tick on Android).

---

## 4. Screen Inventory

| ID | Screen Name | Route Key | Shell Type | Core Role |
| :--- | :--- | :--- | :--- | :--- |
| **01** | **Analyze** | `analyze/index` | Tab Root | Input canvas for Reel URLs with clipboard auto-paste & quick action tips. |
| **02** | **Processing** | `analyze/processing` | Full Modal | Truthful pipeline status screen displaying multimodal ingestion & Places resolution. |
| **03** | **Results** | `analyze/results` | Stack Screen | Comprehensive destination dossier: hero, verification, intelligence, and places. |
| **04** | **Places** | `analyze/places` | Results Tab / Sheet | Categorized list of all detected nearby landmarks, attractions, and amenities. |
| **05** | **Map** | `analyze/map` | Integrated / Full Screen | Interactive native map displaying primary destination pin & secondary POI pins. |
| **06** | **Place Detail** | `place/detail` | Bottom Sheet / Modal | Rich place card: imagery, rating, coordinates, category, notes, and maps launch. |
| **07** | **Source Reel** | `analyze/source` | Embedded Section | Verified attribution card with deep link to original Instagram Reel. |
| **08** | **Explore** | `explore/index` | Tab Root | Curated editorial collection of trending destinations and places previously resolved. |
| **09** | **Saved** | `saved/index` | Tab Root | Persistent travel locker of bookmarked places with filter chips and offline cache. |
| **10** | **Profile** | `profile/index` | Tab Root | User preferences (default maps application, cache cleanup, API diagnostics). |

---

## 5. User Flows

### Flow 1: Primary In-App Analysis Flow
```text
[Launch App] ──► [Analyze Tab]
                       │
                       ▼
              [Tap Paste or Type URL]
                       │
                       ▼
               [Tap "Analyze"]
                       │
                       ▼
             [Processing Screen]
         (Truthful Multimodal Stages)
                       │
         ┌─────────────┴─────────────┐
         ▼                           ▼
  [Success: Results]          [Unresolved / Error]
         │                           │
  [Browse Overview]           [Actionable Guidance]
         │                           │
  [Tap Point of Interest]     [Try Another Reel]
         │
         ▼
  [Place Detail Sheet]
         │
         ▼
  [Save Place] or [Open Apple/Google Maps]
```

### Flow 2: System Share Sheet Integration (Native Ingestion)
```text
[User Browsing Instagram]
          │
          ▼
[User Taps Share on Reel]
          │
          ▼
[Selects "Travel AI" from Share Sheet]
          │
          ▼
[Travel AI Launches directly into Processing Screen]
          │
          ▼
[Results Screen Presented Immediately upon Resolution]
```

### Flow 3: Map-Driven Place Discovery
```text
[Results Screen] ──► [Tap "Map" Segment or Tap Map Preview]
                            │
                            ▼
              [Interactive Map Viewport Centers]
                            │
                            ▼
              [Tap Secondary Marker Pin]
                            │
                            ▼
           [Peek Sheet Appears (35% Screen Height)]
           (Name, Category, Distance, Star Rating)
                            │
                            ▼
           [Swipe Upwards to Full Sheet (90% Height)]
       (Full Address, Coordinates, Types, Maps Action, Save)
```

---

## 6. Design System

The visual language directly extends the **Travel AI editorial Swiss design system**, translated for touch-first mobile ergonomics. It balances clean typography, restrained monochromes, subtle border articulation, and generous negative space with image-led travel storytelling.

### 6.1 Color System

```text
/* ---- Surface Tokens ---- */
Surface Primary (Canvas):       #F7F7F5  (Warm Alabaster / Light Gray)
Surface Pure (Card / Sheet):     #FFFFFF  (Pure White)
Surface Elevated (Modals):      #FFFFFF  (Pure White with 0 8px 32px rgba(0,0,0,0.06))
Surface Dark (Primary Buttons): #111111  (Deep Obsidian)
Surface Dark Elevated:          #181818  (Charcoal Black)

/* ---- Text Tokens ---- */
Text Primary:                   #111111  (High-contrast dark)
Text Secondary:                 #666666  (Warm medium gray)
Text Muted / Caption:           #8A8A8A  (Subdued metadata gray)
Text Inverse:                   #F7F7F5  (Canvas light)

/* ---- Border & Divider Tokens ---- */
Border Subtle:                  #E5E5E2  (Crisp warm hairline border)
Border Focus / Active:          #111111  (High-contrast border)
Border Accent:                  #C2CBD3  (Muted slate highlight)

/* ---- Semantic & Verification Tokens ---- */
Status Success (Verified):      #2D6A4F  (Deep Forest Green)
Status Success Surface:         rgba(45, 106, 79, 0.08)
Status Warning (Partial):       #B5651D  (Warm Amber)
Status Warning Surface:         rgba(181, 101, 29, 0.08)
Status Error (Failed/Timeout):  #C1292E  (Muted Crimson)
Status Error Surface:           rgba(193, 41, 46, 0.06)
Status Info (Algorithmic):      #4A6FA5  (Cobalt Muted Blue)
```

### 6.2 Typography Hierarchy

Typeface: **Inter** (Primary Sans) complemented by **JetBrains Mono** or **GeistMono** (Metadata / Coordinate tokens).

| Token Name | Size | Line Height | Weight | Letter Spacing | Native Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Display** | 32 pt | 36 pt | Bold (700) | -0.03em | Primary Destination Hero Title |
| **H1** | 26 pt | 32 pt | Semibold (600) | -0.025em | Screen Headlines, Major Sections |
| **H2** | 20 pt | 26 pt | Semibold (600) | -0.02em | Section Titles, Card Headers |
| **H3** | 16 pt | 22 pt | Semibold (600) | -0.01em | Place Card Titles, Subsection Headers |
| **Body** | 15 pt | 22 pt | Regular (400) | 0.0em | Primary reading text, descriptions |
| **Body Small** | 13 pt | 18 pt | Regular (400) | +0.01em | Secondary subtitles, bullet points |
| **Caption** | 12 pt | 16 pt | Medium (500) | +0.02em | Supporting metadata, timestamps |
| **Label / Eyebrow**| 10 pt | 14 pt | Semibold (600) | +0.12em (ALL CAPS) | Categorical headers, verification badges |

### 6.3 Spacing System

All layout dimensions follow a strict 4pt geometric rhythm:

```text
Scale: 4  ·  8  ·  12  ·  16  ·  20  ·  24  ·  32  ·  40  ·  48  ·  64 pt
```

* **Micro Spacing (`4pt`, `8pt`):** Icon-to-text gaps, tag internal padding, badge spacing.
* **Component Padding (`12pt`, `16pt`, `20pt`):** Card padding, button padding, list item insets.
* **Screen Padding (`16pt` or `20pt`):** Universal left/right screen margin.
* **Section Margins (`24pt`, `32pt`, `40pt`):** Inter-section gaps on scrolling screens.
* **Modal Insets (`48pt`, `64pt`):** Top sheet clearances, bottom navigation bar breathing room.

---

## 7. Component Inventory

A unified set of mobile-native UI components:

```text
┌─────────────────────────────────────────────────────────────┐
│                 TRAVEL AI COMPONENT INVENTORY               │
│                                                             │
│  [Inputs]          [Buttons]           [Display Cards]      │
│  • URLInput        • Button (Primary)  • PlaceCard          │
│  • SearchBar       • Button (Outline)  • ImageHeroCard      │
│  • ChipSelector    • IconButton        • StatCard (Budget)  │
│                                                             │
│  [Navigation]      [Badges & Status]   [Sheets & Overlays]  │
│  • TopBar          • ConfidenceBadge   • BottomSheet        │
│  • BottomTabBar    • CategoryBadge     • Toast              │
│  • SegmentedBar    • VerificationPill  • MapMarkerPin       │
└─────────────────────────────────────────────────────────────┘
```

1. **TopBar:** Native header with back navigation chevron, screen title, and optional share/bookmark action.
2. **BottomTabBar:** 4-tab thumb navigation bar with active icon state and subtle indicator dot.
3. **URLInput:** Specialized text box with native paste button, clear `(X)` button, and URL schema validation styling.
4. **Button (Primary):** Solid black (`#111111`) fill, white text, 48pt minimum height, 12pt corner radius, active compression animation.
5. **Button (Secondary / Ghost):** White background, `#E5E5E2` hairline border, `#111111` text.
6. **IconButton:** Square or circular 44x44pt tap target for actions like Close, Back, Share, Save.
7. **ConfidenceBadge:** Compact pill displaying verification level (`VERIFIED`, `PARTIAL`, `AI UNVERIFIED`, `ALGORITHMIC`) with colored indicator dot.
8. **PlaceCard:** Compact horizontal card (photo left, metadata center, distance right) optimized for vertical list scanning.
9. **StatCard:** Compact metric container for Daily Budget, Peak Season, Recommended Stay Duration.
10. **BottomSheet:** Multi-detent gesture sheet (peek 35%, full 90%) with drag handle and spring physics.
11. **MapMarkerPin:** Custom vector marker (Primary: 24pt obsidian pin with white inner star; Secondary: 14pt gray dot with white border).
12. **Toast:** Transient floating status notice anchored above bottom navigation bar.

---

## 8. Interaction Patterns & Ergonomics

### 8.1 Thumb-Zone Optimization
All primary actions are situated in the ergonomic "natural thumb sweep" zone (bottom 40% of screen):
* "Analyze" CTA anchored to bottom keyboard accessory bar.
* Bottom navigation bar spans full bottom width with 48pt tap targets.
* Secondary actions (Map view toggle, Save button) placed within direct thumb reach.

### 8.2 Gesture System
* **Edge Swipe to Back (iOS):** Standard interactive pop transition.
* **System Back (Android):** Hardware back / predictive back gesture pops sheet or navigates back.
* **Pull to Dismiss:** Bottom sheets drag downwards with rubber-banding resistance.
* **Horizontal Flick:** Photo galleries on Place Detail support fast flick pagination with snap-to-center.
* **Pinch & Double-Tap:** Native gestures supported on Map viewport without interfering with parent scroll.

### 8.3 Safe Area & Edge-to-Edge Guardrails
* **iOS:** Strict observance of `SafeAreaView` top inset (Dynamic Island / notch) and bottom home indicator bar (34pt inset).
* **Android:** Full edge-to-edge rendering with transparent status bar and transparent 3-button or gesture navigation bar using `react-native-safe-area-context`.

---

## 9. Truthful Analysis States

The backend analysis pipeline is a multi-stage process that takes up to 30–60 seconds for complex multimodal processing. The mobile interface must **never simulate false percentage progress** (e.g., ticking 45% → 67% → 89%). Instead, the app renders **truthful, pipeline-accurate states**.

### 9.1 Analysis Pipeline Lifecycle

```text
[IDLE]
  │ (User taps Analyze)
  ▼
[SUBMITTED / DISPATCHED]
  │ (FastAPI proxy connects)
  ▼
[STAGE 1: INGESTION] ───────► "Fetching Reel media & caption metadata"
  │
  ▼
[STAGE 2: EXTRACTION] ──────► "Analyzing visual frames, OCR & speech audio"
  │
  ▼
[STAGE 3: RESOLUTION] ──────► "Matching coordinates via Google Places"
  │
  ▼
[STAGE 4: INTELLIGENCE] ────► "Synthesizing travel briefing & nearby highlights"
  │
  ▼
[OUTCOME STATES]
  ├── SUCCESS (High confidence destination matched)
  ├── PARTIAL (Resolved destination with partial AI evidence)
  ├── UNRESOLVED (No definitive geographic landmark detected)
  ├── TIMEOUT (Request exceeded 180s threshold)
  └── ERROR (Network failure / Inaccessible private Reel)
```

### 9.2 Verification Status Taxonomies

To prevent misleading travelers, results display explicit, standardized verification tiers matching the backend contract:

| Status Code | User-Facing Label | Visual Treatment | Meaning |
| :--- | :--- | :--- | :--- |
| `VERIFIED` | **Verified Destination** | Green badge (`#2D6A4F`), green dot | Confirmed through multimodal evidence and visual landmark cross-reference. |
| `PARTIAL` | **Partially Verified** | Amber badge (`#B5651D`), amber dot | Consistent with Reel signals; some secondary evidence unconfirmed. |
| `FAILED` | **Location Identified (AI Unverified)** | Slate badge (`#666666`), dark dot | Resolved via Reel context & Google Places data; AI vision verification was unavailable. |
| `SKIPPED` | **Algorithmic Placement** | Muted badge (`#8A8A8A`), muted dot | Top scoring candidate derived from geographic tokens and Places ranking. |

---

## 10. Results Architecture

The Results screen is the core product payoff. It presents the resolved destination with clean editorial pacing, avoiding viewport overload.

```text
┌─────────────────────────────────────────┐
│ [TopBar: Back / Share / Bookmark]      │
├─────────────────────────────────────────┤
│ 1. Hero Media Box                       │
│    • High-res primary photo             │
│    • Photo counter (e.g. 1/6)           │
│    • Verification status badge          │
│    • Destination Title & Country        │
├─────────────────────────────────────────┤
│ 2. Segmented Navigation Bar             │
│    [ Overview ] [ Places ] [ Map ]      │
├─────────────────────────────────────────┤
│ 3. Active Segment Viewport              │
│                                         │
│    (If "Overview"):                     │
│    • Identification Evidence Dossier    │
│    • Travel Intelligence Cards          │
│      - Best Season / Peak Months        │
│      - Daily Budget ($100-200 / day)    │
│      - Recommended Duration (3-5 days)  │
│    • Local Travel Tips & Packing        │
│    • Source Reel Attribution Card       │
│                                         │
│    (If "Places"):                       │
│    • Categorical Filter Chips           │
│    • Surrounding POI Card List          │
│                                         │
│    (If "Map"):                          │
│    • Full Exploration Cartography       │
│    • Interactive Marker Pins            │
├─────────────────────────────────────────┤
│ 4. Fixed Bottom Action Bar              │
│    [ Open in Google/Apple Maps ]        │
└─────────────────────────────────────────┘
```

---

## 11. Mobile Map UX

The mobile map is designed as a primary spatial discovery interface, not a decorative static thumbnail.

### 11.1 Map Ergonomics
* **Full-Canvas Viewport:** Seamless interactive map with smooth panning, pinching, and rotation.
* **Recenter Control:** Quick floating action button (`Maximize2` icon) at top-right to re-fit all markers into bounds.
* **Marker Hierarchy:**
  * **Primary Destination Marker:** Large 24pt obsidian pin with white inner star, always rendered on top (`zIndex: 1000`).
  * **Secondary Highlight Markers:** Compact 14pt slate pins (`#6B7280`) with white border.
  * **Active Marker:** Expands to 22pt with drop-shadow and triggers bottom peek card.

### 11.2 Map-to-Sheet Handshake
When any marker is tapped:
1. Map smoothly pans to center the tapped coordinate.
2. Bottom Peek Sheet slides up (occupying 30% height), showing place name, photo thumbnail, category, and star rating.
3. Tapping the peek card or dragging upwards smoothly expands into the **Place Detail** view (85% height).

---

## 12. Place Detail UX

Place Detail operates under a **Bottom Sheet / Modal Presentation Model** rather than pushing a detached full screen. This preserves spatial context with the map underneath.

```text
┌─────────────────────────────────────────┐
│                [ Drag Handle ]          │
├─────────────────────────────────────────┤
│ Place Hero Image (16:9 Aspect Ratio)   │
├─────────────────────────────────────────┤
│ Place Name & Category Badge             │
│ ⭐ 4.8 (1,420 reviews) · Attraction     │
├─────────────────────────────────────────┤
│ Formatted Address                       │
│ Lat/Lng Coordinates (JetBrains Mono)    │
│ Distance from Main Destination (e.g. 1.4km)│
├─────────────────────────────────────────┤
│ Detection Evidence / Category Tags      │
│ [#HistoricLandmark #ScenicView]         │
├─────────────────────────────────────────┤
│ Action Row (Sticky Bottom):             │
│ [ Save to Saved Places ]                │
│ [ Open in Apple Maps / Google Maps ]    │
└─────────────────────────────────────────┘
```

* **Interactive Handoff:** Tapping "Open in Maps" triggers native OS navigation intent (`maps://` on iOS, `geo:` / Google Maps intent on Android).

---

## 13. Explore UX (Lightweight V1)

Explore is intentionally restrained for V1 to avoid social-network bloat:
* **Curated Discoveries:** A feed of real travel destinations previously resolved with high verification confidence.
* **Category Filters:** Quick carousel of `Natural Wonders`, `Historic Architecture`, `Alpine Escapes`, `Coastal Retreats`.
* **Instant Analysis Trigger:** Every item displays an "Inspect Intelligence" button that loads the destination dossier without re-running ingestion.

---

## 14. Saved UX (Travel Locker)

Saved provides travelers with a reliable offline-ready record of places they want to visit:
* **Single Flat List (V1):** Clean list of bookmarked destinations and POIs with thumbnail, title, location, and rating.
* **Category Filters:** Quick chips (`All`, `Attractions`, `Food`, `Stay`).
* **Instant Unsave:** Swipe-to-delete gesture with undo snackbar.
* **Directions Launch:** One-tap action to launch turn-by-turn navigation in preferred maps app.

---

## 15. iOS Considerations

* **Safe Area Insets:** Dynamic Island & notch clearance handled via `react-native-safe-area-context`.
* **Interactive Swipe Back:** Preserved across all pushed stack views.
* **Apple Maps Handoff:** Primary external navigation deep link uses `maps://?q={lat},{lng}`.
* **Haptics:** Native iOS Taptic Engine feedback on button taps (`impactAsync(ImpactFeedbackStyle.Light)`).
* **Keyboard Management:** Native `KeyboardAvoidingView` with `behavior="padding"`.

---

## 16. Android Considerations

* **Edge-to-Edge Display:** Android 14/15 edge-to-edge compliance with transparent navigation bar and status bar icons adjusted to light background.
* **Hardware / System Back Button:** Custom Android back handler gracefully dismisses bottom sheets before popping screen navigation.
* **Google Maps Handoff:** Deep link formatted as `geo:{lat},{lng}?q={encoded_name}`.
* **Ripple Effects:** Subtle native touch feedback using `TouchableNativeFeedback` with bounded dark ripples.
* **Font Scaling:** Strict testing with 1.3x accessibility text scaling to prevent text clipping.

---

## 17. Motion Principles

Motion in Travel AI is **quiet, premium, and intentional** — inspired by Swiss editorial layouts and Leica camera interfaces:
* **Duration Standard:** Fast transitions (`150ms–250ms`) for micro-interactions; smooth springs (`350ms`, damping 28) for bottom sheets.
* **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (smooth deceleration out).
* **No Fake Physics:** Animations only reflect genuine state transitions.
* **Accessibility:** Full respect for OS `prefers-reduced-motion` settings (instant transitions with subtle opacity crossfades).

---

## 18. Accessibility Principles

* **Touch Targets:** Strict enforcement of 44×44 pt (iOS) and 48×48 dp (Android) minimum bounding boxes.
* **Contrast Ratios:** Text primary (`#111111`) on canvas (`#F7F7F5`) achieves a contrast ratio of **15.4:1** (far exceeding WCAG AAA 7:1 standard).
* **Screen Reader Labels:** All icons and custom buttons feature explicit `accessibilityLabel` and `accessibilityHint` props.
* **Dynamic Type:** All typography scales adaptively with system font size settings.

---

## 19. MVP Scope (Phase 1 Target)

The initial mobile release delivers the core end-to-end travel intelligence loop:

1. **Analyze Input Surface:** In-app URL paste, validation, and clipboard trigger.
2. **Truthful Processing Screen:** Animated stage indicator displaying real backend ingestion and Places matching stages.
3. **Results Overview Screen:** Destination hero media, verification badge, and identification evidence dossier.
4. **Travel Intelligence Briefing:** Best season, estimated daily budget, and recommended trip duration.
5. **Surrounding POI List:** Categorized cards with ratings, address, and distance.
6. **Native Exploration Map:** Interactive cartography with primary destination marker and POI pins.
7. **Place Detail Bottom Sheet:** Multi-snap sheet with photos, coordinates, and maps handoff.
8. **Saved Places Locker:** Bookmarking places to local device storage with offline access.
9. **Settings & Diagnostics:** Preferred maps app selector (Apple vs. Google) and API connectivity test.

---

## 20. Future V2 Scope (Explicitly Excluded from MVP)

The following features are strategically deferred to V2 to ensure MVP focus:
* User accounts, OAuth login, and cloud sync.
* Multi-user social features (sharing feeds, friend comments, likes).
* Custom trip itinerary builder and calendar synchronizer.
* Custom collections and multi-trip folders.
* In-app video playback of Instagram Reels (external app handoff is used).
* Offline vector map tile downloads.
* Monetization, affiliate booking links, and payment integration.
* Push notifications.
