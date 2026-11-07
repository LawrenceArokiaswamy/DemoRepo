// ================= TIMELINE: beats -> shots (all anchored to the narration in film.json) =================
const SH = [];
function shot(name, t0, t1, fn) { SH.push({ name, t0, t1, fn }); }
function timeline() {
  T.h1 = L1('n1') + .12; T.hA = word('n1', 'ai') - .08;
  T.r1 = L1('n2') + .12; T.rA = word('n2', 'senate') + .25; T.rB = lerp(T.rA, T.r1, .5);
  T.d0 = L1('n3') + .1; T.fell = word('n3', 'fell'); T.d1 = word('n4', 'reason') - .05;
  T.giant = word('n4', 'giant') - .1; T.c4 = L1('n4') + .07; T.slow = word('n5', 'slow') - .05; T.fewer = word('n5', 'fewer') - .1; T.q1 = L1('n5') + .1;
  T.town = word('n6', 'town') - .1; T.stop = word('n6', 'stop'); T.b1 = L1('n6') + .12;
  T.and7 = word('n7', 'and') - .05; T.s1 = L1('n7') + .07;
  T.once = word('n8', 'once') - .1; T.l1 = L1('n8') + .12;
  T.safe = word('n9', 'safe') - .1; T.so9 = word('n9', 'so') - .05; T.c1 = L1('n9') + .07;
  T.when = word('n10', 'when') - .1; T.truck = word('n10', 'icecream') - .45; T.k1 = L1('n10') + .12;
  T.S0 = F.S0; T.HIT = F.HIT; T.partly = word('n12', 'partly'); T.spark = word('n12', 'spark'); T.but = word('n12', 'but') - .1; T.v1 = L1('n12') + .12;
  T.e0 = L1('n13') + .12; T.follow = word('n14', 'follow') - .15;
  shot('hook-map', 0, T.hA, sHookMap); shot('hook-line', T.hA, T.h1, sHookLine);
  shot('capitol', T.h1, T.rA, sCapitol); shot('house', T.rA, T.rB, sHouse); shot('senate', T.rB, T.r1, sSenate);
  shot('drop', T.r1, T.d0, sDrop); shot('ticker', T.d0, T.d1, sTicker);
  shot('r1-map', T.d1, T.giant, sDCMap); shot('aisle', T.giant, T.c4, sAisle); shot('build', T.c4, T.slow, sBuildWide); shot('build-stop', T.slow, T.fewer, sBuildStop); shot('chips', T.fewer, T.q1, sChips);
  shot('bricks', T.q1, T.town, sBricks); shot('bricks-stop', T.town, T.b1, sBricksStop);
  shot('coins', T.b1, T.and7, sCoins); shot('saw', T.and7, T.s1, sSaw);
  shot('lemon', T.s1, T.once, sLemon); shot('lemon-slow', T.once, T.l1, sLemonSlow);
  shot('dial', T.l1, T.safe, sDial); shot('jar', T.safe, T.so9, sJar); shot('move', T.so9, T.c1, sMove);
  shot('candy', T.c1, T.when, sCandy); shot('truck', T.when, T.k1, sTruck);
  shot('question', T.k1, T.HIT, sQuestion);
  shot('fire', T.HIT, T.but, sFire); shot('before', T.but, T.v1, sBefore);
  shot('loop', T.v1, T.e0, sLoop); shot('end', T.e0, F.dur + 1, sEnd);
  // sound cues for the mixer (events.mjs exports them)
  const ev = [];
  ev.push({ t: 0, type: 'sweep', d: 1.4 }, { t: T.hA - .05, type: 'whoosh', g: 1 }, { t: word('n1', 'fell') - .05, type: 'drop', g: .7 }, { t: word('n1', 'connected'), type: 'pop', g: .8 });
  ev.push({ t: T.h1 - .08, type: 'whoosh', g: .9 }, { t: word('n2', 'democrats'), type: 'bell', g: .6 }, { t: T.rA - .05, type: 'whoosh', g: .7 }, { t: T.rB - .05, type: 'whoosh', g: .7 });
  for (let k = 0; k < 12; k++) ev.push({ t: T.rA + .05 + k * .1, type: 'blip', g: .5 }, { t: T.rB + .05 + k * .1, type: 'blip', g: .5 });
  ev.push({ t: T.r1 - .1, type: 'whoosh', g: 1 }, { t: T.fell - .02, type: 'stinger' }, { t: T.d0 - .05, type: 'whoosh', g: .8 });
  for (let k = 0; k < 14; k++) ev.push({ t: T.d0 + .04 + k * .06, type: 'tickerblip', g: .7 });
  ev.push({ t: T.d1 - .05, type: 'whoosh', g: .8 }, { t: T.d1 + .1, type: 'pop', g: .7 });
  for (let k = 0; k < 6; k++) ev.push({ t: T.d1 + .25 + k * .12, type: 'thunk', g: .5 });
  ev.push({ t: T.giant - .08, type: 'whoosh', g: 1 }, { t: T.giant, type: 'hum', d: T.c4 - T.giant + .2 }, { t: T.c4 - .05, type: 'whoosh', g: .7 });
  for (let k = 0; k < 7; k++) ev.push({ t: T.c4 + .2 + k * .3, type: 'clank', g: .5 });
  ev.push({ t: T.slow + .3, type: 'halt' }, { t: T.slow + .5, type: 'pop', g: .6 }, { t: T.fewer - .05, type: 'whoosh', g: .7 }, { t: T.fewer + .4, type: 'wind_down', d: T.q1 - T.fewer - .4 });
  ev.push({ t: T.q1 - .05, type: 'whoosh', g: .8 }); for (let k = 0; k < 10; k++) ev.push({ t: T.q1 + .15 + k * .13, type: 'brick', g: .6 });
  ev.push({ t: T.stop, type: 'thump' }, { t: T.stop + .02, type: 'nope' });
  ev.push({ t: T.b1 - .05, type: 'whoosh', g: .8 }); for (let k = 0; k < 16; k++) ev.push({ t: T.b1 + .05 + k * .1, type: 'coin', g: .55 });
  ev.push({ t: T.and7 - .05, type: 'whoosh', g: .7 }, { t: T.and7 + .6, type: 'creak' }, { t: lerp(T.and7, T.s1, .7), type: 'thunk', g: .9 });
  ev.push({ t: T.s1 - .05, type: 'whoosh', g: .8 }); for (let k = 0; k < 6; k++) ev.push({ t: T.s1 + .2 + k * .22, type: 'register', g: .5 });
  ev.push({ t: T.once - .05, type: 'whoosh', g: .6 }, { t: T.once + .4, type: 'deflate' });
  ev.push({ t: T.l1 - .05, type: 'whoosh', g: .8 }, { t: T.l1 + .1, type: 'dialup', d: T.safe - T.l1 - .2 }, { t: T.safe - .05, type: 'whoosh', g: .6 });
  for (let k = 0; k < 10; k++) ev.push({ t: T.safe + .1 + k * .04, type: 'coin', g: .45 }); ev.push({ t: T.safe + .55, type: 'ding' });
  ev.push({ t: T.so9 - .05, type: 'whoosh', g: .6 }); for (let k = 0; k < 14; k++) ev.push({ t: T.so9 + .1 + k * .07, type: 'coin', g: .5 });
  ev.push({ t: T.c1 - .05, type: 'whoosh', g: .8 }, { t: T.truck, type: 'jingle' }, { t: T.when + .5, type: 'patter', d: 1.0 });
  ev.push({ t: T.k1 - .05, type: 'whoosh', g: .8 }, { t: T.S0, type: 'silence' }, { t: T.HIT, type: 'hit' });
  ev.push({ t: T.spark, type: 'ignite' }, { t: T.spark + .05, type: 'fire', d: T.but - T.spark + .2 }, { t: T.but - .05, type: 'whoosh', g: .8 }, { t: word('n12', 'before'), type: 'stinger', g: .6 });
  ev.push({ t: T.v1 - .05, type: 'whoosh', g: 1 }, { t: T.v1 + .05, type: 'sweep', d: 1.0 }, { t: word('n13', 'yes'), type: 'pop', g: .8 }, { t: T.follow + .1, type: 'chime' });
  EV = ev.sort((a, b) => a.t - b.t);
}

