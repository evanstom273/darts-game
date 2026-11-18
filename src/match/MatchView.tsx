import { useEffect, useState } from 'react';
import './match.css';
import { Board } from './Board';
import { Graphic } from './Graphic';
import { StatsCard } from './StatsCard';
import type { Match } from '../engine/match';

const ICON_PAUSE = (
  <svg viewBox="0 0 14 14" aria-hidden="true">
    <rect x="2" y="1" width="3.5" height="12" rx="1" />
    <rect x="8.5" y="1" width="3.5" height="12" rx="1" />
  </svg>
);
const ICON_PLAY = (
  <svg viewBox="0 0 14 14" aria-hidden="true">
    <path d="M3 1.2 12.5 7 3 12.8Z" />
  </svg>
);

function useWide(): boolean {
  const q = '(min-width: 700px)';
  const [wide, setWide] = useState(() => window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
}

interface Props {
  match: Match;
  playing: boolean;
  speed: number;
  onPlaying: (on: boolean) => void;
  onSpeed: (s: number) => void;
  onNewMatch: () => void;
  onOpenSim: () => void;
}

export function MatchView({ match: m, playing, speed, onPlaying, onSpeed, onNewMatch, onOpenSim }: Props) {
  const wide = useWide();
  const [statsShown, setStatsShown] = useState(false);
  const showStats = !wide && statsShown;
  const over = m.phase === 'over';

  return (
    <div className={`mv-app${wide ? ' mv-wide' : ''}`}>
      <header className="mv-top">
        <h1>Darts</h1>
        <span className="tag">Match view · tuning build</span>
      </header>
      <main className="mv-view">
        <section className="mv-stage">
          <div className="mv-screen">
            <Board darts={m.boardDarts} hidden={showStats} />
            {showStats && (
              <div className="mv-swap">
                <StatsCard m={m} />
              </div>
            )}
          </div>
          <Graphic m={m} />
          <div className="mv-controls">
            <button type="button" className="mv-btn" disabled={over} onClick={() => onPlaying(!playing)} aria-label={playing ? 'Pause' : 'Play'}>
              {playing ? ICON_PAUSE : ICON_PLAY}
              {playing ? 'Pause' : over ? 'Finished' : 'Play'}
            </button>
            <div className="mv-seg" role="group" aria-label="Speed">
              {[1, 2, 4].map((s) => (
                <button key={s} type="button" className="mv-btn" aria-pressed={speed === s} onClick={() => onSpeed(s)}>
                  {s}×
                </button>
              ))}
            </div>
            {!wide && (
              <button type="button" className="mv-btn" aria-pressed={statsShown} onClick={() => setStatsShown(!statsShown)}>
                {statsShown ? 'Board' : 'Stats'}
              </button>
            )}
            <button type="button" className="mv-btn" onClick={onNewMatch}>
              New match
            </button>
            <button type="button" className="mv-btn gold" onClick={onOpenSim}>
              Simulate
            </button>
          </div>
        </section>
        {wide && (
          <aside className="mv-aside" aria-label="Match stats">
            <StatsCard m={m} />
          </aside>
        )}
      </main>
    </div>
  );
}
