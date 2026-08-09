export interface ExerciseBreakdownEntry {
  exerciseId: string;
  exerciseName: string;
  sessionCount: number;
  totalReps: number;
  bestSessionReps: number;
  totalXp: number;
}

export interface RecentSessionEntry {
  id: string;
  exerciseName: string;
  totalReps: number;
  durationSeconds: number;
  xpEarned: number;
  formWarningCount: number;
  completedAt: string;
  painLevel: number | null;
  setCount: number | null;
  repsPerMinute: number | null;
  paceCategory: "slow" | "moderate" | "fast" | null;
}

export interface PainRangeStats {
  range: "low" | "moderate" | "high"; // 0-3, 4-6, 7-10
  sessionCount: number;
  avgReps: number;
  avgDurationSeconds: number;
  avgSetCount: number;
  avgRepsPerMinute: number;
  dominantPaceCategory: "slow" | "moderate" | "fast" | null;
}

export interface ProfileFullStats {
  totalSessions: number;
  totalReps: number;
  totalDurationSeconds: number;
  avgRepsPerSession: number;
  avgPainLevel: number | null; // null if no sessions have a pain rating yet
  favoriteExerciseName: string | null;
  exerciseBreakdown: ExerciseBreakdownEntry[];
  recentSessions: RecentSessionEntry[];
  painRangeBreakdown: PainRangeStats[];
}
