import { SupabaseClient } from "@supabase/supabase-js";
import { ProfileStats } from "@/types/gamification";

interface ProfileRow {
  xp_total: number;
  current_streak: number;
  longest_streak: number;
  last_session_date: string | null;
  level: number;
}

function rowToStats(row: ProfileRow): ProfileStats {
  return {
    xpTotal: row.xp_total,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastSessionDate: row.last_session_date,
    level: row.level,
  };
}

/**
 * Fetches the caller's profile row, creating a default one if it somehow
 * doesn't exist yet (e.g. the user existed before the on_auth_user_created
 * trigger was added). Server-side only — takes an already-authenticated
 * Supabase client (cookies-based, from lib/supabase/server.ts).
 */
export async function getOrCreateProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileStats> {
  const { data, error } = await supabase
    .from("profiles")
    .select("xp_total, current_streak, longest_streak, last_session_date, level")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  if (data) return rowToStats(data as ProfileRow);

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({ user_id: userId })
    .select("xp_total, current_streak, longest_streak, last_session_date, level")
    .single();

  if (insertError) throw insertError;
  return rowToStats(created as ProfileRow);
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: {
    xpTotal: number;
    currentStreak: number;
    longestStreak: number;
    lastSessionDate: string;
    level: number;
  }
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      xp_total: updates.xpTotal,
      current_streak: updates.currentStreak,
      longest_streak: updates.longestStreak,
      last_session_date: updates.lastSessionDate,
      level: updates.level,
    })
    .eq("user_id", userId);

  if (error) throw error;
}
