import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ProviderUnavailableError } from "./ai";
import { GraphError } from "./engine";
import { ConflictError, NotFoundError } from "./service";
import { BadRequestError, BodyTooLargeError, clientIp } from "./security/request";
import { checkLimits, type Limit } from "./security/rate-limit";
import { learnerId } from "./learner";

/** Maps errors to responses. Unexpected errors are logged server-side and never shown to the client. */
export function errorResponse(e: unknown) {
  if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 });
  if (e instanceof ConflictError) return NextResponse.json({ error: e.message }, { status: 409 });
  if (e instanceof BadRequestError) return NextResponse.json({ error: e.message }, { status: 400 });
  if (e instanceof BodyTooLargeError) return NextResponse.json({ error: e.message }, { status: 413 });
  if (e instanceof ProviderUnavailableError) return NextResponse.json({ error: e.message }, { status: 503 });
  if (e instanceof GraphError) {
    return NextResponse.json({ error: "The generated course had an inconsistent structure. Please try again." }, { status: 502 });
  }
  if (e instanceof Anthropic.RateLimitError) {
    return NextResponse.json({ error: "The AI service is busy. Try again in a moment." }, { status: 503 });
  }
  if (e instanceof Anthropic.APIError) {
    console.error("AI provider error", e.status, e.message);
    return NextResponse.json({ error: "The AI service is unavailable right now. Please try again." }, { status: 502 });
  }
  console.error(e);
  return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
}

/** Runs a handler with the learner id, applying rate limits first. */
export async function guarded(
  req: NextRequest,
  limits: (learner: string, ip: string) => Limit[],
  handler: (learner: string) => Promise<Response>,
): Promise<Response> {
  try {
    const learner = await learnerId();
    if (learner === "anonymous") {
      return NextResponse.json({ error: "Please enable cookies to save your progress." }, { status: 401 });
    }
    const wait = checkLimits(limits(learner, clientIp(req)));
    if (wait > 0) {
      return NextResponse.json(
        { error: "You're going a little fast. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(wait) } },
      );
    }
    return await handler(learner);
  } catch (e) {
    return errorResponse(e);
  }
}
