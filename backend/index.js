const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Low, JSONFile } = require('lowdb');
const { nanoid } = require('nanoid');
const app = express();

app.use(cors());
app.use(bodyParser.json());

const adapter = new JSONFile('db.json');
const db = new Low(adapter);

async function initDb() {
  await db.read();
  db.data = db.data || { templates: [], reminders: [], logs: [] };
  await db.write();
}
initDb();

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log('Backend running on', PORT));
