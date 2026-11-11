// Film 33 phone screens (React, sharp text): the son's money transfers and Dad's replies; Mom's call, then her text.
import React from "react";
import { AbsoluteFill, interpolate } from "remotion";

const UI = "Inter, 'DejaVu Sans', sans-serif";
const k = (t: number, a: number, b: number) => interpolate(t, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const ease = (x: number) => x * x * (3 - 2 * x);
const Phone: React.FC<{ children: React.ReactNode; scale?: number; y?: number }> = ({ children, scale = 1, y = 0 }) => (
  <div style={{ position: "absolute", left: 540 - 330, top: 960 - 660 + y, width: 660, height: 1320, transform: `scale(${scale})`, transformOrigin: "50% 50%" }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: 86, background: "#0d0e12", boxShadow: "0 40px 120px rgba(0,0,0,.65), inset 0 0 0 3px #2c2f38" }} />
    <div style={{ position: "absolute", left: 22, top: 22, right: 22, bottom: 22, borderRadius: 66, overflow: "hidden", background: "#f4f4f6" }}>{children}</div>
    <div style={{ position: "absolute", left: 270, top: 40, width: 120, height: 34, borderRadius: 20, background: "#0d0e12" }} />
  </div>
);
const StatusBar: React.FC<{ time: string; dark?: boolean }> = ({ time, dark }) => (
  <div style={{ height: 96, display: "flex", alignItems: "flex-end", padding: "0 54px 10px", fontFamily: UI, fontWeight: 600, fontSize: 30, color: dark ? "#fff" : "#111", justifyContent: "space-between" }}>
    <span>{time}</span><span style={{ letterSpacing: 4 }}>▂▄▆ ▮</span>
  </div>
);
const Header: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ textAlign: "center", padding: "14px 0 22px", borderBottom: "1px solid #ddd", background: "#f8f8fa", fontFamily: UI }}>
    <div style={{ width: 92, height: 92, borderRadius: 46, background: "#c9ced8", margin: "0 auto 10px", fontSize: 44, lineHeight: "92px", color: "#fff", fontWeight: 600 }}>{title[0]}</div>
    <div style={{ fontSize: 32, fontWeight: 600, color: "#111" }}>{title}</div>
  </div>
);
const Desk: React.FC<{ night?: boolean }> = ({ night }) => (
  <AbsoluteFill style={{ background: night ? "radial-gradient(circle at 50% 45%, #2a2a3a 0%, #0c0b12 75%)" : "radial-gradient(circle at 50% 40%, #9aa6b8 0%, #4a5568 70%, #2b3240 100%)" }} />
);
const Bubble: React.FC<{ me?: boolean; o: number; children: React.ReactNode; bold?: boolean }> = ({ me, o, children, bold }) => (
  <div style={{ display: "flex", justifyContent: me ? "flex-end" : "flex-start", opacity: o, transform: `translateY(${(1 - o) * 18}px)`, margin: "10px 0" }}>
    <div style={{ maxWidth: 470, padding: "20px 26px", borderRadius: 36, background: me ? "#2f7cf6" : "#e4e4ea", color: me ? "#fff" : "#111", fontSize: 36, lineHeight: 1.3, fontWeight: bold ? 600 : 400 }}>{children}</div>
  </div>
);
const Stamp: React.FC<{ o: number; s: string }> = ({ o, s }) => <div style={{ textAlign: "center", fontSize: 22, color: "#999", margin: "16px 0 4px", opacity: o }}>{s}</div>;
const Typing: React.FC<{ t: number }> = ({ t }) => (
  <div style={{ margin: "12px 0", display: "inline-block", padding: "18px 26px", borderRadius: 34, background: "#e4e4ea", fontSize: 34, color: "#888", letterSpacing: 6 }}>{"•••".slice(0, 1 + Math.floor((t * 4) % 3))}</div>
);

