# ✦ ASTRA — Know Yourself. Beyond Predictions.

> A premium AI-powered self-reflection platform inspired by Vedic astrology and modern cosmic intelligence.

[![License: MIT](https://img.shields.io/badge/License-MIT-gold.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://python.org)

---

## What is ASTRA?

ASTRA is a cinematic, AI-first self-reflection platform that uses Vedic astrology as a lens for understanding yourself.

It does **not** predict your future.

It uses your birth chart — calculated with precision using Swiss Ephemeris — as a rich, structured psychological portrait. A language model then explains that portrait in calm, grounded language that feels like therapy, not horoscopes.

**The philosophy:** Your birth chart is a map. ASTRA is the guide.

---

## Screenshots

> Landing page with animated starfield and orbital system

> Birth form with progressive loading states

> Dashboard with planetary positions, AI readings, and Vimshottari Dasha timeline

---

## Features

| Feature | Description |
|---|---|
| 🌟 **Vedic Birth Chart** | Sidereal chart calculated locally with Swiss Ephemeris — no third-party APIs |
| 🤖 **AI Readings** | 8 reading themes (Personality, Career, Relationships, Growth, and more) via OpenRouter |
| 💫 **Progressive Reveal** | Readings stream in one by one as they generate |
| 🔮 **Vimshottari Dasha** | Planetary period timeline with current Mahadasha and Antardasha |
| 🌙 **Nakshatra** | Moon nakshatra, pada, and lord calculation |
| 📍 **Geocoding** | Automatic lat/lng and timezone resolution from place names |
| ⚡ **Caching** | 24-hour AI reading cache, 7-day geocode cache — no redundant API calls |
| 🔐 **Privacy-first** | All data stays in your browser. API key never touches the client. |

---

## Architecture

```
Browser
  ├── Next.js 16 (App Router) — React 19 — Tailwind CSS — Framer Motion
  │     ├── /                 Landing page
  │     ├── /birth-form       Data collection → geocoding → chart generation
  │     └── /dashboard        Chart display + streaming AI readings
  │
  └── FastAPI Backend (Python 3.12)
        └── POST /api/chart   Swiss Ephemeris → structured JSON chart
```

### Key Directories

```
astra/
├── app/                  Next.js pages & API routes
│   ├── api/geocode/      Nominatim proxy (server-side)
│   └── api/reading/      OpenRouter AI proxy (server-side, streaming)
├── components/           All UI components
├── config/               Single-source-of-truth constants
│   ├── theme.ts          Design tokens (colors, planets, signs)
│   ├── models.ts         AI model configuration
│   ├── features.ts       Feature flags
│   └── prompts.ts        Prompt engineering config
├── lib/                  Typed utilities
│   ├── api/              Typed fetch clients
│   ├── types/            TypeScript interfaces
│   ├── validators/       Client-side form validation
│   └── storage.ts        localStorage bridge
├── prompts/              Modular LLM prompt templates
├── services/ai/          AI orchestration layer
│   ├── openrouter.ts     HTTP client (retry, streaming, timeout)
│   ├── promptBuilder.ts  Theme → message composer
│   ├── formatter.ts      Raw text → structured AiReading
│   └── cache.ts          Reading cache
└── backend/              Self-contained FastAPI service
    └── app/
        ├── services/chart/   Swiss Ephemeris calculation engine
        ├── models/           Pydantic schemas
        └── core/             Config, exceptions, logging
```

---

## Tech Stack

### Frontend
- **Next.js 16** — App Router, Server Components, API Routes
- **React 19** — Latest concurrent features
- **TypeScript 5** — Strict mode, end-to-end type safety
- **Tailwind CSS 3** — Utility-first styling
- **Framer Motion 11** — Animations and transitions
- **Lucide React** — Icon system

### Backend
- **FastAPI** — High-performance Python API
- **Python 3.12** — Latest stable
- **Swiss Ephemeris** (pyswisseph) — Astronomical calculations
- **Flatlib** — Vedic chart utilities
- **Pydantic** — Request/response validation
- **Loguru** — Structured logging

### AI
- **OpenRouter** — LLM routing (primary: LLaMA 3.3 70B)
- **Custom prompt system** — 8 modular reading templates
- **Server-side proxy** — API key never exposed to client

---

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- An [OpenRouter API key](https://openrouter.ai)

### 1. Clone and install frontend

```bash
git clone https://github.com/DarkCarnage06/Astra.git
cd astra
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
# Edit .env.local and add your OPENROUTER_API_KEY
```

### 3. Start the backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

Or with Docker:

```bash
cd backend
docker compose up --build
```

### 4. Start the frontend

```bash
# From the root directory
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENROUTER_API_KEY` | ✅ Yes | Your OpenRouter API key (server-side only) |
| `NEXT_PUBLIC_API_URL` | ✅ Yes | FastAPI backend URL (default: `http://localhost:8000`) |
| `NODE_ENV` | No | `development` or `production` |

> **Security:** `OPENROUTER_API_KEY` must **never** be prefixed with `NEXT_PUBLIC_`. It is server-side only.

---

## AI Reading Themes

| Theme | Focus |
|---|---|
| 🌟 Personality | Core character, natural gifts, dominant psychological pattern |
| ⚡ Hidden Strength | Qualities you have but may not recognize |
| 🏔️ Career | Professional path, work style, ideal environments |
| 💫 Relationships | Emotional needs, attachment style, connection patterns |
| 🌑 Blind Spot | Patterns and shadows to become aware of |
| 🌱 Growth | Your Rahu direction, what you're here to develop |
| 🔮 Reflection | A question for self-inquiry |
| ☀️ Today's Energy | Current Dasha phase energy and guidance |

---

## Roadmap

- [ ] Compatibility readings (synastry)
- [ ] Full Dasha timeline visualization
- [ ] Conversational chat with your chart
- [ ] Analytics dashboard (architecture ready)
- [ ] User accounts and history
- [ ] Mobile app

---

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

For major changes, open an issue first to discuss what you'd like to change.

---

## License

[MIT](LICENSE) © 2026 ASTRA Contributors
