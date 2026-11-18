import { useLayoutEffect, useRef } from 'react';
import { dartsLeftFor, nineOn, shownRemaining, type Match, type Side } from '../engine/match';
import { isStandard, routeFor, rulesShort } from '../engine/rules';

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
        <rect x={0} y={y0} width={nameW} height={38} className={`g-row${on ? ' on' : ''}`} />
        <rect x={0} y={y0} width={4} height={38} className={`f${p}`} />
        {on && <path d={`M8 ${cy - 6}L14 ${cy}L8 ${cy + 6}Z`} className="g-marker" />}
        <text x={20} y={cy} className="g-name" data-name={p}>
          {m.players[p].name.toUpperCase()}
        </text>
        {nineOn(m, p) && (
          <g className="g-nine" data-nine={p} transform="translate(-100 -100)">
            <circle r={9} />
            <text y={0.5}>9</text>
          </g>
        )}
        {route && (
          <text x={nameW - 5} y={cy} className="g-route">
            {route.map((t) => t.label).join(' ')}
          </text>
        )}
        <rect x={dartsX} y={y0} width={dartsW} height={38} className="g-cd" />
        <text x={dartsX + dartsW / 2} y={cy} className="g-darts">
          {m.dartsLeg[p]}
        </text>
        {sets && (
          <>
            <rect x={266} y={y0} width={36} height={38} className={`g-cs${fl === 'set' || fl === 'match' ? ' flash' : ''}`} />
            <text x={284} y={cy} className="g-num">
              {m.sets[p]}
            </text>
          </>
        )}
        <rect x={302} y={y0} width={36} height={38} className={`g-cl${fl === 'leg' || (!sets && fl === 'match') ? ' flash' : ''}`} />
        <text x={320} y={cy} className="g-num">
          {m.legs[p]}
        </text>
        <rect x={338} y={y0} width={42} height={38} className="g-scorebox" />
        <text x={359} y={cy} className={`g-score${busted ? ' bust' : ''}`}>
          {busted ? 'BUST' : m.rem[p]}
        </text>
      </g>
    );
  });

  const label = ([0, 1] as Side[])
    .map((p) => `${m.players[p].name}: ${sets ? `${m.sets[p]} sets, ` : ''}${m.legs[p]} legs, ${m.phase === 'afterBust' && m.bust === p ? 'bust' : `${m.rem[p]} left`}`)
    .join('. ');

  return (
    <svg ref={svg} className="mv-graphic" viewBox="0 0 380 100" role="img" aria-label={label} data-testid="graphic">
      <rect width={380} height={100} className="g-bg" />
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
