# Travel AI — Mobile Authentication Architecture & External Setup Guide

**Architecture:** Expo / React Native (`mobile`) + Supabase Auth (`supabase-js`)  
**Deep Link Scheme:** `travelai://`  
**Callback Route:** `travelai://auth/callback`  
**Security Boundary:** Client-side credentials strictly restricted to public URL and publishable/anon key. Zero third-party secrets, service-role keys, or private keys in the mobile application.

---

## 1. Authentication Architecture

The Travel AI mobile client integrates authentication via **Supabase Auth** leveraging:
- `expo-web-browser`: Launches secure in-app authentication sessions (`WebBrowser.openAuthSessionAsync`).
- `expo-linking`: Registers and resolves deep-link callbacks (`travelai://auth/callback`).
- `@supabase/supabase-js`: Handles PKCE authorization code exchange (`exchangeCodeForSession`), session token storage, automatic JWT token refreshes, and state broadcasting via `onAuthStateChange`.
- `@react-native-async-storage/async-storage`: Encrypted persistent storage for session tokens.

```mermaid
sequenceDiagram
    autonumber
    actor User as Traveler
    participant App as Mobile App (Expo)
    participant Browser as In-App Browser (WebBrowser)
    participant Supabase as Supabase Auth Server
    participant Provider as Google / Apple OAuth

    User->>App: Tap "Sign in with Google / Apple"
    App->>Supabase: signInWithOAuth({ provider, redirectTo: 'travelai://auth/callback' })
    Supabase-->>App: Return authorization URL
    App->>Browser: openAuthSessionAsync(authUrl, redirectUrl)
    Browser->>Provider: User authenticates with OAuth Provider
    Provider-->>Supabase: Provider redirects to Supabase Callback
    Supabase-->>Browser: Redirects to travelai://auth/callback?code=...
    Browser-->>App: Intercept redirect & extract PKCE code
    App->>Supabase: exchangeCodeForSession(code)
    Supabase-->>App: Session JWT & Refresh Token
    App->>App: Persist tokens to AsyncStorage & trigger onAuthStateChange
    Note over App: Execute any pending guest save action & sync cache
```

---

## 2. Google OAuth Configuration (MANUAL ACTION REQUIRED)

### Step A: Google Cloud Console Configuration
1. Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project or create a new project (e.g. `Travel AI Engine`).
3. Navigate to **APIs & Services** > **OAuth consent screen**:
   - User Type: **External**
   - App name: `Travel AI`
   - User support email: Select your developer email
   - Developer contact email: Enter your contact email
   - Scopes: Add `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `openid`
4. Navigate to **APIs & Services** > **Credentials**:
   - Click **Create Credentials** > **OAuth client ID**.
   - Application type: **Web application** (NOTE: Use Web application because Supabase Auth acts as the web OAuth server callback handler).
   - Name: `Travel AI Supabase Web Client`
   - **Authorized JavaScript origins**:
     - `https://<YOUR-SUPABASE-PROJECT-ID>.supabase.co`
   - **Authorized redirect URIs**:
     - `https://<YOUR-SUPABASE-PROJECT-ID>.supabase.co/auth/v1/callback`
5. Save and copy the generated **Client ID** and **Client Secret**.

