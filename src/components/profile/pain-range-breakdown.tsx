import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PainRangeStats } from "@/types/profile-stats";
import { Gauge, Layers } from "lucide-react";

const RANGE_LABELS: Record<PainRangeStats["range"], string> = {
  low: "Low pain (0-3)",
  moderate: "Moderate pain (4-6)",
  high: "High pain (7-10)",
};

const RANGE_COLORS: Record<PainRangeStats["range"], string> = {
  low: "border-emerald-400/30",
  moderate: "border-amber-400/30",
  high: "border-red-400/30",
};

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60);
  return `${mins}m`;
}

export function PainRangeBreakdown({ ranges }: { ranges: PainRangeStats[] }) {
  const withData = ranges.filter((r) => r.sessionCount > 0);
  if (withData.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Performance by pain level</CardTitle>
        <CardDescription>
          How your reps, pace, and sets change depending on how much pain you reported.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {withData.map((r) => (
          <div
            key={r.range}
            className={`rounded-xl border ${RANGE_COLORS[r.range]} bg-white/5 p-3`}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium">{RANGE_LABELS[r.range]}</p>
              <span className="text-xs text-muted-foreground">{r.sessionCount} sessions</span>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">{r.avgReps.toFixed(1)} avg reps</Badge>
              <Badge variant="outline">{formatDuration(r.avgDurationSeconds)} avg duration</Badge>
              <Badge variant="outline" className="gap-1">
                <Layers className="h-3 w-3" />
                {r.avgSetCount.toFixed(1)} avg sets
              </Badge>
              <Badge variant="outline" className="gap-1">
                <Gauge className="h-3 w-3" />
                {r.avgRepsPerMinute.toFixed(1)} reps/min · {r.dominantPaceCategory ?? "—"}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
