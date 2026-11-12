// Film 33 props, drawn as ink cartoon cards (Pen): every object the script names, big and simple so it reads at a glance.
import { Pen, INK, bodyFront, Outfit } from "../sendphoto/toon2";

type P2 = [number, number];
const txt = (p: Pen, s: string, x: number, y: number, size: number, col = INK, font = "Playfair", align: CanvasTextAlign = "center", rot = 0) => {
  const g = p.g; g.save(); g.translate(x, y); g.rotate(rot); g.font = `${size}px ${font}`; g.fillStyle = col; g.textAlign = align; g.textBaseline = "middle"; g.fillText(s, 0, 0); g.restore();
};
const rect = (x0: number, y0: number, x1: number, y1: number): P2[] => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/** a worn slipper seen from the side: sole, strap; the taped one has a grey tape X and a torn edge */
export const slipper = (p: Pen, x: number, y: number, s: number, taped: boolean, col = "#8a6a50", flip = false) => {
  const f = flip ? -1 : 1, X = (v: number) => x + f * v * s, Y = (v: number) => y + v * s;
  p.poly([[X(-60), Y(0)], [X(70), Y(-6)], [X(84), Y(6)], [X(70), Y(16)], [X(-62), Y(16)]], "#5a4a3e", 6 * s); // sole
  p.poly([[X(-20), Y(-2)], [X(-6), Y(-46)], [X(40), Y(-46)], [X(66), Y(-4)]], col, 6 * s); // strap
  if (taped) {
    p.poly([[X(4), Y(-50)], [X(22), Y(-52)], [X(36), Y(0)], [X(18), Y(2)]], "#c9c3b4", 3 * s);
    p.poly([[X(-8), Y(-18)], [X(52), Y(-34)], [X(56), Y(-20)], [X(-4), Y(-4)]], "#c9c3b4", 3 * s);
    p.stroke([[X(56), Y(-8)], [X(62), Y(-16)], [X(66), Y(-8)], [X(72), Y(-14)]], 3 * s); // fraying
  }
};
/** shin + slipper (hook shot): two feet shuffling; phase 0..1 lifts one foot after the other */
export const feetFx = (p: Pen, phase: number) => {
  const pants = "#4a5368";
  for (const [k, x0] of [[0, 210], [1, 380]] as const) {
    const up = Math.max(0, Math.sin(2 * Math.PI * (phase + k * 0.5))) * 22, dx = Math.sin(2 * Math.PI * (phase + k * 0.5)) * 30;
    p.poly(rect(x0 - 40 + dx, 0, x0 + 40 + dx, 250 - up), pants, 7);
    p.poly(rect(x0 - 30 + dx, 245 - up, x0 + 34 + dx, 300 - up), "#f2c9a8", 6); // ankle
    slipper(p, x0 + 14 + dx, 345 - up, 1.65, k === 0);
  }
};
/** white sneaker with red stripes and a red heel (no logo) */
export const sneaker = (p: Pen, x: number, y: number, s: number, flip = false) => {
  const f = flip ? -1 : 1, X = (v: number) => x + f * v * s, Y = (v: number) => y + v * s;
  p.poly([[X(-90), Y(30)], [X(100), Y(30)], [X(112), Y(14)], [X(100), Y(2)], [X(-90), Y(4)]], "#e9e4dc", 6 * s);
  p.poly([[X(-90), Y(4)], [X(-86), Y(-56)], [X(-40), Y(-64)], [X(10), Y(-40)], [X(70), Y(-22)], [X(102), Y(2)]], "#fbfbf7", 6 * s);
  p.poly([[X(-90), Y(4)], [X(-88), Y(-50)], [X(-62), Y(-56)], [X(-58), Y(4)]], "#d8382e", 5 * s);
  for (const k of [0, 1]) p.stroke([[X(-30 + k * 24), Y(0)], [X(10 + k * 24), Y(-40)]], 8 * s, "#d8382e");
  for (let i = 0; i < 4; i++) p.stroke([[X(-14 + i * 14), Y(-50 + i * 6)], [X(4 + i * 14), Y(-44 + i * 6)]], 4 * s);
};
export const sneakerPairFx = (p: Pen) => { sneaker(p, 170, 170, 1.2); sneaker(p, 400, 190, 1.2); };
/** paper price tag on a string */
export const priceTagFx = (p: Pen, price = "$89.99") => {
  p.stroke([[40, 30], [90, 80]], 4);
  p.poly([[70, 70], [130, 50], [290, 50], [290, 170], [130, 170], [70, 150]], "#fff7e0", 6);
  p.ell(100, 110, 9, 9, "#d9cba8", 3);
  txt(p, price, 210, 110, 64, "#c23b2c", "Inter");
};
/** fanned bills in a hand (count 1..4) */
export const billsFx = (p: Pen, n: number) => {
  for (let i = 0; i < n; i++) {
    const a = -0.45 + i * 0.3, cx = 160, cy = 190, g = p.g;
    g.save(); g.translate(cx, cy); g.rotate(a); g.translate(-cx, -cy);
    p.poly(rect(70, 60, 250, 150), "#9cc48a", 5); p.ell(160, 105, 26, 26, "#c9e2b8", 3); txt(p, "$", 160, 107, 36, "#3d6a35", "Inter");
    g.restore();
  }
  p.ell(160, 190, 40, 30, "#f2c9a8", 6);
};
/** big umbrella (canopy + handle) */
export const umbrellaFx = (p: Pen) => {
  const pts: P2[] = [[20, 200]]; for (let i = 0; i <= 6; i++) { const x = 20 + i * 93; pts.push([x, 200 - (i % 6 === 0 ? 0 : 0)]); }
  const dome: P2[] = []; for (let i = 0; i <= 40; i++) { const a = Math.PI + (i / 40) * Math.PI; dome.push([300 + 280 * Math.cos(a), 205 + 175 * Math.sin(a)]); }
  for (let k = 5; k >= 0; k--) dome.push([20 + k * 93.3 + 46, 205 + (k % 1) * 0 + 14]);
  p.poly(dome, "#2f4f86", 8);
  for (const x of [113, 206, 300, 393, 486]) p.stroke([[300, 32], [x, 210]], 4, "#1d335c");
  p.stroke([[300, 210], [300, 390]], 10); p.arc(318, 390, 18, 18, 0, 180, 8);
};
/** Mom's mustard cardigan laid flat: a hole, a darned patch, the thread and the needle in her hand */
export const cardiganFx = (p: Pen, k: number) => {
  p.poly([[110, 40], [390, 40], [470, 140], [420, 170], [380, 120], [380, 360], [120, 360], [120, 120], [80, 170], [30, 140]], "#c9a24a", 8);
  p.stroke([[250, 40], [250, 360]], 5); for (let i = 0; i < 4; i++) p.dot(270, 90 + i * 70, 8, "#7a5a2a");
  p.poly([[150, 230], [210, 222], [216, 280], [154, 286]], "#a8873e", 4); for (let i = 0; i < 5; i++) p.stroke([[156, 232 + i * 11], [212, 228 + i * 11]], 2, "#6a4f22");
  p.ell(320, 200, 26, 18, "#5a4126", 4); // the hole
  const nx = 300 + 40 * Math.sin(k * Math.PI * 2), ny = 160 - 50 * Math.abs(Math.sin(k * Math.PI * 2));
  p.stroke([[320, 200], [nx, ny]], 2, "#e8e2d4"); p.stroke([[nx - 18, ny + 10], [nx + 22, ny - 12]], 4, "#c9ccd2");
  p.ell(nx, ny, 22, 18, "#f2c9a8", 5);
};
/** brand-new puffy jacket on a hanger with a big white price tag */
export const jacketFx = (p: Pen) => {
  p.stroke([[200, 20], [200, 50]], 6); p.stroke([[110, 80], [200, 50], [290, 80]], 7);
  p.poly([[110, 80], [290, 80], [360, 160], [330, 190], [300, 160], [300, 420], [100, 420], [100, 160], [70, 190], [40, 160]], "#3a78c2", 8);
  for (let i = 0; i < 6; i++) p.stroke([[100, 140 + i * 48], [300, 140 + i * 48]], 4, "#2a5a99");
  p.stroke([[200, 85], [200, 420]], 5);
  p.stroke([[300, 200], [330, 250]], 3); p.poly(rect(300, 245, 390, 320), "#ffffff", 5); txt(p, "NEW", 345, 270, 26, "#c23b2c", "Inter"); txt(p, "$65", 345, 300, 22, INK, "Inter");
};
/** a plate seen from above (flat on the table): rice, chicken or nothing */
export const plateFx = (p: Pen, rice: boolean, chicken: boolean) => {
  p.ell(150, 100, 140, 88, "#f6f3ee", 6); p.ell(150, 100, 105, 64, null, 3);
  if (rice) { p.ell(130, 100, 62, 38, "#efe3c4", 4); for (let i = 0; i < 14; i++) p.ell(90 + (i * 37) % 80, 82 + (i * 23) % 36, 6, 3, "#efe9da", 0); }
  if (chicken) drumstick(p, 185, 92, 1);
};
export const drumstick = (p: Pen, x: number, y: number, s: number) => {
  p.ell(x, y, 38 * s, 28 * s, "#b8692e", 5 * s); p.ell(x - 6 * s, y - 6 * s, 20 * s, 12 * s, "#d98b45", 0);
  p.stroke([[x + 30 * s, y + 10 * s], [x + 62 * s, y + 24 * s]], 12 * s, "#f3ead6"); p.ell(x + 66 * s, y + 26 * s, 9 * s, 9 * s, "#f3ead6", 4 * s);
};
export const chickenFx = (p: Pen) => drumstick(p, 80, 60, 1.2);
/** empty-stomach rumble lines */
export const growlFx = (p: Pen) => { for (const k of [0, 1, 2]) p.arc(100, 100, 30 + k * 22, 26 + k * 18, -50, 50, 6, "#ffffff"); };
/** digital clock in the guard booth */
export const clockFx = (p: Pen) => { p.poly(rect(10, 10, 390, 150), "#1b1d22", 7); txt(p, "2:47 AM", 200, 82, 84, "#ff5a4a", "Inter"); };
export const securitySignFx = (p: Pen) => { p.poly(rect(10, 10, 590, 130), "#f2c94c", 7); txt(p, "SECURITY", 300, 72, 78, INK, "Inter"); };
export const shopSignFx = (p: Pen) => { p.poly(rect(10, 10, 790, 170), "#a8323a", 8); txt(p, "SHOES", 400, 92, 110, "#fff4dc", "Playfair"); };
/** laptop box with a red bow */
export const laptopBoxFx = (p: Pen) => {
  p.poly(rect(20, 60, 380, 280), "#f4f4f2", 7);
  p.poly(rect(110, 110, 290, 220), "#7d8591", 5); p.poly(rect(122, 120, 278, 205), "#9cc8ff", 0);
  p.poly(rect(185, 60, 215, 280), "#d8382e", 0); p.ell(170, 52, 34, 22, "#d8382e", 5); p.ell(230, 52, 34, 22, "#d8382e", 5); p.ell(200, 58, 14, 14, "#b02a22", 4);
};
/** "CONGRATULATIONS GRADUATES" banner */
export const bannerFx = (p: Pen) => { p.poly(rect(10, 20, 1190, 230), "#2c3e6b", 8); txt(p, "CONGRATULATIONS GRADUATES", 600, 125, 78, "#f2d27a", "Inter"); };
/** the opened shoebox: the old sneakers' box, the receipt, a photo of the boy wearing them */
export const shoeboxFx = (p: Pen, kid: Outfit) => {
  p.poly([[40, 80], [760, 80], [740, 470], [60, 470]], "#e07a2e", 9);
  p.poly([[70, 105], [730, 105], [712, 445], [88, 445]], "#f4e7d2", 5);
  // receipt
  p.poly([[110, 140], [330, 125], [350, 420], [125, 432]], "#ffffff", 5);
  const g = p.g; g.save(); g.translate(225, 280); g.rotate(-0.06);
  txt(p, "RECEIPT", 0, -110, 30, INK, "Inter"); for (let i = 0; i < 3; i++) p.stroke([[-80, -60 + i * 34], [80, -60 + i * 34]], 3, "#b9b2a6");
  txt(p, "Kids sneakers", -6, 40, 26, INK, "Inter"); txt(p, "$89.99", 0, 82, 40, "#c23b2c", "Inter"); txt(p, "PAID CASH", 0, 122, 26, INK, "Inter");
  g.restore();
  // photo of the boy in the new sneakers
  p.poly([[390, 140], [700, 160], [680, 440], [372, 420]], "#ffffff", 6);
  g.save(); p.clip([[410, 160], [682, 178], [664, 422], [392, 404]], () => {
    const sk = g.createLinearGradient(0, 160, 0, 420); sk.addColorStop(0, "#9fd0f0"); sk.addColorStop(1, "#f6e2b8"); g.fillStyle = sk; g.fillRect(380, 150, 320, 290);
    g.fillStyle = "#cfc8bd"; g.fillRect(380, 360, 320, 80);
    g.translate(450, 150); g.scale(0.27, 0.27); bodyFront(new Pen(g), kid, { mode: "stand", expr: "laugh", seed: 8, handL: [150, 420], handR: [450, 420] });
  }); g.restore();
};
/** the envelope: "For my son", stuffed with every bill he sent */
export const envelopeFx = (p: Pen, open: number) => {
  for (let i = 0; i < 6; i++) { const y = 140 - open * (40 + i * 12); p.poly(rect(150 + i * 26, y, 470 + i * 26, y + 160), "#9cc48a", 4); p.ell(310 + i * 26, y + 80, 30, 30, "#c9e2b8", 3); }
  p.poly(rect(60, 150, 740, 520), "#f1e4c4", 9);
  p.poly([[60, 150], [400, 330], [740, 150]], "#e6d5ae", 6);
  txt(p, "For my son", 400, 430, 92, "#2a2a4a", "Playfair", "center", -0.03);
  p.stroke([[250, 480], [560, 476]], 3, "#2a2a4a");
};
export const tearFx = (p: Pen) => { p.poly([[30, 10], [48, 44], [30, 58], [12, 44]], "#a9d6ff", 3); };
/** fluffy new slippers (for Mom) */
export const newSlippersFx = (p: Pen) => {
  for (const x of [150, 330]) { p.ell(x, 140, 100, 52, "#f3b8c4", 7); p.ell(x - 20, 120, 60, 36, "#f8d6dd", 0); p.ell(x + 30, 150, 50, 30, "#ffffff", 5); }
};
/** the taped slippers sitting side by side (end) */
export const tapedPairFx = (p: Pen) => { slipper(p, 160, 150, 1.3, true); slipper(p, 400, 160, 1.3, false); };
/** Dad's flannel on a hanger with darned elbow patches */
export const patchedShirtFx = (p: Pen) => {
  p.stroke([[200, 10], [200, 40]], 6); p.stroke([[100, 70], [200, 40], [300, 70]], 7);
  const body: P2[] = [[100, 70], [300, 70], [390, 190], [350, 380], [310, 370], [300, 200], [300, 470], [100, 470], [100, 200], [90, 370], [50, 380], [10, 190]];
  p.poly(body, "#b9473c", 8);
  p.clip(body, () => { const g = p.g; g.globalAlpha = 0.32; for (let k = 0; k < 22; k++) { p.stroke([[k * 20, 0], [k * 20, 480]], 6, "#3a2a4a"); p.stroke([[0, k * 22], [400, k * 22]], 6, "#3a2a4a"); } g.globalAlpha = 1; });
  for (const [x, y] of [[60, 300], [340, 300]] as const) { p.ell(x, y, 30, 36, "#8a7a5a", 5); for (let i = 0; i < 4; i++) p.stroke([[x - 20, y - 18 + i * 12], [x + 20, y - 18 + i * 12]], 2, "#4a3a2a"); }
  p.stroke([[200, 70], [200, 470]], 4); for (let i = 0; i < 5; i++) p.dot(210, 110 + i * 72, 6, "#2a1d18");
};
export const streak = (p: Pen) => { p.stroke([[16, 4], [10, 120]], 8, "rgba(255,255,255,1)"); };
export const flashFx = (p: Pen, a: number) => { const g = p.g, gr = g.createRadialGradient(200, 200, 0, 200, 200, 200); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.35, `rgba(255,250,235,${a * 0.6})`); gr.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = gr; g.fillRect(0, 0, 400, 400); };