/** shot 13 (8 s): the son sends money, twice; Dad answers the same way both times */
export const MoneyTexts: React.FC<{ t: number }> = ({ t }) => {
  const a = (x: number) => k(t, x, x + 0.25);
  return (
    <AbsoluteFill>
      <Desk />
      <Phone scale={1.0 + 0.05 * ease(k(t, 0, 8))} y={-40}>
        <StatusBar time={t < 4.6 ? "8:12" : "9:40"} />
        <Header title="Dad" />
        <div style={{ padding: "8px 30px", fontFamily: UI }}>
          <Stamp o={a(0.3)} s="March 3" />
          <div style={{ display: "flex", justifyContent: "flex-end", opacity: a(0.4), margin: "8px 0" }}>
            <div style={{ width: 400, borderRadius: 30, background: "#ffffff", border: "2px solid #d9e6d9", padding: "20px 24px", fontSize: 26, color: "#333" }}>
              <div style={{ color: "#2a9d55", fontWeight: 700, fontSize: 28 }}>✓ Money sent</div><div style={{ fontSize: 54, fontWeight: 700, color: "#111", marginTop: 6 }}>$500.00</div>
            </div>
          </div>
          <Bubble me o={a(1.0)}>Buy yourselves something nice ❤</Bubble>
          {t > 1.9 && t < 2.8 && <Typing t={t} />}
          <Bubble o={a(2.8)}>We don't need anything. Come home soon. – Dad</Bubble>
          <Stamp o={a(4.6)} s="June 9" />
          <div style={{ display: "flex", justifyContent: "flex-end", opacity: a(4.7), margin: "8px 0" }}>
            <div style={{ width: 400, borderRadius: 30, background: "#ffffff", border: "2px solid #d9e6d9", padding: "20px 24px", fontSize: 26 }}>
              <div style={{ color: "#2a9d55", fontWeight: 700, fontSize: 28 }}>✓ Money sent</div><div style={{ fontSize: 54, fontWeight: 700, color: "#111", marginTop: 6 }}>$500.00</div>
            </div>
          </div>
          <Bubble me o={a(5.3)}>Please use it this time, Dad.</Bubble>
          {t > 6.0 && t < 6.8 && <Typing t={t} />}
          <Bubble o={a(6.8)}>We're fine. When are you coming home?</Bubble>
        </div>
      </Phone>
    </AbsoluteFill>
  );
};

/** shot 14 (4 s): Mom calling (unanswered), then her text */
export const MomCall: React.FC<{ t: number }> = ({ t }) => {
  const ring = t < 1.7, txt = k(t, 2.0, 2.3), pulse = 1 + 0.06 * Math.sin(t * 12);
  return (
    <AbsoluteFill>
      <Desk night />
      <Phone scale={1.02 + 0.04 * ease(k(t, 0, 4))} y={-20}>
        {ring ? (
          <AbsoluteFill style={{ background: "linear-gradient(#3a3550, #1b1a26)", fontFamily: UI, color: "#fff", textAlign: "center" }}>
            <StatusBar time="6:58" dark />
            <div style={{ fontSize: 30, opacity: 0.8, marginTop: 120 }}>incoming call</div>
            <div style={{ fontSize: 84, fontWeight: 600, marginTop: 14 }}>Mom</div>
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 150, display: "flex", justifyContent: "space-around" }}>
              <div style={{ width: 130, height: 130, borderRadius: 65, background: "#e5372b", fontSize: 54, lineHeight: "130px" }}>✕</div>
              <div style={{ width: 130, height: 130, borderRadius: 65, background: "#2bb24c", fontSize: 54, lineHeight: "130px", transform: `scale(${pulse})` }}>✆</div>
            </div>
          </AbsoluteFill>
        ) : (
          <>
            <StatusBar time="7:01" />
            <Header title="Mom" />
            <div style={{ padding: "18px 30px", fontFamily: UI }}>
              <div style={{ textAlign: "center", fontSize: 24, color: "#e5372b", margin: "10px 0 16px", fontWeight: 600 }}>Missed call · 6:58 AM</div>
              <Bubble o={txt} bold>Your dad is gone. Please come home.</Bubble>
            </div>
          </>
        )}
      </Phone>
    </AbsoluteFill>
  );
};
