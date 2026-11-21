// Core domain types for the adaptive engine. Pure data: no I/O, no framework.

export type ConceptId = string;

export interface Concept {
  id: ConceptId;
  title: string;
  /** One-sentence statement of what holding this concept means. */
  summary: string;
  /** Concepts that must be held before this one can be taught. */
  prerequisites: ConceptId[];
  /** Common wrong beliefs about this concept, referenced by item distractors. */
  misconceptions: Misconception[];
}

export interface Misconception {
  id: string;
  description: string;
  /**
   * When a misconception is really a gap in an earlier concept (e.g. a
   * "fraction" error inside an "algebra" item), the engine repairs that
   * prerequisite before continuing.
   */
  rootConceptId?: ConceptId;
}

export interface CourseGraph {
  concepts: Concept[];
}

export type Confidence = "guess" | "unsure" | "sure";

export type ItemKind = "mcq" | "numeric" | "explain";

export interface ChoiceOption {
  id: string;
  text: string;
  correct: boolean;
  /** Which misconception picking this option is evidence for. */
  misconceptionId?: string;
  /** Feedback shown when this option is picked. */
  feedback: string;
}

export interface Item {
  id: string;
  conceptId: ConceptId;
  kind: ItemKind;
  /** 1 = recall/recognition, 2 = application, 3 = transfer to a new situation. */
  difficulty: 1 | 2 | 3;
  prompt: string;
  options?: ChoiceOption[];
  /** numeric items */
  answer?: number;
  tolerance?: number;
  /** explain items: what a correct explanation must contain. */
  rubric?: string[];
  /** Full worked solution shown after answering. */
  solution: string;
}

export interface LessonStep {
  heading: string;
  body: string;
}

export interface Lesson {
  conceptId: ConceptId;
  /** Increments when the engine asks for a different explanation after repeated failure. */
  variant: number;
  hook: string;
  steps: LessonStep[];
  workedExample: string;
  keyIdea: string;
}

/** The learner model for one concept. Everything the engine believes about it. */
export interface ConceptState {
  conceptId: ConceptId;
  /** BKT posterior that the learner knows the concept, at the time of the last evidence. */
  pKnown: number;
  /** Memory half-life in days; grows with successful spaced retrieval. */
  halfLifeDays: number;
  attempts: number;
  correct: number;
  /** Consecutive wrong answers since the last correct one. */
  wrongStreak: number;
  /** Epoch ms of the last evidence (answer) for this concept. */
  lastEvidenceAt: number | null;
  /** Epoch ms when it first crossed the mastery threshold. */
  masteredAt: number | null;
  /** How many explanations of this concept the learner has seen. */
  lessonsSeen: number;
  /** misconceptionId -> times observed */
  misconceptions: Record<string, number>;
  /** Wrong answers given with confidence "sure" — the most dangerous kind of gap. */
  confidentErrors: number;
  /** Set when the evidence came from diagnostic inference, not a direct answer. */
  inferred: boolean;
}

export interface LearnerCourseState {
  concepts: Record<ConceptId, ConceptState>;
  diagnosticDone: boolean;
  diagnosticAsked: number;
  /** Calibration: how often "sure" answers are right, etc. */
  calibration: Record<Confidence, { n: number; correct: number }>;
  /** Recently used item ids, to avoid repeats. */
  recentItems: string[];
  /** Concept to repair before continuing, set after a prerequisite-rooted error. */
  remediationTarget: ConceptId | null;
  activitiesSinceReview: number;
}

/** A graded answer, as fed to the engine. */
export interface Evidence {
  conceptId: ConceptId;
  itemId: string;
  itemKind: ItemKind;
  difficulty: 1 | 2 | 3;
  /** 0..1; 1 = fully correct. Explanations can earn partial credit. */
  score: number;
  confidence: Confidence;
  misconceptionId?: string;
  /** Number of options, for MCQ guess probability. */
  optionCount?: number;
  at: number;
  diagnostic: boolean;
}

export type Activity =
  | { type: "diagnostic"; conceptId: ConceptId; reason: string }
  | { type: "lesson"; conceptId: ConceptId; variant: number; reason: string }
  | { type: "practice"; conceptId: ConceptId; difficulty: 1 | 2 | 3; reason: string }
  | { type: "review"; conceptId: ConceptId; difficulty: 1 | 2 | 3; reason: string }
  | { type: "complete"; reason: string };
