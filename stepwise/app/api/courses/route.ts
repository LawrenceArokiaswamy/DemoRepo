import { NextResponse, type NextRequest } from "next/server";
import { createCourse } from "@/src/service";
import { guarded } from "@/src/http";
import { cleanText, readJson } from "@/src/security/request";
import { courseCreationLimits } from "@/src/security/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  return guarded(req, courseCreationLimits, async (learner) => {
    const body = await readJson(req);
    const topic = cleanText(body.topic, 200);
    const goal = cleanText(body.goal, 400);
    if (!topic) return NextResponse.json({ error: "Tell us what you want to learn." }, { status: 400 });
    const course = await createCourse(topic, goal, learner);
    return NextResponse.json({ id: course.id, title: course.title });
  });
}
