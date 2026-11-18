/**
 * Every number the simulation is tuned with, in one place.
 * First takes, tuned from batch-simulation CSVs (see the tuning log in DARTS-GAME-DESIGN.md).
 *
 * How a dart is thrown: the player aims at the middle of a bed and the dart lands around it with a
 * normal spread (sigma, in millimetres). Everything below widens or tightens that spread.
 *
 * The 1–20 scale covers the whole darts world: 1 is a pub player, 20 the world's best.
 */
export const TUNING = {
  /** Spread from attributes. Each attribute maps 1..20 onto a spread between `at1` and `at20`, smoothly. */
  spread: {
    /** Scoring and set-up darts (trebles, singles). Aim: 1 ≈ a 45 average (pub), 10 ≈ 72, 20 ≈ 102. */
    scoring: { at20: 5.6, at1: 19 },
    /** Finishing darts and any dart at a double. Aim: 1 ≈ 12% on doubles, 20 ≈ 43%. */
    checkouts: { at20: 6.0, at1: 15.5 },
    /**
     * Nobody throws tighter than this, whatever their day, form and in-match form: it keeps averages over
     * a normal-length match at about 125 at most (the TV record is van Gerwen's 123.40 in 2016).
     */
    min: 4.5,
    /** Darts miss more along the line to the centre (high and low on the treble) than across it. */
    radial: 1.12,
    tangential: 0.9,
  },

  /**
   * "On the day", rolled once per match. Mostly a small nudge; now and again a stinker or a blinder.
   * Less consistent players get bigger everyday swings and more stinkers and blinders.
   */
  day: {
    /** Everyday roll: standard deviation (in log terms on the spread) at consistency 20 and 1. */
    sdAt20: 0.01,
    sdAt1: 0.05,
    /** Stinker: the spread widens by a lot for the whole match. Chance at consistency 20 and 1. */
    stinkerAt20: 0.01,
    stinkerAt1: 0.035,
    stinkerSize: 0.22,
    stinkerSpread: 0.12,
    /** Blinder: the player throws close to the world's best for the match, whoever they are. */
    blinderAt20: 0.012,
    blinderAt1: 0.065,
    /** The spread of the best player in the world on their best day. */
    bestSpread: 4.3,
    /** On a blinder the spread lands this far (at most) back from `bestSpread` towards their own. */
    blinderReach: 0.08,
  },

  /** Long-term form, set per player from -5 (awful) to +5 (red hot) until there's a career to earn it. */
  form: { perPoint: 0.025 },

  /**
   * In-match form: after every scoring visit, nudged by how the visit compared with what that player
   * would normally throw today, so it swings both ways. It decays every visit and is capped.
   */
  inMatch: {
    /** Per point above or below the player's expected visit. */
    perPoint: 0.0008,
    decay: 0.85,
    cap: 0.15,
    checkout: 0.015,
    missedDoubles: -0.006,
    bust: -0.01,
  },

  /** Stamina: after `freeDarts` darts in a match, the spread grows per 100 darts, less with more stamina. */
  stamina: { freeDarts: 250, per100At1: 0.045, per100At20: 0.004 },

  /** Pressure widens the spread; composure takes the edge off it. */
  pressure: {
    legDouble: 0.1,
    setDouble: 0.18,
    matchDouble: 0.3,
    /** Scoring when the opponent's on a finish, or in a deciding leg or set. */
    scoring: 0.08,
    /** Pressure on every dart, by stage. */
    stageBase: { floor: 0, tv: 0.03, final: 0.06 },
    /** Pressure moments count for more on bigger stages. */
    stageMult: { floor: 0.8, tv: 1, final: 1.4 },
    /** At composure 20, pressure still has this much of its effect. */
    composureFloor: 0.1,
  },

  /** Watching pace at 1×, in milliseconds. */
  pace: { dart: 1600, visit: 3200, nextVisit: 900, leg: 3600, set: 4800 },
} as const;
