import { NextResponse, type NextRequest } from "next/server";

/** Gives every visitor an anonymous learner id, so progress persists without sign-up. */
export function proxy(request: NextRequest) {
  const res = NextResponse.next();
  if (!request.cookies.get("sw_learner")) {
    const id = crypto.randomUUID();
    // Make the id visible to this same request's server components too.
    request.cookies.set("sw_learner", id);
    const forwarded = NextResponse.next({ request });
    forwarded.cookies.set("sw_learner", id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 * 2 });
    return forwarded;
  }
  return res;
}

export const config = { matcher: ["/((?!_next/|favicon).*)"] };
