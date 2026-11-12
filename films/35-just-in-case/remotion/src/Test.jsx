import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { ThreeShot } from './Three35.jsx';
const F = 30;
export const SHOTS3 = {
  s03b: { depth: 0.32, dist: 3.6, dolly: 0.3, arc: 0.06, fill: 0.9, feetY: 0.17, headY: 0.86, chestY: 0.68, pivotU: 0.62, waltz: 1.3, swayAmt: 0.028, bobAmt: 0.012, breathAmt: 0.004,
          glows: [{ u: 0.73, v: 0.985, s: 0.35, col: 'rgba(255,190,110,0.9)', op: 0.35 }] },
  s09: { depth: 0.4, dist: 3.6, dolly: 0.22, arc: -0.05, fill: 0.9, feetY: 0.12, headY: 0.62, chestY: 0.5, heaveAmt: 0.006, heaveT: 0.9, breathAmt: 0.006, breathT: 1.6, rain: 700, rainOp: 0.45, ripple: 0.9, rippleY: 0.22,
          glows: [{ u: 0.77, v: 0.645, s: 0.32, col: 'rgba(255,150,40,1)', op: 0.7, blink: 0.9 }, { u: 0.23, v: 0.95, s: 0.5, col: 'rgba(255,170,80,0.9)', op: 0.35 }] },
  s10: { depth: 0.4, dist: 3.5, dolly: 0.2, arc: 0.04, fill: 0.9, feetY: 0.05, headY: 0.75, chestY: 0.5, heaveAmt: 0.012, heaveT: 1.15, breathAmt: 0.008, breathT: 1.15, rain: 600, rainOp: 0.4, ripple: 0.6, rippleY: 0.15,
          glows: [{ u: 0.95, v: 0.82, s: 0.4, col: 'rgba(255,40,30,1)', op: 0.45, blink: 0.9 }] },
};
export const Test = () => (
  <AbsoluteFill style={{ background: '#000' }}>
    <Sequence from={0} durationInFrames={5 * F}><ThreeShot id="s03b" t0={0} dur={5} cfg={SHOTS3.s03b} /></Sequence>
    <Sequence from={5 * F} durationInFrames={2.6 * F}><ThreeShot id="s09" t0={0} dur={2.6} cfg={SHOTS3.s09} /></Sequence>
    <Sequence from={7.6 * F} durationInFrames={2.4 * F}><ThreeShot id="s10" t0={0} dur={2.4} cfg={SHOTS3.s10} /></Sequence>
  </AbsoluteFill>
);
