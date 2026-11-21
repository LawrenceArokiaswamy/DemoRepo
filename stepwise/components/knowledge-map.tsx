"use client";

import { useMemo, useState } from "react";
import type { CourseView } from "@/src/service";

type Concept = CourseView["concepts"][number];

const NODE_W = 160;
const NODE_H = 58;
const GAP_X = 22;
const GAP_Y = 46;
const PAD = 12;

const STATUS_COLOR: Record<string, string> = {
  unseen: "var(--unseen)",
  learning: "var(--accent)",
  struggling: "var(--warn)",
  mastered: "var(--good)",
  review: "var(--review)",
};
const STATUS_LABEL: Record<string, string> = {
  unseen: "Not started",
  learning: "Learning",
  struggling: "Needs help",
  mastered: "Mastered",
  review: "Due for review",
};

const pct = (x: number) => `${Math.round(x * 100)}%`;

function wrap(title: string, max = 21): string[] {
  const words = title.split(" ");
  const lines: string[] = [""];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if ((cur + " " + w).trim().length > max && cur) lines.push(w);
    else lines[lines.length - 1] = (cur + " " + w).trim();
  }
  if (lines.length > 2) return [lines[0], lines.slice(1).join(" ").slice(0, max - 1) + "…"];
  return lines;
}

export function KnowledgeMap({ concepts }: { concepts: Concept[] }) {
  const [active, setActive] = useState<string | null>(null);

  const layout = useMemo(() => {
    const rows: Concept[][] = [];
    for (const c of concepts) (rows[c.depth] ??= []).push(c);
    const widest = Math.max(...rows.map((r) => r?.length ?? 0));
    const width = widest * NODE_W + (widest - 1) * GAP_X + PAD * 2;
    const pos = new Map<string, { x: number; y: number }>();
    rows.forEach((row, depth) => {
      if (!row) return;
      const rowW = row.length * NODE_W + (row.length - 1) * GAP_X;
      const x0 = (width - rowW) / 2;
      row.forEach((c, i) => pos.set(c.id, { x: x0 + i * (NODE_W + GAP_X), y: PAD + depth * (NODE_H + GAP_Y) }));
    });
    return { width, height: PAD * 2 + rows.length * NODE_H + (rows.length - 1) * GAP_Y, pos };
  }, [concepts]);

  const selected = concepts.find((c) => c.id === active) ?? null;

  return (
    <div>
      <div className="legend" style={{ marginBottom: 10 }}>
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <span key={k}><i style={{ background: STATUS_COLOR[k] }} />{v}</span>
        ))}
      </div>
      <div className="map map-wrap">
        <svg viewBox={`0 0 ${layout.width} ${layout.height}`} width={layout.width} role="img" aria-label="Knowledge map">
          {concepts.flatMap((c) =>
            c.prerequisites.map((p) => {
              const a = layout.pos.get(p)!;
              const b = layout.pos.get(c.id)!;
              const x1 = a.x + NODE_W / 2, y1 = a.y + NODE_H, x2 = b.x + NODE_W / 2, y2 = b.y;
              const my = (y1 + y2) / 2;
              return <path key={`${p}-${c.id}`} className="edge" d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`} />;
            }),
          )}
          {concepts.map((c) => {
            const { x, y } = layout.pos.get(c.id)!;
            const lines = wrap(c.title);
            const color = STATUS_COLOR[c.status];
            return (
              <g
                key={c.id}
                className={`node ${active === c.id ? "active" : ""}`}
                transform={`translate(${x},${y})`}
                onClick={() => setActive(active === c.id ? null : c.id)}
                tabIndex={0}
                role="button"
                aria-label={`${c.title}: ${STATUS_LABEL[c.status]}, ${pct(c.pKnown)}`}
                onKeyDown={(e) => { if (e.key === "Enter") setActive(c.id); }}
              >
                <rect width={NODE_W} height={NODE_H} rx={10} />
                <rect x={0} y={0} width={5} height={NODE_H} rx={2} style={{ fill: color, stroke: "none" }} />
                {lines.map((l, i) => (
                  <text key={i} x={14} y={20 + i * 15} fontWeight={600}>{l}</text>
                ))}
                <rect x={14} y={NODE_H - 12} width={NODE_W - 28} height={4} rx={2} style={{ fill: "var(--surface-2)", stroke: "none" }} />
                <rect x={14} y={NODE_H - 12} width={(NODE_W - 28) * c.recall} height={4} rx={2} style={{ fill: color, stroke: "none" }} />
              </g>
            );
          })}
        </svg>
      </div>
      {selected ? <ConceptDetail c={selected} /> : <p className="small muted" style={{ textAlign: "center", marginTop: 8 }}>Select a concept to see everything we know about it.</p>}
    </div>
  );
}

function ConceptDetail({ c }: { c: Concept }) {
  return (
    <div className="card" style={{ marginTop: 14, background: "var(--surface-2)", boxShadow: "none" }}>
      <div className="spread">
        <h3 style={{ margin: 0 }}>{c.title}</h3>
        <span className="small"><span className={`status-dot st-${c.status}`} />{STATUS_LABEL[c.status]}</span>
      </div>
      <p className="small muted" style={{ marginTop: 4 }}>{c.summary}</p>
      <div className="grid grid-4" style={{ marginTop: 10 }}>
        <div className="stat"><div className="value">{pct(c.pKnown)}</div><div className="label">Mastery estimate</div></div>
        <div className="stat"><div className="value">{pct(c.recall)}</div><div className="label">Recall right now</div></div>
        <div className="stat"><div className="value">{c.correct}/{c.attempts}</div><div className="label">Answers correct</div></div>
        <div className="stat">
          <div className="value">{c.reviewInDays === null ? "—" : c.reviewInDays <= 0 ? "Now" : `${Math.ceil(c.reviewInDays)}d`}</div>
          <div className="label">Next review</div>
        </div>
      </div>
      {c.history.length > 1 ? <Sparkline points={c.history.map((h) => h.p)} /> : null}
      <ul className="small" style={{ margin: "10px 0 0", paddingLeft: 18 }}>
        {c.inferred ? <li>Estimated from your placement answers — not yet asked directly.</li> : null}
        <li>Explanations seen: {c.lessonsSeen}. Memory half-life: {c.halfLifeDays.toFixed(1)} days.</li>
        {c.confidentErrors ? <li>Confident errors: {c.confidentErrors} — answers you were sure of but got wrong.</li> : null}
        {c.misconceptions.map((m, i) => (
          <li key={i}>Misconception seen {m.count}×: “{m.description}”</li>
        ))}
      </ul>
    </div>
  );
}

function Sparkline({ points }: { points: number[] }) {
  const w = 300, h = 46;
  const step = w / Math.max(1, points.length - 1);
  const d = points.map((p, i) => `${i ? "L" : "M"}${(i * step).toFixed(1)},${(h - 4 - p * (h - 8)).toFixed(1)}`).join(" ");
  const mastery = h - 4 - 0.95 * (h - 8);
  return (
    <div style={{ marginTop: 12 }}>
      <div className="small muted">Mastery over your last {points.length} answers</div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none" style={{ maxWidth: 420 }}>
        <line x1={0} x2={w} y1={mastery} y2={mastery} stroke="var(--good)" strokeDasharray="3 4" strokeWidth={1} />
        <path d={d} fill="none" stroke="var(--accent)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
