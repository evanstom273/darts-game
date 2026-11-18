import { scoreAt, aimPoint, TREBLE } from './board';
import { gauss, mulberry32 } from './rng';
import { TUNING } from './tuning';

export const ATTRS = ['scoring', 'checkouts', 'composure', 'consistency', 'stamina'] as const;
export type AttrKey = (typeof ATTRS)[number];
export type Attributes = Record<AttrKey, number>;

export const ATTR_LABEL: Record<AttrKey, string> = {
  scoring: 'Scoring',
  checkouts: 'Checkouts',
  composure: 'Composure',
  consistency: 'Consistency',
  stamina: 'Stamina',
};

export interface PlayerConfig {
  name: string;
  attrs: Attributes;
  /** Long-term form, -5..+5, 0 = normal. */
  form: number;
}

/** 0 at attribute 20, 1 at attribute 1. */
export const weakness = (a: number): number => (20 - Math.min(20, Math.max(1, a))) / 19;
const lerp = (at20: number, at1: number, a: number): number => at20 + (at1 - at20) * weakness(a);

/** Map an attribute onto a spread, smoothly (geometrically) between its 20 and 1 values. */
export const spreadFor = (a: number, s: { at20: number; at1: number }): number =>
  s.at20 * Math.pow(s.at1 / s.at20, weakness(a));

export const scoringSpread = (a: number): number => spreadFor(a, TUNING.spread.scoring);
export const checkoutSpread = (a: number): number => spreadFor(a, TUNING.spread.checkouts);
export const daySd = (consistency: number): number => lerp(TUNING.day.sdAt20, TUNING.day.sdAt1, consistency);
export const stinkerChance = (consistency: number): number => lerp(TUNING.day.stinkerAt20, TUNING.day.stinkerAt1, consistency);
export const blinderChance = (consistency: number): number => lerp(TUNING.day.blinderAt20, TUNING.day.blinderAt1, consistency);
export const fatiguePer100 = (stamina: number): number => lerp(TUNING.stamina.per100At20, TUNING.stamina.per100At1, stamina);
export const composureEffect = (composure: number): number =>
  TUNING.pressure.composureFloor + (1 - TUNING.pressure.composureFloor) * weakness(composure);

// ---------- Expected score of a visit at T20, by spread (used to judge in-match form) ----------

const E_MIN = 3;
const E_MAX = 60;
const E_STEP = 0.5;
let expectedTable: Float64Array | null = null;

function buildExpected(): Float64Array {
  const rng = mulberry32(0x5eed);
  const aim = aimPoint(TREBLE[20]);
  const n = Math.round((E_MAX - E_MIN) / E_STEP) + 1;
  const out = new Float64Array(n);
  const darts = 3000;
  for (let i = 0; i < n; i++) {
    const s = E_MIN + i * E_STEP;
    let total = 0;
    for (let d = 0; d < darts; d++) {
      const x = aim.x + gauss(rng) * s * TUNING.spread.tangential;
      const y = aim.y + gauss(rng) * s * TUNING.spread.radial;
      total += scoreAt(x, y).v;
    }
    out[i] = (total / darts) * 3;
  }
  return out;
}

/** What a player with this spread scores on average in a visit at T20. */
export function expectedVisit(sigma: number): number {
  if (!expectedTable) expectedTable = buildExpected();
  const t = expectedTable;
  const f = (Math.min(E_MAX, Math.max(E_MIN, sigma)) - E_MIN) / E_STEP;
  const i = Math.min(t.length - 2, Math.floor(f));
  return t[i] + (t[i + 1] - t[i]) * (f - i);
}
