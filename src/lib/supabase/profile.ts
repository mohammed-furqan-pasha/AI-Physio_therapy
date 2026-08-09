import { createClient } from "@/lib/supabase/client";
import { ProfileStats } from "@/types/gamification";

interface ProfileRow {
  xp_total: number;
  current_streak: number;
  longest_streak: number;
  last_session_date: string | null;
  level: number;
  age: number | null;
  guardian_name: string | null;
  guardian_relation: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
}

export async function fetchProfile(): Promise<ProfileStats | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("xp_total, current_streak, longest_streak, last_session_date, level, age, guardian_name, guardian_relation, guardian_phone, guardian_email")
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
    age: row.age,
    guardianName: row.guardian_name,
    guardianRelation: row.guardian_relation,
    guardianPhone: row.guardian_phone,
    guardianEmail: row.guardian_email,
  };
}
