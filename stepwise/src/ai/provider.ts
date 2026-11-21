import type { Concept, Item } from "../engine/types";
import type { ConceptPack, CourseDraft, ExplanationGrade, ItemDraft, LessonDraft } from "./schemas";

/** What the generator knows about the learner when tailoring material. */
export interface LearnerContext {
  /** Titles of concepts the learner already holds, to build on. */
  mastered: string[];
  /** Misconceptions observed on this concept. */
  misconceptions: string[];
  /** Key ideas of explanations already shown, so a re-teach takes a new angle. */
  previousKeyIdeas: string[];
}

export interface CourseContext {
  courseTitle: string;
  concept: Concept;
  prerequisites: Concept[];
}

export interface AIProvider {
  readonly name: string;
  /** Whether this provider can design a course on an arbitrary topic. */
  readonly canGenerateAnyTopic: boolean;
  generateCourse(topic: string, goal: string): Promise<CourseDraft>;
  generateConceptPack(ctx: CourseContext, learner: LearnerContext): Promise<ConceptPack>;
  generateLesson(ctx: CourseContext, learner: LearnerContext, variant: number): Promise<LessonDraft>;
  generateItems(ctx: CourseContext, difficulty: 1 | 2 | 3, avoidPrompts: string[]): Promise<ItemDraft[]>;
  gradeExplanation(ctx: CourseContext, item: Item, response: string): Promise<ExplanationGrade>;
}

export class ProviderUnavailableError extends Error {}
