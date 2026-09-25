# TRAVEL AI — MOBILE DESIGN SYSTEM SPECIFICATION

**Document Version:** 1.0.0  
**Target Platforms:** iOS & Android (React Native · Expo SDK 57 · TypeScript)  
**Authoritative Source of Truth:** `mobile/constants/theme.ts` & Mobile Application Implementation  
**Status:** Canonical & Implemented  

---

## A. Design System Overview

### Visual Identity
**Travel AI** is an AI-native mobile travel intelligence utility built with an **editorial, Swiss-design-inspired travel aesthetic**. It transforms unstructured short-form social video (Instagram Reels) into structured, verified geographic intelligence, interactive cartography, and offline travel bookmarks.

The design language moves away from the generic gradients, crowded cards, and loud gamification typical of consumer travel apps. Instead, it draws from high-end travel journalism, architectural monographs, and Swiss modernist typography: generous white space, a warm alabaster canvas, deep obsidian high-contrast accents, hairline neutral borders, and strictly disciplined semantic color.

```text
┌─────────────────────────────────────────────────────────────┐
│                 TRAVEL AI DESIGN ATTRIBUTES                 │
├─────────────┬───────────────────────────────────────────────┤
│ Minimal     │ Content-first; zero decorative clutter       │
│ Editorial   │ Serif-adjacent hierarchy via Swiss typography │
│ Premium     │ Warm alabaster canvas with obsidian contrast  │
│ Functional  │ Single-thumb mobile ergonomics & clear affordances │
│ Truthful    │ Honest system telemetry; no fabricated progress│
│ Native      │ Platform-conscious iOS & Android interactions │
└─────────────┴───────────────────────────────────────────────┘
```

### Design Philosophy
1. **The Destination is the Hero:** Photography, geographic coordinates, and verified travel intelligence occupy center stage. The user interface recedes into a quiet, supportive framework.
2. **Restrained Monochromes:** 95% of the visual interface is monochrome (`#F7F7F5`, `#FFFFFF`, `#F0F0ED`, `#111111`, `#666666`, `#8A8A8A`). Color is reserved strictly for functional status communication (verification tiers, errors, telemetry).
3. **Tactile & Responsive:** Every interaction provides immediate visual feedback (subtle scaling down to 0.94–0.985, opacity shifts) coupled with native tactile haptics (`light`, `selection`, `medium`, `success`).
4. **Truthful System State:** Video analysis and multimodal verification take real compute time. The interface communicates reality with live elapsed timers and rotating engine messages rather than fake percentages.

---

## B. Design Principles

### 1. Content Before Decoration
Never add decorative shapes, ambient blurred blobs, or ornamental gradients behind content. Contrast and hierarchy must be achieved through typography, spacing, and surface differentiation.

### 2. Hierarchy Before Density
Every screen leads with a singular focal point:
* **Analyze Tab:** The primary URL input canvas and instant paste affordance.
* **Processing Screen:** The live status spinner and truthful pipeline stage.
* **Results Screen:** The high-resolution destination hero photograph and verification status badge.
* **Map Screen:** The full-bleed cartographic viewport with prominent destination pin.

### 3. Restrained Visual Language
Color communicates state, never decoration. When a user sees green (`#2D6A4F`), it exclusively signifies **Verified Match**. When amber (`#B5651D`) appears, it signifies **Partial Verification**. Red (`#C1292E`) indicates an actionable engine or network failure.

### 4. Clear Interaction Affordances
Interactive elements must never be ambiguous:
* Buttons have solid high-contrast backgrounds (`#111111` or `#FFFFFF`) with 1pt borders.
* Active inputs feature high-contrast focus rings (`#111111`).
* Filter chips visibly toggle between outline surface and solid dark states.
* Press states provide immediate feedback via `opacity: 0.75–0.92` and `transform: [{ scale: 0.94–0.99 }]`.

### 5. Meaningful Motion
Animations serve comprehension, not entertainment:
* Crossfading stage messages (150ms out / 250ms in) show engine transition without jarring text jumps.
* Bottom sheets use spring physics (`damping: 24, stiffness: 220`) that match user gesture velocity.
* Hero cards enter with a crisp 280ms opacity fade.

### 6. Truthful System Feedback
The interface never lies about progress:
* No fabricated progress bars (e.g. animating from 0% to 99% on a timer).
* The processing screen displays actual elapsed seconds (`Elapsed: 14s`) alongside honest stage indicators.
* If analysis exceeds 35 seconds, a reassurance note explains cold-start and video processing realities.

### 7. Native Mobile Ergonomics
All primary interactive controls reside within the natural mobile "thumb zone" (the bottom half of the screen):
* Persistent 4-tab bottom navigation bar (`Analyze`, `Explore`, `Saved`, `Profile`).
* Sticky bottom sheet controls for inspecting points of interest on cartography.
* Primary CTA buttons pinned to comfortable thumb reach.

### 8. Accessibility-Conscious Touch Targets
All tappable controls enforce platform minimum touch target sizes:
* **iOS:** Minimum 44×44 pt (`TouchTarget.minWidth`, `TouchTarget.minHeight`).
* **Android:** Minimum 48×48 pt.
* Smaller visual icons (e.g. 16–20pt icons) utilize `hitSlop={8}` to `hitSlop={12}` to preserve touch fidelity.

