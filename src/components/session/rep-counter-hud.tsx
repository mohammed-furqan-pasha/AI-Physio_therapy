"use client";

import { useSessionStore } from "@/store/session-store";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { RepState } from "@/types/exercise";

const STATE_LABELS: Record<RepState, string> = {
  ready: "Ready",
  moving: "Moving",
  peak_hold: "Hold",
  returning: "Returning",
};

const STATE_COLORS: Record<RepState, string> = {
  ready: "bg-slate-500",
  moving: "bg-sky-500",
  peak_hold: "bg-amber-500",
  returning: "bg-emerald-500",
};

export function RepCounterHud() {
  const exercise = useSessionStore((s) => s.exercise);
  const reps = useSessionStore((s) => s.reps);
  const fsmState = useSessionStore((s) => s.fsmState);
  const currentAngle = useSessionStore((s) => s.currentAngle);
  const formWarnings = useSessionStore((s) => s.formWarnings);

  return (
    <div className="flex w-full max-w-3xl flex-col gap-3">
      <div className="flex items-center justify-between rounded-xl border bg-card p-4">
        <div>
          <p className="text-xs text-muted-foreground">{exercise.name}</p>
          <p className="text-4xl font-bold tabular-nums">{reps}</p>
          <p className="text-xs text-muted-foreground">reps</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <Badge className={cn("text-white", STATE_COLORS[fsmState])}>
            {STATE_LABELS[fsmState]}
          </Badge>
          <p className="text-sm text-muted-foreground tabular-nums">
            {currentAngle.toFixed(0)}&deg;
          </p>
        </div>
      </div>

      {formWarnings.length > 0 && (
        <div className="flex flex-col gap-1 rounded-xl border border-destructive/50 bg-destructive/10 p-3">
          {formWarnings.map((warning) => (
            <p key={warning} className="text-sm font-medium text-destructive">
              ⚠ {warning}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
