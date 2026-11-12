import React from 'react';
import { Composition } from 'remotion';
import { Film, FPS, W, H, DUR } from './Film.jsx';
import { Test } from './Test.jsx';
export const Root = () => (<>
  <Composition id="JustInCase" component={Film} durationInFrames={DUR * FPS} fps={FPS} width={W} height={H} />
  <Composition id="Test" component={Test} durationInFrames={300} fps={FPS} width={W} height={H} />
</>);