### 9. Consistent 4pt Spacing System
All layout margins, internal paddings, icon offsets, and component gaps derive strictly from the 4pt mathematical spacing scale (`Spacing` tokens 4 to 64 pt).

### 10. Visual Calm During Long-Running Operations
Multimodal analysis (video download, audio transcription, OCR extraction, and Google Places resolution) can take 45–90 seconds under cold-start conditions. The design system prevents user panic through a tranquil, centered layout, rhythmic loading pulses, and clear abort options.

---

## C. Color System

All colors are strictly derived from `mobile/constants/theme.ts`. Arbitrary hex or rgba values outside this palette are prohibited.

### 1. Canvas & Surface Tokens

| Token | Hex / Value | Role & Usage |
| :--- | :--- | :--- |
| `canvas` | `#F7F7F5` | **Warm Alabaster.** Primary screen canvas background across all tabs and routes. |
| `surface` | `#FFFFFF` | **Pure White.** Cards, bottom sheets, search inputs, modal containers, and elevated surfaces. |
| `surfaceSubtle` | `#F0F0ED` | **Warm Light Gray.** Unselected chips, thumbnail fallbacks, secondary action containers. |
| `surfaceDark` | `#111111` | **Deep Obsidian.** Primary CTA buttons, active tab indicators, selected filter chips, map pin centers. |
| `surfaceDarkElevated` | `#181818` | **Charcoal Black.** Elevated high-emphasis dark blocks. |

### 2. Text Tokens

| Token | Hex / Value | Role & Usage |
| :--- | :--- | :--- |
| `textPrimary` | `#111111` | Primary editorial headings, titles, active tab labels, body copy, and high-contrast text. |
| `textSecondary` | `#666666` | Supporting body descriptions, unselected chip labels, subtitle notes, secondary values. |
| `textMuted` | `#8A8A8A` | Eyebrow labels, metadata tags, review counts, timestamps, inactive tab labels. |
| `textInverse` | `#F7F7F5` | Text on `surfaceDark` buttons, dark badges, and dark scrim overlays. |

### 3. Border & Divider Tokens

| Token | Hex / Value | Role & Usage |
| :--- | :--- | :--- |
| `borderSubtle` | `#E5E5E2` | Hairline 1pt borders for cards, bottom sheets, dividers, and unselected chips. |
| `borderFocus` | `#111111` | Active/focused input borders, pressed card outlines. |
| `borderAccent` | `#C2CBD3` | Subtle slate border highlight for high-emphasis containers. |

### 4. Semantic Verification Tokens
Directly aligned with backend analysis response verification tiers:

| Token | Hex / Value | Semantic Meaning |
| :--- | :--- | :--- |
| `verified` | `#2D6A4F` | **Verified Match.** Forest green accent for confirmed landmark identification. |
| `verifiedSurface` | `rgba(45, 106, 79, 0.08)` | Background tint for verified badges and cards. |
| `verifiedBorder` | `rgba(45, 106, 79, 0.20)` | Hairline border for verified badges and cards. |
| `partial` | `#B5651D` | **Partially Verified.** Warm amber accent for partial clue matches. |
| `partialSurface` | `rgba(181, 101, 29, 0.08)` | Background tint for partial verification badges. |
| `partialBorder` | `rgba(181, 101, 29, 0.20)` | Hairline border for partial verification badges. |
| `aiUnverified` | `#666666` | **AI Unverified.** Slate gray for unconfirmed landmark candidates. |
| `aiUnverifiedSurface` | `#F0F0ED` | Neutral subtle background for unverified badges. |
| `aiUnverifiedBorder` | `#E5E5E2` | Hairline border for unverified badges. |
| `algorithmic` | `#8A8A8A` | **Algorithmic Placement.** Muted gray for fallback or skipped verification. |
| `algorithmicSurface` | `#F0F0ED` | Neutral subtle background for algorithmic badges. |
| `algorithmicBorder` | `#E5E5E2` | Hairline border for algorithmic badges. |

### 5. Semantic Status & Utility Tokens

| Token | Hex / Value | Semantic Meaning |
| :--- | :--- | :--- |
| `error` | `#C1292E` | **Error / Alert.** Muted crimson for failed requests, validation errors, and timeout alerts. |
| `errorSurface` | `rgba(193, 41, 46, 0.06)` | Background tint for error cards and warning banners. |
| `errorBorder` | `rgba(193, 41, 46, 0.20)` | Border tint for error cards and input validation error states. |
| `info` | `#4A6FA5` | **Information.** Cobalt accent for pipeline hints and engine status indicators. |
| `infoSurface` | `rgba(74, 111, 165, 0.08)` | Background tint for informational callouts. |
| `infoBorder` | `rgba(74, 111, 165, 0.20)` | Border tint for informational callouts. |

### 6. Map-Specific Colors

| Element | Color Value | Description |
| :--- | :--- | :--- |
| Primary Pin Fill | `#111111` | Solid obsidian circle with pure white border (`#FFFFFF`). |
| Primary Pin Icon | `#FFFFFF` | Centered star icon inside the primary destination marker. |
| Primary Halo | `rgba(17, 17, 17, 0.16)` | Selected halo ring (48×48 pt) around the primary marker. |
| Nearby Pin Fill | `#666666` | Slate circle with white border; transitions to `#111111` when selected. |
| Nearby Pin Dot | `#FFFFFF` | Centered white dot inside the nearby point-of-interest marker. |
| Nearby Halo | `rgba(17, 17, 17, 0.14)` | Selected halo ring (38×38 pt) around the nearby POI marker. |
| Star Rating Fill | `#F59E0B` | Standardized amber gold for star rating icons. |

