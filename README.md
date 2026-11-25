# 💀 NEON ROGUE // Cyberpunk Roguelike & Graveyard API

[![CI Pipeline](https://github.com/RaximjonRaximov/neon-rogue-crawler/actions/workflows/ci.yml/badge.svg)](https://github.com/RaximjonRaximov/neon-rogue-crawler/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)

> **NEON ROGUE** is a turn-based procedural cyberpunk dungeon crawler featuring 360° raycasted Field of View (FOV), procedural BSP level generation, Web Audio procedural synthesizer, and an Express REST API with global Graveyard leaderboard analytics.

---

## 🌟 Key Features

- **🗺️ Procedural Dungeon Generator:**
  - Automated room carving and corridor linkage across infinite descending floors.
  - 360-degree raycasting Field of View (FOV) and fog-of-war memory map.
  - Autonomous hostile automata (Stalker Drones, Sentry Bots) with aggro line-of-sight tracking.

- **⚔️ Tactical Turn-Based Combat:**
  - Directional player movement (`WASD`, arrow keys) with tactical bump-to-attack.
  - Active cyberware loadout: *Thermal Blade*, *Nanite Stims*, and *EMP Shockwaves*.
  - Turn-based energy, shield, and health management.

- **🔊 Web Audio Procedural Synthesizer:**
  - Zero external `.mp3` or `.wav` dependencies.
  - Synthesized footsteps, laser impact crunches, item pickups, and elevator descents.

- **⚡ Full-Stack REST API:**
  - `GET /api/health` — Microservice telemetry.
  - `GET /api/dungeons/seed/:seed` — Deterministic floor generation seed evaluator.
  - `POST /api/graveyard` — Persistent hall of fame records for fallen pilots.
  - `GET /api/graveyard` — Sorted leaderboard ranking.
  - `GET /api/stats` — Deepest floor explored and total runs telemetry.

- **🐳 Production Ready:**
  - Multi-stage Alpine Linux `Dockerfile`.
  - Built-in zero-dependency test runner (`node:test`).
  - Automated CI workflow with GitHub Actions.

---

## 🚀 Quick Start

### 1. Local Run

```bash
# Clone the repository
git clone https://github.com/RaximjonRaximov/neon-rogue-crawler.git
cd neon-rogue-crawler

# Install dependencies
npm install

# Run automated tests
npm test

# Start the server
npm start
```

Now open **`http://localhost:3000`** in your browser.

---

### 2. Docker Run

```bash
docker build -t neon-rogue-crawler .
docker run -d -p 3000:3000 --name neon-crawler neon-rogue-crawler
```

---

## 🕹️ Controls Guide

| Action | Desktop Key | Mobile Screen |
| :--- | :--- | :--- |
| **Move / Attack** | `WASD` / Arrow Keys | Virtual D-Pad |
| **Wait Turn** | `.` (Period key) | `⏳` Button |
| **Activate Item** | `E` or `U` | `ITEM` Button |
| **Toggle Audio** | Top Speaker Icon | Top Speaker Icon |
| **Graveyard Records** | Top Skull Icon | Top Skull Icon |

---

## 📄 License

MIT © [Raximjon Raximov](https://github.com/RaximjonRaximov)
