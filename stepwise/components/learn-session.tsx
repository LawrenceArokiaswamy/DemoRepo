"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { AnswerResult, ServedActivity } from "@/src/service";
import type { Confidence } from "@/src/engine/types";
import { Md } from "./markdown";

const pct = (x: number) => `${Math.round(x * 100)}%`;

const BADGES: Record<string, { label: string; cls: string }> = {
  diagnostic: { label: "Placement", cls: "badge-placement" },
  lesson: { label: "Lesson", cls: "badge-lesson" },
  practice: { label: "Practice", cls: "badge-practice" },
  review: { label: "Spaced review", cls: "badge-review" },
};

export function LearnSession({ courseId, courseTitle }: { courseId: string; courseTitle: string }) {
  const [served, setServed] = useState<ServedActivity | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/next`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load the next step.");
      setServed(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const progress = served?.progress;

  return (
    <div className="container narrow">
      <div className="session-head">
        <div className="spread">
          <Link href={`/course/${courseId}`} className="small muted" style={{ textDecoration: "none" }}>
            ← {courseTitle}
          </Link>
          {progress ? (
            <span className="small muted">
              {progress.mastered}/{progress.total} mastered
            </span>
          ) : null}
        </div>
        {progress ? (
          <div className="bar good" style={{ marginTop: 8 }}>
            <span style={{ width: `${(progress.mastered / progress.total) * 100}%` }} />
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="stack">
          <div className="error">{error}</div>
          <button className="btn" onClick={() => void load()}>Try again</button>
        </div>
      ) : loading || !served ? (
        <div className="loading-block">
          <span className="spinner" /> Preparing your next step…
        </div>
      ) : (
        <Activity key={served.item?.id ?? `${served.activity.type}-${served.lesson?.variant ?? ""}-${"conceptId" in served.activity ? served.activity.conceptId : ""}`} courseId={courseId} served={served} onNext={() => void load()} />
      )}
    </div>
  );
}

function Activity({ courseId, served, onNext }: { courseId: string; served: ServedActivity; onNext: () => void }) {
  const a = served.activity;
  if (a.type === "complete") {
    return (
      <div className="card celebrate">
        <div className="big">🎓</div>
        <h2>Course mastered</h2>
        <p className="muted">{a.reason}</p>
        <Link href={`/course/${courseId}`} className="btn btn-primary">See your progress</Link>
      </div>
    );
  }
  const isRepair = a.reason.startsWith("Your last answer") || a.reason.startsWith("Repeated errors");
  const badge = isRepair ? { label: "Repair", cls: "badge-repair" } : a.reason.startsWith("Quick check") ? { label: "Quick check", cls: "badge-placement" } : BADGES[a.type];
  return (
    <div className="stack">
      <div>
        <div className="row">
          <span className={`badge ${badge.cls}`}>{badge.label}</span>
          <strong>{served.conceptTitle}</strong>
        </div>
        <p className="reason">{a.reason}</p>
      </div>
      {served.lesson ? <LessonView courseId={courseId} served={served} onDone={onNext} /> : null}
      {served.item ? <ItemView courseId={courseId} served={served} onNext={onNext} /> : null}
    </div>
  );
}

function LessonView({ courseId, served, onDone }: { courseId: string; served: ServedActivity; onDone: () => void }) {
  const lesson = served.lesson!;
  const [shown, setShown] = useState(1);
  const [busy, setBusy] = useState(false);
  const allShown = shown >= lesson.steps.length;

  async function done() {
    setBusy(true);
    await fetch(`/api/courses/${courseId}/lesson-done`, { method: "POST" });
    onDone();
  }

  return (
    <div className="card">
      <p className="prompt"><em>{lesson.hook}</em></p>
      {lesson.steps.slice(0, shown).map((s, i) => (
        <div className="lesson-step" key={i}>
          <h3>{s.heading}</h3>
          <Md>{s.body}</Md>
        </div>
      ))}
      {allShown ? (
        <div className="stack" style={{ animation: "rise .35s ease" }}>
          <div className="worked">
            <strong>Worked example</strong>
            <Md>{lesson.workedExample}</Md>
          </div>
          <div className="key-idea">{lesson.keyIdea}</div>
          <button className="btn btn-primary btn-lg" onClick={() => void done()} disabled={busy}>
            {busy ? <span className="spinner" /> : null} I follow — check my understanding
          </button>
        </div>
      ) : (
        <div className="spread" style={{ marginTop: 12 }}>
          <span className="small muted">Step {shown} of {lesson.steps.length}</span>
          <button className="btn btn-primary" onClick={() => setShown((n) => n + 1)}>Makes sense — next step</button>
        </div>
      )}
    </div>
  );
}

const CONFIDENCE: { id: Confidence; label: string }[] = [
  { id: "guess", label: "Guessing" },
  { id: "unsure", label: "Fairly unsure" },
  { id: "sure", label: "Sure" },
];

function ItemView({ courseId, served, onNext }: { courseId: string; served: ServedActivity; onNext: () => void }) {
  const item = served.item!;
  const [response, setResponse] = useState("");
  const [confidence, setConfidence] = useState<Confidence | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!confidence || !response.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/courses/${courseId}/answer`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ itemId: item.id, response, confidence }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit.");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  const locked = !!result || busy;
  return (
    <div className="card">
      <div className="prompt"><Md>{item.prompt}</Md></div>

      {item.kind === "mcq" ? (
        <div className="options" role="radiogroup">
          {item.options!.map((o) => {
            let cls = "option";
            if (result) {
              if (o.id === result.correctOptionId) cls += " correct";
              else if (o.id === response) cls += " wrong";
            } else if (o.id === response) cls += " selected";
            return (
              <button key={o.id} className={cls} onClick={() => setResponse(o.id)} disabled={locked} role="radio" aria-checked={o.id === response}>
                <span className="key">{o.id}</span>
                <span><Md>{o.text}</Md></span>
              </button>
            );
          })}
        </div>
      ) : item.kind === "numeric" ? (
        <div style={{ margin: "18px 0" }}>
          <label className="field" htmlFor="num">Your answer</label>
          <input id="num" type="text" inputMode="decimal" autoComplete="off" placeholder="e.g. 0.25, 25%, or 1/4" value={response} onChange={(e) => setResponse(e.target.value)} disabled={locked}
            onKeyDown={(e) => { if (e.key === "Enter" && confidence) void submit(); }} />
        </div>
      ) : (
        <div style={{ margin: "18px 0" }}>
          <label className="field" htmlFor="exp">Explain in your own words</label>
          <textarea id="exp" placeholder="Think out loud — your reasoning is what's assessed, not exact wording." value={response} onChange={(e) => setResponse(e.target.value)} disabled={locked} />
        </div>
      )}

      {!result ? (
        <>
          <div className="small muted">How confident are you?</div>
          <div className="confidence">
            {CONFIDENCE.map((c) => (
              <button key={c.id} className={`chip ${confidence === c.id ? "on" : ""}`} onClick={() => setConfidence(c.id)} disabled={busy}>
                {c.label}
              </button>
            ))}
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => void submit()} disabled={busy || !confidence || !response.trim()}>
            {busy ? <span className="spinner" /> : null} Check answer
          </button>
          {error ? <div className="error" style={{ marginTop: 12 }}>{error}</div> : null}
        </>
      ) : (
        <Feedback result={result} onNext={onNext} />
      )}
    </div>
  );
}

