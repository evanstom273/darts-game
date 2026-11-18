import { aimPoint, scoreAt, type Target } from './board';
import {
  ATTRS,
  blinderChance,
  checkoutSpread,
  composureEffect,
  daySd,
  expectedVisit,
  fatiguePer100,
  scoringSpread,
  stinkerChance,
  type PlayerConfig,
} from './players';
import { gauss, mulberry32, type Rng } from './rng';
import {
  chooseAim,
  finalAllowed,
  isBust,
  legsToWin,
  maxFinish,
  OPENING_DOUBLE,
  outTables,
  routeFor,
  setsToWin,
  type Format,
  type Stage,
} from './rules';
import { TUNING } from './tuning';

export type Side = 0 | 1;
export type Pair<T> = [T, T];

export interface Dart {
  id: number;
  p: Side;
  x: number;
  y: number;
  aim: Target;
  hit: Target;
  /** False for a double-in dart thrown before the player has opened. */
  counted: boolean;
}

export interface Stats {
  darts: number;
  points: number;
  f9Darts: number;
  f9Points: number;
  c180: number;
  c140: number;
  c100: number;
  coAttempts: number;
  coHits: number;
  highestCO: number;
  tonPlusCO: number;
  bestLeg: number;
  breaks: number;
  legsWon: number;
  busts: number;
  nineDarters: number;
}

export interface LegRecord {
  set: number;
  leg: number;
  starter: Side;
  winner: Side;
  darts: Pair<number>;
  points: Pair<number>;
  checkout: number;
  /** In-match form at the end of the leg (positive = playing above the day's level). */
  momentum: Pair<number>;
}

export type Phase = 'throw' | 'afterVisit' | 'afterBust' | 'afterLeg' | 'over';
export type Flash = { p: Side; what: 'leg' | 'set' | 'match' } | null;

export interface MatchSetup {
  players: Pair<PlayerConfig>;
  format: Format;
  stage: Stage;
  seed: number;
}

export interface Match extends MatchSetup {
  rng: Rng;
  sigmaScore: Pair<number>;
  sigmaCheck: Pair<number>;
  /** "On the day" roll, in log terms: positive = a worse day (wider spread). */
  dayLog: Pair<number>;
  formLog: Pair<number>;
  /** In-match form, in log terms: positive = playing better. */
  momentum: Pair<number>;
  fatigueRate: Pair<number>;
  compEff: Pair<number>;
  sets: Pair<number>;
  legs: Pair<number>;
  setNo: number;
  legNo: number;
  setStarter: Side;
  legStarter: Side;
  turn: Side;
  rem: Pair<number>;
  opened: Pair<boolean>;
  dartsLeg: Pair<number>;
  visitsLeg: Pair<number>;
  pointsLeg: Pair<number>;
  dartsMatch: Pair<number>;
  visit: { p: Side; startRem: number; darts: Dart[]; attempts: number };
  boardDarts: Dart[];
  phase: Phase;
  stats: Pair<Stats>;
  bust: Side | -1;
  flash: Flash;
  winner: Side | -1;
  legLog: LegRecord[];
  nextDartId: number;
}

export interface MatchEvent {
  type: 'dart' | 'bust' | 'visitEnd' | 'checkout' | 'nextVisit' | 'newLeg' | 'matchOver' | 'idle';
  /** Pause before the next event at 1×, in ms; null when the match is over. */
  delay: number | null;
}

const emptyStats = (): Stats => ({
  darts: 0,
  points: 0,
  f9Darts: 0,
  f9Points: 0,
  c180: 0,
  c140: 0,
  c100: 0,
  coAttempts: 0,
  coHits: 0,
  highestCO: 0,
  tonPlusCO: 0,
  bestLeg: 0,
  breaks: 0,
  legsWon: 0,
  busts: 0,
  nineDarters: 0,
});