---

## D. Typography

The typography system is rooted in native platform system fonts for performance, zero layout shift, and sharp legibility across iOS and Android.

### 1. Font Family Specification

```typescript
const sansFontFamily = Platform.select({
  ios: 'System',       // Apple San Francisco
  android: 'Roboto',   // Google Roboto
  default: 'System',
});

const monoFontFamily = Platform.select({
  ios: 'Menlo',        // Apple Menlo
  android: 'monospace',// Android Monospace
  default: 'monospace',
});
```

* **Primary Sans:** Clean, neutral, high-legibility sans-serif used for all editorial titles, section headings, body prose, and UI labels.
* **Secondary Monospace:** Dedicated monospace font used for geographic coordinates (`formatCoordinates`), distance tags (`formatDistance`), and telemetry elapsed timers.

### 2. Complete Typography Scale

| Token | Size | Line Height | Weight | Letter Spacing | Color | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `display` | 32 pt | 38 pt | Bold (700) | -0.8 | `textPrimary` | Primary hero destination title on Results. |
| `h1` | 26 pt | 32 pt | Semi-Bold (600) | -0.6 | `textPrimary` | Major screen headlines and ImageCard overlay titles. |
| `h2` | 20 pt | 26 pt | Semi-Bold (600) | -0.4 | `textPrimary` | Section headers, card titles, stat card numbers. |
| `h3` | 16 pt | 22 pt | Semi-Bold (600) | -0.2 | `textPrimary` | Place card titles, top bar titles, bottom sheet headers. |
| `body` | 15 pt | 22 pt | Regular (400) | 0.0 | `textPrimary` | Primary descriptive paragraphs, travel summary, input text. |
| `bodySmall` | 13 pt | 18 pt | Regular (400) | 0.0 | `textSecondary` | Secondary descriptions, hints, address lines, sub-notes. |
| `caption` | 12 pt | 16 pt | Medium (500) | 0.0 | `textMuted` | Image captions, review counts, timestamps, badges. |
| `label` | 10 pt | 14 pt | Bold (700) | 1.2 (UPPER) | `textMuted` | Uppercase category eyebrows, stat labels, tag headers. |
| `mono` | 12 pt | 16 pt | Medium (500) | 0.0 | `textSecondary` | Coordinates, distance indicators, telemetry counters. |

---

## E. Spacing System

Layouts are constructed on an **8-step 4pt grid system**.

```typescript
export const Spacing = {
  xs: 4,       // Micro gaps, icon-to-text separation
  sm: 8,       // Component internal gaps, chip margins
  md: 12,      // Standard card padding, input padding
  base: 16,    // Screen horizontal gutter, section separation
  lg: 20,      // Large section padding, button vertical spacing
  xl: 24,      // Card outer padding, modal offsets
  xxl: 32,     // Major block separation
  xxxl: 40,    // Hero and page division spacing
  huge: 48,    // Primary CTA heights, navigation item bounds
  massive: 64, // Modal presentation and hero offsets
} as const;
```

### Applied Spacing Conventions
* **Screen Horizontal Padding:** Standard `Spacing.base` (16 pt) for standard scroll views; `Spacing.xl` (24 pt) for centered status screens (`ProcessingScreen`, `EmptyState`, `ErrorState`).
* **Section Separation:** `Spacing.lg` (20 pt) top margin on `SectionHeader`.
* **Card Internal Padding:** `Spacing.md` (12 pt) for list cards (`PlaceCard`, `StatCard`); `Spacing.xl` (24 pt) for modal card containers.
* **Component Gaps:** `Spacing.xs` (4 pt) between icon and label; `Spacing.sm` (8 pt) between badge items or buttons in a row.
* **List Spacing:** `Spacing.md` (12 pt) vertical bottom margin between stacked place cards.
* **Bottom Sheet Padding:** `Spacing.base` (16 pt) horizontal gutters; `Spacing.xs + 2` (6 pt) vertical padding around the drag handle.
* **Navigation Bar Padding:** `Spacing.sm` (8 pt) top padding + `useSafeAreaInsets().bottom` bottom padding.

---

## F. Sizing & Layout

### 1. Screen & Container Constraints
* **Screen Margins:** Fixed 16pt margin on mobile viewports.
* **Max Content Width:** Centered dialog cards, processing status cards, and empty state cards are constrained to `maxWidth: 360` to `380 pt` to preserve visual balance on large phone screens and tablets (`supportsTablet: true` in `app.json`).

### 2. Border Radius Tokens

```typescript
export const Radius = {
  sm: 4,      // Distance badges, micro tags
  md: 6,      // Filter chips, action buttons, confidence badges
  lg: 8,      // PlaceCard thumbnails, info callouts
  xl: 12,     // Standard buttons, URL inputs, SearchBar, StatCard
  xxl: 16,    // ImageCard, BottomSheet top corners, State cards
  full: 9999, // Pill buttons, marker pins, avatars, drag handle
} as const;
```

### 3. Touch Targets & Minimums

```typescript
export const TouchTarget = {
  minWidth: Platform.OS === 'ios' ? 44 : 48,
  minHeight: Platform.OS === 'ios' ? 44 : 48,
} as const;
```

