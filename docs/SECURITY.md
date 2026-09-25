# Travel AI — Security and Secrets-Handling Guide

- **Document Role:** Authoritative Security, Privacy, and Secrets Policy
- **Repository:** Travel AI (`travel-ai`)
- **Primary Surfaces:** React Native Mobile Client (`mobile/`) & FastAPI Intelligence Engine (`engine/`)
- **Status:** Canonical Operating Standard

---

## 1. Security Objectives

Travel AI transforms unstructured public Instagram Reels into verified real-world destinations, travel dossiers, interactive cartography, and offline bookmarks. The primary security objectives are:

1. **Protect Third-Party Credentials:** Secure backend API keys (`GOOGLE_PLACES_API_KEY`, `GEMINI_API_KEY`) against exposure to client applications, source control, build artifacts, and client network logs.
2. **Enforce Trust Boundaries:** Maintain strict isolation between untrusted client environments (iOS/Android devices, web browsers) and trusted server infrastructure (FastAPI engine).
3. **Input Sanitization & Injection Defense:** Validate and sanitize all external inputs (Instagram URLs, photo references, navigation coordinates) before processing.
4. **Ephemeral Media Lifecycle:** Deterministically purge downloaded video media, extracted audio tracks, and sampled keyframes immediately after pipeline execution.
5. **Zero-Permission Client Privacy:** Enforce a minimal native permission footprint on mobile devices, ensuring zero invasive tracking or device access.
6. **Prevent Information Leakage:** Suppress internal stack traces, system paths, and credential fragments from user-facing error responses and logs.

---

