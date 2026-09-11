export type AttemptStatus = "PENDING" | "COMPLETED" | "FAILED";

export interface ProblemRequirement {
  id: string;
  text: string;
  requiredSignals: string[];
}

export interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  weight: number;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  requirements: ProblemRequirement[];
  criteria: EvaluationCriterion[];
}

export interface Submission {
  format: "text";
  content: string;
}

export interface RequirementCoverage {
  requirementId: string;
  covered: boolean;
  explanation: string;
}

export interface EvaluationResult {
  score: number;
  strengths: string[];
  issues: string[];
  suggestions: string[];
  requirementCoverage: RequirementCoverage[];
  deterministicSignals: string[];
  evaluator: "hybrid" | "deterministic";
  evaluatedAt: string;
}

export interface PracticeAttempt {
  id: string;
  problemId: string;
  submission: Submission;
  status: AttemptStatus;
  evaluation?: EvaluationResult;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationInput {
  problem: Problem;
  submission: Submission;
  deterministic: {
    score: number;
    signals: string[];
    coverage: RequirementCoverage[];
  };
}

export interface Evaluator {
  evaluate(input: EvaluationInput): Promise<EvaluationResult>;
}
