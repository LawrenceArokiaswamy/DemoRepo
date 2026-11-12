// Film 32 "How Do I Send a Photo?" — look test timeline: shots, cameras, lens blur, captions (30 fps).
// Emotion without detailed faces: posture (slump, the offered phone slowly lowering), light (warm porch sun vs the cold
// blue of the laptop on the son's face), a fading "..." bubble, slow push-ins that isolate Dad, and the score.
export const FPS = 30;
export type V3 = [number, number, number];
export type Light = "golden" | "lamp";
export type Shot = { id: number; a: number; b: number; light: Light; place: "porch" | "living" };
export const SHOTS: Shot[] = [
  { id: 1, a: 0, b: 96, light: "golden", place: "porch" },     // the son walks up from the car; Dad waves from the porch
  { id: 2, a: 96, b: 192, light: "golden", place: "porch" },   // the hug: Dad holds on, the son holds his phone
  { id: 3, a: 192, b: 288, light: "lamp", place: "living" },   // couch two-shot: "Son... how do I send a photo?"
  { id: 4, a: 288, b: 384, light: "lamp", place: "living" },   // Dad close: no answer, the phone comes down
];
export const TOTAL = 384;
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const L = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

// interior set lives far from the farm so the two never see each other
export const IN: V3 = [200, 0, 0];
export const PORCH_Y = 0.5;
// son's walk from the car to the foot of the steps, then up onto the porch (shot 1); x, z over story time
export const sonWalk = (t: number): V3 => {
  const k = smooth(seg(t, 0.2, 3.2));
  const p = L([3.4, 0, 4.4], [0.75, 0, 1.25], k);
  return p;
};

export type Cam = { pos: V3; look: V3; fov: number; roll: number };
/** every shot creeps (no static holds); big reframes are cuts */
export const camAt = (f: number): Cam => {
  const s = shotAt(f), u = (f - s.a) / (s.b - s.a), e = smooth(u);
  switch (s.id) {
    case 1: return { pos: L([2.6, 1.05, 10.2], [2.2, 1.2, 8.6], e), look: L([1.2, 1.9, -0.8], [0.9, 1.75, -0.6], e), fov: 42, roll: 0 };
    case 2: return { pos: L([0.1, 1.55, 3.9], [0.05, 1.6, 3.2], e), look: L([0.0, 1.55, -0.62], [0.0, 1.62, -0.62], e), fov: 34, roll: 0.012 };
    case 3: return { pos: L([IN[0] + 0.05, 1.18, 3.0], [IN[0] + 0.03, 1.12, 2.55], e), look: [IN[0], 0.95, -1.0], fov: 38, roll: 0 };
    default: return { pos: L([IN[0] - 0.2, 1.3, 2.2], [IN[0] - 0.05, 1.28, 1.75], e), look: L([IN[0] + 0.42, 1.05, -0.88], [IN[0] + 0.45, 1.08, -0.88], e), fov: 32, roll: -0.01 };
  }
};
/** lens blur strength (px at 1080 for a far subject) and the focus point */
export const dofAt = (f: number): { cInf: number; focus: V3 } => {
  const s = shotAt(f);
  if (s.id === 1) return { cInf: 4, focus: [0.4, 1.6, 0] };
  if (s.id === 2) return { cInf: 11, focus: [0, 1.7, -0.62] };
  if (s.id === 3) return { cInf: 9, focus: [IN[0], 1.1, -0.85] };
  return { cInf: 13, focus: [IN[0] + 0.45, 1.2, -0.88] };
};
/** captions (seconds) */
export const CAPS: [number, number, string][] = [
  [0.6, 3.1, "His son came home for the first time in two years."],
  [6.9, 9.4, "“Son… how do I send a photo?”"],
  [10.4, 12.6, "He didn’t look up."],
];
