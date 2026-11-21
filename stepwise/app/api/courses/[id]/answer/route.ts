import { NextResponse, type NextRequest } from "next/server";
import { answer } from "@/src/service";
import { learnerId } from "@/src/learner";
import { errorResponse } from "@/src/http";
import type { Confidence } from "@/src/engine";

export const runtime = "nodejs";
export const maxDuration = 120;

const CONFIDENCE: Confidence[] = ["guess", "unsure", "sure"];

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const itemId = typeof body.itemId === "string" ? body.itemId : "";
    const response = typeof body.response === "string" ? body.response : "";
    const confidence = CONFIDENCE.includes(body.confidence as Confidence) ? (body.confidence as Confidence) : "unsure";
    if (!itemId) return NextResponse.json({ error: "Missing item." }, { status: 400 });
    return NextResponse.json(await answer(id, await learnerId(), { itemId, response, confidence }));
  } catch (e) {
    return errorResponse(e);
  }
}
