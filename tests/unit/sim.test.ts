import { describe, expect, test } from 'vitest';
import { runBatch } from '../../src/sim/batch';
import { LEG_HEADER, MATCH_HEADER, parseMatchRow } from '../../src/sim/csv';
import { DEFAULT_SETUP, type Setup } from '../../src/sim/setup';
import { ATTRS } from '../../src/engine/players';
import { average, newMatch, playOut } from '../../src/engine/match';

const allRandom = (): Setup => {
  const s: Setup = structuredClone(DEFAULT_SETUP);
  for (const p of s.players) {
    for (const k of ATTRS) p.attrs[k].random = true;
    p.form.random = true;
  }
  for (const k of Object.keys(s.format) as (keyof Setup['format'])[]) s.format[k].random = true;
  s.stage.random = true;
  return s;
};
const uniform = (v: number): Setup => {
  const s: Setup = structuredClone(DEFAULT_SETUP);
  for (const p of s.players) for (const k of ATTRS) p.attrs[k] = { value: v, random: false };
  return s;
};
const column = (csv: string, name: string): number[] => {
  const rows = csv.trim().split('\n');
  const i = rows[0].split(',').indexOf(name);
  return rows.slice(1).map((r) => Number(r.split(',')[i]));
};
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

describe('batch simulation', () => {
  test('writes one row per match, and the columns line up', () => {
    const r = runBatch(allRandom(), { count: 300, batchSeed: 5, perLeg: true });
    const rows = r.matchesCsv.trim().split('\n');
    expect(rows[0]).toBe(MATCH_HEADER.join(','));
    expect(rows.length).toBe(301);
    for (const row of rows) expect(row.split(',').length).toBe(MATCH_HEADER.length);
    const legs = r.legsCsv!.trim().split('\n');
    expect(legs[0]).toBe(LEG_HEADER.join(','));
    for (const row of legs) expect(row.split(',').length).toBe(LEG_HEADER.length);
    expect(legs.length - 1).toBe(column(r.matchesCsv, 'legs_played').reduce((a, b) => a + b, 0));
  });
  test('random settings produce a variety of formats', () => {
    const r = runBatch(allRandom(), { count: 400, batchSeed: 11, perLeg: false });
    const rows = r.matchesCsv.trim().split('\n').slice(1).map((x) => x.split(','));
    const h = MATCH_HEADER;
    const distinct = (c: string) => new Set(rows.map((x) => x[h.indexOf(c)])).size;
    expect(distinct('play')).toBe(2);
    expect(distinct('start_score')).toBe(3);
    expect(distinct('out_rule')).toBe(3);
    expect(distinct('in_rule')).toBe(2);
    expect(distinct('p1_scoring')).toBeGreaterThan(15);
  });
  test('the same batch seed gives the same batch', () => {
    const a = runBatch(allRandom(), { count: 50, batchSeed: 77, perLeg: false });
    const b = runBatch(allRandom(), { count: 50, batchSeed: 77, perLeg: false });
    expect(a.matchesCsv).toBe(b.matchesCsv);
  });
  test('any row can be replayed exactly', () => {
    const r = runBatch(allRandom(), { count: 30, batchSeed: 3, perLeg: false });
    const rows = r.matchesCsv.trim().split('\n');
    for (const row of rows.slice(1, 11)) {
      const setup = parseMatchRow(row, ['A', 'B'])!;
      expect(setup).not.toBeNull();
      const m = playOut(newMatch(setup));
      const cells = row.split(',');
      expect(average(m.stats[0]).toFixed(2)).toBe(cells[MATCH_HEADER.indexOf('p1_average')]);
      expect(String(m.winner + 1)).toBe(cells[MATCH_HEADER.indexOf('winner')]);
    }
  });
  test('first-take tuning lands in sensible ranges', () => {
    const top = runBatch(uniform(20), { count: 400, batchSeed: 1, perLeg: false }).matchesCsv;
    const mid = runBatch(uniform(10), { count: 400, batchSeed: 1, perLeg: false }).matchesCsv;
    const low = runBatch(uniform(1), { count: 400, batchSeed: 1, perLeg: false }).matchesCsv;
    expect(mean(column(top, 'p1_average'))).toBeGreaterThan(98);
    expect(mean(column(top, 'p1_average'))).toBeLessThan(112);
    expect(mean(column(mid, 'p1_average'))).toBeGreaterThan(75);
    expect(mean(column(mid, 'p1_average'))).toBeLessThan(92);
    expect(mean(column(low, 'p1_average'))).toBeLessThan(70);
    expect(mean(column(top, 'p1_checkout_pct'))).toBeLessThan(55);
  });
});
