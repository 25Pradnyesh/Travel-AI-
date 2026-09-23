# Phase 5: Production Hardening Notes

## 1. Production Configuration Requirements

| Variable | Scope | Requirement | Purpose |
|---|---|---|---|
| `GOOGLE_PLACES_API_KEY` | Engine (`engine/.env`) | **Required** | Place resolution, details lookup, and nearby search |
| `GEMINI_API_KEY` | Engine (`engine/.env`) | Optional | Multimodal Gemini text and vision verification |
| `GEMINI_MODEL` | Engine (`engine/.env`) | Optional (default: `gemini-2.5-flash`) | Gemini model designation |
| `OPENWEATHER_API_KEY` | Engine (`engine/.env`) | Optional | Destination weather and seasonal travel intelligence |
| `CORS_ORIGINS` | Engine (`engine/.env`) | Optional | Comma-separated list of allowed production origins |
| `ENGINE_API_URL` | Frontend (`.env.local`) | Optional (default: `http://127.0.0.1:8000`) | Target engine address for Next.js API proxy |

Missing `GOOGLE_PLACES_API_KEY` logs a clear startup diagnostic and marks `/health` status as `degraded`.

---

## 2. External Failure Isolation & Fallback Behavior

- **Instagram / yt-dlp**: Download failures or inaccessible Reels return HTTP 422 with a user-friendly message (`"This Reel couldn't be accessed. Make sure it's publicly available."`). Socket timeout is capped at 30s.
- **Google Places**: Upstream failures or timeouts (15s) return empty candidate lists without crashing the pipeline. Error logging strips sensitive parameters and avoids leaking API keys.
- **Gemini**: Upstream failures or model `NotFound` errors cleanly fall back to deterministic scoring. `verification_status` is set to `FAILED`, `gemini.used` is `false`, and scoring confidence is preserved.
- **OpenWeather**: Weather enrichment errors (10s timeout) return empty weather objects (`self.empty()`). Upstream query parameters containing `appid` are stripped from logs to prevent credential leakage.

---

## 3. Temporary Resource Cleanup

All downloaded Reels and extracted frames are reliably cleaned up across:
- **Successful processing**: Unlinked in `LocationPipeline.run()`'s `finally` block.
- **Known failures**: Partial downloads (`.part`, `.ytdl`) are removed by `InstagramYtDlpProvider._cleanup_partial_files()`.
- **Unexpected pipeline exceptions**: `engine/app/api/analyze.py` guarantees unlinking of `video_path` in an outer `finally` block.
- **File lock prevention on Windows**: `cv2.VideoCapture` is released in a `finally` block, and PIL image files in `GeminiVisionService` are opened using `with Image.open(...) as pil_image:` with `pil_image.load()`.

Persistent assets such as `engine/assets/sample.mp4` and repository `.gitkeep` markers are strictly preserved.

---

## 4. CORS Configuration

- Defined via `configure_cors()` in `engine/app/main.py`.
- Explicit origins: Comma-separated domains in `CORS_ORIGINS` are merged with local development origins (`http://localhost:3000`, `http://127.0.0.1:3000`, etc.).
- Wildcard protection: If wildcard `*` is specified in `CORS_ORIGINS`, `allow_credentials` is set to `False` to adhere to CORS security specifications and prevent credential theft.

---

## 5. Known Limitations

1. **Gemini Availability**: Model `gemini-2.5-flash` currently returns `NotFound` upstream with the active API key. Fallback scoring remains active and ensures complete destination resolution.
2. **Cold-Start Latency**: The first analysis request after engine boot loads heavy ML libraries (torch, easyocr, whisper), resulting in a ~94s cold-start vs. ~13–17s warm analysis.
