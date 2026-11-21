"use client";

import { useEffect, useRef } from "react";

/**
 * Animated background: drifting neurons that connect when close, with signals
 * firing along the connections. Pauses when off-screen or the tab is hidden,
 * and renders a single still frame for users who prefer reduced motion.
 */
export function NeuralField({ density = 1 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const css = getComputedStyle(document.documentElement);
    const c1 = css.getPropertyValue("--neuron-a").trim() || "#8b7bff";
    const c2 = css.getPropertyValue("--neuron-b").trim() || "#3fd0f0";

    let w = 0, h = 0, dpr = 1;
    type N = { x: number; y: number; vx: number; vy: number; r: number; hue: number };
    let nodes: N[] = [];
    type Pulse = { a: number; b: number; t: number; speed: number };
    const pulses: Pulse[] = [];
    const LINK = 150;

    function resize() {
      const rect = canvas!.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width;
      h = rect.height;
      canvas!.width = Math.round(w * dpr);
      canvas!.height = Math.round(h * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(110, (w * h) / 11000) * density);
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: 1.2 + Math.random() * 2.2,
        hue: Math.random(),
      }));
    }

    function draw() {
      ctx!.clearRect(0, 0, w, h);
      // connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            ctx!.globalAlpha = (1 - d / LINK) * 0.35;
            ctx!.strokeStyle = a.hue > 0.5 ? c1 : c2;
            ctx!.lineWidth = 0.7;
            ctx!.beginPath();
            ctx!.moveTo(a.x, a.y);
            ctx!.lineTo(b.x, b.y);
            ctx!.stroke();
          }
        }
      }
      // signals
      for (const p of pulses) {
        const a = nodes[p.a], b = nodes[p.b];
        if (!a || !b) continue;
        const x = a.x + (b.x - a.x) * p.t, y = a.y + (b.y - a.y) * p.t;
        const g = ctx!.createRadialGradient(x, y, 0, x, y, 7);
        g.addColorStop(0, c2);
        g.addColorStop(1, "transparent");
        ctx!.globalAlpha = 0.95;
        ctx!.fillStyle = g;
        ctx!.beginPath();
        ctx!.arc(x, y, 7, 0, Math.PI * 2);
        ctx!.fill();
      }
      // neurons
      for (const n of nodes) {
        ctx!.globalAlpha = 0.9;
        ctx!.fillStyle = n.hue > 0.5 ? c1 : c2;
        ctx!.shadowColor = ctx!.fillStyle;
        ctx!.shadowBlur = 8;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.shadowBlur = 0;
      ctx!.globalAlpha = 1;
    }

    function step() {
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < -20) n.x = w + 20;
        if (n.x > w + 20) n.x = -20;
        if (n.y < -20) n.y = h + 20;
        if (n.y > h + 20) n.y = -20;
      }
      if (pulses.length < 14 && Math.random() < 0.08 && nodes.length > 1) {
        const a = Math.floor(Math.random() * nodes.length);
        let best = -1, bestD = LINK;
        for (let j = 0; j < nodes.length; j++) {
          if (j === a) continue;
          const d = Math.hypot(nodes[a].x - nodes[j].x, nodes[a].y - nodes[j].y);
          if (d < bestD && Math.random() < 0.6) { best = j; bestD = d; }
        }
        if (best >= 0) pulses.push({ a, b: best, t: 0, speed: 0.012 + Math.random() * 0.018 });
      }
      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i].t += pulses[i].speed;
        if (pulses[i].t >= 1) pulses.splice(i, 1);
      }
    }

    let raf = 0;
    let visible = true;
    const loop = () => {
      step();
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => { if (!raf && visible && !document.hidden && !reduced) raf = requestAnimationFrame(loop); };
    const stop = () => { cancelAnimationFrame(raf); raf = 0; };

    resize();
    draw();
    start();
    const ro = new ResizeObserver(() => { resize(); draw(); });
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) start(); else stop(); });
    io.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [density]);

  return <canvas ref={ref} className="neural-field" aria-hidden="true" />;
}
