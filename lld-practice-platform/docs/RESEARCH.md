# Research Note — LLD Practice Platform

## 1. Learner problem

LLD practice has an unusual evaluation problem: unlike a multiple-choice question, several designs can be valid. A learner needs feedback on *why* a design is strong or weak, not simply a binary correctness result.

A useful practice loop is therefore:

**Choose → Design → Submit → Evaluate → Review → Retry**

The MVP should optimize for short feedback cycles rather than trying to become a complete LMS.

## 2. Existing approaches

### Interview-preparation platforms

Large coding/interview platforms generally optimize for problem discovery, coding practice, submissions, and progress. Their strongest pattern is the repeatable practice loop, but LLD is harder to evaluate because there is rarely one canonical implementation.

### LLD tutorials and repositories

LLD learning resources commonly provide problem statements, expected entities, design patterns, class diagrams, and reference implementations. Their limitation is that feedback is mostly static: the learner compares their solution with an example instead of receiving feedback specific to their own design.

### AI coding assistants

General-purpose AI assistants can review code and explain design decisions. They provide flexibility but do not automatically provide a consistent rubric, attempt history, or problem-specific evaluation workflow.

## 3. Gap

The opportunity is not another large course or coding platform. It is a focused practice surface that combines:

1. problem-specific requirements,
2. a lightweight submission format,
3. deterministic checks for objective signals,
4. AI reasoning for subjective design feedback,
5. structured feedback,
6. attempt history for iteration.

## 4. Product direction

The MVP supports four problems:

- Parking Lot
- Elevator System
- Vending Machine
- Library Management

Each problem has requirements and evaluation criteria. A learner writes a design/code response and submits it.

The evaluator produces:
- overall score,
- strengths,
- issues,
- actionable suggestions,
- requirement coverage,
- detected design signals.

## 5. Key product decision

The product should not pretend that one LLD solution is universally correct. Feedback should explain trade-offs and distinguish missing requirements from alternative design choices.

## 6. Why this MVP

The assignment weights LLD/domain design highly (25%), so the prototype deliberately keeps infrastructure simple: one Express monolith, MongoDB for persisting attempts, and a directly-injected evaluator — no queues, caches, or brokers. The goal was to put the available time into the domain model and the evaluation logic, not infrastructure that this MVP doesn't need.

## 7. Sources

- MongoDB Node.js Driver documentation: https://www.mongodb.com/docs/drivers/node/current/
