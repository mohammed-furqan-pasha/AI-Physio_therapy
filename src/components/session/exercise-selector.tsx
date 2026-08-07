"use client";

import { EXERCISES } from "@/config/exercises";
import { useSessionStore } from "@/store/session-store";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ExerciseSelector() {
  const exercise = useSessionStore((s) => s.exercise);
  const setExercise = useSessionStore((s) => s.setExercise);

  return (
    <div className="flex gap-3">
      {EXERCISES.map((ex) => (
        <Card
          key={ex.id}
          onClick={() => setExercise(ex.id)}
          className={cn(
            "w-40 cursor-pointer transition-colors hover:border-primary",
            exercise.id === ex.id && "border-primary bg-accent/40"
          )}
        >
          <CardContent className="p-4 text-center">
            <p className="text-sm font-medium">{ex.name}</p>
            <p className="text-xs text-muted-foreground">{ex.bodyPart}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
