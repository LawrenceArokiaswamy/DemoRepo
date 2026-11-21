import { NextResponse, type NextRequest } from "next/server";
import { next } from "@/src/service";
import { learnerId } from "@/src/learner";
import { errorResponse } from "@/src/http";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    return NextResponse.json(await next(id, await learnerId()));
  } catch (e) {
    return errorResponse(e);
  }
}
