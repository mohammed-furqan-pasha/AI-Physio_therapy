import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseReportWithGemini } from "@/lib/gemini/report-parser";
import { matchExtractedExercises } from "@/lib/gemini/exercise-matcher";
import { fetchExercisesServer } from "@/lib/supabase/exercises-server";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

const MAX_BASE64_LENGTH = 15_000_000; // ~11MB decoded, generous ceiling for a report

interface ParseReportRequestBody {
  base64Data: string;
  mimeType: string;
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ParseReportRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { base64Data, mimeType } = body;

  if (!base64Data || !mimeType) {
    return NextResponse.json(
      { error: "base64Data and mimeType are required" },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType)) {
    return NextResponse.json(
      { error: `Unsupported file type: ${mimeType}` },
      { status: 415 }
    );
  }

  if (base64Data.length > MAX_BASE64_LENGTH) {
    return NextResponse.json(
      { error: "File too large" },
      { status: 413 }
    );
  }

  try {
    // NOTE: base64Data is passed straight to Gemini as inline data and is
    // never written to disk or a storage bucket.
    const [parsed, exercises] = await Promise.all([
      parseReportWithGemini(base64Data, mimeType),
      fetchExercisesServer(),
    ]);

    // Match every exercise the report actually mentioned against our live
    // catalog: exact/substring name match first, body-part overlap as a
    // fallback. Exercises that match neither are still returned (matched:
    // null) so the UI can show them as "not in our library yet" instead of
    // silently dropping them.
    const matchedExercises = matchExtractedExercises(
      parsed.extractedExercises,
      exercises
    );

    return NextResponse.json({ ...parsed, matchedExercises }, { status: 200 });
  } catch (err) {
    console.error("Gemini report parsing failed:", err);
    return NextResponse.json(
      { error: "Failed to parse report" },
      { status: 502 }
    );
  }
}
