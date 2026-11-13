/* The Map Nobody Believed: demo short for the Science Story Shorts kit (Alfred Wegener and continental drift).
   THE SIX BEATS: weird action (a weatherman sees a jigsaw in the world map) → the clue (South America fits Africa; same
   fossils, same rocks) → the idea (continents move) → the laugh (geologists) → they look right (he can't say what pushes them;
   dies on the ice, still a joke) → the payoff (decades later: a giant crack down the ocean floor) → the science (hot rock rises
   and spreads; continents ride on top) → arguable last line (you're moving too, as fast as your fingernails grow).
   FACTS: Alfred Wegener (1880-1930) was a meteorologist. He presented continental drift in January 1912 (book 1915). Evidence:
   the fit of South America and Africa, matching fossils (Mesosaurus, Glossopteris) and matching rock layers on both sides of
   the Atlantic. He could not give a believable force, and most geologists rejected and mocked the idea (1926 New York symposium).
   He died in November 1930 on the Greenland ice sheet. In the 1950s ocean-floor mapping (Marie Tharp and Bruce Heezen) showed
   the Mid-Atlantic Ridge with a rift valley down its middle; in the 1960s seafloor spreading and plate tectonics proved him
   right. Magma rises at mid-ocean ridges and makes new sea floor that spreads outward. The Atlantic widens about 2.5 cm a year,
   about the speed fingernails grow.
   Dramatized: "saw a jigsaw puzzle" (he noted the fit on a map); our map shapes are simplified cartoons.
   Sources: earthobservatory.nasa.gov (Wegener) · usgs.gov (This Dynamic Earth: historical perspective, seafloor spreading) ·
   en.wikipedia.org/wiki/Alfred_Wegener · amnh.org (Marie Tharp)

   SHOT PLAN (18 shots, a cut every ~2.6 s, a sound on every cut)
    1 "In"            study   hook: the weatherman stares at a big world map, barometer on the wall, push in
    2 "map"           study   CU: the world map
    3 "and saw"       study   CU: dashed jigsaw lines draw around South America and Africa, sparkle
    4 "Look."         table   top-down: two cut-out pieces on a desk
    5 "slides"        table   the pieces slide together, click on "Africa"
    6 "The same"      table   CU: fossils light up on both sides, then the rock band lines up
    7 "His idea?"     study   finger up, "!", title "THEY'RE MOVING!"
    8 "Geologists"    hall    experts burst out laughing
    9 "Continents can't" hall CU: expert with an IMPOSSIBLE sign, pointing
   10 "He couldn't"   study   the weatherman shrugs, "?"
   11 "In 1930"       ice     Greenland blizzard, tent, he walks into the snow, title "1930"
   12 "still"         ice     wide: empty ice, the flag flaps, music stops
   13 "Decades"       sea     a survey ship on the ocean, title "DECADES LATER"
   14 "ships mapped"  deck    a scientist at a chart: the ocean-floor profile draws itself
   15 "found"         deck    CU: a giant crack in the middle of the ridge, red circle, "!"
   16 "Hot rock"      earth   cross-section: magma rises in the crack, plates spread, new floor fills in
   17 "The continents" earth  closer: tiny people on each continent wave bye as they drift apart
   18 "So right now"  home    a guy on his phone looks down at the floor, shocked; then shrugs at his hand on "grow" */
