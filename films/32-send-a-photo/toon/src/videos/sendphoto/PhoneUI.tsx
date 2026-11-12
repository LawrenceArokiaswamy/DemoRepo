// Film 32 phone screens, built as React layers (sharp text): missed calls flipped face down, Mom's texts arriving,
// and Dad's drafts: the photos from the visit, each one "Not sent". Generic phone, no brand.
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile } from "remotion";

const UI = "Inter, 'DejaVu Sans', sans-serif";
const k = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const ease = (x: number) => x * x * (3 - 2 * x);

const Phone: React.FC<{ children: React.ReactNode; scale?: number; rotY?: number; y?: number }> = ({ children, scale = 1, rotY = 0, y = 0 }) => (
  <div style={{ position: "absolute", left: 540 - 330, top: 960 - 660 + y, width: 660, height: 1320, transform: `perspective(2200px) rotateY(${rotY}deg) scale(${scale})`, transformOrigin: "50% 50%" }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: 86, background: "#0d0e12", boxShadow: "0 40px 120px rgba(0,0,0,.65), inset 0 0 0 3px #2c2f38" }} />
    <div style={{ position: "absolute", left: 22, top: 22, right: 22, bottom: 22, borderRadius: 66, overflow: "hidden", background: "#f4f4f6", backfaceVisibility: "hidden" }}>{children}</div>
    <div style={{ position: "absolute", left: 270, top: 40, width: 120, height: 34, borderRadius: 20, background: "#0d0e12" }} />
  </div>
);
const StatusBar: React.FC<{ time: string; dark?: boolean }> = ({ time, dark }) => (
  <div style={{ height: 96, display: "flex", alignItems: "flex-end", padding: "0 54px 10px", fontFamily: UI, fontWeight: 600, fontSize: 30, color: dark ? "#fff" : "#111", justifyContent: "space-between" }}>
    <span>{time}</span><span style={{ letterSpacing: 4 }}>▂▄▆ ▮</span>
  </div>
);
const Header: React.FC<{ title: string; sub?: string }> = ({ title, sub }) => (
  <div style={{ textAlign: "center", padding: "14px 0 22px", borderBottom: "1px solid #ddd", background: "#f8f8fa", fontFamily: UI }}>
    <div style={{ width: 92, height: 92, borderRadius: 46, background: "#c9ced8", margin: "0 auto 10px", fontSize: 44, lineHeight: "92px", color: "#fff", fontWeight: 600 }}>{title[0]}</div>
    <div style={{ fontSize: 30, fontWeight: 600, color: "#111" }}>{title}</div>{sub && <div style={{ fontSize: 22, color: "#888", marginTop: 4 }}>{sub}</div>}
  </div>
);
const Desk: React.FC<{ night?: boolean }> = ({ night }) => (
  <AbsoluteFill style={{ background: night ? "radial-gradient(circle at 50% 45%, #2a2a3a 0%, #0c0b12 75%)" : "radial-gradient(circle at 50% 40%, #a9876a 0%, #5d4535 70%, #3b2b22 100%)" }} />
);

/** shot 10 (3 s): the lock screen at work: "Dad - 3 missed calls"; a hand flips the phone face down */
export const MissedCalls: React.FC<{ t: number }> = ({ t }) => {
  const flip = ease(k(t, 1.7, 2.3)), rot = flip * 180;
  return (
    <AbsoluteFill>
      <Desk />
      <Phone scale={0.98 + 0.03 * k(t, 0, 3)} rotY={rot}>
        <AbsoluteFill style={{ background: "linear-gradient(#2d3a55, #6a5a7a)" }}>
          <StatusBar time="9:02" dark />
          <div style={{ fontFamily: UI, color: "#fff", textAlign: "center", fontSize: 150, fontWeight: 300, marginTop: 40 }}>9:02</div>
          <div style={{ fontFamily: UI, color: "#e8e8f0", textAlign: "center", fontSize: 30, marginTop: -6 }}>Tuesday</div>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ margin: "26px 34px 0", padding: "24px 28px", borderRadius: 30, background: "rgba(255,255,255,.82)", fontFamily: UI, opacity: k(t, 0.15 + i * 0.22, 0.4 + i * 0.22) }}>
              <div style={{ fontSize: 22, color: "#666", display: "flex", justifyContent: "space-between" }}><span>PHONE</span><span>{["8:41", "8:47", "8:58"][i]} AM</span></div>
              <div style={{ fontSize: 32, fontWeight: 600, color: "#111", marginTop: 6 }}>Dad</div>
              <div style={{ fontSize: 28, color: "#333" }}>Missed call</div>
            </div>
          ))}
        </AbsoluteFill>
      </Phone>
      {/* face down: the dark back of the phone once it has turned past 90 degrees */}
      {rot > 90 && <div style={{ position: "absolute", left: 540 - 330, top: 960 - 660, width: 660 * 1.0, height: 1320 * 1.0, borderRadius: 86, background: "linear-gradient(135deg,#2a2d36,#15161b)",
        transform: `perspective(2200px) rotateY(${rot - 180}deg)`, boxShadow: "0 30px 90px rgba(0,0,0,.6)" }} />}
    </AbsoluteFill>
  );
};

