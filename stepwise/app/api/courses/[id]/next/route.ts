import { NextResponse, type NextRequest } from "next/server";
import { next } from "@/src/service";
import { guarded } from "@/src/http";
import { activityLimits } from "@/src/security/rate-limit";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return guarded(req, activityLimits, async (learner) => {
    const { id } = await ctx.params;
    return NextResponse.json(await next(id, learner), { headers: { "Cache-Control": "no-store" } });
  });
}
