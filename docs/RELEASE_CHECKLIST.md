# Travel AI — Android Release Checklist

**Application:** Travel AI  
**Package Identifier:** `com.travelai.mobile`  
**Target Platform:** Android (Google Play Console)  
**Version:** `1.0.0`  
**VersionCode:** `1`

---

## 1. Release Configuration Overview

- **Android Application ID:** `com.travelai.mobile`
- **Expo SDK Version:** `57.0.x`
- **React Native Version:** `0.86.3`
- **Architecture:** Hermes JavaScript Engine with Bytecode Bundling
- **Signing Key:** Managed via EAS Credentials or local Keystore (never committed to repository)
- **Deep Link Scheme:** `travelai://`
- **OAuth Callback Route:** `travelai://auth/callback`

---

## 2. Pre-Release Verification Checklist

### A. Environment & Secrets Audit
- [ ] No `.env` or `.env.local` files tracked in Git (`git ls-files "*env*"` verified).
- [ ] No Supabase `service_role` keys present in mobile client code or assets.
- [ ] No Google Cloud Client Secrets or Apple `.p8` private keys inside mobile client code.
- [ ] Production build environment points to valid HTTPS endpoint (`EXPO_PUBLIC_API_URL=https://...`).
- [ ] Production URL validation guards active (rejects localhost and private LAN IPs).

### B. Automated Test & Build Gates
- [ ] Backend test suite passing: `$env:PYTHONPATH="...;.../engine"; pytest engine/tests -q` (184 passed).
- [ ] Supabase boundary & regression suite passing: `npx --yes tsx mobile/lib/supabase/__tests__/run-tests.ts` (45 passed).
- [ ] Auth redirect parser suite passing: `node mobile/scripts/test-auth-parser.js` (7 passed).
- [ ] Mobile TypeScript compilation passing: `npx tsc --noEmit` (0 errors).
- [ ] Static export and Hermes bytecode bundling passing: `npx expo export -p android`.

### C. Build Generation
- [ ] Generate preview APK for internal device testing:
  ```bash
  cd mobile
  eas build --platform android --profile preview
  ```
- [ ] Generate production Android App Bundle (AAB):
  ```bash
  cd mobile
  eas build --platform android --profile production
  ```

---

## 3. Device Smoke Test Checklist (Physical Device)

### A. Installation & First Launch
- [ ] Install preview APK onto physical Android test device.
- [ ] Launch app: Splash screen displays `#F7F7F5` background with centered logo without visual distortion.
- [ ] App arrives on main Analyze screen without login wall (Guest mode default).
- [ ] Status indicator shows "Engine Ready" when backend is reachable.

### B. Guest Experience & Analysis
- [ ] Enter a valid public Instagram travel Reel URL.
- [ ] Tap "Analyze this reel": Progress transitions smoothly through download, OCR, audio, and Places verification.
- [ ] Results screen presents destination name, hero image, confidence badge, travel tips, and nearby places.
- [ ] Verify no cloud History entry was created in Supabase for the guest.

### C. Guest → Auth Preservation Flow
- [ ] On the analysis results screen, tap the Bookmark / Save icon.
- [ ] App opens Account sign-in sheet/screen.
- [ ] Complete Google or Apple OAuth sign-in.
- [ ] App returns to Results screen or Profile with active session.
- [ ] Verify the bookmarked destination appears in the Saved tab.
- [ ] Verify the Reel was **NOT** re-analyzed.

### D. Authentication Cancellation Safety
- [ ] As a guest, tap Bookmark / Save on any place.
- [ ] When Account sign-in opens, dismiss or tap Close.
- [ ] Verify no place is saved and no pending action executes later.

### E. Cloud History & Deletion
- [ ] Analyze a Reel while authenticated.
- [ ] Navigate to Profile > Analysis History.
- [ ] Verify the new analysis record is listed with destination, thumbnail, date, and confidence.
- [ ] Tap into the analysis record: Full dossier details load correctly.
- [ ] Tap delete on the analysis: Confirms deletion; record is removed from list and Supabase cloud.

### F. Saved Places & Multi-Device Synchronization
- [ ] Bookmark multiple places with different categories (Attractions, Dining).
- [ ] Navigate to Saved tab: Places are listed with category filter chips and total count.
- [ ] Tap directions: Opens external maps application (Google Maps).
- [ ] Unsave a place: Removed immediately with haptic confirmation.
- [ ] Close and restart app: Saved places reload from cache and cloud.
- [ ] Sign in to same account on Device B: Saved places and history synchronize on focus.

### G. Account Isolation
- [ ] In Profile, tap "Sign Out".
- [ ] Verify user session is cleared.
- [ ] Verify Saved Places cache is purged and History reverts to guest prompt.
- [ ] Sign in with a different user account: Only the new user's records are displayed.

---

## 4. Google Play Store Assets Checklist

- [ ] **App Icon:** 512x512 PNG (32-bit color, no transparency) present at `assets/images/icon.png`.
- [ ] **Adaptive Icon:** Foreground and background layers present in `assets/images/android-icon-*`.
- [ ] **Feature Graphic:** 1024x500 PNG banner prepared.
- [ ] **Screenshots:** Minimum 4 phone screenshots (1080x2400 or 1080x1920) capturing:
  1. Analyze Screen (Reel URL input with editorial styling)
  2. Processing Screen (Real-time verification stages)
  3. Destination Dossier (Verified photography and travel tips)
  4. Exploration Map & Saved Places Locker
- [ ] **App Title:** Travel AI — Reel to Destination
- [ ] **Short Description:** Extract verified travel locations, coordinates, and guides from Instagram Reels.
- [ ] **Full Description:** Comprehensive product summary adhering to Google Play policies.
- [ ] **Privacy Policy URL:** Publicly accessible HTTPS privacy policy URL.
- [ ] **Data Safety Form:** Disclose that location queries and user email (for auth) are collected and encrypted in transit.
