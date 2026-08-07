"use client";

import Link from "next/link";
import { ParseReportResponse } from "@/types/report";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, HelpCircle } from "lucide-react";

const SEVERITY_COLORS: Record<ParseReportResponse["severity"], string> = {
  Mild: "bg-emerald-600",
  Moderate: "bg-amber-600",
  Severe: "bg-destructive",
};

export function ReportResult({ report }: { report: ParseReportResponse }) {
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
          <p className="text-sm font-medium">Exercises mentioned in this report</p>

          {!report.matchedExercises || report.matchedExercises.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No specific exercises were named in this report.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {report.matchedExercises.map((m, idx) => (
                <div
                  key={`${m.extracted.name}-${idx}`}
                  className="flex items-center justify-between rounded-md border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{m.extracted.name}</p>
                    <p className="text-xs text-muted-foreground">{m.extracted.bodyPart}</p>
                    {m.matched && (
                      <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        {m.matchType === "name"
                          ? `Matched to "${m.matched.name}"`
                          : `Matched by body part to "${m.matched.name}"`}
                      </p>
                    )}
                  </div>

                  {m.matched ? (
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/session?exercise=${m.matched.id}`}>Try it</Link>
                    </Button>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                      <HelpCircle className="h-3 w-3" />
                      Not in library yet
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