## 2. Security & Trust Boundaries

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        UNTRUSTED USER ENVIRONMENT                       │
│  Public Instagram Reel URL · User Touch Inputs · External Map Handoffs  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     MOBILE CLIENT BOUNDARY (mobile/)                   │
│  • React Native · Expo SDK 57 · TypeScript                             │
│  • Client-side URL normalization & regex pre-validation                │
│  • Local offline storage (AsyncStorage) — Bookmarks only               │
│  • ZERO third-party credentials (NO Google / Gemini keys)              │
│  • Production Loopback Guard (__DEV__ check)                           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼ HTTPS REST Network Boundary (Encrypted)
┌────────────────────────────────────────────────────────────────────────┐
│                    TRUSTED BACKEND ENGINE (engine/)                    │
│  • FastAPI · Python 3.11+ · Uvicorn                                    │
│  • Server-side environment secrets (engine/.env)                       │
│  • Pydantic request schema validation                                  │
│  • Server-side Google Places Photo Proxy (/places/photo)               │
│  • Ephemeral temp filesystem (UUID-isolated downloads & cleanup)       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼ Upstream Encrypted API Requests (HTTPS)
┌────────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL UPSTREAM PROVIDERS                       │
│  • Instagram Media (yt-dlp ephemeral download · Public Reels only)     │
│  • Google Places API (X-Goog-Api-Key header · Ground truth resolution) │
│  • Google Gemini API (Multimodal vision verification & synthesis)      │
└────────────────────────────────────────────────────────────────────────┘
```

### Trust Assumptions:
* **Mobile Client is Untrusted:** The mobile app executes on user-controlled hardware. Any value compiled into or transmitted to the mobile client must be considered public.
* **Backend Engine is Trusted:** The FastAPI engine executes in a protected environment with exclusive access to third-party secrets.
* **External Providers are Partially Trusted:** Data returned from external scrapers and APIs is defensively validated and parsed before reaching the client.

---

## 3. Security Status Matrix

| Domain | Control Category | Status | Notes / Location |
| :--- | :--- | :--- | :--- |
| **Authentication** | User Accounts & Login | **Not Implemented** | Public MVP; no user accounts or OAuth exist. |
| **Authorization** | Role-Based Access (RBAC) | **Not Implemented** | All engine endpoints (`/analyze`, `/health`, `/places/photo`) are public. |
| **Client Secrets** | API Key Isolation | **Implemented** | Mobile client owns 0 third-party API keys. |
| **Device Permissions** | Manifest Footprint | **Implemented** | Manifest enforces `permissions: []` in `mobile/app.json`. |
| **Input Validation** | Reel URL Validation | **Implemented** | Client regex + server Pydantic validation. |
| **Photo Proxy** | Secret Masking | **Implemented** | `engine/app/api/analyze.py` proxies Places photos server-side. |
| **Media Hygiene** | Ephemeral Temp Cleanup | **Implemented** | Deterministic unlinking in pipeline `finally` blocks. |
| **Error Sanitization** | Leakage Prevention | **Implemented** | `mobile/lib/api/travel-ai.ts` strips stack traces & keys. |
| **CORS Policy** | Origin Hardening | **Implemented** | Wildcard `*` disables `allow_credentials` in `main.py`. |
| **Rate Limiting** | Abuse Prevention | **Not Implemented** | Must be enforced via reverse proxy in production. |
| **Transport Security** | Network Encryption | **Safeguarded** | `__DEV__` guard in `config.ts` rejects non-HTTPS in release. |

---

## 4. Mobile Application Security

### 4.1 Zero-Permission Native Footprint
The mobile client manifest strictly avoids requesting invasive OS permissions:
* `mobile/app.json` explicitly sets:
  ```json
  "android": {
    "permissions": []
  }
  ```
* **No Background Location / GPS:** The application does not track user coordinates. Exploration and map viewing are centered entirely on resolved destination coordinates.
* **No Camera Access:** No camera hardware permissions are declared.
* **No Microphone Access:** Audio transcription is executed server-side via Whisper; no device microphone access is requested.
* **No Contacts or Photo Library:** User contacts and photo libraries are never accessed.

### 4.2 Safe Native Device APIs
* **`expo-clipboard`:** Read access is initiated **only** upon explicit user tap of the "Paste" button or interaction prompt.
* **`expo-haptics`:** Native tactile feedback is guarded by `Platform.OS !== 'web'` checks and wraps calls in try-catch blocks to prevent crashes on unsupported devices.
* **`expo-linking`:** External map launches (Apple Maps vs. Google Maps) validate coordinates and encode query strings before invoking OS URL schemes.

### 4.3 Production Loopback Protection
`mobile/constants/config.ts` prevents accidental loopback connection attempts in compiled release builds:
```typescript
if (__DEV__) {
  // Local development defaults: localhost:8000 or 10.0.2.2:8000
  return envUrl || defaultLoopback;
}
// Production build (!__DEV__):
if (envUrl) {
  return envUrl; // Requires explicit configured URL
}
return ''; // Returns empty string to block silent loopback fallback
```

### 4.4 Local Storage Security
* Bookmarks are stored locally on the device using `@react-native-async-storage/async-storage`.
* No cloud synchronization, authentication tokens, or personal identifiers are stored.
* Storage hydration in `mobile/lib/storage/saved-places.ts` defensively validates schema properties, clamps numeric ratings (`0` to `5`), and discards corrupted records without crashing.

---

## 5. Backend & API Security

### 5.1 Request & Input Validation
1. **Instagram Reel URL Validation:**
   * Both client (`mobile/lib/utils.ts`) and backend (`engine/app/api/analyze.py`) validate Reel URLs against strict regular expressions:
     ```python
     INSTAGRAM_REEL_REGEX = re.compile(
         r"^https?://(?:www\.)?instagram\.com/(?:reel|reels)/([A-Za-z0-9_-]+)",
         re.IGNORECASE,
     )
     ```
   * Non-Reel URLs (photo posts `/p/`, user profiles, stories) are rejected with HTTP 400 Bad Request before invoking media downloaders.
2. **Photo Proxy Parameter Validation:**
   * In `engine/app/api/analyze.py`, the `/places/photo` endpoint requires `name` to start with `"places/"` after URL-decoding, preventing arbitrary URL fetching or SSRF (Server-Side Request Forgery).

### 5.2 Server-Side Photo Proxying
To display destination hero photography without exposing `GOOGLE_PLACES_API_KEY` to mobile clients or browser network inspectors, the FastAPI engine acts as a reverse proxy:
```text
Client Request:  GET /places/photo?name=places/ChIJ.../photos/AUacSh...
       │
       ▼
FastAPI Engine: Appends server-side GOOGLE_PLACES_API_KEY
       │        Calls https://places.googleapis.com/v1/{name}/media
       ▼
