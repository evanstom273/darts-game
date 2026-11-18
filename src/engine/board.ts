/** A standard steel-tip dartboard, in millimetres, with y pointing up. */
export const ORDER = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5] as const;
export const RAD = { bull: 6.35, outerBull: 15.9, trebleIn: 99, trebleOut: 107, doubleIn: 162, doubleOut: 170 } as const;
export const DEG = Math.PI / 180;

export type Kind = 'S' | 'D' | 'T' | 'SB' | 'DB' | 'MISS';
export interface Target {
  kind: Kind;
  n: number;
  v: number;
  label: string;
  dbl: boolean;
  trb: boolean;
}

function make(kind: Kind, n: number): Target {
  const v = kind === 'T' ? 3 * n : kind === 'D' ? 2 * n : kind === 'S' ? n : kind === 'SB' ? 25 : kind === 'DB' ? 50 : 0;
  const label =
    kind === 'T' ? `T${n}` : kind === 'D' ? `D${n}` : kind === 'S' ? String(n) : kind === 'SB' ? '25' : kind === 'DB' ? 'BULL' : 'MISS';
  return { kind, n, v, label, dbl: kind === 'D' || kind === 'DB', trb: kind === 'T' };
}

export const SINGLE: Target[] = [];
export const DOUBLE: Target[] = [];
export const TREBLE: Target[] = [];
for (let n = 0; n <= 20; n++) {
  SINGLE[n] = make('S', n);
  DOUBLE[n] = make('D', n);
  TREBLE[n] = make('T', n);
}
export const OUTER_BULL = make('SB', 25);
export const BULL = make('DB', 50);
export const MISS = make('MISS', 0);

/** Every target a player might aim at: trebles, singles, the bulls, then doubles. */
export const TARGETS: Target[] = [];
for (let n = 20; n >= 1; n--) TARGETS.push(TREBLE[n]);
for (let n = 20; n >= 1; n--) TARGETS.push(SINGLE[n]);
TARGETS.push(OUTER_BULL, BULL);
for (let n = 20; n >= 1; n--) TARGETS.push(DOUBLE[n]);

const segIndex: Record<number, number> = {};
ORDER.forEach((n, i) => (segIndex[n] = i));
export const segAngle = (n: number): number => (90 - 18 * segIndex[n]) * DEG;
export const polar = (r: number, a: number) => ({ x: r * Math.cos(a), y: r * Math.sin(a) });

/** What a dart landing at (x, y) scores. */
export function scoreAt(x: number, y: number): Target {
  const r = Math.hypot(x, y);
  if (r <= RAD.bull) return BULL;
  if (r <= RAD.outerBull) return OUTER_BULL;
  if (r > RAD.doubleOut) return MISS;
  const a = Math.atan2(y, x) / DEG;
  const idx = (((Math.round((90 - a) / 18) % 20) + 20) % 20) as number;
  const n = ORDER[idx];
  if (r > RAD.trebleIn && r <= RAD.trebleOut) return TREBLE[n];
  if (r > RAD.doubleIn) return DOUBLE[n];
  return SINGLE[n];
}

/** Where a player aims for each target: the middle of the bed (singles in the fat inner single). */
export function aimPoint(t: Target): { x: number; y: number } {
  switch (t.kind) {
    case 'T':
      return polar(103, segAngle(t.n));
    case 'D':
      return polar(166, segAngle(t.n));
    case 'S':
      return polar(60, segAngle(t.n));
    case 'SB':
      return polar(11, 90 * DEG);
    default:
      return { x: 0, y: 0 };
  }
}
