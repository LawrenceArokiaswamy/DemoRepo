// Remotion composition: the three.js engine draws each frame into the canvas (pure function of time); captions are React layers.
import React, { useEffect, useRef, useState } from 'react';
import { AbsoluteFill, useCurrentFrame, delayRender, continueRender, staticFile, interpolate } from 'remotion';
import { init, render, W, H } from './engine.js';
const font = new FontFace('Playfair', `url(${staticFile('fonts/PlayfairDisplay-Italic.ttf')})`);
const fontReady = font.load().then(f => document.fonts.add(f));
const CAPS = [ // [start s, end s, text]
  [2.4, 5.6, 'He came home for the first time in two years.'],
  [7.0, 11.6, 'Son… how do I send a photo?'],
];
function Caption({ t }) {
  return CAPS.filter(([a, b]) => t >= a && t <= b).map(([a, b, s]) => {
    const o = interpolate(t, [a, a + .5, b - .5, b], [0, 1, 1, 0]);
    return <div key={s} style={{ position: 'absolute', left: 80, right: 80, top: 1440, textAlign: 'center', fontFamily: 'Playfair', fontSize: 58, lineHeight: 1.25, color: '#fff', opacity: o, textShadow: '0 3px 14px rgba(0,0,0,.75)' }}>{s}</div>;
  });
}
export const Film = () => {
  const frame = useCurrentFrame(); const t = frame / 30; const ref = useRef(null);
  const [h0] = useState(() => delayRender('assets', { timeoutInMilliseconds: 600000 }));
  useEffect(() => { Promise.all([init(ref.current), fontReady]).then(() => continueRender(h0)); }, []);
  useEffect(() => { const h = delayRender('frame ' + frame, { timeoutInMilliseconds: 600000 }); init(ref.current).then(() => { render(t); continueRender(h); }); }, [frame]);
  return <AbsoluteFill style={{ background: '#000' }}><canvas ref={ref} width={W} height={H} style={{ width: W, height: H }} /><Caption t={t} /></AbsoluteFill>;
};
