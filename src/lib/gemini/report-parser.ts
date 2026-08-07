import { GoogleGenAI, Type } from "@google/genai";
import { ExerciseConfig } from "@/types/exercise";

export interface ParsedReport {
  diagnosis: string;
  bodyPart: string;
  severity: "Mild" | "Moderate" | "Severe";
  recommendedExerciseIds: string[];
  summary: string;
}

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_GENAI_API_KEY is not configured on the server");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

function buildResponseSchema(exerciseIds: string[]) {
  return {
    type: Type.OBJECT,
    properties: {
      diagnosis: {
        type: Type.STRING,
        description: "The primary diagnosis stated or implied in the report.",
      },
      bodyPart: {
        type: Type.STRING,
        description: "The primary body part or joint affected.",
      },
      severity: {
        type: Type.STRING,
        enum: ["Mild", "Moderate", "Severe"],
      },
      recommendedExerciseIds: {
        type: Type.ARRAY,
        description: `Exactly 3 exercise IDs selected from this fixed list: ${exerciseIds.join(
          ", "
        )}. Never invent new IDs.`,
        items: { type: Type.STRING, enum: exerciseIds },
      },
      summary: {
        type: Type.STRING,
        description: "A one to two sentence plain-language summary for the patient.",
      },
    },
    required: [
      "diagnosis",
      "bodyPart",
      "severity",
      "recommendedExerciseIds",
      "summary",
    ],
  };
}

/**
 * Sends a base64-encoded medical report (PDF or image) to Gemini as inline
 * data — the file is never persisted to any bucket or disk. Returns
 * structured JSON matching ParsedReport.
 *
 * `exercises` is the live catalog (fetched server-side from Supabase by the
 * calling route handler) — this function stays agnostic of where exercises
 * come from, it just needs the list to build the prompt + constrain the
 * response schema.
 */
export async function parseReportWithGemini(
  base64Data: string,
  mimeType: string,
  exercises: ExerciseConfig[]
): Promise<ParsedReport> {
  const ai = getClient();

  const exerciseIds = exercises.map((e) => e.id);
  const exerciseCatalog = exercises
    .map((e) => `- ${e.id}: ${e.name} (targets ${e.bodyPart})`)
    .join("\n");

  const prompt = `You are a physiotherapy triage assistant. Read the attached medical report
(PDF or image) and extract the following:
1. The primary diagnosis.
2. The primary affected body part.
3. Severity: Mild, Moderate, or Severe.
4. Exactly 3 recommended exercises, chosen ONLY from this fixed catalog:
${exerciseCatalog}
5. A short one to two sentence plain-language summary for the patient.

Respond only with structured data matching the provided schema. If the report
does not clearly state a diagnosis, make your best clinical inference from
the visible content and note the uncertainty in the summary.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: buildResponseSchema(exerciseIds),
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  const parsed = JSON.parse(text) as ParsedReport;

  // Defensive guard: ensure only valid, existing exercise IDs are returned.
  parsed.recommendedExerciseIds = parsed.recommendedExerciseIds.filter((id) =>
    exerciseIds.includes(id)
  );

  return parsed;
}
