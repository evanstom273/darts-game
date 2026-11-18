import { ATTRS, type AttrKey, type PlayerConfig } from '../engine/players';
import { pickWeighted, randInt, type Rng } from '../engine/rng';
import type { Format, InRule, OutRule, Play, Stage } from '../engine/rules';
import type { MatchSetup, Pair } from '../engine/match';

/** A setting that's either fixed at `value` or rolled at random for every match. */
export interface Choice<T> {
  value: T;
  random: boolean;
}

export interface PlayerSetup {
  name: string;
  attrs: Record<AttrKey, Choice<number>>;
  form: Choice<number>;
}

export interface FormatSetup {
  play: Choice<Play>;
  legsBestOf: Choice<number>;
  setsBestOf: Choice<number>;
  setLegsBestOf: Choice<number>;
  startScore: Choice<number>;
  inRule: Choice<InRule>;
  outRule: Choice<OutRule>;
}

export interface Setup {
  players: Pair<PlayerSetup>;
  format: FormatSetup;
  stage: Choice<Stage>;
}

const fixed = <T,>(value: T): Choice<T> => ({ value, random: false });

const player = (name: string, a: [number, number, number, number, number], form = 0): PlayerSetup => ({
  name,
  attrs: {
    scoring: fixed(a[0]),
    checkouts: fixed(a[1]),
    composure: fixed(a[2]),
    consistency: fixed(a[3]),
    stamina: fixed(a[4]),
  },
  form: fixed(form),
});

export const DEFAULT_SETUP: Setup = {
  players: [player('Callum Reid', [16, 15, 15, 14, 14]), player('Sander de Wit', [14, 14, 12, 11, 13])],
  format: {
    play: fixed<Play>('sets'),
    legsBestOf: fixed(11),
    setsBestOf: fixed(5),
    setLegsBestOf: fixed(5),
    startScore: fixed(501),
    inRule: fixed<InRule>('straight'),
    outRule: fixed<OutRule>('double'),
  },
  stage: fixed<Stage>('tv'),
};

// What "random" rolls from. First takes, like everything in tuning.
export const RANDOM = {
  attr: [1, 20] as const,
  form: [-5, 5] as const,
  play: [['legs', 55], ['sets', 45]] as const,
  legsBestOf: [5, 7, 9, 11, 13, 15, 17, 19, 21, 25, 31, 35] as const,
  setsBestOf: [3, 5, 7, 9, 11, 13] as const,
  setLegsBestOf: [[5, 85], [3, 15]] as const,
  startScore: [[501, 80], [301, 12], [701, 8]] as const,
  inRule: [['straight', 85], ['double', 15]] as const,
  outRule: [['double', 85], ['master', 8], ['straight', 7]] as const,
  stage: [['floor', 50], ['tv', 40], ['final', 10]] as const,
};

export const LEGS_BEST_OF_OPTIONS = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35];
export const SETS_BEST_OF_OPTIONS = [1, 3, 5, 7, 9, 11, 13];
export const SET_LEGS_OPTIONS = [3, 5, 7];
export const START_OPTIONS = [301, 501, 701];

const roll = <T,>(c: Choice<T>, r: () => T): T => (c.random ? r() : c.value);

export function resolvePlayer(ps: PlayerSetup, rng: Rng): PlayerConfig {
  const attrs = {} as Record<AttrKey, number>;
  for (const k of ATTRS) attrs[k] = roll(ps.attrs[k], () => randInt(rng, RANDOM.attr[0], RANDOM.attr[1]));
  return { name: ps.name, attrs, form: roll(ps.form, () => randInt(rng, RANDOM.form[0], RANDOM.form[1])) };
}

export function resolveFormat(f: FormatSetup, rng: Rng): Format {
  const play = roll(f.play, () => pickWeighted(rng, RANDOM.play));
  const pickList = (xs: readonly number[]) => xs[Math.floor(rng() * xs.length)];
  return {
    play,
    bestOfLegs:
      play === 'legs'
        ? roll(f.legsBestOf, () => pickList(RANDOM.legsBestOf))
        : roll(f.setLegsBestOf, () => pickWeighted(rng, RANDOM.setLegsBestOf)),
    bestOfSets: play === 'sets' ? roll(f.setsBestOf, () => pickList(RANDOM.setsBestOf)) : 1,
    startScore: roll(f.startScore, () => pickWeighted(rng, RANDOM.startScore)),
    inRule: roll(f.inRule, () => pickWeighted(rng, RANDOM.inRule)),
    outRule: roll(f.outRule, () => pickWeighted(rng, RANDOM.outRule)),
  };
}

/** Turn the settings (with their random choices) into one concrete match. */
export function resolveSetup(s: Setup, rng: Rng, seed: number): MatchSetup {
  return {
    players: [resolvePlayer(s.players[0], rng), resolvePlayer(s.players[1], rng)],
    format: resolveFormat(s.format, rng),
    stage: roll(s.stage, () => pickWeighted(rng, RANDOM.stage)),
    seed,
  };
}
