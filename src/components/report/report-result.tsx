"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ParsedReport } from "@/lib/gemini/report-parser";
import { fetchExercises } from "@/lib/supabase/exercises";
import { ExerciseConfig } from "@/types/exercise";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const SEVERITY_COLORS: Record<ParsedReport["severity"], string> = {
  Mild: "bg-emerald-600",
  Moderate: "bg-amber-600",
  Severe: "bg-destructive",
};

export function ReportResult({ report }: { report: ParsedReport }) {
  const [exercises, setExercises] = useState<ExerciseConfig[] | null>(null);

  useEffect(() => {
    fetchExercises().then(setExercises);
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{report.diagnosis}</CardTitle>
          <Badge className={`text-white ${SEVERITY_COLORS[report.severity]}`}>
            {report.severity}
          </Badge>
        </div>
        <CardDescription>{report.bodyPart}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">{report.summary}</p>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Recommended exercises</p>

          {!exercises ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {report.recommendedExerciseIds.map((id) => {
                const exercise = exercises.find((e) => e.id === id);
                if (!exercise) return null;
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{exercise.name}</p>
                      <p className="text-xs text-muted-foreground">{exercise.bodyPart}</p>
                    </div>
                    <Button size="sm" variant="outline" asChild>
                      <Link href="/session">Try it</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
