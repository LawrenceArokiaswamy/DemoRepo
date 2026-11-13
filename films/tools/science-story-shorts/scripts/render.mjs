#!/usr/bin/env node
// render.mjs: turns a Cartoon Shorts HTML player into a frame-exact MP4 with its full sound mix.
//
//   node render.mjs my-short.html [out.mp4] [--from 0] [--to 5] [--stills "1.5,4,9.2"] [--gpu] [--png]
//
// Needs: Node 18+, ffmpeg on PATH, and ONE of puppeteer, puppeteer-core or playwright where Node can find it
// (this folder, the current folder, or NODE_PATH). Browser: the driver's own Chrome, or CHROME_PATH.
// It installs and downloads nothing. --stills saves PNG frames at those seconds (for a contact sheet) instead of a video.
// --gpu uses the graphics card (much faster where it works); the default is software WebGL (works everywhere, ~1-4 s a frame).

import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, mkdirSync, statSync, writeFileSync, unlinkSync } from "node:fs";
import { resolve, dirname, extname, join, basename, sep } from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2), VALUED = ["from", "to", "stills"];
const opt = (k, d) => { const i = args.indexOf("--" + k); return i < 0 ? d : args[i + 1]; };
const flag = k => args.includes("--" + k);
const pos = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && VALUED.includes(args[i - 1].replace(/^--/, ""))));
if (!pos[0]) { console.log("usage: node render.mjs short.html [out.mp4] [--from s] [--to s] [--stills \"1,2.5\"] [--gpu] [--png]"); process.exit(1); }
const html = resolve(pos[0]);
const out = resolve(pos[1] || html.replace(/\.html?$/i, "") + ".mp4");
const fail = m => { console.error("render.mjs: " + m); process.exit(1); };
if (!existsSync(html)) fail("file not found: " + html);
if (!opt("stills") && spawnSync("ffmpeg", ["-version"]).status !== 0) fail("ffmpeg is not on PATH (needed to make the MP4). Use the Export video button in the HTML instead.");

function load(name) {
  const bases = [process.cwd(), dirname(fileURLToPath(import.meta.url)), ...(process.env.NODE_PATH || "").split(/[;:](?![\\/])/).filter(Boolean).map(p => dirname(p))];
  for (const b of bases) { try { return createRequire(join(b, "x.js"))(name); } catch {} }
  return null;
}
const gl = flag("gpu") ? ["--use-angle=default", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-webgl"] : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"];
const chromeArgs = [...gl, "--force-color-profile=srgb", "--autoplay-policy=no-user-gesture-required"];
let launch, kind;
const pw = load("playwright") || load("playwright-core"), pp = load("puppeteer") || load("puppeteer-core");
if (pp) { kind = "puppeteer"; launch = () => pp.launch({ headless: true, executablePath: process.env.CHROME_PATH, args: chromeArgs, protocolTimeout: 600000 }); }
else if (pw) { kind = "playwright"; launch = () => pw.chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH, args: chromeArgs }); }
else fail("no browser driver found (puppeteer, puppeteer-core or playwright). Use the Export video button in the HTML instead.");