export function newMatch(setup: MatchSetup): Match {
  const rng = mulberry32(setup.seed);
  const [a, b] = setup.players;
  // "On the day": a small everyday roll, and now and again a stinker or a blinder.
  const day = (pl: PlayerConfig): number => {
    const D = TUNING.day;
    const c = pl.attrs.consistency;
    const core = gauss(rng) * daySd(c);
    const r = rng();
    const extra = gauss(rng);
    const u = rng();
    const pStinker = stinkerChance(c);
    if (r < pStinker) return core + D.stinkerSize + Math.abs(extra) * D.stinkerSpread;
    if (r < pStinker + blinderChance(c)) {
      // A blinder: close to the world's best on their best day, whoever they are.
      const own = scoringSpread(pl.attrs.scoring);
      const target = D.bestSpread + Math.max(0, own - D.bestSpread) * u * D.blinderReach;
      return Math.min(core, Math.log(target / own));
    }
    return core;
  };
  const dayLog: Pair<number> = [day(a), day(b)];
  const starter: Side = rng() < 0.5 ? 0 : 1;
  const m: Match = {
    ...setup,
    rng,
    sigmaScore: [scoringSpread(a.attrs.scoring), scoringSpread(b.attrs.scoring)],
    sigmaCheck: [checkoutSpread(a.attrs.checkouts), checkoutSpread(b.attrs.checkouts)],
    dayLog,
    formLog: [-TUNING.form.perPoint * a.form, -TUNING.form.perPoint * b.form],
    momentum: [0, 0],
    fatigueRate: [fatiguePer100(a.attrs.stamina), fatiguePer100(b.attrs.stamina)],
    compEff: [composureEffect(a.attrs.composure), composureEffect(b.attrs.composure)],
    sets: [0, 0],
    legs: [0, 0],
    setNo: 1,
    legNo: 1,
    setStarter: starter,
    legStarter: starter,
    turn: starter,
    rem: [setup.format.startScore, setup.format.startScore],
    opened: [setup.format.inRule === 'straight', setup.format.inRule === 'straight'],
    dartsLeg: [0, 0],
    visitsLeg: [0, 0],
    pointsLeg: [0, 0],
    dartsMatch: [0, 0],
    visit: { p: starter, startRem: setup.format.startScore, darts: [], attempts: 0 },
    boardDarts: [],
    phase: 'throw',
    stats: [emptyStats(), emptyStats()],
    bust: -1,
    flash: null,
    winner: -1,
    legLog: [],
    nextDartId: 1,
  };
  outTables(setup.format.outRule);
  return m;
}

function startVisit(m: Match): void {
  m.visit = { p: m.turn, startRem: m.rem[m.turn], darts: [], attempts: 0 };
  m.boardDarts = [];
  m.bust = -1;
}

/** What a finish right now would win. */
function stakeOf(m: Match, p: Side): 'leg' | 'set' | 'match' {
  if (m.legs[p] + 1 < legsToWin(m.format)) return 'leg';
  if (m.format.play === 'legs') return 'match';
  return m.sets[p] + 1 >= setsToWin(m.format) ? 'match' : 'set';
}

/** Scoring under pressure: the opponent's on a finish, or it's a deciding leg or set. */
function scoringPressure(m: Match, p: Side): boolean {
  const q: Side = p === 0 ? 1 : 0;
  const out = m.format.outRule;
  if (m.opened[q] && m.rem[q] <= maxFinish(out) && routeFor(out, m.rem[q], 3)) return true;
  const lw = legsToWin(m.format) - 1;
  if (m.legs[0] === lw && m.legs[1] === lw) return true;
  const sw = setsToWin(m.format) - 1;
  return m.format.play === 'sets' && m.sets[0] === sw && m.sets[1] === sw;
}

/** Tiredness, in log terms on the spread: grows after a player's first `freeDarts` darts of the match. */
const fatigueLog = (m: Match, p: Side): number =>
  (Math.max(0, m.dartsMatch[p] - TUNING.stamina.freeDarts) / 100) * m.fatigueRate[p];

function closeVisit(m: Match, points: number, busted: boolean, checkedOut: boolean): void {
  const p = m.visit.p;
  const st = m.stats[p];
  const n = m.visit.darts.length;
  const T = TUNING.inMatch;
  m.visitsLeg[p]++;
  m.pointsLeg[p] += points;
  st.darts += n;
  st.points += points;
  if (m.visitsLeg[p] <= 3) {
    st.f9Darts += n;
    st.f9Points += points;
  }
  if (points === 180) st.c180++;
  else if (points >= 140) st.c140++;
  else if (points >= 100) st.c100++;
  if (busted) st.busts++;

  // In-match form: a scoring visit is judged against what this player would normally throw today,
  // so a 100 is a good visit for a pub player and an ordinary one for the world's best.
  let delta = 0;
  if (busted) delta = T.bust;
  else if (checkedOut) delta = T.checkout;
  else if (m.visit.attempts > 0 || !m.opened[p]) delta = T.missedDoubles;
  else if (n === 3 && m.visit.startRem > maxFinish(m.format.outRule)) {
    const P = TUNING.pressure;
    const pressure = P.stageBase[m.stage] + (scoringPressure(m, p) ? P.scoring * P.stageMult[m.stage] : 0);
    const usual = m.sigmaScore[p] * Math.exp(m.dayLog[p] + m.formLog[p] + fatigueLog(m, p)) * (1 + pressure * m.compEff[p]);
    delta = T.perPoint * (points - expectedVisit(usual));
  }
  m.momentum[p] = Math.max(-T.cap, Math.min(T.cap, m.momentum[p] * T.decay + delta));
}

