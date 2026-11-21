"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateCourse({ anyTopic }: { anyTopic: boolean }) {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(t: string, g: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topic: t, goal: g }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create the course.");
      router.push(`/learn/${data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  }

  return (
    <div className="card create">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (topic.trim()) void create(topic, goal);
        }}
      >
        <div className="inputs">
          <div>
            <label className="field" htmlFor="topic">What do you want to learn?</label>
            <input id="topic" type="text" placeholder="e.g. Linear regression, Spanish past tense, SQL joins" value={topic} onChange={(e) => setTopic(e.target.value)} disabled={busy} />
          </div>
          <div>
            <label className="field" htmlFor="goal">Your goal <span className="muted">(optional)</span></label>
            <input id="goal" type="text" placeholder="e.g. pass my data analyst interview" value={goal} onChange={(e) => setGoal(e.target.value)} disabled={busy} />
          </div>
          <button className="btn btn-primary btn-lg" disabled={busy || !topic.trim()}>
            {busy ? <span className="spinner" /> : null}
            {busy ? "Designing…" : "Build my course"}
          </button>
        </div>
      </form>
      {busy ? (
        <p className="muted small" style={{ marginTop: 12 }}>
          Mapping the concepts, their prerequisites and common misconceptions. This usually takes under a minute.
        </p>
      ) : null}
      {!anyTopic ? (
        <div className="notice" style={{ marginTop: 14 }}>
          Running in demo mode: no AI key is configured, so only the built-in statistics course is available.{" "}
          <button className="btn" style={{ marginLeft: 6, padding: "6px 12px" }} onClick={() => void create("demo", "")} disabled={busy}>
            Start the demo course
          </button>
        </div>
      ) : null}
      {error ? <div className="error" style={{ marginTop: 14 }}>{error}</div> : null}
    </div>
  );
}
