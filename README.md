# FitnessIQ — AI-Powered Strength Coach

**CS 153 Final Project · Application / Product Track**

FitnessIQ is a full-stack strength training app that combines a rule-based analytics engine with an LLM-powered coaching agent (Claude) to give athletes personalized, data-grounded feedback — the kind of insight you'd normally only get from a knowledgeable human coach.

---

## Why I Built This

The fitness app market is dominated by subscription paywalls. Apps like Whoop, Future, and Caliber charge $20–$200/month for features that are fundamentally software problems — plateau detection, volume tracking, AI coaching. Free alternatives exist for basic logging (Strong, Hevy), but the moment you want any intelligent analysis or coaching feedback, you hit a subscription gate. I was personally frustrated by this: I didn't want to pay a monthly fee just to be told I'm overtraining or need to deload.

So I built it myself. FitnessIQ is a self-hosted, free alternative that gives you the analytics and AI coaching layer without a subscription — you only pay for the API calls you actually make, which for typical usage amounts to cents per week.

Beyond the cost problem, most apps stop at data collection. The bottleneck isn't tracking — it's *interpretation*. A lifter looking at a plateau in their bench press doesn't know whether to add volume, deload, or change rep ranges. A personal trainer would immediately recognize the pattern and prescribe a fix. I wanted to close that gap with AI.

The insight: if you first extract structured signals from raw workout data (strength trends, plateau detection, volume metrics, recovery flags), you can feed a language model highly specific context rather than raw logs. The AI then reasons like a coach rather than generating generic advice.

---

## How It Works

### Architecture

```
Client (React + Vite)
    │
    ├── Dashboard — strength curves, volume charts, streak tracking
    ├── Log Workout — set/rep/weight entry with exercise library
    ├── AI Coach — streaming chat with context-aware agent
    ├── Calendar — visual workout history
    ├── Rest Timer — built-in countdown between sets
    └── Plate Calculator — barbell plate math

Server (Node.js + Express + SQLite)
    │
    ├── Analytics Engine  — rule-based signal extraction
    ├── RAG Module        — keyword-scored exercise science knowledge base
    ├── Agent Pipeline    — Claude via OpenRouter (streaming + batch)
    ├── Auth              — JWT-based user auth
    └── Routes            — workouts, schedule, auth
```

### Analytics Engine (`server/engine/overload.js`)

Pure rule-based logic runs before any LLM call:

- **Estimated 1RM** — Epley formula: `weight × (1 + reps/30)`
- **Strength trends** — best e1RM per week, per exercise
- **Plateau detection** — flags exercises with ≤1% e1RM growth over 3 consecutive weeks
- **Weekly volume** — `sets × reps × weight` per muscle group
- **Overtraining signal** — muscle groups trained 4+ days in one week
- **Deload recommendation** — 4+ consecutive training weeks triggers a flag
- **Streak tracking** — day streak and week streak with grace period logic

### RAG Knowledge Base (`server/rag/knowledge.js`)

10 exercise-science chunks (linear progression, DUP, deload protocols, recovery windows, etc.) retrieved via TF-IDF-style keyword scoring — no embedding API needed. The retrieval query is built from the engine output so the most relevant principles are always surfaced.

### AI Agent (`server/agent/pipeline.js`)


The system prompt forces the model to always reference specific numbers from the athlete's data, preventing generic responses.

---

## Features

- **Strength Curve** — area chart of estimated 1RM over time, per exercise
- **All-Time Gains table** — first→current e1RM with % change
- **Weekly Volume bar chart** — muscle-group breakdown with color coding
- **PR Banner** — automatically detects personal records from last session
- **Streak Banner** — current week streak, day streak, best ever, total days
- **Plateau + Deload Alerts** — proactive warnings with a direct link to ask the AI coach
- **Alex (AI Coach)** — persistent chat with full workout context injected, streaming responses
- **Calendar** — monthly view of workout days
- **Rest Timer** — configurable countdown with audio cue
- **Plate Calculator** — enter a target weight, get the exact plates to load

---

## Setup & Reproducibility

### Prerequisites

- Node.js 18+
- An [OpenRouter](https://openrouter.ai) API key (or direct Anthropic key)

### Install

```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### Configure

```bash
# server/.env
cp server/.env.example server/.env
# Set ANTHROPIC_API_KEY=<your key>
```

### Run

```bash
# Terminal 1 — server (port 3001)
cd server && node index.js

# Terminal 2 — client (port 5173)
cd client && npm run dev
```

Open `http://localhost:5173`. Create an account, log your first workout, and the dashboard + AI features activate automatically.

---

## Evaluation & Evidence

**What I validated:**

- **Plateau detection accuracy** — manually verified against known training logs; the 3-week window with ≤1% tolerance matches standard coaching heuristics
- **RAG relevance** — tested retrieval for plateau, deload, and overtraining queries; confirmed the correct chunks are returned in all cases
- **Agent grounding** — compared responses with vs. without the engine context injected; ungrounded responses were 100% generic, grounded responses cited specific weights and percentages in every case
- **Auth security** — JWT verification on all protected routes; passwords hashed with bcrypt

**Known limitations:**

- The knowledge base is small (10 chunks) and manually curated — not sourced from a vector database or literature search
- The Epley formula overestimates 1RM at high rep counts (>12 reps); this is a known limitation of the formula
- Deload recommendation is time-based only (4 weeks), not performance-based — a better signal would combine volume fatigue and velocity data
- No mobile-native app; responsive web only

---

## AI Usage Disclosure

AI tools were used extensively throughout this project:

- **Claude (claude.ai / Claude Code)** — used for scaffolding the initial React component structure, debugging the streaming SSE implementation, and iterating on the agent system prompt. All core logic (the analytics engine, RAG scoring, agent pipeline design) was designed and written with AI assistance but reviewed and modified by hand.
- **The AI Coach feature itself** uses `claude-sonnet-4-5` via the Anthropic API (routed through OpenRouter) to generate coaching feedback at runtime.

All AI-generated code was reviewed, tested, and in many cases rewritten before being committed.

---

## Project Structure

```
fitness-iq/
├── client/
│   └── src/
│       ├── components/     # Dashboard, LogWorkout, AICoach, Calendar, etc.
│       ├── data/           # Exercise library with muscle group mappings
│       ├── hooks/          # useCountUp animation hook
│       └── utils/          # Plate calculator logic
└── server/
    ├── agent/              # LLM pipeline (weekly analysis, daily brief, streaming chat)
    ├── db/                 # SQLite schema + query helpers
    ├── engine/             # Rule-based analytics (plateau, volume, streaks, deload)
    ├── middleware/         # JWT auth middleware
    ├── rag/                # Exercise science knowledge base + retrieval
    ├── routes/             # Express routes (auth, workouts, schedule)
    └── services/           # Email service
```

---
