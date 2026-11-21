"use client";

import { useEffect, useMemo, useState } from "react";
import type { CourseView } from "@/src/service";

type Concept = CourseView["concepts"][number];

const STATUS_COLOR: Record<string, string> = {
  unseen: "var(--unseen)",
  learning: "var(--neuron-b)",
  struggling: "var(--warn)",
  mastered: "var(--neuron-a)",
  review: "var(--review)",
};
const STATUS_LABEL: Record<string, string> = {
  unseen: "Dormant",
  learning: "Forming",
  struggling: "Needs help",
  mastered: "Mastered",
  review: "Fading — review",
};

const pct = (x: number) => `${Math.round(x * 100)}%`;
const RING = 108;
const MARGIN = 78;

/** Small deterministic hash so each neuron gets the same organic shape every render. */
function seeded(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function circularMean(angles: number[]) {
  const s = angles.reduce((a, t) => a + Math.sin(t), 0);
  const c = angles.reduce((a, t) => a + Math.cos(t), 0);
  return Math.atan2(s, c);
}

/** Radial layout: foundations at the core, advanced concepts radiating outward near what they build on. */
function layout(concepts: Concept[]) {
  const byDepth: Concept[][] = [];
  for (const c of concepts) (byDepth[c.depth] ??= []).push(c);
  const maxDepth = byDepth.length - 1;
  const angle = new Map<string, number>();
  const pos = new Map<string, { x: number; y: number }>();
  const singleRoot = (byDepth[0]?.length ?? 0) === 1;
  const radius = (d: number) => (singleRoot ? d * RING : 62 + d * RING);
  const size = 2 * (radius(maxDepth) + MARGIN);
  const cx = size / 2, cy = size / 2;

  byDepth.forEach((ring, d) => {
    if (!ring) return;
    const desired = ring.map((c) => {
      const parents = c.prerequisites.map((p) => angle.get(p)).filter((a): a is number => a !== undefined);
      return { c, a: parents.length ? circularMean(parents) : 0 };
    });
    if (d > 0) desired.sort((x, y) => x.a - y.a);
    const offset = d === 0 ? -Math.PI / 2 : desired[0].a;
    desired.forEach(({ c }, i) => {
      const a = offset + (i / ring.length) * Math.PI * 2 + (d % 2 ? Math.PI / ring.length / 2 : 0) * (ring.length > 1 ? 1 : 0);
      angle.set(c.id, a);
      const r = radius(d);
      pos.set(c.id, { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    });
  });
  return { size, pos, cx, cy, rings: Array.from({ length: maxDepth + 1 }, (_, d) => radius(d)) };
}

function wrap(title: string, max = 18): string[] {
  const words = title.split(" ");
  const lines: string[] = [""];
  for (const w of words) {
    const cur = lines[lines.length - 1];
    if ((cur + " " + w).trim().length > max && cur) lines.push(w);
    else lines[lines.length - 1] = (cur + " " + w).trim();
  }
  return lines.length > 2 ? [lines[0], lines.slice(1).join(" ").slice(0, max - 1) + "…"] : lines;
}

export function KnowledgeMap({ concepts }: { concepts: Concept[] }) {
  const [active, setActive] = useState<string | null>(null);
  const [motion, setMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setMotion(!mq.matches);
  }, []);

  const L = useMemo(() => layout(concepts), [concepts]);
  const byId = useMemo(() => new Map(concepts.map((c) => [c.id, c])), [concepts]);
  const selected = active ? byId.get(active) ?? null : null;
  const related = useMemo(() => {
    if (!selected) return new Set<string>();
    const s = new Set<string>([selected.id, ...selected.prerequisites]);
    for (const c of concepts) if (c.prerequisites.includes(selected.id)) s.add(c.id);
    return s;
  }, [selected, concepts]);

  return (
    <div>
      <div className="legend">
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <span key={k}><i style={{ background: STATUS_COLOR[k], boxShadow: `0 0 8px ${STATUS_COLOR[k]}` }} />{v}</span>
        ))}
      </div>
      <div className="map map-wrap">
        <svg viewBox={`0 0 ${L.size} ${L.size}`} role="img" aria-label="Knowledge map shaped like a neural network" className="brain">
          <defs>
            <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="7" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <radialGradient id="core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--neuron-a)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--neuron-a)" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={L.cx} cy={L.cy} r={L.size / 2} fill="url(#core)" />
          {L.rings.map((r, i) => (r > 0 ? <circle key={i} cx={L.cx} cy={L.cy} r={r} className="ring" /> : null))}

          {/* axons */}
          {concepts.flatMap((c) =>
            c.prerequisites.map((p) => {
              const a = L.pos.get(p)!, b = L.pos.get(c.id)!;
              const src = byId.get(p)!;
              const mx = (a.x + b.x) / 2 + (L.cx - (a.x + b.x) / 2) * 0.18;
              const my = (a.y + b.y) / 2 + (L.cy - (a.y + b.y) / 2) * 0.18;
              const d = `M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`;
              const firing = src.status === "mastered" || src.status === "review";
              const dim = selected && !(related.has(p) && related.has(c.id));
              const id = `ax-${p}-${c.id}`;
              return (
                <g key={id} opacity={dim ? 0.15 : 1}>
                  <path id={id} d={d} className="axon" style={{ strokeOpacity: 0.25 + src.recall * 0.6, stroke: firing ? "var(--neuron-a)" : "var(--axon)" }} />
                  {firing && motion ? (
                    <circle r={3.5} className="signal">
                      <animateMotion dur={`${2.2 + (seeded(id)() * 1.8).toFixed(2)}s`} repeatCount="indefinite" begin={`${(seeded(id + "b")() * 2).toFixed(2)}s`}>
                        <mpath href={`#${id}`} />
                      </animateMotion>
                    </circle>
                  ) : null}
                </g>
              );
            }),
          )}

          {/* neurons */}
          {concepts.map((c) => {
            const { x, y } = L.pos.get(c.id)!;
            const rand = seeded(c.id);
            const color = STATUS_COLOR[c.status];
            const r = 19 + c.pKnown * 8;
            const dendrites = Array.from({ length: 6 }, (_, i) => {
              const a = (i / 6) * Math.PI * 2 + rand() * 0.8;
              const len = r + 6 + rand() * 10;
              const bend = (rand() - 0.5) * 10;
              const ex = Math.cos(a) * len, ey = Math.sin(a) * len;
              return `M${Math.cos(a) * r * 0.8},${Math.sin(a) * r * 0.8} Q${ex / 2 - Math.sin(a) * bend},${ey / 2 + Math.cos(a) * bend} ${ex},${ey}`;
            });
            const lines = wrap(c.title);
            const dim = selected && !related.has(c.id);
            return (
              <g
                key={c.id}
                className={`neuron st-${c.status} ${active === c.id ? "active" : ""}`}
                transform={`translate(${x},${y})`}
                opacity={dim ? 0.3 : 1}
                onClick={() => setActive(active === c.id ? null : c.id)}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(active === c.id ? null : c.id); } }}
                tabIndex={0}
                role="button"
                aria-pressed={active === c.id}
                aria-label={`${c.title}: ${STATUS_LABEL[c.status]}, mastery ${pct(c.pKnown)}`}
              >
                {dendrites.map((d, i) => (
                  <path key={i} d={d} className="dendrite" style={{ stroke: color }} />
                ))}
                {c.status === "learning" || c.status === "struggling" ? <circle r={r} className="ripple" style={{ stroke: color }} /> : null}
                <circle r={r} style={{ fill: color, opacity: 0.3 + c.recall * 0.45 }} filter={c.recall > 0.5 ? "url(#glow)" : undefined} />
                <circle r={r * 0.55} style={{ fill: color, opacity: 0.55 + c.recall * 0.45 }} />
                <circle r={r} className="soma-ring" style={{ stroke: color }} />
                {lines.map((l, i) => (
                  <text key={i} y={r + 24 + i * 15} textAnchor="middle" className="neuron-label">{l}</text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>
      {selected ? <ConceptDetail c={selected} /> : <p className="small muted center">Tap a neuron to see everything we know about that concept.</p>}
    </div>
  );
}

function ConceptDetail({ c }: { c: Concept }) {
  return (
    <div className="card detail">
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
        <path d={d} fill="none" stroke="var(--neuron-b)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