function throwDart(m: Match, aim: Target, sigma: number): { x: number; y: number; hit: Target } {
  const pt = aimPoint(aim);
  const ang = pt.x === 0 && pt.y === 0 ? Math.PI / 2 : Math.atan2(pt.y, pt.x);
  const ux = Math.cos(ang);
  const uy = Math.sin(ang);
  const nr = gauss(m.rng) * sigma * TUNING.spread.radial;
  const nt = gauss(m.rng) * sigma * TUNING.spread.tangential;
  const x = pt.x + ux * nr - uy * nt;
  const y = pt.y + uy * nr + ux * nt;
  return { x, y, hit: scoreAt(x, y) };
}

/** Run the match forward by one event. */
export function advance(m: Match): MatchEvent {
  const pace = TUNING.pace;
  const out = m.format.outRule;

  if (m.phase === 'throw') {
    const p = m.turn;
    const v = m.visit;
    const rem = m.rem[p];
    const st = m.stats[p];
    let aim: Target;
    let finishing: boolean;
    if (!m.opened[p]) {
      aim = OPENING_DOUBLE;
      finishing = false;
    } else {
      const c = chooseAim(out, rem, 3 - v.darts.length);
      aim = c.target;
      finishing = c.finishing;
    }

    let moments = 0;
    if (finishing) {
      const stake = stakeOf(m, p);
      moments =
        stake === 'match' ? TUNING.pressure.matchDouble : stake === 'set' ? TUNING.pressure.setDouble : TUNING.pressure.legDouble;
    } else if (scoringPressure(m, p)) moments = TUNING.pressure.scoring;
    const P = TUNING.pressure.stageBase[m.stage] + moments * TUNING.pressure.stageMult[m.stage];
    const base = finishing || aim.dbl ? m.sigmaCheck[p] : m.sigmaScore[p];
    const sigma = base * Math.exp(m.dayLog[p] + m.formLog[p] - m.momentum[p] + fatigueLog(m, p)) * (1 + P * m.compEff[p]);

    const thrown = throwDart(m, aim, sigma);
    let counted = true;
    if (!m.opened[p]) {
      if (thrown.hit.dbl) m.opened[p] = true;
      else counted = false;
    }
    const dart: Dart = { id: m.nextDartId++, p, aim, counted, ...thrown };
    v.darts.push(dart);
    m.boardDarts.push(dart);
    m.dartsLeg[p]++;
    m.dartsMatch[p]++;
    if (finishing) {
      v.attempts++;
      st.coAttempts++;
    }

    const after = counted ? rem - dart.hit.v : rem;
    if (counted && after === 0 && finalAllowed(out, dart.hit)) {
      m.rem[p] = 0;
      closeVisit(m, v.startRem, false, true);
      st.coHits++;
      st.highestCO = Math.max(st.highestCO, v.startRem);
      if (v.startRem >= 100) st.tonPlusCO++;
      st.legsWon++;
      if (!st.bestLeg || m.dartsLeg[p] < st.bestLeg) st.bestLeg = m.dartsLeg[p];
      if (m.legStarter !== p) st.breaks++;
      if (m.format.startScore === 501 && m.dartsLeg[p] <= 9) st.nineDarters++;
      m.legLog.push({
        set: m.setNo,
        leg: m.legNo,
        starter: m.legStarter,
        winner: p,
        darts: [m.dartsLeg[0], m.dartsLeg[1]],
        points: [m.pointsLeg[0], m.pointsLeg[1]],
        checkout: v.startRem,
        momentum: [m.momentum[0], m.momentum[1]],
      });
      m.legs[p]++;
      m.flash = { p, what: 'leg' };
      if (m.legs[p] >= legsToWin(m.format)) {
        if (m.format.play === 'legs') {
          m.winner = p;
          m.flash = { p, what: 'match' };
        } else {
          m.sets[p]++;
          m.flash = { p, what: 'set' };
          if (m.sets[p] >= setsToWin(m.format)) {
            m.winner = p;
            m.flash = { p, what: 'match' };
          }
        }
      }
      m.phase = 'afterLeg';
      return { type: 'checkout', delay: m.winner >= 0 ? 0 : m.flash.what === 'set' ? pace.set : pace.leg };
    }
    if (counted && isBust(out, after, dart.hit)) {
      m.rem[p] = after;
      m.bust = p;
      closeVisit(m, 0, true, false);
      m.phase = 'afterBust';
      return { type: 'bust', delay: pace.visit };
    }
    m.rem[p] = after;
    if (v.darts.length === 3) {
      closeVisit(m, v.startRem - after, false, false);
      m.phase = 'afterVisit';
      return { type: 'visitEnd', delay: pace.visit };
    }
    return { type: 'dart', delay: pace.dart };
  }

  if (m.phase === 'afterVisit' || m.phase === 'afterBust') {
    if (m.phase === 'afterBust') m.rem[m.turn] = m.visit.startRem;
    m.turn = m.turn === 0 ? 1 : 0;
    startVisit(m);
    m.phase = 'throw';
    return { type: 'nextVisit', delay: pace.nextVisit };
  }

  if (m.phase === 'afterLeg') {
    if (m.winner >= 0) {
      m.phase = 'over';
      return { type: 'matchOver', delay: null };
    }
    if (m.flash?.what === 'set') {
      m.legs = [0, 0];
      m.setNo++;
      m.legNo = 1;
      m.setStarter = m.setStarter === 0 ? 1 : 0;
      m.legStarter = m.setStarter;
    } else {
      m.legNo++;
      m.legStarter = m.legStarter === 0 ? 1 : 0;
    }
    const s = m.format.startScore;
    m.rem = [s, s];
    m.opened = [m.format.inRule === 'straight', m.format.inRule === 'straight'];
    m.dartsLeg = [0, 0];
    m.visitsLeg = [0, 0];
    m.pointsLeg = [0, 0];
    m.flash = null;
    m.turn = m.legStarter;
    startVisit(m);
    m.phase = 'throw';
    return { type: 'newLeg', delay: pace.nextVisit };
  }

  return { type: 'idle', delay: null };
}

