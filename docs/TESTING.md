# Travel AI — Test Suite & Quality Assurance Guide

This document describes all automated test suites, typechecks, and boundary validations across the Travel AI repository.

---

## 1. Automated Test Suites Overview

| Suite | Scope | Framework | Location | Test Count | Status |
|---|---|---|---|---|---|
| **Engine Core & Pipeline** | FastAPI, Gemini Verifier, OCR, Places, Security, Observability | Pytest | `engine/tests/` | 184 passed (25 subtests) | **PASSING** |
| **Mobile Supabase & Cloud** | Client boundary, RLS contracts, History, Saved Places, Isolation, URL Guards | Standalone TSX | `mobile/lib/supabase/__tests__/` | 45 passed | **PASSING** |
| **Mobile Auth Parser** | Deep link URL parser, PKCE & token extraction, cancellation handling | Node.js Assert | `mobile/scripts/test-auth-parser.js` | 7 passed | **PASSING** |
| **Mobile TypeScript** | Static type checking across routes, navigation, and stores | TypeScript 6.0 | `mobile/tsconfig.json` | 0 errors | **PASSING** |
| **Mobile Android Bundle** | Static export and Hermes bytecode packaging | Expo CLI | `mobile/` | 1446 modules bundled | **PASSING** |

---

## 2. Running Automated Tests

### A. Engine Backend Tests (Python)
Run pytest with `PYTHONPATH` set to the repository root:

```powershell
# Windows PowerShell
$env:PYTHONPATH="d:\CONNECT\travel-ai;d:\CONNECT\travel-ai\engine"; pytest engine/tests -q
```

```bash
# Linux / macOS
PYTHONPATH=".:engine" pytest engine/tests -q
```

**Key Areas Verified:**
- `test_gemini_verifier.py`: Visual and contextual verification fallbacks
- `test_stage5_google_places_hardening.py`: Nearby searches, field masks, place details
- `test_stage10_observability.py`: Tracing, request IDs, sanitized logs
- `test_stage12_security.py`: Rate limiting, body size limits, CORS headers, security headers
- `test_v2_supabase_schema.py`: Supabase database schema type contracts

---

### B. Mobile Supabase & Data Layer Tests (TypeScript)
Run the self-contained Supabase boundary and regression suite:

```bash
npx --yes tsx mobile/lib/supabase/__tests__/run-tests.ts
```

**Key Areas Verified:**
- **Client Configuration:** Environment variable loading, public-key guard, lazy initialization.
- **Data Mapping:** Reel shortcode extraction, thumbnail normalization, rating and confidence clamping.
- **Cloud History Persistence:**
  - Guest analyses skip cloud writes with zero database calls.
  - Authenticated analyses write parent record followed by child places.
  - Partial failure deletes orphaned parent record under RLS.
  - Coalesces rapid duplicate callbacks and component re-renders.
- **Saved Places:**
  - Enforces uniqueness via database constraint upsert on `(user_id, place_id)`.
  - Honest error propagation: network/database failure never displays false "Saved" UI state.
- **Guest → Auth Flow State Machine:**
  - Guest analysis retains result without cloud history.
  - Guest tap Save records in-memory pending action.
  - Successful auth executes pending save without re-analyzing Reel.
  - Modal dismissal or cancellation purges pending action.
- **Multi-Tenant Account Isolation:**
  - User B cannot see or delete User A's places.
  - Sign-out completely purges cache and memory map.
  - User A data restored upon signing back in.
- **Production URL Guards:**
  - Rejects loopback (`localhost`, `127.0.0.1`, `10.0.2.2`).
  - Rejects private LAN addresses (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`).
  - Rejects insecure `http://` for release builds.

---

### C. Mobile Auth URL Parser Tests (JavaScript)
Run the standalone redirect parser test suite:

```bash
node mobile/scripts/test-auth-parser.js
```

**Key Areas Verified:**
- PKCE authorization code grant extraction (`?code=...`)
- Implicit token grant extraction (`#access_token=...&refresh_token=...`)
- OAuth error responses (`?error=...&error_description=...`)
- Apple ID authorization code grant
- Apple user cancellation handling

---

### D. TypeScript Static Typecheck
Verify strict typing across all Expo Router routes and library code:

```bash
cd mobile
npx tsc --noEmit
```

---

### E. Android Release Bundle Verification
Verify that the mobile application bundles cleanly into Hermes bytecode:

```bash
cd mobile
npx expo export -p android --output-dir dist
```

---

## 3. Manual Verification Matrix

The following items cannot be fully automated from the repository and require physical devices or cloud console verification:

| ID | Item | Procedure | Expected Result | Status |
|---|---|---|---|---|
| **MAN-01** | Google OAuth Live Flow | Tap Google Sign In on physical device | In-app browser opens Google login; redirects to app with active session | MANUAL VERIFICATION REQUIRED |
| **MAN-02** | Apple OAuth Live Flow | Tap Apple Sign In on iOS/Android | Apple login sheet/browser completes sign in cleanly | MANUAL VERIFICATION REQUIRED |
| **MAN-03** | Guest → Auth Preservation | Analyze Reel as guest -> Save -> Sign In | Saved place appears in Saved Places; Reel not re-analyzed | MANUAL VERIFICATION REQUIRED |
| **MAN-04** | Two-Device Synchronization | Login on Device A and Device B; save place on A | Focus or pull-to-refresh on Device B shows saved place | MANUAL VERIFICATION REQUIRED |
| **MAN-05** | Production Backend | Deploy FastAPI to HTTPS hosting | `curl https://<backend>/health` returns `status: ok` | MANUAL VERIFICATION REQUIRED |
| **MAN-06** | Android APK Installation | Install preview APK generated by EAS | App launches to home screen with smooth UI | MANUAL VERIFICATION REQUIRED |
