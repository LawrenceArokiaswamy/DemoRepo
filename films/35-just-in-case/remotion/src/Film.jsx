// Film 35 "Just In Case": 2.5D animation of the Higgsfield stills (Ken Burns with eased focus, breathing,
// per-part grade, living layers: dust, rain, bokeh, flare, haze), dips and a white bloom between parts.
// Subtitles and sound are added afterwards (subs35.py, mix35.py, finish35.sh).
import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, continueRender, delayRender } from 'remotion';

export const FPS = 30, W = 1080, H = 1920, DUR = 65;
const IW = 1296, IH = 2316;                       // upscaled still size (public/*.jpg)

// a, b: seconds; z: zoom from/to; o: focus point (0-1 of the image) that the zoom moves toward
const SH = [
  { id: 's01', a: 0.0, b: 4.0, z: [1.0, 1.07], o: [0.45, 0.45], g: 'warm', fx: ['flare'] },
  { id: 's02', a: 4.0, b: 8.0, z: [1.02, 1.09], o: [0.45, 0.35], g: 'warm' },
  { id: 's03b', a: 8.0, b: 13.0, z: [1.0, 1.07], o: [0.6, 0.4], g: 'warm', fx: ['bokeh'] },
  { id: 's04', a: 13.0, b: 18.0, z: [1.03, 1.14], o: [0.55, 0.3], g: 'warm', fx: ['bokeh'] },
  { id: 's05', a: 18.0, b: 21.8, z: [1.0, 1.09], o: [0.5, 0.35], g: 'garage', fx: ['dust'] },
  { id: 's06', a: 21.8, b: 25.0, z: [1.02, 1.08], o: [0.45, 0.4], g: 'garage', fx: ['dust'] },
  { id: 's07', a: 25.0, b: 29.0, z: [1.0, 1.06], o: [0.5, 0.6], g: 'grey', fx: ['drizzle'] },
  { id: 's08', a: 29.0, b: 35.0, z: [1.0, 1.12], o: [0.5, 0.33], g: 'grey' },
  { id: 's09', a: 35.0, b: 37.6, z: [1.0, 1.06], o: [0.45, 0.5], g: 'rain', fx: ['rain'] },
  { id: 's10', a: 37.6, b: 40.0, z: [1.04, 1.12], o: [0.6, 0.4], g: 'rain', fx: ['rain'] },
  { id: 's11', a: 40.0, b: 44.0, z: [1.0, 1.42], o: [0.585, 0.58], g: 'gold', fx: ['bokeh'], label: true },
  { id: 's12b', a: 44.0, b: 49.0, z: [1.02, 1.13], o: [0.5, 0.33], g: 'gold', fx: ['bokeh'] },
  { id: 's13', a: 49.0, b: 51.7, z: [1.0, 1.08], o: [0.55, 0.4], g: 'gold', fx: ['bokeh', 'haze'] },
  { id: 's03b', a: 51.7, b: 52.35, z: [1.12, 1.14], o: [0.6, 0.45], g: 'memory' },
  { id: 's13', a: 52.35, b: 53.2, z: [1.08, 1.1], o: [0.55, 0.4], g: 'gold', fx: ['bokeh', 'haze'] },
  { id: 's14', a: 53.2, b: 56.4, z: [1.0, 1.08], o: [0.45, 0.35], g: 'gold', fx: ['bokeh', 'haze'] },
  { id: 's15', a: 56.4, b: 58.6, z: [1.03, 1.12], o: [0.5, 0.35], g: 'gold', fx: ['bokeh'] },
  { id: 's14', a: 58.6, b: 65.0, z: [1.1, 1.0], o: [0.45, 0.35], g: 'gold', fx: ['bokeh', 'haze'] },
];
const DIPS = [[18.0, 0.35], [25.0, 0.5], [29.0, 0.3], [35.0, 0.25]];   // dip to black centred on t, half-width
const WHITE = [40.0, 0.45];                                           // bloom into "20 years later"

const GRADE = {
  warm: { f: 'saturate(1.06) contrast(1.04)', tint: 'rgba(255,160,80,0.07)' },
  garage: { f: 'saturate(0.96) contrast(1.08) brightness(0.97)', tint: 'rgba(40,80,110,0.06)' },
  grey: { f: 'saturate(0.5) contrast(0.98) brightness(0.95)', tint: 'rgba(110,135,165,0.10)' },
  rain: { f: 'saturate(0.95) contrast(1.07)', tint: 'rgba(30,60,120,0.05)' },
  gold: { f: 'saturate(1.04) contrast(1.03)', tint: 'rgba(255,180,100,0.05)' },
  memory: { f: 'sepia(0.4) saturate(1.25) brightness(1.1) blur(0.8px)', tint: 'rgba(255,200,140,0.18)' },
};

