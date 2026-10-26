/* ==========================================================================
   The 29 January reveal show: tap-through story slides, Wrapped style.
   ========================================================================== */
(function () {
  const C = W.config, store = W.store, M = W.market, I = W.icon, esc = W.esc, nf = W.nf;
  const show = document.getElementById("show");
  let idx = 0, slides = [], timer = null, data = null;

  function compute() {
    const S = store.state, c = S.crowd, p = store.player(), res = store.results();
    const Q = C.hssQuestions;
    const agree = Q.filter(function (q) { return res.answers.S[q.id] && res.answers.S[q.id] === res.answers.P[q.id]; });
    // Question where guests were most confidently wrong about the bride's answer
    let shock = null;
    Q.forEach(function (q) {
      const v = c.hss[q.id], n = v.S + v.P; if (!n) return;
      const truth = res.answers.P[q.id]; if (!truth) return;
      const wrongShare = (truth === "S" ? v.P : v.S) / n;
      if (!shock || wrongShare > shock.wrong) shock = { q: q, wrong: wrongShare, truth: truth, s: res.answers.S[q.id] };
    });
    let myHss = null;
    if (p && Object.keys(p.hss).length) {
      let right = 0, total = 0;
      Q.forEach(function (q) { const g = p.hss[q.id]; if (!g) return; ["S", "P"].forEach(function (k) { if (res.answers[k][q.id]) { total++; if (res.answers[k][q.id] === g) right++; } }); });
      myHss = { right: right, total: total };
    }
    const mk = C.markets.map(function (m) {
      const price = M.price(c.markets[m.id]), out = res.outcomes[m.id];
      return { m: m, price: price, out: out, upset: out == null ? 0 : out ? 1 - price : price };
    });
    const upset = mk.slice().sort(function (a, b) { return b.upset - a.upset; })[0];
    let payout = 0;
    if (p) p.trades.forEach(function (t) { const o = res.outcomes[t.id]; if (o == null) return; if ((t.side === "yes") === o) payout += t.shares; });
    return { c: c, p: p, res: res, agree: agree, shock: shock, myHss: myHss, mk: mk, upset: upset, payout: payout, sealed: store.sealedCount() };
  }

  function whoName(k) { return k === "S" ? "Sandeep" : "Priyanka"; }
  function av(k) { return '<span class="sv sv--' + k + '">' + k + "</span>"; }

  function build() {
    const d = data, p = d.p, Q = C.hssQuestions, team = d.c.team, bWin = team.bride >= team.groom, tot = team.bride + team.groom || 1;
    const out = [];
    out.push({ cls: "s-intro", html:
      '<div class="vault-open"><div class="vo-door"></div><div class="vo-light"></div></div>' +
      '<p class="kicker">' + I("unlock") + "29 January 2027</p><h2>The vault<br><em>is open.</em></h2><p class=\"s-sub\">Everything you guessed, bet and wished. Tap to continue.</p>",
      enter: function () { W.sfx.thud(); setTimeout(W.sfx.fanfare, 700); setTimeout(function () { W.confetti({ count: 260, power: 1.4 }); }, 900); } });

    out.push({ html: '<p class="kicker">' + I("users") + "The crowd</p><h2><span class=\"s-big foil\" data-count=\"" + d.c.players + "\">0</span><br>guests played</h2>" +
      '<p class="s-sub">and sealed <b data-count="' + d.sealed + '">0</b> secrets in the vault.</p>' });

    out.push({ html: '<p class="kicker">' + I("trophy") + "Team battle</p><h2>Team " + (bWin ? "Bride" : "Groom") + " <em>wins.</em></h2>" +
      '<div class="battle"><div class="battle__row"><span>Team Bride</span><div class="battle__bar"><i style="--w:' + (team.bride / tot * 100).toFixed(1) + '%"></i></div><b>' + nf(team.bride) + " XP</b></div>" +
      '<div class="battle__row"><span>Team Groom</span><div class="battle__bar battle__bar--g"><i style="--w:' + (team.groom / tot * 100).toFixed(1) + '%"></i></div><b>' + nf(team.groom) + " XP</b></div></div>" +
      '<p class="s-sub">Won by ' + nf(Math.abs(team.bride - team.groom)) + " XP.</p>", enter: function () { W.sfx.chime(); } });

    out.push({ html: '<p class="kicker">' + I("heart") + "He said, she said</p><h2>They agreed on <span class=\"foil\">" + d.agree.length + " of " + Q.length + "</span></h2>" +
      '<div class="hss-grid">' + Q.map(function (q) {
        const s = d.res.answers.S[q.id], pp = d.res.answers.P[q.id], same = s && s === pp;
        return '<div class="hg' + (same ? " same" : "") + '"><span class="hg__q">' + esc(q.q) + '</span><span class="hg__a">' + (s ? av(s) : "?") + (pp ? av(pp) : "?") + "</span></div>";
      }).join("") + '</div><p class="s-sub" style="font-size:.85rem">Left: Sandeep\'s answer. Right: Priyanka\'s.</p>' });

    if (d.shock) out.push({ html: '<p class="kicker">' + I("zap") + "Plot twist</p><p class=\"s-quote\">“" + esc(d.shock.q.q) + "”</p>" +
      '<h2><span class="foil">' + Math.round(d.shock.wrong * 100) + "%</span> of you<br>got this wrong.</h2>" +
      '<p class="s-sub">Priyanka said <b>' + whoName(d.shock.truth) + "</b>. Sandeep said <b>" + whoName(d.shock.s) + "</b>.</p>", enter: function () { W.sfx.whoosh(); } });

    if (d.myHss) {
      const r = d.myHss.total ? d.myHss.right / d.myHss.total : 0;
      const title = r >= .8 ? "Couple Whisperer" : r >= .6 ? "Trusted Confidant" : r >= .4 ? "Good Guesser" : "Lovable Stranger";
      out.push({ html: '<p class="kicker">' + I("target") + "Your guesses</p><h2>You got <span class=\"s-big foil\" data-count=\"" + d.myHss.right + "\">0</span><br>of " + d.myHss.total + " right</h2>" +
        '<p class="s-sub">Your title: <b class="foil">' + title + "</b></p>", enter: function () { W.sfx.chime(); if (r >= .6) W.confetti({ count: 160 }); } });
      d.title = title;
    }

    out.push({ html: '<p class="kicker">' + I("up") + "The Love Stock Market</p><h2>How it <em>settled</em></h2><div class=\"settle\">" +
      d.mk.map(function (x) {
        return '<div class="st"><span class="st__q">' + esc(x.m.q) + '</span><span class="st__p">' + Math.round(x.price * 100) + '% YES</span><span class="st__r ' + (x.out == null ? "" : x.out ? "yes" : "no") + '">' + (x.out == null ? "Pending" : x.out ? "Happened" : "Didn't") + "</span></div>";
      }).join("") + "</div>" + (d.upset && d.upset.out != null ? '<p class="s-sub">Biggest upset: <b>' + esc(d.upset.m.q) + "</b>. The crowd gave it " + Math.round((d.upset.out ? 1 - d.upset.price : d.upset.price) * 100) + "% the other way.</p>" : "") });

    if (p && p.trades.length) {
      const final = p.coins + d.payout, gain = final - C.startingCoins;
      out.push({ html: '<p class="kicker">' + I("coins") + "Your portfolio</p><h2><span class=\"s-big foil\" data-count=\"" + Math.round(final) + "\">0</span><br>Love Coins</h2>" +
        '<p class="s-sub">' + (gain >= 0 ? "Up " + nf(gain) + " from your starting 1,000. Not bad at all." : "Down " + nf(-gain) + ". Love is not an exact science.") + "</p>",
        enter: function () { W.sfx.coin(); if (gain > 0) W.confetti({ count: 180 }); } });
      d.final = final;
    }

    out.push({ html: '<p class="kicker">' + I("mail") + "Sealed words</p><h2><span class=\"foil\" data-count=\"" + (d.c.wishes + d.c.blessings) + "\">0</span> wishes &amp; blessings</h2>" +
      '<p class="s-sub">are now unlocked for Sandeep and Priyanka. Their letters to each other are open too, for their eyes only.</p>' +
      (p && p.wishes.length ? '<p class="s-quote">“' + esc(p.wishes[p.wishes.length - 1].text.slice(0, 160)) + (p.wishes[p.wishes.length - 1].text.length > 160 ? "…" : "") + "”<br><small>— you</small></p>" : ""),
      enter: function () { W.rain(); } });

    if (p) out.push({ cls: "s-card", html: '<p class="kicker">' + I("award") + "Your reveal card</p><canvas id=\"revealCard\" class=\"rcard\" width=\"1080\" height=\"1350\"></canvas>" +
      '<div class="s-actions"><button class="btn btn--gold" id="rcSave">' + I("download") + 'Save image</button><button class="btn btn--ghost" id="rcShare">' + I("share") + "Share</button></div>",
      enter: drawCard, interactive: true });

    out.push({ cls: "s-final", html: '<p class="names__one foil" style="font-size:clamp(3rem,10vw,6rem)">Sandeep &amp; Priyanka</p><p class="s-sub">Thank you for playing, and for being part of their story.</p>' +
      '<div class="s-actions"><button class="btn btn--ghost" id="rReplay">' + I("play") + 'Watch again</button><button class="btn btn--gold" id="rClose">Back to the site</button></div>',
      enter: function () { W.sfx.fanfare(); W.confetti({ count: 300, power: 1.5 }); }, interactive: true });
    return out;
  }

  function drawCard() {
    const cv = document.getElementById("revealCard"); if (!cv) return;
    const ctx = cv.getContext("2d"), w = 1080, h = 1350, p = data.p, lv = W.levelOf(p.xp);
    const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, "#1d1a3d"); bg.addColorStop(1, "#0b0a1a"); ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w / 2, 0, 0, w / 2, 0, 800); glow.addColorStop(0, "rgba(232,201,135,.28)"); glow.addColorStop(1, "rgba(232,201,135,0)"); ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { ctx.fillStyle = "rgba(255,248,231," + Math.random() * .6 + ")"; ctx.beginPath(); ctx.arc(Math.random() * w, Math.random() * h * .5, Math.random() * 1.8, 0, 7); ctx.fill(); }
    const gold = ctx.createLinearGradient(0, 0, w, 0); gold.addColorStop(0, "#b8873a"); gold.addColorStop(.35, "#f6e3a8"); gold.addColorStop(.6, "#c99a45"); gold.addColorStop(1, "#f2d58e");
    ctx.strokeStyle = gold; ctx.lineWidth = 3; ctx.strokeRect(40, 40, w - 80, h - 80); ctx.lineWidth = 1; ctx.strokeRect(54, 54, w - 108, h - 108);
    ctx.textAlign = "center";
    ctx.fillStyle = "#e8c987"; ctx.font = "600 28px Cinzel, Georgia, serif"; ctx.fillText("T H E   V A U L T   ·   2 9 . 0 1 . 2 0 2 7", w / 2, 140);
    ctx.fillStyle = gold; ctx.font = "120px 'Pinyon Script', cursive"; ctx.fillText("Sandeep & Priyanka", w / 2, 290);
    ctx.fillStyle = "#fbf6ec"; ctx.font = "500 92px 'Cormorant Garamond', Georgia, serif"; ctx.fillText(p.name, w / 2, 450);
    ctx.fillStyle = "#b9b3c9"; ctx.font = "italic 500 40px 'Cormorant Garamond', Georgia, serif";
    ctx.fillText((data.title || p.title || lv.name) + " · Team " + (p.team === "bride" ? "Bride" : "Groom"), w / 2, 515);
    const stats = [
      ["LEVEL", lv.name], ["XP", nf(p.xp)],
      ["GUESSES RIGHT", data.myHss ? data.myHss.right + " / " + data.myHss.total : "—"], ["LOVE COINS", data.final != null ? nf(data.final) : nf(p.coins)],
      ["BEST STREAK", p.streak.best + " days"], ["BADGES", Object.keys(p.badges).length + " / " + Object.keys(W.BADGES).length],
    ];
    stats.forEach(function (s, i) {
      const col = i % 2, row = Math.floor(i / 2), x = 140 + col * 420, y = 620 + row * 190, bw = 380, bh = 150;
      ctx.fillStyle = "rgba(251,246,236,.05)"; ctx.strokeStyle = "rgba(232,201,135,.3)"; ctx.lineWidth = 1.5;
      ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, bw, bh, 24); else ctx.rect(x, y, bw, bh); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#7d7794"; ctx.font = "600 22px Cinzel, Georgia, serif"; ctx.fillText(s[0], x + bw / 2, y + 50);
      ctx.fillStyle = "#fbf6ec"; ctx.font = "600 " + (String(s[1]).length > 14 ? 34 : 52) + "px 'Cormorant Garamond', Georgia, serif"; ctx.fillText(s[1], x + bw / 2, y + 115);
    });
    ctx.fillStyle = "#e8c987"; ctx.font = "600 30px Cinzel, Georgia, serif"; ctx.fillText(C.couple.hashtag.toUpperCase(), w / 2, h - 110);
    ctx.fillStyle = "#7d7794"; ctx.font = "500 24px Manrope, sans-serif"; ctx.fillText("Shelter Beach Resorts · Mahabalipuram", w / 2, h - 70);

    document.getElementById("rcSave").onclick = function () {
      cv.toBlob(function (b) {
        const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = "sandeep-priyanka-" + p.name.replace(/\W+/g, "-").toLowerCase() + ".png";
        document.body.appendChild(a); a.click(); a.remove();
        W.toast(I("download") + "If nothing downloaded, long-press the card to save it.");
      });
    };
    document.getElementById("rcShare").onclick = function () {
      cv.toBlob(function (b) {
        const f = new File([b], "reveal-card.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [f] })) navigator.share({ files: [f], title: "My reveal card" }).catch(function () {});
        else W.share();
      });
    };
  }

  function go(n) {
    if (n < 0) n = 0;
    if (n >= slides.length) return close();
    idx = n;
    clearTimeout(timer);
    const s = slides[idx];
    show.querySelector(".show__stage").innerHTML = '<div class="slide ' + (s.cls || "") + '">' + s.html + "</div>";
    show.querySelectorAll(".show__bars i").forEach(function (b, i) { b.className = i < idx ? "done" : i === idx ? "on" : ""; });
    show.querySelectorAll("[data-count]").forEach(function (el) { el.dataset.val = 0; W.countTo(el, +el.dataset.count, 1600); });
    if (s.enter) s.enter();
    W.buzz(8);
    const replay = document.getElementById("rReplay"), cl = document.getElementById("rClose");
    if (replay) replay.onclick = function (e) { e.stopPropagation(); go(0); };
    if (cl) cl.onclick = function (e) { e.stopPropagation(); close(); };
    if (!s.interactive) timer = setTimeout(function () { go(idx + 1); }, 8000);
  }

  function open() {
    data = compute();
    slides = build();
    const rehearsal = !W.isRevealed();
    show.innerHTML = '<div class="show__bars">' + slides.map(function () { return "<i></i>"; }).join("") + "</div>" +
      '<button class="show__x" aria-label="Close">' + I("x") + "</button>" +
      (rehearsal ? '<p class="show__demo">' + I("info") + "Rehearsal with sample results. The real show opens on 29 January.</p>" : "") +
      '<div class="show__stage"></div><div class="show__nav"><button data-dir="-1" aria-label="Previous"></button><button data-dir="1" aria-label="Next"></button></div>';
    show.hidden = false;
    document.body.style.overflow = "hidden";
    show.querySelector(".show__x").onclick = close;
    show.querySelectorAll(".show__nav button").forEach(function (b) { b.onclick = function () { W.sfx.tick(); go(idx + +b.dataset.dir); }; });
    go(0);
  }
  function close() {
    clearTimeout(timer);
    show.hidden = true; show.innerHTML = "";
    document.body.style.overflow = "";
    if (location.hash === "#reveal") history.replaceState(null, "", location.pathname + location.search);
  }
  addEventListener("keydown", function (e) {
    if (show.hidden) return;
    if (e.key === "ArrowRight" || e.key === " ") go(idx + 1);
    if (e.key === "ArrowLeft") go(idx - 1);
    if (e.key === "Escape") close();
  });
  W.reveal = { open: open, close: close };
})();
