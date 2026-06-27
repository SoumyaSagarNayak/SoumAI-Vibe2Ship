# SOUM AI Companion — Multi-Agent Productivity Companion

> **SOUM AI Companion** is an agentic productivity system that proactively plans, schedules, monitors, and recovers your tasks using a network of 8 independent AI agents — so you never miss a deadline again.

Unlike passive to-do apps, SOUM AI Companion runs agents automatically in the background every time you interact with a task. It can detect crises before they happen, rebuild missed tasks, analyse your stress level, and coach you through deep work sessions — all in real time.

---

## 📖 Documentation

| File | Description |
|---|---|
| [USER_GUIDE.txt](./USER_GUIDE.txt) | Complete end-user manual — every page, every button, every feature explained in plain English. Includes pro tips, daily routines, and FAQs. |
| [structure.txt](./structure.txt) | Developer reference — full folder structure, backend/frontend architecture, API route table, data schema, and step-by-step local setup guide. |
| [design.md](./design.md) | Design system reference — BMW M Motorsport design rules, colour tokens, typography, spacing, and component patterns. |

---

## 🤖 The 8 Intelligent Agents

| # | Agent | What It Does |
|---|---|---|
| 1 | **Planner Agent** | Breaks a task into 3–6 ordered subtasks with time estimates |
| 2 | **Priority Agent** | Assigns High / Medium / Low + a reason why |
| 3 | **Scheduler Agent** | Maps tasks to Morning / Afternoon / Evening blocks |
| 4 | **Reminder Agent** | Writes a precise "start by X time" urgency alert per task |
| 5 | **Reflection Agent** | Generates a weekly Productivity Score (0–100) + habit insights |
| 6 | **Motivation Agent** | Produces streak-based encouragement quotes and advice |
| 7 | **Recovery Agent** 🆕 | Rebuilds overdue tasks with new deadlines, plans, and priorities |
| 8 | **Rescue Agent** 🆕 | Analyses full workload stress and produces a ranked rescue plan |

---

## ✨ Feature Highlights

### Original Features
- **Planner, Priority, Scheduler, Reminder, Reflection, Motivation** agents run automatically on every task.
- **Conversational AI Chat** — describe your week in plain English, the AI extracts and schedules all tasks.
- **Calendar Grid** — monthly view of all deadlines; overdue items glow red.
- **Analytics Dashboard** — completion rings, weekly bar chart, productivity score, motivation quote.
- **Firebase + Local DB** — transparent dual persistence (Firestore or db.json, auto-detected).
- **Guest Mode** — one-click access, no sign-up required, data persists locally.

### New Features 🆕
- **Auto-Recovery Engine** — one click rebuilds all overdue tasks with new AI-generated plans.
- **Rescue Agent** — stress level (Low/Medium/High), recovery probability %, and ranked rescue steps.
- **Crisis Mode Banner** — real-time countdown alert for deadlines under 2 hours with an emergency plan.
- **Focus Session Engine** — Pomodoro timer (50 min work / 10 min break) with AI-generated session schedules.
- **Memory Intelligence** — builds a Cognitive Profile from your task completion patterns over time.
- **Focus Analytics** — tracks total focus hours, deep work hours, session count, daily/weekly streaks.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Tailwind CSS v3, Vite 8 |
| Backend | Node.js, Express.js (ESM modules) |
| AI Engine | Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-flash`) |
| Database | Firebase Firestore **or** local `db.json` (auto-fallback) |
| Auth | Firebase Authentication **or** local guest token (auto-fallback) |
| Design | BMW M Motorsport design language (pure black canvas, tricolor accents) |

---

## ⚡ Quick Start

### Requirements
- [Node.js](https://nodejs.org/) v18 or newer
- npm (included with Node.js)

### 1 — Backend

```bash
cd server
npm install
```

Create `server/.env`:

```env
PORT=5000
GEMINI_API_KEY=your_gemini_key_here
```

> **No key?** Leave `GEMINI_API_KEY` blank. The server boots in **Mock Agent Mode** — every feature still works with realistic dummy AI responses.

```bash
npm run dev
# → SOUM AI Companion Multi-Agent Backend Server running on Port 5000
```

### 2 — Frontend

```bash
# In a new terminal, from the project root:
npm install
npm run dev
# → http://127.0.0.1:5173
```

### 3 — Access

Open `http://127.0.0.1:5173` in your browser → click **Quick Guest Mode** → you're in.

---

## 📁 Directory Map