* **Interactive Controls:** All buttons, icon buttons, tabs, and list items guarantee at least 44×44 pt (iOS) or 48×48 pt (Android) hit area.
* **Sub-Sized Controls:** Controls with compact visual bounding boxes (e.g. 32pt close buttons or 18pt clear icons) specify `hitSlop={8}` to `hitSlop={12}` to ensure accessibility compliance.

### 4. Shadow Tokens

```typescript
export const Shadows = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
};
```

---

## G. Component System

The application library consists of **19 reusable UI and map components** located in `mobile/components/ui/` and `mobile/components/map/`.

---

### 1. Button (`Button.tsx`)
* **Purpose:** Primary, secondary, outline, and ghost action triggers.
* **Variants:**
  * `primary`: `#111111` background, `#F7F7F5` text, `#111111` border.
  * `secondary`: `#FFFFFF` background, `#111111` text, `#E5E5E2` border.
  * `outline`: Transparent background, `#111111` text, `#111111` border.
  * `ghost`: Transparent background, `#111111` text, no border.
* **Sizes:**
  * `sm`: minHeight 44/48pt, horizontal padding 12pt, font 13pt.
  * `md`: minHeight 48pt, horizontal padding 20pt, font 15pt.
  * `lg`: minHeight 54pt, horizontal padding 24pt, font 16pt.
* **Interaction States:**
  * Pressed: `opacity: 0.85, transform: [{ scale: 0.985 }]`.
  * Disabled: `opacity: 0.5`.
  * Loading: Replaces text with native `ActivityIndicator`.
* **Usage Guidance:** Use `primary` exclusively for the main page action (e.g. "Analyze this reel"). Use `secondary` for supporting actions (e.g. "Open in Maps").

---

### 2. IconButton (`IconButton.tsx`)
* **Purpose:** Compact icon-only touch targets (back buttons, bookmark toggles, map triggers).
* **Variants:** `surface` (white with border), `dark` (obsidian), `ghost` (transparent), `subtle` (light gray).
* **Shape:** Rounded rectangle (`Radius.xl`) or circular (`rounded=true`, `Radius.full`).
* **Interaction States:** Pressed (`opacity: 0.75, scale: 0.94`), Disabled (`opacity: 0.4`).
* **Usage Guidance:** Always specify an `accessibilityLabel` explaining the action.

---

### 3. URLInput (`URLInput.tsx`)
* **Purpose:** Ingestion field for public Instagram Reel URLs.
* **Features:**
  * Leading link icon (`Ionicons link`).
  * Dedicated "Paste" action button leveraging `expo-clipboard` with auto-trim and light haptic feedback.
  * Clear `(X)` icon button appearing dynamically when input is populated.
  * Focused state ring (`borderFocus: #111111`).
  * Inline validation error state (`error: #C1292E`) with alert icon.
* **Usage Guidance:** Place inside a `KeyboardAvoidingView` with `keyboardType="url"` and `returnKeyType="go"`.

---

### 4. SearchBar (`SearchBar.tsx`)
* **Purpose:** Filter input for destinations and places on Explore and Saved screens.
* **Features:** Leading search icon, trailing clear button with hitSlop, auto-correction disabled, `returnKeyType="search"`.
* **Usage Guidance:** Connects directly to memoized search filter strings in real time.

---

### 5. Chip (`Chip.tsx`)
* **Purpose:** Category filter pill for horizontal scrollable filters.
* **Variants:**
  * Unselected: `#FFFFFF` surface, `#E5E5E2` border, `#666666` text.
  * Selected: `#111111` surface, `#111111` border, `#F7F7F5` text.
* **Features:** Optional count badge (e.g. `(4)`) with contextual text color, selection haptic feedback.
* **Interaction States:** Pressed (`opacity: 0.75, scale: 0.97`).

---

### 6. Badge (`Badge.tsx`)
* **Purpose:** Compact categorical tag for places and classifications.
* **Variants:** `default` (white), `subtle` (light gray), `dark` (obsidian), `success` (green), `warning` (amber), `error` (crimson), `info` (cobalt).
* **Typography:** `caption` (11 pt, Semi-Bold, uppercase).

---

### 7. ConfidenceBadge (`ConfidenceBadge.tsx`)
* **Purpose:** Semantic verification dossier tag displaying backend identification certainty.
* **Status Mapping:**
  * `VERIFIED` → "Verified Match" (`#2D6A4F`, forest green dot & surface).
  * `PARTIAL` → "Partially Verified" (`#B5651D`, warm amber dot & surface).
  * `AI_UNVERIFIED` / `FAILED` → "Location Identified (AI Unverified)" (`#666666`, slate dot & surface).
  * `ALGORITHMIC` / `SKIPPED` → "Algorithmic Placement" (`#8A8A8A`, muted gray dot & surface).
* **Features:** 6×6pt colored dot, status text, and optional numerical confidence score separated by a middle dot (`· 95%`).

---

### 8. PlaceCard (`PlaceCard.tsx`)
* **Purpose:** Primary list item representing a discovered or saved point of interest.
* **Structure:**
  * Left: 72×72pt square photo thumbnail with fallback location icon.
  * Right: Uppercase category label, distance tag (`formatDistance`), title (`h3`), formatted address.
  * Bottom Row: Star rating with review count, inline bookmark toggle button, directions button.
