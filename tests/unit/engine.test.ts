import { describe, expect, test } from 'vitest';
import { BULL, DOUBLE, OUTER_BULL, SINGLE, TREBLE, scoreAt, MISS } from '../../src/engine/board';
import { isBust, outTables, routeFor } from '../../src/engine/rules';
import { advance, newMatch, nineOn, playOut, type MatchSetup } from '../../src/engine/match';
import type { PlayerConfig } from '../../src/engine/players';

const labels = (r: ReturnType<typeof routeFor>) => r?.map((t) => t.label).join(' ') ?? null;
const pl = (name: string, v: number, form = 0): PlayerConfig => ({
  name,
  attrs: { scoring: v, checkouts: v, composure: v, consistency: v, stamina: v },
  form,
});
const setup = (over: Partial<MatchSetup['format']> = {}, seed = 7): MatchSetup => ({
  players: [pl('A', 15), pl('B', 15)],
  format: { play: 'legs', bestOfLegs: 11, bestOfSets: 1, startScore: 501, inRule: 'straight', outRule: 'double', ...over },
  stage: 'tv',
  seed,
});

describe('board', () => {
  test('scores where darts land', () => {
    expect(scoreAt(0, 0)).toBe(BULL);
    expect(scoreAt(0, 10)).toBe(OUTER_BULL);
    expect(scoreAt(0, 103)).toBe(TREBLE[20]);
    expect(scoreAt(0, 166)).toBe(DOUBLE[20]);
    expect(scoreAt(0, 60)).toBe(SINGLE[20]);
    expect(scoreAt(0, -103)).toBe(TREBLE[3]);
    expect(scoreAt(103, 0)).toBe(TREBLE[6]);
    expect(scoreAt(-103, 0)).toBe(TREBLE[11]);
    expect(scoreAt(0, 180)).toBe(MISS);
  });
});

describe('checkouts', () => {
  test('standard double-out routes', () => {
    expect(labels(routeFor('double', 170, 3))).toBe('T20 T20 BULL');
    expect(labels(routeFor('double', 141, 3))).toBe('T20 T19 D12');
    expect(labels(routeFor('double', 100, 2))).toBe('T20 D20');
    expect(labels(routeFor('double', 50, 1))).toBe('BULL');
    expect(labels(routeFor('double', 40, 3))).toBe('D20');
    expect(labels(routeFor('double', 2, 1))).toBe('D1');
  });
  test('bogey numbers and 1 have no finish', () => {
    for (const r of [169, 168, 166, 165, 163, 162, 159, 1]) expect(routeFor('double', r, 3)).toBeNull();
    expect(routeFor('double', 110, 1)).toBeNull();
  });
  test('master out finishes on trebles; straight out on anything', () => {
    expect(labels(routeFor('master', 180, 3))).toBe('T20 T20 T20');
    expect(labels(routeFor('master', 60, 1))).toBe('T20');
    expect(labels(routeFor('straight', 1, 1))).toBe('1');
    expect(routeFor('master', 1, 3)).toBeNull();
  });
  test('busts', () => {
    expect(isBust('double', 1, SINGLE[19])).toBe(true);
    expect(isBust('double', 0, SINGLE[20])).toBe(true);
    expect(isBust('double', -4, DOUBLE[20])).toBe(true);
    expect(isBust('double', 0, DOUBLE[20])).toBe(false);
    expect(isBust('master', 0, TREBLE[20])).toBe(false);
    expect(isBust('master', 1, SINGLE[1])).toBe(true);
    expect(isBust('straight', 1, SINGLE[1])).toBe(false);
    expect(isBust('straight', 0, SINGLE[5])).toBe(false);
  });
});

describe('nine-darters', () => {
  test('only these first darts keep a 501 nine-darter alive', () => {
    const can8 = outTables('double').can[8];
    const values = new Set<number>([25, 50]);
    for (let n = 1; n <= 20; n++) [n, 2 * n, 3 * n].forEach((v) => values.add(v));
    const alive = [...values].filter((v) => can8[501 - v]).sort((a, b) => b - a);
    expect(alive).toEqual([60, 57, 54, 51, 50, 48, 45, 40, 34]);
  });
  test('the 9 is off before the first dart', () => {
    const m = newMatch(setup());
    expect(nineOn(m, 0)).toBe(false);
    expect(nineOn(m, 1)).toBe(false);
  });
});

describe('matches', () => {
  test('the same seed plays the same match', () => {
    const a = playOut(newMatch(setup({}, 123)));
    const b = playOut(newMatch(setup({}, 123)));
    expect(a.stats).toEqual(b.stats);
    expect(a.legLog).toEqual(b.legLog);
    const c = playOut(newMatch(setup({}, 124)));
    expect(c.legLog).not.toEqual(a.legLog);
  });
  test('legs play ends at the right score', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const m = playOut(newMatch(setup({ bestOfLegs: 11 }, seed)));
      expect(m.legs[m.winner as 0 | 1]).toBe(6);
      expect(m.legLog.length).toBe(m.legs[0] + m.legs[1]);
      expect(m.stats[0].legsWon + m.stats[1].legsWon).toBe(m.legLog.length);
    }
  });
  test('sets play ends at the right score', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const m = playOut(newMatch(setup({ play: 'sets', bestOfSets: 5, bestOfLegs: 5 }, seed)));
      expect(m.sets[m.winner as 0 | 1]).toBe(3);
      expect(Math.max(...m.sets)).toBe(3);
    }
  });
  test('every format finishes, and legs always add up', () => {
    const outs = ['double', 'master', 'straight'] as const;
    const ins = ['straight', 'double'] as const;
    for (const outRule of outs)
      for (const inRule of ins)
        for (const startScore of [301, 501, 701]) {
          const m = playOut(newMatch(setup({ outRule, inRule, startScore, bestOfLegs: 5 }, startScore)));
          expect(m.phase).toBe('over');
          for (const leg of m.legLog) expect(leg.points[leg.winner]).toBe(startScore);
        }
  });
  test('double in: nothing counts until a double opens the leg', () => {
    const m = newMatch(setup({ inRule: 'double' }, 99));
    let leg = -1;
    const opened = [false, false];
    let guard = 0;
    while (m.phase !== 'over' && guard++ < 100000) {
      if (m.legNo !== leg) {
        leg = m.legNo;
        opened[0] = opened[1] = false;
      }
      const ev = advance(m);
      if (['dart', 'bust', 'visitEnd', 'checkout'].includes(ev.type)) {
        const d = m.visit.darts[m.visit.darts.length - 1];
        if (!opened[d.p]) {
          expect(d.counted).toBe(d.hit.dbl);
          if (d.hit.dbl) opened[d.p] = true;
        } else expect(d.counted).toBe(true);
      }
    }
    expect(m.phase).toBe('over');
  });
});
