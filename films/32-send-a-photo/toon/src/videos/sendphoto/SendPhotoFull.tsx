// Film 32 "How Do I Send a Photo?" (full 88 s): claude-animated-shorts post chain over world3; phone screens and
// captions as React layers; dips to black between places; flash on Dad's photo; the closing question.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, interpolate, getInputProps } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback } from "../bridge/ink";
import { LensBlur } from "../bridge/lensblur";
import { GradeEffect, GRADES, GradeParams } from "../bridge/grade";
import { World3 } from "./world3";
import { TOTAL, FPS, CAPS, dofAt, shotAt, SHOTS, Light } from "./story3";
import { MissedCalls, MomTexts, Drafts } from "./PhoneUI";

export const FULL_FRAMES = TOTAL;
const font = new FontFace("Playfair", `url(${staticFile("fonts/PlayfairDisplay-Italic.ttf")})`);
const fontReady = font.load().then((f) => document.fonts.add(f));
const G = GRADES.golden;
const GR: Record<Light, GradeParams> = {
  golden: G, morning: GRADES.day,
  lamp: { ...G, sat: [0.95, 1.05, 1.1], tintS: [0.035, -0.005], vig: [0.32, 0.36] },
  night: { ...G, ky: [0, 0.08, 0.22, 0.5, 0.76, 0.9, 1], sat: [0.75, 0.8, 0.9], tintS: [0.05, -0.012], tintM: [0.02, -0.01], vig: [0.42, 0.32] },
  office: { ...GRADES.day, sat: [0.7, 0.75, 0.85], tintS: [0.03, -0.01], tintM: [0.015, -0.008], vig: [0.25, 0.4] },
  rain: { ...GRADES.day, ky: [0, 0.1, 0.26, 0.52, 0.76, 0.9, 1], sat: [0.45, 0.5, 0.6], tintS: [0.03, -0.006], tintM: [0.02, -0.006], vig: [0.35, 0.35] },
};
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();
const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World3(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, camera as THREE.PerspectiveCamera), lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.55, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), grade: new GradeEffect(GRADES.golden, 1),
  }), [camera, scene]);
  const cam = camera as THREE.PerspectiveCamera;
  world.update(f, cam, scene);
  // stills only: Dad's own photos for the drafts screen, shot from where he stands (inputProps { photo: { pos, look, fov } })
  const ph = (getInputProps() as { photo?: { pos: [number, number, number]; look: [number, number, number]; fov: number } }).photo;
  if (ph) { cam.position.set(...ph.pos); cam.up.set(0, 1, 0); cam.lookAt(...ph.look); cam.fov = ph.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld(); world.update(f, cam, scene, true); }
  noInkFallback(world.root);
  const d = dofAt(f); cam.getWorldDirection(fwd); fpt.set(...d.focus);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd)); fx.lens.cInf = d.cInf;
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
const Caption: React.FC<{ t: number }> = ({ t }) => (
  <>{CAPS.filter(([a, b]) => t >= a && t <= b).map(([a, b, s]) => (
    <div key={s} style={{ position: "absolute", left: 70, right: 70, top: 1470, textAlign: "center", fontFamily: "Playfair", fontSize: 60, lineHeight: 1.25, color: "#fff",
      opacity: interpolate(t, [a, a + 0.45, b - 0.45, b], [0, 1, 1, 0]), textShadow: "0 3px 16px rgba(0,0,0,.8)" }}>{s}</div>))}</>
);
const sec = (id: number) => SHOTS[id - 1].a / FPS;
export const SendPhotoFull: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS, s = shotAt(f), lt = (f - s.a) / FPS;
  const [h] = useState(() => delayRender("font"));
  useEffect(() => { fontReady.then(() => continueRender(h)); }, [h]);
  // dips to black at place changes (shot boundaries listed), fade in / out
  const dips = [3, 6, 8, 10, 12, 13, 14, 15, 16, 17].map((id) => SHOTS[id - 1].a);
  let black = Math.max(1 - Math.min(1, f / 12), Math.min(1, (f - (TOTAL - 24)) / 24));
  for (const c of dips) black = Math.max(black, 1 - Math.abs(f - c + 0.5) / 8);
  const flashT = t - (sec(7) + 2.75), flash = flashT > 0 && flashT < 0.4 ? Math.sin((flashT / 0.4) * Math.PI) * 0.75 : 0;
  const endQ = interpolate(t, [84.0, 85.0], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 40, near: 0.1, far: 1500 }}>
        <Inner />
      </ThreeCanvas>
      {s.id === 10 && <MissedCalls t={lt} />}
      {s.id === 11 && <MomTexts t={lt} />}
      {s.id === 15 && <Drafts t={lt} />}
      {flash > 0 && <AbsoluteFill style={{ background: "#fffaf0", opacity: flash }} />}
      {black > 0 && <AbsoluteFill style={{ background: "#000", opacity: black }} />}
      {!(getInputProps() as { photo?: unknown; noCaps?: boolean }).photo && !(getInputProps() as { noCaps?: boolean }).noCaps && <Caption t={t} />}
      {endQ > 0 && <div style={{ position: "absolute", left: 80, right: 80, top: 700, textAlign: "center", fontFamily: "Playfair", fontSize: 76, lineHeight: 1.25, color: "#fff", opacity: endQ * (1 - Math.min(1, (f - (TOTAL - 24)) / 24)), textShadow: "0 4px 22px rgba(0,0,0,.85)" }}>When did you last sit with your dad?</div>}
    </AbsoluteFill>
  );
};