function Feedback({ result, onNext }: { result: AnswerResult; onNext: () => void }) {
  const tone = result.correct ? "good" : result.score > 0 ? "partial" : "bad";
  const heading = result.correct ? "Correct" : result.score > 0 ? "Partly right" : "Not yet";
  return (
    <div>
      <div className={`feedback ${tone}`}>
        <h3>{heading}</h3>
        <Md>{result.feedback}</Md>
        {result.misconception ? (
          <div className="callout">
            <strong>What this tells us:</strong> it looks like the idea that “{result.misconception.toLowerCase()}”. We'll address it.
          </div>
        ) : null}
      </div>
      <details open={!result.correct} style={{ marginTop: 14 }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>Full solution</summary>
        <div className="worked" style={{ marginTop: 8 }}><Md>{result.solution}</Md></div>
      </details>

      <div style={{ marginTop: 18 }}>
        <div className="small muted" style={{ marginBottom: 6 }}>Mastery of “{result.conceptTitle}”</div>
        <div className="delta">
          <span className="small">{pct(result.before)}</span>
          <div className={`bar ${result.after >= 0.95 ? "good" : ""}`}><span style={{ width: pct(result.after) }} /></div>
          <strong className="small">{pct(result.after)}</strong>
        </div>
        {result.propagated.length ? (
          <ul className="small muted" style={{ margin: "10px 0 0", paddingLeft: 18 }}>
            {result.propagated.slice(0, 4).map((p, i) => (
              <li key={i}>
                {p.title}: {pct(p.before)} → {pct(p.after)} <span>({p.why})</span>
              </li>
            ))}
          </ul>
        ) : null}
        {result.newlyMastered ? (
          <p style={{ marginTop: 12, fontWeight: 700, color: "var(--good)" }}>✓ Mastered “{result.conceptTitle}”. It's now on your review schedule.</p>
        ) : null}
      </div>

      <button className="btn btn-primary btn-lg" style={{ marginTop: 18 }} onClick={onNext} autoFocus>
        Continue
      </button>
    </div>
  );
}