* **Interaction States:** Pressed (`opacity: 0.92, scale: 0.99, borderColor: #111111`).
* **Usage Guidance:** Used across Results (Places tab), Explore (Discoveries list), and Saved (Travel Locker).

---

### 9. ImageCard (`ImageCard.tsx`)
* **Purpose:** Destination hero card for the primary verified destination.
* **Aspect Ratio:** Fixed 16:10 aspect ratio with dark scrim overlay (`rgba(0, 0, 0, 0.35)`).
* **Top Bar:** Houses the `ConfidenceBadge` and camera counter badge (`1 / 6`).
* **Bottom Bar:** Uppercase location subtitle with pin icon, destination title (`h1`, 26pt bold with text shadow).

---

### 10. StatCard (`StatCard.tsx`)
* **Purpose:** Metric card for practical travel intelligence (Optimal Window, Daily Budget, Stay Duration).
* **Structure:** Uppercase label (`10pt label`), prominent 18pt value (`h2`), supporting subtitle (`11pt`), optional leading icon.
* **Surface:** White surface with 1pt `borderSubtle` and `Shadows.subtle`.

---

### 11. SectionHeader (`SectionHeader.tsx`)
* **Purpose:** Visual divider separating editorial blocks.
* **Structure:** Uppercase eyebrow label (`label`), primary title (`h2`), optional right action label with hitSlop (e.g. "4 places").

---

### 12. TopBar (`TopBar.tsx`)
* **Purpose:** Persistent top navigation bar.
* **Features:** Safe-area aware (`useSafeAreaInsets().top`), optional back chevron button with light haptic, optional centered title, right action slot, brand title ("Travel AI", "Profile").
* **Surface:** `#F7F7F5` with 1pt `borderSubtle` bottom border.

---

### 13. BottomTabBar (`BottomTabBar.tsx`)
* **Purpose:** Persistent thumb-friendly bottom tab bar.
* **Tabs:** `Analyze`, `Explore`, `Saved`, `Profile`.
* **Visual States:** Active (`#111111` icon and bold label, 4×4pt active dot indicator below); Inactive (`#8A8A8A` icon and regular label).
* **Primary Anchor:** Analyze tab features an elevated 22pt icon (vs. 20pt) and subtle scale transform (`1.05`) when selected.

---

### 14. LoadingState (`LoadingState.tsx`)
* **Purpose:** Truthful pipeline loading screen component.
* **Motion:** Looping pulse on spinner container (`Animated.loop`, scale 1.0 → 1.06 over 1200ms); 150/250ms crossfade between rotating stage titles.
* **Telemetry:** Displays truthful stage title, subtitle, and optional cancel button.

---

### 15. EmptyState (`EmptyState.tsx`)
* **Purpose:** Zero-data state for empty searches, empty travel locker, or missing coordinates.
* **Structure:** 54×54pt icon container, uppercase eyebrow, title (`h2`), description, and primary CTA button.

---

### 16. ErrorState (`ErrorState.tsx`)
* **Purpose:** Failure recovery card for network aborts, timeouts, or unresolved destinations.
* **Structure:** 54×54pt alert icon container with `errorSurface` and `errorBorder`, uppercase "NOTICE" eyebrow, title, friendly message, and side-by-side action buttons (Retry primary, Go Back outline).

---

### 17. Toast (`Toast.tsx`)
* **Purpose:** Floating feedback banner for confirmations and alerts.
* **Variants:** `info`, `success`, `warning`, `error`.
* **Elevation:** Utilizes `Shadows.elevated` with 1pt contextual border.

---

### 18. PlaceBottomSheet (`PlaceBottomSheet.tsx`)
* **Purpose:** Interactive gesture-driven bottom sheet on the exploration map.
* **Detent Snap States:**
  * **Peek (185pt + insets.bottom):** Drag handle, category badge, distance, thumbnail, place name, address, rating, and dual action buttons ("View Details", "Open in Maps").
  * **Expanded (420pt + insets.bottom):** Full address, formatted GPS coordinates (`formatCoordinates`), scrollable category pills, full place dossier action.
  * **Dismiss:** Drag down from peek state closes the sheet.
* **Physics:** Smooth spring physics (`damping: 24, stiffness: 220`) driven by native `PanResponder`.

---

### 19. MapMarker (`MapMarker.tsx`)
* **Purpose:** Custom vector map pin for interactive cartography.
* **Variants:**
  * **Primary Destination Pin:** 30×30pt dark obsidian circle (`#111111`) with pure white star icon; enlarges to 36×36pt with a 48×48pt halo (`rgba(17, 17, 17, 0.16)`) when selected.
  * **Nearby POI Pin:** 18×18pt slate circle (`#666666`) with centered white dot; enlarges to 26×26pt dark obsidian circle with a 38×38pt halo (`rgba(17, 17, 17, 0.14)`) when selected.

---

## H. Cards & Content Surfaces

