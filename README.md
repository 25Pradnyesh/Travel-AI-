# 🌍 Travel AI

> AI-powered travel location extraction from Instagram Reels.

> **Save travel destinations from Instagram Reels directly to Google Maps.**

> 🚧 **Status:** Experimental MVP — Active Development

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

---

# 🚀 Current Features

- ✅ Next.js Frontend
- ✅ FastAPI AI Engine
- ✅ Modular Provider Architecture
- ✅ Initial Metadata Extraction
- ✅ Adaptive Location Pipeline (Foundation)

### Coming Soon

- 🚧 OCR Pipeline
- 🚧 Google Places Validation
- 🚧 Google Maps Integration
- 🚧 Android APK
- 🚧 Instagram Bot
- 🚧 Chrome Extension

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

```text
travel-ai/
├── app/              # Next.js frontend
├── components/       # Shared UI
├── engine/           # FastAPI + AI engine
├── docs/             # Documentation
├── public/           # Static assets
└── README.md
```

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

Phase 1 ✅

- Next.js
- FastAPI
- Provider Manager

Phase 2 🚧

- AI Location Extraction
- OCR
- Google Places

Phase 3

- Maps Sync
- Android App
- Instagram Bot
- Chrome Extension

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

Engineering Student • Builder • Hackathon Enthusiast

If you like this project, consider giving it a ⭐.
