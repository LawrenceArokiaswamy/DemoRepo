# Stepwise

An adaptive learning platform. Type any topic. Stepwise turns it into a graph of concepts, finds where your understanding ends, teaches one step at a time from there, and tracks mastery of every concept until you truly hold it. Then it brings each concept back before you forget it.

> "Stepwise" is a working name.

## Try it on your computer (about 10 minutes)

1. Install **Node.js 22** or later from https://nodejs.org (the "LTS" download).
2. Download this repository (on GitHub: **Code → Download ZIP**, then unzip it), or `git clone` it.
3. Open a terminal in the `stepwise` folder and run:

   ```bash
   npm install
   npm run dev
   ```

4. Open **http://localhost:3000** in your browser. Click **Start the demo course**. It works without any key.
5. To unlock "learn anything", get an API key (see below), then restart with it:

   ```bash
   ANTHROPIC_API_KEY=your-key-here npm run dev
   ```

   On Windows PowerShell: `$env:ANTHROPIC_API_KEY="your-key-here"; npm run dev`

Checks for developers:

```bash
npm test                 # 24 automated tests (engine, learner journeys, security)
npm run simulate         # adaptive engine vs. fixed curriculum on 2,000 simulated learners
npm run build && npm start
npm run security-check -- http://localhost:3000   # 22 black-box security checks against a running server
```

## Going live

You need three things:

| What | Where | Rough cost |
|---|---|---|
| **Anthropic API key** (powers "learn anything") | console.anthropic.com → API keys. Add billing and set a monthly spend limit there. | Pay per use. Generating a full course is roughly $1–3 once; every later learner of that course reuses it. Grading a written answer costs about a cent. |
| **Hosting** that runs a Node.js server with a **persistent disk** (the database is a file) | Any host that runs Docker: Render, Railway, Fly.io, DigitalOcean App Platform, or a small VPS. Use the included `Dockerfile` and mount a volume at `/data`. | About $5–25 a month to start |
| **A domain name** (optional at first) | Any registrar; point it at your host. HTTPS is provided by the host. | About $10–15 a year |

Environment variables to set on the host:

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Required for any-topic courses. Keep it secret: set it only in the host's environment/secret settings, never in code. |
| `STEPWISE_TRUST_PROXY=1` | Set it when the host puts a load balancer in front of the app (almost all do), so rate limits use each visitor's real IP. |
| `STEPWISE_COURSES_PER_DAY` | Global daily cap on new AI-generated courses (default 100). This is your spending brake. |
| `STEPWISE_COURSES_PER_LEARNER_PER_DAY` / `STEPWISE_COURSES_PER_IP_PER_DAY` | Per-person caps (defaults 5 and 10). |

Note: serverless hosts such as Vercel or Netlify do not keep files between requests, so the SQLite database would be lost there. Use a host with a disk, or move storage to Postgres first.

## Security

Built in:

