/* Sprouting Cows: demo short for the Science Story Shorts kit (Edward Jenner and the first vaccine).
   THE SIX BEATS: weird action (a doctor scratches a cow disease into a boy's arm) → stakes (smallpox, 3 in 10) → the clue
   (milkmaids who had cowpox never caught smallpox) → the test (real smallpox… nothing happens) → the laugh (paper refused,
   cartoons of patients sprouting cows) → the science (cowpox looks like smallpox; the body remembers) → payoff (gone by 1980)
   → arguable last line (every vaccine is named after a cow).
   FACTS: Edward Jenner (1749-1823), a country doctor in Berkeley, Gloucestershire. 14 May 1796: matter from cowpox sores on
   the hand of milkmaid Sarah Nelmes was put into small cuts on the arm of James Phipps (8). On 1 July 1796 Jenner inoculated
   him with smallpox matter; he did not fall ill. Dairy folk had long said cowpox protected against smallpox. Smallpox killed
   about 3 in 10 of the people it infected. The Royal Society did not accept his 1797 paper; he published "An Inquiry" himself
   in 1798. James Gillray's 1802 cartoon "The Cow-Pock" shows vaccinated people sprouting little cows. WHO declared smallpox
   eradicated in 1980. Jenner called cowpox "variolae vaccinae" (vacca = cow), which gave us "vaccine" and "vaccination".
   Dramatized: our own cartoon drawing (not Gillray's art); "weeks later" (about seven weeks).
   Sources: who.int (smallpox) · jennermuseum.com · en.wikipedia.org/wiki/Edward_Jenner · royalsociety.org

   SHOT PLAN (22 shots, a cut every ~2.2 s, a sound on every cut)
    1 "In"           farm     hook: doctor with a tiny lancet over a nervous boy, a cow peeks over the fence, push in
    2 "cow"          farm     CU: the cow, moo after "disease"
    3 "into"         farm     CU: boy sees the lancet, "!" on "arm"
    4 "Back then"    village  dusk, ten villagers; three vanish in puffs on "three"; title "3 IN 10"
    5 "But milkmaids" farm    milkmaid milks the cow and talks, doctor listens with his notebook
    6 "cowpox"       farm     CU: cow + milkmaid's hand, moo
    7 "smallpox never" farm   CU: milkmaid proud, hands on hips, sparkles
    8 "So, weeks"    study    wide: doctor carries a jar toward the boy, title "WEEKS LATER"
    9 "he gave"      study    insert: the SMALLPOX jar, green glow, tense
   10 "And"          study    boy shrugs, totally fine, "?" … ooh
   11 "Scientists"   hall     experts at the green table, REJECTED stamp slams down
   12 "Cartoons"     street   three townsfolk laugh at a notice board, newspaper
   13 "sprouting"    street   insert: our cartoon print, little cows pop out of the patient one by one
   14 "The science?" study    chalkboard writes COWPOX ≈ SMALLPOX
   15 "Cowpox looks" body     inside the body: small blue germ and big red germ, side by side, labels
   16 "Beat"         body     white-cell soldiers bonk the small germ: stars
   17 "and your body" body    soldier holds a WANTED poster; the big germ arrives… soldiers point; germ shocked
   18 "By"           space    globe turns, title "1980", confetti on "gone"
   19 "And his"      farm     doctor pats the cow, hearts
   20 "Vacca"        farm     chalkboard by the barn: VACCA = COW, the cow nods, moo
   21 "Every"        clinic   a nurse gives a girl a shot, she's brave
   22 "is named"     clinic   the nurse is now the cow (nurse cap), wink + moo on the very last word */