// ================= SHOTS (u = 0..1 through the shot) =================
const ST = {};
function resetFrame() { ST.flash = 0; ST.flashCol = [1.25, 1.15, .95]; ST.desat = 0; ST.ca = .0015; ST.streak = 0; ST.tag = null; ST.head = null;
  bloom.strength = .9; bloom.radius = .55; bloom.threshold = .9; scene.background = BG.navy; scene.fog.density = 0; pointL.intensity = 0; rimL.intensity = 1.4; keyL.intensity = 1.6; }
function sHookMap(u, t) { show('map'); mapFill(t, 'sweep'); MAP.dcs.forEach(b => b.visible = false); MAP.q.visible = false;
  const lu = lerp(.0, .42, u); mapLine(lu, t); mcam(V(lerp(-1.6, -.4, eio(u)), lerp(-9.6, -8.2, u), lerp(7.6, 6.3, u)), V(lerp(-.4, 0, u), lerp(.6, .3, u), 0), 40, lerp(-.05, .02, u)); }
function sHookLine(u, t) { show('map'); mapFill(t, 'sweep'); MAP.dcs.forEach(b => b.visible = false); MAP.q.visible = false;
  const h = mapLine(lerp(.42, 1.0, eio(u)), t); const off = V(lerp(-1.6, -.4, u), lerp(-3.4, -4.6, u), lerp(2.4, 3.6, u));
  mcam(h.clone().add(off), h.clone().add(V(.6, .4, -.5)), 44, lerp(.08, -.04, u)); ST.flash = .55 * (1 - eo(seg(u, 0, .12))); ST.ca = .0015 + .004 * seg(u, .6, 1); }
function sCapitol(u, t) { show('capitol'); scene.background = BG.city; const a = lerp(-.55, .25, eio(u)); const R = lerp(9.5, 8.0, u);
  cam(V(Math.sin(a) * R, lerp(1.3, 2.2, u), Math.cos(a) * R), V(0, lerp(2.0, 2.3, u), 0), 42, lerp(.03, -.02, u)); ST.flash = .6 * (1 - eo(seg(u, 0, .1))); }
