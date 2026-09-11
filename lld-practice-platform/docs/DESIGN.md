# Design Note

## MVP Scope

A learner can browse LLD problems, open one, write a solution as text, submit it, receive explainable feedback (score, strengths, issues, suggestions, per-requirement coverage), and see their previous attempts on that problem.

Out of scope for this MVP, by design: authentication (single implicit learner), code/diagram submission formats (text only), and any distributed infrastructure (queues, brokers, caches) — the brief explicitly asks for a simple monolith, not an HLD exercise.

## User Flow

```
Problem list → Problem detail (requirements + criteria)
   → Write submission (free text)
   → Submit
   → Evaluation runs in-process (deterministic + LLM)
   → Feedback shown (score, strengths, issues, suggestions, requirement coverage)
   → Attempt saved to history → learner can retry
```

## Domain Model

```text
Problem
  ├── ProblemRequirement[]      (what the design must address)
  └── EvaluationCriterion[]     (what "good" looks like for this problem)

PracticeAttempt
  ├── problemId
  ├── Submission
  ├── status: PENDING | COMPLETED | FAILED
  └── EvaluationResult?

Submission
  └── content (free text for this MVP; format field left open for future types)

EvaluationResult
  ├── score
  ├── strengths[]
  ├── issues[]
  ├── suggestions[]
  ├── requirementCoverage[]
  └── deterministicSignals[]

Evaluator (Strategy interface)
  ├── DeterministicOnlyEvaluator   — used when no LLM key is configured
  ├── LlmEvaluator                 — Claude-based, judgement-heavy checks
  └── HybridEvaluator              — always runs deterministic first, then
                                      layers the LLM critique on top, with a
                                      safe fallback to deterministic-only if
                                      the LLM call fails

AttemptRepository (interface)
  ├── InMemoryAttemptRepository    — used in tests, fast and isolated
  └── MongoAttemptRepository       — used in production, persists attempts
                                      across restarts (real "History" support)
```

## Important Interfaces

```ts
interface Evaluator {
  evaluate(input: EvaluationInput): Promise<EvaluationResult>;
}

interface AttemptRepository {
  create(attempt: PracticeAttempt): Promise<PracticeAttempt>;
  update(attempt: PracticeAttempt): Promise<PracticeAttempt>;
  get(id: string): Promise<PracticeAttempt | null>;
  listByProblem(problemId: string): Promise<PracticeAttempt[]>;
}
```

`createApp()` takes these repositories as injectable dependencies (defaulting to in-memory). Tests use the default; the production entry point (`index.ts`) connects to MongoDB first and injects `MongoAttemptRepository`. This is what makes swapping the storage backend later a one-line change instead of a rewrite.

## Evaluation Approach

Every submission is checked two ways, combined into one `HybridEvaluator`:

**Deterministic** (`DeterministicOnlyEvaluator`) — fast, reproducible, no external calls:
- is the submission non-empty
- does it mention keywords tied to each stated requirement
- does it show basic LLD vocabulary (interface/abstract, strategy/factory/state, trade-off, composition, inheritance)

**LLM** (`LlmEvaluator`, Claude) — used for judgement that rules can't capture:
- responsibility assignment and cohesion/coupling reasoning
- whether the design's abstractions are sound, not just present
- trade-off discussion quality
- specific, actionable suggestions

The deterministic pass always runs first and its signals are handed to the LLM as extra context, so the LLM prompt is grounded rather than judging blind. If the LLM call fails (bad key, network, malformed response), `HybridEvaluator` catches it and falls back to the deterministic-only result — the learner still gets feedback, just without the AI layer, rather than an error page.

This split is the direct answer to "which parts of evaluation should be deterministic vs LLM": objective, checkable facts (did they even define these things) don't need a model call; subjective design judgement does.

## Handling Slow/Failed Evaluation

The MVP evaluates synchronously inside the request (no queue/broker — deliberately, per the brief's scope boundary). If evaluation throws, the attempt is persisted with `status: FAILED` rather than left hanging, and the learner's submission itself is never lost — they can resubmit to retry. For a larger version of this product, the natural next step would be to return `PENDING` immediately and let the frontend poll `GET /api/attempts/:id`, but that's explicitly out of scope for a 2-day MVP.

## Key Trade-offs

- **Text-only submissions over a code editor or diagram tool.** Faster to build, keeps the learner focused on design reasoning rather than syntax, and is what the LLM evaluates most reliably. Costs some realism versus an actual code submission.
- **Problems are static in-code data, not a MongoDB collection.** They're a small, fixed seed catalog, not something a learner creates or edits, so a DB collection would add persistence overhead without real benefit for this MVP. Attempts — the data that actually grows and needs to survive restarts — are the ones persisted to MongoDB.
- **Synchronous evaluation over an async job queue.** Matches the brief's explicit instruction to avoid distributed-systems scope. The trade-off is a slower request during LLM evaluation, which is acceptable for a practice tool that isn't handling concurrent high load.
- **In-memory repository for tests vs Mongo for production**, via the same interface. Keeps the test suite fast and independent of a running database, while production still gets real persistence.
