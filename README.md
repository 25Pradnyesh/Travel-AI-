<div align="center">

# TRAVEL AI

### Discover it. Save it. Go there.

Turn travel inspiration from Instagram into places you can actually visit.

<br />

[![Status](https://img.shields.io/badge/Status-Active%20Development-18181B?style=for-the-badge&labelColor=09090B)](https://github.com/25Pradnyesh/Travel-AI-)
[![Next.js](https://img.shields.io/badge/Next.js%2015-App%20Router-18181B?style=for-the-badge&logo=nextdotjs&logoColor=white&labelColor=09090B)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.12-18181B?style=for-the-badge&logo=fastapi&logoColor=white&labelColor=09090B)](https://fastapi.tiangolo.com)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-18181B?style=for-the-badge&logo=google&logoColor=white&labelColor=09090B)](https://ai.google.dev)
[![Google Places](https://img.shields.io/badge/Google%20Places-API-18181B?style=for-the-badge&logo=googlemaps&logoColor=white&labelColor=09090B)](https://developers.google.com/maps)

<br />

</div>

---

## What is Travel AI?

Travel AI is a multimodal location intelligence engine designed to bridge the gap between social media discovery and real-world travel.

When you paste a public Instagram Reel URL, the system reverse-engineers the video—extracting on-screen text, spoken audio, visual landmarks, and caption clues—to identify the exact real-world place.

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

Instead, the system follows a deterministic pipeline:

```text
                     INSTAGRAM REEL
                           │
                           ▼
     ┌───────────────────────────────────────────┐
     │            MULTIMODAL EVIDENCE            │
     │ Caption · Hashtags · OCR · Audio · Frames │
     └─────────────────────┬─────────────────────┘
                           │
                           ▼
     ┌───────────────────────────────────────────┐
     │           CANDIDATE EXTRACTION            │
     │   Entities · Normalization · Dedupe       │
     └─────────────────────┬─────────────────────┘
                           │
                           ▼
     ┌───────────────────────────────────────────┐
     │           GOOGLE PLACES SEARCH            │
     │    Place IDs · Coordinates · Details      │
     └─────────────────────┬─────────────────────┘
                           │
                           ▼
     ┌───────────────────────────────────────────┐
     │         GEO ENRICHMENT & SCORING          │
     │   Token Overlap · Place Types · Hierarchy │
     └─────────────────────┬─────────────────────┘
                           │
                           ▼
     ┌───────────────────────────────────────────┐
     │        GEMINI MULTIMODAL VERIFIER         │
     │    Text Reasoning · Visual Cross-Check    │
     └─────────────────────┬─────────────────────┘
                           │
                           ▼
     ┌───────────────────────────────────────────┐
     │           VERIFIED DESTINATION            │
     │    Canonical Record · Maps URL · Nearby   │
     └─────────────────────┬─────────────────────┘
                           │
                           ▼
                  TRAVEL INTELLIGENCE
        Seasonality · Budgets · Safety · Tips
```

```text
Evidence  ──►  Real Place Candidates  ──►  Ranking  ──►  Verification  ──►  Destination
```

---

## How It Works

### 01 — Multimodal Extraction
The engine ingests the Reel URL and runs parallel extraction across all available media tracks:
- **Caption & Metadata**: Captions, author info, and location hashtags.
- **Computer Vision (OCR)**: Scans video frames for street names, signs, and subtitles.
- **Speech Recognition**: Transcribes spoken audio into timestamped text.
- **Keyframe Extraction**: Selects representative frames for visual landmark identification.

### 02 — Candidate Discovery
Clues mined from captions, speech, and OCR are parsed into geographic entities. The system normalizes place names, resolves colloquial phrasing, and deduplicates references.

### 03 — Google Places Grounding
Candidate strings are queried against the Google Places API to establish ground truth. Every candidate is bound to an official `place_id`, verified coordinates, and administrative records.

### 04 — Geographic Enrichment
The location engine gathers full context for each place: country, state/region, city, Google Place types, user ratings, and surrounding points of interest.

### 05 — Multi-Factor Scoring
Candidates are ranked through a weighted scoring matrix evaluating:
- Fuzzy string and token overlap against Reel evidence
- Relevance of Google Place types (e.g., natural feature vs. business)
- Geographic hierarchy consistency across multiple clues
- Popularity and global entity priors

### 06 — Gemini Multimodal Verification
The top five candidates are sent to Gemini 2.5 Flash alongside the raw evidence. Gemini evaluates both text signals and video frames to confirm the winner, calculate a confidence score, and document the reasoning.

### 07 — Travel Intelligence Synthesis
Once verified, the engine generates contextual travel logistics:
- Destination classification (coastal, alpine, urban, heritage)
- Optimal visiting windows (best months, peak season, seasons to avoid)
- Estimated daily budget tiers (budget, moderate, luxury)
- Weather-appropriate packing suggestions and region-specific advisories

### 08 — Canonical Response Delivery
All verified place data, maps links, nearby attractions, and intelligence summaries are formatted into a clean, predictable JSON contract ready for the frontend.

---

## Current Capabilities

### Location Intelligence

| Capability | Status | Description |
|---|:---:|---|
| Reel Metadata & Caption Extraction | `DONE` | Ingests captions, hashtags, and author data |
| Keyframe Extraction | `DONE` | Samples video frames at configurable intervals |
| OCR Text Recognition | `DONE` | Detects on-screen signage, watermarks, and subtitles |
| Whisper Audio Transcription | `DONE` | Transcribes audio speech tracks |
| Evidence Aggregation | `DONE` | Merges multimodal clues into unified context |
| Candidate Mining & Normalization | `DONE` | Normalizes and deduplicates location strings |
| Travel Keyword Filtering | `DONE` | Filters false positives using travel lexicons |
| Google Places Text Search | `DONE` | Discovers verified real-world place candidates |
| Google Place Details | `DONE` | Retrieves coordinates, addresses, and photos |
| Geographic Enrichment | `DONE` | Resolves country, state, and city hierarchy |
| Nearby Places Discovery | `DONE` | Finds surrounding landmarks and attractions |
| Multi-Factor Scoring Engine | `DONE` | Scores candidates via token overlap and place types |
| Candidate Ranking | `DONE` | Prunes weak candidates and selects top 5 |
| Gemini Text Verification | `DONE` | Evaluates evidence consistency and edge cases |
| Gemini Vision Verification | `DONE` | Cross-checks video keyframes against place visuals |
| Canonical Response Builder | `DONE` | Formats output into a unified frontend schema |

### Travel Intelligence

| Capability | Status | Description |
|---|:---:|---|
| Destination Categorization | `DONE` | Classifies terrain and travel style |
| Seasonal Intelligence | `DONE` | Identifies peak, ideal, and avoid months |
| Budget Estimation | `DONE` | Calculates daily expense estimates by tier |
| Packing Guidance | `DONE` | Generates climate- and activity-aware checklists |
| Trip-Duration Guidance | `DONE` | Recommends optimal stay length |
| High-Altitude & Terrain Rules | `DONE` | Flags acclimatization and elevation requirements |
| International Travel Logistics | `DONE` | Outlines currency, language, and plug standards |
| Curated Travel Tips | `DONE` | Surfaces localized tips and navigation advice |

### Product

| Capability | Status | Description |
|---|:---:|---|
| Next.js 15 App Shell | `DONE` | Modern, responsive web interface |
| Fluid Motion System | `DONE` | Smooth animations powered by Framer Motion |
| Reel URL Input & Validation | `DONE` | Validates Instagram URL patterns on the client |
| Analysis Loading States | `DONE` | Visual feedback during multimodal processing |
| End-to-End API Integration | `IN PROGRESS` | Connecting frontend client to the FastAPI engine |
| Destination Results View | `IN PROGRESS` | Displaying verified places, photos, and insights |
| Saved Collections & Memory | `NEXT` | Personal library of resolved destinations |
| Google Maps List Export | `LATER` | One-click export to Google Maps saved places |

---

## Product Experience

```text
Paste Reel ──► Analyze ──► Understand ──► Discover ──► Explore ──► Open Maps ──► Save
```

1. **Paste Reel** — Drop any public Instagram Reel URL into the input field.
2. **Analyze** — The multimodal engine processes metadata, frames, audio, and text in parallel.
3. **Understand** — Location signals are scored, filtered, and verified against ground truth.
4. **Discover Destination** — Inspect the verified place name, address, coordinates, and photo previews.
5. **Explore Nearby Places** — Browse nearby attractions, viewpoints, and local spots within reach.
6. **Open Maps** — Jump directly into Google Maps with one click for turn-by-turn routing.
7. **Save** — Bookmark verified destinations into your travel collection for upcoming trips.

---

## Architecture

```text
                    ┌─────────────────────────┐
                    │     NEXT.JS CLIENT      │
                    │ React 19 · Framer Motion│
                    └────────────┬────────────┘
                                 │
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
                    │  Entity Mining & Dedupe │
                    │   Google Places Search  │
                    │  Multi-Factor Scoring   │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │     GEMINI VERIFIER     │
                    │  2.5 Flash Multimodal   │
                    │ Evidence Cross-Matching │
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   TRAVEL INTELLIGENCE   │
                    │ Seasonal · Budget · Tips│
                    └────────────┬────────────┘
                                 │
                                 ▼
                    ┌─────────────────────────┐
                    │   CANONICAL RESPONSE    │
                    │ Best Guess · Nearby · POI│
                    └─────────────────────────┘
```

---

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Library**: React 19, TypeScript
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Primitives**: Radix UI / shadcn

### Engine
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
- **Multimodal AI**: Google Gemini 2.5 Flash

### Data & Persistence
- **Database**: PostgreSQL
- **ORM**: Prisma

---

## Repository Structure

```text
travel-ai/
├── app/                      # Next.js frontend pages and API routes
│   ├── api/analyze/          # Client API proxy route
│   ├── globals.css           # Global Tailwind stylesheet
│   ├── layout.tsx            # Root HTML layout
│   └── page.tsx              # Main landing page
├── components/               # React UI components
│   ├── ui/                   # Reusable primitive components
│   ├── Background.tsx        # Ambient visual background
│   ├── FloatingCards.tsx     # Animated hero cards
│   ├── Hero.tsx              # Hero header and Reel input
│   └── Navbar.tsx            # Top navigation bar
├── engine/                   # Python FastAPI intelligence engine
│   ├── app/
│   │   ├── api/              # API endpoints and route handlers
│   │   ├── main.py           # FastAPI entrypoint
│   │   ├── pipelines/        # Location and verification pipeline
│   │   └── services/         # Modular domain services
│   │       ├── extraction/   # Frame and video extraction
│   │       ├── gemini/       # Gemini verifier and prompt builders
│   │       ├── maps/         # Google Places and enrichment
│   │       ├── ocr/          # OCR text recognition
│   │       ├── response/     # Canonical response builder
│   │       ├── scoring/      # Multi-factor candidate scoring
│   │       ├── speech/       # Audio speech transcription
│   │       └── travel/       # Travel intelligence synthesis
│   ├── domain/schemas/       # Pydantic data schemas
│   └── tests/                # Automated test suite
├── docs/                     # Technical documentation and architecture notes
├── public/                   # Static web assets
├── package.json              # Frontend dependencies and scripts
└── README.md
```

---

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Engine health check |
| `POST` | `/analyze` | Analyze Reel URL and return verified destination |
| `GET` | `/docs` | Interactive Swagger / OpenAPI documentation |
| `GET` | `/test` | Pipeline smoke test endpoint |

### Request

```http
POST /analyze
Content-Type: application/json

{
  "reel_url": "https://www.instagram.com/reel/DN2XxxY2O7-/"
}
```

### Response Schema

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
    "types": ["natural_feature", "establishment"],
    "photos": [
      {
        "url": "https://maps.googleapis.com/maps/api/place/photo?...",
        "width": 1080,
        "height": 720
      }
    ],
    "maps_url": "https://www.google.com/maps/place/?q=place_id:ChIJN1tT3GuHK4cR35ogsmMo848",
    "confidence": 94,
    "confidence_level": "HIGH",
    "verification_status": "VERIFIED",
    "gemini_confidence": 0.95,
    "gemini_reason": "Visual markers match Villa del Balbianello and lake shoreline referenced in caption.",
    "why": "High token match with caption Italian keywords and verified visual landscape."
  },
  "travel_intelligence": {
    "category": "Lakes & Mountains",
    "best_months": ["May", "June", "September"],
    "peak_season": "July - August",
    "avoid_season": "November - February",
    "budget_tier": "Moderate to Luxury",
    "packing_tips": [
      "Comfortable walking shoes",
      "Light layers for boat travel",
      "European plug adapter"
    ],
    "advisories": [
      "Book ferry passes in advance during peak summer months"
    ]
  },
  "nearby_places": [
    {
      "place_id": "ChIJx2...",
      "name": "Villa del Balbianello",
      "formatted_address": "Via Guido Monzino, 1, 22016 Tremezzina CO, Italy",
      "distance_km": 4.2,
      "rating": 4.9,
      "category": "Historical Landmark",
      "maps_url": "https://www.google.com/maps/place/?q=place_id:ChIJx2..."
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

```bash
python -m uvicorn engine.app.main:app --reload
```

The engine runs at `http://127.0.0.1:8000`  
Swagger documentation is available at `http://127.0.0.1:8000/docs`

### 4. Start the Frontend Client

From the repository root:

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Development Status

### Intelligence Engine

```text
Multimodal Extraction       ████████████████████  DONE
Candidate Mining & Dedupe   ████████████████████  DONE
Google Places Integration   ████████████████████  DONE
Geographic Enrichment       ████████████████████  DONE
Nearby Places Discovery     ████████████████████  DONE
Multi-Factor Scoring        ████████████████████  DONE
Gemini Multimodal Verifier  ████████████████████  DONE
Travel Intelligence Rules   ████████████████████  DONE
Canonical Response Builder  ████████████████████  DONE
```

### Product Experience

```text
Landing Page & Visual Shell ████████████████████  DONE
Motion & Animation System   ████████████████████  DONE
URL Input & Validation      ████████████████████  DONE
Analysis Loading States     ████████████████████  DONE
Client-Engine Integration   ██████████░░░░░░░░░░  IN PROGRESS
Destination Results Page    ████████░░░░░░░░░░░░  IN PROGRESS
Saved Collections & Memory  ░░░░░░░░░░░░░░░░░░░░  NEXT
Google Maps Sync & Export   ░░░░░░░░░░░░░░░░░░░░  LATER
```

---

## Roadmap

### 01 — Location Intelligence
- [x] Multimodal extraction pipeline (caption, OCR, speech, frames)
- [x] Candidate entity extraction and deduplication
- [x] Google Places search and Place Details enrichment
- [x] Multi-factor candidate scoring and ranking
- [x] Gemini 2.5 Flash text and vision verification
- [x] Travel intelligence generation (seasons, budgets, packing)
- [x] Canonical response builder

### 02 — Product Experience
- [x] High-performance landing page with fluid motion
- [x] Client-side Instagram URL validation
- [ ] Direct frontend integration with `/analyze` endpoint
- [ ] Interactive destination card with photos and confidence rating
- [ ] "Why this place" explanation card
- [ ] Nearby places carousel with Google Maps navigation links

### 03 — Memory & Collections
- [ ] User authentication and session persistence
- [ ] Saved destinations database
- [ ] Trip itineraries and bucket lists
- [ ] Geographic map view of all saved locations

### 04 — Ecosystem
- [ ] One-click export to Google Maps saved lists
- [ ] Chrome extension for one-click Reel analysis
- [ ] Cross-platform support (YouTube Shorts, TikTok)
- [ ] Public developer API

---

## Accuracy Philosophy

Travel AI approaches destination identification as a **ranking and verification challenge**, not a creative generation prompt.

```text
Caption  +  OCR  +  Speech  +  Hashtags  +  Coordinates  +  Place Types  +  Gemini Verification
```

The system does not search for:
> *"Something that sounds plausible."*

It resolves:
> *"The verified real-world entity that best accounts for all multimodal evidence."*

This is critical when resolving ambiguous location names:

```text
                           "Lake"
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
        Lake Como        Lake Bled        Lake Louise
            │
            ▼
        Verified via Italian caption tokens,
        European power outlet guidance, and
        Villa del Balbianello keyframe match.
```

A strong destination match requires cross-signal validation across at least two independent evidence tracks before receiving high confidence.

---

## Privacy

Travel AI processes **public Instagram Reel URLs**.

- No Instagram account credentials or logins are required to analyze public content.
- Video frames and audio streams are processed ephemerally during analysis.
- Production storage, user data retention, and privacy policies will be finalized prior to public launch.

---

## Contributing

Travel AI is currently in active development by its core maintainer. We are focused on stabilizing the MVP pipeline before opening the repository to external contributions.

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
