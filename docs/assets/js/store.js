/* ==========================================================================
   Data layer.
   Everything goes through W.store, so swapping the local adapter for a shared
   backend (Firebase / Supabase) later only touches this file.
   ========================================================================== */
(function () {
  const C = W.config;
  const KEY = "spw.v1";
  const B = 400; // market liquidity: higher = prices move less per trade

  /* ---------- time ---------- */
  W.now = function () { return Date.now(); };
  W.T = {
    reception: Date.parse(C.dates.reception),
    wedding: Date.parse(C.dates.wedding),
    reveal: Date.parse(C.dates.reveal),
  };
  W.isRevealed = function () { return W.now() >= W.T.reveal; };
  W.gamesLocked = function () { return W.now() >= W.T.wedding; };
  W.dayKey = function (t) {
    // Calendar day in India, so the mystery box flips at IST midnight.
    const d = new Date((t || W.now()) + 5.5 * 3600e3);
    return d.toISOString().slice(0, 10);
  };

  /* ---------- seeded randomness for the sample crowd ---------- */
  function rng(seed) {
    let s = seed >>> 0;
    return function () { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  /* ---------- LMSR market maths ---------- */
  const M = {
    price: function (m) { const a = Math.exp(m.qy / B), b = Math.exp(m.qn / B); return a / (a + b); },
    cost: function (qy, qn) { const mx = Math.max(qy, qn); return mx + B * Math.log(Math.exp((qy - mx) / B) + Math.exp((qn - mx) / B)); },
    /* shares received for spending `coins` on a side */
    quote: function (m, side, coins) {
      const c0 = M.cost(m.qy, m.qn), other = side === "yes" ? m.qn : m.qy, mine = side === "yes" ? m.qy : m.qn;
      const target = c0 + coins;
      // solve B*ln(e^(mine'/B) + e^(other/B)) = target for mine'
      const mine2 = B * Math.log(Math.exp(target / B) - Math.exp(other / B));
      return Math.max(0, mine2 - mine);
    },
  };
  W.market = M;

  /* ---------- state ---------- */
  function seedCrowd() {
    const r = rng(20270128);
    const crowd = { players: 142, trades: 0, wishes: 37, blessings: 21, boxes: 388, scratches: 131,
      team: { bride: 0, groom: 0 }, markets: {}, hss: {}, feed: [], lastSim: W.now() };
    C.markets.forEach(function (mk) {
      const p = mk.seed, qy = B * Math.log(p / (1 - p));
      const hist = []; let x = 0.5;
      for (let i = 0; i < 48; i++) { x += (p - x) * 0.09 + (r() - 0.5) * 0.06; x = Math.min(0.96, Math.max(0.04, x)); hist.push(+x.toFixed(4)); }
      hist.push(p);
      const vol = 2000 + Math.round(r() * 9000);
      crowd.markets[mk.id] = { qy: qy, qn: 0, hist: hist, open: hist[hist.length - 25], vol: vol };
      crowd.trades += Math.round(vol / 140);
    });
    C.hssQuestions.forEach(function (q) { const lean = 0.2 + r() * 0.6, n = 60 + Math.round(r() * 60); crowd.hss[q.id] = { S: Math.round(n * lean), P: Math.round(n * (1 - lean)) }; });
    crowd.team = { bride: 48200 + Math.round(r() * 3000), groom: 47100 + Math.round(r() * 3000) };
    return crowd;
  }
  function blankCrowd() {
    const crowd = { players: 0, trades: 0, wishes: 0, blessings: 0, boxes: 0, scratches: 0, team: { bride: 0, groom: 0 }, markets: {}, hss: {}, feed: [], lastSim: W.now() };
    C.markets.forEach(function (mk) { const qy = B * Math.log(mk.seed / (1 - mk.seed)); crowd.markets[mk.id] = { qy: qy, qn: 0, hist: [mk.seed], open: mk.seed, vol: 0 }; });
    C.hssQuestions.forEach(function (q) { crowd.hss[q.id] = { S: 0, P: 0 }; });
    return crowd;
  }
  function blank() {
    return { v: 1, player: null, crowd: C.demoMode ? seedCrowd() : blankCrowd(), couple: { S: { answers: {}, letter: "" }, P: { answers: {}, letter: "" }, outcomes: {} } };
  }
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { S = null; }
  if (!S || S.v !== 1) S = blank();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  const listeners = [];
  function emit(what) { save(); listeners.forEach(function (fn) { fn(what); }); }

  /* ---------- levels & badges ---------- */
  const LEVELS = [
    { at: 0, name: "Guest" }, { at: 150, name: "Friend of the Family" }, { at: 400, name: "Relative" },
    { at: 800, name: "Close Family" }, { at: 1400, name: "Inner Circle" }, { at: 2200, name: "Basically Family" },
  ];
  const BADGES = {
    invited:   { icon: "mail",     name: "Invited",          desc: "Scratched your invitation" },
    lucky:     { icon: "star",     name: "Golden Pull",      desc: "Pulled an epic or legendary perk" },
    early:     { icon: "sun",      name: "Early Bird",       desc: "Joined before 1 December" },
    streak3:   { icon: "flame",    name: "On Fire",          desc: "3-day mystery box streak" },
    streak7:   { icon: "flame",    name: "Week of Love",     desc: "7-day streak" },
    streak30:  { icon: "crown",    name: "Devotee",          desc: "30-day streak" },
    trader:    { icon: "up",       name: "Market Maker",     desc: "Placed 5 predictions" },
    whale:     { icon: "coins",    name: "High Roller",      desc: "Put 500 coins on one call" },
    reader:    { icon: "heart",    name: "Heart Reader",     desc: "Answered every He Said / She Said" },
    voice:     { icon: "mic",      name: "Voice of Blessing",desc: "Recorded a blessing" },
    scribe:    { icon: "pen",      name: "Time Capsule",     desc: "Sealed a wish" },
    rsvp:      { icon: "check",    name: "Confirmed",        desc: "Sent your RSVP" },
    trivia:    { icon: "target",   name: "Sharp Mind",       desc: "Got a box trivia right" },
  };
  W.LEVELS = LEVELS; W.BADGES = BADGES;
  W.levelOf = function (xp) {
    let i = 0; while (i < LEVELS.length - 1 && xp >= LEVELS[i + 1].at) i++;
    const cur = LEVELS[i], nxt = LEVELS[i + 1];
    return { idx: i, name: cur.name, at: cur.at, next: nxt ? nxt.at : null, pct: nxt ? (xp - cur.at) / (nxt.at - cur.at) : 1 };
  };

  /* ---------- public API ---------- */
  const store = {
    get state() { return S; },
    on: function (fn) { listeners.push(fn); },
    player: function () { return S.player; },

    join: function (name, city, team) {
      S.player = { id: "p" + Math.random().toString(36).slice(2, 10), name: name, city: city, team: team, joined: W.now(),
        xp: 0, coins: C.startingCoins, badges: {}, title: "", streak: { count: 0, best: 0, last: null }, boxes: {},
        scratch: null, trades: [], hss: {}, wishes: [], blessings: [], rsvp: null };
      S.crowd.players++;
      if (W.now() < Date.parse("2026-12-01T00:00:00+05:30")) store.badge("early", true);
      store.feed(name + " from " + (city || "somewhere lovely") + " joined Team " + (team === "bride" ? "Bride" : "Groom"));
      emit("join");
    },

    /* Award XP; returns {levelUp: bool, level} */
    xp: function (n) {
      const p = S.player; if (!p) return {};
      const before = W.levelOf(p.xp).idx;
      p.xp += n; S.crowd.team[p.team] += n;
      const after = W.levelOf(p.xp);
      emit("xp");
      return { levelUp: after.idx > before, level: after };
    },
    coins: function (n) { S.player.coins += n; emit("coins"); },
    badge: function (id, silent) {
      const p = S.player; if (!p || p.badges[id]) return false;
      p.badges[id] = W.now();
      if (!silent) emit("badge:" + id); else save();
      return true;
    },

    /* scratch card */
    scratchPull: function () {
      const p = S.player;
      if (p.scratch) return p.scratch.perkIdx;
      const total = C.perks.reduce(function (a, b) { return a + b.weight; }, 0);
      let r = Math.random() * total, idx = 0;
      for (; idx < C.perks.length; idx++) { r -= C.perks[idx].weight; if (r <= 0) break; }
      idx = Math.min(idx, C.perks.length - 1);
      p.scratch = { perkIdx: idx, at: W.now(), revealed: false };
      save();
      return idx;
    },
    scratchReveal: function () {
      const p = S.player; if (p.scratch.revealed) return;
      p.scratch.revealed = true;
      const perk = C.perks[p.scratch.perkIdx];
      if (perk.coins) p.coins += perk.coins;
      if (perk.title_) p.title = perk.title_;
      S.crowd.scratches++;
      store.feed(p.name + " scratched a " + perk.tier + " invitation");
      save();
    },

    /* daily mystery box */
    boxToday: function () {
      const day = W.dayKey(), start = Date.parse("2026-10-01T00:00:00+05:30");
      const idx = Math.floor((Date.parse(day) - start) / 864e5) % C.mysteryBoxes.length;
      return { day: day, idx: (idx + C.mysteryBoxes.length) % C.mysteryBoxes.length, opened: S.player && S.player.boxes[day] != null };
    },
    openBox: function () {
      const p = S.player, b = store.boxToday();
      if (b.opened) return null;
      const y = W.dayKey(W.now() - 864e5);
      p.streak.count = p.streak.last === y ? p.streak.count + 1 : 1;
      p.streak.best = Math.max(p.streak.best, p.streak.count);
      p.streak.last = b.day;
      p.boxes[b.day] = b.idx;
      S.crowd.boxes++;
      save();
      return C.mysteryBoxes[b.idx];
    },

    /* markets */
    trade: function (id, side, coins) {
      const p = S.player, m = S.crowd.markets[id];
      coins = Math.min(coins, p.coins);
      if (coins <= 0) return null;
      const shares = M.quote(m, side, coins);
      if (side === "yes") m.qy += shares; else m.qn += shares;
      m.vol += coins; m.hist.push(+M.price(m).toFixed(4)); if (m.hist.length > 80) m.hist.shift();
      p.coins -= coins;
      p.trades.push({ id: id, side: side, coins: coins, shares: shares, at: W.now() });
      S.crowd.trades++;
      const mk = C.markets.find(function (x) { return x.id === id; });
      store.feed(p.name + " bet " + coins + " on " + side.toUpperCase() + ": " + mk.q);
      emit("trade");
      return shares;
    },

    /* He Said / She Said */
    hss: function (qid, who) {
      const p = S.player, prev = p.hss[qid];
      if (prev) S.crowd.hss[qid][prev]--;
      p.hss[qid] = who; S.crowd.hss[qid][who]++;
      emit("hss");
      return !prev;
    },

    /* blessings & wishes */
    wish: function (text, capsule2028) {
      S.player.wishes.push({ text: text, at: W.now(), y2028: !!capsule2028 });
      S.crowd.wishes++;
      store.feed(S.player.name + " sealed a wish in the vault");
      emit("wish");
    },
    blessing: function (meta) {
      S.player.blessings.push(Object.assign({ at: W.now() }, meta));
      S.crowd.blessings++;
      store.feed(S.player.name + " recorded a voice blessing");
      emit("blessing");
    },
    rsvp: function (data) {
      const first = !S.player.rsvp;
      S.player.rsvp = Object.assign({ at: W.now() }, data);
      emit("rsvp");
      return first;
    },

    /* couple portal */
    coupleAnswer: function (who, qid, ans) { S.couple[who].answers[qid] = ans; save(); },
    coupleLetter: function (who, text) { S.couple[who].letter = text; S.couple[who].at = W.now(); save(); },
    outcome: function (mid, val) { S.couple.outcomes[mid] = val; save(); },

    /* activity feed */
    feed: function (text) {
      S.crowd.feed.unshift({ t: W.now(), text: text });
      S.crowd.feed = S.crowd.feed.slice(0, 30);
    },

    sealedCount: function () {
      const c = S.crowd;
      let hss = 0; Object.keys(c.hss).forEach(function (k) { hss += c.hss[k].S + c.hss[k].P; });
      return c.trades + hss + c.wishes + c.blessings + c.scratches;
    },

    /* Resolved data for the reveal show. In preview mode, missing couple answers
       and outcomes are filled with sample values so the show can be rehearsed. */
    results: function () {
      const r = rng(hash("reveal-demo"));
      const ans = { S: {}, P: {} };
      C.hssQuestions.forEach(function (q) {
        ["S", "P"].forEach(function (k) {
          ans[k][q.id] = S.couple[k].answers[q.id] || (C.demoMode ? (r() < 0.5 ? "S" : "P") : null);
        });
      });
      const outcomes = {};
      C.markets.forEach(function (mk) {
        const v = S.couple.outcomes[mk.id];
        outcomes[mk.id] = v != null ? v : (C.demoMode ? r() < mk.seed : null);
      });
      return { answers: ans, outcomes: outcomes };
    },
    reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); },
  };
  W.store = store;

  /* ---------- sample crowd simulation (preview mode only) ---------- */
  W.simTick = function () {
    if (!C.demoMode || W.gamesLocked()) return null;
    const r = Math.random;
    const name = C.demoNames[(r() * C.demoNames.length) | 0], city = C.demoCities[(r() * C.demoCities.length) | 0];
    const roll = r();
    let text;
    if (roll < 0.5) {
      const mk = C.markets[(r() * C.markets.length) | 0], m = S.crowd.markets[mk.id];
      const p = M.price(m);
      const side = r() < (0.5 + (mk.seed - p) * 2) ? "yes" : "no";
      const coins = [25, 50, 75, 100, 150, 200, 300][(r() * 7) | 0];
      const sh = M.quote(m, side, coins);
      if (side === "yes") m.qy += sh; else m.qn += sh;
      m.vol += coins; m.hist.push(+M.price(m).toFixed(4)); if (m.hist.length > 80) m.hist.shift();
      S.crowd.trades++;
      text = name + " bet " + coins + " on " + side.toUpperCase() + ": " + mk.q;
    } else if (roll < 0.7) {
      const q = C.hssQuestions[(r() * C.hssQuestions.length) | 0];
      S.crowd.hss[q.id][r() < 0.5 ? "S" : "P"]++;
      text = name + " locked a guess in He Said / She Said";
    } else if (roll < 0.8) {
      S.crowd.wishes++; text = name + " from " + city + " sealed a wish";
    } else if (roll < 0.87) {
      S.crowd.blessings++; text = name + " recorded a blessing";
    } else if (roll < 0.94) {
      S.crowd.boxes++; text = name + " opened today's mystery box";
    } else {
      S.crowd.players++; S.crowd.scratches++; text = name + " from " + city + " just scratched their invitation";
    }
    S.crowd.team[r() < 0.5 ? "bride" : "groom"] += 20 + ((r() * 60) | 0);
    store.feed(text);
    emit("sim");
    return text;
  };
})();
