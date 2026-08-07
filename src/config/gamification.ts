/** Flat XP awarded per valid rep. */
export const XP_PER_REP = 10;

/** Flat bonus XP if the session extends/continues a multi-day streak. */
export const STREAK_BONUS_XP = 20;

/**
 * XP required to REACH each level. Index 0 = level 1 (0 XP), index 1 =
 * level 2, etc. Tune freely — levels beyond the last threshold just need
 * ever-larger XP, so extend this array as needed.
 */
export const LEVEL_XP_THRESHOLDS = [
  0, 100, 250, 500, 900, 1400, 2000, 2700, 3500, 4400, 5400,
];
