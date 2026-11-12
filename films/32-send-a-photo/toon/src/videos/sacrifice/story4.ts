// Film 33 "The Things They Never Bought" — 88 s timeline (30 fps): shots, cameras, lens blur.
// Every object on screen is the thing the line talks about: the taped slippers, the sneakers and the price tag, the
// counted bills, the umbrella held over the boy, the mended cardigan beside the new jacket, the one piece of chicken,
// the 2:47 AM booth clock, the laptop box, the graduation photo, the envelope "For my son", the new slippers for Mom.
export const FPS = 30;
export type V3 = [number, number, number];
export type Light = "golden" | "lamp" | "night" | "morning" | "rain" | "street";
export type Place = "kitchen" | "street" | "living" | "campus" | "ui";
export type Shot = { id: number; a: number; b: number; light: Light; place: Place; cam: [V3, V3, V3, V3, number]; dof: [number, V3] };
export const IN: V3 = [200, 0, 0];   // living room (also Dad's wardrobe, Mom's house at the end)
export const KI: V3 = [600, 0, 0];   // kitchen + dinner table
export const ST: V3 = [800, 0, 0];   // street: the shoe store, the guard booth further down
export const CA: V3 = [1000, 0, 0];  // campus lawn (graduation)
const S = (s: number) => Math.round(s * FPS);
const I = (x: number, y: number, z: number): V3 => [IN[0] + x, y, z];
const K = (x: number, y: number, z: number): V3 => [KI[0] + x, y, z];
const T = (x: number, y: number, z: number): V3 => [ST[0] + x, y, z];
const C = (x: number, y: number, z: number): V3 => [CA[0] + x, y, z];
const UI: [V3, V3, V3, V3, number] = [[0, 0, 0], [0, 0, 0], [0, 0, -1], [0, 0, -1], 40];
// cam: [pos0, pos1, look0, look1, fov]   dof: [cInf px, focus point]
export const SHOTS: Shot[] = [
  { id: 1, a: S(0), b: S(5), light: "morning", place: "kitchen", cam: [K(-0.95, 0.3, 1.0), K(0.3, 0.3, 0.95), K(-0.95, 0.2, -0.2), K(0.3, 0.2, -0.2), 40], dof: [12, K(0, 0.2, -0.2)] },
  { id: 2, a: S(5), b: S(8.5), light: "golden", place: "street", cam: [T(0.2, 1.25, 4.2), T(0.1, 1.2, 3.6), T(-0.1, 1.15, -0.4), T(-0.1, 1.15, -0.4), 40], dof: [6, T(-0.2, 1.1, 0.1)] },
  { id: 3, a: S(8.5), b: S(11.5), light: "golden", place: "street", cam: [T(0.75, 1.55, 2.2), T(0.7, 1.52, 1.85), T(0.55, 1.35, 0.15), T(0.55, 1.38, 0.15), 36], dof: [12, T(0.55, 1.4, 0.2)] },
  { id: 4, a: S(11.5), b: S(14.5), light: "rain", place: "street", cam: [T(-2.2, 1.0, 4.4), T(-1.6, 1.0, 4.2), T(-2.0, 0.85, 0.9), T(-0.8, 0.85, 0.9), 40], dof: [6, T(-1.2, 0.9, 0.9)] },
  { id: 5, a: S(14.5), b: S(18.5), light: "lamp", place: "living", cam: [I(0.75, 1.2, 2.5), I(0.7, 1.15, 2.1), I(0.65, 0.8, -0.9), I(0.65, 0.8, -0.9), 38], dof: [9, I(0.5, 0.9, -0.85)] },
  { id: 6, a: S(18.5), b: S(22), light: "lamp", place: "living", cam: [I(0.2, 1.2, 1.6), I(0.22, 1.18, 1.35), I(0.25, 0.98, -0.9), I(0.25, 1.0, -0.9), 36], dof: [12, I(0.4, 1.05, -0.88)] },
  { id: 7, a: S(22), b: S(26), light: "night", place: "kitchen", cam: [K(0, 1.8, 2.9), K(0, 1.75, 2.55), K(0, 0.9, -0.7), K(0, 0.9, -0.7), 40], dof: [8, K(0, 1.0, -0.8)] },
  { id: 8, a: S(26), b: S(30), light: "night", place: "kitchen", cam: [K(0.45, 1.5, 1.0), K(0.48, 1.46, 0.8), K(0.55, 1.05, -1.0), K(0.55, 1.07, -1.0), 38], dof: [12, K(0.62, 1.15, -1.1)] },
  { id: 9, a: S(30), b: S(34), light: "street", place: "street", cam: [T(7.2, 1.45, 2.4), T(7.15, 1.4, 1.95), T(7.0, 1.2, -0.2), T(7.0, 1.2, -0.2), 38], dof: [8, T(7.0, 1.25, -0.1)] },
  { id: 10, a: S(34), b: S(40), light: "morning", place: "living", cam: [I(0.0, 1.3, 2.8), I(-0.02, 1.25, 2.45), I(-0.05, 0.95, -0.6), I(-0.05, 0.95, -0.6), 40], dof: [8, I(-0.05, 1.0, -0.5)] },
  { id: 11, a: S(40), b: S(44), light: "golden", place: "campus", cam: [C(0.7, 1.45, 5.6), C(0.65, 1.4, 5.0), C(0.45, 1.1, 0), C(0.45, 1.1, 0), 40], dof: [6, C(0.4, 1.1, 0)] },
  { id: 12, a: S(44), b: S(48), light: "golden", place: "campus", cam: [C(1.4, 1.5, 3.4), C(1.4, 1.46, 3.0), C(1.3, 1.1, 0.0), C(1.3, 1.12, 0.0), 38], dof: [10, C(1.55, 1.1, 0.3)] },
  { id: 13, a: S(48), b: S(56), light: "lamp", place: "ui", cam: UI, dof: [0, [0, 0, -1]] },
  { id: 14, a: S(56), b: S(60), light: "night", place: "ui", cam: UI, dof: [0, [0, 0, -1]] },
  { id: 15, a: S(60), b: S(64), light: "night", place: "living", cam: [I(1.0, 1.35, 1.5), I(1.15, 1.3, 1.35), I(2.85, 0.75, 0.1), I(2.85, 0.78, 0.1), 50], dof: [8, I(2.75, 1.0, 0.1)] },
  { id: 16, a: S(64), b: S(68), light: "night", place: "living", cam: [I(1.95, 1.45, 1.5), I(1.95, 1.32, 1.42), I(1.95, 0.62, 1.05), I(1.95, 0.62, 1.05), 36], dof: [12, I(1.95, 0.63, 1.05)] },
  { id: 17, a: S(68), b: S(72), light: "night", place: "living", cam: [I(1.95, 1.4, 1.5), I(1.95, 1.25, 1.4), I(1.95, 0.62, 1.05), I(1.95, 0.62, 1.05), 34], dof: [12, I(1.95, 0.63, 1.05)] },
  { id: 18, a: S(72), b: S(77), light: "lamp", place: "living", cam: [I(0.15, 1.15, 2.3), I(0.12, 1.1, 1.95), I(0.15, 0.62, -0.6), I(0.15, 0.64, -0.6), 40], dof: [9, I(0.15, 0.7, -0.6)] },
  { id: 19, a: S(77), b: S(82), light: "lamp", place: "living", cam: [I(0.12, 1.12, 1.75), I(0.12, 1.1, 1.5), I(0.12, 0.8, -0.7), I(0.12, 0.82, -0.7), 40], dof: [12, I(0.1, 0.85, -0.7)] },
  { id: 20, a: S(82), b: S(88), light: "lamp", place: "living", cam: [I(2.0, 0.3, 2.35), I(1.4, 1.35, 3.4), I(2.6, 0.08, 1.65), I(0.6, 0.75, -0.6), 40], dof: [6, I(2.6, 0.1, 1.65)] },
];
export const TOTAL = S(88);
export const shotAt = (f: number) => SHOTS.find((s) => f >= s.a && f < s.b) ?? SHOTS[SHOTS.length - 1];
export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
export const L3 = (a: V3, b: V3, k: number): V3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
export const camAt = (f: number): Cam => {
  const s = shotAt(f), e = smooth((f - s.a) / (s.b - s.a)), [p0, p1, l0, l1, fov] = s.cam;
  return { pos: L3(p0, p1, e), look: L3(l0, l1, e), fov, roll: 0 };
};
export const dofAt = (f: number) => { const s = shotAt(f); return { cInf: s.dof[0], focus: s.dof[1] }; };
