"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ParseReportResponse } from "@/types/report";
import { ReportResult } from "@/components/report/report-result";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

export function ReportUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ParseReportResponse | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      toast.error("Please upload a PDF, PNG, JPEG, or WebP file");
      return;
    }

    setFile(selected);
    setResult(null);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);

    try {
      const base64Data = await fileToBase64(file);

      const res = await fetch("/api/parse-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64Data, mimeType: file.type }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to parse report");
      }

      const parsed: ParseReportResponse = await res.json();
      setResult(parsed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to parse report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload Medical Report</CardTitle>
          <CardDescription>
            Upload a PDF or image. It&apos;s sent directly to Gemini for analysis
            and is never stored.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center hover:bg-accent/40">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {file ? file.name : "Click to choose a file"}
            </span>
            <input
              type="file"
              accept={ACCEPTED_TYPES.join(",")}
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          <Button onClick={handleUpload} disabled={!file || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              "Analyze Report"
            )}
          </Button>
        </CardContent>
      </Card>

      {result && <ReportResult report={result} />}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:<mime>;base64," prefix — Gemini inline data wants raw base64.
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
