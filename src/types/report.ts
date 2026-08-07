import { ParsedReport } from "@/lib/gemini/report-parser";
import { MatchedExercise } from "@/lib/gemini/exercise-matcher";

export type ParseReportResponse = ParsedReport & {
  matchedExercises: MatchedExercise[];
};
