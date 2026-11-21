import { NextResponse, type NextRequest } from "next/server";
import { answer } from "@/src/service";
import { guarded } from "@/src/http";
import { activityLimits } from "@/src/security/rate-limit";
import { cleanText, readJson } from "@/src/security/request";
import type { Confidence } from "@/src/engine";

export const runtime = "nodejs";
export const maxDuration = 120;

const CONFIDENCE: Confidence[] = ["guess", "unsure", "sure"];

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return guarded(req, activityLimits, async (learner) => {
    const { id } = await ctx.params;
    const body = await readJson(req);
    const itemId = cleanText(body.itemId, 64);
    const response = cleanText(body.response, 4000);
    const confidence = CONFIDENCE.includes(body.confidence as Confidence) ? (body.confidence as Confidence) : "unsure";
    if (!itemId) return NextResponse.json({ error: "Missing item." }, { status: 400 });
    return NextResponse.json(await answer(id, learner, { itemId, response, confidence }));
  });
}
