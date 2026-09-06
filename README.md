<div align="center">

# TRAVEL AI

### Discover it. Save it. Go there.

Turn travel inspiration from Instagram into places you can actually visit.

<br />

[![Status](https://img.shields.io/badge/Status-Active%20Development-18181B?style=for-the-badge&labelColor=09090B)](https://github.com/25Pradnyesh/Travel-AI-)
[![Next.js](https://img.shields.io/badge/Next.js%2016-App%20Router-18181B?style=for-the-badge&logo=nextdotjs&logoColor=white&labelColor=09090B)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.12-18181B?style=for-the-badge&logo=fastapi&logoColor=white&labelColor=09090B)](https://fastapi.tiangolo.com)
[![Gemini](https://img.shields.io/badge/Gemini-Multimodal%20Verification-18181B?style=for-the-badge&logo=google&logoColor=white&labelColor=09090B)](https://ai.google.dev)
[![Google Places](https://img.shields.io/badge/Google%20Places-API-18181B?style=for-the-badge&logo=googlemaps&logoColor=white&labelColor=09090B)](https://developers.google.com/maps)

<br />

</div>

---

## What is Travel AI?

Travel AI is a multimodal location intelligence engine designed to bridge the gap between social media discovery and real-world travel.

When you paste a public Instagram Reel URL, the system reverse-engineers the video—extracting on-screen signage, spoken audio, visual landmarks, and caption clues—to identify the exact real-world place.

Instead of guessing or returning vague regions, Travel AI anchors every discovery to verified geographic coordinates, surfaces nearby points of interest, and builds actionable travel intelligence.

---

## The Problem

Instagram has quietly become the primary travel discovery engine for millions.

A secluded cove in Mallorca.  
A cliffside espresso bar in Amalfi.  
A viewpoint tucked into the Swiss Alps.  

You save the Reel. Months later, when you actually plan the trip:

> **"Where was this place?"**

Saved collections become graveyards of unnamed locations. Captions are often cryptic, geo-tags are omitted, and audio tracks rarely provide geographic context.

Travel AI eliminates this friction:

```text
Discover  ──►  Understand  ──►  Save  ──►  Go
```

---

## Reel → Destination

The core technical differentiator of Travel AI is that it does **not** prompt an LLM with *"Where is this video?"* and expect an ungrounded guess.

Instead, the system treats location resolution as an evidence extraction, entity discovery, ranking, and multimodal verification challenge:

```text
               PUBLIC INSTAGRAM REEL
                         │
                         ▼
                    EXTRACTION
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
           Evidence            Video Frames
   Caption · Hashtags · OCR         │
   Metadata · Audio Speech          │
              │                     │
              ▼                     │
     CANDIDATE EXTRACTION           │
   Mining · Normalization · Dedupe  │
              │                     │
              ▼                     │
        GOOGLE PLACES               │
   Text Search · Place Details      │
              │                     │
              ▼                     │
       GEO ENRICHMENT               │
   Hierarchy · Nearby Discovery     │
              │                     │
              ▼                     │
          SCORING                   │
    Multi-Factor Weights            │
              │                     │
              ▼                     │
     CANDIDATE RANKING              │
       Top Candidates               │
              │                     │
              ▼                     │
   GEMINI TEXT VERIFICATION         │
              │                     │
              ▼                     │
   GEMINI VISION VERIFICATION ◄─────┘
   Keyframe Landmark Cross-Check
              │
              ▼
   FINAL VERIFIED DESTINATION
              │
              ▼
      TRAVEL INTELLIGENCE
   Season · Budget · Duration · Tips
              │
              ▼
  CANONICAL DESTINATION RESPONSE
              │
              ▼
  NEXT.JS PRODUCT EXPERIENCE
```

```text
Evidence  ──►  Real Place Candidates  ──►  Ranking  ──►  Gemini Verification  ──►  Destination
```

---

## How It Works

### 01 — Extract
The engine ingests the Reel URL and runs parallel extraction across all available media tracks:
- **Caption & Metadata**: Captions, author details, and location hashtags.
- **Computer Vision (OCR)**: Scans video frames for signage, watermarks, and subtitles.
- **Speech Recognition**: Transcribes spoken audio into timestamped text via Whisper.
- **Keyframe Extraction**: Selects representative frames for visual landmark identification.

### 02 — Discover
Clues mined from captions, speech, and OCR are parsed into geographic entities. The system normalizes place names, resolves colloquial phrasing, and deduplicates references.

### 03 — Search
Candidate strings are queried against the Google Places API to establish ground truth. Every candidate is bound to an official `place_id`, verified coordinates, and administrative records.

### 04 — Enrich
The location engine gathers full context for each place: country, state/region, city, Google Place types, user ratings, and surrounding points of interest.

### 05 — Rank
Candidates are ranked through a weighted multi-factor scoring matrix evaluating:
- Fuzzy string and token overlap against Reel evidence
- Relevance of Google Place types (e.g., natural feature vs. business)
- Geographic hierarchy consistency across multiple clues
- Popularity and global entity priors

### 06 — Verify
The top candidates are evaluated by Gemini alongside the raw evidence. Gemini performs text-based consistency checking and vision-based keyframe comparison to confirm the winner, calculate confidence, and explain the selection.

### 07 — Understand
Once verified, the engine synthesizes contextual travel logistics:
- Destination classification (coastal, alpine, urban, heritage)
- Optimal visiting windows (peak months, shoulder months, seasons to avoid)
- Estimated daily budget ranges and currency standards
- Recommended stay length, climate packing items, and local travel advisories

### 08 — Return
All verified place data, maps links, nearby attractions, and intelligence summaries are formatted into a clean, predictable canonical JSON contract (`AnalysisResponse`).

### 09 — Experience
The Next.js frontend communicates with the analysis engine through an internal API route proxy (`/api/analyze`), triggering the pipeline and rendering the verified destination card with match confidence, "Why this place" rationale, and Google Maps routing.

---

## Current Capabilities

### Location Intelligence Engine

| Capability | Status | Description |
|---|:---:|---|
| Instagram Metadata & Caption Extraction | `DONE` | Ingests captions, hashtags, and author data |
| Keyframe Extraction | `DONE` | Samples video frames at configurable intervals |
| OCR Text Recognition | `DONE` | Detects on-screen signage, watermarks, and subtitles |
| Whisper Audio Transcription | `DONE` | Transcribes audio speech tracks into text |
| Evidence Aggregation | `DONE` | Merges multimodal clues into a unified evidence model |
| Candidate Mining & Normalization | `DONE` | Extracts, cleans, and deduplicates location strings |
| Travel Keyword Filtering | `DONE` | Filters false positives using travel lexicons |
| Google Places Text Search | `DONE` | Discovers verified real-world place candidates |
| Google Place Details | `DONE` | Retrieves coordinates, addresses, and photos |
| Geographic Enrichment | `DONE` | Resolves country, state/region, and city hierarchy |
| Nearby Places Discovery | `DONE` | Finds surrounding landmarks, attractions, and stays |
| Multi-Factor Scoring Engine | `DONE` | Scores candidates via token overlap, types, and priors |
| Candidate Ranking | `DONE` | Prunes weak candidates and isolates top candidates |
| Gemini Text Verification | `DONE` | Evaluates evidence consistency and edge cases |
| Gemini Vision Verification | `DONE` | Cross-checks video keyframes against place visuals |
| Canonical Response Builder | `DONE` | Normalizes output into a unified Phase 6 schema |

### Travel Intelligence

| Capability | Status | Description |
|---|:---:|---|
| Destination Categorization | `DONE` | Classifies terrain and travel style |
| Seasonal Intelligence | `DONE` | Identifies peak, shoulder, and avoid months |
| Budget Estimation | `DONE` | Estimates daily expenses and budget tiers |
| Packing Guidance | `DONE` | Generates climate- and activity-aware checklists |
| Trip-Duration Guidance | `DONE` | Recommends optimal stay length |
| Curated Travel Tips | `DONE` | Surfaces localized tips and navigation advice |

### Product & Frontend

| Capability | Status | Description |
|---|:---:|---|
| Next.js 16 App Shell | `DONE` | Modern, responsive web interface |
| Fluid Motion System | `DONE` | Smooth animations powered by Framer Motion |
| Reel URL Input & Validation | `DONE` | Validates Instagram URL patterns client & server side |
| Analysis Loading Experience | `DONE` | Real loading state with button locks and spinners |
| Frontend ↔ Backend Proxy | `DONE` | Secure Next.js `/api/analyze` proxy to FastAPI |
| Canonical Response Consumption | `DONE` | Consumes and renders Phase 6 canonical responses |
| Initial Destination Reveal | `DONE` | Displays verified place, confidence, why, photos & Maps CTA |
| Rich Destination Experience UI | `IN PROGRESS` | Multi-tab destination view, full gallery & interactive map |
| Nearby Places Presentation | `IN PROGRESS` | Interactive carousel and category filters for nearby POIs |
| Saved Collections & Memory | `LATER` | Personal library of resolved destinations |
| User Authentication | `LATER` | Accounts, profiles, and cross-device sync |
| Google Maps List Export | `LATER` | One-click export to Google Maps saved places |

---

## Gemini Verification

Gemini is **not** used as an ungrounded search engine. It does not replace Google Places; rather, it acts as an intelligent arbitrator over verified place candidates.

```text
Scoring Engine  ──►  Top Place Candidates  ──►  Gemini Verifier  ──►  Verified Winner
```

1. **Grounded Input**: Gemini receives the strongest candidates discovered and ranked from Google Places, paired with the full multimodal evidence extracted from the Reel.
2. **Dual-Track Verification**:
   - **Text Verification**: Validates whether the candidate aligns with captions, hashtags, transcriptions, and geographical clues.
   - **Vision Verification**: Cross-references video keyframes against candidate features and landscape context.
3. **Resilience & Fallbacks**: The system handles Gemini timeouts, malformed outputs, and scoring disagreements gracefully by falling back to the top-scoring candidate with appropriate verification status flags (`VERIFIED`, `PARTIAL`, `SKIPPED`, `FAILED`).

---

## Final Destination Response

The backend produces a canonical, frontend-ready destination response (`AnalysisResponse`). The frontend consumes this structured payload directly without needing to parse internal Google or Gemini data:

- **Identity**: Place ID, official name, formatted address.
- **Geography**: Country, city, region, latitude, longitude.
- **Reputation**: User rating, total review count, Google place types.
- **Visuals**: Photo URLs, dimensions, and author attributions.
- **Navigation**: Direct Google Maps URL.
- **Verification**: Confidence score (0–100), confidence level, verification status, Gemini reasoning, and a human-readable `"why"` explanation.
- **Travel Intelligence**: Best season, daily budget, trip duration, travel tips.
- **Nearby Places**: List of surrounding points of interest with category, distance in km, and ratings.

---

## Product Experience

```text
┌──────────────────────────┐
│        PASTE REEL        │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│         ANALYZE          │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│  LOCATION INTELLIGENCE   │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   VERIFIED DESTINATION   │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│   TRAVEL INTELLIGENCE    │
└──────────────────────────┘
```

1. **Paste Reel** — Paste any public Instagram Reel URL into the input field.
2. **Analyze** — Trigger real-time extraction, candidate ranking, and Gemini verification.
3. **Location Intelligence** — Multimodal evidence is aligned with Google Places ground truth.
4. **Verified Destination** — Inspect the confirmed place name, address, confidence rating, explanation, and photos.
5. **Travel Intelligence** — Review optimal visiting seasons, estimated daily budgets, and local tips.
6. **Open in Maps** — Jump straight into Google Maps with one click.

*Note: The product experience is currently being expanded into a richer, dedicated destination results interface.*

---

## Architecture

```text
                     ┌─────────────────────────┐
                     │     NEXT.JS CLIENT      │
                     │ React 19 · Framer Motion│
                     └────────────┬────────────┘
                                  │
                                  │ POST /api/analyze
                                  ▼
                     ┌─────────────────────────┐
                     │   NEXT.JS API PROXY     │
                     │  Validation & Routing   │
                     └────────────┬────────────┘
                                  │
                                  │ POST /analyze
                                  ▼
                     ┌─────────────────────────┐
                     │     FASTAPI ENGINE      │
                     │    Python 3.12 Core     │
                     └────────────┬────────────┘
                                  │
             ┌────────────────────┼────────────────────┐
             ▼                    ▼                    ▼
      ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
      │  METADATA &  │     │   EASYOCR    │     │   WHISPER    │
      │   CAPTION    │     │ FRAME VISION │     │ SPEECH AUDIO │
      └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
             └────────────────────┼────────────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │     LOCATION ENGINE     │
                     │  Candidate Extraction   │
                     │   Google Places Search  │
                     │   Place Details & Geo   │
                     │   Multi-Factor Scoring  │
                     │    Candidate Ranking    │
                     └────────────┬────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │     GEMINI VERIFIER     │
                     │  Gemini Text Check      │
                     │  Gemini Vision Check    │
                     └────────────┬────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │   TRAVEL INTELLIGENCE   │
                     │ Category · Season       │
                     │ Budget · Tips · Packing │
                     └────────────┬────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │    RESPONSE BUILDER     │
                     │ Canonical Best Guess    │
                     │ Nearby POIs · Metadata  │
                     └────────────┬────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │     FRONTEND RESULT     │
                     │ Destination Card · Maps │
                     └─────────────────────────┘
```

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Library**: React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Primitives**: Radix UI / shadcn

### Backend Engine
- **Runtime**: Python 3.12+
- **API Framework**: FastAPI
- **Server**: Uvicorn
- **Validation**: Pydantic v2

### Multimodal Processing
- **Computer Vision**: OpenCV (frame extraction)
- **Text Recognition**: EasyOCR
- **Audio Processing**: Whisper (speech transcription)
- **Extraction Core**: yt-dlp

### Location & Verification
- **Geographic Data**: Google Places API (Text Search, Place Details, Nearby Search)
- **Multimodal AI**: Google Gemini

### Data & Persistence (Planned)
- **Database**: PostgreSQL
- **ORM**: Prisma

---

## Repository Structure

```text
travel-ai/
├── app/                          # Next.js App Router
│   ├── api/analyze/route.ts      # Next.js API proxy to FastAPI engine
│   ├── globals.css               # Tailwind CSS stylesheet
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page and analysis orchestrator
├── components/                   # React UI components
│   ├── ui/                       # Primitive components
│   ├── Background.tsx            # Ambient visual background
│   ├── DestinationResult.tsx     # Destination result card & intelligence view
│   ├── FloatingCards.tsx         # Decorative visual elements
│   ├── Hero.tsx                  # Hero header, Reel URL input & Analyze button
│   └── Navbar.tsx                # Top navigation bar
├── engine/                       # FastAPI intelligence engine
│   ├── app/
│   │   ├── api/                  # API routers (test_routes.py, etc.)
│   │   ├── main.py               # FastAPI application entrypoint
│   │   ├── pipelines/            # LocationPipeline execution logic
│   │   └── services/             # Modular domain services
│   │       ├── extraction/       # Video download, frames, evidence builder
│   │       ├── gemini/           # Gemini verifier, prompt builders, parsers
│   │       ├── location/         # Location resolver & candidate normalization
│   │       ├── maps/             # Google Places client & enrichment
│   │       ├── ocr/              # EasyOCR text recognition
│   │       ├── response/         # Canonical response builder
│   │       ├── scoring/          # Multi-factor candidate scoring matrix
│   │       ├── speech/           # Whisper audio transcription service
│   │       └── travel/           # Travel intelligence synthesizer
│   ├── domain/schemas/           # Pydantic schemas (responses.py, etc.)
│   └── tests/                    # Backend regression test suite
├── types/                        # TypeScript definitions
│   └── analysis.ts               # Canonical response & request interfaces
├── package.json                  # Frontend dependencies and scripts
└── README.md
```

---

## API

### Next.js Client Route

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/analyze` | Client proxy: validates Reel URL and forwards to FastAPI engine |

**Request Body:**
```json
{
  "url": "https://www.instagram.com/reel/DN2XxxY2O7-/"
}
```

### FastAPI Intelligence Engine

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Engine health check |
| `GET` | `/health` | Engine status endpoint |
| `POST` | `/analyze` | Executes location pipeline and returns verified destination |
| `GET` | `/docs` | Interactive Swagger / OpenAPI documentation |

**Request Body:**
```json
{
  "reel_url": "https://www.instagram.com/reel/DN2XxxY2O7-/"
}
```

**Canonical Response:**
```json
{
  "success": true,
  "best_guess": {
    "place_id": "ChIJN1tT3GuHK4cR35ogsmMo848",
    "name": "Lake Como",
    "formatted_address": "Lake Como, Lombardy, Italy",
    "country": "Italy",
    "city": "Como",
    "region": "Lombardy",
    "latitude": 45.9863,
    "longitude": 9.2572,
    "rating": 4.8,
    "user_ratings_total": 14200,
    "types": ["natural_feature", "tourist_attraction"],
    "photos": [
      {
        "url": "https://...",
        "width": 1080,
        "height": 720
      }
    ],
    "maps_url": "https://www.google.com/maps/search/?api=1&query=45.9863,9.2572",
    "confidence": 94,
    "confidence_level": "VERY_HIGH",
    "verification_status": "VERIFIED",
    "gemini_confidence": 0.95,
    "gemini_reason": "Visual markers match lake shoreline referenced in caption and OCR.",
    "why": "Verified from Reel's CAPTION, OCR and Google Places location data."
  },
  "travel_intelligence": {
    "category": "Lakes & Mountains",
    "category_emoji": "🌊",
    "best_season": "May to September",
    "budget_level": "$$$",
    "estimated_daily_budget": "$150 - $250",
    "recommended_trip_days": "2-4 Days",
    "travel_tips": [
      "Book ferry passes in advance during peak summer months"
    ]
  },
  "nearby_places": [
    {
      "place_id": "ChIJ...",
      "name": "Villa del Balbianello",
      "formatted_address": "Via Guido Monzino, 1, 22016 Tremezzina CO, Italy",
      "distance_km": 4.2,
      "rating": 4.9,
      "category": "Attraction",
      "maps_url": "https://www.google.com/maps/..."
    }
  ]
}
```

---

## Local Development

### Prerequisites

- **Node.js**: 18.0 or newer
- **Python**: 3.12 or newer
- **Google Places API Key**: Required for place search and details
- **Gemini API Key**: Required for multimodal verification

### 1. Clone the Repository

```bash
git clone https://github.com/25Pradnyesh/Travel-AI-.git
cd travel-ai
```

### 2. Configure Environment Variables

Create `engine/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

Create `.env.local` in the project root:

```env
ENGINE_API_URL=http://127.0.0.1:8000
```

### 3. Start the Python Engine

Create and activate a virtual environment:

```powershell
# Windows (PowerShell)
python -m venv engine/.venv
.\engine\.venv\Scripts\Activate.ps1
```

```bash
# macOS / Linux
python3 -m venv engine/.venv
source engine/.venv/bin/activate
```

Install engine dependencies:

```bash
pip install -r engine/requirements.txt
```

Start the FastAPI server:

```powershell
# Windows PowerShell (UTF-8 enabled)
$env:PYTHONUTF8="1"; python -m uvicorn engine.app.main:app --reload
```

```bash
# macOS / Linux
python -m uvicorn engine.app.main:app --reload
```

- Engine runs at `http://127.0.0.1:8000`  
- Swagger documentation is available at `http://127.0.0.1:8000/docs`

### 4. Start the Frontend Client

From the repository root:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

### 5. Running Tests

Run the backend regression test suite:

```powershell
$env:PYTHONUTF8="1"; engine\.venv\Scripts\python.exe -m unittest discover -s engine/tests -p "*test*.py"
```

Verify the frontend build and linter:

```bash
npm run lint
npm run build
```

---

## Development Status

### Intelligence Engine

```text
[DONE] Multimodal Extraction (Caption, OCR, Audio, Frames)
[DONE] Candidate Mining, Normalization & Deduplication
[DONE] Google Places Grounding & Place Details
[DONE] Geographic Hierarchy Enrichment & Nearby Search
[DONE] Multi-Factor Candidate Scoring Engine
[DONE] Gemini Multimodal Text & Vision Verification
[DONE] Travel Intelligence Synthesis (Season, Budget, Tips)
[DONE] Canonical Response Builder (Phase 6 Schema)
```

### Product & Frontend

```text
[DONE] Landing Page & Visual Shell
[DONE] Framer Motion Fluid Interaction
[DONE] Reel URL Client & Server Validation
[DONE] Analysis Loading Experience & Request Locks
[DONE] Next.js ↔ FastAPI API Route Integration (Phase 7)
[DONE] Canonical Response Consumption & State Management
[DONE] Initial Destination Result Card & Google Maps CTA
[IN PROGRESS] Rich Multi-Tab Destination Experience Page
[IN PROGRESS] Nearby Places Interactive Carousel & Categories
[LATER] User Accounts, Authentication & Profiles
[LATER] Saved Collections & Destination Library
[LATER] Google Maps Saved Lists Synchronization
```

---

## Roadmap

### 01 — Location Intelligence `COMPLETED`
- [x] Multimodal extraction pipeline (caption, OCR, speech, frames)
- [x] Candidate entity extraction and deduplication
- [x] Google Places search and Place Details enrichment
- [x] Multi-factor candidate scoring and ranking

### 02 — Gemini Verification `COMPLETED`
- [x] Gemini text verification against evidence clues
- [x] Gemini vision verification against video keyframes
- [x] Resilient fallbacks for API errors and ambiguous scores

### 03 — Destination Response Builder `COMPLETED`
- [x] Travel intelligence synthesis (seasons, budgets, packing, tips)
- [x] Nearby places normalization
- [x] Canonical Phase 6 frontend response contract

### 04 — Frontend ↔ Backend Integration (Phase 7) `COMPLETED`
- [x] Next.js `/api/analyze` proxy route to FastAPI engine
- [x] Real-time request orchestration without mock data
- [x] Loading states, error handling, and duplicate request prevention
- [x] Initial destination reveal with match confidence and Maps CTA

### 05 — Rich Destination Experience `UPCOMING`
- [ ] Dedicated destination results page
- [ ] High-resolution destination image gallery
- [ ] Interactive nearby places carousel
- [ ] Interactive travel intelligence dashboard (packing lists, seasonal chart)

### 06 — Memory & Collections `LATER`
- [ ] User authentication and session persistence
- [ ] Saved destinations database
- [ ] Trip itineraries and bucket lists
- [ ] Geographic map view of all saved locations

### 07 — Ecosystem & Everywhere `LATER`
- [ ] One-click export to Google Maps saved lists
- [ ] Chrome extension for one-click Reel analysis
- [ ] Cross-platform support (YouTube Shorts, TikTok)
- [ ] Public developer API

---

## Accuracy Philosophy

Travel AI approaches destination identification as an **evidence-based ranking and verification challenge**, not an unconstrained generative prompt.

```text
Caption + OCR + Speech + Hashtags + Metadata + Geographic Context + Google Places + Scoring + Gemini + Vision
= Best Supported Destination
```

The system does not generate:
> *"Something that sounds plausible."*

It resolves:
> *"The verified real-world place that best accounts for all available evidence."*

A strong destination match requires cross-signal validation across independent evidence tracks before receiving high confidence.

---

## Privacy

Travel AI processes **public Instagram Reel URLs**.

- No Instagram account credentials or logins are required to analyze public content.
- Video frames and audio streams are processed ephemerally during analysis.
- Production storage, user data retention, and privacy policies will be finalized prior to public launch.

---

## Contributing

Travel AI is currently in active development by its core maintainer. We are focused on stabilizing the core product flow before opening the repository to external contributions.

---

## License

This project is currently proprietary and under active development. The source code is not licensed for external redistribution or commercial reuse.

---

<div align="center">

### Author

**Built by Pradnyesh**

*Connecting creative direction with autonomous agent architectures.*

<br />

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/25Pradnyesh)
&nbsp;&nbsp;
[![X](https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/Pradnyesh_25)

<br />

[@25Pradnyesh](https://github.com/25Pradnyesh) &nbsp;·&nbsp; [@Pradnyesh_25](https://x.com/Pradnyesh_25)

</div>

---

<div align="center">

### TRAVEL AI

**Discover it. Save it. Go there.**

</div>
