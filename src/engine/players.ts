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

/** Map an attribute onto a spread, smoothly (geometrically) between its 20 and 1 values. */
export const spreadFor = (a: number, s: { at20: number; at1: number }): number =>
  s.at20 * Math.pow(s.at1 / s.at20, weakness(a));

export const scoringSpread = (a: number): number => spreadFor(a, TUNING.spread.scoring);
export const checkoutSpread = (a: number): number => spreadFor(a, TUNING.spread.checkouts);
export const daySd = (consistency: number): number =>
  TUNING.day.sdAt20 + (TUNING.day.sdAt1 - TUNING.day.sdAt20) * weakness(consistency);
export const fatiguePer100 = (stamina: number): number =>
  TUNING.stamina.per100At20 + (TUNING.stamina.per100At1 - TUNING.stamina.per100At20) * weakness(stamina);
export const composureEffect = (composure: number): number =>
  TUNING.pressure.composureFloor + (1 - TUNING.pressure.composureFloor) * weakness(composure);
