import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SessionSummaryPayload } from "@/types/session";

/**
 * The ONLY database write in the entire live-session flow. Per spec, this
 * fires exactly once, when the user clicks "Finish Session" — never during
 * the session itself.
 */
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
  } = payload;

  if (
    !exerciseId ||
    !exerciseName ||
    typeof totalReps !== "number" ||
    typeof durationSeconds !== "number" ||
    typeof maxAngle !== "number" ||
    !completedAt
  ) {
    return NextResponse.json(
      { error: "Missing or invalid session summary fields" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
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
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to save session summary:", error);
    return NextResponse.json(
      { error: "Failed to save session" },
      { status: 500 }
    );
  }

  return NextResponse.json({ session: data }, { status: 201 });
}
