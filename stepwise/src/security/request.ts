import type { NextRequest } from "next/server";

export const MAX_BODY_BYTES = 16 * 1024;

export class BodyTooLargeError extends Error {}
export class BadRequestError extends Error {}

/** Reads a JSON object body with a hard size cap. */
export async function readJson(req: NextRequest): Promise<Record<string, unknown>> {
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BODY_BYTES) throw new BodyTooLargeError("Request too large.");
  const text = await req.text();
  if (Buffer.byteLength(text) > MAX_BODY_BYTES) throw new BodyTooLargeError("Request too large.");
  if (!text) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BadRequestError("Invalid JSON.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new BadRequestError("Invalid request.");
  return parsed as Record<string, unknown>;
}

/**
 * Client IP for rate limiting. Only trusts X-Forwarded-For when the app is
 * deployed behind a proxy you control (STEPWISE_TRUST_PROXY=1).
 */
export function clientIp(req: NextRequest): string {
  if (process.env.STEPWISE_TRUST_PROXY === "1") {
    const fwd = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (fwd) return fwd.slice(0, 64);
  }
  return req.headers.get("x-real-ip")?.slice(0, 64) || "local";
}

/** Strips control characters and trims to a length. */
export function cleanText(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
}
