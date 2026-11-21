import { NextResponse, type NextRequest } from "next/server";

const LEARNER_COOKIE = "sw_learner";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function contentSecurityPolicy(nonce: string, isDev: boolean): string {
  return [
    "default-src 'self'",
    // Only scripts carrying this request's nonce (and what they load) may run.
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`,
    `style-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-inline'" : ""}`,
    // React style={{}} attributes; cannot execute code.
    "style-src-attr 'unsafe-inline'",
    "img-src 'self' blob: data:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

/** Rejects state-changing API calls that come from another site (CSRF). */
function isCrossSite(request: NextRequest): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return true;
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      return new URL(origin).host !== request.headers.get("host");
    } catch {
      return true;
    }
  }
  return false;
}

export function proxy(request: NextRequest) {
  const isDev = process.env.NODE_ENV === "development";
  const isApi = request.nextUrl.pathname.startsWith("/api/");

  if (isApi && request.method !== "GET" && request.method !== "HEAD" && isCrossSite(request)) {
    return NextResponse.json({ error: "Cross-site request blocked." }, { status: 403 });
  }

  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce, isDev);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  // Anonymous learner identity: a random id in an HttpOnly cookie.
  const existing = request.cookies.get(LEARNER_COOKIE)?.value;
  const learner = existing && UUID.test(existing) ? existing : crypto.randomUUID();
  if (learner !== existing) {
    const cookies = (requestHeaders.get("cookie") ?? "")
      .split(/;\s*/)
      .filter((c) => c && !c.startsWith(`${LEARNER_COOKIE}=`));
    cookies.push(`${LEARNER_COOKIE}=${learner}`);
    requestHeaders.set("cookie", cookies.join("; "));
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  if (learner !== existing) {
    response.cookies.set(LEARNER_COOKIE, learner, {
      httpOnly: true,
      secure: !isDev && process.env.STEPWISE_INSECURE_COOKIES !== "1",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
  }
  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
