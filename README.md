<div align="center">

# TRAVEL AI

### Discover it. Save it. Go there.

Turn travel inspiration from Instagram into places you can actually visit.

<br />

[![Status](https://img.shields.io/badge/Status-In%20Development-000000?style=for-the-badge&labelColor=18181b)](https://github.com/25Pradnyesh/Travel-AI-)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white&labelColor=18181b)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python-000000?style=for-the-badge&logo=fastapi&logoColor=white&labelColor=18181b)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-000000?style=for-the-badge&logo=typescript&logoColor=white&labelColor=18181b)](https://www.typescriptlang.org/)

<br />

Built by [Pradnyesh](https://github.com/25Pradnyesh) · [GitHub Repository](https://github.com/25Pradnyesh/Travel-AI-)

</div>

---

## 01 / The Problem

Instagram is full of places worth visiting.

A beach.  
A mountain.  
A viewpoint.  
A tiny village.  
A restaurant you've never heard of.  

You save the Reel.

Months later:

> *"Where was this?"*

Travel AI exists to answer that question.

Paste a public Instagram Reel URL. The system deconstructs the content, resolves the real-world place, and generates actionable travel intelligence for the trip.

---

## 02 / The Core Pipeline

Travel AI treats location discovery as an evidence aggregation and verification problem. Rather than guessing from a single tag, the engine cross-references independent textual, auditory, visual, and geographic signals.

```text
               INSTAGRAM REEL
                     │
                     ▼
          ┌─────────────────────┐
          │     EXTRACTION      │
          │                     │
          │  Caption · Hashtags │
          │  Speech · OCR       │
          │  Metadata · Frames  │
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │ CANDIDATE DISCOVERY │
          │                     │
          │  Clue Extraction    │
          │  Normalization      │
          │  Deduplication      │
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │    GOOGLE PLACES    │
          │                     │
          │  Entity Search      │
          │  Place Details      │
          │  Coordinates        │
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │   GEO ENRICHMENT    │
          │                     │
          │  Country & Region   │
          │  Surrounding Places │
          │  Spatial Hierarchy  │
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │  CANDIDATE SCORING  │
          │                     │
          │  Multi-Factor Match │
          │  Type & Popularity  │
          │  Candidate Ranking  │
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │ GEMINI VERIFICATION │
          │                     │
          │  Text Reasoning     │
          │  Vision Reasoning   │
          │  Confidence Scoring │
          └──────────┬──────────┘
                     │
                     ▼
             FINAL DESTINATION
                     │
                     ▼
            TRAVEL INTELLIGENCE
```

> **Travel AI does not rely on a single clue.**  
> It combines multiple independent signals, searches against real geographic entities, ranks candidates, and verifies the strongest possibilities.

---

## 03 / How It Works

```text
01 Extract ──► 02 Discover ──► 03 Search ──► 04 Enrich ──► 05 Rank ──► 06 Verify ──► 07 Understand ──► 08 Return
```

### 01 — Extract
The pipeline pulls raw evidence across multiple modalities simultaneously:
- Post caption and creator commentary
- Hashtags and engagement metadata
- Audio track transcription via speech recognition
- Video keyframe text via optical character recognition (OCR)
- Visual frame samples captured at fixed temporal intervals

### 02 — Discover
Unstructured text and audio tokens pass through linguistic filters to isolate place name candidates, removing common filler, travel jargon, and stop words.

```text
Raw Signals                           Location Candidates
├── Caption: "Hidden alpine lake"  ──►  Lake Como
├── Speech: "Just outside Cortina" ──►  Lago di Braies
└── Frame OCR: "Dolomiti Superski" ──►  Sorapis
```

### 03 — Search
Candidates are queried directly against Google Places to verify real-world existence, fetching verified place names, place IDs, formatted addresses, and precise geographical coordinates.

### 04 — Enrich
The location engine constructs a spatial hierarchy around each candidate:
- Administrative divisions (locality, region, country)
- Google Place primary categories (natural feature, establishment, transit hub)
- Nearby attractions, viewpoints, and transit nodes within proximity

### 05 — Rank
Candidates are evaluated through a deterministic scoring matrix:
- Lexical overlap and token fuzzy match against extracted evidence
- Place category weight (national parks, viewpoints, and towns rank above generic businesses)
- Geographic coherence across multiple independent mentions
- Supporting signal count across caption, OCR, and speech

### 06 — Verify
Top-ranked candidates are passed to Gemini along with the original Reel evidence and visual keyframes. Gemini evaluates the evidence holistically without searching the open globe from scratch.

```text
Top Candidates + Visual Frames
              │
              ▼
   Gemini Multimodal Verifier
              │
              ├── Confirmed Winner
              ├── Confidence Level (High / Medium / Low)
              └── Structural Rationale
```

### 07 — Understand
Once the destination is confirmed, Travel AI generates domain-specific travel intelligence:
- Categorization (Alpine, Coastal, Urban, Cultural, Wilderness)
- Seasonality (Peak months, shoulder seasons, periods to avoid)
- Estimated daily travel budget tiers
- Region-specific advisories (altitude, weather-aware packing, transit rules)

### 08 — Return
The result is delivered as a typed, structured JSON payload ready for the user interface, maps integration, or persistent collection storage.

---

## 04 / Current Capabilities

### Location Intelligence

| Capability | Scope | Status |
| :--- | :--- | :---: |
| **Instagram Metadata Extraction** | Caption, hashtags, duration, creator info | `DONE` |
| **OCR Text Pipeline** | Keyframe text detection and extraction | `DONE` |
| **Speech Recognition** | Audio extraction and spoken commentary transcription | `DONE` |
| **Evidence Aggregation** | Multi-source signal collation and deduplication | `DONE` |
| **Candidate Extraction** | Named-entity and keyword pattern identification | `DONE` |
| **Candidate Normalization** | Accent removal, casing cleanup, string sanitization | `DONE` |
| **Candidate Deduplication** | Levenshtein and token-based candidate grouping | `DONE` |
| **Travel Keyword Detection** | Heuristic tagging of geographic and travel indicators | `DONE` |
| **Google Places Search** | Text search grounding against verified entities | `DONE` |
| **Google Place Details** | Coordinates, photos, types, and administrative address | `DONE` |
| **Geographic Enrichment** | Spatial hierarchy and regional context building | `DONE` |
| **Nearby Search** | Discovery of contextual landmarks and surroundings | `DONE` |
| **Multi-Factor Scoring** | Algorithmic ranking based on cross-modal frequency | `DONE` |
| **Candidate Ranking** | Tiered priority ordering for downstream verification | `DONE` |
| **Gemini Text Verification** | Multimodal reasoning over transcribed evidence | `DONE` |
| **Gemini Vision Verification** | Keyframe scene matching and landmark identification | `DONE` |
| **Location Resolution** | Final deterministic destination consensus | `DONE` |

### Travel Intelligence

| Capability | Scope | Status |
| :--- | :--- | :---: |
| **Destination Categorization** | Biome, landscape, and trip classification | `DONE` |
| **Travel Tips** | Destination-tailored practical recommendations | `DONE` |
| **Season Intelligence** | Best months, shoulder periods, and off-peak advisories | `DONE` |
| **Budget Estimation** | Daily cost heuristics across economy, mid, and luxury | `DONE` |
| **Weather-Aware Packing** | Dynamic gear checklists based on climate profile | `DONE` |
| **Trip-Duration Rules** | Suggested days required to experience the area | `DONE` |
| **International Travel Rules** | Visa, passport, currency, and entry prerequisites | `DONE` |
| **High-Altitude Considerations** | Acclimatization tips, altitude warnings, and safety notes | `DONE` |
| **Adventure Destination Rules** | Physical preparedness, terrain alerts, and seasonal caution | `DONE` |
| **Packing Recommendations** | Essential item checklist tailored to activity and climate | `DONE` |

### Product

| Milestone | Scope | Status |
| :--- | :--- | :---: |
| **Next.js Frontend Shell** | Modern application frame and responsive layout | `DONE` |
| **Animated Landing Experience** | Micro-interactions and motion choreography via Framer Motion | `DONE` |
| **Reel URL Input** | High-contrast input field with paste shortcuts | `DONE` |
| **URL Validation** | Format validation for public Instagram Reel links | `DONE` |
| **Loading State System** | Step-by-step extraction and analysis visual indicators | `DONE` |
| **Engine API Integration** | Direct client-to-FastAPI analysis request pipeline | `IN PROGRESS` |
| **Destination Results UI** | Structured result view with photography, tags, and summary | `IN PROGRESS` |
| **Saved Destinations** | User collections, folders, and trip boards | `NEXT` |
| **Google Maps Sync** | Direct export to saved Google Maps lists | `LATER` |

---

## 05 / Product Experience

The interface is engineered to eliminate friction between discovery and planning.

```text
Paste Reel ──► Analyze ──► Understand ──► Discover Destination ──► Explore Nearby Places ──► Open Maps ──► Save
```

1. **Input** — A traveler pastes any public Instagram Reel URL into the input field.
2. **Analysis** — Real-time progress indicators track extraction across caption, speech, frames, and location search.
3. **Identification** — The exact destination is displayed with high-resolution photography, verification reasoning, and confidence metrics.
4. **Context** — Best seasons to visit, daily budget projections, packing essentials, and duration advice appear alongside the result.
5. **Action** — The traveler explores nearby spots, opens coordinates directly in Google Maps, or saves the destination for future itineraries.

---

## 06 / Design Direction

Travel AI avoids the cluttered, dashboard-heavy aesthetics common in modern AI utilities. The design language prioritizes whitespace, typography, and calm visual precision.

```text
LINEAR       Precision · Motion · Technical Clarity
VERCEL       Whitespace · Typography · Simplicity
APPLE        Hierarchy · Restraint · Product Storytelling
NOTHING      Distinctive Identity
```

> **The goal:**  
> minimal · cinematic · precise · quietly technical

Every component is intentional: high-contrast typography, restrained dark surfaces, purposeful micro-animations, and zero decorative noise.

---

## 07 / Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                          FRONTEND                           │
│                                                             │
│                Next.js 15 · React 19 · TypeScript           │
│             Tailwind CSS v4 · Framer Motion · Radix         │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       INTELLIGENCE ENGINE                   │
│                                                             │
│                        Python · FastAPI                     │
└──────────────────────────────┬──────────────────────────────┘
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
┌───────────────────────┐             ┌───────────────────────┐
│      EXTRACTION       │             │    LOCATION ENGINE    │
│                       │             │                       │
│  Instagram Metadata   │             │  Candidate Extraction │
│  Caption & Hashtags   │ ──────────► │  Google Places Search │
│  Video Keyframes      │             │  Place Details        │
│  Tesseract OCR        │             │  Geographic Context   │
│  Speech Transcription │             │  Candidate Scoring    │
└───────────────────────┘             └───────────┬───────────┘
                                                  │
                                                  ▼
┌───────────────────────┐             ┌───────────────────────┐
│  TRAVEL INTELLIGENCE  │             │     VERIFICATION      │
│                       │             │                       │
│  Category & Seasons   │ ◄────────── │  Gemini Text Model    │
│  Budget & Tips        │             │  Gemini Vision Model  │
│  Packing & Advisories │             │  Confidence Consensus │
└───────────────────────┘             └───────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────┐
│                      FINAL DESTINATION                      │
│            Resolved Place · Confidence · Intelligence       │
└─────────────────────────────────────────────────────────────┘
```

---

## 08 / Tech Stack

| Domain | Technology | Implementation Detail |
| :--- | :--- | :--- |
| **Frontend** | [Next.js 15](https://nextjs.org/) | App Router architecture, server components, and route handlers |
| | [React 19](https://react.dev/) | Component architecture and concurrent rendering |
| | [TypeScript 5](https://www.typescriptlang.org/) | Strict type checking and shared data schemas |
| | [Tailwind CSS v4](https://tailwindcss.com/) | Modern CSS engine and design tokens |
| | [Framer Motion](https://www.framer.com/motion/) | Cinematic transitions, spring physics, and layout animations |
| | [Lucide React](https://lucide.dev/) | Clean iconography system |
| **Engine** | [Python 3.12+](https://www.python.org/) | Core language runtime for media processing and analysis |
| | [FastAPI](https://fastapi.tiangolo.com/) | High-throughput asynchronous REST API framework |
| | [Uvicorn](https://www.uvicorn.org/) | ASGI web server implementation |
| | [Pydantic](https://docs.pydantic.dev/) | Request validation and structured data modeling |
| **AI / Intelligence** | [Google Gemini](https://ai.google.dev/) | Multimodal text and vision reasoning for candidate verification |
| | Optical Character Recognition | Keyframe text parsing and location clue extraction |
| | Speech Recognition | Audio track transcription for spoken location clues |
| **Location** | [Google Places API](https://developers.google.com/maps/documentation/places/web-service) | Text Search, Place Details, and Nearby Search grounding |
| | Geographic Enrichment Engine | Spatial hierarchy resolution and landmark clustering |
| **Data & Storage** | [Prisma](https://www.prisma.io/) | Type-safe ORM for user state and collections (planned) |
| | [PostgreSQL](https://www.postgresql.org/) | Relational database for persisted travel destinations |

---

## 09 / Repository Structure

```text
travel-ai/
├── app/                              # Next.js App Router
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts              # Client API proxy to Python engine
│   ├── globals.css                   # Global styles and Tailwind tokens
│   ├── layout.tsx                    # Root application layout and fonts
│   └── page.tsx                      # Landing page and primary search hero
│
├── components/                       # User interface components
│   ├── ui/
│   │   └── button.tsx                # Base button primitive
│   ├── Background.tsx                # Ambient atmospheric background
│   ├── FloatingCards.tsx             # Interactive floating destination previews
│   ├── Hero.tsx                      # Hero input with paste support
│   └── Navbar.tsx                    # Header navigation bar
│
├── engine/                           # Python intelligence engine
│   ├── app/
│   │   ├── api/
│   │   │   └── test_routes.py        # Pipeline testing & diagnostic endpoints
│   │   ├── main.py                   # FastAPI application initialization
│   │   ├── pipelines/
│   │   │   └── location_pipeline.py  # Multi-stage resolution pipeline
│   │   └── services/
│   │       ├── extraction/           # Frame & evidence extraction
│   │       ├── gemini/               # Gemini text & vision verification
│   │       ├── location/             # Candidate extraction & resolution
│   │       ├── maps/                 # Google Places client & helpers
│   │       ├── ocr/                  # Optical character recognition
│   │       ├── scoring/              # Multi-factor scoring algorithms
│   │       ├── speech/               # Speech-to-text transcription
│   │       └── travel/               # Travel intelligence heuristics
│   ├── assets/                       # Sample media and diagnostic test frames
│   ├── core/                         # Configuration and environment setup
│   └── requirements.txt              # Engine dependencies
│
├── docs/                             # Architecture documentation
├── prisma/                           # Database schema and migrations
├── public/                           # Static assets and brand marks
├── package.json                      # Frontend dependencies and scripts
└── README.md                         # Project documentation
```

---

## 10 / API Reference

The FastAPI engine serves diagnostic endpoints and the core analysis pipeline:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Engine health check, status indicator, and service version |
| `POST` | `/analyze` | Primary endpoint: accepts an Instagram Reel URL and runs the full pipeline |
| `GET` | `/health` | Diagnostic ping for monitoring uptime and readiness |
| `GET` | `/docs` | Interactive Swagger API documentation and playground |
| `POST` | `/provider` | Test provider extraction on sample Instagram content |
| `GET` | `/places` | Test Google Places search queries and entity matching |
| `GET` | `/frames` | Test keyframe extraction from sample video assets |
| `GET` | `/ocr` | Test OCR text extraction across extracted video frames |
| `GET` | `/speech` | Test speech-to-text audio transcription |

### Sample Analysis Request

```bash
curl -X POST http://127.0.0.1:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{"reel_url": "https://www.instagram.com/reel/DN2XxxY2O7-/"}'
```

---

## 11 / Local Development

### Prerequisites

Ensure the following tools are installed on your workstation:
- [Node.js](https://nodejs.org/) 20 or later
- [Python](https://www.python.org/) 3.12 or later
- [npm](https://www.npmjs.com/) package manager
- Google Places API Key
- Google Gemini API Key

### 1. Clone the Repository

```bash
git clone https://github.com/25Pradnyesh/Travel-AI-.git
cd travel-ai
```

### 2. Frontend Setup

Install dependencies and start the Next.js development server:

```bash
npm install
npm run dev
```

The web interface will be available at:

```text
http://localhost:3000
```

### 3. Python Engine Setup

Open a new terminal window to configure the intelligence engine.

Create and activate a virtual environment:

```bash
python -m venv engine/.venv
```

**Windows (PowerShell):**

```powershell
.\engine\.venv\Scripts\Activate.ps1
```

**macOS / Linux:**

```bash
source engine/.venv/bin/activate
```

Install engine dependencies:

```bash
pip install -r engine/requirements.txt
```

### 4. Configure Environment Variables

Create `.env` in the `engine/` directory:

```env
GOOGLE_PLACES_API_KEY=your_google_places_key
GEMINI_API_KEY=your_gemini_key
```

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

### 5. Run the FastAPI Engine

```bash
python -m uvicorn engine.app.main:app --reload
```

The engine endpoints and documentation will be accessible at:
- **API Root:** `http://127.0.0.1:8000`
- **Interactive Swagger Docs:** `http://127.0.0.1:8000/docs`

---

## 12 / Development Status

### Intelligence Engine

```text
Provider Architecture        ████████████████████  COMPLETE
Instagram Reel Extraction    ████████████████████  COMPLETE
Evidence Aggregation         ████████████████████  COMPLETE
OCR Keyframe Pipeline        ████████████████████  COMPLETE
Speech Transcription         ████████████████████  COMPLETE
Candidate Discovery          ████████████████████  COMPLETE
Google Places Integration    ████████████████████  COMPLETE
Geographic Enrichment        ████████████████████  COMPLETE
Candidate Scoring Matrix     ████████████████████  COMPLETE
Gemini Text Verification     ████████████████████  COMPLETE
Gemini Vision Verification   ████████████████████  COMPLETE
Location Resolution Consensus████████████████████  COMPLETE
Travel Intelligence Heuristic████████████████████  COMPLETE
```

### Product Experience

```text
Next.js Application Shell    ████████████████████  COMPLETE
Landing Page & Motion System ████████████████████  COMPLETE
Reel URL Input & Validation  ████████████████████  COMPLETE
Analysis Loading States      ████████████████████  COMPLETE
Client-to-Engine Integration ██████████░░░░░░░░░░  IN PROGRESS
Destination Results Display  ████████░░░░░░░░░░░░  IN PROGRESS
Interactive Map Preview      ░░░░░░░░░░░░░░░░░░░░  NEXT
Saved Destinations & Boards  ░░░░░░░░░░░░░░░░░░░░  LATER
Google Maps List Export      ░░░░░░░░░░░░░░░░░░░░  LATER
```

---

## 13 / Roadmap

```text
Phase 01                Phase 02                Phase 03                Phase 04
INTELLIGENCE            PRODUCT                 MEMORY                  EVERYWHERE
```

### 01 — Intelligence
Establish the core extraction, resolution, and verification engine.
- Provider architecture for reliable Instagram media extraction
- Multi-modal signal parsing (Caption, Hashtags, OCR, Speech, Frames)
- Google Places grounding and spatial hierarchy building
- Multi-factor algorithmic candidate scoring
- Gemini multimodal verification and confidence consensus
- Structured travel intelligence synthesis

### 02 — Product
Bridge the intelligence engine into a polished consumer experience.
- Full frontend client integration with the `/analyze` route
- Animated step-by-step resolution feedback in the UI
- High-fidelity destination card with photo carousels
- Contextual rationale: "Why this place?" explanation display
- Nearby points of interest and transit access
- Direct "Open in Google Maps" deep-linking

### 03 — Memory
Transform single lookups into a persistent travel system.
- User accounts and authentication
- Relational storage for resolved destinations
- Custom trip boards, folders, and country collections
- Personal travel bucket lists and visit tracking

### 04 — Everywhere
Make destination discovery accessible anywhere travel inspiration strikes.
- Chrome and Safari browser extensions for one-click discovery
- Native iOS and Android share-sheet targets
- Expansion to YouTube Shorts and TikTok video formats
- Public developer API for travel platforms

---

## 14 / Accuracy Philosophy

Travel AI approaches location discovery not as a generative text prompt, but as a **grounded ranking and verification problem**.

```text
Caption + OCR + Speech + Hashtags + Metadata + Spatial Context + Google Places + Scoring + Gemini Reasoning
                                                    │
                                                    ▼
                                      Best Supported Destination
```

The objective is never:

> *"Find something that sounds plausible."*

The objective is:

> **"Find the real place on Earth that best explains the combined evidence."**

### Resolving Ambiguity

Consider a video caption that mentions only the word **"Lake"**:

```text
                          "Lake"
                            │
       ┌────────────────────┼────────────────────┐
       ▼                    ▼                    ▼
   Lake Como            Lake Bled           Lake Louise
       │                    │                    │
       │ (Italian speech)   │ (Castle in frame)  │ (Canadian Rockies)
       │ (Como OCR tag)     │ (Julian Alps tag)  │ (Banff caption)
       ▼                    ▼                    ▼
 Verified Italian     Verified Slovenian    Verified Canadian
    Destination          Destination           Destination
```

A generic model will hallucinate a guess based on the most statistically common lake in its training corpus. 

Travel AI validates candidates against verified real-world places, measures agreement across independent media tracks, and requires multimodal verification before declaring a winner.

---

## 15 / Privacy

- **Public URLs Only** — Travel AI exclusively operates on publicly accessible Instagram Reel links.
- **Zero Login Barrier** — No Instagram account credentials or session tokens are required from users.
- **Data Retention** — Production user authentication, saved trip storage, data retention limits, and comprehensive privacy guidelines will be formally established prior to general public availability.

---

## 16 / Contributing & License

### Contributing
Travel AI is currently under active development as a proprietary product. The codebase is focused on completing and validating the core MVP. External pull requests are not being accepted at this time.

### License
All rights reserved. This repository and its contents are proprietary. The source code is not licensed for reuse, redistribution, or commercial use.

---

<div align="center">

### TRAVEL AI

**Discover it. Save it. Go there.**

<br />

Built by [Pradnyesh](https://github.com/25Pradnyesh) · [GitHub](https://github.com/25Pradnyesh/Travel-AI-)

</div>
