import { createClient } from "@/lib/supabase/client";
import { ProfileStats } from "@/types/gamification";

interface ProfileRow {
  xp_total: number;
  current_streak: number;
  longest_streak: number;
  last_session_date: string | null;
  level: number;
}

export async function fetchProfile(): Promise<ProfileStats | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("xp_total, current_streak, longest_streak, last_session_date, level")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as ProfileRow;
  return {
    xpTotal: row.xp_total,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastSessionDate: row.last_session_date,
    level: row.level,
  };
}
