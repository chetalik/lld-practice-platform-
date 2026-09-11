import { randomUUID } from "node:crypto";
import type { Db } from "mongodb";
import type { PracticeAttempt, Problem } from "./domain.js";
import { problems } from "./problems.js";

export interface ProblemRepository {
  list(): Promise<Problem[]>;
  get(id: string): Promise<Problem | null>;
}

export interface AttemptRepository {
  create(attempt: PracticeAttempt): Promise<PracticeAttempt>;
  update(attempt: PracticeAttempt): Promise<PracticeAttempt>;
  get(id: string): Promise<PracticeAttempt | null>;
  listByProblem(problemId: string): Promise<PracticeAttempt[]>;
}

// Problems are a small, fixed seed catalog (Parking Lot, Elevator, etc.) —
// not user-generated data, so keeping them in-code instead of a DB collection
// is a deliberate simplification for this MVP (documented in DESIGN.md).
export class InMemoryProblemRepository implements ProblemRepository {
  async list() { return problems; }
  async get(id: string) { return problems.find(p => p.id === id) ?? null; }
}

// Used by tests (and as a fallback) — fast, isolated, no real DB needed.
export class InMemoryAttemptRepository implements AttemptRepository {
  private attempts = new Map<string, PracticeAttempt>();

  async create(attempt: PracticeAttempt) {
    const stored = { ...attempt, id: attempt.id || randomUUID() };
    this.attempts.set(stored.id, stored);
    return stored;
  }

  async update(attempt: PracticeAttempt) {
    this.attempts.set(attempt.id, attempt);
    return attempt;
  }

  async get(id: string) {
    return this.attempts.get(id) ?? null;
  }

  async listByProblem(problemId: string) {
    return [...this.attempts.values()]
      .filter(a => a.problemId === problemId)
      .sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }
}

// Real persistence — this is what actually runs in production (see index.ts).
// A learner's attempt history survives server restarts, which is the whole
// point of the "History" requirement in the brief.
export class MongoAttemptRepository implements AttemptRepository {
  private collection;

  constructor(db: Db) {
    this.collection = db.collection<PracticeAttempt>("attempts");
  }

  async create(attempt: PracticeAttempt) {
    const stored = { ...attempt, id: attempt.id || randomUUID() };
    await this.collection.insertOne(stored as never);
    return stored;
  }

  async update(attempt: PracticeAttempt) {
    await this.collection.replaceOne({ id: attempt.id } as never, attempt as never, { upsert: true });
    return attempt;
  }

  async get(id: string) {
    const doc = await this.collection.findOne({ id } as never);
    if (!doc) return null;
    const { _id, ...rest } = doc as never as PracticeAttempt & { _id: unknown };
    return rest;
  }

  async listByProblem(problemId: string) {
    const docs = await this.collection.find({ problemId } as never).sort({ createdAt: -1 }).toArray();
    return docs.map((doc) => {
      const { _id, ...rest } = doc as never as PracticeAttempt & { _id: unknown };
      return rest;
    });
  }
}
