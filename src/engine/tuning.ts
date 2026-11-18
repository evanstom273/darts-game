/**
 * Every number the simulation is tuned with, in one place.
 * All first takes, to be tuned from batch-simulation CSVs.
 *
 * How a dart is thrown: the player aims at the middle of a bed and the dart lands around it with a
 * normal spread (sigma, in millimetres). Everything below widens or tightens that spread.
 */
export const TUNING = {
  /** Spread from attributes. Each attribute maps 1..20 onto a spread between `at1` and `at20`, smoothly. */
  spread: {
    /** Scoring and set-up darts (trebles, singles). 20 ≈ a 105 average on a normal day; 10 ≈ 84; 1 ≈ 55. */
    scoring: { at20: 5.6, at1: 12.5 },
    /** Finishing darts and any dart at a double. 20 ≈ 45% on doubles; 10 ≈ 30%. */
    checkouts: { at20: 6.4, at1: 13 },
    /** Darts miss more along the line to the centre (high and low on the treble) than across it. */
    radial: 1.12,
    tangential: 0.9,
  },

  /** "On the day": rolled once per match, a multiplier on the spread. Consistency sets how wide it swings. */
  day: {
    /** Standard deviation of the roll (in log terms) at consistency 20 and 1. */
    sdAt20: 0.05,
    sdAt1: 0.17,
    /** Now and again anyone has a wild day, either way, whatever their consistency. */
    wildChance: 0.04,
    wildSd: 0.18,
    /** The best day anyone can have: the spread can't tighten by more than this (in log terms). */
    bestDay: -0.25,
  },

  /** Long-term form, set per player from -5 (awful) to +5 (red hot) until there's a career to earn it. */
  form: { perPoint: 0.025 },

  /** In-match form: nudged after every visit, and pulled back towards the day's level so it can't snowball. */
  inMatch: {
    decay: 0.85,
    cap: 0.1,
    visit180: 0.05,
    visit140: 0.03,
    visit100: 0.012,
    lowBelow: 45,
    visitLow: -0.025,
    bust: -0.02,
    checkout: 0.02,
    missedDoubles: -0.012,
  },

  /** Stamina: after `freeDarts` darts in a match, the spread grows per 100 darts, less with more stamina. */
  stamina: { freeDarts: 300, per100At1: 0.04, per100At20: 0.004 },

  /** Pressure widens the spread; composure takes the edge off it (but never all of it). */
  pressure: {
    legDouble: 0.06,
    setDouble: 0.12,
    matchDouble: 0.2,
    /** Scoring when the opponent's on a finish, or in a deciding leg or set. */
    scoring: 0.05,
    /** Pressure on every dart, by stage. */
    stageBase: { floor: 0, tv: 0.02, final: 0.04 },
    /** Pressure moments count for more on bigger stages. */
    stageMult: { floor: 0.8, tv: 1, final: 1.3 },
    /** At composure 20, pressure still has this much of its effect. */
    composureFloor: 0.2,
  },

  /** Watching pace at 1×, in milliseconds. */
  pace: { dart: 1600, visit: 3200, nextVisit: 900, leg: 3600, set: 4800 },
} as const;
