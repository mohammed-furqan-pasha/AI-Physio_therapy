import { createClient } from "./server";
import { FALLBACK_EXERCISES } from "@/config/exercises";
import { ExerciseConfig } from "@/types/exercise";

export async function fetchExercisesServer(): Promise<ExerciseConfig[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("exercises")
      .select("id, name, config")
      .eq("is_active", true);

    if (error || !data || data.length === 0) {
      console.warn("Failed to fetch exercises or empty, using fallback", error);
      return FALLBACK_EXERCISES;
    }

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      ...row.config
    })) as ExerciseConfig[];
  } catch (err) {
    console.warn("Exception fetching exercises, using fallback", err);
    return FALLBACK_EXERCISES;
  }
}
