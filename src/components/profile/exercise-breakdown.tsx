import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { ExerciseBreakdownEntry } from "@/types/profile-stats";

export function ExerciseBreakdown({ entries }: { entries: ExerciseBreakdownEntry[] }) {
  if (entries.length === 0) return null;
  const maxReps = Math.max(...entries.map((e) => e.totalReps));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Exercise breakdown</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {entries.map((e) => (
          <div key={e.exerciseId} className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{e.exerciseName}</span>
              <span className="text-muted-foreground">
                {e.totalReps} reps · {e.sessionCount} sessions · best {e.bestSessionReps}
              </span>
            </div>
            <ProgressBar value={maxReps > 0 ? e.totalReps / maxReps : 0} />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
