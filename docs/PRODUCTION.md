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
| `ENVIRONMENT` | Deployment environment identifier | Yes | `production` |
| `GOOGLE_PLACES_API_KEY` | Google Places API key for candidate resolution and photos | Yes | `AIzaSy...` |
| `GEMINI_API_KEY` | Google Gemini API key for visual verification | Optional (falls back to heuristic) | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini model name | No | `gemini-2.5-flash` |
| `SUPABASE_URL` | Supabase project URL | Yes (if engine direct database access enabled) | `https://xyzcompany.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase server-side service-role secret | Yes (if engine direct database access enabled) | `eyJhbGci...` |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins (synonym: `CORS_ORIGINS`) | Yes (if web client enabled) | `https://api.travelai.app` |
| `OPENWEATHER_API_KEY` | Weather intelligence API key | No | `your_key_here` |
| `RATE_LIMIT_ENABLED` | Enables in-memory token bucket rate limiting | Yes | `true` |
| `RATE_LIMIT_PER_MINUTE` | Max requests allowed per minute per IP | Yes | `60` |
| `RATE_LIMIT_BURST` | Max burst requests per IP | Yes | `15` |
| `MAX_CONCURRENT_ANALYSIS` | Maximum simultaneous heavy Reel analyses processed | Yes | `4` |
| `MAX_REQUEST_BODY_SIZE_BYTES`| Maximum HTTP request payload size in bytes | Yes | `102400` (100KB) |

> [!CAUTION]
> Never configure `ALLOWED_ORIGINS=*` or `CORS_ORIGINS=*` with credentials enabled. The engine's `configure_cors()` function hardens against this and will reject wildcard origins if credentials are required.

### B. Production Container Build & Execution
Build the Docker image using the root or engine context:

```bash
# Build production image
docker build -t travel-ai-engine:latest -f engine/Dockerfile .

# Run locally in production mode
docker run -d --name travel-ai-engine -p 8000:8000 \
  -e ENVIRONMENT=production \
  -e GOOGLE_PLACES_API_KEY="AIzaSy..." \
  -e GEMINI_API_KEY="AIzaSy..." \
  -e ALLOWED_ORIGINS="https://api.travelai.app" \
  travel-ai-engine:latest
```

### C. Cloud Deployment Commands

#### Option 1: Google Cloud Run (Recommended for Gemini / Google Places)
```bash
# Authenticate and configure project
gcloud auth login
gcloud config set project travel-ai-prod

# Build and submit container image to Google Artifact Registry
gcloud builds submit --tag gcr.io/travel-ai-prod/travel-ai-engine:1.0.0 -f engine/Dockerfile .

# Deploy to Cloud Run with HTTPS and auto-scaling
gcloud run deploy travel-ai-engine \
  --image gcr.io/travel-ai-prod/travel-ai-engine:1.0.0 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --concurrency 8 \
  --set-env-vars ENVIRONMENT=production,RATE_LIMIT_ENABLED=true \
  --set-secrets GOOGLE_PLACES_API_KEY=places-api-key:latest,GEMINI_API_KEY=gemini-api-key:latest
```

#### Option 2: Fly.io
```bash
# Launch app
fly launch --dockerfile engine/Dockerfile

# Set production secrets
fly secrets set \
  ENVIRONMENT=production \
  GOOGLE_PLACES_API_KEY="AIzaSy..." \
  GEMINI_API_KEY="AIzaSy..."

# Deploy
fly deploy
```

#### Option 3: AWS App Runner / ECS
```bash
# Push image to Amazon ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com
docker tag travel-ai-engine:latest <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/travel-ai-engine:latest
docker push <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/travel-ai-engine:latest

# Create App Runner service with HTTPS termination
aws apprunner create-service \
  --service-name travel-ai-engine \
  --source-configuration ImageRepository='{ImageIdentifier="<aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/travel-ai-engine:latest",ImageRepositoryType="ECR"}'
```

### D. Production Verification
Once deployed, verify the public HTTPS health endpoint:

```bash
curl -i https://api.travelai.app/health
```

Expected JSON response:
```json
{
  "status": "ok",
  "service": "Travel AI Engine",
  "version": "1.0.0",
  "environment": "production",
  "configuration": {
    "google_places_ready": true,
    "gemini_ready": true,
    "supabase_ready": false,
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
