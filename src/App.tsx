import { useCallback, useEffect, useState } from 'react';
import { MatchView } from './match/MatchView';
import { useMatchRunner } from './match/useMatchRunner';
import { SimPanel } from './panel/SimPanel';
import { mulberry32, randomSeed } from './engine/rng';
import { loadSetup, saveSetup } from './settings';
import { resolveSetup, type Setup } from './sim/setup';

const freshMatch = (s: Setup) => {
  const seed = randomSeed();
  return resolveSetup(s, mulberry32(seed ^ 0x9e3779b9), seed);
};

export function App() {
  const [setup, setSetup] = useState<Setup>(loadSetup);
  const [simOpen, setSimOpen] = useState(false);
  const runner = useMatchRunner(() => freshMatch(setup));

  useEffect(() => saveSetup(setup), [setup]);
  const watchNew = useCallback(() => runner.start(freshMatch(setup)), [runner, setup]);

  return (
    <>
      <div hidden={simOpen}>
        <MatchView
          match={runner.match}
          version={runner.version}
          playing={runner.playing}
          speed={runner.speed}
          onPlaying={runner.setPlaying}
          onSpeed={runner.setSpeed}
          onNewMatch={watchNew}
          onOpenSim={() => setSimOpen(true)}
        />
      </div>
      <SimPanel
        open={simOpen}
        setup={setup}
        match={runner.match}
        onChange={setSetup}
        onWatch={runner.start}
        onWatchNew={watchNew}
        onClose={() => setSimOpen(false)}
      />
    </>
  );
}
