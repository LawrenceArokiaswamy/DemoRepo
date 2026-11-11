import React from 'react';
import { Composition } from 'remotion';
import { Film } from './Film.jsx';
import { W, H, DUR } from './engine.js';
export const Root = () => <Composition id="LookTest" component={Film} durationInFrames={DUR * 30} fps={30} width={W} height={H} />;
