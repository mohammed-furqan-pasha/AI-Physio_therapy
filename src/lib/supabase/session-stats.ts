import { createClient } from "@/lib/supabase/client";
import { ExerciseBreakdownEntry, ProfileFullStats, RecentSessionEntry } from "@/types/profile-stats";

interface SessionRow {
  id: string;
  exercise_id: string;
  exercise_name: string;
  total_reps: number;
  duration_seconds: number;
  xp_earned: number;
  form_warnings_encountered: string[];
  completed_at: string;
  pain_level: number | null;
  set_count: number | null;
  reps_per_minute: number | null;
  pace_category: "slow" | "moderate" | "fast" | null;
}

/** Client-side aggregation over the user's own sessions (covered by existing RLS). */
export async function fetchProfileFullStats(): Promise<ProfileFullStats | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, exercise_id, exercise_name, total_reps, duration_seconds, xp_earned, form_warnings_encountered, completed_at, pain_level, set_count, reps_per_minute, pace_category"
    )
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false });

  if (error || !data) return null;

  const rows = data as SessionRow[];
  const totalSessions = rows.length;
  const totalReps = rows.reduce((sum, r) => sum + r.total_reps, 0);
  const totalDurationSeconds = rows.reduce((sum, r) => sum + r.duration_seconds, 0);
  const avgRepsPerSession = totalSessions > 0 ? totalReps / totalSessions : 0;

  const withPain = rows.filter((r) => r.pain_level !== null);
  const avgPainLevel =
    withPain.length > 0
      ? withPain.reduce((sum, r) => sum + (r.pain_level ?? 0), 0) / withPain.length
      : null;

  function painRange(level: number): "low" | "moderate" | "high" {
    if (level <= 3) return "low";
    if (level <= 6) return "moderate";
    return "high";
  }

  const rangeBuckets: Record<"low" | "moderate" | "high", SessionRow[]> = {
    low: [],
    moderate: [],
    high: [],
  };
  for (const r of withPain) {
    rangeBuckets[painRange(r.pain_level as number)].push(r);
  }

  function dominantPace(sessions: SessionRow[]): "slow" | "moderate" | "fast" | null {
    if (sessions.length === 0) return null;
    const counts = { slow: 0, moderate: 0, fast: 0 };
    for (const s of sessions) {
      if (s.pace_category) counts[s.pace_category]++;
    }
    return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as "slow" | "moderate" | "fast") ?? null;
  }

  const painRangeBreakdown = (["low", "moderate", "high"] as const).map((range) => {
    const bucket = rangeBuckets[range];
    const n = bucket.length;
    return {
      range,
      sessionCount: n,
      avgReps: n > 0 ? bucket.reduce((s, r) => s + r.total_reps, 0) / n : 0,
      avgDurationSeconds: n > 0 ? bucket.reduce((s, r) => s + r.duration_seconds, 0) / n : 0,
      avgSetCount: n > 0 ? bucket.reduce((s, r) => s + (r.set_count ?? 0), 0) / n : 0,
      avgRepsPerMinute: n > 0 ? bucket.reduce((s, r) => s + (r.reps_per_minute ?? 0), 0) / n : 0,
      dominantPaceCategory: dominantPace(bucket),
    };
  });

  const breakdownMap = new Map<string, ExerciseBreakdownEntry>();
  for (const r of rows) {
    const existing = breakdownMap.get(r.exercise_id);
    if (existing) {
      existing.sessionCount += 1;
      existing.totalReps += r.total_reps;
      existing.totalXp += r.xp_earned;
      existing.bestSessionReps = Math.max(existing.bestSessionReps, r.total_reps);
    } else {
      breakdownMap.set(r.exercise_id, {
        exerciseId: r.exercise_id,
        exerciseName: r.exercise_name,
        sessionCount: 1,
        totalReps: r.total_reps,
        bestSessionReps: r.total_reps,
        totalXp: r.xp_earned,
      });
    }
  }
  const exerciseBreakdown = Array.from(breakdownMap.values()).sort(
    (a, b) => b.totalReps - a.totalReps
  );

  const recentSessions: RecentSessionEntry[] = rows.slice(0, 10).map((r) => ({
    id: r.id,
    exerciseName: r.exercise_name,
    totalReps: r.total_reps,
    durationSeconds: r.duration_seconds,
    xpEarned: r.xp_earned,
    formWarningCount: r.form_warnings_encountered?.length ?? 0,
    completedAt: r.completed_at,
    painLevel: r.pain_level,
    setCount: r.set_count,
    repsPerMinute: r.reps_per_minute,
    paceCategory: r.pace_category,
  }));

  return {
    totalSessions,
    totalReps,
    totalDurationSeconds,
    avgRepsPerSession,
    avgPainLevel,
    favoriteExerciseName: exerciseBreakdown[0]?.exerciseName ?? null,
    exerciseBreakdown,
    recentSessions,
    painRangeBreakdown,
  };
}
