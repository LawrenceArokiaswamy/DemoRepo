/* ==========================================================================
   Sandeep ♥ Priyanka — main app
   ========================================================================== */
(function () {
  const C = W.config, store = W.store, M = W.market;
  const $ = function (s, r) { return (r || document).querySelector(s); };
  const $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  const esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  const nf = function (n) { return Math.round(n).toLocaleString("en-IN"); };
  const pct = function (p) { return Math.round(p * 100) + "%"; };
  const I = W.icon;
  W.$ = $; W.esc = esc; W.nf = nf;

  /* ======================================================================
     Shared bits: sheet, join flow, rewards
     ====================================================================== */
  const sheet = $("#sheet"), sheetPanel = $("#sheetPanel");
  let sheetOnClose = null, pendingLevel = null;
  function openSheet(html, mount, onClose) {
    sheetPanel.innerHTML = '<button class="sheet__close" data-close aria-label="Close">' + I("x") + "</button>" + html;
    sheet.hidden = false;
    document.body.style.overflow = "hidden";
    sheetOnClose = onClose || null;
    if (mount) mount(sheetPanel);
    const f = sheetPanel.querySelector("input, textarea, button:not([data-close])");
    if (f && matchMedia("(pointer: fine)").matches) f.focus();
  }
  function closeSheet() {
    if (sheet.hidden) return;
    sheet.hidden = true;
    document.body.style.overflow = "";
    const cb = sheetOnClose; sheetOnClose = null;
    if (cb) cb();
    if (pendingLevel) { const l = pendingLevel; pendingLevel = null; setTimeout(function () { levelUp(l); }, 300); }
  }
  sheet.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) closeSheet(); });
  addEventListener("keydown", function (e) { if (e.key === "Escape") closeSheet(); });
  W.openSheet = openSheet; W.closeSheet = closeSheet;

  function needPlayer(then) {
    if (store.player()) { then && then(); return true; }
    openJoin(then);
    return false;
  }
  W.needPlayer = needPlayer;

  function openJoin(then) {
    let team = null;
    openSheet(
      '<h3>Who\'s playing?</h3><div class="sheet__body"><p>Your name goes on your invitation, the leaderboard and your reveal card.</p>' +
      '<form id="joinForm" class="sheet__body" style="margin:0" novalidate>' +
      '<div class="field"><label for="jName">Your name</label><input class="input" id="jName" maxlength="28" autocomplete="given-name" placeholder="e.g. Lakshmi" required></div>' +
      '<div class="field"><label for="jCity">Where are you joining from?</label><input class="input" id="jCity" maxlength="24" autocomplete="address-level2" placeholder="e.g. Coimbatore"></div>' +
      '<div class="field"><label>Pick your side</label><div class="team-pick">' +
      '<button type="button" class="team" data-team="groom"><b>Sandeep</b><small>Team Groom</small></button>' +
      '<button type="button" class="team" data-team="bride"><b>Priyanka</b><small>Team Bride</small></button></div></div>' +
      '<p class="rec-note" id="jErr" hidden></p>' +
      '<button class="btn btn--gold btn--block" type="submit">' + I("sparkles") + "Start playing</button></form></div>",
      function (root) {
        $$(".team", root).forEach(function (b) {
          b.addEventListener("click", function () { team = b.dataset.team; $$(".team", root).forEach(function (x) { x.classList.toggle("on", x === b); }); W.sfx.pop(); W.buzz(8); });
        });
        $("#joinForm", root).addEventListener("submit", function (e) {
          e.preventDefault();
          const name = $("#jName", root).value.trim(), city = $("#jCity", root).value.trim(), err = $("#jErr", root);
          if (!name) { err.hidden = false; err.textContent = "Add your name so the couple know who played."; return; }
          if (!team) { err.hidden = false; err.textContent = "Pick Team Groom or Team Bride."; return; }
          store.join(name, city, team);
          closeSheet();
          W.sfx.chime();
          W.toast(I("heart") + "Welcome, " + esc(name) + ". You have " + nf(C.startingCoins) + " Love Coins.");
          renderAll();
          if (then) setTimeout(then, 250);
        });
      }
    );
  }

  /* Give XP/coins with all the feedback. `el` is where the floating label starts. */
  function reward(xp, coins, el) {
    if (coins) { store.coins(coins); bump("#chipCoins"); W.sfx.coin(); }
    let res = {};
    if (xp) res = store.xp(xp);
    if (el) W.floatText(el, [xp ? "+" + xp + " XP" : "", coins ? "+" + nf(coins) + " coins" : ""].filter(Boolean).join("  ·  "));
    renderHUD();
    checkBadges();
    if (res.levelUp) setTimeout(function () { levelUp(res.level); }, 700);
  }
  W.reward = reward;
  function bump(sel) { const e = $(sel); if (!e) return; e.classList.remove("bump"); void e.offsetWidth; e.classList.add("bump"); }

  function levelUp(level) {
    if (!sheet.hidden) { pendingLevel = level; return; }
    W.sfx.fanfare(); W.buzz([20, 40, 20]); W.confetti({ count: 220, power: 1.3 });
    openSheet('<div class="levelup"><div class="levelup__badge">' + I("crown") + '</div><p class="kicker">Level up</p><h3>You\'re now</h3><p class="levelup__name foil">' + esc(level.name) + "</p>" +
      '<p style="color:var(--mist)">' + (level.next ? nf(level.next - store.player().xp) + " XP to the next level." : "The highest level there is.") + "</p>" +
      '<button class="btn btn--gold" data-close>Keep playing</button></div>');
  }

  function badge(id) {
    if (store.badge(id)) {
      const b = W.BADGES[id];
      setTimeout(function () { W.toast(I(b.icon) + "Badge unlocked: " + esc(b.name)); W.sfx.chime(); }, 400);
      return true;
    }
    return false;
  }
  function checkBadges() {
    const p = store.player(); if (!p) return;
    if (p.streak.count >= 3) badge("streak3");
    if (p.streak.count >= 7) badge("streak7");
    if (p.streak.count >= 30) badge("streak30");
    if (p.trades.length >= 5) badge("trader");
    if (p.trades.some(function (t) { return t.coins >= 500; })) badge("whale");
    if (Object.keys(p.hss).length >= C.hssQuestions.length) badge("reader");
  }

  function openTrophies() {
    const p = store.player(); if (!p) return openJoin();
    const lv = W.levelOf(p.xp);
    const items = Object.keys(W.BADGES).map(function (id) {
      const b = W.BADGES[id];
      return '<div class="trophy' + (p.badges[id] ? " got" : "") + '">' + I(b.icon) + "<b>" + esc(b.name) + "</b><small>" + esc(b.desc) + "</small></div>";
    }).join("");
    openSheet('<h3>' + esc(p.name) + "'s trophy cabinet</h3><div class=\"sheet__body\">" +
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px"><span class="kicker">' + esc(lv.name) + '</span><span style="color:var(--mist);font-size:.85rem">' + nf(p.xp) + " XP" + (lv.next ? " / " + nf(lv.next) : "") + "</span></div>" +
      '<div class="xpbar"><i style="width:' + (lv.pct * 100).toFixed(1) + '%"></i></div>' +
      (p.title ? '<p style="color:var(--mist)">Title: <b style="color:var(--gold)">' + esc(p.title) + "</b></p>" : "") +
      '<div class="trophies">' + items + "</div>" +
      '<p class="rec-note">Team ' + (p.team === "bride" ? "Bride" : "Groom") + " · joined from " + esc(p.city || "somewhere lovely") + "</p></div>");
  }

  /* ======================================================================
     HUD
     ====================================================================== */
  function renderHUD() {
    const p = store.player(), el = $("#hudRight");
    const snd = '<button class="chip chip--icon" id="chipSound" aria-label="' + (W.sound.on ? "Mute sounds" : "Turn sounds on") + '">' + I(W.sound.on ? "volume" : "mute") + "</button>";
    if (!p) {
      el.innerHTML = '<button class="btn btn--gold btn--sm" id="hudJoin">' + I("sparkles") + "Join the games</button>" + snd;
      $("#hudJoin").onclick = function () { openJoin(); };
    } else {
      const lv = W.levelOf(p.xp);
      el.innerHTML =
        '<button class="chip lvl" id="chipLvl" aria-label="Your trophies"><span class="lvl__ring" style="--p:' + lv.pct.toFixed(3) + '"><b>' + (lv.idx + 1) + '</b></span><span class="lvl__name">' + esc(p.name) + "</span></button>" +
        '<button class="chip" id="chipCoins" aria-label="Love Coins">' + I("coins") + nf(p.coins) + "</button>" +
        (p.streak.count ? '<button class="chip chip--flame" id="chipStreak" aria-label="Streak">' + I("flame") + p.streak.count + "</button>" : "") + snd;
      $("#chipLvl").onclick = openTrophies;
      $("#chipCoins").onclick = function () { location.hash = "market"; };
      if ($("#chipStreak")) $("#chipStreak").onclick = function () { location.hash = "box"; };
    }
    $("#chipSound").onclick = function () { W.setSound(!W.sound.on); renderHUD(); if (W.sound.on) W.sfx.pop(); };
  }

  /* ======================================================================
     Hero: sky, countdown
     ====================================================================== */
  function sky() {
    const cv = $("#sky"), ctx = cv.getContext("2d");
    let w, h, stars = [], petals = [], shoot = null, visible = true, d = 1;
    function size() {
      d = Math.min(devicePixelRatio || 1, 2);
      w = cv.clientWidth; h = cv.clientHeight; cv.width = w * d; cv.height = h * d; ctx.setTransform(d, 0, 0, d, 0, 0);
      stars = Array.from({ length: Math.round(w * h / 5000) }, function () { return { x: Math.random() * w, y: Math.random() * h * 0.75, r: Math.random() * 1.3 + 0.2, p: Math.random() * 6, s: 0.5 + Math.random() * 1.5 }; });
      petals = Array.from({ length: Math.min(26, Math.round(w / 50)) }, newPetal);
    }
    function newPetal() { return { x: Math.random() * w, y: Math.random() * h - h, vy: 0.25 + Math.random() * 0.5, vx: (Math.random() - 0.5) * 0.3, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.02, s: 3 + Math.random() * 4, wob: Math.random() * 6, c: Math.random() < 0.75 ? "255,250,240" : "244,162,59" }; }
    function frame(t) {
      if (!visible) return requestAnimationFrame(frame);
      ctx.clearRect(0, 0, w, h);
      stars.forEach(function (s) {
        const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t / 1000 * s.s + s.p));
        ctx.globalAlpha = a; ctx.fillStyle = "#fff8e7"; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 7); ctx.fill();
      });
      if (!shoot && Math.random() < 0.003) shoot = { x: Math.random() * w * 0.7, y: Math.random() * h * 0.3, l: 0 };
      if (shoot) {
        shoot.l += 1;
        const x = shoot.x + shoot.l * 9, y = shoot.y + shoot.l * 3.5, g = ctx.createLinearGradient(x - 120, y - 46, x, y);
        g.addColorStop(0, "rgba(255,243,196,0)"); g.addColorStop(1, "rgba(255,243,196,.9)");
        ctx.globalAlpha = Math.max(0, 1 - shoot.l / 50); ctx.strokeStyle = g; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x - 120, y - 46); ctx.lineTo(x, y); ctx.stroke();
        if (shoot.l > 50) shoot = null;
      }
      petals.forEach(function (p, i) {
        p.y += p.vy; p.x += p.vx + Math.sin((t / 1000) + p.wob) * 0.25; p.r += p.vr;
        if (p.y > h + 10) petals[i] = Object.assign(newPetal(), { y: -10 });
        ctx.save(); ctx.globalAlpha = 0.75; ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = "rgba(" + p.c + ",.85)";
        ctx.beginPath(); ctx.ellipse(0, 0, p.s * 0.45, p.s, 0, 0, 7); ctx.fill(); ctx.restore();
      });
      ctx.globalAlpha = 1;
      if (!W.reduceMotion) requestAnimationFrame(frame);
    }
    size(); addEventListener("resize", size);
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(cv);
    requestAnimationFrame(frame);
  }

  function nextTarget() {
    const n = W.now();
    if (n < W.T.reception) return { t: W.T.reception, label: "until the reception begins" };
    if (n < W.T.wedding) return { t: W.T.wedding, label: "until the wedding" };
    if (n < W.T.reveal) return { t: W.T.reveal, label: "until the vault opens" };
    return null;
  }
  function split(ms) {
    ms = Math.max(0, ms);
    return { d: Math.floor(ms / 864e5), h: Math.floor(ms / 36e5) % 24, m: Math.floor(ms / 6e4) % 60, s: Math.floor(ms / 1e3) % 60 };
  }
  const pad = function (n) { return String(n).padStart(2, "0"); };
  function countdown() {
    const el = $("#countdown"), lab = $(".countdown__label");
    const units = [["d", "Days"], ["h", "Hours"], ["m", "Minutes"], ["s", "Seconds"]];
    el.innerHTML = units.map(function (u) { return '<div class="cd"><div class="cd__num"><span data-u="' + u[0] + '">--</span></div><div class="cd__unit">' + u[1] + "</div></div>"; }).join("");
    function tick() {
      const tg = nextTarget();
      if (!tg) { lab.textContent = "The vault is open. See what everyone guessed."; el.hidden = true; return; }
      lab.textContent = tg.label;
      const s = split(tg.t - W.now());
      units.forEach(function (u) {
        const span = el.querySelector('[data-u="' + u[0] + '"]'), v = u[0] === "d" ? String(s.d) : pad(s[u[0]]);
        if (span.textContent !== v) { span.textContent = v; span.classList.remove("flip"); void span.offsetWidth; span.classList.add("flip"); }
      });
    }
    tick(); setInterval(tick, 1000);
  }

  /* ======================================================================
     Scratch-card invitation
     ====================================================================== */
  function renderScratch() {
    const stage = $("#scratchStage"), p = store.player();
    // The pull must exist before the foil is painted, so it is already under the gold.
    if (p && !p.scratch) store.scratchPull();
    const total = C.perks.reduce(function (a, b) { return a + b.weight; }, 0);
    const tiers = {};
    C.perks.forEach(function (k) { tiers[k.tier] = (tiers[k.tier] || 0) + k.weight; });
    const revealed = p && p.scratch && p.scratch.revealed;
    const perk = p && p.scratch ? C.perks[p.scratch.perkIdx] : null;

    const cardInner = p && perk ?
      '<p class="ic-dear">Dear ' + esc(p.name) + ",</p>" +
      '<p class="ic-line">together with their families, you are warmly invited to celebrate the wedding of</p>' +
      '<p class="ic-names foil">Sandeep &amp; Priyanka</p>' +
      '<p class="ic-line">Reception · Wed 27 Jan, 6 PM<br>Wedding · Thu 28 Jan, morning<br>Shelter Beach Resorts, Mahabalipuram</p>' +
      '<div class="ic-perk"><span class="tier tier--' + perk.tier + '">' + perk.tier + '</span><span class="ic-perk__icon">' + I(perk.icon) + '</span><span class="ic-perk__title">' + esc(perk.title) + '</span><span class="ic-perk__text">' + esc(perk.text) + "</span></div>"
      :
      '<p class="ic-dear">Dear guest,</p><p class="ic-names foil">Sandeep &amp; Priyanka</p><p class="ic-line">Tell us your name to unlock your card.</p>';

    stage.innerHTML =
      '<div class="card-wrap' + (revealed ? " is-revealed tier-" + perk.tier : "") + '" id="cardWrap"><div class="card-glow"></div>' +
      '<div class="invite-card" id="inviteCard"><div class="invite-card__frame"></div><div class="invite-card__body">' + cardInner + "</div>" +
      (revealed ? "" : '<canvas class="scratch-canvas" id="scratchCv" aria-label="Scratch card. Drag to scratch."></canvas><div class="scratch-hint" id="scratchHint">' + I("sparkles") + (p ? "Scratch with your finger" : "Tap to begin") + "</div>") +
      "</div></div>" +
      '<div class="scratch-side">' +
      (revealed ?
        '<p class="kicker">' + I("check") + "Revealed</p><h3 style=\"font:500 var(--step-3)/1.05 var(--f-display)\">You pulled <em class=\"foil\" style=\"font-style:italic\">" + esc(perk.title) + "</em></h3>" +
        '<p class="lede">' + nf(store.state.crowd.scratches) + " guests have scratched their card so far. Your next stop is today's mystery box.</p>" +
        '<div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn--gold" href="#box">' + I("gift") + 'Open today\'s box</a><button class="btn btn--ghost" id="shareInvite">' + I("share") + "Invite a friend</button></div>"
        :
        '<p class="lede">What could be under the foil:</p><ul class="odds">' +
        ["common", "rare", "epic", "legendary"].map(function (t) { return '<li><span class="tier tier--' + t + '">' + t + "</span><b>" + Math.round(tiers[t] / total * 100) + "%</b></li>"; }).join("") +
        "</ul><p class=\"fineprint\">One card per guest. Your prize was sealed under the foil the moment your card was made.</p>") +
      "</div>";

    if (revealed) { tilt($("#cardWrap"), $("#inviteCard")); const sh = $("#shareInvite"); if (sh) sh.onclick = share; return; }
    paintFoil();
  }

  function paintFoil() {
    const cv = $("#scratchCv"), card = $("#inviteCard"); if (!cv) return;
    const ctx = cv.getContext("2d", { willReadFrequently: true });
    const r = card.getBoundingClientRect(), d = Math.min(devicePixelRatio || 1, 2);
    cv.width = r.width * d; cv.height = r.height * d; ctx.scale(d, d);
    const w = r.width, h = r.height;
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#8a6324"); g.addColorStop(.25, "#f6e3a8"); g.addColorStop(.45, "#c99a45"); g.addColorStop(.6, "#fff3c4"); g.addColorStop(.8, "#a87a2e"); g.addColorStop(1, "#e8c987");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < w * h / 18; i++) { ctx.fillStyle = "rgba(" + (Math.random() < .5 ? "255,255,255," : "90,60,20,") + Math.random() * 0.12 + ")"; ctx.fillRect(Math.random() * w, Math.random() * h, 1.2, 1.2); }
    ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 1;
    for (let x = -h; x < w; x += 14) { ctx.beginPath(); ctx.moveTo(x, h); ctx.lineTo(x + h, 0); ctx.stroke(); }
    ctx.strokeStyle = "rgba(90,60,20,.45)"; ctx.lineWidth = 1.2; ctx.strokeRect(16, 16, w - 32, h - 32); ctx.strokeRect(22, 22, w - 44, h - 44);
    ctx.textAlign = "center"; ctx.fillStyle = "rgba(70,45,10,.75)";
    ctx.font = "400 " + Math.round(w / 6) + "px 'Pinyon Script', cursive"; ctx.fillText("S & P", w / 2, h * 0.44);
    ctx.font = "600 " + Math.max(11, Math.round(w / 30)) + "px Cinzel, Georgia, serif"; ctx.fillText("S C R A T C H   T O   R E V E A L", w / 2, h * 0.53);
    ctx.font = "500 " + Math.max(10, Math.round(w / 36)) + "px Cinzel, Georgia, serif"; ctx.fillText("27 · 28 · I · MMXXVII", w / 2, h * 0.59);

    let down = false, last = null, moves = 0, done = false;
    const p = function (e) { const b = cv.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
    function scratchAt(a, b) {
      ctx.globalCompositeOperation = "destination-out"; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.lineWidth = Math.max(36, w / 9);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    }
    function cleared() {
      const data = ctx.getImageData(0, 0, cv.width, cv.height).data; let c = 0, n = 0;
      for (let i = 3; i < data.length; i += 4 * 37) { n++; if (data[i] < 30) c++; }
      return c / n;
    }
    cv.addEventListener("pointerdown", function (e) {
      if (!store.player()) { openJoin(); return; }
      down = true; last = p(e); cv.setPointerCapture(e.pointerId); const hint = $("#scratchHint"); if (hint) hint.remove();
      scratchAt(last, { x: last.x + .1, y: last.y });
    });
    cv.addEventListener("pointermove", function (e) {
      if (!down || done) return;
      const q = p(e); scratchAt(last, q); last = q;
      if (++moves % 3 === 0) { W.sfx.tick(); W.buzz(4); }
      if (moves % 8 === 0 && cleared() > 0.5) finish();
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach(function (ev) { cv.addEventListener(ev, function () { down = false; if (!done && moves > 4 && cleared() > 0.5) finish(); }); });
    function finish() {
      done = true; cv.classList.add("done");
      store.scratchReveal();
      const perk = C.perks[store.player().scratch.perkIdx];
      const big = perk.tier === "legendary" || perk.tier === "epic";
      W.sfx.chime(); if (big) setTimeout(W.sfx.fanfare, 400); W.buzz(big ? [30, 50, 30, 50, 60] : [20, 30, 20]);
      W.confettiFrom(card, { count: big ? 320 : 160, power: big ? 1.4 : 1 });
      if (big) setTimeout(W.rain, 500);
      setTimeout(function () {
        badge("invited"); if (big) badge("lucky");
        reward(perk.xp + 50, 0, card);
        renderScratch(); renderHUD();
      }, 900);
    }
  }

  function tilt(wrap, card) {
    if (W.reduceMotion || !matchMedia("(pointer: fine)").matches) return;
    wrap.addEventListener("pointermove", function (e) {
      const b = wrap.getBoundingClientRect(), x = (e.clientX - b.left) / b.width - .5, y = (e.clientY - b.top) / b.height - .5;
      card.style.transform = "rotateY(" + x * 10 + "deg) rotateX(" + -y * 10 + "deg)";
    });
    wrap.addEventListener("pointerleave", function () { card.style.transform = ""; });
  }

  function share() {
    const url = location.href.split("#")[0];
    const text = "Sandeep & Priyanka's wedding games are live. Scratch your invitation and seal your guesses before the vault opens on 29 Jan! " + url;
    if (navigator.share) { navigator.share({ title: "Sandeep & Priyanka", text: text, url: url }).catch(function () {}); return; }
    const wa = "https://wa.me/?text=" + encodeURIComponent(text);
    openSheet('<h3>Invite a friend</h3><div class="sheet__body"><p>Send this to family and friends:</p><textarea class="input" id="shareText" readonly>' + esc(text) + '</textarea>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn--gold" href="' + wa + '" target="_blank" rel="noopener">' + I("send") + 'Share on WhatsApp</a><button class="btn btn--ghost" id="copyShare">' + I("check") + "Copy text</button></div></div>",
      function (root) {
        $("#copyShare", root).onclick = function () {
          const ta = $("#shareText", root);
          (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { W.toast(I("check") + "Copied"); }, function () { ta.select(); });
        };
      });
  }
  W.share = share;

  /* ======================================================================
     Events & timeline
     ====================================================================== */
  function gcal(title, start, hours, details) {
    const f = function (t) { return new Date(t).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); };
    return "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(title) + "&dates=" + f(start) + "/" + f(start + hours * 36e5) +
      "&details=" + encodeURIComponent(details) + "&location=" + encodeURIComponent(C.venue.name + ", " + C.venue.address);
  }
  function renderEvents() {
    const ev = [
      { k: "Evening", title: "Reception", t: W.T.reception, day: "27", dow: "Wednesday", time: "From 6:00 PM", hours: 5, icon: "moon",
        note: "Dinner, music and the first dance by the sea." },
      { k: "Morning", title: "Wedding", t: W.T.wedding, day: "28", dow: "Thursday", time: C.dates.weddingTimeAnnounced ? new Date(W.T.wedding).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "Muhurtham time to be announced", hours: 4, icon: "sun",
        note: "The muhurtham. All games lock at this moment." },
    ];
    $("#eventCards").innerHTML = ev.map(function (e) {
      const days = Math.ceil((e.t - W.now()) / 864e5);
      return '<article class="panel panel--temple event"><div class="event__art"></div>' +
        '<div class="event__label"><span class="kicker">' + I(e.icon) + e.k + '</span><span class="event__count">' + (days > 0 ? days + " days to go" : "") + "</span></div>" +
        "<h3>" + e.title + "</h3>" +
        '<div class="event__date"><span class="event__day foil">' + e.day + '</span><div class="event__meta"><b>' + e.dow + ", January 2027</b><span>" + esc(e.time) + "</span></div></div>" +
        '<p style="color:var(--mist);font-family:var(--f-display);font-size:var(--step-1)">' + e.note + "</p>" +
        '<div class="event__where">' + I("pin") + "<span><b style=\"color:var(--jasmine)\">" + esc(C.venue.name) + "</b><br>" + esc(C.venue.address) + "</span></div>" +
        '<div class="event__actions"><a class="btn btn--ghost btn--sm" href="' + C.venue.maps + '" target="_blank" rel="noopener">' + I("pin") + "Directions</a>" +
        '<a class="btn btn--ghost btn--sm" href="' + gcal("Sandeep & Priyanka · " + e.title, e.t, e.hours, e.note) + '" target="_blank" rel="noopener">' + I("calendar") + "Add to calendar</a></div></article>";
    }).join("");

    const steps = [
      { when: "Now", what: "Games are open", t: 0 },
      { when: "27 Jan · 6 PM", what: "Reception", t: W.T.reception },
      { when: "28 Jan · Morning", what: "Wedding · games lock", t: W.T.wedding },
      { when: "29 Jan · 12 AM", what: "The vault opens", t: W.T.reveal },
      { when: "28 Jan 2028", what: "Anniversary letters open", t: Date.parse("2028-01-28T00:00:00+05:30") },
    ];
    const n = W.now(); let cur = 0; steps.forEach(function (s, i) { if (n >= s.t) cur = i; });
    $("#timeline").innerHTML = steps.map(function (s, i) {
      return '<li class="tl' + (i < cur ? " is-past" : i === cur ? " is-now" : "") + '"><span class="tl__dot"></span><span class="tl__text"><span class="tl__when">' + s.when + '</span><span class="tl__what">' + s.what + "</span></span></li>";
    }).join("");
  }

  /* ======================================================================
     Game nav
     ====================================================================== */
  function renderNav() {
    const p = store.player(), b = store.boxToday();
    const hssDone = p ? Object.keys(p.hss).length : 0;
    const items = [
      { id: "box", icon: "gift", t: "Mystery Box", s: "A new box every day. Keep your streak alive.", st: p && b.opened ? ["done", "Opened today"] : ["", "Ready to open"] },
      { id: "market", icon: "up", t: "Love Stock Market", s: "Bet Love Coins on what happens at the wedding.", st: p && p.trades.length ? ["done", p.trades.length + " bets placed"] : ["", nf(store.state.crowd.trades) + " trades so far"] },
      { id: "hss", icon: "heart", t: "He Said, She Said", s: "Guess what the couple answered in secret.", st: hssDone >= C.hssQuestions.length ? ["done", "All sealed"] : ["", hssDone + " / " + C.hssQuestions.length + " guessed"] },
      { id: "bless", icon: "mic", t: "Blessings", s: "Record a voice blessing or seal a wish.", st: p && (p.blessings.length || p.wishes.length) ? ["done", "Sealed"] : ["", nf(store.state.crowd.wishes + store.state.crowd.blessings) + " sealed"] },
    ];
    $("#gameNav").innerHTML = items.map(function (g) {
      return '<a class="gn" href="#' + g.id + '"><span class="gn__icon">' + I(g.icon) + '</span><span class="gn__title">' + g.t + '</span><span class="gn__sub">' + g.s + '</span><span class="gn__state ' + g.st[0] + '">' + g.st[1] + "</span></a>";
    }).join("");
  }

  /* ======================================================================
     Daily mystery box
     ====================================================================== */
  function nextMidnight() { return Date.parse(W.dayKey() + "T00:00:00+05:30") + 864e5; }
  function renderStreak() {
    const p = store.player(), el = $("#streak");
    const count = p ? p.streak.count : 0, alive = p && (p.streak.last === W.dayKey() || p.streak.last === W.dayKey(W.now() - 864e5));
    let week = "";
    for (let i = 6; i >= 0; i--) { const k = W.dayKey(W.now() - i * 864e5); week += '<span class="' + (p && p.boxes[k] != null ? "on" : "") + (i === 0 ? " today" : "") + '" title="' + k + '"></span>'; }
    el.innerHTML = '<div class="streak__row"><div class="streak__flame' + (alive && count ? " lit" : "") + '">' + I("flame") + '</div><div><div class="streak__num">' + (alive ? count : 0) + "-day streak</div>" +
      '<div class="streak__sub">' + (p ? "Best: " + p.streak.best + (p.streak.best === 1 ? " day · " : " days · ") : "") + "Badges at 3, 7 and 30 days</div></div></div>" +
      '<div class="week" aria-label="Last 7 days">' + week + "</div>";
  }
  let boxTimer = null;
  function renderBox() {
    renderStreak();
    const stage = $("#boxStage"), p = store.player(), b = store.boxToday();
    clearInterval(boxTimer);
    if (W.gamesLocked()) { stage.innerHTML = '<div class="reward"><h3>The boxes are all opened</h3><p>The games are locked. See you when the vault opens.</p></div>'; return; }
    if (p && b.opened) {
      const box = C.mysteryBoxes[p.boxes[b.day]];
      stage.innerHTML = '<div class="reward" style="animation:none"><span class="tier tier--' + box.tier + '">' + box.tier + '</span><h3>Today\'s box: ' + esc(box.title) + "</h3><p>Opened. The next box appears at midnight.</p>" +
        '<div class="reward__big" id="boxNext">--:--:--</div><p class="rec-note">until the next box</p></div>';
      const tickNext = function () { const s = split(nextMidnight() - W.now()); const el = $("#boxNext"); if (el) el.textContent = pad(s.h + s.d * 24) + ":" + pad(s.m) + ":" + pad(s.s); if (nextMidnight() - W.now() <= 0) renderBox(); };
      tickNext(); boxTimer = setInterval(tickNext, 1000);
      return;
    }
    stage.innerHTML = '<button class="gift idle" id="gift" aria-label="Open today\'s mystery box"><span class="gift__base"></span><span class="gift__lid"><span class="gift__bow"></span></span></button>' +
      '<div class="box-cta"><span>' + (p ? "Tap the box to open it" : "Join the games to open your first box") + "</span><span><b>" + nf(store.state.crowd.boxes) + "</b> boxes opened by guests</span></div>";
    $("#gift").onclick = function () { needPlayer(openBox); };
  }
  function openBox() {
    const g = $("#gift"); if (!g || g.dataset.busy) return; g.dataset.busy = 1;
    g.classList.remove("idle"); g.classList.add("shake");
    let k = 0; const t = setInterval(function () { W.sfx.tick(); W.buzz(10); if (++k > 8) clearInterval(t); }, 150);
    setTimeout(function () {
      const box = store.openBox();
      if (!box) { renderBox(); return; }
      g.classList.remove("shake"); g.classList.add("open");
      W.sfx.whoosh(); setTimeout(W.sfx.chime, 150); W.buzz([20, 40, 30]);
      W.confettiFrom(g, { count: box.tier === "epic" ? 260 : 150, power: 1.2 });
      setTimeout(function () { showBoxReward(box); }, 450);
    }, 1400);
  }
  function teaser(kind) {
    const c = store.state.crowd;
    if (kind === "hssLean") {
      let best = null;
      C.hssQuestions.forEach(function (q) { const v = c.hss[q.id], n = v.S + v.P; if (!n) return; const lean = Math.max(v.S, v.P) / n; if (!best || lean > best.lean) best = { q: q, lean: lean, who: v.S >= v.P ? "Sandeep" : "Priyanka", n: n }; });
      return best ? Math.round(best.lean * 100) + "% of guests answered <b>" + best.who + "</b> to “" + esc(best.q.q) + "” The couple's real answers stay sealed until the 29th." : "Guesses are still coming in.";
    }
    let hot = null;
    C.markets.forEach(function (mk) { const m = c.markets[mk.id]; if (!hot || m.vol > hot.m.vol) hot = { mk: mk, m: m }; });
    return "The most traded call right now is “" + esc(hot.mk.q) + "”, trading at <b>" + pct(M.price(hot.m)) + " YES</b>.";
  }
  function showBoxReward(box) {
    const stage = $("#boxStage"), card = document.createElement("div");
    card.className = "reward";
    let html = '<span class="tier tier--' + box.tier + '">' + box.tier + "</span><h3>" + esc(box.title) + "</h3>";
    let auto = null;
    if (box.type === "coins") { html += '<div class="reward__big foil">+' + nf(box.amount) + "</div><p>Love Coins added to your portfolio.</p>"; auto = [10, box.amount]; }
    else if (box.type === "xp") { html += '<div class="reward__big foil">+' + box.amount + " XP</div><p>" + esc(box.text) + "</p>"; auto = [box.amount, 0]; }
    else if (box.type === "fact") { html += "<p style=\"font:400 var(--step-1)/1.5 var(--f-display);color:var(--jasmine)\">" + esc(box.text) + "</p>"; auto = [box.xp, 0]; }
    else if (box.type === "stat") { html += '<p class="teaser" style="text-align:left">' + teaser(box.stat) + "</p>"; auto = [box.xp, 0]; }
    else if (box.type === "trivia") {
      html += "<p style=\"font:500 var(--step-1)/1.35 var(--f-display);color:var(--jasmine)\">" + esc(box.q) + '</p><div class="reward__opts">' +
        box.options.map(function (o, i) { return '<button class="opt" data-i="' + i + '">' + esc(o) + "</button>"; }).join("") + "</div>";
    }
    html += '<button class="btn btn--ghost btn--sm" id="boxDone"' + (box.type === "trivia" ? " hidden" : "") + ">Collect</button>";
    card.innerHTML = html;
    stage.innerHTML = ""; stage.appendChild(card);
    const done = $("#boxDone", card);
    if (auto) setTimeout(function () { reward(auto[0], auto[1], card); }, 350);
    if (box.type === "trivia") {
      $$(".opt", card).forEach(function (b) {
        b.onclick = function () {
          const i = +b.dataset.i, right = i === box.answer;
          $$(".opt", card).forEach(function (x) { x.disabled = true; if (+x.dataset.i === box.answer) x.classList.add("right"); });
          if (!right) { b.classList.add("wrong"); W.sfx.nope(); W.buzz([40, 30, 40]); reward(10, 0, b); }
          else { W.sfx.chime(); W.confettiFrom(b, { count: 90 }); badge("trivia"); reward(box.xp, 0, b); }
          done.hidden = false;
        };
      });
    }
    done.onclick = function () { renderBox(); renderNav(); };
    renderStreak(); renderHUD(); renderNav();
  }

  /* ======================================================================
     Love Stock Market
     ====================================================================== */
  const lastPrice = {};
  function spark(hist, up) {
    const w = 300, h = 46, n = hist.length, mn = Math.min.apply(null, hist) - .02, mx = Math.max.apply(null, hist) + .02;
    const pts = hist.map(function (v, i) { return [(i / (n - 1)) * w, h - 4 - ((v - mn) / (mx - mn)) * (h - 8)]; });
    const line = pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    const col = up ? "var(--jade)" : "#ff8a8f", id = "sg" + Math.random().toString(36).slice(2, 7), end = pts[n - 1];
    return '<svg class="mk__spark" viewBox="0 0 ' + w + " " + h + '" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="' + col + '" stop-opacity=".28"/><stop offset="1" stop-color="' + col + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="' + line + " L" + w + " " + h + " L0 " + h + ' Z" fill="url(#' + id + ')"/><path d="' + line + '" fill="none" stroke="' + col + '" stroke-width="1.8" vector-effect="non-scaling-stroke"/>' +
      '<circle cx="' + end[0] + '" cy="' + end[1] + '" r="3" fill="' + col + '"/></svg>';
  }
  function myPos(id) {
    const p = store.player(), r = { yes: 0, no: 0, coins: 0 };
    if (!p) return r;
    p.trades.forEach(function (t) { if (t.id === id) { r[t.side] += t.shares; r.coins += t.coins; } });
    return r;
  }
  function renderMarkets() {
    const c = store.state.crowd, wrap = $("#markets");
    if (!wrap.children.length) {
      wrap.innerHTML = C.markets.map(function (mk) { return '<button class="mk" data-id="' + mk.id + '"></button>'; }).join("");
      $$(".mk", wrap).forEach(function (b) { b.onclick = function () { needPlayer(function () { openTrade(b.dataset.id); }); }; });
    }
    C.markets.forEach(function (mk) {
      const m = c.markets[mk.id], p = M.price(m), chg = (p - m.open) * 100, el = wrap.querySelector('[data-id="' + mk.id + '"]'), pos = myPos(mk.id);
      el.innerHTML = '<span class="mk__q"><span class="mk__tag">' + esc(mk.tag) + "</span><strong>" + esc(mk.q) + "</strong></span>" +
        '<span class="mk__price"><span class="mk__pct">' + pct(p) + '</span><span class="mk__chg ' + (chg >= 0 ? "up" : "down") + '">' + I(chg >= 0 ? "up" : "down") + (chg >= 0 ? "+" : "") + chg.toFixed(1) + " pts</span></span>" +
        spark(m.hist, chg >= 0) +
        '<span class="mk__foot"><span>Vol ' + nf(m.vol) + "</span>" +
        (pos.coins ? '<span class="mk__mine">You: ' + (pos.yes ? nf(pos.yes) + " YES " : "") + (pos.no ? nf(pos.no) + " NO" : "") + "</span>" : '<span class="bar2"><i style="width:' + (p * 100).toFixed(1) + '%"></i></span>') + "</span>";
      if (lastPrice[mk.id] != null && Math.abs(lastPrice[mk.id] - p) > 0.0005) {
        el.classList.remove("flash-up", "flash-down"); void el.offsetWidth; el.classList.add(p > lastPrice[mk.id] ? "flash-up" : "flash-down");
      }
      lastPrice[mk.id] = p;
    });
    renderPortfolio();
  }
  function renderPortfolio() {
    const p = store.player();
    let pay = 0, n = 0;
    if (p) C.markets.forEach(function (mk) { const pos = myPos(mk.id); if (pos.coins) { n++; pay += Math.max(pos.yes, pos.no); } });
    $("#portfolio").innerHTML =
      '<div class="stat"><span class="stat__label">Love Coins</span><span class="stat__val">' + (p ? nf(p.coins) : nf(C.startingCoins)) + "</span></div>" +
      '<div class="stat"><span class="stat__label">Markets in</span><span class="stat__val">' + n + " / " + C.markets.length + "</span></div>" +
      '<div class="stat"><span class="stat__label">Best case</span><span class="stat__val foil">' + nf(pay) + "</span></div>";
  }
  function openTrade(id) {
    if (W.gamesLocked()) { W.toast(I("lock") + "Trading closed at the muhurtham."); return; }
    const mk = C.markets.find(function (x) { return x.id === id; }), m = store.state.crowd.markets[id], p = store.player();
    let side = "yes", amt = Math.min(100, p.coins);
    openSheet('<p class="kicker">' + esc(mk.tag) + "</p><h3>" + esc(mk.q) + '</h3><div class="sheet__body trade">' +
      '<div class="seg"><button data-side="yes" class="on">YES<small>' + pct(M.price(m)) + '</small></button><button data-side="no">NO<small>' + pct(1 - M.price(m)) + "</small></button></div>" +
      '<div class="amount"><div class="amount__val"><span id="amtV">0</span><small>coins</small></div>' +
      '<input type="range" id="amtR" min="10" max="' + Math.max(10, p.coins) + '" step="10" value="' + amt + '" aria-label="Amount">' +
      '<div class="quick"><button data-q="50">50</button><button data-q="100">100</button><button data-q="250">250</button><button data-q="all">All in</button></div></div>' +
      '<div class="payout"><span id="payLbl"></span><b id="payV">0</b></div>' +
      '<button class="btn btn--gold btn--block" id="placeBet">' + I("zap") + "Place bet</button>" +
      '<p class="rec-note">You have ' + nf(p.coins) + " coins. Bets are final and the result is sealed until 29 January.</p></div>",
      function (root) {
        const upd = function () {
          $("#amtV", root).textContent = nf(amt);
          const sh = M.quote(m, side, amt);
          $("#payLbl", root).textContent = "If " + side.toUpperCase() + " happens, you get";
          W.countTo($("#payV", root), sh, 250);
          $("#placeBet", root).disabled = amt <= 0 || amt > p.coins;
        };
        $$(".seg button", root).forEach(function (b) { b.onclick = function () { side = b.dataset.side; $$(".seg button", root).forEach(function (x) { x.classList.toggle("on", x === b); }); W.sfx.pop(); upd(); }; });
        $("#amtR", root).oninput = function (e) { amt = +e.target.value; upd(); };
        $$(".quick button", root).forEach(function (b) { b.onclick = function () { amt = b.dataset.q === "all" ? p.coins : Math.min(+b.dataset.q, p.coins); $("#amtR", root).value = amt; W.sfx.tick(); upd(); }; });
        $("#placeBet", root).onclick = function () {
          if (p.coins <= 0) return;
          const first = !myPos(id).coins;
          const sh = store.trade(id, side, amt);
          closeSheet();
          const card = $('.mk[data-id="' + id + '"]');
          W.sfx.coin(); W.buzz([15, 30, 15]);
          if (card) W.confettiFrom(card, { count: 70, power: .7 });
          W.toast(I("up") + "Bet placed: " + nf(sh) + " " + side.toUpperCase() + " shares");
          renderMarkets(); renderNav(); renderVault();
          reward(first ? 30 : 10, 0, card);
        };
        upd();
      });
  }

  /* ======================================================================
     He Said / She Said
     ====================================================================== */
  let hssIdx = null;
  function renderHSS() {
    const stage = $("#hssStage"), p = store.player(), Q = C.hssQuestions;
    const answered = p ? p.hss : {};
    if (hssIdx == null) { hssIdx = Q.findIndex(function (q) { return !answered[q.id]; }); }
    const all = Q.every(function (q) { return answered[q.id]; });
    const crowdN = Q.reduce(function (a, q) { const v = store.state.crowd.hss[q.id]; return a + v.S + v.P; }, 0);
    let left;
    if (W.gamesLocked()) left = '<div class="panel hss-done"><h3>Guessing is closed</h3><p style="color:var(--mist)">All answers are sealed in the vault.</p></div>';
    else if (hssIdx < 0 || (all && hssIdx >= Q.length)) {
      left = '<div class="panel panel--temple hss-done" style="min-height:360px">' + '<span class="levelup__badge" style="width:84px;height:84px">' + I("heart") + "</span><h3>All " + Q.length + " guesses sealed</h3>" +
        '<p style="color:var(--mist);max-width:36ch">You and ' + nf(crowdN) + " other guesses are locked away. You can change a guess until the muhurtham.</p>" +
        '<button class="btn btn--ghost btn--sm" id="hssAgain">Review my guesses</button></div>';
    } else {
      const cards = [];
      for (let k = 2; k >= 0; k--) {
        const i = hssIdx + k; if (i >= Q.length) continue;
        const q = Q[i];
        cards.push('<div class="qcard' + (k ? " behind-" + k : "") + '" data-i="' + i + '"><div class="qcard__n"><span>Question ' + (i + 1) + " of " + Q.length + "</span><span>" + I("lock") + " sealed</span></div>" +
          '<p class="qcard__q">' + esc(q.q) + "</p>" +
          '<div class="qcard__who"><button class="who who--s' + (answered[q.id] === "S" ? " picked" : "") + '" data-who="S"' + (k ? ' tabindex="-1"' : "") + '><span class="who__av">S</span><span class="who__name">Sandeep</span></button>' +
          '<button class="who who--p' + (answered[q.id] === "P" ? " picked" : "") + '" data-who="P"' + (k ? ' tabindex="-1"' : "") + '><span class="who__av">P</span><span class="who__name">Priyanka</span></button></div></div>');
      }
      left = '<div class="qcard-stack">' + cards.join("") + "</div>";
    }
    const done = Object.keys(answered).length;
    const right = '<div class="hss-side"><div class="hss-prog">' + Q.map(function (q, i) { return '<button class="' + (answered[q.id] ? "done" : "") + (i === hssIdx ? " cur" : "") + '" data-go="' + i + '" aria-label="Question ' + (i + 1) + '">' + (i + 1) + "</button>"; }).join("") + "</div>" +
      '<div class="stat"><span class="stat__label">Your guesses</span><span class="stat__val">' + done + " / " + Q.length + "</span></div>" +
      '<ul class="sealed-list">' +
      '<li>' + I("lock") + "<span>Sandeep's answers</span><b>Sealed</b></li>" +
      '<li>' + I("lock") + "<span>Priyanka's answers</span><b>Sealed</b></li>" +
      '<li>' + I("users") + "<span>Guesses from all guests</span><b>" + nf(crowdN) + "</b></li></ul>" +
      '<p class="fineprint">On the 29th you\'ll see what each of them said, whether they agreed with each other, and how many you got right.</p></div>';
    stage.innerHTML = left + right;

    $$(".qcard:not([class*=behind]) .who", stage).forEach(function (b) {
      b.onclick = function () {
        needPlayer(function () {
          const i = +b.closest(".qcard").dataset.i, q = Q[i];
          const first = store.hss(q.id, b.dataset.who);
          b.classList.add("picked"); W.sfx.pop(); W.buzz(12);
          const card = b.closest(".qcard");
          card.classList.add(b.dataset.who === "S" ? "fly-left" : "fly-right");
          if (first) reward(20, 0, b);
          setTimeout(function () {
            const ans = store.player().hss;
            const nxt = Q.findIndex(function (qq, j) { return j > i && !ans[qq.id]; });
            const any = Q.findIndex(function (qq) { return !ans[qq.id]; });
            hssIdx = nxt >= 0 ? nxt : any >= 0 ? any : Q.length;
            if (hssIdx >= Q.length) { W.sfx.fanfare(); W.confetti({ count: 200 }); }
            renderHSS(); renderNav(); renderVault();
          }, 380);
        });
      };
    });
    $$("[data-go]", stage).forEach(function (b) { b.onclick = function () { hssIdx = +b.dataset.go; renderHSS(); }; });
    const again = $("#hssAgain"); if (again) again.onclick = function () { hssIdx = 0; renderHSS(); };
  }

  /* ======================================================================
     Blessings: recorder, time capsule, sealed letters
     ====================================================================== */
  let rec = null;
  function renderRecorder() {
    const el = $("#recorder"), p = store.player();
    const mine = p ? p.blessings.length : 0;
    const canRec = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
    el.innerHTML = "<h3>Voice blessing</h3><p>Up to 30 seconds. Elders, this one is especially for you. Speak in any language.</p>" +
      '<canvas class="rec-viz" id="recViz"></canvas>' +
      '<div class="rec-controls"><button class="rec-btn" id="recBtn" aria-label="Start recording">' + I("mic") + '</button><div><div class="rec-time" id="recTime">0:00 / 0:30</div><div class="rec-note" id="recNote">' + (canRec ? "Tap the button to start recording" : "Recording isn't available here. Upload a voice note instead.") + "</div></div></div>" +
      '<div id="recAfter" hidden style="display:flex;flex-direction:column;gap:12px"><audio id="recAudio" controls style="width:100%"></audio>' +
      '<div class="field"><label for="recFrom">From</label><input class="input" id="recFrom" maxlength="40" placeholder="e.g. Paati, with love"></div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap"><button class="btn btn--gold" id="recSeal">' + I("lock") + 'Seal my blessing</button><button class="btn btn--ghost" id="recRedo">Record again</button></div></div>' +
      '<label class="btn btn--ghost btn--sm" style="align-self:flex-start">' + I("upload") + 'Upload a voice note<input type="file" id="recFile" accept="audio/*" hidden></label>' +
      (mine ? '<p class="rec-note">' + I("check") + " You have sealed " + mine + " blessing" + (mine > 1 ? "s" : "") + ".</p>" : "") +
      (C.demoMode ? '<p class="rec-note">Preview mode: recordings stay on this device.</p>' : "");
    drawIdle();
    let blob = null, dur = 0;
    $("#recBtn").onclick = function () { needPlayer(function () { if (rec) stopRec(); else startRec(); }); };
    $("#recFile").onchange = function (e) {
      const f = e.target.files[0]; if (!f) return;
      needPlayer(function () { blob = f; dur = 0; showAfter(URL.createObjectURL(f)); });
    };
    function showAfter(url) { $("#recAudio").src = url; $("#recAfter").hidden = false; $("#recFrom").value = store.player() ? store.player().name : ""; }
    $("#recRedo").onclick = function () { $("#recAfter").hidden = true; blob = null; };
    $("#recSeal").onclick = function () {
      if (!blob) return;
      store.blessing({ from: $("#recFrom").value.trim() || store.player().name, dur: dur, size: blob.size });
      W.sfx.chime(); W.confettiFrom($("#recSeal"), { count: 140 });
      badge("voice"); reward(80, 0, $("#recSeal"));
      W.toast(I("lock") + "Blessing sealed until 29 January");
      renderRecorder(); renderNav(); renderVault();
    };
    function drawIdle() {
      const cv = $("#recViz"), ctx = cv.getContext("2d"), d = Math.min(devicePixelRatio || 1, 2);
      cv.width = cv.clientWidth * d; cv.height = cv.clientHeight * d; ctx.scale(d, d);
      const w = cv.clientWidth, h = cv.clientHeight, n = 48;
      for (let i = 0; i < n; i++) { const v = 4 + Math.abs(Math.sin(i * 0.45)) * 10; ctx.fillStyle = "rgba(232,201,135,.25)"; ctx.fillRect(i * (w / n) + 2, h / 2 - v / 2, w / n - 4, v); }
    }
    function startRec() {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {
        const chunks = [], mr = new MediaRecorder(stream), ac = new (window.AudioContext || window.webkitAudioContext)(), an = ac.createAnalyser();
        ac.createMediaStreamSource(stream).connect(an); an.fftSize = 128;
        const data = new Uint8Array(an.frequencyBinCount), cv = $("#recViz"), ctx = cv.getContext("2d"), w = cv.clientWidth, h = cv.clientHeight, t0 = Date.now();
        rec = { mr: mr, stream: stream, ac: ac };
        mr.ondataavailable = function (e) { chunks.push(e.data); };
        mr.onstop = function () {
          stream.getTracks().forEach(function (t) { t.stop(); }); ac.close();
          blob = new Blob(chunks, { type: mr.mimeType || "audio/webm" }); dur = (Date.now() - t0) / 1000;
          showAfter(URL.createObjectURL(blob));
          $("#recBtn").classList.remove("live"); $("#recBtn").innerHTML = I("mic"); $("#recNote").textContent = "Listen back, then seal it.";
        };
        mr.start();
        $("#recBtn").classList.add("live"); $("#recBtn").innerHTML = I("stop"); $("#recNote").textContent = "Recording… tap to stop";
        W.buzz(20);
        (function draw() {
          if (!rec) return;
          const el = (Date.now() - t0) / 1000;
          $("#recTime").textContent = "0:" + pad(Math.floor(el)) + " / 0:30";
          if (el >= 30) { stopRec(); return; }
          an.getByteFrequencyData(data);
          ctx.clearRect(0, 0, w, h);
          const n = 48;
          for (let i = 0; i < n; i++) {
            const v = Math.max(4, (data[i % data.length] / 255) * h * 0.9);
            const g = ctx.createLinearGradient(0, h / 2 - v / 2, 0, h / 2 + v / 2); g.addColorStop(0, "#f6e3a8"); g.addColorStop(1, "#e2434b");
            ctx.fillStyle = g; ctx.fillRect(i * (w / n) + 2, h / 2 - v / 2, w / n - 4, v);
          }
          requestAnimationFrame(draw);
        })();
      }).catch(function () {
        $("#recNote").textContent = "Microphone access was blocked. Allow it in your browser, or upload a voice note instead.";
        W.sfx.nope();
      });
    }
    function stopRec() { if (!rec) return; const r = rec; rec = null; r.mr.stop(); }
  }

  function renderCapsule() {
    const el = $("#capsule"), p = store.player(), n = p ? p.wishes.length : 0;
    el.innerHTML = "<h3>The time capsule</h3><p>Write a wish, a memory or some marriage advice. It opens with the vault, or on their first anniversary if you choose.</p>" +
      '<div class="field"><label for="wishText">Your wish</label><textarea class="input" id="wishText" maxlength="500" placeholder="Dear Sandeep and Priyanka…"></textarea><div class="counter" id="wishCount">0 / 500</div></div>' +
      '<label class="check"><input type="checkbox" id="wish2028">Save it for their first anniversary, 28 January 2028</label>' +
      '<button class="btn btn--gold" id="wishSeal" style="align-self:flex-start">' + I("lock") + "Seal it in the vault</button>" +
      (n ? '<p class="rec-note">' + I("check") + " You have sealed " + n + " wish" + (n > 1 ? "es" : "") + ".</p>" : "");
    const ta = $("#wishText");
    ta.oninput = function () { $("#wishCount").textContent = ta.value.length + " / 500"; };
    $("#wishSeal").onclick = function () {
      const text = ta.value.trim();
      if (text.length < 3) { ta.focus(); W.toast(I("pen") + "Write a few words first"); return; }
      needPlayer(function () {
        store.wish(text, $("#wish2028").checked);
        W.sfx.whoosh(); setTimeout(W.sfx.chime, 200); W.confettiFrom($("#wishSeal"), { count: 120 });
        badge("scribe"); reward(50, 0, $("#wishSeal"));
        W.toast(I("lock") + ($("#wish2028").checked ? "Sealed until 28 January 2028" : "Sealed until 29 January"));
        renderCapsule(); renderNav(); renderVault();
      });
    };
  }

  function renderLetters() {
    const cp = store.state.couple;
    const L = [{ from: "Sandeep", to: "Priyanka", k: "S", init: "S" }, { from: "Priyanka", to: "Sandeep", k: "P", init: "P" }];
    $("#letters").innerHTML = L.map(function (l) {
      const sealed = !!(cp[l.k].letter || C.demoMode);
      return '<button class="envelope" data-k="' + l.k + '" aria-label="Letter from ' + l.from + '"><span class="seal">' + l.init + '</span><span class="envelope__from">From ' + l.from + ", for " + l.to + '</span><span class="envelope__state">' + I(sealed ? "lock" : "pen") + (sealed ? "Sealed until 29 Jan" : "Waiting to be written") + "</span></button>";
    }).join("");
    $$(".envelope").forEach(function (e) {
      e.onclick = function () {
        e.classList.remove("nope"); void e.offsetWidth; e.classList.add("nope");
        W.sfx.nope(); W.buzz([30, 20, 30]);
        W.toast(I("lock") + (W.isRevealed() ? "Only " + (e.dataset.k === "S" ? "Priyanka" : "Sandeep") + " can open this one." : "Sealed until 29 January. Even the couple can't peek."));
      };
    });
  }

  /* ======================================================================
     Vault
     ====================================================================== */
  function renderVault() {
    const c = store.state.crowd, sealed = store.sealedCount(), goal = Math.max(5000, Math.ceil(sealed / 1000) * 1000 + 1000);
    const hssN = C.hssQuestions.reduce(function (a, q) { return a + c.hss[q.id].S + c.hss[q.id].P; }, 0);
    let count = $("#vaultCount b");
    if (!count) { $("#vaultCount").innerHTML = "<b>0</b><span>secrets sealed inside</span>"; count = $("#vaultCount b"); }
    W.countTo(count, sealed, 900);
    const s = split(W.T.reveal - W.now());
    $("#pressure").innerHTML = '<div class="pressure__bar"><i style="width:' + Math.min(100, sealed / goal * 100).toFixed(1) + '%"></i></div>' +
      '<div class="pressure__meta"><span>Vault pressure ' + Math.round(sealed / goal * 100) + "%</span><span>" + (W.isRevealed() ? "Open now" : s.d + "d " + s.h + "h until it opens") + "</span></div>" +
      '<div class="vault-grid">' +
      '<div class="stat"><span class="stat__label">Players</span><span class="stat__val">' + nf(c.players) + "</span></div>" +
      '<div class="stat"><span class="stat__label">Trades</span><span class="stat__val">' + nf(c.trades) + "</span></div>" +
      '<div class="stat"><span class="stat__label">Guesses</span><span class="stat__val">' + nf(hssN) + "</span></div>" +
      '<div class="stat"><span class="stat__label">Wishes</span><span class="stat__val">' + nf(c.wishes + c.blessings) + "</span></div></div>" +
      '<p class="teaser">' + I("eye") + " Leak of the week: " + teaser("hssLean") + "</p>";
    const cta = $("#vaultCta");
    if (!cta.dataset.done) {
      cta.dataset.done = 1;
      cta.innerHTML = W.isRevealed()
        ? '<button class="btn btn--gold" id="openShow">' + I("unlock") + "Open the vault</button>"
        : '<button class="btn btn--ghost" id="tryOpen">' + I("lock") + "Try the handle</button>" +
          (C.demoMode ? '<button class="btn btn--gold" id="openShow">' + I("play") + "Rehearse the reveal show</button>" : "");
      const o = $("#openShow"); if (o) o.onclick = function () { W.reveal && W.reveal.open(); };
      const t = $("#tryOpen");
      if (t) t.onclick = function () {
        const d = $("#vaultDoor"); d.animate([{ transform: "rotate(0)" }, { transform: "rotate(-4deg)" }, { transform: "rotate(3deg)" }, { transform: "rotate(-2deg)" }, { transform: "rotate(0)" }], { duration: 500 });
        W.sfx.thud(); W.buzz([50, 30, 50]);
        const ss = split(W.T.reveal - W.now());
        W.toast(I("lock") + "Locked. " + ss.d + " days, " + ss.h + " hours to go.");
      };
    }
  }

  /* ======================================================================
     RSVP
     ====================================================================== */
  function renderRSVP() {
    const f = $("#rsvpForm"), p = store.player();
    if (p && p.rsvp) {
      const r = p.rsvp;
      f.innerHTML = '<div class="rsvp-done">' + I("check") + "<div><h3>Thank you, " + esc(r.name) + '</h3><p style="color:var(--mist)">' +
        (r.att === "none" ? "We'll miss you. Your wishes still count." : "See you " + ({ both: "at both events", reception: "at the reception", wedding: "at the wedding" })[r.att] + " · " + r.guests + " guest" + (r.guests > 1 ? "s" : "")) +
        '</p></div></div><button class="btn btn--ghost btn--sm" id="rsvpEdit" style="align-self:flex-start">Change my reply</button>';
      $("#rsvpEdit").onclick = function () { p.rsvp = null; renderRSVP(); };
      return;
    }
    f.innerHTML = '<div class="rsvp__row"><div class="field"><label for="rName">Name</label><input class="input" id="rName" maxlength="40" value="' + esc(p ? p.name : "") + '" placeholder="Your name"></div>' +
      '<div class="field"><label for="rGuests">Guests including you</label><select class="input" id="rGuests">' + [1, 2, 3, 4, 5, 6].map(function (n) { return "<option>" + n + "</option>"; }).join("") + "</select></div></div>" +
      '<div class="field"><label>Attending</label><div class="pills">' +
      [["both", "Both days"], ["reception", "Reception only"], ["wedding", "Wedding only"], ["none", "Can't make it"]].map(function (o, i) { return '<label class="pill"><input type="radio" name="att" value="' + o[0] + '"' + (i === 0 ? " checked" : "") + ">" + o[1] + "</label>"; }).join("") + "</div></div>" +
      '<div class="field"><label for="rNote">A note for the family (optional)</label><input class="input" id="rNote" maxlength="140" placeholder="Dietary needs, arrival time…"></div>' +
      '<button class="btn btn--gold" type="submit" style="align-self:flex-start">' + I("send") + "Send RSVP</button>" +
      (C.demoMode ? '<p class="rec-note">Preview mode: replies stay on this device until the site is connected.</p>' : "");
    f.onsubmit = function (e) {
      e.preventDefault();
      const name = $("#rName").value.trim();
      if (!name) { $("#rName").focus(); W.toast(I("user") + "Add your name"); return; }
      needPlayer(function () {
        const first = store.rsvp({ name: name, guests: +$("#rGuests").value, att: (f.querySelector("input[name=att]:checked") || {}).value || "both", note: $("#rNote").value.trim() });
        W.sfx.chime(); W.confettiFrom(f, { count: 160 });
        if (first) { badge("rsvp"); reward(60, 0, f); }
        renderRSVP();
      });
    };
  }

  /* ======================================================================
     Live ticker
     ====================================================================== */
  let tickI = 0;
  function showTick(text) {
    const tr = $("#tickerTrack"), old = tr.querySelector(".tick:not(.out)");
    if (old) { old.classList.add("out"); setTimeout(function () { old.remove(); }, 500); }
    const t = document.createElement("div"); t.className = "tick";
    const parts = String(text).split(" ");
    t.innerHTML = "<b>" + esc(parts.shift()) + "</b> " + esc(parts.join(" ")) + (C.demoMode ? ' <span style="color:var(--dim)">· sample</span>' : "");
    tr.appendChild(t);
  }
  function ticker() {
    const feed = store.state.crowd.feed;
    if (feed.length) showTick(feed[0].text); else showTick("Guests are arriving. Be the first to play!");
    setInterval(function () {
      let text = W.simTick();
      if (!text) { const f = store.state.crowd.feed; if (!f.length) return; text = f[(++tickI) % f.length].text; }
      showTick(text);
      renderMarkets(); renderVault();
    }, 6500);
  }

  /* ======================================================================
     Couple portal (#couple)
     ====================================================================== */
  function couplePortal() {
    openSheet('<h3>Couple portal</h3><div class="sheet__body"><p>For Sandeep and Priyanka only. Enter the passcode the family gave you.</p>' +
      '<form id="cpForm" class="sheet__body" style="margin:0"><div class="field"><label for="cpPass">Passcode</label><input class="input" id="cpPass" inputmode="numeric" autocomplete="off"></div>' +
      '<button class="btn btn--gold" type="submit">' + I("unlock") + "Enter</button></form></div>",
      function (root) {
        $("#cpForm", root).onsubmit = function (e) {
          e.preventDefault();
          if ($("#cpPass", root).value.trim() !== C.couplePasscode) { W.sfx.nope(); W.buzz([40, 30, 40]); W.toast(I("lock") + "That passcode isn't right"); return; }
          W.sfx.chime(); coupleTabs("S");
        };
      }, function () { if (location.hash === "#couple") history.replaceState(null, "", location.pathname + location.search); });
  }
  function coupleTabs(tab) {
    const cp = store.state.couple;
    let body = "";
    if (tab === "R") {
      body = "<p>After the wedding, record what actually happened. These settle the Love Stock Market on the 29th.</p>" +
        C.markets.map(function (mk) {
          const v = cp.outcomes[mk.id];
          return '<div class="portal-q"><p>' + esc(mk.q) + '</p><div class="pills">' +
            [["yes", "Happened"], ["no", "Didn't happen"], ["", "Not yet"]].map(function (o) {
              const on = o[0] === "yes" ? v === true : o[0] === "no" ? v === false : v == null;
              return '<label class="pill"><input type="radio" name="o_' + mk.id + '" value="' + o[0] + '"' + (on ? " checked" : "") + ">" + o[1] + "</label>";
            }).join("") + "</div></div>";
        }).join("");
    } else {
      const me = tab === "S" ? "Sandeep" : "Priyanka", other = tab === "S" ? "Priyanka" : "Sandeep";
      body = "<p>Answer honestly, " + me + ". " + other + " can't see these, and neither can the guests, until the vault opens.</p>" +
        C.hssQuestions.map(function (q) {
          const v = cp[tab].answers[q.id];
          return '<div class="portal-q"><p>' + esc(q.q) + '</p><div class="pills">' +
            [["S", "Sandeep"], ["P", "Priyanka"]].map(function (o) { return '<label class="pill"><input type="radio" name="a_' + q.id + '" value="' + o[0] + '"' + (v === o[0] ? " checked" : "") + ">" + o[1] + "</label>"; }).join("") + "</div></div>";
        }).join("") +
        '<div class="field"><label for="cpLetter">Your sealed letter to ' + other + '</label><textarea class="input" id="cpLetter" maxlength="3000" placeholder="Dear ' + other + ',">' + esc(cp[tab].letter) + "</textarea></div>";
    }
    openSheet('<h3>Couple portal</h3><div class="sheet__body portal"><div class="tabs">' +
      [["S", "Sandeep"], ["P", "Priyanka"], ["R", "Results desk"]].map(function (t) { return '<button data-tab="' + t[0] + '" class="' + (t[0] === tab ? "on" : "") + '">' + t[1] + "</button>"; }).join("") + "</div>" +
      body + '<button class="btn btn--gold" id="cpSave">' + I("lock") + "Save and seal</button>" +
      '<p class="rec-note">Until the shared backend is connected, answers are saved on this device only.</p></div>',
      function (root) {
        $$("[data-tab]", root).forEach(function (b) { b.onclick = function () { coupleTabs(b.dataset.tab); }; });
        $("#cpSave", root).onclick = function () {
          if (tab === "R") C.markets.forEach(function (mk) { const r = root.querySelector('input[name="o_' + mk.id + '"]:checked'); store.outcome(mk.id, !r || r.value === "" ? null : r.value === "yes"); });
          else {
            C.hssQuestions.forEach(function (q) { const r = root.querySelector('input[name="a_' + q.id + '"]:checked'); if (r) store.coupleAnswer(tab, q.id, r.value); });
            store.coupleLetter(tab, $("#cpLetter", root).value.trim());
          }
          W.sfx.chime(); W.toast(I("lock") + "Saved and sealed"); renderLetters();
        };
      }, function () { if (location.hash === "#couple") history.replaceState(null, "", location.pathname + location.search); });
  }

  /* ======================================================================
     Boot
     ====================================================================== */
  function renderAll() { renderHUD(); renderScratch(); renderNav(); renderBox(); renderMarkets(); renderHSS(); renderRecorder(); renderCapsule(); renderLetters(); renderVault(); renderRSVP(); }
  W.renderAll = renderAll;

  function route() {
    if (location.hash === "#couple") couplePortal();
    if (location.hash === "#reveal" && W.reveal && (W.isRevealed() || C.demoMode)) W.reveal.open();
  }

  function boot() {
    W.hydrateIcons();
    $("#demoChip").hidden = !C.demoMode;
    $("#hashtag").textContent = C.couple.hashtag;
    sky(); countdown(); renderEvents(); renderAll(); ticker();
    let rz; addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { if (!(store.player() && store.player().scratch && store.player().scratch.revealed)) renderScratch(); }, 200); });
    addEventListener("hashchange", route);
    setTimeout(route, 50);
    // Repaint the foil once the display fonts arrive so its lettering uses them.
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if ($("#scratchCv")) renderScratch(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();