```text
┌─────────────────────────────────────────────────────────────┐
│                   IMAGE CARD (HERO PHOTO)                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [CONFIDENCE BADGE]                        [CAMERA: 1/6] │ │
│ │                                                         │ │
│ │                                                         │ │
│ │ 📍 LOCATION SUBTITLE (CITY, COUNTRY)                    │ │
│ │ Primary Destination Title                               │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                 EVIDENCE & SUMMARY SURFACES                 │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🛡️ IDENTIFICATION EVIDENCE                              │ │
│ │ Visual landmark verified via Gemini Multimodal Vision.  │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ABOUT THE DESTINATION                                   │ │
│ │ Comprehensive travel summary and geographic context.    │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    TRAVEL STATS 2x2 GRID                    │
│ ┌───────────────────────────┐ ┌───────────────────────────┐ │
│ │ 📅 OPTIMAL WINDOW         │ │ 💳 DAILY BUDGET           │ │
│ │ May – September           │ │ $140 / day                │ │
│ └───────────────────────────┘ └───────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Hierarchy & Padding
* **Card Canvas:** All cards use `Colors.surface` (`#FFFFFF`), `Radius.xl` (12 pt), and 1pt `Colors.borderSubtle` (`#E5E5E2`).
* **Elevation:** Flat 1pt borders are standard. `Shadows.subtle` is applied to list cards; `Shadows.card` is applied to hero photography.
* **Press Response:** Tappable cards scale down to `0.99` with `borderFocus` (`#111111`) outline.

---

## I. Navigation Design

The mobile navigation shell implements a persistent 4-tab thumb navigation bar combined with a native stack navigator (`expo-router`):

```text
Root Stack Navigator
├── (tabs) [Bottom Tab Navigator]
│   ├── index (Analyze)   ── Tab Root
│   ├── explore (Explore) ── Tab Root
│   ├── saved (Saved)     ── Tab Root
│   └── profile (Profile) ── Tab Root
├── analyze/processing    ── fullScreenModal (fade animation)
├── analyze/results       ── stack push (fade animation)
├── analyze/map           ── stack push (slide_from_right animation)
└── place/[id]            ── modal presentation (slide_from_bottom animation)
```

### Tab Bar Behavior
* **Active State:** `#111111` icon, bold 10pt label, centered 4×4pt active dot.
* **Inactive State:** `#8A8A8A` icon, regular 10pt label.
* **Haptic:** `hapticFeedback.selection()` triggered on every tab change.
* **Safe Area:** `Math.max(insets.bottom, 8pt)` applied to guarantee clearance from home indicator.

---

## J. Forms & Input

### 1. Reel URL Input Canvas
* **Interaction:** Tapping input activates software keyboard; view shifts cleanly via `KeyboardAvoidingView` (`behavior="padding"` on iOS).
* **Auto-Clipboard Detection:** "Paste" button reads system clipboard via `expo-clipboard`. If a link matches `instagram.com/reel/`, it populates the field and fires a light haptic.
* **Client-Side Validation:** Validated immediately using `validateReelUrl`:
  * Empty input: *"Paste an Instagram Reel URL first."*
  * Non-reel Instagram link: *"Please provide an Instagram Reel link, not a photo post or story."*
  * Instagram profile: *"Please provide a direct Reel link, not a user profile."*
  * Valid Reel: Auto-normalizes `https://` protocol and proceeds to processing.

### 2. Search & Filter Inputs
* Instant real-time filtering without debounce lag.
* Search inputs provide quick clear buttons (`close-circle`) with 8pt hitSlop.

---

## K. Loading & Processing States

### Truthful Telemetry Principles
1. **No Fabricated Percentages:** The pipeline never displays arbitrary progress percentages (e.g. 45% -> 80% -> 99%).
2. **Truthful Stage Messages:** Rotates every 6 seconds through the 4 genuine engine phases:
   * Stage 1: *"Ingesting Reel media..."* — Extracting video frames, OCR, audio & creator metadata.
   * Stage 2: *"Analyzing location clues..."* — Multimodal analysis of speech transcription, OCR & landmark visuals.
   * Stage 3: *"Resolving geographic candidates..."* — Matching coordinates and directory records via Google Places.
   * Stage 4: *"Synthesizing travel intelligence..."* — Curating seasonality windows, daily budget & surrounding points of interest.
3. **Elapsed Timer:** Displays real time elapsed in seconds (`Elapsed: 14s`) updated every 1s.
4. **Cold-Start Reassurance:** If analysis exceeds 35 seconds, an informational banner smoothly fades in (`Animated.timing` 400ms):
   > *"Multimodal analysis and Google Places resolution can take up to 60–90 seconds during heavy video processing or initial cold start."*
5. **Abort & Cancellation:** User can tap "Cancel Analysis" at any point, which triggers an `AbortController` cancellation, clears the store, and safely navigates back.

---

## L. Verification & Confidence Semantics

The semantic meaning of verification tiers is strictly preserved across cards, dossiers, badges, and map markers:

```text
┌─────────────────┬───────────┬───────────────────────────────────────────────┐
│ Status Tier     │ Accent    │ Ground Truth Meaning                          │
├─────────────────┼───────────┼───────────────────────────────────────────────┤
│ VERIFIED        │ #2D6A4F   │ Multimodal visual confirmation via Gemini or  │
│                 │ (Green)   │ high-certainty Places directory match.        │
├─────────────────┼───────────┼───────────────────────────────────────────────┤
│ PARTIAL         │ #B5651D   │ Landmark candidate matched via OCR/speech,    │
│                 │ (Amber)   │ but visual landmark verification was partial. │
├─────────────────┼───────────┼───────────────────────────────────────────────┤
│ AI_UNVERIFIED / │ #666666   │ Candidate detected from caption/speech clues, │
│ FAILED          │ (Slate)   │ but unconfirmed by visual verification.       │
├─────────────────┼───────────┼───────────────────────────────────────────────┤
│ ALGORITHMIC /   │ #8A8A8A   │ Geographic coordinate resolved by proximity   │
│ SKIPPED         │ (Muted)   │ clustering or algorithmic fallback.           │
└─────────────────┴───────────┴───────────────────────────────────────────────┘
```

