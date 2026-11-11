// Film 32 "How Do I Send a Photo?" (look test): the claude-animated-shorts post chain (ink -> lens blur -> bloom ->
// neutral tone map -> grade) over our own world2; captions as a serif React layer; dip to black between places.
import React, { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame, interpolate } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { BlendFunction, BloomEffect, ToneMappingEffect, ToneMappingMode } from "postprocessing";
import { InkPass, noInkFallback } from "../bridge/ink";
import { LensBlur } from "../bridge/lensblur";
import { GradeEffect, GRADES } from "../bridge/grade";
import { World2 } from "./world2";
import { TOTAL, FPS, CAPS, dofAt, shotAt, SHOTS } from "./story2";

export const SEND_FRAMES = TOTAL;
const font = new FontFace("Playfair", `url(${staticFile("fonts/PlayfairDisplay-Italic.ttf")})`);
const fontReady = font.load().then((f) => document.fonts.add(f));
// interior grade: the golden S-curve, a touch cooler in the shadows
const LAMP_GRADE = { ...GRADES.golden, sat: [0.95, 1.05, 1.1] as [number, number, number], tintS: [0.035, -0.005] as [number, number], vig: [0.32, 0.36] as [number, number] };
const fwd = new THREE.Vector3(), fpt = new THREE.Vector3();
const Inner: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene } = useThree();
  const world = useMemo(() => new World2(), []);
  const fx = useMemo(() => {
    const bloom = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.55, luminanceThreshold: 1.0, luminanceSmoothing: 0.2, mipmapBlur: true, levels: 6, radius: 0.6 });
    return { ink: new InkPass(scene, camera as THREE.PerspectiveCamera), lens: new LensBlur({ maxCoC: 24, nearScale: 1.2 }), bloom,
      tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }), grade: new GradeEffect(GRADES.golden, 1) };
  }, [camera, scene]);
  const cam = camera as THREE.PerspectiveCamera;
  const target = world.update(f, cam, scene);
  noInkFallback(world.root);
  const d = dofAt(f); cam.getWorldDirection(fwd); fpt.set(...d.focus);
  fx.lens.focus = Math.max(0.3, fpt.sub(cam.position).dot(fwd)); fx.lens.cInf = d.cInf;
  fx.grade.set(shotAt(f).light === "lamp" ? LAMP_GRADE : GRADES.golden);
  void target;
  return (
    <>
      <primitive object={world.root} dispose={null} />
      <EffectComposer multisampling={4}>
        <primitive object={fx.ink} dispose={null} />
        <primitive object={fx.lens.pre} dispose={null} />
        <primitive object={fx.lens.main} dispose={null} />
        <primitive object={fx.bloom} dispose={null} />
        <primitive object={fx.tone} dispose={null} />
        <primitive object={fx.grade} dispose={null} />
      </EffectComposer>
    </>
  );
};
const Captions: React.FC<{ t: number }> = ({ t }) => (
  <>{CAPS.filter(([a, b]) => t >= a && t <= b).map(([a, b, s]) => (
    <div key={s} style={{ position: "absolute", left: 70, right: 70, top: 1470, textAlign: "center", fontFamily: "Playfair", fontSize: 60, lineHeight: 1.25, color: "#fff",
      opacity: interpolate(t, [a, a + 0.45, b - 0.45, b], [0, 1, 1, 0]), textShadow: "0 3px 16px rgba(0,0,0,.8)" }}>{s}</div>))}</>
);
export const SendPhoto: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS;
  const [h] = useState(() => delayRender("font"));
  useEffect(() => { fontReady.then(() => continueRender(h)); }, [h]);
  // dip to black at the place change (porch -> living room) and fade in/out
  const cut = SHOTS[2].a, dip = Math.max(0, 1 - Math.abs(f - cut + 0.5) / 9), black = Math.max(dip, 1 - Math.min(1, f / 12), Math.min(1, (f - (TOTAL - 20)) / 20));
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{ antialias: false, stencil: false, powerPreference: "high-performance" }} camera={{ fov: 40, near: 0.1, far: 1500 }}>
        <Inner />
      </ThreeCanvas>
      {black > 0 && <AbsoluteFill style={{ background: "#000", opacity: black }} />}
      <Captions t={t} />
    </AbsoluteFill>
  );
};
