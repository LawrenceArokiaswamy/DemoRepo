#!/usr/bin/env node
/**
 * Black-box security checks against a running Stepwise server.
 *
 *   node scripts/security-check.mjs http://localhost:3000
 *   node scripts/security-check.mjs https://your-domain.com
 *
 * Exits non-zero if any check fails. The rate-limit check creates up to a
 * handful of demo courses; run it against a test deployment.
 */
const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const results = [];
const check = (name, ok, detail = "") => results.push({ name, ok, detail });

const home = await fetch(`${base}/`, { redirect: "manual" });
const h = (k) => home.headers.get(k) ?? "";
const csp = h("content-security-policy");

check("Content-Security-Policy present", !!csp);
check("CSP: scripts limited to a per-request nonce", /script-src[^;]*'nonce-[A-Za-z0-9+/=]+'/.test(csp) && !/script-src[^;]*'unsafe-inline'/.test(csp), csp.match(/script-src[^;]*/)?.[0]);
check("CSP: no eval in production", !/'unsafe-eval'/.test(csp));
check("CSP: framing blocked (clickjacking)", /frame-ancestors 'none'/.test(csp));
check("CSP: plugins blocked", /object-src 'none'/.test(csp));
check("X-Frame-Options: DENY", h("x-frame-options") === "DENY");
check("X-Content-Type-Options: nosniff", h("x-content-type-options") === "nosniff");
check("Strict-Transport-Security set", /max-age=\d{7,}/.test(h("strict-transport-security")));
check("Referrer-Policy set", !!h("referrer-policy"));
check("Permissions-Policy set", /camera=\(\)/.test(h("permissions-policy")));
check("No X-Powered-By header", !home.headers.has("x-powered-by"));

const setCookie = home.headers.get("set-cookie") ?? "";
check("Learner cookie is HttpOnly", /sw_learner=.*HttpOnly/i.test(setCookie), setCookie.split(";").slice(1).join(";"));
check("Learner cookie is SameSite=Lax", /SameSite=lax/i.test(setCookie));
check("Learner cookie is Secure", /;\s*Secure/i.test(setCookie), base.startsWith("https") ? "" : "(expected over HTTPS)");
const cookie = setCookie.split(";")[0];

const post = (path, body, headers = {}) =>
  fetch(`${base}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie, origin: base, "sec-fetch-site": "same-origin", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const csrf = await post("/api/courses", { topic: "demo" }, { origin: "https://evil.example", "sec-fetch-site": "cross-site" });
check("Cross-site POST blocked (CSRF)", csrf.status === 403, `status ${csrf.status}`);

const big = await post("/api/courses", { topic: "x".repeat(40_000) });
check("Oversized request rejected", big.status === 413, `status ${big.status}`);

const bad = await post("/api/courses", "{not json");
check("Malformed JSON rejected cleanly", bad.status === 400, `status ${bad.status}`);

const nocookie = await fetch(`${base}/api/courses/x/next`, { headers: { cookie: "sw_learner=not-a-uuid" } });
check("Forged/malformed identity cookie is not trusted", nocookie.status !== 500, `status ${nocookie.status}`);

const missing = await fetch(`${base}/api/courses/does-not-exist/next`, { headers: { cookie } });
const missingBody = await missing.text();
check("Unknown course returns 404 without internals", missing.status === 404 && !/at \w+ \(|node_modules|stack/i.test(missingBody), `status ${missing.status}`);

const traversal = await fetch(`${base}/api/courses/..%2F..%2Fetc%2Fpasswd/next`, { headers: { cookie } });
check("Path traversal in ids is harmless", traversal.status === 404 || traversal.status === 400, `status ${traversal.status}`);

const injection = await fetch(`${base}/api/courses/${encodeURIComponent("' OR 1=1 --")}/next`, { headers: { cookie } });
check("SQL injection in ids is harmless", injection.status === 404, `status ${injection.status}`);

// Rate limit: course creation is capped per learner per day (default 5).
let limited = false;
for (let i = 0; i < 8 && !limited; i++) {
  const r = await post("/api/courses", { topic: "demo" });
  if (r.status === 429) limited = !!r.headers.get("retry-after");
}
check("Course creation is rate-limited (protects AI spend)", limited);

let failed = 0;
for (const r of results) {
  if (!r.ok) failed++;
  console.log(`${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.detail && !r.ok ? `  — ${r.detail}` : ""}`);
}
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
