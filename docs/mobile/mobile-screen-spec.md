# TRAVEL AI — MOBILE SCREEN SPECIFICATION

**Document Version:** 1.0.0  
**Target Platforms:** iOS & Android (React Native + Expo + TypeScript)  
**Status:** UX Foundation & Design-System Specification (Pre-Implementation)  
**Screen Inventory Count:** 10 Core Mobile Screens  

---

## Screen Directory

- [01 — Analyze (Input Surface)](#01--analyze-input-surface)
- [02 — Processing (Pipeline Loading Experience)](#02--processing-pipeline-loading-experience)
- [03 — Results (Destination Overview)](#03--results-destination-overview)
- [04 — Places (Detected Points of Interest)](#04--places-detected-points-of-interest)
- [05 — Map (Interactive Cartography Canvas)](#05--map-interactive-cartography-canvas)
- [06 — Place Detail (Inspection Sheet / Modal)](#06--place-detail-inspection-sheet--modal)
- [07 — Source Reel (Attribution & Ingestion Reference)](#07--source-reel-attribution--ingestion-reference)
- [08 — Explore (Curated Discoveries)](#08--explore-curated-discoveries)
- [09 — Saved (Travel Locker)](#09--saved-travel-locker)
- [10 — Profile (Preferences & System Diagnostics)](#10--profile-preferences--system-diagnostics)

---

## 01 — Analyze (Input Surface)

### Purpose
The front door of Travel AI. Enables travelers to quickly paste an Instagram Reel URL or trigger analysis from clipboard to convert video travel inspiration into verified geographic intelligence.

### Layout Hierarchy
```text
┌──────────────────────────────────────────────┐
│ [TopBar: "Travel AI" Brand Logo + App Status]│
├──────────────────────────────────────────────┤
│ 1. Editorial Eyebrow                         │
│    "TRAVEL INTELLIGENCE ENGINE"             │
│                                              │
│ 2. Headline & Narrative                      │
│    "Turn travel reels into places worth      │
│     visiting."                               │
│                                              │
│ 3. Primary Input Container (White Card)       │
│    ├── Link Icon                             │
│    ├── Text Input: "Paste Instagram Reel..." │
│    ├── Quick Paste / Clear (X) Button        │
│    └── Submit Button ("Analyze" + Arrow)     │
│                                              │
│ 4. Clipboard Auto-Prompt Pill (Contextual)   │
│    "Paste copied Instagram link from Reel"   │
│                                              │
│ 5. Guidance & Capabilities Overview          │
│    • Public Instagram Reels supported        │
│    • Resolves landmarks, OCR, audio & Places │
│                                              │
│ 6. Recent Analyzed Destinations (Quick Peek) │
│    Horizontal scroll cards of recent trips   │
└──────────────────────────────────────────────┘
```

### Primary CTA
* **"Analyze" Button:** Solid `#111111` container, 48pt height, 10pt radius, white text. Validates Reel format client-side and transitions to `Processing` screen.

### Secondary Actions
* **Paste from Clipboard:** Floating pill or icon button inside input field that requests clipboard text.
* **Clear Input:** `(X)` icon button to reset field with one tap.
* **Inspect Sample Reel:** Preset example links for first-time users to test the pipeline without visiting Instagram.

### Navigation
* **Entry:** App launch (default tab) or tapping "Analyze" tab in Bottom Tab Bar.
* **Next Screen:** Tapping "Analyze" transitions modally into `02 — Processing`.
* **Deep Link:** If app is opened via OS Share Sheet, automatically navigates directly to `02 — Processing` with incoming URL.

### States
* **Idle / Default:** Clean input container with placeholder text and disabled "Analyze" state if input is empty.
* **Active Input:** Keyboard opened, cursor blinking, validation status active. Clear `(X)` button visible.
* **Clipboard Detected:** When clipboard contains an `instagram.com/reel/` link, a subtle toast pill appears: *"Paste link from clipboard?"*.
* **Validation Error:** Red hairline border (`#C1292E`), error message underneath: *"Enter a valid public Instagram Reel URL"*.
* **Engine Degraded Warning:** Subtle banner at top if backend health reports degraded API key status.

### Interactions & Gestures
* **Tap Outside:** Dismisses software keyboard.
* **Return Key:** Hardware/software keyboard "Go" / "Done" triggers submission.
* **Haptic:** Light impact on tapping "Analyze".

### Responsive Behavior
* **Safe Areas:** Top inset applied to brand bar; bottom inset ensures keyboard accessory buttons never collide with home indicator.
* **Keyboard Handling:** View shifts upwards automatically using `KeyboardAvoidingView` to maintain input visibility.

---

## 02 — Processing (Pipeline Loading Experience)

### Purpose
Provides transparent, truthful visibility into the multimodal analysis pipeline without fabricating percentage progress while video ingestion, OCR, audio transcription, and Google Places candidate matching occur.

### Layout Hierarchy
```text
┌──────────────────────────────────────────────┐
│ [TopBar: Empty or Cancel Action]             │
├──────────────────────────────────────────────┤
│ 1. Central Spinner & Animated Ring           │
│    Smooth minimalist geometric spinner       │
│                                              │
│ 2. Pipeline Eyebrow                          │
│    "LIVE ANALYSIS IN PROGRESS"               │
│                                              │
│ 3. Truthful Rotating Status Headline         │
│    "Extracting visual & acoustic clues..."   │
│                                              │
│ 4. Subtitle Narrative                        │
│    "Travel AI processes video frames, audio  │
│     speech, and Google Places records."      │
│                                              │
│ 5. Indeterminate Fluid Progress Bar          │
│    Smooth looping pulse (No fake 45%/82%)    │
│                                              │
│ 6. Multimodal Engine Stage Cards (2x2 Grid)  │
│    ├── Video Ingestion                       │
│    ├── Multimodal Clues                      │
│    ├── Geographic Resolution                 │
│    └── Travel Intelligence                   │
│                                              │
│ 7. Elapsed Time Indicator                    │
│    "Elapsed: 14s"                            │
│                                              │
│ 8. Cancel Analysis CTA                       │
│    [ Cancel Request ]                        │
└──────────────────────────────────────────────┘
```

### Primary CTA
* **"Cancel Request" Button:** Subdued outline button that aborts the HTTP request (`AbortController`) and returns to `01 — Analyze`.

### Secondary Actions
* **Background Notice:** After 35 seconds of processing, an informational card reveals: *"Deep multimodal analysis can take 45–60s during high traffic. Your request is active."*

### Navigation
* **Entry:** Pushed modally from `01 — Analyze` or triggered by OS Share Sheet.
* **Exit (Success):** Seamless replacement transition into `03 — Results`.
* **Exit (Unresolved):** Transitions to `03 — Results` in Unresolved State.
* **Exit (Cancel / Error):** Pops back to `01 — Analyze` with actionable banner.

### States
* **Active Progress (0–30s):** Rotating truthful messages every 6 seconds:
  1. *"Analyzing Reel content..."*
  2. *"Extracting visual & acoustic location clues..."*
  3. *"Resolving geographic coordinates via Google Places..."*
  4. *"Curating travel intelligence & nearby highlights..."*
* **Long-Running Progress (30s+):** Reassurance note appears; timer increments calmly.
* **Timeout State (180s threshold):** Transitions to Error dialog: *"The analysis is taking too long. Please try again."*
* **Inaccessible Reel State:** Graceful transition to error: *"This Reel couldn't be accessed. Make sure it's public."*

### Interactions & Gestures
* **Hardware Back (Android):** Triggers confirmation dialog: *"Cancel active analysis?"*.
* **Swipe-Down Gesture:** Disabled to prevent accidental cancellation during network payload transfer.

### Responsive Behavior
* Centered vertically on all device heights.
* Compact 2x2 stage cards collapse to 1-column layout on compact mobile screens (<360dp width).

---

## 03 — Results (Destination Overview)

### Purpose
The primary payoff screen. Presents the resolved destination with immediate visual impact, clear verification status, curated travel intelligence, and seamless entry into spatial exploration.

### Layout Hierarchy
```text
┌──────────────────────────────────────────────┐
│ [TopBar: Back Arrow · Share · Bookmark]      │
├──────────────────────────────────────────────┤
│ 1. Destination Media Box (Hero Photo)        │
│    ├── High-resolution verified photo        │
│    ├── Photo Counter badge ("1/6")           │
│    ├── Gradient legibility scrim             │
│    └── Destination Name & Country Overlay    │
│                                              │
│ 2. Verification Dossier                      │
│    ├── Verification Badge ("VERIFIED MATCH") │
│    ├── Confidence Score Progress Meter       │
│    └── Multimodal Signal Indicators (OCR/Mic)│
│                                              │
│ 3. Destination Narrative & Summary           │
│    Editorial description of the destination  │
│                                              │
│ 4. Segment Navigation Bar (Sticky)           │
│    [ Overview ]  [ Places (8) ]  [ Map ]     │
│                                              │
│ 5. Overview Content:                         │
│    ├── Optimal Travel Window (Seasonality)   │
│    ├── Estimated Daily Expenses ($120/day)   │
│    ├── Recommended Duration (3-5 days)       │
│    ├── Local Travel Tips Cards               │
│    └── Source Reel Attribution Card          │
│                                              │
│ 6. Bottom Sticky Floating Bar                │
│    [ Open in Google / Apple Maps ]           │
└──────────────────────────────────────────────┘
```

### Primary CTA
* **"Open in Maps":** Fixed to bottom viewport; launches preferred native maps navigation app with verified coordinates.

### Secondary Actions
* **Bookmark Destination:** Top-right heart/bookmark icon to store in `09 — Saved`.
* **Share Intelligence:** Native system share sheet with destination name, coordinates, and Google Maps URL.
* **Photo Gallery Swipe:** Horizontal swipe across hero image to browse multiple verified photos.
* **Segment Switch:** Switch between Overview, Places, and Map views.

### Navigation
* **Entry:** Transition from `02 — Processing` upon successful resolution.
* **Sub-views:** Tapping "Places" or "Map" segments switches active view without leaving screen.
* **Back:** Returns to `01 — Analyze` input state.

### States
* **Full Success (Verified):** High-res photos, green verification badge, full intelligence briefing.
* **Partial Match:** Amber badge (`PARTIAL`), indicates which signals were verified and which remain unconfirmed.
* **AI Unverified Match:** Slate badge (`AI UNVERIFIED`), clearly states destination was resolved via text/Places signals without visual confirmation.
* **Unresolved State:** Replaces hero with compass icon and explanatory card: *"Destination Could Not Be Resolved"*, offering tips and a *"Try Another Reel"* CTA.

### Interactions & Gestures
* **Scroll Pacing:** Sticky segmented navigation docks beneath top navigation bar when scrolled.
* **Photo Swipe:** Horizontal swipe across hero image with pagination dots.
* **Tap Segment:** Instant animated tab indicator slide.

### Responsive Behavior
* Large screens (>400dp width) display travel intelligence cards in a 2-column grid; compact screens stack cards vertically.
* Safe area bottom padding ensures fixed Maps button clears home indicator bar.

---

## 04 — Places (Detected Points of Interest)

### Purpose
Allows travelers to discover and filter all secondary landmarks, attractions, dining spots, and accommodations identified around the primary destination.

### Layout Hierarchy
```text
┌──────────────────────────────────────────────┐
│ [Segment Bar: Overview · [Places] · Map]     │
├──────────────────────────────────────────────┤
│ 1. Filter Chips Carousel (Horizontal)        │
│    [All (9)] [Attractions (4)] [Dining (3)]  │
│    [Nature (1)] [Lodging (1)]                │
│                                              │
│ 2. Results Count Label                       │
│    "Showing 9 highlights near Lake Eibsee"   │
│                                              │
│ 3. Vertical Place Card Feed                  │
│    ┌──────────────────────────────────────┐  │
│    │ Place Card 01                        │  │
│    │ [Thumbnail] Zugspitze Cable Car      │  │
│    │             ⭐ 4.8 (2.4k) · 1.2 km    │  │
│    │             Attraction · View details│  │
│    └──────────────────────────────────────┘  │
│    ┌──────────────────────────────────────┐  │
│    │ Place Card 02                        │  │
│    │ [Thumbnail] Eibsee-Pavillon          │  │
│    │             ⭐ 4.6 (890) · 0.4 km     │  │
│    │             Food & Dining · View     │  │
│    └──────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

### Primary CTA
* **Tap Place Card:** Opens `06 — Place Detail` in an interactive bottom sheet.

### Secondary Actions
* **Filter by Category:** Tap chip to filter POIs dynamically.
* **Quick Maps Action:** Direct Maps icon on individual cards to launch external navigation immediately.
* **Quick Bookmark:** Bookmark icon on card to save individual POI without opening full detail.

### Navigation
* **Entry:** Tapping "Places" segment on `03 — Results`.
* **Detail Handoff:** Tapping a card opens `06 — Place Detail` bottom sheet.
* **Cross-Navigation:** Tapping a card's "Pin" indicator switches directly to `05 — Map` centered on that coordinate.

### States
* **Populated:** Full list of cards with photos, distance, and categories.
* **Category Empty:** If a selected filter has 0 items, displays clean empty note: *"No dining spots detected in this Reel."*
* **No Nearby Places:** If backend returns empty nearby places array, displays subtle notice: *"Only the primary destination was detected."*

### Interactions & Gestures
* **Vertical Scroll:** Smooth native scroll with fast list virtualization.
* **Filter Chip Tap:** Haptic tick, instant list filter with subtle opacity fade.

### Responsive Behavior
* Cards maintain full width with 16pt lateral screen padding on phones.
* Image thumbnail scales proportionally, maintaining 1:1 square aspect ratio (72×72pt).

---

## 05 — Map (Interactive Cartography Canvas)

### Purpose
Provides a native, first-class spatial view of the primary destination and all surrounding points of interest, turning social media inspiration into an intuitive physical map.

### Layout Hierarchy
```text
┌──────────────────────────────────────────────┐
│ [Top Floating Controls: Recenter · Layer]    │
├──────────────────────────────────────────────┤
│                                              │
│             FULL INTERACTIVE CANVAS          │
│                                              │
│         [Pin: Zugspitze]                     │
│                ★ [PRIMARY DESTINATION PIN]   │
│                      [Pin: Eibsee Cafe]      │
│                                              │
├──────────────────────────────────────────────┤
│ Bottom Floating Sheet / Peek Card            │
│ ┌──────────────────────────────────────────┐ │
│ │ [Selected Place Preview]                 │ │
│ │ Lake Eibsee (Primary Destination)        │ │
│ │ ⭐ 4.9 · Bavaria, Germany                │ │
│ │ [ Tap to expand full details ]           │ │
│ └──────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘
```

### Primary CTA
* **Tap Selected Place Peek Card:** Expands `06 — Place Detail` bottom sheet to full view.

### Secondary Actions
* **Recenter Button (`Maximize2`):** Floating circular button at top-right to re-fit map camera bounds to all active pins.
* **Tap Marker Pin:** Centers map on marker, activates drop-shadow highlight, and updates bottom preview card.
* **External Maps Launch:** Button on peek card to launch turn-by-turn navigation directly.

### Navigation
* **Entry:** Tapping "Map" segment in `03 — Results` or tapping the map thumbnail in Overview.
* **Handoff:** Expanding the bottom peek card opens `06 — Place Detail`.

### States
* **Default View:** Map camera bounds fitted automatically to encompass primary destination and all surrounding POIs with 35pt padding.
* **Pin Selected:** Selected pin highlighted; other pins dim slightly; bottom preview card slides up.
* **Loading Tiles:** Neutral bone-colored tile placeholder with centered pulsing compass.
* **No Coordinates:** Clean fallback card explaining coordinates could not be resolved.

### Interactions & Gestures
* **Two-Finger Pinch:** Native zoom in/out.
* **Two-Finger Rotate / Pitch:** Perspective camera adjustments.
* **Marker Tap:** Pans camera smoothly with 300ms easing and triggers light haptic tick.
* **Swipe-Up on Peek Card:** Expands seamlessly into full `06 — Place Detail`.

### Responsive Behavior
* Full-bleed canvas occupies 100% of viewport minus floating top bar and bottom peek card.
* Map zoom controls omitted on mobile (standard touch pinch is prioritized).

---

## 06 — Place Detail (Inspection Sheet / Modal)

### Purpose
The comprehensive dossier for any individual place (either the primary destination or a surrounding POI), designed as a gesture-driven bottom sheet.

### Layout Hierarchy
```text
┌──────────────────────────────────────────────┐
│                  [ Drag Handle ]             │
├──────────────────────────────────────────────┤
│ 1. Hero Imagery                              │
│    High-res photography with photo credit    │
│                                              │
│ 2. Identity & Category                       │
│    ├── Category Tag (e.g. "HISTORIC SITE")   │
│    ├── Place Display Name                    │
│    └── Official Formatted Address            │
│                                              │
│ 3. Rating & Community Proof                  │
│    ⭐ 4.8 (1,840 reviews on Google Places)    │
│                                              │
│ 4. Geographic Coordinates & Proximity        │
│    ├── Lat: 47.4561° N, Lng: 10.9854° E      │
│    └── Distance: 1.4 km from main destination│
│                                              │
│ 5. Google Places Category Tags               │
│    [#tourist_attraction #point_of_interest]  │
│                                              │
│ 6. Identification Evidence (If Primary)      │
│    Why this place was verified from the Reel │
│                                              │
│ 7. Fixed Action Buttons (Bottom)             │
│    ├── [ Bookmark / Save ] (50% width)       │
│    └── [ Open in Maps ]    (50% width)       │
└──────────────────────────────────────────────┘
```

### Primary CTA
* **"Open in Google / Apple Maps":** Launches turn-by-turn navigation via system URL scheme.

### Secondary Actions
* **Save / Bookmark:** Toggles place into `09 — Saved`.
* **Close / Dismiss:** Downward swipe gesture or tap `(X)` icon.
* **Copy Coordinates:** Long-press on coordinates copies them to clipboard with haptic confirmation.

### Navigation
* **Presentation:** Gesture-controlled bottom sheet with 2 snap points:
  * **Snap 1 (Peek - 35% height):** Quick summary over the map.
  * **Snap 2 (Expanded - 90% height):** Full details, address, and intelligence.
* **Dismissal:** Drag downwards past 25% threshold or tap outside backdrop.

### States
* **Standard POI:** Displays Google Places metadata, distance, rating, and address.
* **Primary Destination:** Displays additional identification dossier (*"Why this place"*), seasonality, and budget cards.
* **Photo Fallback:** If photo is unavailable, renders elegant geometric map pin placeholder.

### Interactions & Gestures
* **Drag Handle:** Rubber-band resistance at top snap point.
* **Momentum Fling:** Flicking downwards dismisses sheet with natural inertia.

### Responsive Behavior
* On tablets / wide foldables, converts automatically to a floating side panel (400pt width) anchored to the right edge.

---

## 07 — Source Reel (Attribution & Ingestion Reference)

### Purpose
Maintains transparent attribution to the original travel creator and allows the traveler to view the original source content on Instagram.

### Layout Hierarchy
```text
┌──────────────────────────────────────────────┐
│ [Embedded Card Container: White Surface]     │
├──────────────────────────────────────────────┤
│ 1. Header Row                                │
│    ├── Instagram Camera Icon (Black Box)     │
│    ├── Label: "ORIGINAL SOURCE REEL"         │
│    └── Domain: "instagram.com/reel/..."      │
│                                              │
│ 2. Creator Attribution                       │
│    "Source video processed for geographic    │
│     and landmark intelligence."              │
│                                              │
│ 3. Deep Link CTA                             │
│    [ View on Instagram ↗ ]                   │
└──────────────────────────────────────────────┘
```

### Primary CTA
* **"View on Instagram":** Deep links directly into the native Instagram app (falling back to mobile browser if app is not installed).

### Secondary Actions
* **Copy Source URL:** Long-press to copy original link to clipboard.

### Navigation
* Embedded as a secondary section within `03 — Results` (Overview tab).

### States
* **Available:** Shows verified source badge and external launch CTA.
* **Null / Unavailable:** Card cleanly omitted if analysis was triggered via offline mock or test suite.

### Interactions & Gestures
* Tap CTA opens external application without disrupting Travel AI's navigation stack.

### Responsive Behavior
* Compact card, spans 100% container width with hairline border.

---

## 08 — Explore (Curated Discoveries)

### Purpose
Provides inspiration and discovery for travelers who don't have a specific Reel URL on hand. Features real destinations resolved by Travel AI.

### Layout Hierarchy
```text
┌──────────────────────────────────────────────┐
│ [TopBar: "Explore" Headline + Search Icon]   │
├──────────────────────────────────────────────┤
│ 1. Header Banner                             │
│    "Curated Destinations Resolved by AI"     │
│                                              │
│ 2. Category Carousel (Pills)                 │
│    [All] [Alpine Lakes] [Coastal] [Culture]  │
│                                              │
│ 3. Featured Destination Hero Card            │
│    Large photography card with verified badge│
│    and one-tap "Inspect Destination" CTA     │
│                                              │
│ 4. Editorial Discovery Grid                  │
│    2-column grid of verified travel spots:   │
│    ├── Hallstatt, Austria                    │
│    ├── Amalfi Coast, Italy                   │
│    ├── Lake Como, Italy                      │
│    └── Kyoto, Japan                          │
└──────────────────────────────────────────────┘
```

### Primary CTA
* **Tap Destination Card:** Instantly loads the full `03 — Results` dossier for that destination without re-running video extraction.

### Secondary Actions
* **Category Filter:** Tap pill to filter cards by travel genre.
* **Quick Bookmark:** Tap bookmark icon on card corner to save to `09 — Saved`.

### Navigation
* Root view of the "Explore" Tab in the Bottom Tab Bar.

### States
* **Populated:** Clean grid of destination cards with verified tags.
* **Network Offline:** Displays cached discoveries with offline indicator.

### Interactions & Gestures
* Smooth vertical pull-to-refresh to check for newly curated destinations.

### Responsive Behavior
* 2-column grid on standard phones; 3-column grid on larger phablets / foldables.

---

## 09 — Saved (Travel Locker)

### Purpose
The user's personal travel locker. Stores all bookmarked destinations and individual points of interest for offline reference and future journey planning.

### Layout Hierarchy
```text
┌──────────────────────────────────────────────┐
│ [TopBar: "Saved Places" + Item Count Pill]   │
├──────────────────────────────────────────────┤
│ 1. Filter Chips                              │
│    [All (12)] [Destinations (4)] [Places (8)]│
│                                              │
│ 2. Saved Items List                          │
│    ┌──────────────────────────────────────┐  │
│    │ Lake Braies                          │  │
│    │ Dolomites, Italy · Verified          │  │
│    │ [Directions] [Open Dossier] [Remove] │  │
│    └──────────────────────────────────────┘  │
│                                              │
│ 3. Bottom Offline Cache Status               │
│    "✓ Saved places available offline"        │
└──────────────────────────────────────────────┘
```

### Primary CTA
* **Tap Saved Item:** Opens full `03 — Results` or `06 — Place Detail`.

### Secondary Actions
* **Get Directions:** Direct icon button to launch turn-by-turn navigation in Apple/Google Maps.
* **Remove Bookmark:** Swipe left to reveal red "Delete" action or tap bookmark icon to toggle off.

### Navigation
* Root view of the "Saved" Tab in the Bottom Tab Bar.

### States
* **Populated:** Structured list of saved items.
* **Empty State:** Minimalist compass illustration with headline: *"No Saved Places Yet"*, and a CTA: *[ Analyze a Reel to Start ]*.

### Interactions & Gestures
* **Swipe-to-Delete:** Native swipe-left action on list items with undo snackbar.

### Responsive Behavior
* Full-width list items with generous 48pt tap targets for thumb ergonomics.

---

## 10 — Profile (Preferences & System Diagnostics)

### Purpose
Lightweight utility and settings surface. Allows travelers to customize app behaviors (such as preferred maps navigation app) and inspect system health.

### Layout Hierarchy
```text
┌──────────────────────────────────────────────┐
│ [TopBar: "Settings & Preferences"]           │
├──────────────────────────────────────────────┤
│ 1. Travel Preferences Section                │
│    ├── Default Navigation App                │
│    │   (Select: Apple Maps / Google Maps)    │
│    └── Preferred Units (km / miles)          │
│                                              │
│ 2. Cache & Storage Management                │
│    ├── Cached Analyses (18 MB)               │
│    └── [ Clear Cached Media ] Button         │
│                                              │
│ 3. Travel AI Engine Diagnostics              │
│    ├── API Health: Connected (FastAPI Engine)│
│    ├── Google Places Service: Ready          │
│    └── Gemini Multimodal Vision: Ready       │
│                                              │
│ 4. App Information                           │
│    ├── Version: 1.0.0 (Build 104)            │
│    ├── Privacy & Data Use Notice             │
│    └── Open Source Attributions              │
└──────────────────────────────────────────────┘
```

### Primary CTA
* **Default Maps App Selector:** Segmented control toggling between Apple Maps and Google Maps for external navigation intents.

### Secondary Actions
* **Clear Cache:** Purges downloaded thumbnail images and temporary analysis payloads from local storage.
* **Test Engine Connection:** Pings `/health` endpoint to verify live backend reachability.

### Navigation
* Root view of the "Profile" Tab in the Bottom Tab Bar.

### States
* **Normal:** All system services reporting green `OK` status.
* **Degraded:** Warning indicator next to API health if backend is unreachable.

### Interactions & Gestures
* Native toggle switches and modal action sheet for cache clearing confirmation.

### Responsive Behavior
* Grouped inset list styling following iOS and Android native settings conventions.
