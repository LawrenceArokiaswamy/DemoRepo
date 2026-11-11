import React from "react";
import { Composition } from "remotion";
import { BridgeShort, BRIDGE_FRAMES } from "./videos/bridge/Bridge";
import { Lab } from "./videos/sendphoto/Lab";
import { SendPhoto, SEND_FRAMES } from "./videos/sendphoto/SendPhoto";
import { SendPhotoFull, FULL_FRAMES } from "./videos/sendphoto/SendPhotoFull";
import { Sacrifice, SAC_FRAMES } from "./videos/sacrifice/Sacrifice";
export const Root: React.FC = () => (
  <>
    <Composition id="BridgeShort" component={BridgeShort} durationInFrames={BRIDGE_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="SendPhoto" component={SendPhoto} durationInFrames={SEND_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="SendPhotoFull" component={SendPhotoFull} durationInFrames={FULL_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Sacrifice" component={Sacrifice} durationInFrames={SAC_FRAMES} fps={30} width={1080} height={1920} />
    <Composition id="Lab" component={Lab} durationInFrames={1} fps={30} width={1080} height={1920} />
  </>
);