* **Evidence Presentation:** The Results screen always surfaces `bestGuess.why` in a dedicated `Identification Evidence` card with a green shield icon.
* **Gemini Multimodal Note:** When Gemini vision fallback is used, a note row (`Ionicons sparkles`) specifies the exact reason.

---

## M. Maps & Bottom Sheets

### 1. Interactive Cartography (`TravelMap.tsx`)
* **Engine:** Native cartography using `react-native-maps` (`PROVIDER_DEFAULT`).
* **Bottom Edge Padding:** Map automatically applies `bottom: 210` edge padding to `fitToCoordinates` to guarantee pins are never hidden behind the bottom sheet peek preview.
* **Floating Controls:**
  * Top Left: Pin count badge (`#FFFFFF` pill with 11pt mono text).
  * Top Right: Recenter button (`#FFFFFF` 40×40 circle with `scan-outline` icon).
* **Gesture Controls:** Pinch-to-zoom, two-finger rotation, and tilt are enabled; compass and toolbar are hidden to preserve editorial minimalism.

### 2. Multi-Snap Bottom Sheet (`PlaceBottomSheet.tsx`)
* **Detent 1 (Peek - 185pt):** Rises when a marker is tapped. Shows thumbnail, title, category badge, distance, star rating, and dual CTAs ("View Details", "Open in Maps").
* **Detent 2 (Expanded - 420pt):** User swipes up to reveal full street address, formatted coordinates (`46.0037° N, 7.7491° E`), category pills, and full dossier action.
* **Dismissal:** Dragging downward from peek state dismisses the sheet and clears the active selection.

### 3. External Maps Handoff (`lib/maps.ts`)
Zero-client-key external map dispatching:
* **iOS:** Dispatches to Apple Maps scheme (`maps://?q=...&ll=lat,lng`) with web fallback.
* **Android:** Dispatches to Google Maps geo URI (`geo:lat,lng?q=lat,lng(Name)`) with web fallback.

---

## N. Motion & Interaction

### 1. Transitions
* **Modal Presentation:** Standard stack transitions use `fade` for processing and results, `slide_from_right` for map, and `slide_from_bottom` for place detail modal.
* **Stage Crossfade:** 150ms fade to opacity 0.3, followed by 250ms fade to opacity 1.0 when rotating stage messages.
* **Entrance Transitions:** Results and detail dossiers enter with a 280ms opacity fade.

### 2. Press Feedback Tokens
* **Standard Button:** `opacity: 0.85, transform: [{ scale: 0.985 }]`
* **Icon Button:** `opacity: 0.75, transform: [{ scale: 0.94 }]`
* **Card Surfaces:** `opacity: 0.92, transform: [{ scale: 0.99 }]`
* **Chips & Tabs:** `opacity: 0.75, transform: [{ scale: 0.96–0.97 }]`

---

## O. Haptics

Haptics are managed exclusively via `mobile/lib/haptics.ts` wrapping `expo-haptics`:

| Utility Method | Haptic Pattern | Usage in Travel AI |
| :--- | :--- | :--- |
| `hapticFeedback.light()` | `ImpactFeedbackStyle.Light` | Button press, clear input, paste button, sheet collapse, recenter map, back navigation. |
| `hapticFeedback.medium()` | `ImpactFeedbackStyle.Medium` | URL validation error, network error, analysis failure. |
| `hapticFeedback.selection()`| `selectionAsync()` | Bottom tab switch, category chip toggle, map marker selection, sheet expand. |
| `hapticFeedback.success()` | `NotificationFeedbackType.Success` | Successful analysis completion transitioning to Results. |

*Web Guard:* When running on web or unsupported simulators, all haptic calls safely no-op without runtime errors.

---

## P. Accessibility

The mobile application implements practical mobile accessibility patterns:
* **Touch Targets:** Minimum 44×44pt (iOS) / 48×48pt (Android) enforced across all components.
* **Accessibility Labels:** Explicit `accessibilityLabel` on all interactive buttons, inputs, tabs, chips, and cards.
* **Accessibility Roles:** Elements declare semantic roles: `accessibilityRole="button"`, `accessibilityRole="search"`, `accessibilityRole="progressbar"`, `accessibilityRole="alert"`, `accessibilityRole="text"`.
* **Accessibility States:** Interactive components declare `accessibilityState={{ disabled, busy, selected }}`.
* **Readable Contrast:** Primary obsidian text (`#111111`) on alabaster canvas (`#F7F7F5`) achieves a contrast ratio of >14:1, exceeding WCAG AAA.
* **Keyboard Management:** `KeyboardAvoidingView` on iOS, `keyboardDismissMode="on-drag"`, tap-outside dismissal via `TouchableWithoutFeedback`.
* **Safe Area Handling:** Comprehensive safe-area insets applied to top bars, tab bars, and bottom sheets via `react-native-safe-area-context`.

---

## Q. Responsive & Platform Behavior

