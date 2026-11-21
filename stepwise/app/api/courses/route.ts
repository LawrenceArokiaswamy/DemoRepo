import { NextResponse, type NextRequest } from "next/server";
import { createCourse, listCourses } from "@/src/service";
import { errorResponse } from "@/src/http";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET() {
  return NextResponse.json(listCourses().map(({ graph, ...c }) => ({ ...c, concepts: graph.concepts.length })));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { topic?: unknown; goal?: unknown };
    const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, 200) : "";
    const goal = typeof body.goal === "string" ? body.goal.trim().slice(0, 400) : "";
    if (!topic) return NextResponse.json({ error: "Tell us what you want to learn." }, { status: 400 });
    const course = await createCourse(topic, goal);
    return NextResponse.json({ id: course.id, title: course.title });
  } catch (e) {
    return errorResponse(e);
  }
}
