"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/store/session-store";
import { Loader2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ExerciseSelector() {
  const exercise = useSessionStore((s) => s.exercise);
  const exercises = useSessionStore((s) => s.exercises);
  const exercisesLoading = useSessionStore((s) => s.exercisesLoading);
  const setExercise = useSessionStore((s) => s.setExercise);
  const loadExercises = useSessionStore((s) => s.loadExercises);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  // Force Bicep Curl as default if it exists in the list and current exercise is different
  // (We do this on mount/load if exercises are present)
  useEffect(() => {
    if (!exercisesLoading && exercises.length > 0) {
      const bicepCurlExists = exercises.some(ex => ex.id === "bicep-curl");
      if (bicepCurlExists && exercise.id !== "bicep-curl") {
        setExercise("bicep-curl");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercises, exercisesLoading]);

  if (exercisesLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading exercises...
      </div>
    );
  }

  return (
    <div className="flex w-full items-center justify-center gap-2">
      <Select value={exercise.id} onValueChange={setExercise}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Select an exercise" />
        </SelectTrigger>
        <SelectContent>
          {exercises.map((ex) => (
            <SelectItem key={ex.id} value={ex.id}>
              {ex.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
