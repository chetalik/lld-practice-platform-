import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { InMemoryProblemRepository, InMemoryAttemptRepository } from "./repository.js";
import type { ProblemRepository, AttemptRepository } from "./repository.js";
import { HybridEvaluator } from "./evaluator.js";
import type { PracticeAttempt } from "./domain.js";

interface AppDeps {
  problems?: ProblemRepository;
  attempts?: AttemptRepository;
}

// Repositories are injectable so tests can run fast against in-memory data
// while production (see index.ts) passes in a MongoDB-backed AttemptRepository.
// This is also the answer to "how would this accommodate another storage
// backend later" — swap the implementation, nothing else changes.
export function createApp(deps: AppDeps = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  const problems = deps.problems ?? new InMemoryProblemRepository();
  const attempts = deps.attempts ?? new InMemoryAttemptRepository();
  const evaluator = new HybridEvaluator(process.env.ANTHROPIC_API_KEY, process.env.ANTHROPIC_MODEL);

  // Evaluates a submitted attempt and updates its status accordingly.
  // Runs directly in the request flow (MVP is synchronous by design — no
  // queue/broker needed). If evaluation fails, the attempt is marked FAILED
  // rather than left stuck; a learner can resubmit to retry.
  async function evaluateAttempt(attempt: PracticeAttempt): Promise<PracticeAttempt> {
    const problem = await problems.get(attempt.problemId);
    if (!problem) {
      return attempts.update({ ...attempt, status: "FAILED", updatedAt: new Date().toISOString() });
    }

    try {
      const evaluation = await evaluator.evaluate({
        problem,
        submission: attempt.submission,
        deterministic: { score: 0, signals: [], coverage: [] }
      });

      return attempts.update({
        ...attempt,
        status: "COMPLETED",
        evaluation,
        updatedAt: new Date().toISOString()
      });
    } catch {
      return attempts.update({
        ...attempt,
        status: "FAILED",
        updatedAt: new Date().toISOString()
      });
    }
  }

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.get("/api/problems", async (_req, res) => {
    res.json(await problems.list());
  });

  app.get("/api/problems/:id", async (req, res) => {
    const problem = await problems.get(req.params.id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    res.json(problem);
  });

  app.post("/api/problems/:id/attempts", async (req, res) => {
    const problem = await problems.get(req.params.id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });

    const content = String(req.body?.content ?? "").trim();
    if (!content) return res.status(400).json({ error: "Submission cannot be empty" });

    const now = new Date().toISOString();
    const attempt: PracticeAttempt = {
      id: randomUUID(),
      problemId: problem.id,
      submission: { format: "text", content },
      status: "PENDING",
      createdAt: now,
      updatedAt: now
    };

    await attempts.create(attempt);
    const evaluated = await evaluateAttempt(attempt);

    res.status(201).json(evaluated);
  });

  app.get("/api/problems/:id/attempts", async (req, res) => {
    const problem = await problems.get(req.params.id);
    if (!problem) return res.status(404).json({ error: "Problem not found" });
    res.json(await attempts.listByProblem(problem.id));
  });

  app.get("/api/attempts/:id", async (req, res) => {
    const attempt = await attempts.get(req.params.id);
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    res.json(attempt);
  });

  return app;
}
