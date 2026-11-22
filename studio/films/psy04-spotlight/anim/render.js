// node render.js out.mp4 [start] [end]  -> silent H.264 1080x1920@30
const {spawn} = require('child_process');
const fs = require('fs');
const R = require('./rig.js');
const {shots, duration} = require('./scenes.js');
const caps = JSON.parse(fs.readFileSync(__dirname + '/../project/project.json', 'utf8')).captions;
const FF = '/home/user/tools/ffmpeg-master-latest-linux64-gpl/bin/ffmpeg';
const [out, a = 0, b = duration] = process.argv.slice(2);
const canvas = R.createCanvas(R.W, R.H), ctx = canvas.getContext('2d');
const ff = spawn(FF, ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${R.W}x${R.H}`, '-r', '30', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', out], {stdio: ['pipe', 'inherit', 'inherit']});
(async () => {
  const f0 = Math.round(+a * 30), f1 = Math.round(Math.min(+b, duration) * 30);
  for (let f = f0; f < f1; f++) {
    const t = f / 30, shot = shots.find(s => t < s.end) || shots.at(-1), lt = t - shot.start;
    R.setBoil(f);
    ctx.setTransform(1, 0, 0, 1, 0, 0); R.paper(ctx);
    const c = shot.cam ? shot.cam(lt) : {z: 1, cx: 540, cy: 960, shake: 0};
    const sx = (R.hash(f * 1.7) - .5) * 2 * (c.shake || 0), sy = (R.hash(f * 2.3 + 5) - .5) * 2 * (c.shake || 0);
    ctx.save(); ctx.translate(c.cx + sx, c.cy + sy); ctx.scale(c.z, c.z); ctx.translate(-c.cx, -c.cy);
    shot.draw(ctx, lt, t); ctx.restore();
    if (shot.hud) shot.hud(ctx, lt);
    const cap = caps.find(k => t >= k.start && t < k.end); R.caption(ctx, cap && cap.text);
    const buf = canvas.data ? canvas.data() : ctx.getImageData(0, 0, R.W, R.H).data;
    if (!ff.stdin.write(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength))) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
})();
ff.on('close', code => { console.log('done', out, code); });
