# Stepwise

An adaptive learning platform. Type any topic. Stepwise turns it into a graph of concepts, finds where your understanding ends, teaches one step at a time from there, and tracks mastery of every concept until you truly hold it. Then it brings each concept back before you forget it.

> "Stepwise" is a working name.

## Run it

Requires Node.js 22.13 or later. Storage uses Node's built-in SQLite, so there is nothing to install.

```bash
cd stepwise
npm install
npm run dev            # http://localhost:3000
```

- **Without an API key** the app runs in demo mode with a built-in, hand-written course ("Statistics & probability foundations", 8 concepts).
- **With `ANTHROPIC_API_KEY` set**, Claude generates a course on any topic: the concept graph, misconceptions, lessons and practice items. It also generates new explanations when one doesn't land, generates new questions when the bank runs out, and grades free-text explanations. The default model is `claude-opus-5-5`; override it with `STEPWISE_MODEL`.

```bash
npm test               # 19 tests: engine unit tests and end-to-end learner journeys
npm run simulate       # adaptive engine vs. a fixed curriculum on 2,000 simulated learners
npm run build && npm start
```

Data is stored in `data/stepwise.db`, or at the path in `STEPWISE_DB`.

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
