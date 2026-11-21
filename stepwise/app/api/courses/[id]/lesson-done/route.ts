import { NextResponse, type NextRequest } from "next/server";
import { completeLesson } from "@/src/service";
import { guarded } from "@/src/http";
import { activityLimits } from "@/src/security/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return guarded(req, activityLimits, async (learner) => {
    const { id } = await ctx.params;
    completeLesson(id, learner);
    return NextResponse.json({ ok: true });
  });
}
