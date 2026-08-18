<div align="center">

# TRAVEL AI

### Discover it. Save it. Go there.

Turn travel inspiration from Instagram into places you can actually visit.

<br />

[![Status](https://img.shields.io/badge/STATUS-IN%20DEVELOPMENT-111111?style=for-the-badge)]()
[![Next.js](https://img.shields.io/badge/NEXT.JS-15-111111?style=for-the-badge&logo=next.js)]()
[![Python](https://img.shields.io/badge/PYTHON-FASTAPI-111111?style=for-the-badge&logo=python)]()
[![TypeScript](https://img.shields.io/badge/TYPESCRIPT-111111?style=for-the-badge&logo=typescript)]()

<br />

**Built by [Pradnyesh](https://github.com/25Pradnyesh)**

</div>

<br />

---

## The idea

Instagram has become one of the best places to discover where to travel.

A hidden beach.

A mountain you've never heard of.

A restaurant in a city you've never visited.

A viewpoint buried inside a 20-second Reel.

You save it.

Then months later:

> **"Where the hell was this place?"**

Travel AI is built to solve exactly that.

Paste a public Instagram Reel and Travel AI works backwards from the content to identify the destination.

---

# From Reel → Destination

```text
                    INSTAGRAM REEL
                          │
                          ▼
                ┌──────────────────┐
                │    EXTRACTION     │
                │                  │
                │  Caption         │
                │  Hashtags        │
                │  Speech          │
                │  OCR             │
                │  Metadata        │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │    CANDIDATES    │
                │                  │
                │  Extract places  │
                │  Generate clues  │
                │  Remove noise    │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │  GOOGLE PLACES   │
                │                  │
                │  Search          │
                │  Details         │
                │  Coordinates     │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │     SCORING      │
                │                  │
                │  Rank candidates │
                │  Compare signals│
                │  Enrich context  │
                └────────┬─────────┘
                         │
                         ▼
                ┌──────────────────┐
                │ GEMINI VERIFY    │
                │                  │
                │  Text reasoning  │
                │  Vision reasoning│
                └────────┬─────────┘
                         │
                         ▼
                  ┌─────────────┐
                  │ DESTINATION │
                  └──────┬──────┘
                         │
                         ▼
                 TRAVEL INTELLIGENCE
```

The important part:

Travel AI doesn't rely on one guess.

It combines multiple pieces of evidence, searches against real places, ranks candidates, and verifies the strongest results.

Why this approach?
Most location systems ask:

"Where is this Reel?"

Travel AI asks something different:

"Given everything we know about this Reel, which real-world place best explains the evidence?"

That turns location detection into a candidate ranking + verification problem.

Caption

- OCR
- Speech
- Hashtags
- Metadata
- Geographic Context
- Google Places
- Scoring
- Gemini
  │
  ▼
  Best Candidate

The pipeline
01 — Extract

Pull useful evidence from the Reel.

Caption
Hashtags
Metadata
Speech
OCR
Video frames

↓

02 — Discover

Generate possible locations from the available evidence.

Lake Como
Lake Bled
Lake Louise
Lake Tahoe

↓

03 — Search

Match candidates against real geographic locations using Google Places.

↓

04 — Enrich

Collect additional geographic context:

Country
City
Region
Coordinates
Nearby places
Place details

↓

05 — Rank

Score candidates using multiple independent signals.

↓

06 — Verify

Send the strongest candidates to Gemini.

Instead of asking Gemini to search the entire world, it receives a small set of already-ranked candidates.

Top 5 Candidates
│
▼
Gemini
│
├── Winner
├── Confidence
└── Reason

↓

07 — Understand

Generate useful destination intelligence.

Travel tips
Packing suggestions
Destination context
Adventure considerations

↓

08 — Return

A structured destination ready for the product experience.

Current capabilities

Location Intelligence

| Capability                    | Status |
| ----------------------------- | :----: |
| Instagram metadata extraction |   ✅   |
| OCR pipeline                  |   ✅   |
| Speech recognition            |   ✅   |
| Candidate extraction          |   ✅   |
| Candidate deduplication       |   ✅   |
| Travel keyword detection      |   ✅   |
| Google Places search          |   ✅   |
| Google Place Details          |   ✅   |
| Geographic enrichment         |   ✅   |
| Multi-factor scoring          |   ✅   |
| Candidate ranking             |   ✅   |
| Gemini text verification      |   ✅   |
| Gemini vision verification    |   ✅   |
| Location resolution           |   ✅   |

Travel Intelligence

| Capability                   | Status |
| ---------------------------- | :----: |
| Travel tips                  |   ✅   |
| Packing suggestions          |   ✅   |
| Weather-aware packing        |   ✅   |
| Trip-duration rules          |   ✅   |
| International travel rules   |   ✅   |
| High-altitude considerations |   ✅   |
| Adventure destination rules  |   ✅   |

Product

| Capability             | Status |
| ---------------------- | :----: |
| Next.js frontend       |   ✅   |
| Animated landing page  |   ✅   |
| Framer Motion          |   ✅   |
| Reel URL input         |   ✅   |
| URL validation         |   ✅   |
| Loading state          |   ✅   |
| Backend integration    |   🚧   |
| Destination results UI |   🚧   |

Product direction

Travel AI is intentionally not trying to look like another generic AI product.

The visual direction is:

Linear
Precision. Motion. Technical clarity.

Vercel
Typography. Whitespace. Simplicity.

Apple
Hierarchy. Restraint. Product storytelling.

Nothing
Distinctive identity.

The goal is a product that feels:

minimal · cinematic · precise · quietly technical

No unnecessary dashboards.

No walls of AI buzzwords.

No visual noise.

Just:

Discover → Understand → Save → Go.

Architecture

┌─────────────────────────────────────────────┐
│ FRONTEND │
│ │
│ Next.js / React / TS │
└──────────────────────┬──────────────────────┘
│
▼
┌─────────────────────────────────────────────┐
│ ENGINE │
│ │
│ FastAPI │
└──────────────────────┬──────────────────────┘
│
▼
┌─────────────────────────────────────────────┐
│ EXTRACTION │
│ │
│ Metadata · Caption · OCR · Speech │
└──────────────────────┬──────────────────────┘
│
▼
┌─────────────────────────────────────────────┐
│ LOCATION ENGINE │
│ │
│ Candidate Extraction │
│ Google Places │
│ Geo Enrichment │
│ Candidate Scoring │
└──────────────────────┬──────────────────────┘
│
▼
┌─────────────────────────────────────────────┐
│ VERIFICATION │
│ │
│ Gemini Text + Vision │
└──────────────────────┬──────────────────────┘
│
▼
┌─────────────────────────────────────────────┐
│ TRAVEL INTELLIGENCE │
│ │
│ Tips · Packing · Context │
└──────────────────────┬──────────────────────┘
│
▼
FINAL DESTINATION

Stack
Frontend
Next.js 15
React
TypeScript
Tailwind CSS
Framer Motion
Lucide React
shadcn/ui
Engine
Python
FastAPI
Modular service architecture
Intelligence
Gemini
OCR
Speech Recognition
Vision Analysis
Geographic Intelligence
Candidate Scoring
Location
Google Places
Place Details
Geo Enrichment
Candidate Ranking
Data
PostgreSQL
Prisma
Repository
travel-ai/
│
├── app/
│ ├── api/
│ │ └── analyze/
│ │ └── route.ts
│ ├── globals.css
│ ├── layout.tsx
│ └── page.tsx
│
├── components/
│ ├── ui/
│ │ └── button.tsx
│ ├── Background.tsx
│ ├── FloatingCards.tsx
│ ├── Hero.tsx
│ └── Navbar.tsx
│
├── engine/
│ ├── app/
│ │ ├── api/
│ │ ├── config/
│ │ ├── models/
│ │ ├── pipeline/
│ │ ├── prompts/
│ │ ├── providers/
│ │ ├── services/
│ │ └── utils/
│ │
│ ├── assets/
│ ├── core/
│ ├── domain/
│ └── tests/
│
├── docs/
├── hooks/
├── lib/
├── prisma/
├── public/
├── scripts/
├── services/
├── styles/
├── types/
│
├── package.json
└── README.md
API
Method Endpoint Purpose
GET / Engine health check
POST /analyze Analyze an Instagram Reel
GET /docs FastAPI Swagger
GET /test Pipeline testing
Local development
Requirements
Node.js
Python 3.12+
npm
Google Places API key
Gemini API key
Clone
git clone https://github.com/25Pradnyesh/Travel-AI-.git
cd travel-ai
Frontend
npm install
npm run dev

Open:

http://localhost:3000
Python engine

Create the environment:

python -m venv engine/.venv

Windows:

.\engine\.venv\Scripts\Activate.ps1

Install dependencies:

pip install -r engine/requirements.txt

Run FastAPI:

python -m uvicorn engine.main:app --reload

API:

http://127.0.0.1:8000

Swagger:

http://127.0.0.1:8000/docs
Development status
INTELLIGENCE ENGINE

Provider Architecture ████████████████████ DONE
Instagram Extraction ████████████████████ DONE
OCR ████████████████████ DONE
Speech ████████████████████ DONE
Candidate Extraction ████████████████████ DONE
Google Places ████████████████████ DONE
Geo Enrichment ████████████████████ DONE
Scoring Engine ████████████████████ DONE
Gemini Verification ████████████████████ DONE
Location Resolution ████████████████████ DONE

PRODUCT

Landing Page ████████████████████ DONE
Motion System ████████████████████ DONE
Reel URL Input ████████████████████ DONE
Frontend Integration ███████░░░░░░░░░░░░░ NEXT
Results Experience ░░░░░░░░░░░░░░░░░░░░ NEXT
Saved Destinations ░░░░░░░░░░░░░░░░░░░░ LATER
Google Maps Sync ░░░░░░░░░░░░░░░░░░░░ LATER
Roadmap
01 — Intelligence

Build the engine.

Provider architecture
Metadata extraction
OCR
Speech
Candidate extraction
Google Places
Geo enrichment
Scoring
Gemini verification
Location resolution
02 — Product

Make the experience effortless.

Landing page
Motion system
Reel URL input
URL validation
Loading state
Connect frontend to analysis API
Analysis progress experience
Destination result page
Nearby places
Maps CTA
03 — Memory

Don't just discover places. Keep them.

Authentication
Database
Saved destinations
Trips
Collections
Country organization
Bucket lists
04 — Everywhere

Take travel discovery beyond one platform.

Google Maps synchronization
Chrome extension
Android application
YouTube support
TikTok support
Public API
Accuracy philosophy

Travel AI treats location identification as a ranking and verification problem.

The system combines:

Caption

- OCR
- Speech
- Hashtags
- Metadata
- Google Places
- Geographic Context
- Candidate Scoring
- Gemini Reasoning

The objective isn't:

Find something that sounds right.

It is:

Find the real place that best explains the evidence.

This becomes especially important for ambiguous locations.

Lake
│
├── Lake Como
├── Lake Bled
├── Lake Louise
└── Lake Tahoe
Privacy

Travel AI currently focuses on public Instagram Reel URLs.

The MVP does not require Instagram login.

Production authentication, storage, retention, and privacy policies will be defined before public launch.

Contributing

Travel AI is currently under active development.

The core repository is focused on building and validating the MVP before opening broader contributions.

License

This project is currently proprietary and under active development.

The source code is not licensed for reuse or redistribution at this stage.

<br /> <div align="center">
TRAVEL AI
Discover it. Save it. Go there.
<br />

Built by Pradnyesh

GitHub

</div> ```
