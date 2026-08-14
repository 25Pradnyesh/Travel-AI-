@'

# 🌍 Travel AI

> **Turn Instagram inspiration into real destinations.**

Travel AI finds the places hidden inside Instagram Reels and turns them into structured, useful travel destinations.

Paste a public Instagram Reel → Travel AI analyzes the content → extracts location clues → searches and ranks real places → verifies the strongest candidates → returns travel intelligence.

---

<div align="center">

### 📍 Reel → Location → Travel Intelligence

**Save the places you discover before they disappear into your saved posts.**

</div>

---

## ✨ The Problem

Instagram is one of the biggest sources of travel inspiration.

The problem?

You save a Reel today and six months later:

> _"Where the fuck was this place?"_

The location might be hidden inside captions, hashtags, on-screen text, spoken audio, place names, visual landmarks, or metadata.

**Saving a Reel isn't the same as saving the destination.**

Travel AI bridges that gap.

---

# 🚀 What Travel AI Does

````text
Instagram Reel
      ↓
Content Extraction
      ↓
┌─────┼─────┐
↓     ↓     ↓
OCR Speech Caption
└─────┼─────┘
      ↓
Candidate Extraction
      ↓
Google Places
      ↓
Geo Enrichment
      ↓
Scoring Engine
      ↓
Top Candidates
      ↓
Gemini Verification
      ↓
Travel Intelligence
      ↓
📍 Final Destination

🧠 Intelligence Pipeline
01 — Content Extraction

Travel AI extracts useful evidence from the Reel:

Caption
Hashtags
Metadata
Speech
OCR text
Video frames
02 — Candidate Extraction

Potential locations are extracted from the available evidence.

Examples:
Lake Como
Swiss Alps
Dolomites
Grand Canyon
Kyoto

03 — Candidate Search

Potential locations are matched against real geographic places using Google Places.

04 — Geo Enrichment

Candidates are enriched with geographic context such as:

Country
City
Region
Coordinates
Nearby places
05 — Scoring

Candidates are ranked using multiple independent signals instead of trusting a single prediction.

06 — Gemini Verification

The strongest candidates are passed to Gemini for additional reasoning.

Instead of asking Gemini to search the entire planet, Travel AI gives it a small set of already-ranked candidates.

Top Candidates
      ↓
   Gemini
      ↓
Best Match
      ↓
Confidence + Reason

07 — Travel Intelligence

Once the destination is identified, Travel AI can generate useful travel context including:

Travel tips
Packing suggestions
Destination information
Adventure considerations

🎯 Core Architecture

┌───────────────────────────────┐
│       Instagram Reel          │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│      Provider Extraction      │
│        Metadata / Media       │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│        Evidence Layer         │
│   Caption • OCR • Speech      │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│       Candidate Service       │
│       Location Extraction     │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│        Google Places          │
│       Candidate Search        │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│        Geo Enrichment         │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│        Scoring Engine         │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│      Gemini Verification      │
│        Text + Vision          │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│     Travel Intelligence       │
│   Tips + Packing + Context    │
└───────────────┬───────────────┘
                ↓
┌───────────────────────────────┐
│       Final Destination       │
└───────────────────────────────┘

✨ Current Features
Location Intelligence
✅ Instagram metadata extraction
✅ OCR pipeline
✅ Speech recognition pipeline
✅ Candidate extraction
✅ Candidate deduplication
✅ Travel keyword detection
✅ Google Places search
✅ Google Place Details
✅ Geographic enrichment
✅ Multi-factor location scoring
✅ Top candidate ranking
✅ Gemini text verification
✅ Gemini vision verification
✅ Final destination resolution
Travel Intelligence
✅ Travel tips generation
✅ Weather-aware packing suggestions
✅ Destination category rules
✅ Trip-duration packing rules
✅ International travel packing rules
✅ High-altitude considerations
✅ Adventure destination suggestions
Frontend
✅ Next.js landing page
✅ Animated hero
✅ Framer Motion interactions
✅ Instagram Reel URL input
✅ Client-side URL validation
✅ Loading state
🚧 Backend integration
🚧 Destination results UI

🎨 Design Direction

Travel AI's visual language takes inspiration from four different design philosophies:

Reference	Inspiration
Linear	Precision, motion, technical aesthetic
Vercel	Minimalism, typography, whitespace
Nothing	Distinctive visual identity
Apple	Clean hierarchy, restraint, product storytelling

The goal isn't to copy them.

The goal is to create a Travel AI identity that feels:

minimal · technical · cinematic · trustworthy

