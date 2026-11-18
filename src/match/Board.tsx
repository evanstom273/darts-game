import { memo, useMemo } from 'react';
import { DEG, ORDER, RAD } from '../engine/board';
import type { Dart } from '../engine/match';

const P = (r: number, a: number): [number, number] => [+(r * Math.cos(a)).toFixed(2), +(-r * Math.sin(a)).toFixed(2)];
const sector = (r1: number, r2: number, a1: number, a2: number): string => {
  const [x1, y1] = P(r2, a1);
  const [x2, y2] = P(r2, a2);
  const [x3, y3] = P(r1, a2);
  const [x4, y4] = P(r1, a1);
  return `M${x1} ${y1}A${r2} ${r2} 0 0 1 ${x2} ${y2}L${x3} ${y3}A${r1} ${r1} 0 0 0 ${x4} ${y4}Z`;
};

const BoardFace = memo(function BoardFace() {
  const beds = useMemo(
    () =>
      ORDER.flatMap((n, i) => {
        const c = (90 - 18 * i) * DEG;
        const a1 = c + 9 * DEG;
        const a2 = c - 9 * DEG;
        const dark = i % 2 === 0;
        const single = dark ? 'b-dark' : 'b-light';
        const ring = dark ? 'b-red' : 'b-green';
        return [
          <path key={`${n}a`} d={sector(RAD.outerBull, RAD.trebleIn, a1, a2)} className={single} />,
          <path key={`${n}b`} d={sector(RAD.trebleIn, RAD.trebleOut, a1, a2)} className={ring} />,
          <path key={`${n}c`} d={sector(RAD.trebleOut, RAD.doubleIn, a1, a2)} className={single} />,
          <path key={`${n}d`} d={sector(RAD.doubleIn, RAD.doubleOut, a1, a2)} className={ring} />,
        ];
      }),
    [],
  );
  return (
    <>
      <circle r={226} className="b-surround" />
      {beds}
      <circle r={RAD.outerBull} className="b-green" />
      <circle r={RAD.bull} className="b-red" />
      <g className="b-wire">
        {[RAD.bull, RAD.outerBull, RAD.trebleIn, RAD.trebleOut, RAD.doubleIn, RAD.doubleOut].map((r) => (
          <circle key={r} r={r} />
        ))}
        {ORDER.map((n, i) => {
          const a = (90 - 18 * i + 9) * DEG;
          const [x1, y1] = P(RAD.outerBull, a);
          const [x2, y2] = P(RAD.doubleOut, a);
          return <line key={n} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
      </g>
      {ORDER.map((n, i) => {
        const [x, y] = P(197, (90 - 18 * i) * DEG);
        return (
          <text key={n} x={x} y={y} className="b-num">
            {n}
          </text>
        );
      })}
    </>
  );
});

function DartMark({ d }: { d: Dart }) {
  const rot = ((d.id * 37) % 25) - 12;
  return (
    <g transform={`translate(${d.x.toFixed(2)} ${(-d.y).toFixed(2)}) rotate(${rot}) scale(1.35)`}>
      <g className="land">
        <path d="M0 0L9 16" className="d-under" />
        <path d="M0 0L9 16" className="d-barrel" />
        <path d="M9 16L14 25" className="d-shaft" />
        <path d="M12 22L23 24L19.5 35L10 31Z" className={`d-flight f${d.p}`} />
        <circle r={1.5} className="d-tip" />
      </g>
    </g>
  );
}

export function Board({ darts, hidden }: { darts: Dart[]; hidden?: boolean }) {
  return (
    <svg
      className="mv-board"
      viewBox="-228 -228 456 456"
      role="img"
      aria-label="Dartboard"
      style={hidden ? { visibility: 'hidden' } : undefined}
      data-testid="board"
    >
      <BoardFace />
      <g>
        {darts.map((d) => (
          <DartMark key={d.id} d={d} />
        ))}
      </g>
    </svg>
  );
}
