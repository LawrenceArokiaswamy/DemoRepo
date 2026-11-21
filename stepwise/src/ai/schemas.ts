import { z } from "zod";

// Structured-output schemas for everything the AI generates. The model's
// output is validated against these before it reaches the engine.

export const CourseDraftSchema = z.object({
  title: z.string().describe("Short course title"),
  description: z.string().describe("Two sentences: what the learner will be able to do at the end"),
  concepts: z
    .array(
      z.object({
        id: z.string().describe("kebab-case id, unique within the course"),
        title: z.string(),
        summary: z.string().describe("One sentence: what holding this concept means"),
        prerequisites: z.array(z.string()).describe("ids of concepts that must be held first"),
        misconceptions: z.array(
          z.object({
            id: z.string().describe("kebab-case id, unique within the course"),
            description: z.string().describe("The wrong belief, stated as the learner would hold it"),
            rootConceptId: z
              .string()
              .nullable()
              .describe("If this error is really a gap in an earlier concept, that concept's id; else null"),
          }),
        ),
      }),
    )
    .describe("8 to 14 concepts forming a prerequisite graph with no cycles, foundations first"),
});
export type CourseDraft = z.infer<typeof CourseDraftSchema>;

export const LessonSchema = z.object({
  hook: z.string().describe("One or two sentences: a question or situation that makes the learner want this idea"),
  steps: z
    .array(z.object({ heading: z.string(), body: z.string().describe("Markdown. One reasoning step.") }))
    .describe("3 to 5 steps, each building on the previous by a single reasoning step"),
  workedExample: z.string().describe("Markdown. A fully worked example with every step shown"),
  keyIdea: z.string().describe("The one sentence the learner should leave with"),
});
export type LessonDraft = z.infer<typeof LessonSchema>;

export const ItemSchema = z.object({
  kind: z.enum(["mcq", "numeric", "explain"]),
  difficulty: z.number().int().describe("1 = recall, 2 = application, 3 = transfer to an unfamiliar situation"),
  prompt: z.string().describe("Markdown. Self-contained question"),
  options: z
    .array(
      z.object({
        text: z.string(),
        correct: z.boolean(),
        misconceptionId: z
          .string()
          .nullable()
          .describe("For a wrong option: the id of the misconception choosing it reveals, or null"),
        feedback: z.string().describe("Shown if picked: why it is right or exactly what went wrong"),
      }),
    )
    .describe("mcq only: 4 options, exactly one correct. Empty array for other kinds"),
  answer: z.number().nullable().describe("numeric only: the exact answer; else null"),
  tolerance: z.number().nullable().describe("numeric only: accepted absolute error; else null"),
  rubric: z.array(z.string()).describe("explain only: 2-4 points a correct explanation must make; else empty"),
  solution: z.string().describe("Markdown. Full worked solution"),
});
export type ItemDraft = z.infer<typeof ItemSchema>;

export const ConceptPackSchema = z.object({
  lesson: LessonSchema,
  items: z.array(ItemSchema).describe("6 items: 2 at each difficulty 1, 2 and 3; mix of kinds"),
});
export type ConceptPack = z.infer<typeof ConceptPackSchema>;

export const ItemBatchSchema = z.object({ items: z.array(ItemSchema) });

export const ExplanationGradeSchema = z.object({
  score: z.number().describe("0 to 1: fraction of the rubric the explanation gets right"),
  feedback: z.string().describe("Two or three sentences to the learner: what was right, what is missing or wrong"),
  misconceptionId: z.string().nullable().describe("id of a listed misconception the answer shows, or null"),
});
export type ExplanationGrade = z.infer<typeof ExplanationGradeSchema>;
