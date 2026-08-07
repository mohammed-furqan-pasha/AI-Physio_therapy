import { createClient } from "./client";
import { FALLBACK_EXERCISES } from "@/config/exercises";
import { ExerciseConfig } from "@/types/exercise";

let cachedExercises: ExerciseConfig[] | null = null;

export async function fetchExercises(): Promise<ExerciseConfig[]> {
  if (cachedExercises) return cachedExercises;
  
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

    cachedExercises = data.map((row: any) => ({
      id: row.id,
      name: row.name,
      ...row.config
    })) as ExerciseConfig[];
    
    return cachedExercises;
  } catch (err) {
    console.warn("Exception fetching exercises, using fallback", err);
    return FALLBACK_EXERCISES;
  }
}
