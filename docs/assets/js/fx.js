/* Effects: confetti, synthesized sounds, haptics, toasts, number tweening. */
(function () {
  const reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Confetti (gold flakes, jasmine petals, marigold, kumkum) ---------- */
  let cv, ctx, parts = [], running = false;
  const COLORS = ["#f6e3a8", "#e2b864", "#c99a45", "#fff7e6", "#f4a23b", "#e2434b"];
  function ensure() {
    if (cv) return;
    cv = document.createElement("canvas");
    cv.className = "fx-canvas";
    document.body.appendChild(cv);
    ctx = cv.getContext("2d");
    resize();
    addEventListener("resize", resize);
  }
  function resize() {
    const d = Math.min(devicePixelRatio || 1, 2);
    cv.width = innerWidth * d; cv.height = innerHeight * d;
    ctx.setTransform(d, 0, 0, d, 0, 0);
  }
  function loop() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter(function (p) { return p.life > 0 && p.y < innerHeight + 40; });
    parts.forEach(function (p) {
      p.vx *= p.drag; p.vy = p.vy * p.drag + p.g;
      p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 1; p.wob += 0.1;
      const a = Math.min(1, p.life / 40);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(p.x + Math.sin(p.wob) * p.sway, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.c;
      if (p.shape === "petal") {
        ctx.beginPath(); ctx.ellipse(0, 0, p.s * 0.45, p.s, 0, 0, Math.PI * 2); ctx.fill();
      } else if (p.shape === "star") {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) { const r = i % 2 ? p.s * 0.35 : p.s; ctx.lineTo(Math.cos(i * Math.PI / 4) * r, Math.sin(i * Math.PI / 4) * r); }
        ctx.fill();
      } else {
        ctx.scale(1, Math.cos(p.wob * 1.7));
        ctx.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * 0.66);
      }
      ctx.restore();
    });
    if (parts.length) requestAnimationFrame(loop); else { running = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  W.confetti = function (opts) {
    if (reduce) return;
    ensure();
    opts = opts || {};
    const n = opts.count || 140;
    const x = opts.x != null ? opts.x : innerWidth / 2;
    const y = opts.y != null ? opts.y : innerHeight * 0.45;
    const spread = opts.spread || 1;
    for (let i = 0; i < n; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1 * spread;
      const sp = 6 + Math.random() * 10 * (opts.power || 1);
      const shape = Math.random() < 0.3 ? "petal" : Math.random() < 0.35 ? "star" : "rect";
      parts.push({
        x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        g: 0.22 + Math.random() * 0.1, drag: 0.965, s: 5 + Math.random() * 7,
        c: shape === "petal" ? (Math.random() < 0.6 ? "#fffaf0" : "#f4a23b") : COLORS[(Math.random() * COLORS.length) | 0],
        rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, life: 160 + Math.random() * 90,
        wob: Math.random() * 6, sway: Math.random() * 2, shape: shape,
      });
    }
    if (!running) { running = true; requestAnimationFrame(loop); }
  };
  W.confettiFrom = function (el, opts) {
    const r = el.getBoundingClientRect();
    W.confetti(Object.assign({ x: r.left + r.width / 2, y: r.top + r.height / 2 }, opts || {}));
  };
  W.rain = function () {
    if (reduce) return;
    ensure();
    for (let i = 0; i < 120; i++) {
      parts.push({ x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * 0.6, vx: (Math.random() - 0.5) * 1.5, vy: 1 + Math.random() * 2,
        g: 0.03, drag: 0.995, s: 6 + Math.random() * 6, c: Math.random() < 0.7 ? "#fffaf0" : "#f6e3a8", rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 0.08, life: 600, wob: Math.random() * 6, sway: 1.5, shape: "petal" });
    }
    if (!running) { running = true; requestAnimationFrame(loop); }
  };

  /* ---------- Sound: tiny synth, no audio files ---------- */
  let ac = null;
  W.sound = { on: true };
  try { W.sound.on = localStorage.getItem("spw.sound") !== "off"; } catch (e) {}
  function audio() {
    if (!W.sound.on) return null;
    try {
      if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === "suspended") ac.resume();
      return ac;
    } catch (e) { return null; }
  }
  function tone(freq, start, dur, type, vol) {
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type || "sine"; o.frequency.value = freq;
    const t = a.currentTime + (start || 0);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.12, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(a.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  W.sfx = {
    tick: function () { tone(1800 + Math.random() * 400, 0, 0.04, "triangle", 0.03); },
    coin: function () { tone(988, 0, 0.09, "square", 0.05); tone(1319, 0.07, 0.25, "square", 0.05); },
    pop: function () { tone(520, 0, 0.12, "sine", 0.15); tone(780, 0.04, 0.12, "sine", 0.08); },
    chime: function () { [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, i * 0.07, 0.6, "sine", 0.09); tone(f * 2, i * 0.07, 0.3, "triangle", 0.02); }); },
    fanfare: function () { [392, 523, 659, 784, 1047].forEach(function (f, i) { tone(f, i * 0.11, 0.5, "triangle", 0.08); }); tone(1568, 0.6, 1.2, "sine", 0.07); tone(1047, 0.6, 1.2, "sine", 0.07); },
    thud: function () { tone(110, 0, 0.25, "sine", 0.25); tone(70, 0.02, 0.3, "sine", 0.2); },
    nope: function () { tone(330, 0, 0.12, "sawtooth", 0.04); tone(247, 0.1, 0.2, "sawtooth", 0.04); },
    whoosh: function () {
      const a = audio(); if (!a) return;
      const len = a.sampleRate * 0.4, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      f.type = "bandpass"; f.frequency.setValueAtTime(400, a.currentTime); f.frequency.exponentialRampToValueAtTime(3000, a.currentTime + 0.35);
      g.gain.value = 0.18; s.buffer = buf; s.connect(f).connect(g).connect(a.destination); s.start();
    },
  };
  W.setSound = function (on) {
    W.sound.on = on;
    try { localStorage.setItem("spw.sound", on ? "on" : "off"); } catch (e) {}
  };

  /* ---------- Haptics ---------- */
  W.buzz = function (p) { try { if (navigator.vibrate) navigator.vibrate(p || 12); } catch (e) {} };

  /* ---------- Toasts ---------- */
  W.toast = function (html, kind) {
    let wrap = document.querySelector(".toasts");
    if (!wrap) { wrap = document.createElement("div"); wrap.className = "toasts"; wrap.setAttribute("aria-live", "polite"); document.body.appendChild(wrap); }
    const t = document.createElement("div");
    t.className = "toast" + (kind ? " toast--" + kind : "");
    t.innerHTML = html;
    wrap.appendChild(t);
    setTimeout(function () { t.classList.add("is-out"); }, 2800);
    setTimeout(function () { t.remove(); }, 3300);
  };

  /* Floating "+40 XP" style label rising from an element. */
  W.floatText = function (el, text) {
    const r = el.getBoundingClientRect();
    const f = document.createElement("div");
    f.className = "float-text";
    f.textContent = text;
    f.style.left = r.left + r.width / 2 + "px";
    f.style.top = r.top + "px";
    document.body.appendChild(f);
    setTimeout(function () { f.remove(); }, 1400);
  };

  /* Animate a number in an element. */
  W.countTo = function (el, to, dur, fmt) {
    const from = parseFloat(el.dataset.val || "0") || 0;
    el.dataset.val = to;
    fmt = fmt || function (v) { return Math.round(v).toLocaleString("en-IN"); };
    if (reduce || !dur) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    (function step(t) {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = fmt(from + (to - from) * e);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  };

  W.reduceMotion = reduce;
})();