const MSGS: [number, string, string][] = [
  [0.5, "9:14 AM", "Dad collapsed this morning. It’s his heart. We’re at the hospital."],
  [2.1, "9:16 AM", "Please call me."],
  [3.7, "10:41 AM", "He keeps asking for you."],
  [5.3, "11:52 AM", "He’s gone, sweetheart. I’m so sorry."],
];
/** shot 11 (7 s): Mom's texts arrive one after another */
export const MomTexts: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill>
    <Desk />
    <Phone scale={1.02 + 0.06 * ease(k(t, 0, 7))} y={-20}>
      <StatusBar time={t < 2.1 ? "9:14" : t < 3.7 ? "9:16" : t < 5.3 ? "10:41" : "11:52"} />
      <Header title="Mom" />
      <div style={{ padding: "18px 30px", fontFamily: UI }}>
        {MSGS.map(([at, time, text], i) => {
          const typing = t > at - 0.7 && t < at, o = k(t, at, at + 0.25);
          return (
            <div key={i}>
              {typing && <div style={{ margin: "14px 0", display: "inline-block", padding: "18px 26px", borderRadius: 34, background: "#e4e4ea", fontSize: 34, color: "#888", letterSpacing: 6 }}>{"•••".slice(0, 1 + Math.floor((t * 4) % 3))}</div>}
              {o > 0 && <>
                <div style={{ textAlign: "center", fontSize: 21, color: "#999", margin: "18px 0 8px", opacity: o }}>{time}</div>
                <div style={{ maxWidth: 470, padding: "20px 26px", borderRadius: 36, background: "#e4e4ea", color: "#111", fontSize: 35, lineHeight: 1.3, opacity: o, transform: `translateY(${(1 - o) * 18}px)`,
                  fontWeight: i === 3 ? 600 : 400 }}>{text}</div>
              </>}
            </div>
          );
        })}
      </div>
    </Phone>
  </AbsoluteFill>
);

const DRAFTS: [string, string][] = [["thumbs/couch.jpg", "Proud of you son."], ["thumbs/asleep.jpg", "So glad you came home."], ["thumbs/car.jpg", "Drive safe. Love Dad."]];
const NotSent: React.FC<{ o: number }> = ({ o }) => (
  <div style={{ textAlign: "right", color: "#e5372b", fontSize: 28, fontWeight: 700, marginTop: 6, opacity: o }}>Not sent&nbsp; ⓘ</div>
);
/** shot 15 (10 s): Dad's phone, his drafts to his son: every photo from the visit, never sent; then the last one */
export const Drafts: React.FC<{ t: number }> = ({ t }) => {
  const scroll = ease(k(t, 5.4, 6.6)) * 900;
  return (
    <AbsoluteFill>
      <Desk night />
      <Phone scale={1.02 + 0.08 * ease(k(t, 0, 10))} y={-10}>
        <StatusBar time="11:48" />
        <Header title="Son ❤" sub="Drafts" />
        <div style={{ padding: "6px 32px", fontFamily: UI, transform: `translateY(${-scroll}px)` }}>
          {DRAFTS.map(([img, text], i) => {
            const at = 0.5 + i * 1.6, o = k(t, at, at + 0.4), ns = k(t, at + 0.7, at + 0.9);
            return (
              <div key={i} style={{ marginTop: 26, opacity: o, transform: `translateY(${(1 - o) * 24}px)` }}>
                <div style={{ marginLeft: "auto", width: 400, borderRadius: 30, overflow: "hidden", background: "#2f7cf6" }}>
                  <Img src={staticFile(img)} style={{ width: 400, height: 300, objectFit: "cover", display: "block" }} />
                  <div style={{ padding: "16px 22px", color: "#fff", fontSize: 34 }}>{text}</div>
                </div>
                <NotSent o={ns} />
              </div>
            );
          })}
          <div style={{ marginTop: 34, opacity: k(t, 6.4, 7.0) }}>
            <div style={{ marginLeft: "auto", width: 470, padding: "22px 26px", borderRadius: 34, background: "#2f7cf6", color: "#fff", fontSize: 35, lineHeight: 1.33 }}>
              I still can’t figure this out. Just wanted you to know I’m proud of you. Come home soon. Love, Dad.
            </div>
            <NotSent o={k(t, 7.6, 7.9)} />
          </div>
        </div>
      </Phone>
    </AbsoluteFill>
  );
};
