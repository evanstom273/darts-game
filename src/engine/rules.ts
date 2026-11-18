import { BULL, DOUBLE, TARGETS, type Target } from './board';

export type Play = 'legs' | 'sets';
export type InRule = 'straight' | 'double';
export type OutRule = 'double' | 'master' | 'straight';
export type Stage = 'floor' | 'tv' | 'final';

export interface Format {
  play: Play;
  /** Legs play: the match is best of this many legs. Sets play: each set is best of this many legs. */
  bestOfLegs: number;
  /** Sets play only: the match is best of this many sets. */
  bestOfSets: number;
  startScore: number;
  inRule: InRule;
  outRule: OutRule;
}

export const legsToWin = (f: Format): number => (f.bestOfLegs + 1) / 2;
export const setsToWin = (f: Format): number => (f.play === 'sets' ? (f.bestOfSets + 1) / 2 : 1);

/** Short name for the in/out rules, as darts players write them: SIDO, DIDO, SIMO... */
export const rulesShort = (f: Format): string =>
  `${f.inRule === 'double' ? 'DI' : 'SI'}${f.outRule === 'double' ? 'DO' : f.outRule === 'master' ? 'MO' : 'SO'}`;

export const isStandard = (f: Format): boolean => f.startScore === 501 && f.inRule === 'straight' && f.outRule === 'double';

// ---------- Finishing ----------

/** Can this dart be the one that finishes a leg? */
export const finalAllowed = (out: OutRule, t: Target): boolean =>
  out === 'double' ? t.dbl : out === 'master' ? t.dbl || t.trb : t.v > 0;

/** The smallest score that can be left without busting. */
export const minLeft = (out: OutRule): number => (out === 'straight' ? 1 : 2);

/** The most that can be finished in three darts. */
export const maxFinish = (out: OutRule): number => (out === 'double' ? 170 : 180);

/** Is the dart a bust? `after` is the score left after it. */
export const isBust = (out: OutRule, after: number, hit: Target): boolean =>
  after < 0 || (after > 0 && after < minLeft(out)) || (after === 0 && !finalAllowed(out, hit));

// Preferences used to pick checkout routes: the cheapest route by darts used, then by these costs.
const DOUBLE_PREF: Record<number, number> = { 20: 0, 16: 0.1, 18: 0.3, 10: 0.4, 8: 0.45, 12: 0.5, 6: 0.9, 14: 0.8, 4: 1, 2: 1.5, 1: 2, 3: 2 };
const TREBLE_PREF: Record<number, number> = { 20: 0.2, 19: 0.3, 18: 0.5, 17: 0.5, 16: 0.5, 15: 0.6 };

function finalCost(out: OutRule, t: Target): number {
  if (t.kind === 'DB') return 120;
  if (t.kind === 'D') return DOUBLE_PREF[t.n] ?? 1.2;
  if (t.kind === 'T') return 0.3 + (TREBLE_PREF[t.n] ?? (t.n >= 10 ? 0.8 : 1 + (10 - t.n) * 0.1));
  if (t.kind === 'S') return out === 'straight' ? 0.05 + (20 - t.n) * 0.002 : 99;
  return 3; // outer bull
}

function setupCost(t: Target): number {
  if (t.kind === 'S') return 0.3 + (20 - t.n) * 0.005;
  if (t.kind === 'T') return TREBLE_PREF[t.n] ?? (t.n >= 10 ? 0.8 : 1 + (10 - t.n) * 0.1);
  if (t.kind === 'SB') return 3;
  if (t.kind === 'DB') return 4;
  return 6; // a double as a set-up dart
}

interface Route {
  cost: number;
  route: Target[];
}

interface OutTables {
  /** best[k][r]: cheapest route finishing r in k darts or fewer (k = 1..3). */
  best: (Route | null)[][];
  /** aim[d][r]: what to aim at with d darts left in the visit and r left. */
  aim: { target: Target; finishing: boolean }[][];
  /** can[k][r]: r can be finished in k darts or fewer. */
  can: Uint8Array[];
  /** canOpen[k][r]: for double-in, r can be opened and finished in k darts or fewer. */
  canOpen: Uint8Array[];
}

export const MAX_START = 701;
const tables = new Map<OutRule, OutTables>();

