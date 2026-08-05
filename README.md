# 🌍 Travel AI

> **Transform travel reels into organized travel plans using AI.**

Travel AI analyzes public Instagram Reels using OCR, Speech Recognition, Google Places, and Gemini AI to accurately identify travel destinations, then enriches them with nearby attractions, travel tips, and packing suggestions.

> 🚧 **Status:** AI Location Engine Complete • Frontend & Integration Testing In Progress

---

# 🎥 Demo

> 🚧 Demo video, screenshots and live deployment will be added after MVP testing.

---

# ✨ Overview

Travel AI helps travelers stop losing amazing destinations hidden inside Instagram Reels.

Paste a public Instagram Reel URL and Travel AI will:

- 📍 Extract the destination from the reel
- 🧠 Combine OCR, Speech, Metadata and Google Places to infer the exact location
- 🌎 Rank multiple candidate locations using a multi-factor scoring engine
- 🤖 Verify the final destination using Gemini AI
- 🗺️ Validate the location with Google Maps
- 💼 Generate travel intelligence including nearby attractions, travel tips and packing suggestions
- 💾 *(Coming Soon)* Save directly to your Google Maps account

---

# 🎯 Vision

Travel AI aims to become the easiest way to discover, organize and revisit travel destinations found across social media.

The long-term vision includes:

- Instagram
- TikTok
- YouTube Shorts
- AI Trip Planner
- Google Maps Synchronization
- Collaborative Travel Collections
- Chrome Extension
- Android Application

---

# 🚀 Current Features

## AI Location Engine

- ✅ FastAPI Backend
- ✅ Modular Provider Architecture
- ✅ Instagram Metadata Extraction
- ✅ OCR Pipeline
- ✅ Speech-to-Text Pipeline
- ✅ Intelligent Candidate Extraction
- ✅ Google Places Search API
- ✅ Google Place Details API
- ✅ Geo Enrichment
- ✅ Multi-factor Scoring Engine
- ✅ Gemini Text Verification
- ✅ Gemini Vision Verification
- ✅ Nearby Places Discovery
- ✅ Travel Intelligence Engine
- ✅ Packing Suggestions
- ✅ Travel Tips Generator

## Frontend

- 🚧 Next.js 15
- 🚧 TypeScript
- 🚧 Tailwind CSS
- 🚧 shadcn/ui

---

# 🧠 AI Decision Pipeline

Instead of relying on a single AI response, Travel AI combines multiple independent signals to maximize accuracy.

```text
Instagram Reel
        │
        ▼
Provider Extraction
        │
        ▼
OCR
        │
        ▼
Speech Recognition
        │
        ▼
Metadata Extraction
        │
        ▼
Candidate Extraction
        │
        ▼
Google Places Search
        │
        ▼
Google Place Details
        │
        ▼
Geo Enrichment
        │
        ▼
Multi-factor Scoring Engine
        │
        ▼
Top 5 Ranked Places
        │
        ▼
Gemini Verification
        │
        ▼
Nearby Search
        │
        ▼
Travel Intelligence
        │
        ▼
Final Destination
```

---

# 🌍 Travel Intelligence

Once the destination has been verified, Travel AI automatically generates:

- 📦 Packing Suggestions
- 💡 Travel Tips
- 📍 Nearby Attractions
- 🍜 Food Recommendations
- 🏨 Accommodation Suggestions
- 🚆 Transport Information
- 🛍 Shopping Areas
- 💎 Hidden Gems

---

# 🛠 Tech Stack

## Frontend

- Next.js 15
- TypeScript
- Tailwind CSS
- shadcn/ui

## Backend

- FastAPI
- Python

## AI & Intelligence

- Google Places API
- Google Place Details API
- Gemini AI
- OCR Pipeline
- Speech Recognition
- Candidate Extraction Engine
- Multi-factor Scoring Engine
- Geo Enrichment
- Travel Intelligence Engine

## Database *(Upcoming)*

- PostgreSQL
- Prisma

## Deployment

- Vercel
- Railway

---

# 📊 Current Project Status

| Module | Status |
|---------|--------|
| Provider Extraction | ✅ |
| Metadata Extraction | ✅ |
| OCR | ✅ |
| Speech Recognition | ✅ |
| Candidate Extraction | ✅ |
| Google Places Search | ✅ |
| Google Place Details | ✅ |
| Geo Enrichment | ✅ |
| Scoring Engine | ✅ |
| Gemini Verification | ✅ |
| Nearby Search | ✅ |
| Travel Intelligence | ✅ |
| Packing Suggestions | ✅ |
| Travel Tips | ✅ |
| Frontend | 🚧 |
| Google Maps Sync | ⏳ |
| Authentication | ⏳ |
| Database | ⏳ |
| Deployment | ⏳ |

---

# 📂 Project Structure

```text
travel-ai/
├── app/
├── components/
├── constants/
├── docs/
├── engine/
│   ├── app/
│   │   ├── api/
│   │   ├── providers/
│   │   ├── services/
│   │   ├── pipelines/
│   │   ├── prompts/
│   │   ├── models/
│   │   └── main.py
│   ├── assets/
│   └── tests/
├── prisma/
├── public/
├── styles/
└── README.md
```

---

# 🔌 API

| Method | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Health Check |
| POST | `/analyze` | Analyze Instagram Reel |
| GET | `/provider` | Provider Test |
| GET | `/health` | API Health |

---

# ⚙️ Getting Started

## Clone

```bash
git clone https://github.com/<your-username>/Travel-AI-.git

cd travel-ai
```

## Frontend

```bash
npm install

npm run dev
```

Open:

```
http://localhost:3000
```

## Backend

Create virtual environment

```bash
python -m venv engine/.venv
```

Activate

```powershell
.\engine\.venv\Scripts\Activate.ps1
```

Install dependencies

```bash
pip install -r engine/requirements.txt
```

Run FastAPI

```bash
python -m uvicorn engine.app.main:app --reload
```

Swagger

```
http://127.0.0.1:8000/docs
```

---

# 🗺️ Roadmap

## Phase 1 — AI Engine ✅

- Provider Architecture
- OCR Pipeline
- Speech Recognition
- Candidate Extraction
- Google Places Integration
- Gemini Verification
- Travel Intelligence

## Phase 2 — Product 🚧

- Next.js Frontend
- Google Maps Synchronization
- Saved Collections
- User Authentication
- PostgreSQL Database

## Phase 3

- AI Trip Planner
- Chrome Extension
- Android App
- Multi-platform Support

## Phase 4

- Public API
- Travel Community
- Collaborative Collections
- Enterprise Integrations

---

# 🤝 Contributing

Travel AI is currently under active development.

Public contributions are temporarily closed while the MVP is being completed.

Feedback, ideas and feature suggestions are always welcome.

---

# 📄 License

This project is currently proprietary and under active development.

The source code is not licensed for redistribution or commercial reuse.

---

### Built with ❤️ by **Pradnyesh**