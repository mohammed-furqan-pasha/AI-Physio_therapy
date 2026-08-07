import { LEVEL_XP_THRESHOLDS, STREAK_BONUS_XP, XP_PER_REP } from "@/config/gamification";

/** Flat XP per rep, plus a flat bonus if this session is on a streak (day 2+). */
export function calculateSessionXp(reps: number, newStreak: number): number {
  const base = Math.max(0, reps) * XP_PER_REP;
  const bonus = newStreak > 1 ? STREAK_BONUS_XP : 0;
  return base + bonus;
}

export function calculateLevel(xpTotal: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_XP_THRESHOLDS.length; i++) {
    if (xpTotal >= LEVEL_XP_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

export interface LevelProgress {
  level: number;
  currentLevelXp: number;
  /** XP needed to reach the next level, or null if at the max defined level. */
  nextLevelXp: number | null;
  /** 0-1 progress fraction toward the next level. 1 if at max level. */
  progress: number;
}

export function levelProgress(xpTotal: number): LevelProgress {
  const level = calculateLevel(xpTotal);
  const currentThreshold = LEVEL_XP_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_XP_THRESHOLDS[level]; // undefined at max level

  if (nextThreshold === undefined) {
    return { level, currentLevelXp: xpTotal - currentThreshold, nextLevelXp: null, progress: 1 };
  }

  const progress = (xpTotal - currentThreshold) / (nextThreshold - currentThreshold);
  return {
    level,
    currentLevelXp: xpTotal - currentThreshold,
    nextLevelXp: nextThreshold,
    progress: Math.min(1, Math.max(0, progress)),
  };
}