Client Response: Image bytes with public caching headers (Cache-Control: max-age=86400)
```

### 5.3 CORS Security
Configured in `engine/app/main.py`:
* Allowed origins are configurable via `CORS_ORIGINS`.
* If a wildcard (`*`) origin is specified, `allow_credentials` is automatically set to `False` to prevent credentialed cross-origin attacks.

### 5.4 Error Sanitization & Information Leakage
* **Backend Error Masking:** `engine/app/api/analyze.py` catches extraction and pipeline exceptions, logging only exception type names (`type(e).__name__`) and returning standardized HTTP details (`"Travel AI couldn't complete the analysis."`).
* **Mobile Client Defense:** `mobile/lib/api/travel-ai.ts` filters backend error messages, suppressing responses containing internal indicators:
  ```typescript
  const isLeakingInternal =
    backendMsg.includes('Traceback') ||
    backendMsg.includes('File "') ||
    backendMsg.includes('AIzaSy') ||
    backendMsg.includes('key=') ||
    backendMsg.includes('500:') ||
    backendMsg.length > 250;
  ```
  If detected, messages are replaced with safe generic user copy.

---

## 6. Secrets & Environment Management

### 6.1 Environment Variable Classification

| Variable | Target Layer | Sensitivity | Allowed on Client? | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GOOGLE_PLACES_API_KEY` | Backend (`engine/.env`) | **Critical** | **NEVER** | Resolves destination candidates and nearby places |
| `GEMINI_API_KEY` | Backend (`engine/.env`) | **Critical** | **NEVER** | Multimodal verification and travel briefing |
| `OPENWEATHER_API_KEY` | Backend (`engine/.env`) | **High** | **NEVER** | Weather and seasonal travel intelligence |
| `CORS_ORIGINS` | Backend (`engine/.env`) | **Low** | No | Allowed web origins |
| `EXPO_PUBLIC_API_URL` | Mobile (`mobile/.env`) | **Public** | **YES** | Target FastAPI URL (Compiled into client JS) |

> [!CAUTION]
> In Expo, any environment variable prefixed with `EXPO_PUBLIC_` is embedded directly into client-side JavaScript bundles and can be inspected by any user. **NEVER** prefix secret credentials with `EXPO_PUBLIC_`.

### 6.2 Source Control & `.gitignore` Rules
Both root `.gitignore` and `mobile/.gitignore` enforce strict exclusion of environment files:
```gitignore
.env
.env.local
.env.*
!.env.example
```
* Only `.env.example` templates containing dummy placeholder values may be committed to Git.
* Developers must never commit actual API keys or credentials.

### 6.3 Third-Party Credential Handling in Code
1. **Google Places API:**
   * Keys are loaded from `os.getenv("GOOGLE_PLACES_API_KEY")`.
   * Requests pass the credential via the `X-Goog-Api-Key` HTTP header rather than URL query parameters, preventing key exposure in web proxy or access logs.
2. **Gemini API:**
   * Configured via `genai.configure(api_key=self.api_key)`.
   * Exceptions are caught and logged by class name (`type(e).__name__`) to avoid leaking authorization details.
3. **Instagram / Media Extraction:**
   * Ingestion via `yt-dlp` accesses **public Instagram Reels only**.
   * No Instagram user credentials, passwords, or personal session cookies are required or stored.

---

## 7. Media Ingestion & Filesystem Hygiene

### 7.1 Ephemeral File Handling
The intelligence pipeline temporarily downloads media to perform transcription, OCR, and vision analysis:
* Downloads are stored in `engine/assets/downloads/` with randomized UUID filenames (`uuid.uuid4().hex`) to eliminate filename collision and path-traversal vulnerabilities.
* Extracted frames are stored temporarily in `engine/assets/frames/`.

### 7.2 Deterministic Cleanup Guarantees
Temporary files are aggressively purged across all execution paths:
1. **Successful Pipeline Run:** `LocationPipeline.run()` removes all extracted frames and the downloaded video file in its `finally` block (`_cleanup_temp_files`).
2. **Pipeline Exceptions:** `engine/app/api/analyze.py` wraps execution in an outer `finally` block that guarantees `vp.unlink(missing_ok=True)` if the pipeline fails unexpectedly.
3. **Aborted / Partial Downloads:** `InstagramYtDlpProvider._cleanup_partial_files(file_id)` unlinks partial `.part` and `.ytdl` files upon download failures.
4. **File Lock Prevention (Windows):** `cv2.VideoCapture` instances are explicitly released, and PIL image streams are loaded in memory (`with Image.open(...) as img: img.load()`) before unlinking.

### 7.3 Data Retention
* **Zero Long-Term Server Storage:** Video media, audio tracks, and extracted frames are not retained or archived on the backend.
* **No Video Hosting:** The application does not re-host, stream, or redistribute creator video files.
* **Client Bookmarks:** Persist solely within the user's local device storage (`AsyncStorage`) until manually deleted.

---

## 8. Network & Transport Security

### 8.1 Production HTTPS Mandate
* In production release builds, all communication between the mobile client and the FastAPI engine **must** utilize HTTPS.
* The mobile client strictly disables HTTP loopback defaults in non-development modes (`__DEV__ = false`).
* All external outbound requests from FastAPI (to Google Places, Gemini, and Instagram) use encrypted HTTPS connections with verified TLS certificates.

