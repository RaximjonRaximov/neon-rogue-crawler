const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory graveyard & run records
const graveyard = [
  { id: 'gy_1', pilot: 'CIPHER_NINE', floor: 7, score: 8400, killer: 'Security Sentinel Mk.IV', date: '2026-11-20T12:00:00Z' },
  { id: 'gy_2', pilot: 'SYNTH_SHADOW', floor: 5, score: 5600, killer: 'Plasma Sentry Trap', date: '2026-11-21T18:20:00Z' },
  { id: 'gy_3', pilot: 'VOID_WALKER', floor: 4, score: 3900, killer: 'Corrupted Combat Android', date: '2026-11-22T09:10:00Z' }
];

let totalRuns = graveyard.length;

// System health
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'neon-rogue-crawler-api',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// Seed-based dungeon telemetry
app.get('/api/dungeons/seed/:seed', (req, res) => {
  const seed = String(req.params.seed || 'default');
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const roomsCount = 6 + (absHash % 7);
  const hazardLevel = (absHash % 5) + 1;
  const lootRarity = ['Standard', 'Rare', 'Epic', 'Cybernetic Legendary'][absHash % 4];

  res.json({
    seed,
    hash: absHash,
    estimatedRooms: roomsCount,
    hazardLevel,
    lootRarity,
    biome: (absHash % 2 === 0) ? 'Abandoned Core Reactor' : 'Sub-level Cryo Lab'
  });
});

// Graveyard leaderboard & records
app.get('/api/graveyard', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
  const sorted = [...graveyard].sort((a, b) => b.score - a.score).slice(0, limit);
  res.json({ count: sorted.length, records: sorted });
});

// Submit fallen pilot or victory run
app.post('/api/graveyard', (req, res) => {
  const { pilot, floor, score, killer } = req.body || {};

  if (!pilot || typeof pilot !== 'string' || pilot.trim().length < 2) {
    return res.status(400).json({ error: 'Valid pilot callsign is required.' });
  }

  const cleanPilot = pilot.trim().slice(0, 20).toUpperCase();
  const numFloor = Math.max(1, Number(floor) || 1);
  const numScore = Math.max(0, Number(score) || 0);

  const entry = {
    id: `gy_${Date.now()}`,
    pilot: cleanPilot,
    floor: numFloor,
    score: numScore,
    killer: (killer && typeof killer === 'string') ? killer.slice(0, 30) : 'System Hazard',
    date: new Date().toISOString()
  };

  graveyard.push(entry);
  totalRuns += 1;
  graveyard.sort((a, b) => b.score - a.score);

  const rank = graveyard.findIndex(g => g.id === entry.id) + 1;

  res.status(201).json({
    success: true,
    rank,
    record: entry
  });
});

// Cumulative stats
app.get('/api/stats', (req, res) => {
  const maxFloor = graveyard.reduce((max, g) => (g.floor > max ? g.floor : max), 0);
  const topScore = graveyard.reduce((max, g) => (g.score > max ? g.score : max), 0);
  const topPilot = graveyard[0] ? graveyard[0].pilot : 'NONE';

  res.json({
    totalRuns,
    recordedDeaths: graveyard.length,
    deepestFloor: maxFloor,
    highestScore: topScore,
    legendPilot: topPilot
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[NeonRogue Server] Running at http://localhost:${PORT}`);
  });
}

module.exports = app;