function sHouse(u, t) { show('house'); seatsFill('house', t, T.rA + .05, .9); cam(V(lerp(-1.2, .6, u), lerp(1.2, 2.2, u), lerp(10.6, 9.4, eio(u))), V(lerp(-.3, .2, u), 2.4, 0), 42, lerp(-.04, .02, u)); ST.flash = .5 * (1 - eo(seg(u, 0, .12))); }
function sSenate(u, t) { show('senate'); seatsFill('senate', t, T.rB + .05, .8); cam(V(lerp(.9, -.5, u), lerp(1.0, 1.9, u), lerp(7.6, 6.6, eio(u))), V(lerp(.2, -.1, u), 1.8, 0), 42, lerp(.03, -.02, u)); ST.flash = .5 * (1 - eo(seg(u, 0, .12))); }
function sDrop(u, t) { show('weekchart'); const k = seg(t, T.r1 + .05, T.fell + .55); const hu = k < .33 ? lerp(0, .3333, eo(k / .33)) : k < .4 ? .3333 : lerp(.3333, .6667, ei((k - .4) / .6));
  const fr = seg(t, T.fell + .6, T.d0); const p = chartDraw('weekchart', hu + fr * .3333 * eo(fr), t);
  cam(V(p.x * .5 + lerp(-1.4, -.6, u), p.y * .4 + lerp(.6, -.4, u), lerp(8.2, 6.6, eio(u))), V(p.x * .6, p.y * .5, 0), 42, lerp(-.04, .06, eio(u)));
  ST.flash = .55 * (1 - eo(seg(u, 0, .1))); if (t > T.fell) { ST.ca = .0015 + .006 * Math.exp(-(t - T.fell) * 4); } }
function sTicker(u, t) { show('ticker'); const tl = SETS.ticker.userData.tiles; tl.forEach(o => { const f = eo(seg(t, T.d0 + o.d * .5, T.d0 + o.d * .5 + .3)); o.m.rotation.x = (1 - f) * -1.5; o.m.material.opacity = f; o.m.scale.setScalar(o.hero ? 1 + .06 * Math.sin(t * 6) : 1); });
  cam(V(lerp(2.8, .6, u), lerp(-1.4, .2, u), lerp(6.4, 5.4, u)), V(lerp(.8, -.4, u), lerp(-.3, .4, u), 0), 46, lerp(.08, -.03, u)); ST.flash = .5 * (1 - eo(seg(u, 0, .12))); }
function sDCMap(u, t) { show('map'); mapFill(t, 'dim', 1.5); MAP.line.visible = false; MAP.head.visible = false; MAP.q.visible = false;
  MAP.dcs.forEach((b, i) => { b.visible = true; const f = eo(seg(t, T.d1 + .15 + i * .07, T.d1 + .5 + i * .07)); b.scale.z = Math.max(.001, f * (.7 + .5 * hash(i))); b.position.z = .07 + b.scale.z * .5; });
  mcam(V(lerp(2.4, 1.0, u), lerp(-5.2, -4.2, u), lerp(4.2, 3.4, u)), V(lerp(1.4, .6, u), lerp(.3, .1, u), 0), 42, lerp(.05, -.02, u)); ST.flash = .5 * (1 - eo(seg(u, 0, .12))); }
function sAisle(u, t) { show('aisle'); scene.background = BG.deep; scene.fog.density = .06; scene.fog.color.set(0x040918); const z = lerp(1.5, -9, eio(u));
  cam(V(lerp(-.2, .25, u), lerp(1.0, 1.6, u), z), V(lerp(.1, -.1, u), lerp(1.3, 1.5, u), z - 6), 50, lerp(-.06, .05, u)); setFocus(SETS.aisle.userData.leds, 4, 6); ST.flash = .5 * (1 - eo(seg(u, 0, .1))); }
function buildFloors(t, freezeAt) { SETS.build.userData.B.forEach((b, i) => { const g = (Math.min(t, freezeAt) - T.c4 + 1.2 + b.ph * .4) * 3.6; b.floors.forEach((f, k) => { const s = seg(g, k, k + 1); f.visible = s > 0; f.scale.y = Math.max(.01, eo(s)); f.position.y = .16 + k * .34; });
  const run = t < freezeAt; b.jib.parent.rotation.y = (run ? t : freezeAt) * .9 + b.ph; b.q.visible = t > freezeAt + .05 + i * .1; b.q.scale.setScalar(Math.max(.001, back(seg(t, freezeAt + .05 + i * .1, freezeAt + .4 + i * .1), 2))); faceCam(b.q); }); }
function sBuildWide(u, t) { show('build'); scene.background = BG.city; buildFloors(t, 1e9); cam(V(lerp(-5.6, -3.8, u), lerp(2.4, 3.2, u), lerp(8.2, 7.4, u)), V(lerp(0, .3, u), 1.4, 0), 42, lerp(-.03, .02, u)); ST.flash = .5 * (1 - eo(seg(u, 0, .1))); }
function sBuildStop(u, t) { show('build'); scene.background = BG.city; buildFloors(t, T.slow + .3); ST.desat = .35 * seg(t, T.slow + .3, T.slow + .7);
  cam(V(lerp(2.6, 1.0, u), lerp(2.2, 2.8, u), lerp(7.0, 6.0, u)), V(lerp(.4, 0, u), lerp(1.8, 2.0, u), 0), 42, lerp(.03, -.02, u)); ST.flash = .45 * (1 - eo(seg(u, 0, .12))); }
