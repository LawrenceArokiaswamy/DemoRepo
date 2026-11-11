// Film 32 "How Do I Send a Photo?" — full 88 s timeline (30 fps): shots, cameras, lens blur, captions, phone screens.
// Emotion without detailed faces: posture (slumps, the offered phone lowering, shaking shoulders), light (warm sun and
// lamp vs the cold blue of screens, rain, an office), a fading "..." bubble, tears, slow push-ins, silence in the score.
export const FPS = 30;
export type V3 = [number, number, number];
export type Light = "golden" | "lamp" | "night" | "morning" | "office" | "rain";
export type Place = "porch" | "living" | "office" | "ui";
export type Shot = { id: number; a: number; b: number; light: Light; place: Place; cam: [V3, V3, V3, V3, number]; dof: [number, V3] };
export const IN: V3 = [200, 0, 0];      // living room
export const OF: V3 = [400, 0, 0];      // office
export const PORCH_Y = 0.5;
const S = (s: number) => Math.round(s * FPS);
const I = (x: number, y: number, z: number): V3 => [IN[0] + x, y, z];
const O = (x: number, y: number, z: number): V3 => [OF[0] + x, y, z];
// cam: [pos0, pos1, look0, look1, fov]   dof: [cInf px, focus point]
export const SHOTS: Shot[] = [
  { id: 1, a: S(0), b: S(3.2), light: "golden", place: "porch", cam: [[2.6, 1.05, 10.2], [2.2, 1.2, 8.6], [1.2, 1.9, -0.8], [0.9, 1.75, -0.6], 42], dof: [4, [0.4, 1.6, 0]] },
  { id: 2, a: S(3.2), b: S(6.4), light: "golden", place: "porch", cam: [[0.1, 1.55, 3.9], [0.05, 1.6, 3.2], [0, 1.55, -0.62], [0, 1.62, -0.62], 34], dof: [11, [0, 1.7, -0.62]] },
  { id: 3, a: S(6.4), b: S(9.6), light: "lamp", place: "living", cam: [I(0.05, 1.18, 3.0), I(0.03, 1.12, 2.55), I(0, 0.95, -1), I(0, 0.95, -1), 38], dof: [9, I(0, 1.1, -0.85)] },
  { id: 4, a: S(9.6), b: S(13.6), light: "lamp", place: "living", cam: [I(0.0, 1.15, 2.3), I(0.0, 1.12, 2.05), I(0, 0.92, -1), I(0, 0.92, -1), 40], dof: [8, I(0, 1.1, -0.85)] },
  { id: 5, a: S(13.6), b: S(17.6), light: "lamp", place: "living", cam: [I(-0.2, 1.3, 2.2), I(-0.05, 1.28, 1.75), I(0.42, 1.05, -0.88), I(0.45, 1.08, -0.88), 32], dof: [13, I(0.45, 1.2, -0.88)] },
  { id: 6, a: S(17.6), b: S(21.6), light: "night", place: "living", cam: [I(0.9, 1.15, 1.6), I(0.75, 1.15, 1.25), I(0.4, 1.02, -0.9), I(0.42, 1.08, -0.9), 32], dof: [12, I(0.42, 1.2, -0.9)] },
  { id: 7, a: S(21.6), b: S(26.0), light: "night", place: "living", cam: [I(0.15, 1.35, 2.7), I(0.1, 1.3, 2.3), I(-0.1, 0.95, -0.9), I(-0.1, 0.98, -0.9), 38], dof: [8, I(-0.1, 1.0, -0.9)] },
  { id: 8, a: S(26.0), b: S(30.0), light: "morning", place: "porch", cam: [[0.6, 1.45, 10.8], [0.9, 1.45, 10.1], [3.5, 1.3, 6.3], [3.5, 1.32, 6.3], 34], dof: [8, [3.5, 1.5, 6.3]] },
  { id: 9, a: S(30.0), b: S(34.0), light: "morning", place: "porch", cam: [[3.0, 1.35, 19.5], [2.9, 1.4, 18.8], [0.6, 1.7, -0.3], [0.6, 1.75, -0.3], 30], dof: [3, [0.3, 1.7, 0.05]] },
  { id: 10, a: S(34.0), b: S(37.0), light: "office", place: "ui", cam: [[0, 0, 0], [0, 0, 0], [0, 0, -1], [0, 0, -1], 40], dof: [0, [0, 0, -1]] },
  { id: 11, a: S(37.0), b: S(44.0), light: "office", place: "ui", cam: [[0, 0, 0], [0, 0, 0], [0, 0, -1], [0, 0, -1], 40], dof: [0, [0, 0, -1]] },
  { id: 12, a: S(44.0), b: S(48.0), light: "office", place: "office", cam: [O(0.0, 1.25, 1.9), O(0.0, 1.22, 1.35), O(0, 1.1, -0.6), O(0, 1.12, -0.6), 32], dof: [12, O(0, 1.2, -0.6)] },
  { id: 13, a: S(48.0), b: S(52.0), light: "rain", place: "porch", cam: [[-0.75, 1.6, -0.45], [-0.95, 1.55, -0.65], [-2.95, 0.98, -2.0], [-2.95, 1.0, -2.0], 44], dof: [9, [-2.95, 1.0, -2.0]] },
  { id: 14, a: S(52.0), b: S(56.0), light: "night", place: "living", cam: [I(0.0, 1.2, 2.5), I(0.0, 1.15, 2.05), I(0, 0.85, -0.6), I(0, 0.88, -0.6), 38], dof: [9, I(0, 0.9, -0.7)] },
  { id: 15, a: S(56.0), b: S(66.0), light: "night", place: "ui", cam: [[0, 0, 0], [0, 0, 0], [0, 0, -1], [0, 0, -1], 40], dof: [0, [0, 0, -1]] },
  { id: 16, a: S(66.0), b: S(71.0), light: "night", place: "living", cam: [I(0.0, 1.15, 1.75), I(0.0, 1.12, 1.25), I(0, 1.0, -0.8), I(0, 1.02, -0.8), 32], dof: [13, I(0, 1.1, -0.8)] },
  { id: 17, a: S(71.0), b: S(76.0), light: "golden", place: "porch", cam: [[-2.55, 1.55, 0.1], [-2.65, 1.52, -0.2], [-3.2, 1.2, -1.7], [-3.2, 1.2, -1.7], 50], dof: [7, [-3.0, 1.25, -1.66]] },
  { id: 18, a: S(76.0), b: S(83.0), light: "golden", place: "porch", cam: [[-2.3, 1.6, -0.2], [-2.45, 1.58, -0.45], [-3.0, 1.35, -1.7], [-3.0, 1.35, -1.7], 42], dof: [12, [-3.0, 1.3, -1.66]] },
  { id: 19, a: S(83.0), b: S(88.0), light: "golden", place: "porch", cam: [[-0.2, 1.5, 4.6], [1.6, 2.6, 9.6], [-2.6, 1.0, -1.8], [-1.6, 1.4, -1.6], 38], dof: [5, [-2.8, 1.1, -1.8]] },
];
export const TOTAL = S(88);
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const L3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
export const sonWalk = (t: number): V3 => L3([3.4, 0, 4.4], [0.75, 0, 1.25], smooth(seg(t, 0.2, 3.2)));
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
export const camAt = (f: number): Cam => {
  const s = shotAt(f), e = smooth((f - s.a) / (s.b - s.a)), [p0, p1, l0, l1, fov] = s.cam;
  return { pos: L3(p0, p1, e), look: L3(l0, l1, e), fov, roll: 0 };
};
export const dofAt = (f: number) => { const s = shotAt(f); return { cInf: s.dof[0], focus: s.dof[1] }; };
/** captions [start s, end s, text] */
export const CAPS: [number, number, string][] = [
  [0.6, 3.1, "His son came home for the first time in two years."],
  [6.9, 9.4, "“Son… how do I send a photo?”"],
  [9.9, 11.8, "“I showed you already, Dad.”"],
  [12.0, 13.5, "“Right… okay.”"],
  [18.0, 21.3, "Later that night, he tried on his own."],
  [26.5, 28.1, "“Stay one more day?”"],
  [28.3, 29.9, "“Can’t, Dad. Big week.”"],
  [71.3, 73.0, "Years later."],
  [73.4, 75.9, "“Dad, how do I send a photo?”"],
  [77.0, 79.6, "He wasn’t learning the phone."],
  [79.8, 82.8, "He was trying to reach you."],
];
