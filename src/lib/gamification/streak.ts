/** Whole-day difference between two "YYYY-MM-DD" dates, computed in UTC to avoid TZ drift. */
function daysBetween(earlier: string, later: string): number {
  const a = new Date(`${earlier}T00:00:00Z`).getTime();
  const b = new Date(`${later}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

export interface StreakResult {
  newStreak: number;
  newLongestStreak: number;
  /** True if this session started a new day of the streak (not a same-day repeat). */
  isNewStreakDay: boolean;
}

/**
 * Server-date-based streak evaluation.
 *  - No previous session, or last session was 2+ days ago -> streak resets to 1.
 *  - Last session was yesterday -> streak + 1.
 *  - Last session was today already -> streak unchanged (no double-counting).
 */
export function evaluateStreak(
  lastSessionDate: string | null,
  currentStreak: number,
  longestStreak: number,
  todayISODate: string
): StreakResult {
  let newStreak: number;
  let isNewStreakDay: boolean;

  if (!lastSessionDate) {
    newStreak = 1;
    isNewStreakDay = true;
  } else {
    const diff = daysBetween(lastSessionDate, todayISODate);
    if (diff <= 0) {
      // Same day (or a clock skew edge case) — don't double-count.
      newStreak = currentStreak > 0 ? currentStreak : 1;
      isNewStreakDay = false;
    } else if (diff === 1) {
      newStreak = currentStreak + 1;
      isNewStreakDay = true;
    } else {
      newStreak = 1;
      isNewStreakDay = true;
    }
  }

  return {
    newStreak,
    newLongestStreak: Math.max(longestStreak, newStreak),
    isNewStreakDay,
  };
}
