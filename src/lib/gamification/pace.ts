export const SET_BREAK_MS = 15_000;

export const PACE_SLOW_THRESHOLD = 8; // reps/min below this = slow
export const PACE_FAST_THRESHOLD = 18; // reps/min above this = fast

export type PaceCategory = "slow" | "moderate" | "fast";

export interface PaceAnalysis {
  repsPerMinute: number;
  paceCategory: PaceCategory;
  setCount: number;
}

/**
 * Derives pace and set count purely from the timestamps of completed reps —
 * no explicit "set" button needed. A gap of SET_BREAK_MS or more between
 * consecutive reps is treated as a rest break between sets.
 */
export function analyzePace(repTimestamps: number[], durationSeconds: number): PaceAnalysis {
  const reps = repTimestamps.length;
  const minutes = Math.max(durationSeconds / 60, 1 / 60);
  const repsPerMinute = reps / minutes;

  let paceCategory: PaceCategory = "moderate";
  if (repsPerMinute < PACE_SLOW_THRESHOLD) paceCategory = "slow";
  else if (repsPerMinute > PACE_FAST_THRESHOLD) paceCategory = "fast";

  let setCount = reps > 0 ? 1 : 0;
  for (let i = 1; i < repTimestamps.length; i++) {
    if (repTimestamps[i] - repTimestamps[i - 1] >= SET_BREAK_MS) setCount++;
  }

  return { repsPerMinute: Math.round(repsPerMinute * 10) / 10, paceCategory, setCount };
}
