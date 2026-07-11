# 🌍 Travel AI

> AI-powered travel location extraction from Instagram Reels.

> **Save travel destinations from Instagram Reels directly to Google Maps.**

> 🚧 Status: Backend Architecture Complete • Core Engine Under Active Development

---

## 🎥 Demo

> 🚧 Demo video and screenshots will be added as the MVP evolves.

# ✨ Overview

Travel AI helps travelers stop losing amazing destinations hidden inside Instagram Reels.

Paste a public Instagram Reel URL and Travel AI will:

- 📍 Identify the destination
- 🧠 Infer the exact travel location using AI
- 🗺️ Validate the result with Google Maps
- 📂 Organize destinations into country-based collections
- 💾 _(Coming Soon)_ Save directly into your Google Maps account

## 🎯 Vision

Travel AI aims to become the easiest way to collect, organize, and revisit travel destinations discovered across social media.

The long-term goal is to support multiple platforms, AI-assisted trip planning, collaborative travel collections, and seamless Google Maps integration.

---

# 🚀 Current Features

- ✅ Next.js Frontend
- ✅ FastAPI AI Engine
- ✅ Modular Provider Architecture
- ✅ Initial Metadata Extraction
- ✅ Modular Provider Architecture
- ✅ Instagram Metadata Provider
- ✅ Rule-based Location Pipeline
- ✅ Candidate Ranking Engine
- ✅ Google Places Service (Foundation)
- ✅ FastAPI REST API

### Next Milestones

🚧 OCR Frame Extraction

🚧 Google Places Verification

🚧 Gemini-powered Reasoning

🚧 Google Maps Synchronization

🚧 Saved Collections

🚧 Android App

🚧 Chrome Extension

---

# 🏗️ Architecture

```text
Instagram Reel URL
        │
        ▼
 Next.js Frontend
        │
        ▼
 FastAPI Engine
        │
        ▼
 Provider Manager
        │
        ▼
 Metadata Provider
(yt-dlp / Future Providers)
        │
        ▼
 AI Location Pipeline
        │
        ▼
 Google Places
        │
        ▼
 Structured Travel Location
```

## 🧩 Architecture Principles

Travel AI follows a modular architecture designed for long-term scalability.

- Provider-based ingestion (Instagram today, YouTube/TikTok tomorrow)
- Pipeline-driven processing
- Independent services with single responsibilities
- AI components isolated from business logic
- Easily extensible for future providers and AI models

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

## AI

### Current

- Rule-based Location Pipeline

### Planned

- Gemini
- OCR
- Vision AI

## Database

- PostgreSQL
- Prisma _(Planned)_

## Deployment

- Vercel
- Railway

---

# 📂 Project Structure

travel-ai/

app/ # Next.js frontend

components/

lib/

public/

engine/
│
├── api/
│
├── config/
│
├── models/
│
├── pipeline/
│
├── prompts/
│
├── providers/
│
├── services/
│
├── utils/
│
└── main.py

docs/

README.md

## 🔌 API

| Method | Endpoint | Description               |
| ------ | -------- | ------------------------- |
| GET    | /        | Health Check              |
| POST   | /analyze | Analyze an Instagram Reel |
| GET    | /docs    | Swagger UI                |
| GET    | /test    | Pipeline Test Route       |

---

# ⚙️ Getting Started

## Clone the repository

```bash
git clone https://github.com/<your-username>/<repo-name>.git

cd travel-ai
```

## Install dependencies

```bash
npm install
```

## Start the frontend

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

### Python Engine

Create a virtual environment:

```bash
python -m venv engine/.venv
```

Activate it:

**Windows**

```bash
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

Open:

```text
http://127.0.0.1:8000/docs
```

---

# 🗺️ Roadmap

### Phase 1 — Backend Foundation ✅

- Provider Architecture
- FastAPI Engine
- Metadata Extraction
- Location Pipeline
- Candidate Ranking

### Phase 2 — AI Intelligence 🚧

- OCR
- Google Places
- Gemini Reasoning
- Confidence Scoring

### Phase 3 — Product

- Google Maps Sync
- Saved Collections
- Authentication
- Database

### Phase 4 — Ecosystem

- Android App
- Chrome Extension
- Instagram Bot
- Public API

---

## 🤝 Contributing

Travel AI is currently under active development.

Public contributions are temporarily closed while the MVP is being built.

Feature requests and feedback are always welcome.

---

## 📄 License

This project is currently proprietary and under active development.

The source code is not licensed for reuse or redistribution at this stage.

---

**Built by Pradnyesh**

## 👨‍💻 Author

**Pradnyesh**

# <<<<<<< HEAD

**Builder**

> > > > > > > 4e5274e (docs: update README for finalized backend architecture)

If you like this project, consider giving it a ⭐.
