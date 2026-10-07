# Travel AI — Production Deployment & Configuration Guide

**Application:** Travel AI  
**Mobile Package:** `com.travelai.mobile`  
**Backend Service:** Travel AI FastAPI Engine (`engine`)  
**Database & Auth:** Supabase Cloud (`supabase`)

---

## 1. Production Architecture Overview

```mermaid
graph TD
    subgraph Mobile Client [Android Device - com.travelai.mobile]
        App[Travel AI Mobile App]
        SecureStore[AsyncStorage - Session Tokens]
        ConfigGuard[Production URL Validation Guard]
    end

    subgraph Production Cloud [HTTPS Infrastructure]
        Backend[FastAPI Engine - Python 3.12]
        HealthCheck["/health Endpoint"]
        RateLimiter[In-Memory Rate Limiter - 60 rpm]
        SecurityHeaders[Security Headers Middleware]
    end

    subgraph External APIs [External Providers]
        GooglePlaces[Google Places API (New)]
        Gemini[Google Gemini 2.5 Flash]
        OpenWeather[OpenWeather API]
    end

    subgraph Supabase Cloud [Supabase Project]
        AuthServer[Supabase Auth (Google & Apple OAuth)]
        Postgres[(PostgreSQL with RLS)]
    end

    App -->|HTTPS /analyze| ConfigGuard
    ConfigGuard -->|Rejects Loopback & Insecure HTTP| Backend
    App -->|Deep Link OAuth & JWT| AuthServer
    App -->|PostgREST RLS Queries| Postgres
    Backend --> GooglePlaces
    Backend --> Gemini
    Backend --> OpenWeather
```

---

## 2. Backend Engine Production Deployment

### A. Prerequisites & Environment Variables
The FastAPI engine requires the following environment variables in production:

| Variable | Description | Required | Example |
|---|---|---|---|
| `GOOGLE_PLACES_API_KEY` | Google Places API key for candidate resolution and photos | Yes | `AIzaSy...` |
| `GEMINI_API_KEY` | Google Gemini API key for visual verification | Optional (falls back to heuristic) | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini model name | No | `gemini-2.5-flash` |
| `OPENWEATHER_API_KEY` | Weather intelligence API key | No | `your_key_here` |
| `CORS_ORIGINS` | Comma-separated allowed web origins (mobile app does not enforce CORS) | Yes (if web client enabled) | `https://travelai.example.com` |
| `RATE_LIMIT_ENABLED` | Enables in-memory token bucket rate limiting | Yes | `true` |
| `RATE_LIMIT_PER_MINUTE` | Max requests allowed per minute per IP | Yes | `60` |
| `RATE_LIMIT_BURST` | Max burst requests per IP | Yes | `15` |
| `MAX_CONCURRENT_ANALYSIS` | Maximum simultaneous heavy Reel analyses processed | Yes | `4` |
| `MAX_REQUEST_BODY_SIZE_BYTES`| Maximum HTTP request payload size in bytes | Yes | `102400` (100KB) |

> [!CAUTION]
> Never configure `CORS_ORIGINS=*` with credentials enabled. The engine's `configure_cors()` function hardens against this and will reject wildcard origins if credentials are required.

### B. Production Uvicorn Execution
Run Uvicorn with production worker configuration and HTTPS termination (via reverse proxy like Nginx, Cloudflare, or AWS ALB):

```bash
uvicorn engine.app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --workers 4 \
  --proxy-headers \
  --forwarded-allow-ips "*"
```

### C. Container Deployment (Dockerfile)
```dockerfile
FROM python:3.12-slim

# Install system dependencies for audio/video media extraction
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy dependency definitions
COPY engine/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY engine/ engine/

ENV PYTHONPATH="/app:/app/engine"
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "engine.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### D. Production Verification
Once deployed, verify the public HTTPS health endpoint:

```bash
curl -i https://api.travelai.example.com/health
```

Expected JSON response:
```json
{
  "status": "ok",
  "service": "Travel AI Engine",
  "version": "1.0.0",
  "configuration": {
    "google_places_ready": true,
    "gemini_ready": true,
    "rate_limiting_active": true
  }
}
```

---

## 3. Supabase Cloud Database Production Setup

1. **Deploy Consolidated Schema:**
   - Open the Supabase SQL Editor.
   - Execute the complete `supabase/schema.sql` file.
   - Confirms creation of `profiles`, `analyses`, `analysis_places`, and `saved_places`.
2. **Verify Row Level Security:**
   - Execute the verification query:
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE schemaname = 'public';
   ```
   All 4 tables must show `rowsecurity = true`.
3. **Configure Authentication Providers:**
   - Follow the detailed steps in [docs/AUTHENTICATION.md](AUTHENTICATION.md) to enable Google and Apple OAuth providers.
   - Configure authorized redirect URLs: `travelai://auth/callback`.

---

## 4. Mobile Production Release Configuration

### A. Environment Separation Matrix

| Configuration Variable | Development (`__DEV__ = true`) | Preview Build (Internal APK) | Production Build (Google Play AAB) |
|---|---|---|---|
| `EXPO_PUBLIC_API_URL` | `http://localhost:8000` or `http://10.0.2.2:8000` | `https://api.travelai.example.com` | `https://api.travelai.example.com` |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://<dev-id>.supabase.co` | `https://<prod-id>.supabase.co` | `https://<prod-id>.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public publishable anon key | Public publishable anon key | Public publishable anon key |
| Android Package ID | `com.travelai.mobile` | `com.travelai.mobile` | `com.travelai.mobile` |
| Android Build Format | Dev Client / Metro | Standalone `.apk` | Signed `.aab` (Android App Bundle) |

### B. Production Loopback Guards
The mobile client's `mobile/constants/config.ts` incorporates automated production guards:
- If `__DEV__ = false`, any `EXPO_PUBLIC_API_URL` containing `localhost`, `127.0.0.1`, `10.0.2.2`, or private LAN IPs (`192.168.x.x`, `10.x.x.x`) is **rejected**.
- Any URL not beginning with `https://` is **rejected**.
- If rejected, `Config.API_BASE_URL` resolves to empty string, and `HttpClient` throws a descriptive `NetworkError` preventing insecure or failed loopback connection attempts.

### C. Building Android Binaries with EAS

#### 1. Internal Preview APK (For Physical Device QA)
```bash
cd mobile
eas build --platform android --profile preview
```
Produces a standalone `.apk` directly installable on physical Android test devices.

#### 2. Production Release AAB (For Google Play Console)
```bash
cd mobile
eas build --platform android --profile production
```
Produces an optimized, signed `.aab` ready for upload to Google Play Internal Testing or Production track.