function sChips(u, t) { show('chips'); scene.background = BG.city; chipsUpdate(t, T.fewer, T.q1); cam(V(lerp(-2.4, 1.6, eio(u)), lerp(2.6, 2.0, u), lerp(6.8, 6.2, u)), V(lerp(-1, .8, u), .9, 0), 44, lerp(-.03, .03, u)); ST.flash = .5 * (1 - eo(seg(u, 0, .1))); }
function sBricks(u, t) { show('bricks'); scene.background = BG.warm; bricksUpdate(t, T.q1, T.stop, T.b1); cam(V(lerp(-4.4, -2.6, u), lerp(3.0, 2.6, u), lerp(6.6, 6.0, u)), V(lerp(-1.2, 0, u), .8, 0), 44, lerp(-.04, .01, u)); ST.flash = .5 * (1 - eo(seg(u, 0, .1))); }
function sBricksStop(u, t) { show('bricks'); scene.background = BG.warm; bricksUpdate(t, T.q1, T.stop, T.b1); cam(V(lerp(3.6, 1.4, eio(u)), lerp(2.4, 2.9, u), lerp(6.2, 6.8, u)), V(lerp(1.4, -.6, u), lerp(1.4, 1.0, u), 0), 44, lerp(.04, -.02, u)); ST.flash = .45 * (1 - eo(seg(u, 0, .12))); }
function sCoins(u, t) { show('coins'); scene.background = BG.deep; coinsPour(t, T.b1); cam(V(lerp(-1.6, 1.4, eio(u)), lerp(1.6, 2.6, u), lerp(7.4, 6.4, u)), V(0, lerp(1.6, 1.9, u), 0), 46, lerp(-.05, .03, u)); ST.flash = .5 * (1 - eo(seg(u, 0, .1))); }
function sSaw(u, t) { show('saw'); scene.background = BG.deep; sawUpdate(t, u); cam(V(lerp(1.4, -.8, u), lerp(1.8, 1.5, u), lerp(7.2, 6.4, eio(u))), V(lerp(.3, -.3, u), 1.0, 0), 44, lerp(.03, -.03, u)); ST.flash = .45 * (1 - eo(seg(u, 0, .12))); }
function sLemon(u, t) { show('lemon'); scene.background = BG.warm; lemonUpdate(t, 0, u); cam(V(lerp(-2.4, -.6, eio(u)), lerp(1.8, 2.1, u), lerp(6.2, 5.4, u)), V(lerp(-.2, .3, u), 1.5, 0), 44, lerp(-.04, .02, u)); ST.flash = .5 * (1 - eo(seg(u, 0, .1))); }
function sLemonSlow(u, t) { show('lemon'); scene.background = BG.warm; lemonUpdate(t, 1, u); ST.desat = .25 * u; cam(V(lerp(2.0, .6, u), lerp(2.3, 1.9, u), lerp(5.6, 6.2, u)), V(lerp(.6, 0, u), 1.5, 0), 44, lerp(.04, -.02, u)); ST.flash = .45 * (1 - eo(seg(u, 0, .12))); }
function sDial(u, t) { show('dial'); const k = ss(seg(t, T.l1 + .15, T.safe - .2)); SETS.dial.userData.nd.rotation.z = lerp(1.25, -1.05, k) + .03 * Math.sin(t * 14) * k;
  SETS.dial.children.forEach(c => { if (c.userData.i !== undefined) c.material.opacity = (1 - c.userData.i / 24) * 1.3 > 1 - k ? 1 : .18; });
  cam(V(lerp(-1.2, .5, u), lerp(-.2, .4, u), lerp(6.6, 5.6, eio(u))), V(0, .6, 0), 42, lerp(-.05, .03, u)); ST.flash = .5 * (1 - eo(seg(u, 0, .1))); }
function sJar(u, t) { show('jar'); scene.background = BG.navy; jarUpdate(t, T.safe, 0); cam(V(lerp(3.6, 2.6, u), lerp(2.2, 1.8, u), lerp(4.6, 4.0, u)), V(2, 1.1, 0), 44, lerp(.04, -.02, u)); ST.flash = .45 * (1 - eo(seg(u, 0, .12))); }
function sMove(u, t) { show('jar'); scene.background = BG.navy; jarUpdate(t, T.so9, 1); cam(V(lerp(-.8, .6, u), lerp(2.6, 2.2, u), lerp(7.6, 6.8, eio(u))), V(0, 1.4, 0), 46, lerp(-.03, .03, u)); ST.flash = .45 * (1 - eo(seg(u, 0, .12))); }
function sCandy(u, t) { show('candy'); scene.background = BG.violet; candyUpdate(t, T.truck, T.when + .55); cam(V(lerp(-4.6, -3.0, u), lerp(1.6, 1.9, u), lerp(4.8, 5.4, u)), V(lerp(-1.6, -.8, u), .8, 0), 44, lerp(-.04, .01, u)); ST.flash = .5 * (1 - eo(seg(u, 0, .1))); }
function sTruck(u, t) { show('candy'); scene.background = BG.violet; candyUpdate(t, T.truck, T.when + .55); cam(V(lerp(-.6, 1.6, eio(u)), lerp(2.6, 2.2, u), lerp(7.6, 6.8, u)), V(lerp(-.2, .9, u), .9, 0), 46, lerp(.03, -.02, u)); ST.flash = .45 * (1 - eo(seg(u, 0, .12))); }
function sQuestion(u, t) { show('map'); mapFill(t, 'dim', 1.6); MAP.dcs.forEach(b => b.visible = false); MAP.line.visible = false; MAP.head.visible = false; MAP.q.visible = true;
  const k = seg(t, T.k1, T.S0); MAP.q.scale.setScalar(back(seg(t, T.k1 + .1, T.k1 + .5), 1.8) + .0001); MAP.q.rotation.set(Math.PI / 2, 0, 0); faceCam(MAP.q);
  mcam(V(lerp(.8, .1, k), lerp(-8.4, -6.0, ei(k)), lerp(5.4, 3.9, ei(k))), V(0, .3, 1.2), 42, lerp(.06, -.02, k)); ST.flash = .5 * (1 - eo(seg(t, T.k1, T.k1 + .12)));
  if (t >= T.S0) { ST.desat = .55; const d = seg(t, T.S0, T.HIT); mcam(V(.1, lerp(-6.0, -5.9, d), lerp(3.9, 3.85, d)), V(0, .3, 1.2), 42, -.02); } }
