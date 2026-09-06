<div align="center">

# TRAVEL AI

### Discover it. Save it. Go there.

Turn Instagram travel Reels into real-world destinations.

<br />

[![Next.js](https://img.shields.io/badge/Next.js%2016-18181B?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-18181B?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python%203.12-18181B?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-18181B?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Google Places](https://img.shields.io/badge/Google%20Places-18181B?style=for-the-badge&logo=googlemaps&logoColor=white)](https://developers.google.com/maps)
[![Gemini](https://img.shields.io/badge/Gemini%20Verification-18181B?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)

<br />

<p align="center">
  <strong>TRAVEL DISCOVERY</strong><br />
  <em>Your next trip is hiding in your feed.</em>
</p>

</div>

---

## What is Travel AI?

People discover extraordinary places through Instagram Reels every day: a hidden cove in Mallorca, a cliffside espresso bar in Amalfi, a mountain hut in the Dolomites.

Yet the actual destination is almost impossible to identify and save. Captions are often cryptic, location tags are omitted, and audio tracks rarely provide geographic context. Saved collections quietly become graveyards of unnamed locations.

**Travel AI reverses this experience.**

When you paste a public Instagram Reel URL, the system reverse-engineers the video—combining on-screen signage, spoken audio, visual landmarks, and caption clues—to identify the exact real-world place.

Instead of guessing or returning vague regions, Travel AI anchors every discovery to verified Google Places coordinates, explains why the place was matched, and synthesizes practical travel intelligence so you can actually visit.

```text
Discover  ──►  Understand  ──►  Save  ──►  Go
```

---

## Reel → Destination

Travel AI does not prompt an LLM with *"Where is this video?"* and hope for a plausible answer.

Instead, the system follows an evidence-based pipeline: extracting multimodal signals, grounding candidates in geographic databases, scoring them against evidence, and verifying the winner with Gemini:

```text
               PUBLIC INSTAGRAM REEL
                         │
                         ▼
                  EXTRACT EVIDENCE
      Caption · Hashtags · OCR · Speech · Frames
                         │
                         ▼
                GENERATE CANDIDATES
          Entity Mining & Normalization
                         │
                         ▼
                   GOOGLE PLACES
            Place Search & Details API
                         │
                         ▼
                  RANK & ENRICH
        Multi-Factor Scoring & Context
                         │
                         ▼
                GEMINI VERIFICATION
          Text & Keyframe Cross-Checking
                         │
                         ▼
              DESTINATION EXPERIENCE
     Hero · Verification · Intelligence · Maps
```

---

## Destination Experience

When analysis completes, Travel AI presents a cinematic, editorial destination experience built to turn social media inspiration into trip planning.

```text
┌─────────────────────────────────────────────────────────────┐
│ DESTINATION                                                 │
│                                                             │
│ [ CINEMATIC DESTINATION PHOTO ]                             │
│                                                             │
│ Lake Como                                                   │
│ Como, Lombardy, Italy                                       │
│                                                             │
│ VERIFIED MATCH · 94% CONFIDENCE                             │
│                                                             │
│ "Why This Place: Matched caption Italian keywords and      │
│  verified visual alpine shoreline features."                │
│                                                             │
│ BEST SEASON         DAILY BUDGET         DURATION           │
│ May to September    $150 - $250          2-4 Days           │
│                                                             │
│ [ Open in Google Maps → ]                                   │
└─────────────────────────────────────────────────────────────┘
```

### The Core Product Moment
- **Cinematic Imagery**: Displays high-resolution Google Places photography with author attribution, backed by a neutral topographic fallback when photos are unavailable.
- **Typographic Hierarchy**: The verified destination name is the primary visual anchor, accompanied by country, region, and formatted address.
- **Verification Badge & Confidence**: Clear status indicators (`VERIFIED`, `PARTIAL`, `SKIPPED`, `FAILED`) paired with an accessible match confidence meter.
- **Editorial Rationale**: The "Why this place" section provides the exact reasoning behind the destination match without exposing internal scoring math.
- **Travel Intelligence**: Actionable details including best visiting window, peak months, months to avoid, and recommended duration.
- **Trip Budget**: Estimated daily expenses and budget tiers tailored to the destination style.
- **Curated Travel Tips**: Practical local advice presented in concise, readable cards.
- **Nearby Places**: Discovered surrounding attractions and viewpoints with ratings, categories, and distances.
- **Google Maps Action**: One-click jump to Google Maps for immediate navigation and saving.

---

## What It Can Do

### Reel Analysis
- Ingest public Instagram Reel URLs with client and server validation
- Extract caption text, hashtags, and creator metadata
- Scan video keyframes for on-screen signage, subtitles, and watermarks via EasyOCR
- Transcribe speech and ambient spoken mentions via OpenAI Whisper

### Location Intelligence
- Mine geographic candidate strings and deduplicate regional references
- Query Google Places API to establish verified entity ground truth
- Fetch official coordinates, place types, user ratings, and reviews
- Enrich administrative hierarchy (city, region, country)
- Discover nearby attractions, landmarks, and lodging

### Verification
- Gemini text verification against extracted caption, OCR, and speech clues
- Gemini vision verification cross-referencing video keyframes against place visual features
- Deterministic winner selection balancing scoring priors and multimodal reasoning
- Transparent verification states (`VERIFIED`, `PARTIAL`, `SKIPPED`, `FAILED`)
- Graceful fallbacks when verification cannot run or API limits occur

### Destination Experience
- Cinematic destination hero with responsive media containers
- Neutral cartographic fallback for places without Google imagery
- Match confidence percentage and accessible visual meter
- Dedicated "Why this place" editorial quote card
- About the Destination travel summary
- Seasonal intelligence with peak and avoid month tags
- Daily budget estimations and currency standards
- Local travel tips formatted for clean reading
- Surrounding attractions grid with distances and ratings
- Direct Google Maps routing CTA

---

## Development Status

| Milestone | Area | Status |
|---|---|:---:|
| **Phase 1** — Location Extraction | Extraction | Completed |
| **Phase 2** — Evidence Extraction | Multimodal Signals | Completed |
| **Phase 3** — Candidate Generation | Entity Mining | Completed |
| **Phase 4** — Google Places Grounding | Geographic Ground Truth | Completed |
| **Phase 5** — Gemini Verification | Multimodal Verification | Completed |
| **Phase 6** — Final Destination Response | Canonical Schema Builder | Completed |
| **Phase 7** — Frontend Integration | Next.js ↔ FastAPI Proxy | Completed |
| **Phase 8** — Destination Experience | Cinematic UI & Intelligence | Completed |
| **Phase 9** — Saved Destinations & Memory | Personal Library | Planned |
| **Phase 10** — Trips & Collections | Itineraries & Bucket Lists | Planned |
| **Phase 11** — Google Maps List Sync | One-Click List Export | Planned |
| **Phase 12** — Everywhere | Extension & Mobile Apps | Planned |

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
                     │ Budget · Tips · Timing  │
                     └────────────┬────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │    RESPONSE BUILDER     │
                     │ Canonical Best Guess    │
                     │ Nearby POIs · Summary   │
                     └────────────┬────────────┘
                                  │
                                  ▼
                     ┌─────────────────────────┐
                     │ DESTINATION EXPERIENCE  │
                     │  Hero · Why · Maps CTA  │
                     └─────────────────────────┘
```

---

## Tech Stack

| Layer | Technologies | Role |
|---|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript | App Router web application |
| **Styling** | Tailwind CSS v4, Lucide React | Clean, high-contrast dark aesthetic |
| **Motion** | Framer Motion | Subtle, cubic-bezier staggered animation |
| **Backend Engine** | Python 3.12, FastAPI, Uvicorn | High-performance asynchronous API |
| **Data Validation** | Pydantic v2 | Strict schema contracts and serialization |
| **Multimodal Vision** | OpenCV, EasyOCR | Keyframe sampling and on-screen text recognition |
| **Speech Processing** | OpenAI Whisper | Audio speech-to-text transcription |
| **Media Ingestion** | yt-dlp | Reel audio, video, and metadata extraction |
| **Geographic Grounding** | Google Places API | Text Search, Place Details, Nearby Search |
| **AI Verification** | Google Gemini | Multimodal text reasoning & keyframe verification |

---

## Repository Structure

```text
travel-ai/
├── app/                          # Next.js App Router
│   ├── api/analyze/route.ts      # API proxy forwarding requests to FastAPI
│   ├── globals.css               # Tailwind CSS stylesheet
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page & destination experience orchestrator
├── components/                   # React UI components
│   ├── destination/              # Phase 8 Destination Experience
│   │   ├── BudgetCard.tsx        # Daily budget, currency, and duration card
│   │   ├── DestinationActions.tsx# Primary Google Maps CTA & reset button
│   │   ├── DestinationExperience.tsx # Master container & motion orchestration
│   │   ├── DestinationHero.tsx   # Cinematic photo, prominent title & rating
│   │   ├── DestinationReason.tsx # "Why this place" editorial quote card
│   │   ├── DestinationVerification.tsx # Status badge & confidence meter
│   │   ├── NearbyPlaces.tsx      # Surrounding POIs grid with distances
│   │   ├── TravelIntelligenceSection.tsx # Seasonal timing & peak month tags
│   │   ├── TravelSummary.tsx     # Editorial destination summary
│   │   └── TravelTips.tsx        # Concise local guidance cards
│   ├── ui/                       # Primitive UI components
│   ├── Background.tsx            # Ambient visual backdrop
│   ├── FloatingCards.tsx         # Decorative visual accents
│   ├── Hero.tsx                  # Reel URL input, validation & loading states
│   └── Navbar.tsx                # Minimalist navigation bar
├── engine/                       # FastAPI intelligence engine
│   ├── app/
│   │   ├── api/                  # API routers (analyze, health, test)
│   │   ├── main.py               # FastAPI application entrypoint
│   │   ├── pipelines/            # LocationPipeline execution controller
│   │   └── services/             # Modular domain services
│   │       ├── extraction/       # Video download, frames, evidence builder
│   │       ├── gemini/           # Gemini verifier, prompt builders, parsers
│   │       ├── location/         # Candidate mining & resolver
│   │       ├── maps/             # Google Places API client & geo enrichment
│   │       ├── ocr/              # EasyOCR text recognition
│   │       ├── response/         # Canonical Phase 6 response builder
│   │       ├── scoring/          # Multi-factor scoring matrix
│   │       ├── speech/           # Whisper audio transcription
│   │       └── travel/           # Travel intelligence synthesizer
│   ├── domain/schemas/           # Pydantic schemas (AnalysisResponse, etc.)
│   └── tests/                    # 31 automated unit & regression tests
├── types/                        # TypeScript definitions
│   └── analysis.ts               # Canonical response & request interfaces
├── package.json                  # Frontend dependencies and scripts
└── README.md
```

---

## Accuracy Philosophy

Travel AI approaches destination identification as an **evidence-based ranking and verification problem**, not an unconstrained text generation prompt.

```text
Caption + OCR + Speech + Hashtags + Metadata + Geographic Context + Google Places + Scoring + Gemini + Vision
= Best Supported Destination
```

The system does not generate:
> *"Something that sounds plausible."*

It resolves:
> *"The verified real-world place that best accounts for all available evidence."*

### Core Principles
1. **Multiple Evidence Signals**: No single signal is trusted blindly. Evidence from captions, OCR, speech, and frames must align.
2. **Ground Truth Anchor**: Every candidate must exist in the Google Places database with verified coordinates.
3. **Transparent Uncertainty**: When confidence is moderate or partial, the UI clearly displays `PARTIAL` or `SKIPPED` rather than presenting an unverified guess as a certainty.
4. **No Fabricated Destinations**: If a Reel cannot be confidently matched, the system returns a clean failure state rather than inventing a place.

---

## Input & Privacy

Travel AI processes **public Instagram Reel URLs**.

- No Instagram account credentials or personal logins are required.
- Video frames and audio tracks are processed ephemerally during analysis.
- The system only reads publicly accessible content shared by travel creators.

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

### 2. Environment Variables

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
# Windows PowerShell (with UTF-8 support)
$env:PYTHONUTF8="1"; python -m uvicorn engine.app.main:app --reload
```

```bash
# macOS / Linux
python -m uvicorn engine.app.main:app --reload
```

- Engine runs at `http://127.0.0.1:8000`
- Interactive Swagger documentation is available at `http://127.0.0.1:8000/docs`

### 4. Start the Frontend Client

From the project root:
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running Verification
```bash
# Frontend linting & production build
npm run lint
npm run build

# Backend regression test suite (31 tests)
$env:PYTHONUTF8="1"; engine\.venv\Scripts\python.exe -m unittest discover -s engine/tests -p "*test*.py"
```

---

## Roadmap

### Current Milestones `COMPLETED`
- [x] **Phase 1–4**: Extraction, OCR, Whisper speech transcription, candidate mining, Google Places grounding
- [x] **Phase 5**: Gemini multimodal text and vision verification
- [x] **Phase 6**: Canonical destination response builder
- [x] **Phase 7**: Next.js ↔ FastAPI proxy integration
- [x] **Phase 8**: Cinematic Destination Experience (Hero, verification, why rationale, travel intelligence, budget, tips, nearby places, Google Maps CTA)

### Upcoming Milestones `PLANNED`
- [ ] **Phase 9**: Saved Destinations & Memory (personal destination bookmarking, local database persistence)
- [ ] **Phase 10**: Trips & Collections (custom trip itineraries, bucket lists, categorized collections)
- [ ] **Phase 11**: Google Maps List Export (one-click synchronization to saved Google Maps lists)
- [ ] **Phase 12**: Production Hardening & Rate Limiting (caching layer, production deployment configuration)
- [ ] **Phase 13**: Everywhere (browser extension for one-click Reel analysis, YouTube Shorts & TikTok support)

---

<div align="center">

### Built by

**Pradnyesh**

*Connecting creative direction with autonomous agent architectures.*

<br />

[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/25Pradnyesh)
&nbsp;&nbsp;
[![X](https://img.shields.io/badge/X-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/Pradnyesh_25)

<br />

[@25Pradnyesh](https://github.com/25Pradnyesh) &nbsp;·&nbsp; [@Pradnyesh_25](https://x.com/Pradnyesh_25)

<br />

**TRAVEL AI** · *Discover it. Save it. Go there.*

</div>