const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => { const u = clamp(x); return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; };
const rnd = (i) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

const Dust = ({ t }) => (
  <AbsoluteFill style={{ mixBlendMode: 'screen' }}>
    {Array.from({ length: 70 }).map((_, i) => {
      const x = (rnd(i) * W + Math.sin(t * 0.3 + i) * 30 + t * (8 + rnd(i + 9) * 10)) % W;
      const y = (rnd(i + 3) * H * 0.75 + Math.cos(t * 0.25 + i * 1.7) * 40 - t * (6 + rnd(i + 5) * 8) + H) % H;
      const s = 2 + rnd(i + 7) * 5, o = (0.25 + 0.5 * rnd(i + 11)) * (0.6 + 0.4 * Math.sin(t * 2 + i));
      return <div key={i} style={{ position: 'absolute', left: x, top: y, width: s, height: s, borderRadius: s, background: '#ffd9a0', opacity: o, filter: 'blur(1px)' }} />;
    })}
  </AbsoluteFill>
);
const Rain = ({ t, n, op, len }) => (
  <AbsoluteFill style={{ mixBlendMode: 'screen' }}>
    {Array.from({ length: n }).map((_, i) => {
      const sp = 2200 + rnd(i + 1) * 1400, L = len * (0.6 + rnd(i + 2) * 0.8);
      const x = (rnd(i) * (W + 200) - 100 + ((t * sp * 0.12) % 200)) % (W + 100);
      const y = ((rnd(i + 4) * (H + L) + t * sp) % (H + L)) - L;
      return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 2, height: L, background: 'linear-gradient(transparent, rgba(220,235,255,0.9))', opacity: op * (0.5 + rnd(i + 6) * 0.5), transform: 'rotate(8deg)' }} />;
    })}
  </AbsoluteFill>
);
const Bokeh = ({ t }) => (
  <AbsoluteFill style={{ mixBlendMode: 'screen' }}>
    {Array.from({ length: 16 }).map((_, i) => {
      const r = 30 + rnd(i + 2) * 70, x = rnd(i) * W + Math.sin(t * 0.2 + i) * 25, y = (rnd(i + 1) * H * 0.7 - t * (4 + rnd(i + 3) * 6) + H) % (H * 0.8);
      const o = 0.06 + 0.1 * rnd(i + 5) + 0.04 * Math.sin(t * 1.3 + i * 2.1);
      return <div key={i} style={{ position: 'absolute', left: x - r, top: y - r, width: 2 * r, height: 2 * r, borderRadius: 2 * r, background: 'radial-gradient(circle, rgba(255,205,140,0.9) 0%, rgba(255,190,120,0.35) 55%, transparent 72%)', opacity: o, filter: 'blur(4px)' }} />;
    })}
  </AbsoluteFill>
);
const Flare = ({ t }) => {
  const x = 230 + Math.sin(t * 0.6) * 25, y = 300 + Math.cos(t * 0.5) * 12, p = 0.75 + 0.25 * Math.sin(t * 1.7);
  return (
    <AbsoluteFill style={{ mixBlendMode: 'screen' }}>
      <div style={{ position: 'absolute', left: x - 420, top: y - 420, width: 840, height: 840, borderRadius: 840, background: 'radial-gradient(circle, rgba(255,200,120,0.55) 0%, rgba(255,150,70,0.18) 35%, transparent 65%)', opacity: p }} />
      <div style={{ position: 'absolute', left: x + 220, top: y + 380, width: 90, height: 90, borderRadius: 90, background: 'radial-gradient(circle, rgba(255,180,120,0.25), transparent 70%)', opacity: p }} />
      <div style={{ position: 'absolute', left: x + 420, top: y + 640, width: 50, height: 50, borderRadius: 50, border: '2px solid rgba(255,200,150,0.15)', opacity: p }} />
    </AbsoluteFill>
  );
};
const Haze = ({ t }) => (
  <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: 0.18 + 0.05 * Math.sin(t * 0.7) }}>
    <div style={{ position: 'absolute', left: W / 2 - 330 + Math.sin(t * 0.3) * 30, top: -200, width: 660, height: 1700, background: 'linear-gradient(rgba(255,215,160,0.7), rgba(255,200,140,0.15) 70%, transparent)', filter: 'blur(40px)', clipPath: 'polygon(38% 0, 62% 0, 100% 100%, 0 100%)' }} />
  </AbsoluteFill>
);

