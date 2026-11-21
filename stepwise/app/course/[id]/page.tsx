import Link from "next/link";
import { notFound } from "next/navigation";
import { KnowledgeMap } from "@/components/knowledge-map";
import { courseView, NotFoundError } from "@/src/service";
import { learnerId } from "@/src/learner";

export const dynamic = "force-dynamic";

const pct = (x: number | null) => (x === null ? "—" : `${Math.round(x * 100)}%`);

function ago(at: number) {
  const s = (Date.now() - at) / 1000;
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const EVENT_LABEL: Record<string, string> = {
  placement: "Placement question",
  answer: "Answered",
  lesson: "Studied lesson",
  mastered: "Mastered",
  "placement-complete": "Placement complete",
};

export default async function CoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let view;
  try {
    view = courseView(id, await learnerId());
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
  const { course, stats, concepts, calibration, timeline } = view;
  const accuracy = stats.answered ? stats.correct / stats.answered : null;

  return (
    <div className="container stack">
      <div className="spread">
        <div style={{ maxWidth: 680 }}>
          <h1>{course.title}</h1>
          <p className="muted">{course.description}</p>
        </div>
        <Link href={`/learn/${course.id}`} className="btn btn-primary btn-lg">
          {view.started ? (stats.dueReviews ? `Review ${stats.dueReviews} due` : "Continue learning") : "Start — quick placement"}
        </Link>
      </div>

      <div className="grid grid-4">
        <div className="card stat"><div className="value">{stats.mastered}/{stats.total}</div><div className="label">Concepts mastered</div></div>
        <div className="card stat"><div className="value">{stats.answered}</div><div className="label">Questions answered</div></div>
        <div className="card stat"><div className="value">{pct(accuracy)}</div><div className="label">Accuracy</div></div>
        <div className="card stat"><div className="value">{stats.dueReviews}</div><div className="label">Reviews due</div></div>
      </div>

      <div className="card">
        <div className="spread" style={{ marginBottom: 6 }}>
          <h2 style={{ margin: 0 }}>Your brain on <span className="gradient-text">{course.title}</span></h2>
          <span className="small muted">{view.placementDone ? "Placement complete" : view.started ? "Placement in progress" : "Not started"}</span>
        </div>
        <p className="small muted">Every neuron is a concept. Foundations sit at the core; ideas built on them radiate outward. Neurons glow brighter as you master them, and signals fire along the connections you've built.</p>
        <KnowledgeMap concepts={concepts} />
      </div>

      <div className="grid grid-2">
        <div className="card">
          <h2>Confidence calibration</h2>
          <p className="small muted">How often you're right when you say you're guessing, unsure or sure. Well-calibrated learners know what they don't know.</p>
          <table className="table">
            <tbody>
              <tr><td>When guessing</td><td>{pct(calibration.guess)}</td></tr>
              <tr><td>When unsure</td><td>{pct(calibration.unsure)}</td></tr>
              <tr><td>When sure</td><td>{pct(calibration.sure)}</td></tr>
            </tbody>
          </table>
          {calibration.overconfident ? (
            <p className="callout" style={{ marginTop: 12 }}>You're often wrong when sure. Those confident errors get extra attention.</p>
          ) : null}
        </div>
        <div className="card">
          <h2>Learning log</h2>
          {timeline.length ? (
            <ul className="timeline">
              {timeline.slice(0, 12).map((t, i) => (
                <li key={i}>
                  <span className="when">{ago(t.at)}</span>
                  <span>
                    {EVENT_LABEL[t.type] ?? t.type}
                    {t.concept ? <> · <strong>{t.concept}</strong></> : null}
                    {t.score !== null ? <> · {t.score >= 0.7 ? "✓" : "✗"} {pct(t.before)} → {pct(t.after)}</> : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small muted">Every answer, lesson and change in your mastery will appear here.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2>Every concept</h2>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Concept</th><th>Status</th><th>Mastery</th><th>Recall now</th><th>Answers</th><th>Next review</th></tr>
            </thead>
            <tbody>
              {concepts.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.title}</strong>{c.misconceptions.length ? <div className="small muted">{c.misconceptions.length} misconception(s) seen</div> : null}</td>
                  <td><span className={`status-dot st-${c.status}`} />{c.status}</td>
                  <td>{pct(c.pKnown)}{c.inferred ? <span className="small muted"> (est.)</span> : null}</td>
                  <td>{pct(c.recall)}</td>
                  <td>{c.correct}/{c.attempts}</td>
                  <td>{c.reviewInDays === null ? "—" : c.reviewInDays <= 0 ? "Due now" : `in ${Math.ceil(c.reviewInDays)} day(s)`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