window.SHORT = {
  title: "The Map Nobody Believed", slug: "the-map-nobody-believed",
  script: `In nineteen twelve, a weatherman looked at a *map* of the world… and saw a *jigsaw* puzzle.
Look. South America… slides right into *Africa.*
The same *fossils* on both sides of the ocean. The same *rocks.*
His idea? The continents are *moving.*
Geologists *laughed.* Continents can't plow through *solid* rock!
He couldn't say what *pushed* them. In nineteen thirty, he died on the Greenland *ice…* still a *joke.*
Decades later, ships mapped the ocean *floor…* and found a giant *crack* down the middle.
Hot rock *rises* there and spreads out, pushing the ocean *apart.* The continents just *ride* on top.
So right now… you're *moving* too. About as fast as your *fingernails* grow.`,
  tail: 1.3,
  captions: { subs: { "nineteen twelve": "1912", "nineteen thirty": "1930" } },

  init(T) {
    if (this._T === T) return; this._T = T; const S = this;
    const w = (q, a = 0) => T.w(q, a);
    S.W = { weather: w("weatherman"), map: w("map"), and1: w("and saw"), jigsaw: w("jigsaw"), puzzle: w("puzzle"), look: w("look"), south: w("south america"), slides: w("slides"),
      africa: w("africa"), same: w("the same fossils"), fossils: w("fossils"), ocean: w("ocean"), same2: w("the same rocks"), rocks: w("rocks"), his: w("his idea"), cont: w("continents are"),
      moving: w("moving"), geo: w("geologists"), laughed: w("laughed"), cant: w("can't"), solid: w("solid"), he: w("he couldn't"), pushed: w("pushed"), y1930: w("nineteen thirty"),
      died: w("died"), ice: w("ice"), still: w("still"), joke: w("joke"), decades: w("decades"), ships: w("ships"), floor: w("floor"), found: w("found"), crack: w("crack"),
      middle: w("middle"), hot: w("hot rock"), rises: w("rises"), spreads: w("spreads"), apart: w("apart"), ride: w("ride"), top: w("top"), the3: w("the continents just"),
      so: w("so right"), now: w("now"), youre: w("you're"), moving2: w("moving", 43), about: w("about as"), fingernails: w("fingernails"), grow: w("grow") };
    const Wt = S.W;
    const v = (p, l, fov = 40, roll = 0) => ({ p, l, fov, roll });
    S.plan = CS.shots(T, [
      { at: 0, set: "study", light: "study", from: v([0, 1.8, 5.0], [.05, 1.6, -1]), to: v([0, 1.75, 4.2], [.05, 1.6, -1]), blur: .14, id: "hook" },
      { at: "map", set: "study", light: "study", from: v([.35, 2.25, 1.2], [.35, 2.25, -3.4], 40), to: v([.35, 2.25, .6], [.35, 2.25, -3.4], 40), blur: .05, id: "map" },
      { at: "and saw", set: "study", light: "study", from: v([.3, 2.2, 1.0], [.3, 2.2, -3.4], 40), to: v([.3, 2.2, .5], [.3, 2.2, -3.4], 40), blur: .05, id: "jig" },
      { at: "look", set: "table", light: "study", from: v([0, 4.2, .95], [0, .8, 0], 40, 0), to: v([0, 3.85, .8], [0, .8, 0], 40, 0), blur: .05, id: "table" },
      { at: "the same fossils", set: "table", light: "study", from: v([.0, 2.7, .6], [.0, .8, -.02], 40), to: v([.0, 2.45, .5], [.0, .8, -.02], 40), blur: .08, id: "fossil" },
      { at: "his idea", set: "study", light: "study", from: v([-.4, 1.65, 3.4], [-.4, 1.45, -.5]), to: v([-.4, 1.6, 2.8], [-.4, 1.45, -.5]), blur: .22, id: "idea" },
      { at: "geologists", set: "hall", light: "hall", from: v([0, 1.9, 5.2], [0, 1.45, -2]), to: v([0, 1.85, 4.2], [0, 1.45, -2]), blur: .12, id: "laugh" },
      { at: "continents can't", set: "hall", light: "hall", from: v([-1.35, 1.6, 1.5], [-1.35, 1.5, -2]), to: v([-1.35, 1.6, 1.1], [-1.35, 1.5, -2]), blur: .3, id: "sneer" },
      { at: "he couldn't", set: "study", light: "study", from: v([-.35, 1.6, 3.0], [-.35, 1.4, -.5]), to: v([-.35, 1.55, 2.4], [-.35, 1.4, -.5]), blur: .2, id: "shrug" },
      { at: "in nineteen thirty", set: "ice", light: "ice", from: v([0, 1.7, 6.5], [0, 1.3, -2]), to: v([0, 1.6, 5.6], [0, 1.3, -2]), blur: .05, id: "ice" },
      { at: "still", set: "ice", light: "ice", from: v([0, 3.0, 10], [0, 1.2, -4]), to: v([0, 3.2, 12], [0, 1.2, -4]), blur: 0, id: "empty" },
      { at: "decades", set: "sea", light: "bright", from: v([-14, 5, 30], [0, 3, 0], 40), to: v([-8, 4.5, 26], [2, 3, 0], 40), blur: 0, id: "ship" },
      { at: "ships", set: "deck", light: "bright", from: v([0, 1.75, 4.6], [.2, 1.5, -1]), to: v([0, 1.7, 3.8], [.2, 1.5, -1]), blur: .12, id: "chart" },
      { at: "found", set: "deck", light: "bright", from: v([.45, 1.62, 1.1], [.45, 1.55, -1.2], 40), to: v([.45, 1.6, .7], [.45, 1.55, -1.2], 40, 2), blur: .1, id: "crack" },
      { at: "hot rock", set: "earth", light: "earth", from: v([0, 3.7, 7.0], [0, .75, 0], 40), to: v([0, 3.4, 6.3], [0, .75, 0], 40), blur: 0, id: "spread" },
      { at: "the continents just", set: "earth", light: "earth", from: v([-.95, 1.85, 3.0], [-1.15, 1.45, .2], 40), to: v([-1.0, 1.8, 2.5], [-1.15, 1.45, .2], 40), blur: .05, id: "ride" },
      { at: "so right", set: "home", light: "home", from: v([0, 1.6, 4.4], [0, 1.25, -.5]), to: v([0, 1.55, 3.6], [0, 1.25, -.5]), blur: .15, id: "home" },
      { at: "about as", set: "home", light: "home", from: v([.1, 1.65, 2.3], [.1, 1.55, -.3]), to: v([.1, 1.62, 1.9], [.1, 1.55, -.3], 40, -2), blur: .25, id: "nails" },
    ]);
  },

  setup(T) {
    const S = this, Wd = CS.world, R = CS.rand, P = (spec, parent, o) => CS.person(Object.assign({ style: "round" }, spec), Object.assign({ parent }, o || {}));
    S.init(T); const Wt = S.W, { fillStroke, line } = CS.draw, OL = CS.INK;
    // ---------- looks ----------
    CS.LIGHTS.bright = Object.assign({}, CS.LIGHTS.day, { sat: 1.18, top: "#2f86e8", hor: "#cfeaff" });
    CS.LIGHTS.study = Object.assign({}, CS.LIGHTS.indoor, { sun: "#fff1dc", card: "#fffaf2", sat: 1.16, hemiI: 1.3 });
    CS.LIGHTS.hall = Object.assign({}, CS.LIGHTS.indoor, { sun: "#fff6e8", card: "#ffffff", sat: 1.14, gain: [1.02, 1.01, 1.0], hemiI: 1.35 });
    CS.LIGHTS.ice = Object.assign({}, CS.LIGHTS.day, { top: "#9ab4d4", hor: "#e8f0fa", fog: [10, 70], sunI: 1.5, sat: .9, card: "#eef4fc" });
    CS.LIGHTS.earth = Object.assign({}, CS.LIGHTS.indoor, { top: "#1d2a4a", hor: "#5a7ab8", fog: [40, 200], card: "#ffffff", sat: 1.2, hemiI: 1.25, sun: "#fff4e0" });
    CS.LIGHTS.home = Object.assign({}, CS.LIGHTS.dusk, { sat: 1.18, card: "#fff2ea", top: "#3a3f8a", hor: "#ff9a7a" });

    // ---------- the map: South America and Africa share one coastline (the seam), so the pieces really fit ----------
    const SEAM = [[400, 130], [430, 160], [440, 200], [425, 240], [410, 280], [400, 320], [395, 360]];
    const SAM = [[300, 140], [360, 120], ...SEAM, [370, 420], [340, 490], [318, 560], [300, 540], [298, 470], [284, 400], [260, 320], [250, 240], [265, 180]];
    const AFR = [[330, 60], [400, 35], [480, 25], [560, 45], [615, 90], [650, 150], [700, 165], [672, 215], [622, 290], [592, 370], [562, 440], [530, 500], [502, 482], [482, 420], ...SEAM.slice().reverse(), [362, 112], [332, 90]];
    const poly = (g, pts, dx = 0, dy = 0) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x + dx, y + dy) : g.moveTo(x + dx, y + dy)); g.closePath(); };
    const land = (g, pts, dx, dy, col = "#7cc85a") => { poly(g, pts, dx, dy); g.fillStyle = col; g.fill(); g.strokeStyle = "#3a6a2a"; g.lineWidth = 6; g.stroke(); };
    const fossil = (g, x, y, s = 1, on = 0) => { g.save(); g.translate(x, y); g.scale(s, s);
      if (on) { g.fillStyle = "rgba(255,226,90," + .75 * on + ")"; g.beginPath(); g.arc(0, 0, 44, 0, 7); g.fill(); }
      g.strokeStyle = "#f4efe2"; g.lineWidth = 6; g.lineCap = "round"; g.beginPath(); g.moveTo(-30, 0); g.quadraticCurveTo(0, -10, 26, 0); g.quadraticCurveTo(40, 8, 34, 18); g.stroke();
      for (const lx of [-16, 12]) { g.beginPath(); g.moveTo(lx, -4); g.lineTo(lx - 6, 14); g.moveTo(lx, -4); g.lineTo(lx + 6, -20); g.stroke(); } g.beginPath(); g.arc(-34, -2, 7, 0, 7); g.fillStyle = "#f4efe2"; g.fill(); g.restore(); };
    const band = (g, pts, on) => { g.save(); poly(g, pts); g.clip(); g.fillStyle = on ? "#ff8a2a" : "#c89a5a"; g.beginPath(); g.moveTo(240, 300); g.lineTo(700, 320); g.lineTo(700, 344); g.lineTo(240, 326); g.closePath(); g.fill(); g.restore(); };
    const piece = (pts, f = 0, r = 0) => CS.paint.canvasTex(800, 600, (g) => { g.clearRect(0, 0, 800, 600); land(g, pts, 0, 0, "#8fd06a"); band(g, pts, r); g.save(); poly(g, pts); g.clip();
      fossil(g, 372, 250, 1, f); fossil(g, 468, 258, 1, f); g.restore(); poly(g, pts); g.strokeStyle = "#ffffff"; g.setLineDash([16, 12]); g.lineWidth = 5; g.stroke(); });
    S.pieceTex = { sam: [0, 1].map(f => [0, 1].map(r => piece(SAM, f, r))), afr: [0, 1].map(f => [0, 1].map(r => piece(AFR, f, r))) };
    const worldMap = (k) => { const c = document.createElement("canvas"); c.width = 1600; c.height = 1000; const g = c.getContext("2d");
      g.fillStyle = "#6fb6e8"; g.fillRect(0, 0, 1600, 1000); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 3;
      for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(i * 200, 0); g.lineTo(i * 200, 1000); g.stroke(); } for (let j = 1; j < 5; j++) { g.beginPath(); g.moveTo(0, j * 200); g.lineTo(1600, j * 200); g.stroke(); }
      const blob = (pts, col) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = col || "#7cc85a"; g.fill(); g.strokeStyle = "#3a6a2a"; g.lineWidth = 6; g.stroke(); };
      blob([[160, 160], [420, 120], [560, 190], [520, 300], [430, 360], [390, 440], [330, 470], [300, 410], [230, 330], [150, 260]]);
      blob([[760, 170], [900, 130], [980, 200], [920, 290], [820, 300], [770, 250]]);
      blob([[980, 140], [1360, 120], [1500, 220], [1460, 380], [1320, 440], [1160, 460], [1040, 400], [980, 290]]);
      blob([[1260, 640], [1400, 620], [1450, 700], [1380, 770], [1270, 740]]);
      blob([[60, 950], [1540, 950], [1540, 1000], [60, 1000]], "#f4f8ff");
      land(g, SAM, 60, 300); land(g, AFR, 330, 300);
      if (k > 0) { g.setLineDash([22, 14]); g.strokeStyle = "#ffffff"; g.lineWidth = 9; poly(g, SAM, 60, 300); g.stroke(); }
      if (k > 1) { poly(g, AFR, 330, 300); g.stroke(); }
      if (k > 2) { g.setLineDash([]); g.strokeStyle = "#ffd23a"; g.lineWidth = 14; g.beginPath(); g.moveTo(520, 560); g.quadraticCurveTo(620, 470, 700, 540); g.stroke(); g.fillStyle = "#ffd23a"; g.beginPath(); g.moveTo(712, 552); g.lineTo(676, 520); g.lineTo(700, 580); g.closePath(); g.fill(); }
      return c; };
    S.maps = [0, 1, 2, 3].map(worldMap);
    // the ocean-floor profile, drawn to fraction k
    const profile = (k, ring) => { const c = document.createElement("canvas"); c.width = 1000; c.height = 640; const g = c.getContext("2d");
      g.fillStyle = "#f6f1e2"; g.fillRect(0, 0, 1000, 640); g.strokeStyle = "rgba(60,80,120,.25)"; g.lineWidth = 2; for (let i = 1; i < 10; i++) { g.beginPath(); g.moveTo(i * 100, 90); g.lineTo(i * 100, 610); g.stroke(); } for (let j = 1; j < 6; j++) { g.beginPath(); g.moveTo(0, 90 + j * 90); g.lineTo(1000, 90 + j * 90); g.stroke(); }
      g.fillStyle = OL; g.font = "900 52px Georgia, serif"; g.textAlign = "center"; g.fillText("ATLANTIC OCEAN FLOOR", 500, 64);
      const f = x => { const d = Math.abs(x - 500); let y = 560 - Math.max(0, 1 - d / 330) * 300 + Math.sin(x * .09) * 14 * Math.max(0, 1 - d / 330); if (x < 70 || x > 930) y = 180; else if (x < 130 || x > 870) y = 180 + (Math.min(x, 1000 - x) - 70) * 6.3; if (d < 40) y += (40 - d) * 3.4; return y; };
      const n = Math.round(1000 * k); g.beginPath(); g.moveTo(0, 640); for (let x = 0; x <= n; x += 5) g.lineTo(x, f(x)); g.lineTo(n, 640); g.closePath(); g.fillStyle = "#c8955a"; g.fill();
      g.beginPath(); for (let x = 0; x <= n; x += 5) x ? g.lineTo(x, f(x)) : g.moveTo(x, f(x)); g.strokeStyle = OL; g.lineWidth = 7; g.stroke();
      if (ring) { g.strokeStyle = "#e5383b"; g.lineWidth = 12; g.beginPath(); g.ellipse(500, 330, 95, 120, 0, 0, 7); g.stroke(); }
      return c; };
    S.profiles = [...Array(9)].map((_, i) => profile(i / 8, 0)); S.profiles.push(profile(1, 1));

    // ---------- cast looks ----------
    const wegener = { hair: { style: "short", color: "#3a2a20" }, glasses: true, mustache: "thin", mustacheColor: "#3a2a20", top: { type: "coat", color: "#3a6aa8", vest: "#f2c85a", shirt: "#ffffff", tie: "#e5383b" }, pants: "#2f2a3a" };
    const wegIce = Object.assign({}, wegener, { hat: { type: "slouch", color: "#6a4a2a" }, top: { type: "coat", color: "#8a5a33", vest: "#e8d6a0", tie: "#e5383b" } });
    const expert = (coat, o = {}) => Object.assign({ hair: { style: "wig", color: "#f2f0ea" }, top: { type: "coat", color: coat, vest: o.vest || "#e8d6a0" } }, o);
    const exSpecs = [expert("#6a3f8a", { monocle: true, hair: { style: "balding", color: "#d8d4cc" } }), expert("#2a3a5a", { glasses: true, hair: { style: "side", color: "#5a4a3a" } }), expert("#8a2f3a", { mustache: "walrus", mustacheColor: "#d8d4cc", hair: { style: "tufts", color: "#d8d4cc" } }), expert("#3a5a3a", { hat: { type: "bowler", color: "#1d1d24" }, hair: { style: "short", color: "#2a2020" } })];

    // ================= STUDY =================
    let G = CS.set("study");
    Wd.room({ w: 9, d: 7, h: 4.3, wall: "#9fc8e8", wallTex: "wallpaper", wain: "#5a4a6a", floor: "#c8955a", floorTex: "planks", floorOpt: { n: 6 }, windows: [-3.0], winW: 1.3, winH: 2.1, sconces: [2.6] }, G);
    S.map = Wd.frame(2.6, 1.625, S.maps[0], { color: "#8a5a33" }, G); S.map.position.set(.35, 2.25, -3.42);
    S.baro = Wd.clock(.32, [-1.6, 2.4, -3.38], G); S.baro.set(4.4);
    Wd.box(1.6, .8, .8, Wd.painted("planks", "#8a5a33"), [2.4, 0, -2.6], G); Wd.box(.12, .25, .12, CS.mat("#f2c85a"), [2.1, .8, -2.6], G);
    S.w1 = P(wegener, G);

    // ================= TABLE (top-down) =================
    G = CS.set("table");
    Wd.ground([40, 40], Wd.painted("planks", "#a8743f", { n: 6 }), G, { tile: 2.2 });
    Wd.box(3.6, .8, 2.6, Wd.painted("planks", "#8a5a33", { n: 4 }), [0, 0, 0], G, { tile: 2 });
    const paper = Wd.box(2.3, .01, 1.7, CS.mat("#f6f1e2"), [0, .8, 0], G);
    const mkPiece = (tex) => { const m = CS.mat("#ffffff", { tex }); m.alphaTest = .5; m.needsUpdate = true; const mesh = new THREE.Mesh(new THREE.PlaneGeometry(.96, .72), m); mesh.rotation.x = -Math.PI / 2; mesh.position.y = .815; CS.add(mesh, G); return mesh; };
    S.pSam = mkPiece(S.pieceTex.sam[0][0]); S.pAfr = mkPiece(S.pieceTex.afr[0][0]);
    Wd.cyl(.12, .12, .02, CS.mat("#c8c8d0"), [-1.4, .8, .9], G); Wd.box(.5, .02, .07, CS.mat("#e5383b"), [1.3, .81, -.95], G, { rot: [0, .6, 0] });

    // ================= HALL =================
    G = CS.set("hall");
    Wd.room({ w: 10, d: 8, h: 4.8, wall: "#8a3a4a", wallTex: "stripes", wain: "#4a2a2a", floor: "#f4ecd8", floor2: "#5a2a3a", windows: [-3.4, 3.4], sconces: [-1.8, 1.8], winH: 2.4 }, G);
    Wd.box(3.8, .9, 1.3, CS.mat("#3a4a6a"), [0, 0, -1.25], G); Wd.box(4.0, .08, 1.45, CS.mat("#e8c048"), [0, .86, -1.25], G);
    const globePic = Wd.frame(1.6, 1.0, S.maps[0], { color: "#c8962e" }, G); globePic.position.set(0, 2.9, -3.95);
    S.ex = exSpecs.map((sp, i) => P(sp, G).at(-1.2 + i * .8, 0, -2.0 - (i % 2) * .15));

    // ================= ICE =================
    G = CS.set("ice");
    Wd.ground([300, 300], CS.mat("#f4f8ff", { tex: "flat", texOpt: { color: "#f4f8ff" } }), G, { tile: 4 });
    for (let i = 0; i < 8; i++) Wd.hill(6 + R(i) * 8, "#e8f0fa", [-30 + i * 9, 0, -26 - R(i + 3) * 20], G, { squash: .3 });
    Wd.mountain(14, 16, "#c8d8ec", [20, 0, -60], G); Wd.mountain(12, 13, "#d4e2f2", [-24, 0, -55], G);
    Wd.cone(1.2, 1.7, CS.mat("#e8b93c"), [-2.2, 0, -3.5], G, { seg: 6 });
    Wd.box(1.4, .3, .6, Wd.painted("planks", "#8a5a33"), [1.8, 0, -2.6], G);
    S.iceFlag = Wd.flag("#c23a3a", [-.9, 0, -4.2], G, { pole: 2.6, w: .9, h: .6 });
    S.w2 = P(wegIce, G);
    S.snow = [...Array(140)].map((_, i) => { const s = CS.sprite(CS.fxTex("dust", { color: "#ffffff" }), .07 + R(i) * .08, G); s.userData.seed = i; return s; });

    // ================= SEA =================
    G = CS.set("sea");
    S.water = Wd.water(1200, 1200, "#2f7fc0", [0, 0, 0], G);
    S.ship = Wd.ship({ flag: "#ffffff", seed: 4 }, G);
    Wd.clouds(14, 300, 70, 9, G, { cz: -160, size: 60 });
    // ================= DECK =================
    G = CS.set("deck");
    Wd.box(14, .3, 9, Wd.painted("planks", "#c8955a", { n: 8 }), [0, -.3, -1], G, { tile: 2 });
    for (let i = -6; i <= 6; i += 1.5) Wd.box(.16, 1.0, .16, CS.mat("#e8eef6"), [i, 0, -4.4], G);
    Wd.box(14, .14, .26, CS.mat("#e8eef6"), [0, 1.0, -4.4], G);
    S.dwater = Wd.water(800, 800, "#2f86c8", [0, -2.4, 0], G);
    Wd.clouds(10, 220, 50, 4, G, { cz: -140, size: 50 });
    S.chart = Wd.frame(1.9, 1.22, S.profiles[0], { color: "#5a6a7a" }, G); S.chart.position.set(.45, 1.55, -1.25);
    for (const s of [-1, 1]) Wd.box(.08, 1.0, .08, CS.mat("#5a6a7a"), [.45 + s * .8, 0, -1.3], G);
    S.sci = P({ hair: { style: "bun", color: "#c8a070" }, glasses: true, top: { type: "shirt", color: "#2fa8a0" }, pants: "#2f3f6a" }, G);

    // ================= EARTH (cross-section diorama) =================
    G = CS.set("earth"); G.scale.setScalar(.6);
    Wd.box(60, .1, 60, CS.mat("#2a3050"), [0, -1.4, 0], G);
    const mantle = CS.mat("#e8743a", { emissive: "#c2401a", emissiveI: .35 });
    Wd.box(4.6, 1.4, 2.6, mantle, [0, -.1, 0], G);
    S.plateL = new THREE.Group(); S.plateR = new THREE.Group(); G.add(S.plateL); G.add(S.plateR);
    const crust = CS.mat("#7a6a5a", { tex: "stone", texOpt: { color: "#7a6a5a" } }), sea = CS.mat("#3f8fd8");
    for (const [grp, s] of [[S.plateL, -1], [S.plateR, 1]]) {
      Wd.box(2.0, .45, 2.6, crust, [s * 1.18, 1.3, 0], grp);
      Wd.box(1.2, .22, 2.58, sea, [s * .78, 1.75, 0], grp);
      Wd.box(.95, .5, 2.6, CS.mat("#7cc85a", { tex: "grass", texOpt: { color: "#7cc85a" } }), [s * 1.72, 1.75, 0], grp);
      for (let i = 0; i < 3; i++) Wd.tree("round", .4, [s * (1.5 + i * .18), 2.25, -.6 + i * .5], grp, i + (s > 0 ? 9 : 0));
    }
    S.newFloor = Wd.box(1, .45, 2.6, CS.mat("#5a4a42", { tex: "stone", texOpt: { color: "#5a4a42" } }), [0, 1.3, 0], G);
    S.newSea = Wd.box(1, .22, 2.58, sea, [0, 1.75, 0], G);
    S.magma = Wd.box(.16, 1.9, 2.4, CS.mat("#ffb02e", { emissive: "#ff8a1a", emissiveI: 1.6 }), [0, -.1, 0], G); S.magma.userData.ink = "none";
    S.bubbles = [...Array(10)].map((_, i) => { const b = Wd.ball(.07, CS.mat("#ffd25a", { emissive: "#ffb02e", emissiveI: 1.5 }), [0, 0, 1.31], G); b.userData.ink = "none"; return b; });
    S.arrows = [-1, 1].map(s => { const a = new THREE.Group(); a.position.set(s * .9, .2, 1.32); G.add(a); const m = CS.mat("#fff2c0", { emissive: "#ffd27a", emissiveI: .8 });
      Wd.box(.9, .09, .02, m, [0, 0, 0], a); const c = Wd.cone(.13, .2, m, [s * .52, 0, 0], a, { seg: 3 }); c.rotation.z = -s * Math.PI / 2; return a; });
    S.tiny = [P({ hair: { style: "short", color: "#3a2a20" }, top: { type: "shirt", color: "#ff5f8a" }, pants: "#2f3f6a" }, S.plateL, { h: .9 }), P({ hair: { style: "bun", color: "#c8642e" }, top: { type: "dress", color: "#f2c85a" } }, S.plateR, { h: .9 })];

    // ================= HOME (today) =================
    G = CS.set("home");
    Wd.room({ w: 9, d: 7, h: 4.0, wall: "#ffd9c4", wallTex: "plaster", wain: "#e8a080", floor: "#c8955a", floorTex: "planks", floorOpt: { n: 6 }, windows: [2.6], winW: 1.4, winH: 2.0 }, G);
    Wd.box(2.4, .45, .9, CS.mat("#5a7ab8"), [-.3, 0, -2.3], G); Wd.box(2.4, .7, .25, CS.mat("#4a6aa8"), [-.3, .45, -2.65], G);
    for (const s of [-1, 1]) Wd.box(.25, .65, .9, CS.mat("#4a6aa8"), [-.3 + s * 1.1, 0, -2.3], G);
    const wmap = Wd.frame(1.3, .8, S.maps[0], { color: "#ffffff" }, G); wmap.position.set(-.3, 2.3, -3.42);
    Wd.lamp([-2.6, 0, -2.6], G, { on: true });
    S.guy = P({ hair: { style: "curly", color: "#2a1d1a" }, top: { type: "shirt", color: "#7a5ad8" }, pants: "#2f3f6a" }, G);

    // ---------- effects ----------
    S.fx = [];
    S.fx.push(CS.burst("star", [.3, 2.3, -3.2], Wt.puzzle, { n: 12, size: .12, spread: 1.0, up: .5, gravity: .2, seed: 4, dur: 1.2, colors: ["#ffe27a", "#fff6c0"], parent: CS.set("study") }));
    S.fx.push(CS.burst("star", [0, .9, 0], Wt.africa + .05, { n: 12, size: .1, spread: .6, up: .8, gravity: .8, seed: 5, dur: 1.0, colors: ["#ffe27a", "#fff6c0"], parent: CS.set("table") }));
    S.fx.push(CS.pop("!", [-.15, 2.55, .2], Wt.cont - .05, Wt.geo - .1, { size: .5 }));
    S.fx.push(CS.pop("?", [-.3, 2.5, .2], Wt.pushed - .05, Wt.y1930 - .1, { size: .55 }));
    S.fx.push(CS.pop("!", [.95, 2.15, -1.0], Wt.crack, Wt.hot - .1, { size: .42 }));
    S.fx.push(CS.burst("speed", [0, 1.0, .2], Wt.moving2, { n: 5, size: .5, spread: .6, up: 0, gravity: 0, seed: 7, dur: .9, parent: CS.set("home") }));
    S.fx.push(CS.pop("?", [.55, 2.25, .1], Wt.grow + .1, 1e9, { size: .45 }));
    // overlay
    CS.title("THEY'RE MOVING!", Wt.cont - .05, Wt.geo - .12, { size: 120 });
    CS.title("1930", Wt.y1930 - .05, Wt.died + .25, { size: 230 });
    CS.title("DECADES LATER", Wt.decades - .05, Wt.ships - .1, { size: 120 });
  },

  frame(t, T) {
    const S = this, Wt = S.W, sm = CS.ease.smooth, out = CS.ease.out, back = CS.ease.back, seg = CS.seg, b = (x, s) => CS.blinkAt(x, s);
    const sh = S.plan.apply(t), id = sh.shot.id, set = sh.shot.set, L = sh.local;
    const live = (c, s, o) => CS.alive(c, t, s, o);
    const talk = (on) => on ? Math.round(t * 7) % 2 : 0;
    if (set === "study") {
      const mk = id === "jig" ? Math.min(3, Math.floor(seg(t, Wt.and1 + .1, Wt.puzzle + .2) * 4)) : id === "hook" || id === "map" ? 0 : 3; S.map.setImage(S.maps[mk]);
      if (id === "hook") S.w1.at(-.3, 0, .5).pose({ face: t > Wt.map ? "awe" : "neutral", arms: ["hang", [120, 30]], prop: { kind: "book", hand: "R" }, blink: b(t, 1), look: .7, lookY: -.6 });
      else if (id === "idea") S.w1.at(-.4, 0, .2).pose({ face: t > Wt.cont ? "joy" : "determined", arms: ["hip", "up"], talk: talk(t < Wt.moving + .4), blink: b(t, 1) });
      else S.w1.at(-.35, 0, .2).pose({ face: t > Wt.pushed ? "sad" : "worried", arms: ["shrug", "shrug"], blink: b(t, 1), look: .3 });
      S.w1.show(id === "hook" || id === "idea" || id === "shrug"); live(S.w1, 1);
    }
    if (set === "table") {
      const k = out(seg(t, Wt.slides - .05, Wt.africa + .05));
      S.pSam.position.x = -.05 - (1 - k) * .36; S.pAfr.position.x = -.05 + (1 - k) * .36;
      S.pSam.position.x += 0; S.pSam.position.z = 0; S.pAfr.position.z = 0;
      const f = t > Wt.fossils - .05 ? 1 : 0, r = t > Wt.rocks - .05 ? 1 : 0;
      S.pSam.material.map = S.pieceTex.sam[f][r]; S.pAfr.material.map = S.pieceTex.afr[f][r];
    }
    if (set === "hall") {
      const laughing = id === "laugh" && t > Wt.laughed - .1 || id === "sneer";
      S.ex.forEach((c, i) => {
        c.pose({ face: laughing ? (i === 0 ? "smug" : "laugh") : "stern", arms: id === "sneer" && i === 0 ? ["hold", "point"] : laughing ? (i === 3 ? ["cheek", "cheek"] : ["hip", "hip"]) : ["hold", "hold"],
          prop: id === "sneer" && i === 0 ? { kind: "sign", hand: "L", text: "IMPOSSIBLE", color: "#f6edd6" } : null, talk: talk(id === "sneer" && i === 0), look: i < 2 ? .5 : -.5, blink: b(t, 10 + i) });
        live(c, 10 + i, laughing ? { bob: 4, sway: 2 } : {});
      });
    }
    if (set === "ice") {
      S.iceFlag.wave(t);
      const walk = id === "ice" ? seg(t, Wt.y1930 + 1.0, Wt.still) : 1;
      S.w2.show(id === "ice").at(.2 + walk * .6, 0, -.2 - walk * 3.6).pose({ face: "determined", arms: ["hang", "hang"], step: walk * 4, stride: walk > 0 && walk < 1 ? .8 : 0, blink: b(t, 2) }); live(S.w2, 2, { sway: 3 });
      S.snow.forEach((s, i) => { const sd = s.userData.seed, R = CS.rand; const y = 4.5 - ((t * (.9 + R(sd) * .6) + R(sd + 5) * 4.5) % 4.5), x = -3 + R(sd + 2) * 6 + Math.sin(t * 1.5 + sd) * .3 + (t * .8 % 6) * (R(sd + 7) - .2) * .4;
        s.position.set(((x + 3) % 6) - 3, y, -6 + R(sd + 9) * 8); });
    }
    if (set === "sea") { S.water.flow(t); S.ship.bob(t); S.ship.position.set(-2 + L * 1.6, 0, 0); }
    if (set === "deck") {
      S.dwater.flow(t);
      const k = Math.min(8, Math.floor(seg(t, Wt.ships, Wt.crack + .1) * 8.99)); S.chart.setImage(id === "crack" && t > Wt.crack + .15 ? S.profiles[9] : S.profiles[k]);
      S.sci.at(-.75, 0, -.6).pose({ face: id === "crack" && t > Wt.crack ? "shock" : "determined", arms: ["hang", id === "crack" ? "up" : "point"], blink: b(t, 3), look: .7 }); live(S.sci, 3);
    }
    if (set === "earth") {
      const k = sm(seg(t, Wt.spreads - .2, Wt.top + .6)) + (t > Wt.top + .6 ? (t - Wt.top - .6) * .05 : 0);
      S.plateL.position.x = -k * .45; S.plateR.position.x = k * .45;
      S.newFloor.scale.x = .001 + k * .9; S.newSea.scale.x = .001 + k * .9;
      S.magma.scale.y = .2 + .8 * sm(seg(t, Wt.hot - .05, Wt.rises + .5)); S.magma.position.y = -.8 + S.magma.scale.y * .95;
      S.bubbles.forEach((bb, i) => { const ph = (t * .7 + i / 10) % 1; bb.position.set(Math.sin(i * 2.1) * .12, -.6 + ph * 2.1, 1.31); bb.visible = t > Wt.rises - .2 && ph < .9; });
      S.arrows.forEach((a, i) => { a.visible = t > Wt.spreads - .1; a.position.x = (i ? 1 : -1) * (.75 + Math.sin(t * 4) * .06); });
      S.tiny.forEach((c, i) => { c.show(id === "ride" || id === "spread").at((i ? 1 : -1) * 1.62, 2.25, .45).pose({ face: "joy", arms: [i ? "hang" : "wave", i ? "wave" : "hang"], wave: t * 3, blink: b(t, 20 + i), look: i ? -.6 : .6 }); live(c, 20 + i); });
    }
    if (set === "home") {
      const slide = id === "home" ? sm(seg(t, Wt.youre, Wt.about)) * .3 : .3;
      S.guy.at(.05 + slide * (id === "home" ? 1 : 0), 0, -.4).pose({ face: id === "nails" ? (t > Wt.grow ? "bored" : "awe") : t > Wt.now ? "shock" : "happy",
        arms: id === "nails" ? ["hang", [120, 30]] : ["hang", t > Wt.now ? "up" : [100, 40]], prop: id === "home" && t < Wt.now ? { kind: "phone", hand: "R" } : null, lookY: id === "home" && t > Wt.now ? -1 : id === "nails" ? -.4 : .5, look: id === "nails" ? .7 : 0, blink: b(t, 4) });
      live(S.guy, 4, id === "home" && t > Wt.youre ? { sway: 4 } : {});
    }
    for (const f of S.fx) f.update(t);
  },

  sound(A, T) {
    const S = this; S.init(T); const Wt = S.W;
    A.music({ bpm: 100, key: 57, sections: [{ at: 0, style: "whimsy" }, { at: Wt.look - .1, style: "folk" }, { at: Wt.geo - .1, style: "sneak" }, { at: Wt.he - .1, style: "drone" },
      { at: Wt.still - .3, style: "stop" }, { at: Wt.decades - .1, style: "whimsy" }, { at: Wt.hot - .1, style: "tense" }, { at: Wt.so - .1, style: "stop" }] });
    S.plan.cutSounds(A, ["whoosh", "swish"], .42);
    A.sfx("paper", Wt.and1 + .1, .4); for (let i = 0; i < 6; i++) A.sfx("click", Wt.and1 + .25 + i * .16, .22); A.sfx("magic", Wt.puzzle, .5);
    A.sfx("paper", Wt.look + .1, .35); A.sfx("slideup", Wt.slides - .05, .35); A.sfx("thunk", Wt.africa + .05, .6); A.sfx("ting", Wt.africa + .1, .5);
    A.sfx("pop", Wt.fossils, .5); A.sfx("ting", Wt.fossils + .1, .35); A.sfx("pop", Wt.rocks, .5); A.sfx("ting", Wt.rocks + .1, .35);
    A.sfx("pop", Wt.cont, .45); A.sfx("sting", Wt.moving, .45);
    A.sfx("laugh", Wt.laughed - .05, .55, { dur: 3.2 }); A.sfx("laugh2", Wt.solid, .45, { dur: 1.6 }); A.sfx("thunk", Wt.cant + .1, .4);
    A.sfx("boing", Wt.pushed, .35); A.sfx("slidedown", Wt.pushed + .3, .3);
    A.sfx("wind", Wt.y1930 - .2, .6, { dur: 7 }); A.sfx("step", Wt.died + .2, .3); A.sfx("step", Wt.died + .55, .3); A.sfx("step", Wt.died + .9, .3);
    A.sfx("waves", Wt.decades - .1, .5, { dur: 3 }); A.sfx("birds", Wt.decades + .3, .25, { dur: 2 });
    for (let i = 0; i < 10; i++) A.sfx("ting", Wt.ships + .2 + i * .42, .12); A.sfx("sting", Wt.crack, .55); A.sfx("gasp", Wt.crack + .1, .35, { dur: .9 });
    A.sfx("boomdrum", Wt.hot, .5); A.sfx("crash", Wt.spreads + .1, .25); A.sfx("rattle", Wt.spreads, .3);
    A.sfx("pop", Wt.ride, .4); A.sfx("cheer", Wt.ride + .2, .3, { dur: 1.2 });
    A.sfx("slideup", Wt.youre, .4); A.sfx("gasp", Wt.moving2, .35, { dur: .8 }); A.sfx("boing", Wt.grow + .05, .45);
  },
};
