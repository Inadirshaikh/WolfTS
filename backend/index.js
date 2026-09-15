const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Low, JSONFile } = require('lowdb');
const { nanoid } = require('nanoid');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(cors());
app.use(bodyParser.json());

const adapter = new JSONFile('db.json');
const db = new Low(adapter);

// Simulator config file (editable)
const simulatorConfigPath = path.join(__dirname, 'simulatorConfig.json');
let simulatorConfig = {
  latencyMsRange: [50, 300],
  failureRateBooking: 0.1,
  failureRateAvailability: 0.02,
  initialSeatsPerTrain: 20
};
if (fs.existsSync(simulatorConfigPath)) {
  try { simulatorConfig = JSON.parse(fs.readFileSync(simulatorConfigPath, 'utf8')); } catch (e) { console.warn('Failed to read simulatorConfig.json, using defaults'); }
}

// Simple in-memory simulator state
const simulatorState = {
  trains: [
    { id: 'T123', name: 'Express A', from: 'DEL', to: 'MUM', dateOffset: 1 },
    { id: 'T456', name: 'Express B', from: 'DEL', to: 'BLR', dateOffset: 1 },
    { id: 'T789', name: 'Express C', from: 'DEL', to: 'HYD', dateOffset: 2 }
  ],
  availability: {} // key: trainId|date -> seats
};

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function initDb() {
  await db.read();
  db.data = db.data || { templates: [], reminders: [], logs: [] };
  await db.write();
}
initDb();

// ---------- API: Templates / Reminders / Logs (existing) ----------
app.get('/api/templates', async (req, res) => {
  await db.read();
  res.json(db.data.templates);
});

app.post('/api/templates', async (req, res) => {
  await db.read();
  const t = { id: nanoid(), ...req.body, created_at: new Date().toISOString() };
  db.data.templates.push(t);
  await db.write();
  res.json(t);
});

app.delete('/api/templates/:id', async (req, res) => {
  await db.read();
  db.data.templates = db.data.templates.filter(t => t.id !== req.params.id);
  await db.write();
  res.json({ ok: true });
});

app.get('/api/reminders', async (req, res) => {
  await db.read();
  res.json(db.data.reminders);
});

app.post('/api/reminders', async (req, res) => {
  await db.read();
  const r = { id: nanoid(), ...req.body, created_at: new Date().toISOString() };
  db.data.reminders.push(r);
  await db.write();
  res.json(r);
});

app.post('/api/logs', async (req, res) => {
  await db.read();
  const l = { id: nanoid(), ...req.body, created_at: new Date().toISOString() };
  db.data.logs.push(l);
  await db.write();
  res.json(l);
});

app.get('/api/logs', async (req, res) => {
  await db.read();
  res.json(db.data.logs);
});

// ---------- Simulator endpoints (LOCAL test system) ----------
// Returns current simulator configuration
app.get('/simulator/config', (req, res) => {
  res.json(simulatorConfig);
});

// Update simulator config (simple admin endpoint)
app.post('/simulator/config', (req, res) => {
  simulatorConfig = { ...simulatorConfig, ...req.body };
  try { fs.writeFileSync(simulatorConfigPath, JSON.stringify(simulatorConfig, null, 2)); } catch (e) { /* ignore */ }
  res.json(simulatorConfig);
});

// Helper: ensure availability entry exists
function ensureAvailability(trainId, date) {
  const key = `${trainId}|${date}`;
  if (simulatorState.availability[key] === undefined) {
    simulatorState.availability[key] = simulatorConfig.initialSeatsPerTrain;
  }
  return key;
}

// Simulate latency and occasional failures
async function simulateLatencyAndMaybeFail(type) {
  const ms = randInt(simulatorConfig.latencyMsRange[0], simulatorConfig.latencyMsRange[1]);
  await sleep(ms);
  const failRate = type === 'booking' ? simulatorConfig.failureRateBooking : simulatorConfig.failureRateAvailability;
  if (Math.random() < failRate) {
    const err = { code: 'SIMULATED_ERROR', message: `${type} failed (simulated)` };
    const e = new Error(err.message);
    e.simulated = true;
    throw e;
  }
}

// POST /simulator/login
app.post('/simulator/login', async (req, res) => {
  await simulateLatencyAndMaybeFail('availability');
  // For simulation, accept any username/password and return a sessionId
  const sessionId = nanoid();
  res.json({ sessionId, user: { username: req.body.username || 'tester' } });
});

// POST /simulator/search
app.post('/simulator/search', async (req, res) => {
  await simulateLatencyAndMaybeFail('availability');
  const { from, to, date } = req.body;
  // Return trains that loosely match
  const results = simulatorState.trains.filter(t => t.from === from || t.to === to || true).map(t => ({ id: t.id, name: t.name }));
  res.json({ trains: results });
});

// GET /simulator/availability?trainId=...&date=YYYY-MM-DD
app.get('/simulator/availability', async (req, res) => {
  try {
    await simulateLatencyAndMaybeFail('availability');
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Simulated availability failure' });
  }
  const { trainId, date } = req.query;
  const key = ensureAvailability(trainId, date || '2026-01-01');
  const seats = simulatorState.availability[key];
  // respond with class availability
  res.json({ trainId, date, availableSeats: seats });
});

// POST /simulator/book
app.post('/simulator/book', async (req, res) => {
  const start = Date.now();
  try {
    await simulateLatencyAndMaybeFail('booking');
  } catch (e) {
    return res.status(500).json({ ok: false, error: 'Simulated booking failure' });
  }
  const { sessionId, trainId, date, passenger } = req.body;
  const key = ensureAvailability(trainId, date || '2026-01-01');
  const available = simulatorState.availability[key];
  if (available <= 0) {
    return res.json({ ok: false, result: 'No seats' });
  }
  // simulate booking success probability
  const successProb = 0.6 + Math.random() * 0.3; // 60-90%
  if (Math.random() < successProb) {
    simulatorState.availability[key] = Math.max(0, simulatorState.availability[key] - 1);
    const bookingId = nanoid();
    const latency = Date.now() - start;
    // store log
    await db.read();
    db.data.logs.push({ id: nanoid(), type: 'simulated_booking', bookingId, trainId, date, passenger, latency, created_at: new Date().toISOString() });
    await db.write();
    return res.json({ ok: true, bookingId });
  } else {
    return res.json({ ok: false, result: 'Transient failure' });
  }
});

// Admin endpoint: current simulator state
app.get('/simulator/state', (req, res) => {
  res.json({ trains: simulatorState.trains, availability: simulatorState.availability });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Backend (with simulator) running on', PORT));
