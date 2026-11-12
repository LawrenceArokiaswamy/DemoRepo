import React from 'react';
import { Composition } from 'remotion';
import { Film, FPS, W, H, DUR } from './Film.jsx';
export const Root = () => <Composition id="JustInCase" component={Film} durationInFrames={DUR * FPS} fps={FPS} width={W} height={H} />;