- **Strict Content-Security-Policy** with a per-request nonce: only the app's own scripts can run, which blocks injected scripts (XSS). Framing is blocked (clickjacking), as are plugins and cross-site form posts.
- **Security headers**: HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`; no `X-Powered-By`.
- **CSRF protection**: state-changing API calls from other sites are rejected (`Origin` / `Sec-Fetch-Site` checks), and the identity cookie is `SameSite=Lax`.
- **Identity cookie**: random UUID, `HttpOnly`, `Secure`, validated on every request; malformed values are never trusted.
- **Privacy**: courses are private to their creator (unguessable 128-bit ids); no page lists other people's courses or goals.
- **Input handling**: 16 KB request cap, JSON validation, control characters stripped, length limits. All SQL uses parameterised statements.
- **AI content safety**: generated Markdown is rendered without raw HTML or images, unsafe link schemes are stripped, and learner answers are passed to the model as delimited data, not instructions. Answer keys never reach the browser.
- **Abuse and cost control**: rate limits per learner, per IP and globally, with the strictest caps on AI course generation.
- **Errors**: unexpected errors are logged on the server; the browser only gets a generic message.
- **Dependencies**: `npm audit` reports 0 known vulnerabilities. The Docker image runs as a non-root user.

Still needed before taking payments or storing personal data: user accounts with proper authentication, a privacy policy and terms, backups of `/data`, and an independent penetration test. No software can honestly be guaranteed to pass *every* check; these are the standard protections, verified by `npm test` and `npm run security-check`.

## What makes it adaptive

The core is a **learner model per concept**, in `src/engine/`. It has no AI dependency and is fully unit-tested.

| Piece | What it does |
|---|---|
| **Concept graph** (`graph.ts`) | Every course is a set of concepts with prerequisites and no cycles, plus known misconceptions. A misconception can be *rooted* in an earlier concept. |
| **Mastery model** (`mastery.ts`) | Bayesian Knowledge Tracing: an estimate, per concept, of the probability that the learner holds it. Guess and slip rates depend on item type and difficulty, and on the **confidence** the learner reports. A lucky guess counts for little; a confident wrong answer counts heavily. |
| **Forgetting curve** | Each concept has a memory half-life. Current recall = mastery × retention. A successful recall after a longer gap grows the half-life more (the spacing effect); a failed recall shrinks it. |
| **Evidence propagation** | In placement, a correct answer implies the prerequisites underneath it (which are then confirmed) and a wrong answer implies the concepts built on top are not held yet. A misconception rooted in an earlier concept sends the learner back to repair it. |
| **Safeguards** | Mastery needs at least 2 direct correct answers. Concepts inferred from placement are confirmed with a question, never certified outright. A previously solid foundation is re-checked before it is re-taught. |
| **Teaching policy** (`selector.ts`) | 1. Placement: a binary search over the graph. 2. Repair gaps that errors were traced to. 3. Interleave due spaced reviews. 4. Advance on the frontier, checking before teaching, re-explaining from a new angle after two misses, and dropping down to the weakest prerequisite if errors continue. |
| **Learning log** | Every answer, its confidence, response time, misconception, and mastery before and after is stored as an event (`events` table). |

## Simulation results (`npm run simulate`)

2,000 simulated learners with random prior knowledge, on the 8-concept demo course:

|                                         | adaptive | fixed curriculum |
|-----------------------------------------|---------:|-----------------:|
| learners who truly know everything at the end | **93%** | 30% |
| concepts truly known at the end          | **97%** | 71% |
| average activities: advanced learners    | **25** | 32 |
| average activities: novices              | 68 | 32 |
| concepts marked mastered but not known   | 0.08 | n/a |

The tradeoff is real. The fixed course is shorter for novices *because it lets them finish with gaps*. The adaptive engine doesn't. Advanced learners finish faster.

These are simulated learners under simple assumptions (90% right when they know a concept, plus realistic guess rates). Validating with real learners is the next step.

## Layout

```
src/engine/    mastery model, graph, teaching policy, grading (pure TypeScript, no I/O)
src/ai/        provider interface, Claude implementation, offline demo course
src/store/     SQLite storage (courses, lessons, items, learner state, event log)
src/service.ts course creation, serving activities, grading answers, progress view
app/           Next.js pages and API routes
components/    learning session UI, knowledge map
tests/         node:test suites
scripts/       learner simulation
```

## Roadmap to a real product

- **Accounts and payments**: today a learner is an anonymous cookie. Add sign-in, then subscriptions or per-course pricing.
- **Content quality loop**: flag bad generated items from learner reports and item statistics (items everyone gets wrong, or nobody does), and retire or regenerate them.
- **Parameter fitting**: once real data exists, fit guess/slip/learn rates per item and per concept from the event log instead of using fixed defaults.
- **Curated catalog**: an expert-reviewed course for one high-value exam, with outcome tracking (pass rates).
- **Mobile**: daily review sessions as push notifications.
- **Multiple learners per course**: shared item banks already work; add cohort analytics for teams and employers.