| Feature / Area | iOS Behavior | Android Behavior | Web Fallback |
| :--- | :--- | :--- | :--- |
| **Sans Typography** | Apple System (San Francisco) | Google Roboto | System sans-serif |
| **Mono Typography** | Apple Menlo | Native monospace | Monospace |
| **Touch Targets** | Minimum 44×44 pt | Minimum 48×48 pt | 44×44 px |
| **External Maps** | Apple Maps (`maps://`) | Google Maps (`geo:`) | Google Maps web URL |
| **Keyboard Avoiding** | `behavior="padding"` | `behavior={undefined}` (resize) | Disabled |
| **Cartography** | Apple Maps provider | Google Maps provider | Disabled / placeholder |
| **Haptic Feedback** | Taptic Engine | Vibration motor | Silent no-op |
| **Modal Presentation** | Native iOS detent modal | Full-screen stack push | Dialog overlay |

---

## R. Design Do / Don't Rules

### DO
* **DO** use the warm alabaster canvas (`Colors.canvas = '#F7F7F5'`) for all screen backgrounds.
* **DO** keep primary buttons solid obsidian (`#111111`) with pure canvas text (`#F7F7F5`).
* **DO** preserve semantic verification colors strictly: Green for Verified, Amber for Partial, Slate for AI Unverified.
* **DO** use monospaced typography (`Typography.mono`) for coordinates, distance tags, and timers.
* **DO** maintain 4pt grid alignment (`Spacing` tokens 4 to 64 pt).
* **DO** provide immediate tactile feedback (`hapticFeedback`) on all primary touch interactions.
* **DO** preserve truthful loading states with live elapsed counters.

### DON'T
* **DON'T** introduce arbitrary hex colors, saturated brand accents, or bright primaries outside `theme.ts`.
* **DON'T** use multi-color gradients or glassmorphism blurs.
* **DON'T** create fake progress bars that simulate progress percentages.
* **DON'T** invent new font families; rely exclusively on the implemented system font hierarchy.
* **DON'T** create cards with heavy, dramatic drop shadows; use 1pt hairline borders (`#E5E5E2`).
* **DON'T** place interactive controls with hit areas smaller than 44×44 pt without `hitSlop`.
* **DON'T** crowd the interface; negative space is an active design element.

---

## S. Design Tokens Reference

A developer quick reference derived directly from `mobile/constants/theme.ts`:

### Colors (`Colors`)
```typescript
canvas:              '#F7F7F5'
surface:             '#FFFFFF'
surfaceSubtle:       '#F0F0ED'
surfaceDark:         '#111111'
surfaceDarkElevated: '#181818'

textPrimary:         '#111111'
textSecondary:       '#666666'
textMuted:           '#8A8A8A'
textInverse:         '#F7F7F5'

borderSubtle:        '#E5E5E2'
borderFocus:         '#111111'
borderAccent:        '#C2CBD3'

verified:            '#2D6A4F'
verifiedSurface:     'rgba(45, 106, 79, 0.08)'
verifiedBorder:      'rgba(45, 106, 79, 0.20)'

partial:             '#B5651D'
partialSurface:      'rgba(181, 101, 29, 0.08)'
partialBorder:       'rgba(181, 101, 29, 0.20)'

aiUnverified:        '#666666'
aiUnverifiedSurface: '#F0F0ED'
aiUnverifiedBorder:  '#E5E5E2'

algorithmic:         '#8A8A8A'
algorithmicSurface:  '#F0F0ED'
algorithmicBorder:   '#E5E5E2'

error:               '#C1292E'
errorSurface:        'rgba(193, 41, 46, 0.06)'
errorBorder:         'rgba(193, 41, 46, 0.20)'

info:                '#4A6FA5'
infoSurface:         'rgba(74, 111, 165, 0.08)'
infoBorder:          'rgba(74, 111, 165, 0.20)'
```

### Spacing (`Spacing`)
```typescript
xs: 4,  sm: 8,  md: 12,  base: 16,  lg: 20,  xl: 24,  xxl: 32,  xxxl: 40,  huge: 48,  massive: 64
```

### Radius (`Radius`)
```typescript
sm: 4,  md: 6,  lg: 8,  xl: 12,  xxl: 16,  full: 9999
```

### Typography (`Typography`)
```typescript
display:   { fontSize: 32, lineHeight: 38, fontWeight: '700', letterSpacing: -0.8 }
h1:        { fontSize: 26, lineHeight: 32, fontWeight: '600', letterSpacing: -0.6 }
h2:        { fontSize: 20, lineHeight: 26, fontWeight: '600', letterSpacing: -0.4 }
h3:        { fontSize: 16, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2 }
body:      { fontSize: 15, lineHeight: 22, fontWeight: '400' }
bodySmall: { fontSize: 13, lineHeight: 18, fontWeight: '400' }
caption:   { fontSize: 12, lineHeight: 16, fontWeight: '500' }
label:     { fontSize: 10, lineHeight: 14, fontWeight: '700', letterSpacing: 1.2 }
mono:      { fontSize: 12, lineHeight: 16, fontWeight: '500' }
```

### Touch Targets (`TouchTarget`)
```typescript
minWidth:  Platform.OS === 'ios' ? 44 : 48
minHeight: Platform.OS === 'ios' ? 44 : 48
```

### Durations (`Duration`)
```typescript
fast: 150,  normal: 250,  slow: 350
```
