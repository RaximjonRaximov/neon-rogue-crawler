const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const app = require('../server.js');

let server;
let baseUrl;

test.before((t, done) => {
  server = http.createServer(app);
  server.listen(0, () => {
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    done();
  });
});

test.after((t, done) => {
  server.close(done);
});

test('GET /api/health verifies service status', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.equal(data.service, 'neon-rogue-crawler-api');
});

test('GET /api/dungeons/seed/:seed calculates deterministic dungeon parameters', async () => {
  const res = await fetch(`${baseUrl}/api/dungeons/seed/cyber-matrix-2026`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.seed, 'cyber-matrix-2026');
  assert.ok(typeof data.hash === 'number');
  assert.ok(data.estimatedRooms >= 6);
  assert.ok(data.hazardLevel >= 1);
});

test('POST /api/graveyard saves fallen pilot record', async () => {
  const payload = {
    pilot: 'NEO_CYPHER',
    floor: 9,
    score: 12500,
    killer: 'Security Sentinel'
  };

  const res = await fetch(`${baseUrl}/api/graveyard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.record.pilot, 'NEO_CYPHER');
  assert.equal(data.record.floor, 9);
});

test('POST /api/graveyard rejects empty pilot', async () => {
  const res = await fetch(`${baseUrl}/api/graveyard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pilot: '' })
  });

  assert.equal(res.status, 400);
});

test('GET /api/stats returns cumulative metrics', async () => {
  const res = await fetch(`${baseUrl}/api/stats`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.totalRuns > 0);
  assert.ok(data.deepestFloor >= 7);
});
