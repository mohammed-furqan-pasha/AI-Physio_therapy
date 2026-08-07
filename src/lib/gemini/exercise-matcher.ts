import { ExerciseConfig } from "@/types/exercise";
import { ExtractedExercise } from "@/lib/gemini/report-parser";

export type MatchType = "name" | "bodyPart" | "none";

export interface MatchedExercise {
  extracted: ExtractedExercise;
  /** The catalog exercise this was matched to, or null if nothing matched. */
  matched: ExerciseConfig | null;
  matchType: MatchType;
}

/** Lowercase, strip punctuation, collapse whitespace — for loose comparison. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length > 2); // drop tiny words like "of", "in"
}

function namesMatch(extractedName: string, catalogName: string): boolean {
  const a = normalize(extractedName);
  const b = normalize(catalogName);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function bodyPartsMatch(extractedBodyPart: string, catalogBodyPart: string): boolean {
  const extractedTokens = new Set(tokens(extractedBodyPart));
  const catalogTokens = tokens(catalogBodyPart);
  // catalogBodyPart is often "Elbow / Upper Arm" — any single overlapping
  // token (e.g. "elbow", "shoulder", "knee") counts as a match.
  return catalogTokens.some((t) => extractedTokens.has(t));
}

/**
 * Matches each report-extracted exercise against the live exercise catalog.
 * Tries an exact/substring NAME match first (most reliable when the report
 * happens to name one of our exercises directly), then falls back to a
 * BODY PART match (e.g. report says "Shoulder Flexion Stretch" targeting
 * "shoulder" — matches our "Lateral Raise" which also targets "Shoulder").
 * Returns "none" if neither matches, so the UI can show it as unavailable
 * rather than silently dropping it.
 */
export function matchExtractedExercises(
  extracted: ExtractedExercise[],
  catalog: ExerciseConfig[]
): MatchedExercise[] {
  return extracted.map((ex) => {
    const nameMatch = catalog.find((c) => namesMatch(ex.name, c.name));
    if (nameMatch) {
      return { extracted: ex, matched: nameMatch, matchType: "name" as const };
    }

    const bodyPartMatch = catalog.find((c) => bodyPartsMatch(ex.bodyPart, c.bodyPart));
    if (bodyPartMatch) {
      return { extracted: ex, matched: bodyPartMatch, matchType: "bodyPart" as const };
    }

    return { extracted: ex, matched: null, matchType: "none" as const };
  });
}
