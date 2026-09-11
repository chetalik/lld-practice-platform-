import Anthropic from "@anthropic-ai/sdk";
import type {
  EvaluationInput,
  EvaluationResult,
  Evaluator,
  RequirementCoverage
} from "./domain.js";

export class DeterministicEvaluator {
  evaluate(input: EvaluationInput) {
    const content = input.submission.content.toLowerCase();
    const signals = new Set<string>();
    let covered = 0;

    const coverage: RequirementCoverage[] = input.problem.requirements.map((req) => {
      const matches = req.requiredSignals.filter((signal) => content.includes(signal.toLowerCase()));
      const ok = matches.length > 0;
      if (ok) covered++;
      matches.forEach((m) => signals.add(`mentions:${m}`));
      return {
        requirementId: req.id,
        covered: ok,
        explanation: ok
          ? `The submission contains a signal related to: ${matches.join(", ")}.`
          : "No clear signal for this requirement was detected."
      };
    });

    if (content.includes("interface") || content.includes("abstract")) signals.add("abstraction");
    if (content.includes("strategy") || content.includes("factory") || content.includes("state")) signals.add("design-pattern");
    if (content.includes("trade-off") || content.includes("tradeoff")) signals.add("tradeoffs");
    if (content.includes("composition") || content.includes("has-a")) signals.add("composition");
    if (content.includes("inheritance") || content.includes("extends")) signals.add("inheritance");

    const base = input.submission.content.trim().length === 0 ? 0 : 35;
    const coverageScore = Math.round((covered / Math.max(input.problem.requirements.length, 1)) * 45);
    const designScore = Math.min(signals.size * 4, 20);
    const score = Math.min(100, base + coverageScore + designScore);

    return {
      score,
      signals: [...signals],
      coverage
    };
  }
}

export class DeterministicOnlyEvaluator implements Evaluator {
  private readonly deterministic = new DeterministicEvaluator();

  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    const d = this.deterministic.evaluate(input);
    return {
      score: d.score,
      strengths: d.score >= 70 ? ["The submission covers a good portion of the stated requirements."] : [],
      issues: d.score < 50 ? ["Several requirements are not clearly represented in the submission."] : [],
      suggestions: [
        "Explain why responsibilities belong to each class.",
        "Call out one extensibility point and one trade-off.",
        "Describe how a second valid implementation could be introduced."
      ],
      requirementCoverage: d.coverage,
      deterministicSignals: d.signals,
      evaluator: "deterministic",
      evaluatedAt: new Date().toISOString()
    };
  }
}

export class LlmEvaluator implements Evaluator {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey: string, model = "claude-sonnet-5") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    const prompt = `You are an expert LLD interviewer. Evaluate the learner submission against the problem.

Problem:
${input.problem.title}
${input.problem.description}

Requirements:
${input.problem.requirements.map(r => `- ${r.text}`).join("\n")}

Submission:
${input.submission.content}

Deterministic signals:
${input.deterministic.signals.join(", ") || "none"}

Return concise JSON with:
score: number 0-100
strengths: string[]
issues: string[]
suggestions: string[]
requirementCoverage: [{requirementId:string, covered:boolean, explanation:string}]

Do not claim there is only one valid design. Focus on responsibilities, coupling/cohesion, abstractions, relationships, extensibility, and trade-offs.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }]
    });

    const raw = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
    const cleaned = raw.replace(/^```json\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(cleaned) as Omit<EvaluationResult, "evaluator" | "deterministicSignals" | "evaluatedAt">;

    return {
      ...parsed,
      deterministicSignals: input.deterministic.signals,
      evaluator: "hybrid",
      evaluatedAt: new Date().toISOString()
    };
  }
}

export class HybridEvaluator implements Evaluator {
  private readonly deterministic = new DeterministicEvaluator();
  private readonly llm?: LlmEvaluator;
  private readonly fallback = new DeterministicOnlyEvaluator();

  constructor(apiKey?: string, model?: string) {
    if (apiKey) this.llm = new LlmEvaluator(apiKey, model);
  }

  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    const d = this.deterministic.evaluate(input);
    const enrichedInput = { ...input, deterministic: d };

    if (!this.llm) return this.fallback.evaluate(enrichedInput);

    try {
      return await this.llm.evaluate(enrichedInput);
    } catch {
      // AI failure must not destroy the learner's attempt.
      return this.fallback.evaluate(enrichedInput);
    }
  }
}
