import { NextResponse, type NextRequest } from "next/server";
import { completeLesson } from "@/src/service";
import { learnerId } from "@/src/learner";
import { errorResponse } from "@/src/http";

export const runtime = "nodejs";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    completeLesson(id, await learnerId());
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
