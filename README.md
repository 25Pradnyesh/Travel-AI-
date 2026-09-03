<div align="center">

# TRAVEL AI

### Discover it. Save it. Go there.

Turn travel inspiration from Instagram into places you can actually visit.

<br />

![Status](https://img.shields.io/badge/STATUS-IN%20DEVELOPMENT-111111?style=for-the-badge)
![Next.js](https://img.shields.io/badge/NEXT.JS-15-111111?style=for-the-badge&logo=next.js)
![Python](https://img.shields.io/badge/PYTHON-FASTAPI-111111?style=for-the-badge&logo=python)
![TypeScript](https://img.shields.io/badge/TYPESCRIPT-111111?style=for-the-badge&logo=typescript)

<br />

Built by [Pradnyesh](https://github.com/25Pradnyesh)

</div>

---

## The idea

Instagram has become one of the best places to discover where to travel.

A hidden beach.  
A mountain you've never heard of.  
A viewpoint buried inside a 20-second Reel.

You save it.

Then months later:

> **"Where the hell was this place?"**

Travel AI is built to solve exactly that.

Paste a **public Instagram Reel URL** and Travel AI works backwards from the content to identify the real-world destination.

The goal is simple:

**Discover → Understand → Save → Go.**

---

## Reel → Destination

```text
                    INSTAGRAM REEL
                          │
                          ▼
              ┌─────────────────────┐
              │      EXTRACTION      │
              │                     │
              │ Caption             │
              │ Hashtags            │
              │ Speech              │
              │ OCR                 │
              │ Metadata            │
              │ Video Frames        │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │    CANDIDATES       │
              │                     │
              │ Extract clues       │
              │ Normalize           │
              │ Deduplicate         │
              │ Generate candidates │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │    GOOGLE PLACES    │
              │                     │
              │ Search              │
              │ Details             │
              │ Coordinates         │
              │ Geographic context  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │       SCORING       │
              │                     │
              │ Fuzzy matching      │
              │ Token similarity    │
              │ Place types         │
              │ Popularity          │
              │ Geographic signals  │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   GEMINI VERIFY     │
              │                     │
              │ Text reasoning      │
              │ Vision reasoning    │
              │ Winner              │
              │ Confidence          │
              │ Reason              │
              └──────────┬──────────┘
                         │
                         ▼
                   DESTINATION
                         │
                         ▼
              TRAVEL INTELLIGENCE
```

Travel AI does **not** depend on a single clue.

It combines multiple independent signals, searches against real geographic entities, ranks the candidates, and uses Gemini to verify the strongest possibilities.

Instead of asking:

> _"Where is this Reel?"_

the system asks:

> _"Which real-world place best explains everything we know about this Reel?"_

That distinction is the foundation of the location engine.

---

# How it works

### 01 — Extract

Pull useful evidence from the Reel:

- Caption
- Hashtags
- Metadata
- Speech
- OCR
- Video frames

### 02 — Discover

Convert the evidence into possible location candidates.

For example:

```text
Evidence
   │
   ├── "lake"
   ├── mountain scenery
   ├── Italian speech
   └── caption clues
          │
          ▼
     Possible places
          │
          ├── Lake Como
          ├── Lake Bled
          ├── Lake Louise
          └── Lake Tahoe
```

### 03 — Search

Candidates are matched against real locations using Google Places.

This provides actual place records rather than relying only on text similarity.

### 04 — Enrich

The location engine gathers additional context:

- Country
- City
- Region
- Coordinates
- Place details
- Nearby places
- Geographic context

### 05 — Rank

Candidates are scored using multiple signals, including:

- Text similarity
- Token matching
- Geographic relevance
- Google Place types
- Popularity
- Supporting evidence

The strongest candidates are ranked before verification.

### 06 — Verify

Gemini receives the strongest candidates together with the available Reel evidence.

It does **not** search the entire world from scratch.

```text
Top Candidates
      │
      ▼
    Gemini
      │
      ├── Winner
      ├── Confidence
      └── Reason
```

Text and visual evidence can both contribute to the final decision.

### 07 — Understand

Once a destination is resolved, Travel AI generates useful travel context:

- Destination category
- Best months
- Peak season
- Avoid season
- Travel tips
- Packing suggestions
- Trip-duration guidance
- Adventure considerations
- Estimated daily budget

### 08 — Return

The result becomes structured destination data ready for the product experience.

---

# Current capabilities

## Location Intelligence

| Capability                    | Status |
| ----------------------------- | :----: |
| Instagram metadata extraction |   ✅   |
| OCR pipeline                  |   ✅   |
| Speech recognition            |   ✅   |
| Evidence aggregation          |   ✅   |
| Candidate extraction          |   ✅   |
| Candidate normalization       |   ✅   |
| Candidate deduplication       |   ✅   |
| Travel keyword detection      |   ✅   |
| Google Places search          |   ✅   |
| Google Place Details          |   ✅   |
| Geographic enrichment         |   ✅   |
| Nearby search                 |   ✅   |
| Multi-factor scoring          |   ✅   |
| Candidate ranking             |   ✅   |
| Gemini text verification      |   ✅   |
| Gemini vision verification    |   ✅   |
| Location resolution           |   ✅   |

## Travel Intelligence

| Capability                   | Status |
| ---------------------------- | :----: |
| Destination categorization   |   ✅   |
| Travel tips                  |   ✅   |
| Season intelligence          |   ✅   |
| Budget estimation            |   ✅   |
| Weather-aware packing        |   ✅   |
| Trip-duration rules          |   ✅   |
| International travel rules   |   ✅   |
| High-altitude considerations |   ✅   |
| Adventure destination rules  |   ✅   |
| Packing recommendations      |   ✅   |

## Product

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
| Saved destinations     |   ⏳   |
| Google Maps sync       |   ⏳   |

---

# Product direction

Travel AI is intentionally not designed to look like another generic AI dashboard.

The visual direction takes inspiration from:

**Linear**  
Precision, motion, technical clarity.

**Vercel**  
Typography, whitespace, simplicity.

**Apple**  
Hierarchy, restraint, product storytelling.

**Nothing**  
Distinctive identity.

The product should feel:

**minimal · cinematic · precise · quietly technical**

No unnecessary dashboards.  
No walls of AI buzzwords.  
No visual noise.

Just a clear path from inspiration to a real destination.

---

# Architecture

```text
┌─────────────────────────────────────────────┐
│                  FRONTEND                   │
│                                             │
│        Next.js · React · TypeScript        │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                   ENGINE                    │
│                                             │
│                   FastAPI                   │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                 EXTRACTION                  │
│                                             │
│ Metadata · Caption · OCR · Speech · Frames │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│              LOCATION ENGINE                │
│                                             │
│ Candidate Extraction                        │
│ Google Places                               │
│ Place Details                               │
│ Geo Enrichment                              │
│ Nearby Search                               │
│ Candidate Scoring                           │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                VERIFICATION                 │
│                                             │
│              Gemini Text + Vision           │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│             TRAVEL INTELLIGENCE             │
│                                             │
│ Category · Season · Budget · Tips · Packing│
└──────────────────────┬──────────────────────┘
                       │
                       ▼
                FINAL DESTINATION
```

---

# Stack

### Frontend

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- shadcn/ui

### Engine

- Python
- FastAPI
- Modular service architecture

### Intelligence

- Gemini
- OCR
- Speech Recognition
- Vision Analysis
- Geographic Intelligence
- Candidate Scoring

### Location

- Google Places
- Google Place Details
- Nearby Search
- Geo Enrichment
- Candidate Ranking

### Data

- PostgreSQL
- Prisma

---

# Repository structure

```text
travel-ai/
│
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── ui/
│   │   └── button.tsx
│   ├── Background.tsx
│   ├── FloatingCards.tsx
│   ├── Hero.tsx
│   └── Navbar.tsx
│
├── engine/
│   ├── app/
│   │   ├── api/
│   │   ├── config/
│   │   ├── models/
│   │   ├── pipeline/
│   │   ├── prompts/
│   │   ├── providers/
│   │   ├── services/
│   │   │   ├── extraction/
│   │   │   ├── gemini/
│   │   │   ├── itinerary/
│   │   │   ├── location/
│   │   │   ├── maps/
│   │   │   ├── ocr/
│   │   │   ├── scoring/
│   │   │   ├── speech/
│   │   │   └── travel/
│   │   └── utils/
│   ├── assets/
│   ├── core/
│   ├── domain/
│   └── tests/
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
```

---

# API

| Method | Endpoint   | Purpose                       |
| ------ | ---------- | ----------------------------- |
| `GET`  | `/`        | Engine health check           |
| `POST` | `/analyze` | Analyze an Instagram Reel     |
| `GET`  | `/docs`    | FastAPI Swagger documentation |
| `GET`  | `/test`    | Pipeline testing              |

---

# Local development

## Requirements

- Node.js
- Python 3.12+
- npm
- Google Places API key
- Gemini API key

## Clone

```bash
git clone https://github.com/25Pradnyesh/Travel-AI-.git
cd travel-ai
```

## Frontend

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Python engine

Create the virtual environment:

```bash
python -m venv engine/.venv
```

Windows:

```powershell
.\engine\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r engine/requirements.txt
```

Run FastAPI:

```bash
python -m uvicorn engine.main:app --reload
```

API:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

---

# Development status

## Intelligence Engine

```text
Provider Architecture       ████████████████████  DONE
Instagram Extraction        ████████████████████  DONE
Evidence Builder            ████████████████████  DONE
OCR                         ████████████████████  DONE
Speech Recognition          ████████████████████  DONE
Candidate Extraction        ████████████████████  DONE
Google Places               ████████████████████  DONE
Geo Enrichment              ████████████████████  DONE
Nearby Search               ████████████████████  DONE
Scoring Engine              ████████████████████  DONE
Gemini Verification         ████████████████████  DONE
Location Resolution         ████████████████████  DONE
Travel Intelligence        ████████████████████  DONE
```

## Product

```text
Landing Page                ████████████████████  DONE
Motion System               ████████████████████  DONE
Reel URL Input              ████████████████████  DONE
URL Validation              ████████████████████  DONE
Loading State               ████████████████████  DONE
Frontend Integration        ███████░░░░░░░░░░░░  NEXT
Results Experience          ░░░░░░░░░░░░░░░░░░░░  NEXT
Saved Destinations           ░░░░░░░░░░░░░░░░░░░░  LATER
Google Maps Sync             ░░░░░░░░░░░░░░░░░░░░  LATER
```

---

# Roadmap

### 01 — Intelligence

Build an accurate location engine.

- Provider architecture
- Instagram extraction
- Evidence aggregation
- OCR
- Speech recognition
- Candidate extraction
- Google Places
- Geo enrichment
- Nearby search
- Candidate scoring
- Gemini verification
- Location resolution
- Travel intelligence

### 02 — Product

Turn the engine into a complete product experience.

- Connect frontend to analysis API
- Analysis progress experience
- Destination result page
- Destination photos
- Confidence display
- Why-this-place explanation
- Nearby places
- Google Maps CTA

### 03 — Memory

Don't just discover places. Keep them.

- Authentication
- Database
- Saved destinations
- Trips
- Collections
- Country organization
- Bucket lists

### 04 — Everywhere

Take travel discovery beyond one platform.

- Google Maps synchronization
- Chrome extension
- Android application
- YouTube support
- TikTok support
- Public API

---

# Accuracy philosophy

Travel AI treats location identification as a **ranking and verification problem**.

The system combines:

```text
Caption
   +
OCR
   +
Speech
   +
Hashtags
   +
Metadata
   +
Geographic Context
   +
Google Places
   +
Candidate Scoring
   +
Gemini Reasoning
```

The objective isn't:

> **Find something that sounds right.**

It is:

> **Find the real place that best explains the evidence.**

This matters especially when location names are ambiguous.

```text
                "Lake"
                  │
       ┌──────────┼──────────┐
       ▼          ▼          ▼
   Lake Como   Lake Bled   Lake Louise
                              │
                              ▼
                         Lake Tahoe
```

A strong result should be supported by multiple signals, not a single keyword.

---

# Privacy

Travel AI currently focuses on **public Instagram Reel URLs**.

The MVP does not require Instagram login.

Production authentication, storage, retention, and privacy policies will be defined before public launch.

---

# Contributing

Travel AI is currently under active development.

The core repository is focused on building and validating the MVP before opening broader contributions.

---

# License

This project is currently proprietary and under active development.

The source code is not licensed for reuse or redistribution at this stage.

---

<div align="center">

### TRAVEL AI

**Discover it. Save it. Go there.**

<br />

Built by [Pradnyesh](https://github.com/25Pradnyesh)

[GitHub](https://github.com/25Pradnyesh/Travel-AI-)

</div>