/** Play the whole match out at once (for batch simulation). */
export function playOut(m: Match): Match {
  let guard = 0;
  while (m.phase !== 'over' && guard++ < 2_000_000) advance(m);
  return m;
}

/** The score left that's showing for a player (a bust shows the score they went back to). */
export const shownRemaining = (m: Match, p: Side): number =>
  m.phase === 'afterBust' && m.bust === p ? m.visit.startRem : m.rem[p];

/** "9" indicator: 501 legs only, lit from the first dart while a nine-darter is still possible. */
export function nineOn(m: Match, p: Side): boolean {
  if (m.format.startScore !== 501) return false;
  const n = m.dartsLeg[p];
  if (n < 1 || n > 9) return false;
  const r = shownRemaining(m, p);
  if (r === 0) return true;
  if (n >= 9) return false;
  const t = outTables(m.format.outRule);
  return (m.opened[p] ? t.can[9 - n][r] : t.canOpen[9 - n][r]) === 1;
}

/** How many darts the route on the graphic should use for this player, or 0 for no route. */
export function dartsLeftFor(m: Match, p: Side): number {
  if (m.phase === 'afterLeg' || m.phase === 'over') return 0;
  if (m.phase === 'afterBust' && m.bust === p) return 0;
  if (!m.opened[p]) return 0;
  if (m.phase === 'throw' && m.turn === p && m.visit.darts.length > 0) return 3 - m.visit.darts.length;
  return 3;
}

export const average = (s: Stats): number => (s.darts ? (s.points / s.darts) * 3 : 0);
export const first9 = (s: Stats): number => (s.f9Darts ? (s.f9Points / s.f9Darts) * 3 : 0);
export const checkoutPct = (s: Stats): number => (s.coAttempts ? (s.coHits / s.coAttempts) * 100 : 0);
export const daySpread = (m: Match, p: Side): number => Math.exp(m.dayLog[p]);
export { ATTRS };
