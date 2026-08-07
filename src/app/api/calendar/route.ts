import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { CalendarDay } from "@/types/gamification";

/**
 * Fetches all of the user's sessions from the last 365 days and groups them
 * by date, for the activity heatmap.
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 365);
  const sinceISODate = since.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("sessions")
    .select("date_completed, total_reps, xp_earned")
    .eq("user_id", user.id)
    .gte("date_completed", sinceISODate);

  if (error) {
    console.error("Failed to fetch calendar data:", error);
    return NextResponse.json({ error: "Failed to fetch calendar data" }, { status: 500 });
  }

  const byDate = new Map<string, { totalReps: number; totalXp: number }>();

  for (const row of data ?? []) {
    const date = row.date_completed as string;
    const existing = byDate.get(date) ?? { totalReps: 0, totalXp: 0 };
    existing.totalReps += row.total_reps ?? 0;
    existing.totalXp += row.xp_earned ?? 0;
    byDate.set(date, existing);
  }

  const days: CalendarDay[] = Array.from(byDate.entries()).map(([date, v]) => ({
    date,
    totalReps: v.totalReps,
    totalXp: v.totalXp,
  }));

  days.sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({ days }, { status: 200 });
}
