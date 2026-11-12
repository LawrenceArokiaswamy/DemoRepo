// character lab: poses drawn straight onto a 2D canvas (no 3D) to check the drawings quickly
import React, { useEffect, useRef } from "react";
import { AbsoluteFill } from "remotion";
import { Pen, bodyFront, bodySide } from "./toon2";
import { DAD, SON } from "./people";
const CELLS: ((p: Pen) => void)[] = [
  (p) => bodyFront(p, DAD, { mode: "stand", expr: "warm", seed: 3 }),
  (p) => bodyFront(p, DAD, { mode: "sit", expr: "hopeful", seed: 3, facing: -1, handR: [120, 560], holdR: "phone", screenK: 0.3 }),
  (p) => bodyFront(p, DAD, { mode: "sit", expr: "hurt", seed: 3, facing: -1, slump: 1, lookY: 1.2, handR: [330, 840], holdR: "phone" }),
  (p) => bodyFront(p, DAD, { mode: "sit", expr: "cry", seed: 3, tear: 0.6, slump: 0.6 }),
  (p) => bodyFront(p, SON, { mode: "sit", expr: "numb", seed: 6, lookY: 1.5, lap: "laptop", handL: [262, 805], handR: [338, 805], glow: "#9cc8ff", glowK: 0.7 }),
  (p) => bodyFront(p, SON, { mode: "stand", expr: "neutral", seed: 6, holdR: "phone", handR: [390, 640], lookY: 1.2, glow: "#9cc8ff", glowK: 0.5 }),
  (p) => bodySide(p, DAD, { mode: "hug", pose: 1, expr: "tender", seed: 3 }),
  (p) => bodySide(p, SON, { mode: "hug", pose: 0.8, expr: "neutral", seed: 6, hold: "phone", screenK: 0.4 }),
];
export const Lab: React.FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const g = ref.current!.getContext("2d")!; g.fillStyle = "#e9e1d3"; g.fillRect(0, 0, 1080, 1920);
    CELLS.forEach((draw, i) => { g.save(); g.translate((i % 4) * 270, Math.floor(i / 4) * 470 + 20); g.scale(0.45, 0.45); draw(new Pen(g)); g.restore(); });
  }, []);
  return <AbsoluteFill><canvas ref={ref} width={1080} height={1920} /></AbsoluteFill>;
};
