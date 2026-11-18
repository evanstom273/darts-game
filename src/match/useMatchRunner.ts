import { useCallback, useEffect, useRef, useState } from 'react';
import { advance, newMatch, type Match, type MatchSetup } from '../engine/match';

/** Plays a match forward in real time, at the chosen speed. */
export function useMatchRunner(initial: () => MatchSetup) {
  const [match, setMatch] = useState<Match>(() => newMatch(initial()));
  const [version, setVersion] = useState(0);
  const [playing, setPlayingState] = useState(true);
  const [speed, setSpeed] = useState(1);
  const pending = useRef<number>(1400);

  useEffect(() => {
    if (!playing || match.phase === 'over') return;
    const id = window.setTimeout(() => {
      const ev = advance(match);
      pending.current = ev.delay ?? 0;
      if (ev.type === 'matchOver') setPlayingState(false);
      setVersion((v) => v + 1);
    }, pending.current / speed);
    return () => window.clearTimeout(id);
  }, [match, playing, speed, version]);

  const setPlaying = useCallback((on: boolean) => {
    if (on) pending.current = Math.min(pending.current, 900);
    setPlayingState(on);
  }, []);

  const start = useCallback((setup: MatchSetup) => {
    pending.current = 1400;
    setMatch(newMatch(setup));
    setVersion(0);
    setPlayingState(true);
  }, []);

  return { match, version, playing, setPlaying, speed, setSpeed, start };
}