window.SHORT = {
  title: "Sprouting Cows", slug: "sprouting-cows",
  script: `In seventeen ninety-six, a country doctor scratched a *cow* disease… into a little boy's *arm.*
Back then, smallpox killed three out of every ten *people* who caught it.
But milkmaids swore that if you caught *cowpox* from a cow… smallpox *never* touched you.
So, weeks later, he gave the boy *real* smallpox. And… *nothing* happened.
Scientists *refused* to print his paper. Cartoons showed his patients… *sprouting* cows.
The *science?* Cowpox looks almost *exactly* like smallpox. Beat the *weak* one… and your body *remembers.*
By nineteen eighty, smallpox was *gone* from the planet.
And his trick was named after the *cow.* *Vacca.* Latin for cow.
Every *vaccine* you've ever had… is named after a *cow.*`,
  tail: 1.4,
  captions: { subs: { "seventeen ninety-six": "1796", "three": "3", "ten": "10", "nineteen eighty": "1980" } },

  init(T) {
    if (this._T === T) return; this._T = T; const S = this;
    const w = (q, a = 0) => T.w(q, a);
    S.W = { cow1: w("cow"), disease: w("disease"), into: w("into"), arm: w("arm"), back: w("back then"), three: w("three"), people: w("people"), but: w("but milkmaids"),
      cowpox: w("cowpox"), acow: w("cow", 14), never: w("never"), touched: w("touched"), so: w("so weeks"), weeks: w("weeks"), gave: w("he gave"), real: w("real"), and1: w("and nothing"),
      nothing: w("nothing"), happened: w("happened"), sci: w("scientists"), refused: w("refused"), paper: w("paper"), cartoons: w("cartoons"), sprouting: w("sprouting"), cows: w("cows"),
      science: w("the science"), cowpox2: w("cowpox looks"), exactly: w("exactly"), beat: w("beat"), weak: w("weak"), body: w("and your body"), remembers: w("remembers"),
      by: w("by nineteen"), y1980: w("nineteen eighty"), gone: w("gone"), planet: w("planet"), trick: w("and his trick"), named1: w("named"), thecow: w("cow", 40.5),
      vacca: w("vacca"), latin: w("latin"), forcow: w("cow", 42.6), every: w("every vaccine"), vaccine: w("vaccine", 43), had: w("had"), is: w("is named"), lastcow: w("cow", 46.9) };
    const Wt = S.W;
    const v = (p, l, fov = 40, roll = 0) => ({ p, l, fov, roll });
    S.plan = CS.shots(T, [
      { at: 0, set: "farm", light: "bright", from: v([.15, 1.45, 4.4], [.1, 1.25, -.4]), to: v([.12, 1.4, 3.6], [.1, 1.25, -.4]), blur: .16, id: "hook" },
      { at: "cow", set: "farm", light: "bright", from: v([.3, 1.25, .2], [.25, 1.05, -2.75], 38), to: v([.28, 1.22, -.3], [.25, 1.05, -2.75], 38), blur: .3, id: "cowcu" },
      { at: "into", set: "farm", light: "bright", from: v([.5, 1.05, 2.2], [.5, .95, .1], 40), to: v([.5, 1.0, 1.7], [.5, .95, .1], 40), blur: .3, id: "boycu" },
      { at: "back then", set: "village", light: "gloom", from: v([0, 2.4, 9.5], [0, 1.2, -1.4]), to: v([0, 2.2, 8.4], [0, 1.2, -1.4]), blur: .05, id: "ten" },
      { at: "but milkmaids", set: "farm", light: "bright", from: v([-.2, 1.6, 6.4], [-.2, 1.1, -1.4]), to: v([-.2, 1.55, 5.6], [-.2, 1.1, -1.4]), blur: .1, id: "milk" },
      { at: "cowpox", set: "farm", light: "bright", from: v([-.05, 1.3, 2.5], [-.05, 1.05, -1.6], 38), to: v([-.05, 1.28, 2.0], [-.05, 1.05, -1.6], 38), blur: .3, id: "milkcu" },
      { at: "smallpox never", set: "farm", light: "bright", from: v([.55, 1.55, 1.9], [.55, 1.55, -1.0]), to: v([.55, 1.55, 1.4], [.55, 1.55, -1.0]), blur: .3, id: "proud" },
      { at: "so weeks", set: "study", light: "study", from: v([0, 1.8, 6.6], [0, 1.2, -1]), to: v([0, 1.75, 5.8], [0, 1.2, -1]), blur: .1, id: "study" },
      { at: "he gave", set: "study", light: "study", from: v([-.95, 1.3, 1.25], [-.95, 1.08, -1.2], 36), to: v([-.95, 1.25, .85], [-.95, 1.1, -1.2], 36), blur: .35, id: "jar" },
      { at: "and nothing", set: "study", light: "study", from: v([.35, 1.25, 3.4], [.35, 1.0, -.2]), to: v([.35, 1.2, 2.8], [.35, 1.0, -.2]), blur: .2, id: "fine" },
      { at: "scientists", set: "hall", light: "hall", from: v([0, 2.0, 7.2], [0, 1.3, -1.2]), to: v([0, 1.9, 6.2], [0, 1.3, -1.2]), blur: .1, id: "rejected" },
      { at: "cartoons", set: "street", light: "bright", from: v([-.4, 1.7, 5.6], [-.1, 1.35, -1.4]), to: v([-.35, 1.65, 4.8], [-.1, 1.35, -1.4]), blur: .1, id: "laugh" },
      { at: "sprouting", set: "street", light: "bright", from: v([.95, 1.6, .9], [.95, 1.6, -2.2], 40), to: v([.95, 1.6, .35], [.95, 1.6, -2.2], 40), blur: .2, id: "print" },
      { at: "the science", set: "study", light: "study", from: v([-1.7, 1.9, 2.2], [-1.7, 1.9, -3.3], 40), to: v([-1.7, 1.9, 1.6], [-1.7, 1.9, -3.3], 40), blur: .15, id: "board" },
      { at: "cowpox looks", set: "body", light: "body", from: v([0, 1.55, 6.2], [0, 1.5, 0]), to: v([0, 1.5, 5.3], [0, 1.5, 0]), blur: .05, id: "germs" },
      { at: "beat", set: "body", light: "body", from: v([-.9, 1.3, 3.8], [-.9, 1.1, 0]), to: v([-.9, 1.25, 3.2], [-.9, 1.1, 0]), blur: .12, shake: .12, shakeAt: Wt.weak + .1, id: "bonk" },
      { at: "and your body", set: "body", light: "body", from: v([.05, 1.5, 5.6], [.05, 1.3, 0]), to: v([.05, 1.45, 4.8], [.05, 1.3, 0]), blur: .08, id: "wanted" },
      { at: "by nineteen", set: "space", light: "space", from: v([0, 1.0, 11], [0, .3, 0], 40), to: v([0, .8, 9.6], [0, .3, 0], 40), blur: 0, id: "globe" },
      { at: "and his trick", set: "farm", light: "golden2", from: v([.2, 1.5, 4.6], [.2, 1.2, -1.6]), to: v([.2, 1.45, 3.8], [.2, 1.2, -1.6]), blur: .15, id: "pat" },
      { at: "vacca", set: "farm", light: "golden2", from: v([-2.0, 1.7, 3.8], [-2.0, 1.4, -2.6]), to: v([-2.0, 1.65, 3.2], [-2.0, 1.4, -2.6]), blur: .15, id: "vacca" },
      { at: "every vaccine", set: "clinic", light: "clinic", from: v([0, 1.6, 5.0], [0, 1.2, -1]), to: v([0, 1.55, 4.2], [0, 1.2, -1]), blur: .1, id: "shot" },
      { at: "is named", set: "clinic", light: "clinic", from: v([.28, 1.35, 3.3], [.28, 1.2, -1]), to: v([.28, 1.3, 2.5], [.28, 1.2, -1], 40, -3), blur: .2, ease: "inOut", id: "cownurse" },
    ]);
  },

  setup(T) {
    const S = this, Wd = CS.world, R = CS.rand, P = (spec, parent, o) => CS.person(Object.assign({ style: "round" }, spec), Object.assign({ parent }, o || {}));
    S.init(T); const Wt = S.W, { fillStroke, line, limb, celShade } = CS.draw, OL = CS.INK;
    // ---------- looks ----------
    CS.LIGHTS.bright = Object.assign({}, CS.LIGHTS.day, { sat: 1.18, top: "#2f86e8", hor: "#cfeaff" });
    CS.LIGHTS.golden2 = Object.assign({}, CS.LIGHTS.golden, { sat: 1.2, top: "#3a7ad8", hor: "#ffd2a0" });
    CS.LIGHTS.gloom = Object.assign({}, CS.LIGHTS.dusk, { top: "#2a2f5a", hor: "#a87a9a", sat: .9, card: "#d8d0e8", fog: [20, 120] });
    CS.LIGHTS.study = Object.assign({}, CS.LIGHTS.indoor, { sun: "#fff1dc", card: "#fffaf2", sat: 1.16, hemiI: 1.3 });
    CS.LIGHTS.hall = Object.assign({}, CS.LIGHTS.indoor, { sun: "#fff6e8", card: "#ffffff", sat: 1.14, gain: [1.02, 1.01, 1.0], hemiI: 1.35 });
    CS.LIGHTS.body = Object.assign({}, CS.LIGHTS.indoor, { top: "#7a1636", hor: "#ff8fa6", fog: [6, 26], card: "#fff0f4", sun: "#ffe8ee", sat: 1.15, hemiI: 1.25 });
    CS.LIGHTS.space = Object.assign({}, CS.LIGHTS.night, { top: "#05060f", hor: "#101a3a", stars: 1, fog: [200, 900], sunI: 2.6, sun: "#fff4e0", az: 60, el: 20, card: "#e8ecff", sat: 1.15, hemiI: .7 });
    CS.LIGHTS.clinic = Object.assign({}, CS.LIGHTS.indoor, { sun: "#f4fbff", card: "#ffffff", sat: 1.12, hemiI: 1.4 });

    // ---------- new hand props ----------
    CS.PROPS.lancet = (g, x, y, side) => { g.save(); g.translate(x, y - 10); g.rotate(side * -.9); g.beginPath(); g.roundRect(-8, -60, 16, 60, 6); fillStroke(g, "#c8962e", 5); g.beginPath(); g.moveTo(-8, -60); g.lineTo(0, -104); g.lineTo(8, -60); g.closePath(); fillStroke(g, "#dfe8f0", 5); g.restore(); };
    CS.PROPS.syringe = (g, x, y, side) => { g.save(); g.translate(x, y - 20); g.rotate(side * -1.1); g.beginPath(); g.roundRect(-16, -110, 32, 110, 8); fillStroke(g, "#dff4ff", 5); g.fillStyle = "#8fd0ff"; g.fillRect(-10, -96, 20, 50);
      line(g, [0, -110, 0, -150], "#9aa6b2", 5); line(g, [0, 0, 0, 26], "#6a7480", 8); line(g, [-18, 26, 18, 26], "#6a7480", 8); g.restore(); };
    CS.PROPS.notebook = (g, x, y, side) => { g.save(); g.translate(x - side * 18, y - 50); g.rotate(side * .12); g.beginPath(); g.rect(-60, -70, 120, 140); fillStroke(g, "#f4ead2", 6); g.fillStyle = OL; for (let i = 0; i < 5; i++) g.fillRect(-42, -46 + i * 22, 84, 5); g.restore(); };

    // ---------- the cow (a new character card: 800 x 640 design canvas, faces right, .flip(true) faces left) ----------
    const drawCow = (g, st) => {
      const Wc = "#fbfaf6", Bk = "#2a2226", pink = "#f6a9b8", ph = (st.step || 0) * Math.PI * 2, walk = st.walk || 0;
      const bx = 330, by = 352 - Math.abs(Math.sin(ph)) * 8 * walk;
      // tail
      g.beginPath(); g.moveTo(bx - 228, by - 70); g.quadraticCurveTo(bx - 290 + Math.sin(st.tail || 0) * 30, by + 20, bx - 262, by + 130); g.strokeStyle = OL; g.lineWidth = 16; g.stroke(); g.strokeStyle = Wc; g.lineWidth = 7; g.stroke();
      g.beginPath(); g.ellipse(bx - 262, by + 140, 18, 28, .2, 0, 7); fillStroke(g, Bk, 6);
      // legs
      for (const [lx, ofs] of [[-170, 0], [-110, Math.PI], [120, Math.PI], [180, 0]]) { const sw = Math.sin(ph + ofs) * 20 * walk; limb(g, [bx + lx, by + 80, bx + lx + sw, 592], Wc, 40); g.beginPath(); g.roundRect(bx + lx + sw - 24, 584, 48, 36, 7); fillStroke(g, "#4a3a3a", 6); }
      // udder
      g.beginPath(); g.ellipse(bx - 40, by + 128, 62, 38, 0, 0, 7); fillStroke(g, pink, 6); for (const tx of [-70, -40, -10]) { g.beginPath(); g.roundRect(bx + tx - 7, by + 152, 14, 26, 6); fillStroke(g, pink, 5); }
      // body with patches
      const body = () => { g.beginPath(); g.ellipse(bx, by, 246, 142, 0, 0, 7); };
      body(); g.fillStyle = Wc; g.fill(); g.save(); body(); g.clip(); g.fillStyle = Bk;
      for (const [x, y, rx, ry, r] of [[-120, -60, 78, 58, .4], [40, 50, 88, 52, -.3], [160, -70, 56, 46, .8], [-210, 60, 50, 60, 0]]) { g.beginPath(); g.ellipse(bx + x, by + y, rx, ry, r, 0, 7); g.fill(); }
      celShade(g, bx - 246, by + 60, 492, 150, Wc, -.12); g.restore(); body(); g.strokeStyle = OL; g.lineWidth = 8; g.stroke();
      // head
      const hx = bx + 262, hy = by - 92 + (st.nod ? Math.sin(st.nod) * 10 : 0);
      g.save(); g.translate(hx, hy); g.rotate((st.tilt || 0) * .3);
      for (const s of [-1, 1]) { g.save(); g.translate(s * 88, -50); g.rotate(s * .5); g.beginPath(); g.ellipse(0, 0, 48, 22, 0, 0, 7); fillStroke(g, Wc, 6); g.beginPath(); g.ellipse(s * 4, 0, 30, 11, 0, 0, 7); g.fillStyle = pink; g.fill(); g.restore(); }
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 30, -92); g.quadraticCurveTo(s * 52, -140, s * 34, -150); g.quadraticCurveTo(s * 70, -138, s * 50, -88); g.closePath(); fillStroke(g, "#f2e6c8", 6); }
      const head = () => { g.beginPath(); g.ellipse(0, 0, 86, 104, 0, 0, 7); };
      head(); g.fillStyle = Wc; g.fill(); g.save(); head(); g.clip(); g.fillStyle = Bk; g.beginPath(); g.ellipse(48, -40, 52, 58, .3, 0, 7); g.fill(); g.restore(); head(); g.strokeStyle = OL; g.lineWidth = 8; g.stroke();
      if (st.hat === "nurse") { g.beginPath(); g.moveTo(-62, -78); g.lineTo(-48, -150); g.lineTo(48, -150); g.lineTo(62, -78); g.quadraticCurveTo(0, -60, -62, -78); fillStroke(g, "#ffffff", 6); g.fillStyle = "#e5383b"; g.fillRect(-9, -138, 18, 46); g.fillRect(-23, -124, 46, 18); }
      // muzzle
      g.beginPath(); g.ellipse(0, 66, 82, 56, 0, 0, 7); fillStroke(g, pink, 7);
      g.fillStyle = "#b8607a"; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(s * 30, 52, 12, 16, s * .3, 0, 7); g.fill(); }
      const moo = st.moo || 0;
      if (moo > .05) { g.beginPath(); g.ellipse(0, 100, 30, 8 + 22 * moo, 0, 0, 7); g.fillStyle = "#6a1f2e"; g.fill(); g.strokeStyle = OL; g.lineWidth = 6; g.stroke(); }
      else { g.strokeStyle = OL; g.lineWidth = 6; g.beginPath(); g.arc(0, 86, 26, Math.PI * .2, Math.PI * .8); g.stroke(); }
      // eyes
      const face = st.face || "norm", look = (st.look || 0) * 9;
      for (const s of [-1, 1]) {
        const ex = s * 36, ey = -18;
        const closed = st.blink > .5 || (face === "wink" && s === 1);
        g.strokeStyle = OL; g.lineWidth = 7; g.lineCap = "round";
        if (face === "happy" || closed) { g.beginPath(); face === "happy" && !closed ? g.arc(ex, ey + 8, 16, Math.PI * 1.15, Math.PI * 1.85) : g.arc(ex, ey - 4, 16, Math.PI * .15, Math.PI * .85); g.stroke(); continue; }
        const big = face === "shock" ? 1.35 : 1;
        g.beginPath(); g.ellipse(ex, ey, 20 * big, 25 * big, 0, 0, 7); g.fillStyle = "#fff"; g.fill(); g.lineWidth = 6; g.stroke();
        g.fillStyle = OL; g.beginPath(); g.arc(ex + look, ey + 4, 10, 0, 7); g.fill();
        if (face === "smug") { g.fillStyle = s === 1 ? "#2a2226" : "#fbfaf6"; g.fillRect(ex - 24, ey - 30, 48, 26); g.beginPath(); g.moveTo(ex - 22, ey - 4); g.lineTo(ex + 22, ey - 4); g.stroke(); }
      }
      g.restore();
    };
    S.mkCow = (parent) => { const c = CS.card({ cw: 800, ch: 640, h: 1.75, scale: 1.4, design: "cow", parent, blobW: 1.6, draw: drawCow }); c.pose = st => c.set(st); return c; };

    // ---------- germs (cards): body colour, face angry | grumpy | scared | dizzy | shock ----------
    const drawGerm = (g, st) => {
      const c = st.c || "#4a8ff0", cx = 250, cy = 280, r = 150, wob = st.wob || 0;
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + wob * .1; const x = cx + Math.cos(a) * (r + 22), y = cy + Math.sin(a) * (r + 22);
        line(g, [cx + Math.cos(a) * r * .9, cy + Math.sin(a) * r * .9, x, y], OL, 16); g.beginPath(); g.arc(x, y, 24, 0, 7); fillStroke(g, CS.shade(c, .25), 7); }
      g.beginPath(); for (let i = 0; i <= 40; i++) { const a = i / 40 * Math.PI * 2, k = 1 + Math.sin(a * 5 + wob) * .03; const x = cx + Math.cos(a) * r * k, y = cy + Math.sin(a) * r * k; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath();
      g.fillStyle = c; g.fill(); celShade(g, cx - r, cy + 30, r * 2, 160, c, -.18); g.strokeStyle = OL; g.lineWidth = 9; g.stroke();
      g.fillStyle = CS.shade(c, .35); for (const [x, y, rr] of [[-70, -60, 18], [60, 70, 14], [80, -40, 10]]) { g.beginPath(); g.arc(cx + x, cy + y, rr, 0, 7); g.fill(); }
      const f = st.face || "angry";
      for (const s of [-1, 1]) {
        const ex = cx + s * 46, ey = cy - 16;
        if (f === "dizzy") { g.strokeStyle = OL; g.lineWidth = 8; g.beginPath(); g.moveTo(ex - 16, ey - 16); g.lineTo(ex + 16, ey + 16); g.moveTo(ex + 16, ey - 16); g.lineTo(ex - 16, ey + 16); g.stroke(); continue; }
        const big = f === "shock" || f === "scared" ? 1.3 : 1;
        g.beginPath(); g.ellipse(ex, ey, 24 * big, 28 * big, 0, 0, 7); g.fillStyle = "#fff"; g.fill(); g.strokeStyle = OL; g.lineWidth = 6; g.stroke();
        g.fillStyle = OL; g.beginPath(); g.arc(ex + (st.look || 0) * 8, ey + 4, 11, 0, 7); g.fill();
        if (f === "angry" || f === "grumpy") { g.lineWidth = 10; g.beginPath(); g.moveTo(ex - s * 30, ey - (f === "angry" ? 46 : 38)); g.lineTo(ex + s * 22, ey - 26); g.stroke(); }
      }
      g.strokeStyle = OL; g.lineWidth = 8; g.beginPath();
      if (f === "angry") { g.moveTo(cx - 40, cy + 70); g.lineTo(cx - 20, cy + 56); g.lineTo(cx, cy + 70); g.lineTo(cx + 20, cy + 56); g.lineTo(cx + 40, cy + 70); g.stroke(); }
      else if (f === "shock" || f === "scared") { g.ellipse(cx, cy + 70, 22, 28, 0, 0, 7); g.fillStyle = "#6a1f2e"; g.fill(); g.stroke(); }
      else if (f === "dizzy") { g.moveTo(cx - 30, cy + 66); for (let i = 1; i <= 6; i++) g.lineTo(cx - 30 + i * 10, cy + 66 + (i % 2 ? -8 : 8)); g.stroke(); }
      else { g.arc(cx, cy + 92, 30, Math.PI * 1.2, Math.PI * 1.8); g.stroke(); }
    };
    const mkGerm = (h, parent) => { const c = CS.card({ cw: 500, ch: 520, h, scale: 1.4, design: "germ", parent, blob: false, draw: drawGerm }); c.pose = st => c.set(st); return c; };

    // ---------- our own cartoon print: a patient sprouting k little cows ----------
    const caric = (k) => { const c = document.createElement("canvas"); c.width = 700; c.height = 900; const g = c.getContext("2d");
      g.fillStyle = "#f6edd6"; g.fillRect(0, 0, 700, 900); g.strokeStyle = "#7a5a3a"; g.lineWidth = 6; g.strokeRect(20, 20, 660, 860);
      g.fillStyle = OL; g.font = "900 64px Georgia, serif"; g.textAlign = "center"; g.fillText("THE COW-POX!", 350, 110); g.font = "italic 30px Georgia, serif"; g.fillText("the shocking new cure", 350, 155);
      // patient
      g.lineCap = "round"; line(g, [350, 560, 290, 800], OL, 12); line(g, [350, 560, 410, 800], OL, 12);
      g.beginPath(); g.roundRect(270, 420, 160, 190, 30); fillStroke(g, "#5a7ab8", 8);
      line(g, [280, 450, 170, 380], OL, 12); line(g, [420, 450, 540, 520], OL, 12);
      g.beginPath(); g.arc(350, 330, 100, 0, 7); fillStroke(g, "#ffffff", 8);
      g.fillStyle = OL; for (const s of [-1, 1]) { g.beginPath(); g.arc(350 + s * 34, 320, 13, 0, 7); g.fill(); }
      g.beginPath(); g.ellipse(350, 372, 18, 24, 0, 0, 7); g.fillStyle = "#6a1f2e"; g.fill(); g.lineWidth = 6; g.stroke();
      const mini = (x, y, s) => { g.save(); g.translate(x, y); g.scale(s, s); for (const q of [-1, 1]) { g.beginPath(); g.moveTo(q * 22, -40); g.lineTo(q * 36, -66); g.lineTo(q * 40, -36); g.closePath(); fillStroke(g, "#f2e6c8", 5); }
        g.beginPath(); g.ellipse(0, 0, 44, 50, 0, 0, 7); fillStroke(g, "#fbfaf6", 6); g.fillStyle = "#2a2226"; g.beginPath(); g.ellipse(18, -14, 18, 22, .3, 0, 7); g.fill();
        g.beginPath(); g.ellipse(0, 28, 34, 22, 0, 0, 7); fillStroke(g, "#f6a9b8", 5); g.fillStyle = OL; for (const q of [-1, 1]) { g.beginPath(); g.arc(q * 16, -8, 6, 0, 7); g.fill(); } g.restore(); };
      const spots = [[170, 370, .9], [445, 215, 1.0], [560, 530, .85], [250, 230, .8]];
      for (let i = 0; i < Math.min(k, spots.length); i++) { const [x, y, s] = spots[i]; line(g, [x + (350 - x) * .25, y + (420 - y) * .25, x, y], OL, 8); mini(x, y, s); }
      return c; };
    S.carics = [0, 1, 2, 3, 4].map(caric);

    // ---------- cast looks ----------
    const doctor = { hair: { style: "side", color: "#6a4a2e" }, top: { type: "coat", color: "#2f7a4a", vest: "#f2c85a", shirt: "#ffffff" }, pants: "#3a2e2a" };
    const boy = { hair: { style: "curly", color: "#c8642e" }, top: { type: "shirt", color: "#f4f6fa" }, pants: "#7a5a3a", size: .64 };
    const maid = { hair: { style: "bun", color: "#8a4a2a" }, top: { type: "dress", color: "#e88aa8", apron: "#ffffff" } };
    const expert = (coat, o = {}) => Object.assign({ hair: { style: "wig", color: "#f2f0ea" }, top: { type: "coat", color: coat, vest: o.vest || "#e8d6a0" } }, o);
    const exSpecs = [expert("#6a3f8a", { monocle: true }), expert("#2a3a5a", { glasses: true }), expert("#8a2f3a", { mustache: "handlebar", mustacheColor: "#d8d4cc" }), expert("#3a5a3a", { hat: { type: "tricorn", color: "#1d1d24" } })];
    const folk = (i) => ({ hair: { style: ["short", "bun", "curly", "side", "long", "tufts"][i % 6], color: ["#3a2a20", "#8a4a2a", "#1d1d24", "#c8642e", "#5a3a26"][i % 5] },
      hat: i % 4 === 1 ? { type: "flat", color: "#5a6a7a" } : i % 4 === 3 ? { type: "straw", color: "#e2b84a" } : undefined,
      top: { type: i % 3 === 1 ? "dress" : "shirt", color: ["#e6735a", "#6fb3d8", "#f2c85a", "#8fcf8a", "#c89ad8", "#f4efe6"][i % 6], apron: i % 3 === 1 ? "#f4efe6" : undefined }, pants: "#4a3a3a", size: i === 6 ? .7 : 1 });
    const soldier = { hat: { type: "helmet", color: "#e8eef6" }, top: { type: "uniform", color: "#f4f6fa", trim: "#5aa0e0" }, pants: "#dfe6ee" };

    // ================= FARM =================
    let G = CS.set("farm");
    Wd.ground([300, 300], Wd.painted("grass", "#7cc85a"), G, { tile: 4 });
    Wd.ground([2.2, 40], Wd.painted("dirt", "#c8a070"), G, { tile: 2, z: 4, y: .01 });
    Wd.house({ w: 5, d: 5, h: 3.6, wall: "#c23a3a", roof: "#5a3a2a", windows: 0, doorColor: "#f4efe6" }, [-5.6, 0, -8], G);
    Wd.house({ w: 4, d: 4, h: 3, wall: "#f4efe6", roof: "#7a3a3a", windows: 2 }, [5.2, 0, -10], G);
    Wd.fence([-8, -3.2], [8, -3.2], G);
    Wd.hay([3.4, .6, -5.2], G); Wd.hay([-2.8, .6, -6.6], G);
    for (let i = 0; i < 7; i++) Wd.tree(i % 3 ? "round" : "pine", 4 + R(i) * 3, [-16 + i * 5.4, 0, -18 - R(i + 2) * 8], G, i);
    Wd.hill(30, "#5cb04a", [-20, 0, -60], G, { squash: .35 }); Wd.hill(36, "#6cbf4a", [30, 0, -70], G, { squash: .3 });
    Wd.clouds(10, 160, 50, 2, G, { cz: -90, size: 30 });
    Wd.tufts(60, [-8, -12, 8, 2], { colour: "#5cb04a", h: .3 }, 4, null, G);
    S.vboard = Wd.board("VACCA\n= COW", { w: 1.5, h: 1.15, head: "#ffd23a" }, G); S.vboard.position.set(-2.4, 1.0, -3.0);
    for (const s of [-1, 1]) Wd.box(.1, 1.0, .1, CS.mat("#7a4a2a"), [-2.4 + s * .7, 0, -3.05], G);
    S.stool = Wd.box(.5, .32, .4, Wd.painted("planks", "#a8743f"), [.45, 0, .1], G);
    S.bucket = Wd.cyl(.17, .13, .3, CS.mat("#9aa6b2", { tex: "metal", texOpt: { color: "#9aa6b2" } }), [.2, 0, -1.1], G);
    S.cow = S.mkCow(G);
    S.doc = P(doctor, G); S.boy = P(boy, G); S.maid = P(maid, G);

    // ================= VILLAGE (dusk) + STREET (day) share one square =================
    G = CS.set("village");
    const sq = new THREE.Group(); G.add(sq);
    Wd.ground([300, 300], Wd.painted("stone", "#b8b0a8"), sq, { tile: 3 });
    const hc = ["#e6735a", "#f2c85a", "#6fb3d8", "#f4efe6", "#8fcf8a", "#e88aa8"];
    for (let i = -3; i <= 3; i++) Wd.house({ w: 4, d: 4, h: 4.6 + (i % 2 ? .8 : 0), wall: hc[(i + 3) % 6], roof: i % 2 ? "#3f4f7a" : "#7a3a3a", windows: 2 }, [i * 4.3, 0, -8], sq);
    Wd.lamp([-2.6, 0, -3.6], sq); Wd.lamp([3.2, 0, -4.2], sq);
    Wd.clouds(8, 160, 60, 5, sq, { cz: -80, size: 34 });
    S.ten = [...Array(10)].map((_, i) => P(folk(i), G));
    // street = the same square by day, with a notice board
    const G2 = CS.set("street"); G2.add(sq.clone());
    for (const s of [-1, 1]) Wd.box(.12, 2.6, .12, CS.mat("#7a4a2a"), [.95 + s * .85, 0, -2.3], G2);
    Wd.roof(2.2, .5, .35, CS.mat("#7a3a3a", { tex: "roof", texOpt: { color: "#7a3a3a" } }), [.95, 2.6, -2.3], G2);
    S.print = Wd.frame(1.25, 1.6, S.carics[0], { color: "#8a5a33" }, G2); S.print.position.set(.95, .85 + .8, -2.25);
    S.laughers = [P(folk(0), G2), P(folk(4), G2), P(folk(3), G2)];

    // ================= STUDY =================
    G = CS.set("study");
    Wd.room({ w: 9, d: 7, h: 4.2, wall: "#e8c27a", wallTex: "wallpaper", wain: "#6a4a3a", floor: "#c8955a", floorTex: "planks", floorOpt: { n: 6 }, windows: [2.6], winW: 1.4, winH: 2.1, sconces: [.4] }, G);
    S.board = Wd.board("COWPOX\n≈ SMALLPOX", { w: 2.1, h: 1.4, head: "#8fe0ff" }, G); S.board.position.set(-1.7, 1.35, -3.35);
    for (let i = 0; i < 3; i++) { Wd.box(1.4, .06, .35, CS.mat("#7a4a2a"), [2.9, 1.2 + i * .55, -3.3], G); for (let j = 0; j < 5; j++) Wd.box(.14, .38, .26, CS.mat(["#8a2e3a", "#2f6a8a", "#e8b93c", "#3a7a4a"][(i + j) % 4]), [2.4 + j * .24, 1.23 + i * .55, -3.3], G); }
    Wd.box(1.4, .78, .7, Wd.painted("planks", "#8a5a33"), [-.95, 0, -1.5], G);
    S.jar = new THREE.Group(); S.jar.position.set(-.95, .78, -1.3); G.add(S.jar);
    Wd.cyl(.17, .17, .42, CS.mat("#bfe8c8"), [0, 0, 0], S.jar, { seg: 18 }); Wd.cyl(.19, .19, .07, CS.mat("#8a5a33"), [0, .42, 0], S.jar, { seg: 18 });
    for (let i = 0; i < 5; i++) Wd.ball(.045, CS.mat("#e5383b"), [Math.sin(i * 2.3) * .1, .1 + i * .06, -.06], S.jar);
    const lab = Wd.textPanel("SMALLPOX", { w: .36, h: .12, bg: "#f6edd6", fg: "#c23a3a" }); lab.position.set(0, .24, .175); S.jar.add(lab);
    S.glow = Wd.cyl(.165, .165, .3, CS.mat("#7aff8a", { emissive: "#4aff6a", emissiveI: .9 }), [0, .03, 0], S.jar, { seg: 18 }); S.glow.userData.ink = "none";
    S.boyStool = Wd.box(.5, .32, .4, Wd.painted("planks", "#a8743f"), [.45, 0, -.4], G);
    S.doc2 = P(doctor, G); S.boy2 = P(boy, G);

    // ================= HALL =================
    G = CS.set("hall");
    Wd.room({ w: 10, d: 8, h: 4.8, wall: "#2f8f8a", wallTex: "stripes", wain: "#6a3f2a", floor: "#f4ecd8", floor2: "#2f6f6a", windows: [-3.4, 3.4], sconces: [-1.8, 1.8], winH: 2.4 }, G);
    Wd.box(3.8, .9, 1.3, CS.mat("#2f6a3a"), [0, 0, -1.25], G); Wd.box(4.0, .08, 1.45, CS.mat("#e8c048"), [0, .86, -1.25], G);
    S.ex = exSpecs.map((sp, i) => P(sp, G).at(-1.2 + i * .8, 0, -2.0 - (i % 2) * .15));
    S.paper = Wd.box(.42, .02, .55, CS.mat("#fbf7ec"), [0, .94, -.85], G);
    S.stamp = Wd.textPanel("REJECTED", { w: 1.9, h: .6, bg: "#ffffff", fg: "#e5383b", border: true }); S.stamp.position.set(-.05, 2.05, -.3); G.add(S.stamp);
    S.doc3 = P(doctor, G);

    // ================= BODY (inside) =================
    G = CS.set("body");
    Wd.ground([200, 200], CS.mat("#ff9fb4", { tex: "flat", texOpt: { color: "#ff9fb4" } }), G, { tile: 4 });
    Wd.box(60, 30, .4, CS.mat("#e8607e"), [0, 0, -9], G);
    S.cells = [...Array(16)].map((_, i) => { const c = Wd.cyl(.42, .42, .16, CS.mat("#e5383b"), [-7 + R(i) * 14, .6 + R(i + 4) * 3.6, -7.5 + R(i + 9) * 3.5], G, { seg: 20 }); c.rotation.set(R(i) * 3, 0, R(i + 1) * 3); return c; });
    S.gBlue = mkGerm(1.05, G); S.gRed = mkGerm(1.55, G);
    S.lBlue = Wd.textPanel("COWPOX", { w: .86, h: .26, bg: "#ffffff", fg: "#2f6fd8" }); G.add(S.lBlue);
    S.lRed = Wd.textPanel("SMALLPOX", { w: 1.0, h: .26, bg: "#ffffff", fg: "#c23a3a" }); G.add(S.lRed);
    S.sold = [P(soldier, G), P(soldier, G), P(soldier, G)];

    // ================= SPACE =================
    G = CS.set("space");
    S.globe = Wd.globe(3, {}, G);
    S.sunS = Wd.ball(8, CS.mat("#fff2a0", { emissive: "#ffe070", emissiveI: 2.2 }), [60, 20, -120], G); S.sunS.userData.ink = "none";

    // ================= CLINIC (today) =================
    G = CS.set("clinic");
    Wd.room({ w: 9, d: 7, h: 4.2, wall: "#d8f0f4", wallTex: "plaster", wain: "#7fc8d8", floor: "#f2f6f8", floorTex: "tiles", windows: [2.7], winW: 1.4, winH: 2.0 }, G);
    const poster = Wd.textPanel("VACCINES\nSAVE LIVES", { w: 1.3, h: 1.0, bg: "#ffffff", fg: "#2f6fa8" }); poster.position.set(.15, 2.75, -3.45); G.add(poster);
    Wd.box(1.8, .55, .8, CS.mat("#7fc8d8"), [-1.9, 0, -2.3], G); Wd.box(1.8, .12, .8, CS.mat("#ffffff"), [-1.9, .55, -2.3], G);
    S.nurse = P({ hair: { style: "bun", color: "#2a1d1a" }, hat: { type: "nurse" }, top: { type: "dress", color: "#ffffff", apron: "#e8f4ff" } }, G);
    S.girl = P({ hair: { style: "long", color: "#3a2a20" }, top: { type: "shirt", color: "#ff5f8a" }, pants: "#2f3f6a", size: .8 }, G);
    S.cowN = S.mkCow(G);

    // ---------- effects ----------
    S.fx = [];
    S.fx.push(CS.pop("!", [.62, 1.62, .3], Wt.arm - .05, Wt.back - .1, { size: .42 }));
    S.puffAt = [2, 5, 8];
    S.tenPos = i => { const row = i < 5 ? 0 : 1; return [(i % 5 - 2) * .78 + (row ? .38 : 0), row ? -2.3 : -.9]; };
    S.puffAt.forEach((k, i) => { const [x, z] = S.tenPos(k); S.fx.push(CS.burst("smoke", [x, 1.0, z], Wt.three + .05 + i * .25, { n: 8, size: .9, spread: .5, up: .8, gravity: .2, seed: 3 + i, dur: 1.0, parent: CS.set("village") })); });
    S.fx.push(CS.burst("star", [.55, .55, -.6], Wt.never, { n: 9, size: .13, spread: 1.1, up: .8, gravity: .3, seed: 6, dur: 1.2, colors: ["#ffe27a", "#fff6c0"], parent: CS.set("farm") }));
    S.fx.push(CS.pop("?", [.45, 1.75, -.2], Wt.nothing, Wt.sci - .1, { size: .55 }));
    S.fx.push(CS.burst("star", [.45, .7, -.3], Wt.happened, { n: 8, size: .12, spread: 1.0, up: .9, gravity: .4, seed: 7, dur: 1.2, colors: ["#ffe27a", "#fff6c0"], parent: CS.set("study") }));
    S.fx.push(CS.burst("star", [-1.0, 1.0, .1], Wt.weak + .1, { n: 10, size: .2, spread: .7, up: 1.2, gravity: 1.2, seed: 8, dur: 1.0, colors: ["#ffe27a"], parent: CS.set("body") }));
    S.fx.push(CS.pop("bang", [-1.05, 1.5, .3], Wt.weak + .08, Wt.body - .05, { size: 1.0, o: { text: "BONK!" } }));
    S.fx.push(CS.pop("!", [1.25, 2.1, -.2], Wt.remembers + .1, Wt.by - .1, { size: .5 }));
    S.fx.push(CS.burst("confetti", [0, 2.4, 3.5], Wt.gone, { n: 30, size: .22, spread: 2.6, up: 2.4, gravity: 2.4, seed: 9, dur: 1.8, parent: CS.set("space") }));
    S.fx.push(CS.burst("heart", [.95, 1.55, -1.6], Wt.trick + .5, { n: 5, size: .2, spread: .4, up: .8, gravity: -.1, seed: 10, dur: 1.6, parent: CS.set("farm") }));
    S.fx.push(CS.burst("star", [.45, 1.9, -1], Wt.lastcow, { n: 10, size: .14, spread: .6, up: .7, gravity: .2, seed: 12, dur: 1.2, colors: ["#ffe27a", "#fff6c0"], parent: CS.set("clinic") }));
    // overlay
    CS.title("3 IN 10", Wt.people - .05, Wt.but - .12, { size: 210 });
    CS.title("WEEKS LATER", Wt.weeks - .05, Wt.gave - .12, { size: 140, sub: "the real test…" });
    CS.title("1980", Wt.y1980 - .05, Wt.gone - .05, { size: 230 });
  },

  frame(t, T) {
    const S = this, Wt = S.W, sm = CS.ease.smooth, back = CS.ease.back, seg = CS.seg, b = (x, s) => CS.blinkAt(x, s);
    const sh = S.plan.apply(t), id = sh.shot.id, set = sh.shot.set, L = sh.local;
    const live = (c, s, o) => CS.alive(c, t, s, o);
    const talk = (on) => on ? Math.round(t * 7) % 2 : 0;
    if (set === "farm") {
      const hook = id === "hook" || id === "cowcu" || id === "boycu";
      S.stool.visible = hook; S.bucket.visible = id === "milk" || id === "milkcu" || id === "proud";
      S.doc.show(hook || id === "milk" || id === "pat"); S.boy.show(hook); S.maid.show(id === "milk" || id === "milkcu" || id === "proud");
      if (hook) {
        const reach = id === "boycu" ? sm(seg(t, Wt.into, Wt.arm)) : 0;
        S.doc.at(-.32, 0, .35).pose({ face: id === "boycu" ? "determined" : "happy", arms: ["hip", id === "boycu" ? [70 + reach * 20, 40] : [125, 35]], prop: { kind: "lancet", hand: "R" }, blink: b(t, 1), look: .6, lookY: .5 }); live(S.doc, 1);
        S.boy.at(.45, .32, .1).pose({ face: t > Wt.arm - .1 ? "shock" : "worried", arms: [t > Wt.arm - .1 ? "up" : "hang", "hang"], blink: b(t, 2), look: -.6 }); live(S.boy, 2);
        S.cow.flip(true).at(.75, 0, -2.75).pose({ face: id === "cowcu" ? "happy" : "norm", moo: id === "cowcu" ? Math.max(0, Math.sin(seg(t, Wt.disease + .55, Wt.disease + 1.05) * Math.PI)) : 0, look: -.5, blink: b(t, 3), tail: t * 3, nod: id === "cowcu" ? t * 6 : 0 }); live(S.cow, 3);
      } else if (id === "milk" || id === "milkcu" || id === "proud") {
        S.cow.flip(true).at(-.1, 0, -2.1).pose({ face: id === "milkcu" ? "happy" : "norm", moo: id === "milkcu" ? Math.max(0, Math.sin(seg(t, Wt.acow + .35, Wt.acow + .85) * Math.PI)) : 0, blink: b(t, 3), tail: t * 3, look: .4 }); live(S.cow, 3);
        S.maid.at(.55, 0, -1.25).pose({ face: id === "proud" ? "proud" : "happy", arms: id === "proud" ? ["hip", "hip"] : id === "milkcu" ? ["hang", "up"] : ["reach", "point"], talk: talk(id !== "proud" && t < Wt.touched + .3), blink: b(t, 4), look: -.6 }); live(S.maid, 4);
        S.doc.at(-1.25, 0, .25).pose({ face: "awe", arms: ["hold", "hang"], prop: { kind: "notebook", hand: "L" }, blink: b(t, 1), look: .7 }); live(S.doc, 1);
      } else {
        S.cow.flip(true).at(id === "pat" ? .9 : -.95, 0, id === "pat" ? -1.8 : -2.1).pose({ face: id === "vacca" && t > Wt.forcow - .1 ? "happy" : id === "pat" ? "happy" : "norm", moo: id === "vacca" ? Math.max(0, Math.sin(seg(t, Wt.forcow + .3, Wt.forcow + .8) * Math.PI)) : 0, blink: b(t, 3), tail: t * 3, nod: id === "vacca" ? t * 5 : 0, look: id === "vacca" ? .6 : -.4 }); live(S.cow, 3);
        if (id === "pat") S.doc.at(-.35, 0, -1.2).pose({ face: "joy", arms: ["hang", "reach"], blink: b(t, 1), look: .7 }); live(S.doc, 1);
      }
      S.vboard.write("VACCA\n= COW", id === "vacca" ? seg(t, Wt.vacca - .05, Wt.latin + .5) : 0);
    }
    if (set === "village") {
      S.ten.forEach((c, i) => {
        const gone = S.puffAt.includes(i) && t > Wt.three + .15 + S.puffAt.indexOf(i) * .25;
        const [x, z] = S.tenPos(i);
        c.show(!gone).at(x, 0, z).pose({ face: t > Wt.three ? "worried" : "sad", arms: ["hang", "hang"], blink: b(t, 40 + i), look: CS.noise1(t * .3, i) }); live(c, 40 + i);
      });
    }
    if (set === "street") {
      const k = id === "print" ? Math.min(4, Math.floor(seg(t, Wt.sprouting - .05, Wt.science - .2) * 5)) : 0; S.print.setImage(S.carics[k]);
      S.laughers.forEach((c, i) => {
        c.at([-.35, -1.1, .3][i], 0, [-.7, -1.4, .2][i]).pose({ face: i === 2 ? "joy" : "laugh", arms: i === 0 ? ["hold", "point"] : i === 1 ? ["cheek", "cheek"] : ["hip", "hip"], prop: i === 0 ? { kind: "newspaper", hand: "L", text: "COW-POX!" } : null, blink: b(t, 50 + i), look: .7 });
        live(c, 50 + i, { bob: 4, sway: 2 });
      });
    }
    if (set === "study") {
      S.glow.scale.y = .8 + Math.sin(t * 6) * .15; S.glow.visible = id === "jar" || id === "study";
      S.board.write("COWPOX\n≈ SMALLPOX", id === "board" ? seg(t, Wt.science + .05, Wt.exactly) : 1);
      const fine = id === "fine";
      S.boy2.at(.45, .32, -.4).pose({ face: fine ? (t > Wt.happened ? "joy" : "neutral") : "worried", arms: fine && t > Wt.nothing ? ["shrug", "shrug"] : ["hang", "hang"], blink: b(t, 2), look: -.6 }); live(S.boy2, 2);
      if (id === "board") S.doc2.at(-.72, 0, -2.4).pose({ face: "determined", arms: ["point", "hang"], prop: { kind: "chalk", hand: "R" }, blink: b(t, 1), look: -.7 });
      else if (fine) S.doc2.at(-.35, 0, .1).pose({ face: t > Wt.nothing ? "awe" : "worried", arms: ["hang", "hang"], blink: b(t, 1), look: .6 });
      else S.doc2.at(-.35, 0, .2).pose({ face: "determined", arms: ["hang", "point"], blink: b(t, 1), look: .6 });
      live(S.doc2, 1);
    }
    if (set === "hall") {
      const k = back(seg(t, Wt.refused - .05, Wt.refused + .3));
      S.stamp.scale.setScalar(.001 + k); S.stamp.rotation.z = -.12; S.stamp.visible = t > Wt.refused - .1;
      S.ex.forEach((c, i) => { c.pose({ face: t > Wt.refused ? (i === 0 ? "smug" : "stern") : "bored", arms: t > Wt.refused ? ["hip", i === 0 ? "point" : "hang"] : ["hold", "hold"], look: i < 2 ? .5 : -.5, blink: b(t, 10 + i) }); live(c, 10 + i); });
      S.doc3.at(-1.25, 0, .7).pose({ face: t > Wt.refused ? "sad" : "hopeful" in CS.FACES ? "hopeful" : "happy", arms: ["hang", t > Wt.refused ? "hang" : "reach"], blink: b(t, 1), look: .5 }); live(S.doc3, 1);
    }
    if (set === "body") {
      S.cells.forEach((c, i) => { c.rotation.y = t * (.3 + (i % 3) * .2); c.position.y += Math.sin(t * 1.3 + i) * .002; });
      const bonk = id === "bonk", wanted = id === "wanted";
      const shrink = bonk ? sm(seg(t, Wt.weak + .1, Wt.body - .2)) : 0;
      S.gBlue.show(id === "germs" || bonk).at(bonk ? -.95 : -.62, .55 + Math.sin(t * 2) * .06, 0).pose({ c: "#4a8ff0", face: bonk && t > Wt.weak + .08 ? "dizzy" : "grumpy", wob: Math.round(t * 6) / 2, look: .5 });
      S.gBlue.group.scale.setScalar(1 - shrink * .55);
      const redIn = wanted ? sm(seg(t, Wt.remembers - .3, Wt.remembers + .2)) : 1;
      S.gRed.show(id === "germs" || wanted).at(wanted ? 2.2 - redIn * 1.05 : .62, .45 + Math.sin(t * 1.7) * .07, wanted ? -.6 : 0).pose({ c: "#e5484d", face: wanted && t > Wt.remembers + .15 ? "shock" : "angry", wob: Math.round(t * 6) / 2, look: -.5 });
      S.lBlue.visible = id === "germs"; S.lRed.visible = id === "germs";
      S.lBlue.position.set(-.62, 1.78, .3); S.lRed.position.set(.62, 2.3, .3);
      const lk = back(seg(t, Wt.cowpox2 + .1, Wt.cowpox2 + .5)); S.lBlue.scale.setScalar(.001 + lk); S.lRed.scale.setScalar(.001 + back(seg(t, Wt.exactly - .3, Wt.exactly + .1)));
      S.sold.forEach((c, i) => {
        c.show(bonk || wanted);
        if (bonk) c.at([-.35, -1.6, -.9][i], 0, [.3, .1, -.8][i]).pose({ face: "determined", arms: i === 0 ? [t > Wt.weak ? "point" : "up", "fist"] : ["fist", "fist"], blink: b(t, 60 + i), look: i === 1 ? .7 : -.6 });
        else c.at([-.35, -1.0, .45][i], 0, [.2, -.7, -1.0][i]).pose({ face: t > Wt.remembers + .15 ? "smug" : "proud", arms: i === 0 ? ["hang", "hold"] : i === 1 ? ["hip", "point"] : ["salute", "hang"], prop: i === 0 ? { kind: "sign", hand: "R", text: "WANTED", color: "#f6edd6" } : null, blink: b(t, 60 + i), look: .7 });
        live(c, 60 + i);
      });
    }
    if (set === "space") { S.globe.spin.rotation.y = t * .5; }
    if (set === "clinic") {
      const cn = id === "cownurse";
      S.nurse.show(!cn); S.cowN.show(cn);
      S.nurse.at(-.5, 0, -1.0).pose({ face: "happy", arms: ["hang", [80, 30]], prop: { kind: "syringe", hand: "R" }, blink: b(t, 70), look: .6 }); live(S.nurse, 70);
      S.girl.at(.7, 0, -.9).pose({ face: cn ? "shock" : t > Wt.vaccine + .5 ? "determined" : "worried", arms: cn ? ["up", "cheek"] : ["hang", "hip"], blink: b(t, 71), look: -.6 }); live(S.girl, 71);
      S.cowN.flip(false).at(-.65, 0, -1.25).pose({ face: t > Wt.lastcow - .05 ? "wink" : "smug", hat: "nurse", moo: Math.max(0, Math.sin(seg(t, Wt.lastcow + .35, Wt.lastcow + 1.0) * Math.PI)), blink: 0, tail: t * 3, look: .6 }); live(S.cowN, 72);
    }
    for (const f of S.fx) f.update(t);
  },

  sound(A, T) {
    const S = this; S.init(T); const Wt = S.W;
    A.music({ bpm: 108, key: 60, sections: [{ at: 0, style: "whimsy" }, { at: Wt.back - .2, style: "tense" }, { at: Wt.but - .1, style: "folk" }, { at: Wt.so - .2, style: "tense" },
      { at: Wt.and1 - .1, style: "stop" }, { at: Wt.happened + .5, style: "whimsy" }, { at: Wt.sci - .1, style: "sneak" }, { at: Wt.science - .1, style: "drone" },
      { at: Wt.beat - .1, style: "march" }, { at: Wt.by - .1, style: "whimsy" }, { at: Wt.is - .3, style: "stop" }] });
    S.plan.cutSounds(A, ["whoosh", "swish"], .42);
    A.sfx("moo", Wt.disease + .55, .5, { dur: 1.1 }); A.sfx("pop", Wt.arm - .05, .5); A.sfx("gasp", Wt.arm + .05, .3, { dur: 1 });
    A.sfx("wind", Wt.back - .1, .35, { dur: 4 }); [0, .25, .5].forEach(d => A.sfx("pop", Wt.three + .1 + d, .45)); A.sfx("murmur", Wt.three + .7, .35, { dur: 2 });
    A.sfx("birds", Wt.but, .3, { dur: 2.5 }); A.sfx("moo", Wt.acow + .35, .4, { dur: .9, rate: 1.1 }); A.sfx("magic", Wt.never - .05, .45); A.sfx("ting", Wt.touched, .35);
    A.sfx("drumroll", Wt.gave + .1, .35, { dur: 1.6 }); A.sfx("sting", Wt.real, .4);
    A.sfx("boing", Wt.nothing + .02, .45); A.sfx("ooh", Wt.happened, .55, { dur: 1.6 });
    A.sfx("murmur", Wt.sci, .4, { dur: 1.5 }); A.sfx("thunk", Wt.refused + .05, .8); A.sfx("slidedown", Wt.paper, .3);
    A.sfx("laugh", Wt.cartoons + .1, .55, { dur: 2.4 }); A.sfx("paper", Wt.cartoons + .3, .35);
    [0, .28, .56, .84].forEach((d, i) => A.sfx("pop", Wt.sprouting + d, .45)); A.sfx("laugh2", Wt.cows + .2, .5, { dur: 1.4 }); A.sfx("moo", Wt.cows + .45, .3, { dur: .8, rate: 1.25 });
    A.sfx("paper", Wt.science + .1, .35); for (let i = 0; i < 8; i++) A.sfx("click", Wt.science + .3 + i * .14, .22);
    A.sfx("pop", Wt.cowpox2 + .1, .45); A.sfx("pop", Wt.exactly - .3, .45); A.sfx("boing", Wt.exactly + .2, .3);
    A.sfx("hit", Wt.weak + .08, .7); A.sfx("bang", Wt.weak + .1, .35); A.sfx("slidedown", Wt.weak + .4, .3);
    A.sfx("paper", Wt.body + .1, .35); A.sfx("gasp", Wt.remembers + .15, .4, { dur: .9 }); A.sfx("sting", Wt.remembers + .2, .3);
    A.sfx("slideup", Wt.by, .3); A.sfx("cheer", Wt.gone, .55, { dur: 1.8 }); A.sfx("bell", Wt.planet, .3);
    A.sfx("birds", Wt.trick, .3, { dur: 2 }); A.sfx("magic", Wt.trick + .5, .35);
    A.sfx("ting", Wt.vacca, .45); for (let i = 0; i < 6; i++) A.sfx("click", Wt.vacca + .1 + i * .14, .2); A.sfx("moo", Wt.forcow + .3, .55, { dur: 1.0 });
    A.sfx("click", Wt.vaccine, .4); A.sfx("tick", Wt.had, .3, { n: 2, gap: .3 });
    A.sfx("sting", Wt.lastcow - .02, .6); A.sfx("moo2", Wt.lastcow + .35, .6, { dur: 1.6 });
  },
};
