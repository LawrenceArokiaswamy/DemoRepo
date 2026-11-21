import type { Item } from "../engine/types";
import type { AIProvider, CourseContext, LearnerContext } from "./provider";
import { ProviderUnavailableError } from "./provider";
import { demoCourse, demoPacks } from "./demo-course";
import type { ExplanationGrade, ItemDraft, LessonDraft } from "./schemas";

/**
 * Runs the app without any AI service: serves the built-in demo course and
 * grades explanations by keyword groups. Used in tests and when no API key is set.
 */
export class OfflineProvider implements AIProvider {
  readonly name = "offline";
  readonly canGenerateAnyTopic = false;

  async generateCourse(topic: string) {
    if (topic.trim() && !/stat|probab|average|mean|median|chance|demo/i.test(topic)) {
      throw new ProviderUnavailableError(
        "Generating a course on any topic needs an AI key. Set ANTHROPIC_API_KEY and restart, or try the demo course.",
      );
    }
    return structuredClone(demoCourse);
  }

  async generateConceptPack(ctx: CourseContext) {
    const pack = demoPacks[ctx.concept.id];
    if (!pack) throw new ProviderUnavailableError(`No offline material for "${ctx.concept.title}".`);
    return structuredClone(pack);
  }

  async generateLesson(ctx: CourseContext, _learner: LearnerContext, variant: number): Promise<LessonDraft> {
    const base = demoPacks[ctx.concept.id]?.lesson;
    if (!base) throw new ProviderUnavailableError(`No offline material for "${ctx.concept.title}".`);
    // Offline re-teach: lead with the worked example, then the steps.
    return {
      hook: `Let's try this another way (explanation ${variant + 1}). Start from a worked example.`,
      steps: [{ heading: "Worked example first", body: base.workedExample }, ...base.steps],
      workedExample: base.workedExample,
      keyIdea: base.keyIdea,
    };
  }

  async generateItems(): Promise<ItemDraft[]> {
    return []; // the session falls back to the least-recently-seen items
  }

  async gradeExplanation(_ctx: CourseContext, item: Item, response: string): Promise<ExplanationGrade> {
    const text = response.toLowerCase();
    const groups = item.rubric ?? [];
    const hits = groups.filter((g) => g.split("|").some((w) => text.includes(w.toLowerCase())));
    const score = groups.length ? hits.length / groups.length : 0;
    const feedback =
      score >= 0.99
        ? "Your explanation covers the key points."
        : score > 0
          ? "Partly there. Compare your reasoning with the full solution below."
          : "This doesn't yet explain the idea. Read the solution below, then try putting it in your own words.";
    return { score, feedback, misconceptionId: null };
  }
}
