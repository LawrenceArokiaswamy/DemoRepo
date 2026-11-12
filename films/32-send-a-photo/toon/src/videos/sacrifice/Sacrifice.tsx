// Film 33 "The Things They Never Bought" (88 s): the claude-animated-shorts post chain over world4; phone screens and
// the closing message as React layers; dips to black between places. Subtitles are burned in afterwards (subs33.ass).
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback } from "../bridge/ink";
import { LensBlur } from "../bridge/lensblur";
import { GradeEffect, GRADES, GradeParams } from "../bridge/grade";
import { World4 } from "./world4";
import { TOTAL, FPS, dofAt, shotAt, SHOTS, Light } from "./story4";
import { MoneyTexts, MomCall } from "./PhoneUI4";

export const SAC_FRAMES = TOTAL;
const font = new FontFace("Playfair", `url(${staticFile("fonts/PlayfairDisplay-Italic.ttf")})`);
const fontReady = font.load().then((f) => document.fonts.add(f));
const G = GRADES.golden;
const GR: Record<Light, GradeParams> = {
  golden: G, morning: GRADES.day,
  lamp: { ...G, sat: [0.95, 1.05, 1.1], tintS: [0.035, -0.005], vig: [0.32, 0.36] },
  night: { ...G, ky: [0, 0.08, 0.22, 0.5, 0.76, 0.9, 1], sat: [0.75, 0.8, 0.9], tintS: [0.05, -0.012], tintM: [0.02, -0.01], vig: [0.42, 0.32] },
  rain: { ...GRADES.day, ky: [0, 0.08, 0.22, 0.48, 0.72, 0.88, 1], sat: [0.55, 0.6, 0.7], tintS: [-0.01, -0.03], tintM: [-0.005, -0.02], vig: [0.4, 0.35] },
  street: { ...G, ky: [0, 0.07, 0.2, 0.46, 0.72, 0.9, 1], sat: [0.7, 0.8, 0.9], tintS: [0.0, -0.03], tintM: [0.02, -0.01], vig: [0.45, 0.3] },
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();
const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World4(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera), lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.55, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), grade: new GradeEffect(GRADES.golden, 1),
  }), [camera, scene]);
  const cam = camera as THREE.PerspectiveCamera;
  world.update(f, cam, scene);
  noInkFallback(world.root);
  const d = dofAt(f); cam.getWorldDirection(fwd); fpt.set(...d.focus);
  fx.lens.focus = Math.max(0.2, fpt.sub(cam.position).dot(fwd)); fx.lens.cInf = d.cInf;
  fx.grade.set(GR[shotAt(f).light]);
  return (
    <>
      <primitive object={world.root} dispose={null} />
      <EffectComposer multisampling={4}>
        <primitive object={fx.ink} dispose={null} /><primitive object={fx.lens.pre} dispose={null} /><primitive object={fx.lens.main} dispose={null} />
        <primitive object={fx.bloom} dispose={null} /><primitive object={fx.tone} dispose={null} /><primitive object={fx.grade} dispose={null} />
      </EffectComposer>
    </>
  );
};
export const Sacrifice: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS, s = shotAt(f), lt = (f - s.a) / FPS;
  const [h] = useState(() => delayRender("font"));
  useEffect(() => { fontReady.then(() => continueRender(h)); }, [h]);
  const dips = [2, 4, 5, 7, 9, 10, 11, 13, 14, 15, 18, 20].map((id) => SHOTS[id - 1].a);
  let black = Math.max(1 - Math.min(1, f / 12), Math.min(1, (f - (TOTAL - 20)) / 20));
  for (const c of dips) black = Math.max(black, 1 - Math.abs(f - c + 0.5) / 7);
  const msg = interpolate(t, [82.6, 83.6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const qn = interpolate(t, [85.0, 85.8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const out = 1 - Math.min(1, Math.max(0, (f - (TOTAL - 20)) / 20));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 40, near: 0.05, far: 1500 }}>
        <Inner />
      </ThreeCanvas>
      {s.id === 13 && <MoneyTexts t={lt} />}
      {s.id === 14 && <MomCall t={lt} />}
      {black > 0 && <AbsoluteFill style={{ background: "#000", opacity: black }} />}
      {msg > 0 && <AbsoluteFill style={{ background: `rgba(0,0,0,${0.35 * msg})` }} />}
      {msg > 0 && <div style={{ position: "absolute", left: 70, right: 70, top: 470, textAlign: "center", fontFamily: "Playfair", fontSize: 84, lineHeight: 1.2, color: "#fff", opacity: msg * out, textShadow: "0 4px 22px rgba(0,0,0,.9)" }}>Never forget what they gave up for you.</div>}
      {qn > 0 && <div style={{ position: "absolute", left: 80, right: 80, top: 760, textAlign: "center", fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 52, lineHeight: 1.25, color: "#ffe600", opacity: qn * out, textShadow: "0 3px 16px rgba(0,0,0,.9)" }}>What did your parents give up for you?</div>}
    </AbsoluteFill>
  );
};