🛠 Tech Stack
Frontend
Next.js
React
TypeScript
Tailwind CSS
Framer Motion
Lucide React
shadcn/ui
Backend
FastAPI
Python
Modular service architecture
AI & Intelligence
Gemini
OCR
Speech Recognition
Vision Analysis
Geographic Intelligence
Multi-factor Candidate Scoring
Location
Google Places
Place Details
Geographic Enrichment
Candidate Ranking
Database
PostgreSQL
Prisma — planned

📂 Project Structure

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

🔌 API

| Method | Endpoint   | Description                   |
| ------ | ---------- | ----------------------------- |
| `GET`  | `/`        | Engine health check           |
| `POST` | `/analyze` | Analyze an Instagram Reel     |
| `GET`  | `/docs`    | FastAPI Swagger documentation |
| `GET`  | `/test`    | Pipeline test route           |


⚙️ Getting Started

Clone

git clone https://github.com/25Pradnyesh/Travel-AI-.git
cd travel-ai

Frontend

npm install
npm run dev

Open:
http://localhost:3000

Python Engine

Create the virtual environment:
python -m venv engine/.venv

Windows:
.\engine\.venv\Scripts\Activate.ps1

Install dependencies:
pip install -r engine/requirements.txt

Run FastAPI:
python -m uvicorn engine.main:app --reload

Open:
http://127.0.0.1:8000/docs

📊 Current Development Status

| System                         | Status |
| ------------------------------ | :----: |
| Instagram Extraction           |    ✅   |
| OCR                            |    ✅   |
| Speech Recognition             |    ✅   |
| Candidate Extraction           |    ✅   |
| Candidate Scoring              |    ✅   |
| Google Places                  |    ✅   |
| Place Details                  |    ✅   |
| Geo Enrichment                 |    ✅   |
| Gemini Text Verification       |    ✅   |
| Gemini Vision Verification     |    ✅   |
| Location Resolution            |    ✅   |
| Travel Tips                    |    ✅   |
| Packing Intelligence           |    ✅   |
| Frontend Foundation            |    ✅   |
| Animated Landing Page          |    ✅   |
| Reel URL Validation            |    ✅   |
| Loading State                  |    ✅   |
| Frontend → Backend Integration |   🚧   |
| End-to-End Testing             |   🚧   |
| Authentication                 |    ⏳   |
| Database                       |    ⏳   |
| Saved Trips                    |    ⏳   |
| Google Maps Sync               |    ⏳   |
| Production Deployment          |    ⏳   |


🗺️ Roadmap
Phase 1 — Intelligence Engine

Status: 🟢

 Provider architecture
 Metadata extraction
 OCR
 Speech extraction
 Candidate extraction
 Google Places
 Geo enrichment
 Candidate scoring
 Gemini verification
 Location resolution
Phase 2 — Product Experience

Status: 🟡

 Landing page
 Motion system
 Reel URL input
 URL validation
 Loading state
 Connect frontend to analysis API
 Analysis progress UI
 Destination result page
 Nearby places
 Google Maps CTA
Phase 3 — Travel Collections

Status: ⚪

 Authentication
 PostgreSQL
 User profiles
 Saved destinations
 Trip collections
 Country collections
 Bucket lists
Phase 4 — Google Maps

Status: ⚪

Discover
   ↓
Save
   ↓
Travel AI Collection
   ↓
Google Maps

Phase 5 — Platform Expansion

Status: ⚪

 Android App
 Chrome Extension
 Instagram Bot
 YouTube Support
 TikTok Support
 Public API


🧪 Accuracy

Travel AI treats location extraction as a ranking and verification problem.

Multiple signals contribute to the final destination:

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
Google Places
   +
Geographic Context
   +
Candidate Scoring
   +
Gemini Reasoning

The goal is not to find a place.

The goal is to find the correct place.

This matters especially for ambiguous names:

Lake
Lake Como
Lake Bled
Lake Louise

🔐 Privacy

Travel AI currently focuses on public Instagram Reel URLs.

The MVP does not require Instagram login.

Production authentication, data retention, privacy, and storage policies will be defined before public launch.

🤝 Contributing

Travel AI is currently under active development.

Public contributions are temporarily limited while the core MVP is being built.

📄 License

This project is currently proprietary and under active development.

The source code is not licensed for reuse or redistribution at this stage.

<div align="center">
🌍 Travel AI
Discover it. Save it. Go there.

Built by Pradnyesh

</div> '@ | Set-Content -Path README.md -Encoding UTF8 ```


````
