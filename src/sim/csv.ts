import { ATTRS, type AttrKey } from '../engine/players';
import { average, checkoutPct, daySpread, first9, type Match, type MatchSetup, type Side } from '../engine/match';
import type { InRule, OutRule, Play, Stage } from '../engine/rules';

/** Bump when the columns change, so old rows aren't misread. */
export const CSV_VERSION = 1;

const ATTR_COLS = ATTRS.map((k) => k);
const STAT_COLS = [
  'average',
  'first9',
  '180s',
  '140plus',
  '100plus',
  'highest_checkout',
  'tonplus_checkouts',
  'checkout_hits',
  'checkout_attempts',
  'checkout_pct',
  'best_leg',
  'legs_against_throw',
  'legs_won',
  'darts',
  'points',
  'busts',
  'nine_darters',
] as const;

export const MATCH_HEADER: string[] = [
  'version',
  'match',
  'batch_seed',
  'match_seed',
  'play',
  'best_of_sets',
  'best_of_legs',
  'start_score',
  'in_rule',
  'out_rule',
  'stage',
  ...[1, 2].flatMap((n) => [...ATTR_COLS.map((k) => `p${n}_${k}`), `p${n}_form`, `p${n}_day_spread`]),
  'first_thrower',
  'winner',
  'p1_sets',
  'p2_sets',
  'legs_played',
  ...[1, 2].flatMap((n) => STAT_COLS.map((c) => `p${n}_${c}`)),
];

export const LEG_HEADER: string[] = [
  'match',
  'set',
  'leg',
  'starter',
  'winner',
  'winner_darts',
  'p1_darts',
  'p2_darts',
  'p1_points',
  'p2_points',
  'p1_leg_average',
  'p2_leg_average',
  'checkout',
  'p1_momentum',
  'p2_momentum',
];

const f2 = (x: number): string => x.toFixed(2);

function statCells(m: Match, p: Side): (string | number)[] {
  const s = m.stats[p];
  return [
    f2(average(s)),
    f2(first9(s)),
    s.c180,
    s.c140,
    s.c100,
    s.highestCO,
    s.tonPlusCO,
    s.coHits,
    s.coAttempts,
    f2(checkoutPct(s)),
    s.bestLeg || '',
    s.breaks,
    s.legsWon,
    s.darts,
    s.points,
    s.busts,
    s.nineDarters,
  ];
}

export function matchRow(m: Match, index: number, batchSeed: number): string {
  const firstThrower = m.legLog[0]?.starter ?? 0;
  const f = m.format;
  const cells: (string | number)[] = [
    CSV_VERSION,
    index,
    batchSeed,
    m.seed,
    f.play,
    f.play === 'sets' ? f.bestOfSets : '',
    f.bestOfLegs,
    f.startScore,
    f.inRule,
    f.outRule,
    m.stage,
    ...([0, 1] as Side[]).flatMap((p) => [
      ...ATTRS.map((k) => m.players[p].attrs[k]),
      m.players[p].form,
      daySpread(m, p).toFixed(3),
    ]),
    firstThrower + 1,
    m.winner + 1,
    f.play === 'sets' ? m.sets[0] : '',
    f.play === 'sets' ? m.sets[1] : '',
    m.legLog.length,
    ...statCells(m, 0),
    ...statCells(m, 1),
  ];
  return cells.join(',');
}

export function legRows(m: Match, index: number): string[] {
  return m.legLog.map((l) =>
    [
      index,
      m.format.play === 'sets' ? l.set : '',
      l.leg,
      l.starter + 1,
      l.winner + 1,
      l.darts[l.winner],
      l.darts[0],
      l.darts[1],
      l.points[0],
      l.points[1],
      l.darts[0] ? f2((l.points[0] / l.darts[0]) * 3) : '',
      l.darts[1] ? f2((l.points[1] / l.darts[1]) * 3) : '',
      l.checkout,
      l.momentum[0].toFixed(3),
      l.momentum[1].toFixed(3),
    ].join(','),
  );
}

/** Read a match row back (for replaying it). Returns null if it isn't one of ours. */
export function parseMatchRow(line: string, names: [string, string]): MatchSetup | null {
  const cells = line.trim().split(',');
  if (cells.length !== MATCH_HEADER.length) return null;
  const get = (col: string): string => cells[MATCH_HEADER.indexOf(col)];
  if (Number(get('version')) !== CSV_VERSION) return null;
  const play = get('play') as Play;
  const attrs = (n: number) => {
    const a = {} as Record<AttrKey, number>;
    for (const k of ATTRS) a[k] = Number(get(`p${n}_${k}`));
    return a;
  };
  const setup: MatchSetup = {
    seed: Number(get('match_seed')) >>> 0,
    stage: get('stage') as Stage,
    format: {
      play,
      bestOfSets: play === 'sets' ? Number(get('best_of_sets')) : 1,
      bestOfLegs: Number(get('best_of_legs')),
      startScore: Number(get('start_score')),
      inRule: get('in_rule') as InRule,
      outRule: get('out_rule') as OutRule,
    },
    players: [
      { name: names[0], attrs: attrs(1), form: Number(get('p1_form')) },
      { name: names[1], attrs: attrs(2), form: Number(get('p2_form')) },
    ],
  };
  const ok =
    Number.isFinite(setup.seed) &&
    ['legs', 'sets'].includes(play) &&
    ATTRS.every((k) => setup.players.every((p) => p.attrs[k] >= 1 && p.attrs[k] <= 20));
  return ok ? setup : null;
}