const Shot = ({ s, t }) => {
  const u = (t - s.a) / (s.b - s.a), z = s.z[0] + (s.z[1] - s.z[0]) * ease(u);
  const breath = 1 + 0.003 * Math.sin((t - s.a) * 2 * Math.PI / 4.2);
  const flick = s.g === 'gold' || s.g === 'garage' ? 1 + 0.018 * Math.sin(t * 9.1) * Math.sin(t * 3.7 + 1) : 1;
  const k = (W / IW) * z;                                   // image pixels -> frame pixels
  const fx = s.o[0] * IW, fy = s.o[1] * IH;                 // focus in image pixels
  // place the focus so it drifts from the frame centre (zoom 1) toward its own position, keeping the frame filled
  const cx = W / 2 - fx * k + (fx - IW / 2) * k * (1 - 1 / z) * 0, cy = H / 2 - fy * k;
  let left = W / 2 - IW * k / 2 + (IW / 2 - fx) * (k - W / IW), top = H / 2 - IH * k / 2 + (IH / 2 - fy) * (k - W / IW);
  left = Math.min(0, Math.max(W - IW * k, left)); top = Math.min(0, Math.max(H - IH * k * breath, top));
  const G = GRADE[s.g];
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#000' }}>
      <div style={{ position: 'absolute', left, top, width: IW, height: IH, transform: `scale(${k}, ${k * breath})`, transformOrigin: '0 0', filter: `${G.f} brightness(${flick})` }}>
        <Img src={staticFile(`${s.id}.jpg`)} style={{ width: IW, height: IH }} />
        {s.label && (
          <div style={{ position: 'absolute', left: 618, top: 1300, width: 270, height: 92, transform: 'rotate(-8.5deg) skewX(4deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
            fontFamily: 'Caveat', fontWeight: 600, fontSize: 31, lineHeight: 1.0, color: '#3a2717', opacity: clamp((t - 40.6) / 0.6) * 0.92 }}>
            Mia's wedding —<br />open at the dance
          </div>
        )}
      </div>
      <AbsoluteFill style={{ background: G.tint, mixBlendMode: 'soft-light' }} />
      {s.fx?.includes('dust') && <Dust t={t} />}
      {s.fx?.includes('rain') && <Rain t={t} n={140} op={0.35} len={90} />}
      {s.fx?.includes('drizzle') && <Rain t={t} n={50} op={0.12} len={60} />}
      {s.fx?.includes('bokeh') && <Bokeh t={t} />}
      {s.fx?.includes('flare') && <Flare t={t} />}
      {s.fx?.includes('haze') && <Haze t={t} />}
    </AbsoluteFill>
  );
};

export const Film = () => {
  const [handle] = React.useState(() => delayRender('font'));
  React.useEffect(() => {
    const f = new FontFace('Caveat', `url(${staticFile('caveat.woff2')})`, { weight: '600' });
    f.load().then((ff) => { document.fonts.add(ff); continueRender(handle); });
  }, [handle]);
  const t = useCurrentFrame() / FPS;
  const i = SH.findIndex((s) => t >= s.a && t < s.b);
  const s = SH[i < 0 ? SH.length - 1 : i];
  // 3-frame soft cut from the previous shot (except across dips/bloom)
  const prev = i > 0 ? SH[i - 1] : null, xf = prev ? clamp((t - s.a) / 0.1) : 1;
  let black = 0;
  for (const [c, w] of DIPS) black = Math.max(black, 1 - clamp(Math.abs(t - c) / w));
  black = Math.max(black, 1 - clamp(t / 0.7), clamp((t - 64.1) / 0.9));
  const white = 1 - clamp(Math.abs(t - WHITE[0]) / WHITE[1]);
  const endDark = clamp((t - 58.8) / 1.2) * 0.45;
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      {prev && xf < 1 && <Shot s={prev} t={t} />}
      <AbsoluteFill style={{ opacity: xf }}><Shot s={s} t={t} /></AbsoluteFill>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.42) 100%)' }} />
      <AbsoluteFill style={{ background: '#000', opacity: endDark }} />
      <AbsoluteFill style={{ background: '#fff8ec', opacity: white }} />
      <AbsoluteFill style={{ background: '#000', opacity: black }} />
    </AbsoluteFill>
  );
};
