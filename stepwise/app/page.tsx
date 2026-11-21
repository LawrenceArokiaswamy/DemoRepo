import Link from "next/link";
import { CreateCourse } from "@/components/create-course";
import { aiMode, courseView, listCourses } from "@/src/service";
import { learnerId } from "@/src/learner";

export const dynamic = "force-dynamic";

export default async function Home() {
  const me = await learnerId();
  const mode = aiMode();
  const courses = listCourses().map((c) => {
    const v = courseView(c.id, me);
    return { id: c.id, title: c.title, description: c.description, ...v.stats, started: v.started };
  });
  const mine = courses.filter((c) => c.started);
  const others = courses.filter((c) => !c.started);

  return (
    <div className="container">
      <section className="hero">
        <h1>Learn anything, to real mastery.</h1>
        <p className="lead">
          Stepwise finds exactly where your understanding ends, teaches one step at a time from there, and tracks
          every concept until you truly hold it — then brings it back before you forget.
        </p>
        <CreateCourse anyTopic={mode.anyTopic} />
      </section>

      {mine.length ? (
        <section style={{ marginTop: 40 }}>
          <h2>Continue learning</h2>
          <div className="grid grid-2">
            {mine.map((c) => (
              <Link key={c.id} href={`/course/${c.id}`} className="card course-card">
                <div className="spread">
                  <h3 style={{ margin: 0 }}>{c.title}</h3>
                  {c.dueReviews ? <span className="badge badge-review">{c.dueReviews} due</span> : null}
                </div>
                <p className="muted small" style={{ margin: "6px 0 12px" }}>{c.description}</p>
                <div className="bar good"><span style={{ width: `${(c.mastered / c.total) * 100}%` }} /></div>
                <p className="small muted" style={{ margin: "8px 0 0" }}>
                  {c.mastered} of {c.total} concepts mastered · {c.answered} questions answered
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {others.length ? (
        <section style={{ marginTop: 40 }}>
          <h2>Courses</h2>
          <div className="grid grid-2">
            {others.map((c) => (
              <Link key={c.id} href={`/course/${c.id}`} className="card course-card">
                <h3>{c.title}</h3>
                <p className="muted small" style={{ margin: 0 }}>{c.description}</p>
                <p className="small muted" style={{ margin: "8px 0 0" }}>{c.total} concepts</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section id="how" style={{ marginTop: 56 }}>
        <h2>How it works</h2>
        <div className="steps-how" style={{ marginTop: 14 }}>
          <div className="card">
            <h3>Map</h3>
            <p className="muted small">Your topic becomes a graph of concepts: what depends on what, and the mistakes people typically make.</p>
          </div>
          <div className="card">
            <h3>Place</h3>
            <p className="muted small">A short adaptive placement finds the edge of what you know. You never sit through what you already understand.</p>
          </div>
          <div className="card">
            <h3>Teach</h3>
            <p className="muted small">One reasoning step at a time. Wrong answers are traced to the gap underneath and repaired before moving on.</p>
          </div>
          <div className="card">
            <h3>Retain</h3>
            <p className="muted small">Every concept has a live mastery estimate and a forgetting curve. Reviews come back exactly when they help.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
