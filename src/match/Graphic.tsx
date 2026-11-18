import { useLayoutEffect, useRef } from 'react';
import { dartsLeftFor, nineOn, shownRemaining, type Match, type Side } from '../engine/match';
import { isStandard, routeFor, rulesShort } from '../engine/rules';

/** Gradients that give the graphic its depth: lit from above, darker below, gold score boxes. */
const DEFS = (
  <defs>
    <linearGradient id="gHead" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#18202b" />
      <stop offset="1" stopColor="#05070a" />
    </linearGradient>
    <linearGradient id="gRow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#1e2935" />
      <stop offset="1" stopColor="#0e141c" />
    </linearGradient>
    <linearGradient id="gRowOn" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2c3d50" />
      <stop offset="1" stopColor="#162029" />
    </linearGradient>
    <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#18212c" />
      <stop offset="1" stopColor="#090d13" />
    </linearGradient>
    <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#2d3b4c" />
      <stop offset="1" stopColor="#17202b" />
    </linearGradient>
    <linearGradient id="gL" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#37495c" />
      <stop offset="1" stopColor="#1c2836" />
    </linearGradient>
    <linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ffe28e" />
      <stop offset=".5" stopColor="#f3b83a" />
      <stop offset="1" stopColor="#c58712" />
    </linearGradient>
    <linearGradient id="gGloss" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#fff" stopOpacity=".16" />
      <stop offset="1" stopColor="#fff" stopOpacity="0" />
    </linearGradient>
    <linearGradient id="gP0" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#ff8a6a" />
      <stop offset="1" stopColor="#d9431f" />
    </linearGradient>
    <linearGradient id="gP1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stopColor="#6fdcf0" />
      <stop offset="1" stopColor="#1f97ad" />
    </linearGradient>
  </defs>
);

function statusText(m: Match): string {
  const f = m.format;
  if (m.winner >= 0) {
    const w = m.winner as Side;
    const l: Side = w === 0 ? 1 : 0;
    const score = f.play === 'sets' ? `${m.sets[w]}–${m.sets[l]}` : `${m.legs[w]}–${m.legs[l]}`;
    return `${m.players[w].name.toUpperCase()} WINS ${score}`;
  }
  const where =
    f.play === 'sets'
      ? `SET ${m.setNo} · LEG ${m.legNo} · BEST OF ${f.bestOfSets} SETS`
      : `LEG ${m.legNo} · BEST OF ${f.bestOfLegs} LEGS`;
  return isStandard(f) ? where : `${where} · ${f.startScore} ${rulesShort(f)}`;
}

export function Graphic({ m }: { m: Match }) {
  const svg = useRef<SVGSVGElement>(null);
  const sets = m.format.play === 'sets';
  // Column layout: sets play shows darts, sets and legs; legs play shows darts and legs.
  const nameW = sets ? 236 : 266;
  const dartsX = nameW;
  const dartsW = sets ? 30 : 36;

  // Place the 9 badge just after each name, once the name's width is known.
  useLayoutEffect(() => {
    const el = svg.current;
    if (!el) return;
    for (const p of [0, 1]) {
      const nine = el.querySelector<SVGGElement>(`[data-nine="${p}"]`);
      const name = el.querySelector<SVGTextElement>(`[data-name="${p}"]`);
      if (nine && name) nine.setAttribute('transform', `translate(${(20 + name.getComputedTextLength() + 14).toFixed(1)} ${22 + p * 39 + 19})`);
    }
  });

  const rows = ([0, 1] as Side[]).map((p) => {
    const y0 = 22 + p * 39;
    const cy = y0 + 19;
    const on = m.phase !== 'over' && m.turn === p;
    const busted = m.phase === 'afterBust' && m.bust === p;
    const route = routeFor(m.format.outRule, shownRemaining(m, p), dartsLeftFor(m, p));
    const fl = m.flash && m.flash.p === p ? m.flash.what : null;
    return (
      <g key={p}>
        <rect x={0} y={y0} width={nameW} height={38} fill={on ? 'url(#gRowOn)' : 'url(#gRow)'} />
        <rect x={0} y={y0} width={4} height={38} fill={`url(#gP${p})`} />
        {on && <path d={`M8 ${cy - 6}L14 ${cy}L8 ${cy + 6}Z`} fill="url(#gGold)" />}
        <text x={20} y={cy} className="g-name" data-name={p}>
          {m.players[p].name.toUpperCase()}
        </text>
        {nineOn(m, p) && (
          <g className="g-nine" data-nine={p} transform="translate(-100 -100)">
            <circle r={9} fill="url(#gGold)" stroke="#7a5208" strokeWidth={0.8} />
            <text y={0.5}>9</text>
          </g>
        )}
        {route && (
          <text x={nameW - 5} y={cy} className="g-route">
            {route.map((t) => t.label).join(' ')}
          </text>
        )}
        <rect x={dartsX} y={y0} width={dartsW} height={38} fill="url(#gD)" />
        <text x={dartsX + dartsW / 2} y={cy} className="g-darts">
          {m.dartsLeg[p]}
        </text>
        {sets && (
          <>
            <rect x={266} y={y0} width={36} height={38} fill="url(#gS)" />
            {(fl === 'set' || fl === 'match') && <rect x={266} y={y0} width={36} height={38} fill="url(#gGold)" className="flash" />}
            <text x={284} y={cy} className="g-num">
              {m.sets[p]}
            </text>
          </>
        )}
        <rect x={302} y={y0} width={36} height={38} fill="url(#gL)" />
        {(fl === 'leg' || (!sets && fl === 'match')) && <rect x={302} y={y0} width={36} height={38} fill="url(#gGold)" className="flash" />}
        <text x={320} y={cy} className="g-num">
          {m.legs[p]}
        </text>
        <rect x={338} y={y0} width={42} height={38} fill="url(#gGold)" />
        <text x={359} y={cy} className={`g-score${busted ? ' bust' : ''}`}>
          {busted ? 'BUST' : m.rem[p]}
        </text>
        {/* Depth: a gloss over the top half, a bright top edge and a dark bottom edge. */}
        <rect x={0} y={y0} width={380} height={19} fill="url(#gGloss)" pointerEvents="none" />
        <rect x={0} y={y0} width={380} height={1} fill="#fff" opacity={0.09} />
        <rect x={0} y={y0 + 37} width={380} height={1} fill="#000" opacity={0.5} />
      </g>
    );
  });

  const label = ([0, 1] as Side[])
    .map((p) => `${m.players[p].name}: ${sets ? `${m.sets[p]} sets, ` : ''}${m.legs[p]} legs, ${m.phase === 'afterBust' && m.bust === p ? 'bust' : `${m.rem[p]} left`}`)
    .join('. ');

  return (
    <svg ref={svg} className="mv-graphic" viewBox="0 0 380 100" role="img" aria-label={label} data-testid="graphic">
      {DEFS}
      <rect width={380} height={100} rx={3} fill="url(#gHead)" />
      <text x={10} y={11} className="g-status">
        {statusText(m)}
      </text>
      <text x={dartsX + dartsW / 2} y={11} className="g-col">
        DARTS
      </text>
      {sets && (
        <text x={284} y={11} className="g-col">
          S
        </text>
      )}
      <text x={320} y={11} className="g-col">
        L
      </text>
      {rows}
    </svg>
  );
}
