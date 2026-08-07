import { GoogleGenAI, Type } from "@google/genai";

/** An exercise as literally described in the report — not yet matched to our catalog. */
export interface ExtractedExercise {
  name: string;
  bodyPart: string;
}

export interface ParsedReport {
  diagnosis: string;
  bodyPart: string;
  severity: "Mild" | "Moderate" | "Severe";
  extractedExercises: ExtractedExercise[];
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

// NOTE: Gemini model IDs get deprecated/retired on a rolling basis. If this
// starts 404ing again, check https://ai.google.dev/gemini-api/docs/models
// for the current stable "-flash" model and swap it in here.
const GEMINI_MODEL = "gemini-3.6-flash";

const RESPONSE_SCHEMA = {
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
    extractedExercises: {
      type: Type.ARRAY,
      description:
        "Every exercise explicitly named or clearly recommended anywhere in the report " +
        "(rehab plan, doctor's notes, physiotherapist instructions, etc), in the report's " +
        "own wording. Do NOT limit this to any fixed list — extract as many or as few as " +
        "are actually present. If the report names no specific exercises, return an empty array.",
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: "Exercise name as written or clearly implied in the report.",
          },
          bodyPart: {
            type: Type.STRING,
            description: "The body part or joint this specific exercise targets.",
          },
        },
        required: ["name", "bodyPart"],
      },
    },
    summary: {
      type: Type.STRING,
      description: "A one to two sentence plain-language summary for the patient.",
    },
  },
  required: ["diagnosis", "bodyPart", "severity", "extractedExercises", "summary"],
};

/**
 * Sends a base64-encoded medical report (PDF or image) to Gemini as inline
 * data — the file is never persisted to any bucket or disk. Returns
 * structured JSON matching ParsedReport, including every exercise the
 * report actually mentions (freeform — not constrained to our catalog).
 * Matching those against our catalog happens separately, in
 * exercise-matcher.ts, after this returns.
 */
export async function parseReportWithGemini(
  base64Data: string,
  mimeType: string
): Promise<ParsedReport> {
  const ai = getClient();

  const prompt = `You are a physiotherapy triage assistant. Read the attached medical report
(PDF or image) and extract the following:
1. The primary diagnosis.
2. The primary affected body part.
3. Severity: Mild, Moderate, or Severe.
4. Every exercise explicitly named or recommended anywhere in the report, along with the
   body part each one targets. Use the report's own wording for the exercise name. If none
   are named, return an empty list — do not invent exercises that aren't in the report.
5. A short one to two sentence plain-language summary for the patient.

Respond only with structured data matching the provided schema. If the report does not
clearly state a diagnosis, make your best clinical inference from the visible content and
note the uncertainty in the summary.`;

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
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
      responseSchema: RESPONSE_SCHEMA,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Empty response from Gemini");
  }

  return JSON.parse(text) as ParsedReport;
}
