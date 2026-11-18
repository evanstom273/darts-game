import { useEffect, useRef, useState } from 'react';
import type { Dart } from '../../engine/match';
import type { BoardScene } from './scene';
import type { CameraName, DartDesign } from './options';

interface Props {
  darts: Dart[];
  /** Bumped whenever the darts change (the list is updated in place). */
  version: number;
  camera: CameraName;
  design: DartDesign;
  focus: { x: number; y: number; r: number };
  /** Match speed: the camera moves faster at higher speeds so it keeps up. */
  speed: number;
  hidden?: boolean;
}

/** The 3D board. three.js loads on its own, after the rest of the page. */
export function Board3D({ darts, version, camera, design, focus, speed, hidden }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const board = useRef<BoardScene | null>(null);
  const shown = useRef(0);
  const [state, setState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const latest = useRef({ darts, camera, design, focus });
  latest.current = { darts, camera, design, focus };

  useEffect(() => {
    let alive = true;
    let made: BoardScene | null = null;
    import('./scene')
      .then(({ createBoardScene }) => createBoardScene(host.current!))
      .then((b) => {
        if (!alive) {
          b.dispose();
          return;
        }
        made = b;
        board.current = b;
        const l = latest.current;
        b.setDesign(l.design);
        b.setFocus(l.focus.x, l.focus.y, l.focus.r);
        b.setCamera(l.camera, true);
        b.sync(l.darts, false);
        shown.current = l.darts.length;
        setState('ready');
      })
      .catch(() => alive && setState('failed'));
    return () => {
      alive = false;
      made?.dispose();
      board.current = null;
    };
  }, []);

  useEffect(() => {
    const b = board.current;
    if (!b) return;
    b.sync(darts, darts.length > shown.current);
    shown.current = darts.length;
  }, [darts, version]);
  useEffect(() => board.current?.setCamera(camera), [camera]);
  useEffect(() => board.current?.setDesign(design), [design]);
  const moveMs = Math.max(110, 420 / Math.max(1, speed));
  useEffect(() => board.current?.setFocus(focus.x, focus.y, focus.r, moveMs), [focus.x, focus.y, focus.r, moveMs]);

  return (
    <div
      ref={host}
      className="mv-board3d"
      role="img"
      aria-label="Dartboard"
      data-testid="board"
      data-state={state}
      style={hidden ? { visibility: 'hidden' } : undefined}
    >
      {state === 'failed' && (
        <div className="mv-board-fallback">This browser can't draw 3D graphics, so the board can't be shown. The score and stats still work.</div>
      )}
    </div>
  );
}
