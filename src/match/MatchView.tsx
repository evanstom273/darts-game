import { useEffect, useState } from 'react';
import './match.css';
import { Board3D } from './board3d/Board3D';
import { CAMERAS, type CameraName, type DartDesign } from './board3d/options';
import { Graphic } from './Graphic';
import { StatsCard } from './StatsCard';
import { aimPoint } from '../engine/board';
import { chooseAim, OPENING_DOUBLE } from '../engine/rules';
import type { Match } from '../engine/match';
import { loadView, saveView } from '../viewSettings';

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

const WHOLE_BOARD = { x: 0, y: 0, r: 240 };
const TARGET_R = 75;

/** Frame these darts: their middle, pulled back far enough to show them all. */
function frameDarts(ds: Match['boardDarts']): { x: number; y: number; r: number } {
  const x = ds.reduce((s, d) => s + d.x, 0) / ds.length;
  const y = ds.reduce((s, d) => s + d.y, 0) / ds.length;
  const spread = Math.max(...ds.map((d) => Math.hypot(d.x - x, d.y - y)));
  return { x: Math.round(x), y: Math.round(y), r: Math.round(Math.min(240, Math.max(TARGET_R, spread + 55))) };
}

/**
 * What the dynamic camera frames. Before each dart: that dart's target (treble 20 when scoring, then
 * round the checkout dart by dart, so 32 is double 16). When the visit ends: all of its darts.
 * Between legs and at the end: the whole board.
 */
function focusFor(m: Match): { x: number; y: number; r: number } {
  if (m.phase === 'over') return WHOLE_BOARD;
  if (m.phase === 'afterVisit' || m.phase === 'afterBust' || m.phase === 'afterLeg') {
    return m.boardDarts.length ? frameDarts(m.boardDarts) : WHOLE_BOARD;
  }
  const p = m.turn;
  const target = m.opened[p] ? chooseAim(m.format.outRule, m.rem[p], 3 - m.visit.darts.length).target : OPENING_DOUBLE;
  const pt = aimPoint(target);
  return { x: Math.round(pt.x), y: Math.round(pt.y), r: TARGET_R };
}

interface Props {
  match: Match;
  version: number;
  playing: boolean;
  speed: number;
  onPlaying: (on: boolean) => void;
  onSpeed: (s: number) => void;
  onNewMatch: () => void;
  onOpenSim: () => void;
}

export function MatchView({ match: m, version, playing, speed, onPlaying, onSpeed, onNewMatch, onOpenSim }: Props) {
  const wide = useWide();
  const [statsShown, setStatsShown] = useState(false);
  const [view, setView] = useState(loadView);
  useEffect(() => saveView(view), [view]);
  const showStats = !wide && statsShown;
  const over = m.phase === 'over';
  const focus = focusFor(m);

  return (
    <div className={`mv-app${wide ? ' mv-wide' : ''}`}>
      <header className="mv-top">
        <h1>Darts</h1>
        <span className="tag">Match view · tuning build</span>
      </header>
      <main className="mv-view">
        <section className="mv-stage">
          <div className="mv-screen">
            <Board3D darts={m.boardDarts} version={version} camera={view.camera} design={view.design} focus={focus} speed={speed} hidden={showStats} />
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
              {[1, 2, 4, 8].map((s) => (
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
          <div className="mv-opts">
            <span className="mv-opt-label">Camera</span>
            <div className="mv-seg small" role="group" aria-label="Camera">
              {CAMERAS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="mv-btn"
                  aria-pressed={view.camera === c.id}
                  onClick={() => setView({ ...view, camera: c.id as CameraName })}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <span className="mv-opt-label">Darts</span>
            <div className="mv-seg small" role="group" aria-label="Darts">
              {(['silver', 'black'] as DartDesign[]).map((d) => (
                <button key={d} type="button" className="mv-btn" aria-pressed={view.design === d} onClick={() => setView({ ...view, design: d })}>
                  {d === 'silver' ? 'Silver' : 'Black'}
                </button>
              ))}
            </div>
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
