// Builds final mix + mux: node mix.js silent.mp4 out.mp4
const {execFileSync} = require('child_process');
const {cues, duration} = require('./scenes.js');
const FF = '/home/user/tools/ffmpeg-master-latest-linux64-gpl/bin/ffmpeg';
const [vid, out] = process.argv.slice(2), D = __dirname;
const FILES = {door: 'door.ogg', step: 'step.ogg', thunk: 'thunk.ogg', pep: 'pep.ogg', swish: 'swish.wav', splat: 'splat.mp3', pop: 'pop.ogg', squeak: 'squeak.wav', scratch: 'scratch.wav', bing: 'bing.mp3', click: 'click.ogg'};
const args = ['-v', 'error', '-y', '-i', vid, '-i', `${D}/../narration.wav`, '-stream_loop', '-1', '-i', `${D}/sfx/bgm-investigations.mp3`];
const used = [...new Set(cues.map(c => c.f))]; used.forEach(f => args.push('-i', `${D}/sfx/${FILES[f]}`));
let fc = `[1:a]aresample=48000,adelay=150|150,apad=whole_dur=${duration},asplit=2[vo][sc];`;
fc += `[2:a]aresample=48000,volume=0.16,atrim=0:${duration},afade=t=in:d=0.4,afade=t=out:st=${(duration - 1.2).toFixed(2)}:d=1.2[mu];[mu][sc]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[mud];`;
const labels = [];
cues.forEach((c, i) => { const idx = 3 + used.indexOf(c.f), ms = Math.round(c.t * 1000); fc += `[${idx}:a]aresample=48000,volume=${c.g},adelay=${ms}|${ms}[c${i}];`; labels.push(`[c${i}]`); });
fc += `[vo][mud]${labels.join('')}amix=inputs=${2 + labels.length}:normalize=0:duration=first,atrim=0:${duration},loudnorm=I=-14:TP=-1.5:LRA=11[a]`;
args.push('-filter_complex', fc, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', out);
execFileSync(FF, args, {stdio: 'inherit'}); console.log('mixed', out);