function sFire(u, t) { show('fire'); scene.background = BG.warm; fireUpdate(t, T.spark); const k = eio(u);
  cam(V(lerp(-3.0, 1.2, k), lerp(2.4, 1.6, k), lerp(5.6, 5.0, k)), V(lerp(-.8, 0, k), lerp(1.8, .9, k), 0), 44, lerp(-.04, .03, k)); ST.flash = Math.max(.7 * (1 - eo(seg(t, T.HIT, T.HIT + .15))), .5 * Math.exp(-Math.max(0, t - T.spark) * 8) * (t > T.spark ? 1 : 0)); ST.flashCol = [1.4, 1.0, .6]; }
function sBefore(u, t) { show('octchart'); const p = chartDraw('octchart', eo(seg(t, T.but + .05, T.but + .9)), t); const mk = SETS.octchart.userData.marker; mk.forEach(m => m.material.opacity = seg(t, T.but + .7, T.but + .95));
  cam(V(lerp(-1.6, .4, eio(u)), lerp(.8, -.2, u), lerp(7.8, 6.6, u)), V(lerp(-.6, .6, u), lerp(.3, -.1, u), 0), 42, lerp(-.03, .03, u)); ST.flash = .5 * (1 - eo(seg(u, 0, .1))); }
function sLoop(u, t) { show('map'); mapFill(t, 'lit'); MAP.dcs.forEach(b => b.visible = false); MAP.q.visible = false; const h = mapLine(lerp(.25, 1, eio(u)), t);
  mcam(V(lerp(-1.0, .6, u), lerp(-9.0, -7.6, u), lerp(6.8, 5.8, u)), V(lerp(-.2, .4, u), .2, 0), 40, lerp(-.04, .03, u)); ST.flash = .6 * (1 - eo(seg(u, 0, .12))); }
function sEnd(u, t) { show('map'); mapFill(t, 'lit', .7); MAP.dcs.forEach(b => b.visible = false); MAP.q.visible = false; mapLine(1, t); MAP.head.visible = false; const k = seg(t, T.e0, F.dur);
  mcam(V(lerp(.6, 1.4, k), lerp(-7.6, -10.5, k), lerp(5.8, 8.0, k)), V(lerp(.4, .6, k), lerp(.2, -.6, k), 0), 40, lerp(.03, .06, k)); ST.desat = .15 * k; ST.flash = .3 * (1 - eo(seg(t, T.e0, T.e0 + .15))); }

function frame(t) {
  resetFrame();
  for (const k in SETS) if (SETS[k].visible !== false) SETS[k].traverse(o => { if (o.material && o.material.uniforms && o.material.uniforms.uTime) o.material.uniforms.uTime.value = t; });
  let s = SH.find(x => t >= x.t0 && t < x.t1) || SH[SH.length - 1]; ST.shot = s.name;
  s.fn(clamp((t - s.t0) / (s.t1 - s.t0)), t, s);
  grade.uniforms.uFlash.value = clamp(ST.flash * .65); grade.uniforms.uFlashCol.value.setRGB(...ST.flashCol); grade.uniforms.uDesat.value = ST.desat; grade.uniforms.uCA.value = ST.ca; grade.uniforms.uStreak.value = ST.streak;
}

