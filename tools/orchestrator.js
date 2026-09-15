#!/usr/bin/env node
// Simple orchestrator script to run concurrent simulated booking attempts
// Usage: node tools/orchestrator.js --concurrency 10 --attempts 5 --baseUrl http://localhost:4000

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const argv = require('minimist')(process.argv.slice(2));
const concurrency = parseInt(argv.concurrency || argv.c || 5, 10);
const attemptsPerWorker = parseInt(argv.attempts || argv.n || 5, 10);
const baseUrl = argv.baseUrl || 'http://localhost:4000';
const out = argv.out || 'orchestrator-results.csv';

async function worker(id) {
  const results = [];
  for (let i = 0; i < attemptsPerWorker; ++i) {
    const start = Date.now();
    try {
      // login (simulated)
      await axios.post(baseUrl + '/simulator/login', { username: `bot${id}`, password: 'x' });
      // search
      await axios.post(baseUrl + '/simulator/search', { from: 'DEL', to: 'MUM', date: '2026-09-16' });
      // pick a train (hardcoded)
      const trainId = 'T123';
      // check availability
      const avRes = await axios.get(baseUrl + '/simulator/availability', { params: { trainId, date: '2026-09-16' } });
      const available = avRes.data.availableSeats || 0;
      // attempt book
      const passenger = { name: `Test Passenger ${id}-${i}`, age: 30 };
      const bookRes = await axios.post(baseUrl + '/simulator/book', { sessionId: 'sim', trainId, date: '2026-09-16', passenger });
      const latency = Date.now() - start;
      results.push({ worker: id, attempt: i, available, booked: bookRes.data.ok === true, result: bookRes.data.result || null, latency });
    } catch (e) {
      const latency = Date.now() - start;
      const err = e && e.response && e.response.data ? JSON.stringify(e.response.data) : (e.message || 'error');
      results.push({ worker: id, attempt: i, available: 0, booked: false, error: err, latency });
    }
    // small randomized delay between attempts to avoid lockstep
    await new Promise(r => setTimeout(r, Math.floor(Math.random() * 200) + 50));
  }
  return results;
}

(async () => {
  console.log(`Starting orchestrator: concurrency=${concurrency}, attemptsPerWorker=${attemptsPerWorker}, baseUrl=${baseUrl}`);
  const all = [];
  const promises = [];
  for (let w = 0; w < concurrency; ++w) promises.push(worker(w));
  const workersResults = await Promise.all(promises);
  for (const r of workersResults) all.push(...r);
  // write CSV
  const headers = ['worker','attempt','available','booked','result','error','latency'];
  const lines = [headers.join(',')];
  for (const row of all) {
    lines.push([row.worker, row.attempt, row.available, row.booked, row.result ? JSON.stringify(row.result) : '', row.error ? JSON.stringify(row.error) : '', row.latency].join(','));
  }
  fs.writeFileSync(path.join(process.cwd(), out), lines.join('\n'));
  console.log('Orchestrator finished. Results written to', out);
})();
