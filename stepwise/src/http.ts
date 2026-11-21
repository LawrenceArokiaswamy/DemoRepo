import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { ProviderUnavailableError } from "./ai";
import { GraphError } from "./engine";
import { ConflictError, NotFoundError } from "./service";

/** Maps domain errors to HTTP responses with a message safe to show the learner. */
export function errorResponse(e: unknown) {
  if (e instanceof NotFoundError) return NextResponse.json({ error: e.message }, { status: 404 });
  if (e instanceof ConflictError) return NextResponse.json({ error: e.message }, { status: 409 });
  if (e instanceof ProviderUnavailableError) return NextResponse.json({ error: e.message }, { status: 503 });
  if (e instanceof GraphError) {
    return NextResponse.json({ error: "The generated course had an inconsistent structure. Please try again." }, { status: 502 });
  }
  if (e instanceof Anthropic.AuthenticationError) {
    return NextResponse.json({ error: "The AI key was rejected. Check ANTHROPIC_API_KEY." }, { status: 502 });
  }
  if (e instanceof Anthropic.RateLimitError) {
    return NextResponse.json({ error: "The AI service is busy. Try again in a moment." }, { status: 503 });
  }
  if (e instanceof Anthropic.APIError) {
    return NextResponse.json({ error: `The AI service returned an error (${e.status}).` }, { status: 502 });
  }
  console.error(e);
  return NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong." }, { status: 500 });
}