```
vibe2ship/
├── server/
│   ├── agents/
│   │   ├── plannerAgent.js       ← Subtask generator
│   │   ├── priorityAgent.js      ← Priority scorer
│   │   ├── schedulerAgent.js     ← Daily block planner
│   │   ├── reminderAgent.js      ← Urgency alert writer
│   │   ├── reflectionAgent.js    ← Productivity scorer
│   │   ├── motivationAgent.js    ← Encouragement generator
│   │   ├── recoveryAgent.js      ← Overdue task rebuilder  🆕
│   │   └── rescueAgent.js        ← Stress analyser         🆕
│   ├── routes/
│   │   ├── tasks.js              ← CRUD + agent pipeline
│   │   ├── ai.js                 ← Chat + plan + prioritize
│   │   ├── analytics.js          ← Reflection + motivation
│   │   ├── focus.js              ← Pomodoro endpoints       🆕
│   │   ├── recovery.js           ← Recovery endpoints       🆕
│   │   └── rescue.js             ← Rescue + memory          🆕
│   ├── services/
│   │   ├── firebase.js           ← DB abstraction layer
│   │   ├── gemini.js             ← AI client + mock fallback
│   │   └── userMemory.js         ← Cognitive profile tracker 🆕
│   ├── data/db.json              ← Auto-created local DB
│   └── index.js                  ← Express entry point
│
├── src/
│   ├── components/
│   │   ├── Navigation.tsx        ← Sidebar + mobile drawer
│   │   ├── CrisisBanner.tsx      ← Deadline crisis alert    🆕
│   │   ├── RescueCard.tsx        ← Stress assessment card   🆕
│   │   ├── FocusTimer.tsx        ← Pomodoro ring timer      🆕
│   │   └── ProductivityMemoryCard.tsx  ← Cognitive profile  🆕
│   ├── pages/
│   │   ├── LandingPage.tsx       ← Welcome + guest login
│   │   ├── Dashboard.tsx         ← Command centre
│   │   ├── TaskManagement.tsx    ← Task list + inspector
│   │   ├── FocusSession.tsx      ← Focus mode page          🆕
│   │   ├── AIChat.tsx            ← Natural language chat
│   │   ├── CalendarView.tsx      ← Deadline calendar
│   │   ├── Analytics.tsx         ← Charts + rescue + memory
│   │   └── Settings.tsx          ← Preferences + diagnostics
│   ├── services/
│   │   ├── firebase.ts           ← Auth SDK wrapper
│   │   └── api.ts                ← REST client (all endpoints)
│   ├── App.tsx                   ← Auth guard + page router
│   └── index.css                 ← BMW M design system CSS
│
├── USER_GUIDE.txt                ← End-user documentation
├── structure.txt                 ← Developer documentation
├── design.md                     ← Design system reference
└── README.md                     ← This file
```

---

## 🔌 API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Server health check |
| GET | `/api/tasks` | List all user tasks |
| POST | `/api/tasks` | Create task (triggers Planner, Priority, Reminder) |
| PUT | `/api/tasks/:id` | Update task; completion triggers streak + memory |
| DELETE | `/api/tasks/:id` | Delete a task |
| POST | `/api/ai/chat` | AI chat + natural language task extraction |
| POST | `/api/ai/plan` | Generate Scheduler time blocks |
| POST | `/api/ai/prioritize` | Re-run Priority Agent on all tasks |
| GET | `/api/analytics` | Reflection score + motivation + streak data |
| GET | `/api/analytics/rescue` | 🆕 Rescue Agent stress analysis |
| GET | `/api/analytics/memory` | 🆕 Cognitive memory profile |
| GET | `/api/recovery/status` | 🆕 Overdue task count (lightweight) |
| POST | `/api/recovery/check` | 🆕 Run Recovery Agent on overdue tasks |
| GET | `/api/focus/stats` | 🆕 Pomodoro session statistics |
| POST | `/api/focus/session/complete` | 🆕 Record a completed Pomodoro |
| POST | `/api/focus/schedule` | 🆕 Generate AI Pomodoro schedule |

---

## 🧠 Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│  FRONTEND  React + TypeScript + Vite  (port 5173)                    │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Pages: Dashboard · Tasks · Focus · Chat · Calendar ·        │    │
│  │          Analytics · Settings                                │    │
│  │  Components: Navigation · CrisisBanner · RescueCard ·        │    │
│  │             FocusTimer · ProductivityMemoryCard              │    │
│  └───────────────────────┬──────────────────────────────────────┘    │
└──────────────────────────┼───────────────────────────────────────────┘
                           │  REST API  /api/*  (Vite proxy)
┌──────────────────────────▼───────────────────────────────────────────┐
│  BACKEND  Node.js + Express  (port 5000)                             │
│                                                                       │
│  Routes:  /tasks · /ai · /analytics · /focus · /recovery · /rescue   │
│                                                                       │
│  Agents:  Planner · Priority · Scheduler · Reminder ·                │
│           Reflection · Motivation · Recovery · Rescue                │
│                                                                       │
│  Services: firebase.js (DB) · gemini.js (AI) · userMemory.js (Profile)│
│                                                                       │
│  ┌─────────────────┐  ┌──────────────────────┐                       │
│  │  Gemini API     │  │  Firebase Firestore   │                       │
│  │  (or Mock Mode) │  │  (or local db.json)   │                       │
│  └─────────────────┘  └──────────────────────┘                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Running Modes

| Mode | GEMINI_API_KEY | Firebase vars | Description |
|---|---|---|---|
| **Full Production** | ✅ Set | ✅ Set | Real AI + Firestore |
| **AI + Local DB** | ✅ Set | ❌ Not set | Real AI + db.json |
| **Offline / Emulator** | ❌ Not set | ❌ Not set | Mock AI + db.json ← **default** |
| **Firebase + Mock AI** | ❌ Not set | ✅ Set | Mock AI + Firestore |

---

## 📋 Notes

- **TypeScript** — `npx tsc --noEmit` passes with zero errors across the entire frontend.
- **nodemon.json** — configured to ignore `server/data/**` to prevent infinite restart loops when db.json is written during requests.
- **Vite proxy** — all `/api/*` requests are proxied to `http://127.0.0.1:5000` in `vite.config.ts`. No CORS configuration needed.
- **ESM** — the backend uses ES Module syntax (`import`/`export`) throughout. The `package.json` has `"type": "module"`.
