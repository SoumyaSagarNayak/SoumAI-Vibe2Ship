# 🌟 SOUM AI Companion — Multi-Agent Productivity Canvas

<div align="center">

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-Node-000000?style=for-the-badge&logo=express&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-F4B400?style=for-the-badge&logo=google&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-SDK_/_Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Render](https://img.shields.io/badge/Render-Live-46E3B7?style=for-the-badge&logo=render&logoColor=black)

**An intelligent, multi-agent cognitive productivity center that proactively schedules, tracks, recovers, and guides your deep work sessions.**

[📖 End-User Manual](./USER_GUIDE.txt) • [🛠️ Developer Reference](./structure.txt) • [🎨 Design Tokens Reference](./design.md)
</div>

---

## 🤖 Meet the 8 Intelligent Background Agents

Whenever you interact with a task, a background pipeline of independent AI agents coordinates to analyze, restructure, and schedule your work in real-time.

| Agent | Icon | Role | Output Details |
| :--- | :---: | :--- | :--- |
| **Planner Agent** | 📝 | Task Decomposition | Splits tasks into 3–6 ordered subtasks with durations. |
| **Priority Agent** | ⚡ | Intelligent Priority | Assigns High / Medium / Low priority + logical rationale. |
| **Scheduler Agent** | ⏰ | Daily Block Mapping | Arranges tasks into Morning / Afternoon / Evening blocks. |
| **Reminder Agent** | 🔔 | Urgency Warnings | Computes precise "start-by" times and urgency states. |
| **Reflection Agent** | 📊 | Analytics & Reflection | Evaluates weekly performance & provides habit diagnostics. |
| **Motivation Agent** | 🔥 | Dynamic Coaching | Generates personalized streak-based nudges & advice. |
| **Recovery Agent** | 🛠️ | Overdue Task Rebuilder | Suggests new deadlines, plans, and raises priority. |
| **Rescue Agent** | 🚨 | Workload Stress Analysis | Computes stress, recovery probability, & emergency plans. |

---

## ⚡ Core Feature Highlights

### 🚀 Advanced Features
*   🤖 **Multi-Agent Orchestration**: Independent background agents execute instantly on task modifications.
*   💬 **Conversational AI Chat**: Natural language workspace manager. Describe your workload in plain English to extract and deploy schedules instantly.
*   📅 **Calendar Deadline Grid**: Monthly visual command tracker. Shows real-time overdue glow indicators and recurrence templates.
*   📊 **Visual Analytics**: Interactive task dials, weekly completion trends, stress gauges, and AI reflections.

### 🆕 Newly Implemented Features
*   💾 **Local Storage Caching & Offline Fallback**: Fully functional offline fallback. Instant loads, local writes, and cache restores if the server is down.
*   🔁 **Routine Tasks Generator**: Creates templates (Gym, DSA, Development pre-configured) and spawns daily instances on select weekdays.
*   📅 **Calendar Recurrence Mapping**: Projects repeating templates dynamically as checkable mock tasks across future/past days.
*   🧠 **Cognitive Work Profile**: Memory Intelligence aggregates your completion patterns to identify best hours and avoid procrastination.
*   ⏱️ **Pomodoro Focus Session**: 50/10 timeboxing with AI scheduling recommendations and saved focus stats.

---

## 🛠️ Technology Stack

*   **Frontend**: React 19, TypeScript, Vanilla CSS (BMW M Motorsport Design Canvas), Vite 8.
*   **Backend**: Node.js + Express.js (ESM modules).
*   **AI Orchestration**: Google Gemini Developer API.
*   **Database**: Dual Persistence (Firebase Firestore with auto-fallback to local `db.json`).

---

## 🚀 Local Quick Start

### 1. Launch the Backend
```bash
cd server
npm install
```

Configure your `server/.env`:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_developer_key
```
*(No key? Keep it blank! The application will automatically boot in **Mock Agent Mode** with realistic mock AI responses.)*

Run the Express server:
```bash
npm run dev
```

### 2. Launch the Frontend
In a new terminal window, from the root folder:
```bash
npm install
npm run dev
```

Open **`http://127.0.0.1:5173`** in your browser and choose **Quick Guest Mode**!

---

## 📂 Project Directory Map

```
vibe2ship/
├── server/
│   ├── agents/            ← 8 Independent AI Agent Modules
│   ├── routes/            ← Express REST APIs (/tasks, /ai, /focus, etc.)
│   ├── services/          ← Service abstractions (firebase.js, gemini.js)
│   ├── data/db.json       ← Local JSON Database fallback
│   └── index.js           ← Backend server runner
├── src/
│   ├── components/        ← Navigation, FocusTimer, CrisisBanner UI components
│   ├── pages/             ← Dashboard, Task Manager, Focus Session, Calendar page views
│   ├── services/          ← REST Client (api.ts) & Firebase client Auth (firebase.ts)
│   └── index.css          ← BMW M Motorsport canvas typography and CSS
├── USER_GUIDE.txt         ← Detailed end-user manual & FAQ
└── structure.txt          ← Deep-dive developer manual & schema tables
```