// ---------------- 2D overlay (headline, numbers, sources, captions) ----------------
function tx(s, x, y, size, font, col, align = 'left', glow = 0, glowCol = null) { X.font = `${size}px ${font}`; X.textAlign = align; X.textBaseline = 'alphabetic'; if (glow) { X.shadowColor = glowCol || col; X.shadowBlur = glow; } X.fillStyle = col; X.fillText(s, x, y); X.shadowBlur = 0; }
function fitTx(s, x, y, size, font, col, maxW, glow, glowCol) { X.font = `${size}px ${font}`; const w = X.measureText(s).width; const sz = w > maxW ? size * maxW / w : size; tx(s, x, y, sz, font, col, 'center', glow, glowCol); }
function stroked(s, x, y, size, font, col, align = 'center') { X.font = `${size}px ${font}`; X.textAlign = align; X.lineJoin = 'round'; X.shadowColor = 'rgba(0,0,0,.8)'; X.shadowBlur = 20; X.shadowOffsetY = 4; X.strokeStyle = 'rgba(0,0,0,.6)'; X.lineWidth = 9; X.strokeText(s, x, y); X.shadowBlur = 0; X.shadowOffsetY = 0; X.fillStyle = col; X.fillText(s, x, y); }
const CX = 504, GLOW = 'rgba(255,170,30,.85)', SRC = 'rgba(210,222,250,.92)';
const fade = (t, a, b, fi = .15, fo = .15) => clamp((t - a) / fi) * (1 - clamp((t - b + fo) / fo));
function head(lines, t, a, b, y0 = 205, size = 92, step = 104) {   // gold headline lines: [text, appearTime, color?, size?]
  let y = y0; for (const L of lines) { const [s, at, col, sz] = L; const al = fade(t, at, b, .12) * (a <= t ? 1 : 0); if (al > 0) { X.globalAlpha = al; const pop = back(clamp((t - at) / .3), 1.6); X.save(); X.translate(CX, y); X.scale(lerp(.8, 1, pop), lerp(.8, 1, pop)); fitTx(s, 0, 0, sz || size, AN, col || CSS.gold, 860, 26, GLOW); X.restore(); X.globalAlpha = 1; } y += (sz || size) * step / size; }
}
function src(s, y, t, a, b) { const al = fade(t, a, b); if (al > 0) { X.globalAlpha = al; tx(s, CX, y, 32, BS, SRC, 'center', 8, 'rgba(0,0,0,.9)'); X.globalAlpha = 1; } }
function bigNum(s, y, t, a, b, size = 230, col = CSS.gold2) { const al = fade(t, a, b, .1); if (al > 0) { X.globalAlpha = al; const nb = back(clamp((t - a) / .35), 1.8); X.save(); X.translate(CX, y); X.scale(nb, nb); tx(s, 0, 0, size, AN, col, 'center', 44, GLOW); X.restore(); X.globalAlpha = 1; } }
function tag(a, b, t, t0, t1) { const al = fade(t, t0, t1); if (al > 0) { X.globalAlpha = al; const x = 60 - 30 * (1 - eo(clamp((t - t0) / .3))); rr(X, x - 16, 1108, 10, 92, 4); X.fillStyle = CSS.gold; X.fill(); tx(a, x + 10, 1146, 44, BX, '#fff', 'left', 10, 'rgba(0,0,0,.85)'); tx(b, x + 10, 1192, 34, BB, CSS.cyan, 'left', 8, 'rgba(0,0,0,.85)'); X.globalAlpha = 1; } }
function overlay(t) {
  X.clearRect(0, 0, W, H);
  // HOOK (first line already on screen at frame 1)
  { const b = T.h1 + .05; let y = 205; const L = [['AMERICA JUST VOTED.', 0], ['AI STOCKS JUST FELL.', word('n1', 'ai') - .1], ['CONNECTED?', word('n1', 'connected') - .05, CSS.gold2, 130]];
    for (const [s, at, col, sz] of L) { const al = (t >= at ? 1 : 0) * (1 - clamp((t - b + .15) / .15)); if (al > 0) { X.globalAlpha = al; const pop = at === 0 ? lerp(.94, 1, eo(clamp(t / .5))) : back(clamp((t - at) / .3), 1.6); X.save(); X.translate(CX, y); X.scale(pop, pop); fitTx(s, 0, 0, sz || 100, AN, col || CSS.gold, 860, 26, GLOW); X.restore(); X.globalAlpha = 1; } y += sz ? 150 : 112; } }
  // RESULT
  if (t > T.h1 - .1 && t < T.r1 + .1) {
    head([['MIDTERMS 2026', T.h1, CSS.cyan, 64], ['DEMOCRATS WIN CONTROL', T.h1 + .05], ['OF THE HOUSE + SENATE', word('n2', 'senate') - .2]], t, T.h1, T.rA + .02, 190);
    src('per AP race calls · vote held Tue Nov 3', 470, t, T.h1 + .3, T.rA + .02);
    if (t >= T.rA && t < T.rB) { const a = fade(t, T.rA, T.rB); X.globalAlpha = a; fitTx('HOUSE', CX, 220, 96, AN, CSS.gold, 860, 26, GLOW);
      tx('251', CX - 190, 370, 150, AN, '#7FA8FF', 'center', 30, 'rgba(60,120,255,.9)'); tx('162', CX + 190, 370, 150, AN, '#FF8A8E', 'center', 30, 'rgba(255,70,80,.8)');
      tx('DEM', CX - 190, 420, 40, BX, '#cfe0ff', 'center'); tx('REP', CX + 190, 420, 40, BX, '#ffd6d8', 'center'); tx('22 still counting', CX, 330, 40, BX, '#dfe6ff', 'center', 8, 'rgba(0,0,0,.8)'); tx('218 wins it', CX, 380, 40, BX, CSS.gold2, 'center', 8, 'rgba(0,0,0,.8)');
      tx('race calls as of Nov 6 (NBC News)', CX, 470, 30, BS, SRC, 'center', 8, 'rgba(0,0,0,.9)'); X.globalAlpha = 1; }
    if (t >= T.rB) { const a = fade(t, T.rB, T.r1 + .1); X.globalAlpha = a; fitTx('SENATE', CX, 220, 96, AN, CSS.gold, 860, 26, GLOW);
      tx('54', CX - 190, 370, 150, AN, '#7FA8FF', 'center', 30, 'rgba(60,120,255,.9)'); tx('44', CX + 190, 370, 150, AN, '#FF8A8E', 'center', 30, 'rgba(255,70,80,.8)');
      tx('DEM*', CX - 190, 420, 40, BX, '#cfe0ff', 'center'); tx('REP', CX + 190, 420, 40, BX, '#ffd6d8', 'center'); tx('2 still counting', CX, 330, 40, BX, '#dfe6ff', 'center', 8, 'rgba(0,0,0,.8)'); tx('(Alaska, Mississippi)', CX, 375, 34, BB, '#dfe6ff', 'center', 8, 'rgba(0,0,0,.8)');
      tx('*with 2 independents · projections, NBC/CNN, Nov 6', CX, 470, 30, BS, SRC, 'center', 8, 'rgba(0,0,0,.9)'); X.globalAlpha = 1; }
  }
  // THE DROP
  if (t > T.r1 - .05 && t < T.d1 + .1) {
    head([['THURSDAY, NOV 5', T.r1, CSS.cyan, 64], ['THE NASDAQ FELL', T.r1 + .05]], t, T.r1, T.d0 + .02, 190);
    bigNum('−5.5%', 470, t, T.fell - .05, T.d0 + .02);
    src('worst day since April 2025 (Reuters, Nov 5)', 530, t, T.fell + .2, T.d0 + .02);
    head([['THE SAME DAY', T.d0, CSS.cyan, 64], ['CHIP STOCKS −12%', T.d0 + .05], ['NVIDIA −9%', T.d0 + .25, CSS.gold2]], t, T.d0, T.d1 + .05, 190);
    src('Philadelphia chip index · Nov 5 (Reuters, CNBC)', 500, t, T.d0 + .3, T.d1 + .05);
    if (t > word('n4', 'why') - .1) { const a = fade(t, word('n4', 'why') - .1, T.d1 + .08, .1); X.globalAlpha = a; const pop = back(clamp((t - word('n4', 'why') + .1) / .3), 2); X.save(); X.translate(CX, 1000); X.scale(pop, pop); tx('WHY?', 0, 0, 200, AN, CSS.gold2, 'center', 44, GLOW); X.restore(); X.globalAlpha = 1; }
  }
  // REASON 1
  head([['REASON 1', T.d1, CSS.cyan, 64], ['DATA CENTERS', T.d1 + .05]], t, T.d1, T.c4 + .02, 190);
  src('AI runs on giant warehouses full of computers', 410, t, T.giant, T.c4 + .02);
  head([['FEAR: BUILDING SLOWS', T.c4]], t, T.c4, T.fewer + .02, 205);
  src('after election wins in key data-center states (Reuters, Nov 5)', 270, t, T.c4 + .2, T.fewer + .02);
  head([['FEWER DATA CENTERS', T.fewer], ['= FEWER CHIPS SOLD', word('n5', 'chips') - .15, CSS.gold2]], t, T.fewer, T.q1 + .02, 205);
  tag('Reason 1', 'data centers might slow', t, T.d1 + .3, T.q1 + .02);
  // brick maker comparison
  head([['LIKE A BRICK MAKER…', T.q1]], t, T.q1, T.b1 + .02, 205); head([['…IF THE TOWN STOPS', T.town, CSS.gold2], ['BUILDING HOUSES', T.town + .1, CSS.gold2]], t, T.town, T.b1 + .02, 320);
  // REASON 2
  head([['REASON 2', T.b1, CSS.cyan, 64], ['HUGE AI SPENDING', T.b1 + .05]], t, T.b1, T.and7 + .02, 190);
  src('“enormous AI spending” (CNN, Oct 30)', 410, t, T.b1 + .3, T.and7 + .02);
  head([['PROFITS LOOK SLOWER', T.and7]], t, T.and7, T.s1 + .02, 205);
  src('AI spending worries pushed the Nasdaq-100 down (Bloomberg, Nov 2)', 270, t, T.and7 + .2, T.s1 + .02);
  tag('Reason 2', 'spending races ahead of profits', t, T.b1 + .3, T.l1 + .02);
  head([['SALES SLOW DOWN…', T.s1]], t, T.s1, T.l1 + .02, 205); head([['…SO IT’S WORTH LESS', T.once, CSS.gold2]], t, T.once, T.l1 + .02, 320);
  // REASON 3
  head([['REASON 3', T.l1, CSS.cyan, 64], ['HIGHER RATES?', T.l1 + .05]], t, T.l1, T.safe + .02, 190);
  src('rate worries: CNN (Oct 30), Reuters (Nov 6 jobs report)', 410, t, T.l1 + .3, T.safe + .02);
  head([['SAFE SAVINGS PAY MORE', T.safe]], t, T.safe, T.so9 + .02, 205);
  head([['MONEY LEAVES', T.so9], ['RISKY STOCKS', T.so9 + .1, CSS.gold2]], t, T.so9, T.c1 + .02, 205);
  tag('Reason 3', 'safer places pay more', t, T.l1 + .3, T.k1 + .02);
  head([['THE CANDY LINE…', T.c1]], t, T.c1, T.k1 + .02, 205); head([['…VS THE ICE-CREAM TRUCK', T.when, CSS.gold2]], t, T.when, T.k1 + .02, 320);
  // THE QUESTION + VERDICT
  head([['SO… DID THE ELECTION', T.k1], ['CAUSE IT?', word('n11', 'cause') - .1, CSS.gold2, 130]], t, T.k1, T.HIT, 205);
  if (t >= T.HIT && t < T.but + .02) { bigNum('PARTLY.', 330, t, T.partly - .05, T.but + .02, 190); src('the election was Thursday’s spark (Reuters, CNBC)', 410, t, T.spark - .2, T.but + .02); }
  head([['THE SLIDE STARTED', T.but], ['BEFORE THE VOTE', word('n12', 'before') - .1, CSS.gold2]], t, T.but, T.v1 + .02, 190);
  bigNum('−10%', 470, t, word('n12', 'anyone') - .1, T.v1 + .02, 170);
  src('Nasdaq-100, Oct 6 record → Nov 2 close (Bloomberg)', 530, t, word('n12', 'anyone'), T.v1 + .02);
  // LOOP-BACK + END
  head([['CONNECTED? YES.', T.v1], ['NOT THE WHOLE STORY.', word('n13', 'but') - .1, CSS.gold2]], t, T.v1, T.e0 + .02, 205);
  if (t >= T.e0) { const a = eo(clamp((t - T.e0) / .35)); X.globalAlpha = a;
    tx('election = the spark', CX, 210, 52, BX, '#fff', 'center', 12, 'rgba(0,0,0,.9)'); tx('AI spending + rates = the dry wood', CX, 272, 52, BX, CSS.cyan, 'center', 12, 'rgba(0,0,0,.9)');
    if (t >= T.follow) { const b = eo(clamp((t - T.follow) / .35)); X.globalAlpha = b; const sc = lerp(.85, 1, back(clamp((t - T.follow) / .45), 1.6));
      X.save(); X.translate(CX, 480); X.scale(sc, sc); tx('FOLLOW', 0, 0, 150, AN, CSS.gold, 'center', 40, GLOW); tx('FOR MORE', 0, 165, 150, AN, CSS.gold, 'center', 40, GLOW); X.restore();
      tx('@lorenzo_ai_unplugged', CX, 740, 54, BX, '#fff', 'center', 14, 'rgba(120,170,255,.8)'); tx('AI in 60 Seconds', CX, 792, 40, BS, CSS.cyan, 'center'); }
    X.globalAlpha = a; rr(X, CX - 230, 1430, 460, 70, 35); X.fillStyle = 'rgba(8,14,40,.85)'; X.fill(); X.lineWidth = 3; X.strokeStyle = CSS.gold; X.stroke(); tx('NOT FINANCIAL ADVICE', CX, 1478, 44, BX, '#fff', 'center'); X.globalAlpha = 1; }
  // small persistent disclaimer during the market part
  if (t > T.r1 && t < T.e0) { X.globalAlpha = .75 * fade(t, T.r1, T.e0); tx('Not financial advice', 60, 1530, 30, BS, 'rgba(220,228,250,.9)', 'left', 6, 'rgba(0,0,0,.9)'); X.globalAlpha = 1; }
  // captions: white bold, key word yellow, word-synced
  const c = CAPS.find(c => t >= c.t0 && t < c.t1);
  if (c) { const size = 84, y = 1300; X.font = `${size}px ${BX}`;
    const parts = c.w.map(([w, h]) => [w, h, X.measureText(w + ' ').width]); const tw = parts.reduce((a, p) => a + p[2], 0) - X.measureText(' ').width;
    const pop = lerp(.9, 1, back(clamp((t - c.t0) / .12), 2)); const sc = Math.min(1, 860 / tw); X.save(); X.translate(CX, y); X.scale(pop * sc, pop * sc);
    let x = -tw / 2; for (const [w, h, ww] of parts) { stroked(w, x, 0, size, BX, h ? CSS.yel : '#fff', 'left'); x += ww; } X.restore(); }
}

