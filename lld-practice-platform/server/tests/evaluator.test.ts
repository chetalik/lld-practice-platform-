import { describe, expect, it } from "vitest";
import { DeterministicOnlyEvaluator } from "../src/evaluator.js";
import { problems } from "../src/problems.js";

describe("DeterministicOnlyEvaluator", () => {
  it("rewards explicit LLD signals", async () => {
    const problem = problems[0];
    const evaluator = new DeterministicOnlyEvaluator();

    const result = await evaluator.evaluate({
      problem,
      submission: {
        format: "text",
        content: `
          interface AllocationStrategy {}
          Vehicle, ParkingSpot and Ticket are separate classes.
          ParkingLot uses a strategy to allocate a spot.
          PricingStrategy calculates fee. Trade-offs: composition over inheritance.
        `
      },
      deterministic: { score: 0, signals: [], coverage: [] }
    });

    expect(result.score).toBeGreaterThan(50);
    expect(result.deterministicSignals).toContain("abstraction");
  });

  it("does not give a strong score to an empty solution", async () => {
    const evaluator = new DeterministicOnlyEvaluator();
    const result = await evaluator.evaluate({
      problem: problems[0],
      submission: { format: "text", content: "" },
      deterministic: { score: 0, signals: [], coverage: [] }
    });
    expect(result.score).toBeLessThan(50);
  });
});