### Step B: Supabase Dashboard Configuration
1. Open the [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. Navigate to **Authentication** > **Providers**.
3. Locate **Google** and toggle **Enable Google provider**:
   - **Client ID**: Paste the Web Client ID from Google Cloud Console.
   - **Client Secret**: Paste the Client Secret from Google Cloud Console.
4. Click **Save**.

### Step C: Mobile Deep Link Verification in Supabase
1. Navigate to **Authentication** > **URL Configuration**.
2. Under **Redirect URLs**, add:
   - `travelai://auth/callback`
   - `exp://*` (for Expo Go local testing if applicable)
3. Set **Site URL** to:
   - `https://<YOUR-SUPABASE-PROJECT-ID>.supabase.co`

---

## 3. Apple OAuth Configuration (MANUAL ACTION REQUIRED)

### Step A: Apple Developer Portal Configuration
1. Sign in to your [Apple Developer Account](https://developer.apple.com/account/).
2. Navigate to **Certificates, Identifiers & Profiles** > **Identifiers**.
3. Ensure your Primary App ID exists:
   - Identifier: `com.travelai.mobile`
   - Capabilities: Enable **Sign in with Apple**.
4. Create a **Services ID** for the web redirect:
   - Click **+** to add a new identifier, select **Services IDs**.
   - Description: `Travel AI Mobile Sign In`
   - Identifier: `com.travelai.mobile.signin` (or similar reversed domain).
   - Enable **Sign in with Apple**, click **Configure**:
     - Primary App ID: Select `com.travelai.mobile`.
     - Domains and Subdomains: `<YOUR-SUPABASE-PROJECT-ID>.supabase.co` (without `https://`).
     - Return URLs: `https://<YOUR-SUPABASE-PROJECT-ID>.supabase.co/auth/v1/callback`
5. Create a Private Signing Key:
   - Navigate to **Keys** > Click **+**.
   - Key Name: `Travel AI Sign In Key`.
   - Enable **Sign in with Apple**, click **Configure**, and choose your Primary App ID.
   - Download the `.p8` key file. (NOTE: Can only be downloaded once).
   - Note the **Key ID** and your Apple **Team ID**.

### Step B: Supabase Dashboard Configuration
1. In the Supabase Dashboard, go to **Authentication** > **Providers** > **Apple**.
2. Toggle **Enable Apple provider**:
   - **Services ID**: `com.travelai.mobile.signin`
   - **Team ID**: Your 10-character Apple Developer Team ID
   - **Key ID**: The 10-character Key ID for the downloaded `.p8` key
   - **Secret Key (.p8 contents)**: Open the `.p8` file and paste the entire private key contents (including `-----BEGIN PRIVATE KEY-----`).
3. Click **Save**.

---

## 4. Mobile Session Lifecycle & State Management

1. **Boot Session Restoration**:
   - In `AuthContext.tsx`, `initializeAuth()` queries `supabase.auth.getSession()` on app launch.
   - Restores persisted tokens from `@react-native-async-storage/async-storage`.
   - If unauthenticated, sets `user: null`, `isAuthenticated: false` and enables guest mode.

2. **Reactive State Synchronisation**:
   - `supabase.auth.onAuthStateChange((event, currentSession) => { ... })` updates React state immediately across all tab screens.
   - On `SIGNED_OUT`:
     - Clears local storage cache via `clearSavedPlacesCache()`.
     - Clears pending in-memory actions via `clearPendingSaveAction()`.
     - Resets history debounce guards via `resetHistorySaveGuards()`.

3. **Multi-User Isolation**:
   - Whenever `user?.id` changes in `useSavedPlaces`, the previous user's cached places are purged before the new user's cloud records are retrieved.
   - Cross-account memory contamination is impossible.

---

## 5. Manual Verification Checklist

- [ ] **Google OAuth Sign-In**:
  - Open app as guest.
  - Navigate to Profile > Tap "Sign in with Google".
  - In-app browser displays Google consent screen.
  - Complete sign-in: Redirects back to app; Profile displays user name and email.
- [ ] **Google Sign-Out & Sign-In Again**:
  - Tap "Sign Out" in Profile.
  - Verify Profile reverts to guest state and Saved Places local cache is purged.
  - Tap "Sign in with Google" again: Session restores cleanly.
- [ ] **Apple OAuth Sign-In**:
  - Tap "Sign in with Apple".
  - Browser/sheet shows Apple authorization dialog.
  - Authorize: Redirects to app; session establishes.
- [ ] **Guest → Auth Pending Action Preservation**:
  - As guest, analyze any Instagram Reel.
  - On Results screen, tap Save icon on a destination.
  - App opens Login prompt.
  - Complete Google or Apple authentication.
  - Verify app returns to dossier or profile and the saved place is present in Saved Places.
  - Verify the Reel was NOT re-analyzed.
- [ ] **Cancellation Safety**:
  - As guest, tap Save on a destination.
  - On Login prompt, dismiss or tap close without authenticating.
  - Verify no place is saved and no pending action executes later.
