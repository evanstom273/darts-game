import { average, checkoutPct, first9, type Match, type Stats } from '../engine/match';

const lastName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length > 2 && /^(de|van|von|der|den|da|di|le|la)$/i.test(parts[parts.length - 2])) return parts.slice(-2).join(' ');
  return parts[parts.length - 1] ?? name;
};

const ROWS: [string, (s: Stats) => string | number][] = [
  ['Average', (s) => (s.darts ? average(s).toFixed(2) : '–')],
  ['First 9 average', (s) => (s.f9Darts ? first9(s).toFixed(2) : '–')],
  ['180s', (s) => s.c180],
  ['140+', (s) => s.c140],
  ['100+', (s) => s.c100],
  ['Highest checkout', (s) => s.highestCO || '–'],
  ['Ton-plus checkouts', (s) => s.tonPlusCO],
  ['Checkout %', (s) => `${s.coHits}/${s.coAttempts} - ${Math.round(checkoutPct(s))}%`],
  ['Best leg', (s) => (s.bestLeg ? `${s.bestLeg} darts` : '–')],
  ['Legs against the throw', (s) => s.breaks],
];

export function StatsCard({ m }: { m: Match }) {
  const [a, b] = m.stats;
  return (
    <div className="stats-card" data-testid="stats">
      <div className="sc-head">
        <span>
          <i className="chip c0" />
          {lastName(m.players[0].name)}
        </span>
        <span className="t">MATCH STATS</span>
        <span className="r">
          {lastName(m.players[1].name)}
          <i className="chip c1" />
        </span>
      </div>
      {ROWS.map(([k, f]) => (
        <div className="sc-row" key={k}>
          <span className="v">{f(a)}</span>
          <span className="k">{k}</span>
          <span className="v r">{f(b)}</span>
        </div>
      ))}
    </div>
  );
}