const root = dirname(html);
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".mp3": "audio/mpeg", ".wav": "audio/wav", ".m4a": "audio/mp4", ".ttf": "font/ttf", ".woff2": "font/woff2" };
const server = createServer(async (req, res) => {
  const p = resolve(root, decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/+/, ""));
  if (p !== root && !p.startsWith(root + sep)) { res.writeHead(403); return res.end(); }
  try { const b = await readFile(p); res.writeHead(200, { "Content-Type": MIME[extname(p).toLowerCase()] || "application/octet-stream" }); res.end(b); } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/${encodeURIComponent(basename(html))}?render=1${process.env.CS_QUERY ? "&" + process.env.CS_QUERY : ""}`;

const browser = await launch(); let code = 0;
try {
  const page = await browser.newPage();
  const errors = []; page.on("pageerror", e => errors.push(String(e))); page.on("console", m => { if (m.type() === "error" || m.type() === "warning") console.log("[page] " + m.text()); });
  await page.goto(url, { waitUntil: "load", timeout: 120000 });
  await page.waitForFunction("window.ready === true || window.__err", { timeout: 300000 });
  if (errors.length) throw new Error(errors[0]);
  const C = await page.evaluate("window.CONFIG");
  if (kind === "puppeteer") await page.setViewport({ width: C.width, height: C.height, deviceScaleFactor: 1 }); else await page.setViewportSize({ width: C.width, height: C.height });
  const fps = C.fps, from = Number(opt("from", 0)), to = Math.min(Number(opt("to", C.duration)), C.duration);
  const f0 = Math.round(from * fps), f1 = Math.round(to * fps), png = flag("png");
  const shot = async (f, type) => { await page.evaluate(n => window.renderFrame(n), f); if (errors.length) throw new Error(errors[0]); return page.screenshot(type === "png" ? { type: "png", clip: { x: 0, y: 0, width: C.width, height: C.height } } : { type: "jpeg", quality: 95, clip: { x: 0, y: 0, width: C.width, height: C.height } }); };
  if (opt("stills")) {
    const dir = out.replace(/\.mp4$/i, "") + "-stills"; mkdirSync(dir, { recursive: true });
    for (const s of String(opt("stills")).split(",").map(Number)) { const f = Math.min(Math.round(s * fps), Math.round(C.duration * fps) - 1); writeFileSync(join(dir, `t${s.toFixed(2).padStart(6, "0")}.png`), await shot(f, "png")); }
    console.log("stills in " + dir);
  } else {
    mkdirSync(dirname(out), { recursive: true });
    // 1) the sound mix, rendered offline by the page itself
    const wav = out.replace(/\.mp4$/i, "") + ".mix.wav";
    const b64 = await page.evaluate(() => window.renderAudio());
    writeFileSync(wav, Buffer.from(b64, "base64"));
    // 2) the frames, piped into ffmpeg
    const ff = ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-c:v", png ? "png" : "mjpeg", "-i", "-", "-ss", String(from), "-i", wav,
      "-map", "0:v", "-map", "1:a", "-c:a", "aac", "-b:a", "192k", "-shortest", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-r", String(fps), "-movflags", "+faststart", out];
    const enc = spawn("ffmpeg", ff, { stdio: ["pipe", "inherit", "inherit"] });
    const ended = new Promise((ok, no) => enc.on("close", c => c === 0 ? ok() : no(new Error("ffmpeg exited " + c))));
    const t0 = Date.now();
    for (let f = f0; f < f1; f++) {
      const img = await shot(f, png ? "png" : "jpeg");
      if (!enc.stdin.write(img)) await new Promise(r => enc.stdin.once("drain", r));
      if ((f - f0) % 15 === 0) process.stdout.write(`\rframe ${f - f0 + 1}/${f1 - f0}  (${((Date.now() - t0) / 1000 / (f - f0 + 1)).toFixed(2)} s/frame)`);
    }
    enc.stdin.end(); await ended;
    try { unlinkSync(wav); } catch {}
    const pr = spawnSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,width,height:format=duration", "-of", "json", out], { encoding: "utf8" });
    const info = pr.status === 0 ? JSON.parse(pr.stdout) : null, v = info && info.streams.find(s => s.codec_type === "video");
    if (!existsSync(out) || statSync(out).size < 4096 || !v || v.width !== C.width || v.height !== C.height) throw new Error("the MP4 failed its check");
    console.log(`\nsaved ${out} (${v.width}x${v.height}, ${(+info.format.duration).toFixed(2)} s, ${info.streams.some(s => s.codec_type === "audio") ? "with sound" : "NO SOUND"})`);
  }
} catch (e) { console.error("\nrender.mjs: " + (e.message || e)); code = 1; }
finally { await browser.close(); server.close(); }
process.exit(code);
