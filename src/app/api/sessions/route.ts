import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateProfile, updateProfile } from "@/lib/supabase/profile-server";
import { evaluateStreak } from "@/lib/gamification/streak";
import { calculateLevel, calculateSessionXp } from "@/lib/gamification/xp";
import { SessionSummaryPayload } from "@/types/session";
import { FinishSessionResult } from "@/types/gamification";

/**
 * The ONLY database write in the live-session flow. Fires once, when the
 * user clicks "Finish Session". XP and streaks are computed here — the
 * server-side "should never trust client-submitted numbers" boundary —
 * the client only sends reps/duration/angles; XP is never accepted from
 * the client even if a future payload includes it.
 */
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: SessionSummaryPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    exerciseId,
    exerciseName,
    totalReps,
    durationSeconds,
    maxAngle,
    formWarningsEncountered,
    completedAt,
    painLevel,
    setCount,
    repsPerMinute,
    paceCategory,
  } = payload;

  if (
    !exerciseId ||
    !exerciseName ||
    typeof totalReps !== "number" ||
    typeof durationSeconds !== "number" ||
    typeof maxAngle !== "number" ||
    !completedAt ||
    typeof painLevel !== "number" || painLevel < 0 || painLevel > 10 ||
    typeof setCount !== "number" ||
    typeof repsPerMinute !== "number" ||
    !["slow", "moderate", "fast"].includes(paceCategory)
  ) {
    return NextResponse.json(
      { error: "Missing or invalid session summary fields" },
      { status: 400 }
    );
  }

  try {
    // Server date is the source of truth for streak evaluation, per spec —
    // never trust a client-supplied date for this comparison.
    const todayISODate = new Date().toISOString().slice(0, 10);

    const profile = await getOrCreateProfile(supabase, user.id);

    const { newStreak, newLongestStreak, isNewStreakDay } = evaluateStreak(
      profile.lastSessionDate,
      profile.currentStreak,
      profile.longestStreak,
      todayISODate
    );

    const xpEarned = calculateSessionXp(totalReps, newStreak);
    const newXpTotal = profile.xpTotal + xpEarned;
    const newLevel = calculateLevel(newXpTotal);
    const leveledUp = newLevel > profile.level;

    const { data: sessionRow, error: sessionError } = await supabase
      .from("sessions")
      .insert({
        user_id: user.id,
        exercise_id: exerciseId,
        exercise_name: exerciseName,
        total_reps: totalReps,
        duration_seconds: durationSeconds,
        max_angle: maxAngle,
        form_warnings_encountered: formWarningsEncountered ?? [],
        completed_at: completedAt,
        pain_level: painLevel,
        set_count: setCount,
        reps_per_minute: repsPerMinute,
        pace_category: paceCategory,
        xp_earned: xpEarned,
      })
      .select()
      .single();

    if (sessionError) throw sessionError;

    await updateProfile(supabase, user.id, {
      xpTotal: newXpTotal,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
      lastSessionDate: todayISODate,
      level: newLevel,
    });

    const result: FinishSessionResult = {
      session: {
        id: sessionRow.id,
        totalReps,
        xpEarned,
        completedAt,
      },
      profile: {
        xpTotal: newXpTotal,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastSessionDate: todayISODate,
        level: newLevel,
      },
      leveledUp,
      streakExtended: isNewStreakDay && newStreak > 1,
    };

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    console.error("Failed to save session / update profile:", err);
    return NextResponse.json({ error: "Failed to save session" }, { status: 500 });
  }
}