function leaveValue(t: OutTables, out: OutRule, L: number): number {
  if (L <= maxFinish(out)) {
    const one = t.best[1][L];
    if (one && one.route[0].kind !== 'DB') return 60 - 2 * (one.cost - 100);
    const two = t.best[2][L];
    if (two) return 40 - (two.cost - 200) / 2;
    const three = t.best[3][L];
    if (three) return 25 - (three.cost - 300) / 5;
  }
  return -L / 10;
}

function build(out: OutRule): OutTables {
  const top = maxFinish(out);
  const finals = TARGETS.filter((t) => finalAllowed(out, t));
  const lo = minLeft(out);
  const b1: (Route | null)[] = new Array(top + 1).fill(null);
  for (const d of finals) {
    const c = 100 + finalCost(out, d);
    if (d.v <= top && (!b1[d.v] || c < b1[d.v]!.cost)) b1[d.v] = { cost: c, route: [d] };
  }
  const best: (Route | null)[][] = [[], b1];
  for (let k = 2; k <= 3; k++) {
    const prev = best[k - 1];
    const cur = prev.slice();
    for (let r = lo; r <= top; r++) {
      for (const t of TARGETS) {
        const L = r - t.v;
        if (L < lo || !prev[L]) continue;
        const c = 100 + setupCost(t) + prev[L]!.cost;
        if (!cur[r] || c < cur[r]!.cost - 1e-9) cur[r] = { cost: c, route: [t, ...prev[L]!.route] };
      }
    }
    best[k] = cur;
  }

  const t: OutTables = { best, aim: [], can: [], canOpen: [] };

  for (let d = 1; d <= 3; d++) {
    const row: { target: Target; finishing: boolean }[] = [];
    for (let r = 0; r <= MAX_START; r++) {
      const route = r <= top ? best[d][r] : null;
      if (route) {
        row[r] = { target: route.route[0], finishing: route.route.length === 1 };
        continue;
      }
      let pick: Target = TARGETS[0];
      let bestV = -Infinity;
      for (const c of TARGETS) {
        if (c.dbl) continue;
        const L = r - c.v;
        if (L < lo) continue;
        const v = leaveValue(t, out, L) + c.v / 1000;
        if (v > bestV) {
          bestV = v;
          pick = c;
        }
      }
      row[r] = { target: pick, finishing: false };
    }
    t.aim[d] = row;
  }

  // Nine-darter tables
  const can: Uint8Array[] = [new Uint8Array(MAX_START + 1)];
  const c1 = new Uint8Array(MAX_START + 1);
  for (const d of finals) c1[d.v] = 1;
  can[1] = c1;
  for (let k = 2; k <= 9; k++) {
    const prev = can[k - 1];
    const cur = Uint8Array.from(prev);
    for (let r = lo; r <= MAX_START; r++) {
      if (cur[r]) continue;
      for (const x of TARGETS) {
        const L = r - x.v;
        if (L >= lo && prev[L]) {
          cur[r] = 1;
          break;
        }
      }
    }
    can[k] = cur;
  }
  const doubles = [...DOUBLE.slice(1), BULL];
  const canOpen: Uint8Array[] = [new Uint8Array(MAX_START + 1)];
  for (let k = 1; k <= 9; k++) {
    const cur = new Uint8Array(MAX_START + 1);
    for (let r = lo; r <= MAX_START; r++) {
      for (const d of doubles) {
        const L = r - d.v;
        if ((L === 0 && finalAllowed(out, d)) || (L >= lo && can[k - 1][L])) {
          cur[r] = 1;
          break;
        }
      }
    }
    canOpen[k] = cur;
  }
  t.can = can;
  t.canOpen = canOpen;
  return t;
}

export function outTables(out: OutRule): OutTables {
  let t = tables.get(out);
  if (!t) {
    t = build(out);
    tables.set(out, t);
  }
  return t;
}

/** The checkout route for r with `darts` darts left, or null if it can't be finished. */
export function routeFor(out: OutRule, r: number, darts: number): Target[] | null {
  if (darts < 1 || darts > 3 || r < minLeft(out) || r > maxFinish(out)) return null;
  return outTables(out).best[darts][r]?.route ?? null;
}

/** What a player aims at: a checkout route if there is one, otherwise the best scoring or set-up dart. */
export function chooseAim(out: OutRule, r: number, dartsLeft: number): { target: Target; finishing: boolean } {
  return outTables(out).aim[dartsLeft][Math.min(r, MAX_START)];
}

/** The double a double-in player aims at to open. */
export const OPENING_DOUBLE = DOUBLE[20];
