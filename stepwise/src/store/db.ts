import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import type { Activity, CourseGraph, Item, LearnerCourseState, Lesson } from "../engine/types";

export interface CourseRecord {
  id: string;
  /** Learner who created it. Courses are unlisted: only the owner sees them in their list. */
  ownerId: string;
  title: string;
  description: string;
  topic: string;
  goal: string;
  graph: CourseGraph;
  createdAt: number;
}

export interface EventRecord {
  id: number;
  learnerId: string;
  courseId: string;
  conceptId: string | null;
  type: "placement" | "lesson" | "answer" | "placement-complete" | "mastered";
  at: number;
  data: Record<string, unknown>;
}

/** The activity a learner is currently on, so answers are checked against what was actually served. */
export interface PendingActivity {
  activity: Activity;
  itemId?: string;
  lessonVariant?: number;
  servedAt: number;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL,
  topic TEXT NOT NULL, goal TEXT NOT NULL, graph TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS lessons (
  course_id TEXT NOT NULL, concept_id TEXT NOT NULL, variant INTEGER NOT NULL, body TEXT NOT NULL,
  PRIMARY KEY (course_id, concept_id, variant)
);
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY, course_id TEXT NOT NULL, concept_id TEXT NOT NULL,
  difficulty INTEGER NOT NULL, body TEXT NOT NULL, created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS items_by_concept ON items (course_id, concept_id);
CREATE TABLE IF NOT EXISTS learner_state (
  learner_id TEXT NOT NULL, course_id TEXT NOT NULL, state TEXT NOT NULL,
  pending TEXT, updated_at INTEGER NOT NULL,
  PRIMARY KEY (learner_id, course_id)
);
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT, learner_id TEXT NOT NULL, course_id TEXT NOT NULL,
  concept_id TEXT, type TEXT NOT NULL, at INTEGER NOT NULL, data TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS events_by_learner ON events (learner_id, course_id, at);
`;

type Row = Record<string, unknown>;

export class Store {
  private db: DatabaseSync;

  constructor(path = process.env.STEPWISE_DB || "data/stepwise.db") {
    if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec("PRAGMA journal_mode = WAL;");
    this.db.exec(SCHEMA);
    const cols = (this.db.prepare("PRAGMA table_info(courses)").all() as Row[]).map((r) => r.name);
    if (!cols.includes("owner_id")) this.db.exec("ALTER TABLE courses ADD COLUMN owner_id TEXT NOT NULL DEFAULT ''");
  }

  // ---- courses

  saveCourse(c: CourseRecord) {
    this.db
      .prepare(
        "INSERT OR REPLACE INTO courses (id, title, description, topic, goal, graph, created_at, owner_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(c.id, c.title, c.description, c.topic, c.goal, JSON.stringify(c.graph), c.createdAt, c.ownerId);
  }

  getCourse(id: string): CourseRecord | null {
    const r = this.db.prepare("SELECT * FROM courses WHERE id = ?").get(id) as Row | undefined;
    return r ? toCourse(r) : null;
  }

  /** Courses this learner created or has studied. Never other people's courses. */
  coursesFor(learnerId: string): CourseRecord[] {
    return (
      this.db
        .prepare(
          `SELECT * FROM courses WHERE owner_id = ?
           OR id IN (SELECT course_id FROM learner_state WHERE learner_id = ?)
           ORDER BY created_at DESC LIMIT 200`,
        )
        .all(learnerId, learnerId) as Row[]
    ).map(toCourse);
  }

  // ---- material

  saveLesson(courseId: string, lesson: Lesson) {
    this.db
      .prepare("INSERT OR REPLACE INTO lessons VALUES (?, ?, ?, ?)")
      .run(courseId, lesson.conceptId, lesson.variant, JSON.stringify(lesson));
  }

  getLesson(courseId: string, conceptId: string, variant: number): Lesson | null {
    const r = this.db
      .prepare("SELECT body FROM lessons WHERE course_id = ? AND concept_id = ? AND variant = ?")
      .get(courseId, conceptId, variant) as Row | undefined;
    return r ? (JSON.parse(r.body as string) as Lesson) : null;
  }

  lessonsFor(courseId: string, conceptId: string): Lesson[] {
    return (
      this.db
        .prepare("SELECT body FROM lessons WHERE course_id = ? AND concept_id = ? ORDER BY variant")
        .all(courseId, conceptId) as Row[]
    ).map((r) => JSON.parse(r.body as string) as Lesson);
  }

  saveItems(courseId: string, items: Item[]) {
    const stmt = this.db.prepare("INSERT OR REPLACE INTO items VALUES (?, ?, ?, ?, ?, ?)");
    const now = Date.now();
    for (const it of items) stmt.run(it.id, courseId, it.conceptId, it.difficulty, JSON.stringify(it), now);
  }

  itemsFor(courseId: string, conceptId: string): Item[] {
    return (
      this.db
        .prepare("SELECT body FROM items WHERE course_id = ? AND concept_id = ? ORDER BY created_at, id")
        .all(courseId, conceptId) as Row[]
    ).map((r) => JSON.parse(r.body as string) as Item);
  }

  getItem(id: string): Item | null {
    const r = this.db.prepare("SELECT body FROM items WHERE id = ?").get(id) as Row | undefined;
    return r ? (JSON.parse(r.body as string) as Item) : null;
  }

  // ---- learner

  getLearnerState(learnerId: string, courseId: string): { state: LearnerCourseState; pending: PendingActivity | null } | null {
    const r = this.db
      .prepare("SELECT state, pending FROM learner_state WHERE learner_id = ? AND course_id = ?")
      .get(learnerId, courseId) as Row | undefined;
    if (!r) return null;
    return {
      state: JSON.parse(r.state as string),
      pending: r.pending ? JSON.parse(r.pending as string) : null,
    };
  }

  saveLearnerState(learnerId: string, courseId: string, state: LearnerCourseState, pending: PendingActivity | null) {
    this.db
      .prepare("INSERT OR REPLACE INTO learner_state VALUES (?, ?, ?, ?, ?)")
      .run(learnerId, courseId, JSON.stringify(state), pending ? JSON.stringify(pending) : null, Date.now());
  }

  coursesForLearner(learnerId: string): string[] {
    return (
      this.db.prepare("SELECT course_id FROM learner_state WHERE learner_id = ?").all(learnerId) as Row[]
    ).map((r) => r.course_id as string);
  }

  // ---- event log

  logEvent(e: Omit<EventRecord, "id">) {
    this.db
      .prepare("INSERT INTO events (learner_id, course_id, concept_id, type, at, data) VALUES (?, ?, ?, ?, ?, ?)")
      .run(e.learnerId, e.courseId, e.conceptId, e.type, e.at, JSON.stringify(e.data));
  }

  events(learnerId: string, courseId: string, limit = 500): EventRecord[] {
    return (
      this.db
        .prepare("SELECT * FROM events WHERE learner_id = ? AND course_id = ? ORDER BY at DESC, id DESC LIMIT ?")
        .all(learnerId, courseId, limit) as Row[]
    ).map((r) => ({
      id: r.id as number,
      learnerId: r.learner_id as string,
      courseId: r.course_id as string,
      conceptId: (r.concept_id as string) ?? null,
      type: r.type as EventRecord["type"],
      at: r.at as number,
      data: JSON.parse(r.data as string),
    }));
  }

  /** Runs fn atomically. */
  transaction<T>(fn: () => T): T {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const out = fn();
      this.db.exec("COMMIT");
      return out;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
}

function toCourse(r: Row): CourseRecord {
  return {
    id: r.id as string,
    ownerId: (r.owner_id as string) ?? "",
    title: r.title as string,
    description: r.description as string,
    topic: r.topic as string,
    goal: r.goal as string,
    graph: JSON.parse(r.graph as string),
    createdAt: r.created_at as number,
  };
}

let shared: Store | null = null;
export function getStore(): Store {
  // Survive Next.js dev hot reloads without opening a new handle each time.
  const g = globalThis as unknown as { __stepwiseStore?: Store };
  shared ??= g.__stepwiseStore ??= new Store();
  return shared;
}
export function setStore(s: Store) {
  shared = s;
  (globalThis as unknown as { __stepwiseStore?: Store }).__stepwiseStore = s;
}