### 8.2 Client Timeout & Cancellation Safeguards
* **180s Analysis Timeout:** The client enforces a 180,000ms timeout budget via `HttpClient` in `mobile/lib/api/client.ts`.
* **Abort Signal Propagation:** When a user cancels processing or navigates away, `AbortController` signals propagate to terminate active network sockets immediately, preventing zombie server connections.
* **Retry Mutex Guards:** `mobile/app/analyze/processing.tsx` uses mutex refs to prevent concurrent duplicate submissions during network retries.

---

## 9. Current Limitations & Required Production Safeguards

### 9.1 Current Limitations
1. **Unauthenticated Engine Endpoints:** Endpoints are currently open to any client capable of reaching the backend URL.
2. **No Backend Rate Limiting:** The FastAPI engine does not currently contain internal token-bucket or IP rate limiters.
3. **No Web Application Firewall (WAF):** Protection against distributed denial-of-service (DDoS) attacks is not natively handled in code.

### 9.2 Required Production Safeguards
Before deploying the FastAPI engine to a public production URL, the following infrastructure safeguards are required:
1. **Reverse Proxy / API Gateway:** Deploy FastAPI behind Cloudflare, AWS API Gateway, NGINX, or Caddy.
2. **Edge Rate Limiting:** Enforce IP-based rate limiting (e.g., maximum 10 requests per minute per IP on `/analyze`) at the reverse proxy layer to prevent API key quota exhaustion.
3. **SSL/TLS Termination:** Ensure modern TLS 1.3 encryption with automatic certificate renewal.
4. **CORS Production Lockdown:** Restrict `CORS_ORIGINS` to verified production web domains if the legacy web client is deployed.
5. **DDoS Protection:** Enable Cloudflare or cloud provider DDoS mitigation to absorb traffic surges.

---

## 10. Pre-Release Security Checklist

Before building release binaries (`eas build --profile production`) or publishing backend updates, verify:

- [ ] **No Committed Secrets:** Run `git diff --check` and verify no `.env` files or API keys are tracked in Git.
- [ ] **API Key Isolation:** Inspect the compiled mobile bundle to ensure no instances of `GOOGLE_PLACES_API_KEY` or `GEMINI_API_KEY` exist.
- [ ] **Production API URL Configured:** Verify `EXPO_PUBLIC_API_URL` is set to an active HTTPS domain in EAS Secrets.
- [ ] **Zero Mobile Permissions:** Verify `mobile/app.json` contains `"permissions": []`.
- [ ] **Temp File Cleanup:** Verify backend disk storage does not accumulate orphaned `.mp4` or `.jpg` files during analysis load testing.
- [ ] **Backend Health Probe:** Check `/health` endpoint to ensure Places and Gemini API services report valid configurations.
- [ ] **Error Masking:** Test invalid Reel URLs and engine errors to confirm no stack traces or server paths reach the mobile UI.

---

## 11. Security Rules for AI Coding Agents

All AI coding agents operating within this repository must adhere to these rules:

1. **NEVER Move Backend Secrets to Mobile:** Do not import, reference, or declare `GOOGLE_PLACES_API_KEY` or `GEMINI_API_KEY` within `mobile/`. All external API access must be proxied through FastAPI.
2. **NEVER Prefix Backend Keys with `EXPO_PUBLIC_`:** Do not rename backend environment variables to start with `EXPO_PUBLIC_`.
3. **NEVER Hardcode Secrets in Code:** Do not embed API keys, access tokens, or private endpoints in source files.
4. **NEVER Remove Cleanup Code:** Do not remove or simplify `finally` blocks in `LocationPipeline` or `analyze.py` that handle temporary file unlinking.
5. **NEVER Remove Error Sanitizers:** Do not remove defensive error filtering in `mobile/lib/api/travel-ai.ts` or exception type logging in backend services.
6. **NEVER Declare Unnecessary Native Permissions:** Do not add permissions (location, camera, contacts) to `mobile/app.json` without explicit, justified user instruction.
7. **NEVER Commit `.env` Files:** Do not run `git add` on any `.env` file containing real credentials.
8. **NEVER Log Raw Authorization Headers:** Ensure all HTTP request and error logging strips API keys and authorization headers.

---

## 12. Vulnerability Reporting Guidance

If you discover a security vulnerability or credential leak within this repository:

1. **Do not create public GitHub issues** containing sensitive vulnerability details or active API keys.
2. Revoke and rotate any compromised API keys immediately via the Google Cloud Console or Google AI Studio.
3. Report the security finding privately to the repository maintainer.
4. Provide a reproduction script, description of the affected component, and suggested remediation steps.
