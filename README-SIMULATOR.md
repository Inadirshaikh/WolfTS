## Simulator & Orchestrator

This repository now includes a LOCAL simulator (inside `backend`) and an orchestrator tool to run simulated concurrent booking attempts for testing and analysis. This simulator is for LOCAL testing only and does NOT interact with any real IRCTC endpoints.

Simulator endpoints (backend must be running on :4000):
- GET /simulator/config             -- view config
- POST /simulator/config            -- update config
- POST /simulator/login             -- simulate login
- POST /simulator/search            -- simulate train search
- GET  /simulator/availability      -- simulate availability (query params: trainId, date)
- POST /simulator/book              -- simulate booking attempt
- GET  /simulator/state             -- view simulator state

Simulator config file: `backend/simulatorConfig.json` (latency/failure rates/initial seats)

Orchestrator (tools):
1) Install tools deps:
   cd tools
   npm install

2) Run orchestrator (example):
   node orchestrator.js --concurrency 10 --attempts 5 --baseUrl http://localhost:4000 --out results.csv

Orchestrator will run concurrent workers against the simulator and write a CSV with results.

Reminder: Do NOT use these tools against real production sites without explicit authorization.
