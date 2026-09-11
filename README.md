LLD Practice Platform

A focused 2-day MVP for practicing Low-Level Design problems, submitting a solution, receiving explainable feedback, and reviewing previous attempts.

Project Structure

After extracting/cloning, you should see exactly this at the top level:

lld-practice-platform/
├── client/          ← React frontend
├── server/           ← Express backend
├── docs/             ← RESEARCH.md, DESIGN.md
├── docker-compose.yml
├── package.json       ← root scripts (npm run dev, npm test)
├── README.md
└── AI_USAGE.md

All commands below assume your terminal is open inside this exact lld-practice-platform folder (the one containing package.json directly, not a parent/wrapper folder). If a command says "path does not exist," run dir (Windows) or ls (Mac/Linux) first to check where you actually are, and cd into the folder that contains package.json.

Product loop

Choose problem → Think / design → Submit → Get feedback → Review → Try again

Stack
Frontend: React + Vite + TypeScript
Backend: Node.js + Express + TypeScript
Persistence: MongoDB (attempts/history). Problems are a small static seed catalog kept in code — see docs/DESIGN.md for why.
AI feedback: Anthropic Claude, with a safe deterministic-only fallback if no API key is configured or the call fails
Testing: Vitest + Supertest (backend tests run against an in-memory repository — no database required to run the test suite)

No queues, caches, or message brokers are used — the brief explicitly asks for a simple monolith, and the MVP evaluates each submission synchronously within the request.

Prerequisites
Node.js 18+
Docker (for running MongoDB locally), or your own MongoDB instance
An Anthropic API key (optional — the app runs fine without one, just with deterministic-only feedback instead of AI critique)
Setup

1. Install dependencies

bash
npm install
cd server && npm install
cd ../client && npm install
cd ..

2. Start MongoDB

Option A — Docker (if installed):

bash
docker compose up -d

This starts a local MongoDB instance on localhost:27017.

Option B — MongoDB Atlas (free tier, no local install needed): Create a free M0 cluster at https://www.mongodb.com/cloud/atlas/register, create a database user, allow network access from your IP (or 0.0.0.0/0 for local dev), and copy the connection string — you'll use it as MONGODB_URI in the next step.

3. Configure environment variables

bash
cp server/.env.example server/.env

Open server/.env and fill in:

PORT=4000
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=lld_practice
ANTHROPIC_API_KEY=your_key_here
ANTHROPIC_MODEL=claude-sonnet-5

Leave ANTHROPIC_API_KEY blank if you don't have one — the app will still run, using deterministic-only evaluation.

4. Run the app

From the project root:

bash
npm run dev

This starts both the backend and frontend together.

Windows note: if this fails with spawn cmd.exe ENOENT, run the two separately instead (this avoids the concurrently package entirely):

bash
# Terminal 1
cd server && npm run dev

# Terminal 2 (new terminal window/tab)
cd client && npm run dev
Frontend: http://localhost:5173
Backend API: http://localhost:4000
Running tests
bash
npm test

Runs the backend test suite (Vitest). Tests use an in-memory repository, so they run without MongoDB or an Anthropic key.

Covered cases include:

listing problems
rejecting an empty submission
a full submit → evaluate → COMPLETED flow
deterministic scoring on a strong submission
deterministic scoring on an empty submission
Evaluation approach
text
Evaluator (interface)
  ├── DeterministicOnlyEvaluator   — rule-based, no external calls
  ├── LlmEvaluator                 — Claude, one prompt per submission
  └── HybridEvaluator              — runs deterministic first, layers LLM
                                      critique on top, falls back safely
                                      if the LLM call fails

Deterministic checks cover observable signals: is the submission non-empty, does it address each stated requirement, does it use basic LLD vocabulary (interfaces, patterns, trade-offs, composition/inheritance).

The LLM is used for what rules can't capture: responsibility assignment, coupling/cohesion, whether abstractions are actually sound, and specific, actionable suggestions — explicitly instructed not to assume there's only one correct design.

See docs/DESIGN.md for the full reasoning behind this split, the domain model, and other trade-offs.

Deliverables
docs/RESEARCH.md — learner problem, existing approaches researched, gaps, product direction
docs/DESIGN.md — MVP scope, user flow, domain model, evaluation approach, trade-offs
AI_USAGE.md — AI-assisted decisions made during this build
Working prototype (this repo)
Tests (server/tests)