// ---------------- boot ----------------
async function boot() {
  for (const [n, u] of FONTS) { const f = new FontFace(n, `url(${u})`); await f.load(); document.fonts.add(f); }
  [F, CAPS, US] = await Promise.all(['film.json', 'caps.json', 'data/us.json'].map(u => fetch(u).then(r => r.json())));
  timeline();
  buildMap(); buildCapitol(); buildSeats('house', 435, 9, 2.2, 4.4, .055, 251, 22); buildSeats('senate', 100, 5, 1.6, 3.0, .085, 54, 2);
  // daily closes: Nasdaq Composite Nov 3 (derived from Nov 4 close and its +1.44%), Nov 4 25,736.51, Nov 5 (−5.5%), Nov 6 24,579.42
  chartSet('weekchart', [[0, 25371], [1, 25736.5], [2, 24316], [3, 24579.4]], [[0, 'TUE'], [1, 'WED'], [2, 'THU'], [3, 'FRI']], [24100, 25950], null);
  // Nasdaq-100: Oct 6 record close 31,224.47 -> Nov 2 close 27,989.82 (straight line between the two closes); vote marker on Nov 3
  chartSet('octchart', [[0, 31224.5], [27, 27989.8]], [[0, 'OCT 6'], [27, 'NOV 2']], [27500, 31600], [28, 'VOTE · NOV 3']);
  buildTicker(); buildAisle(); buildBuild(); buildBricks(); buildCoins(); buildLemon(); buildRates(); buildCandy(); buildFire();
  window.DUR = F.dur; window.EV = EV; window.T = T; window.SH = SH; window.DBG = { camera, scene, ST };
  window.render = t => { frame(t); composer.render(); overlay(t); };
  window.render(0.5); window.READY = true;
}
boot();
