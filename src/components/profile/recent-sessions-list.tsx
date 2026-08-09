import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecentSessionEntry } from "@/types/profile-stats";
import { AlertTriangle, Zap } from "lucide-react";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function RecentSessionsList({ sessions }: { sessions: RecentSessionEntry[] }) {
  if (sessions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Recent sessions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {sessions.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
            <div>
              <p className="text-sm font-medium">{s.exerciseName}</p>
              <p className="text-xs text-muted-foreground">{formatDate(s.completedAt)}</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span>{s.totalReps} reps</span>
              <span className="flex items-center gap-1 text-amber-400">
                <Zap className="h-3 w-3" /> +{s.xpEarned}
              </span>
              {s.painLevel !== null && (
                <span className="text-muted-foreground">Pain {s.painLevel}/10</span>
              )}
              {s.paceCategory && (
                <Badge variant="outline" className="capitalize">{s.paceCategory}</Badge>
              )}
              {s.formWarningCount > 0 && (
                <Badge variant="outline" className="gap-1 text-amber-300">
                  <AlertTriangle className="h-3 w-3" />
                  {s.formWarningCount}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
