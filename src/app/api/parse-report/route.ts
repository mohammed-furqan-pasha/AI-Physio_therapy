import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseReportWithGemini } from "@/lib/gemini/report-parser";
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
    const exercises = await fetchExercisesServer();

    // NOTE: base64Data is passed straight to Gemini as inline data and is
    // never written to disk or a storage bucket.
    const result = await parseReportWithGemini(base64Data, mimeType, exercises);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Gemini report parsing failed:", err);
    return NextResponse.json(
      { error: "Failed to parse report" },
      { status: 502 }
    );
  }
}
