export interface ProfileStats {
  xpTotal: number;
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string | null; // "YYYY-MM-DD"
  level: number;
}

export interface FinishSessionResult {
  session: {
    id: string;
    totalReps: number;
    xpEarned: number;
    completedAt: string;
  };
  profile: ProfileStats;
  leveledUp: boolean;
  streakExtended: boolean;
}

export interface CalendarDay {
  date: string; // "YYYY-MM-DD"
  totalReps: number;
  totalXp: number;
}
