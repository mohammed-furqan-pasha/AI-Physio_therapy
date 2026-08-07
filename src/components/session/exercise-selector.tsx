"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/store/session-store";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Loader2, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function ExerciseSelector() {
  const exercise = useSessionStore((s) => s.exercise);
  const exercises = useSessionStore((s) => s.exercises);
  const exercisesLoading = useSessionStore((s) => s.exercisesLoading);
  const setExercise = useSessionStore((s) => s.setExercise);
  const loadExercises = useSessionStore((s) => s.loadExercises);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  if (exercisesLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading exercises...
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 landscape:flex-col landscape:flex-nowrap landscape:justify-start">
      {exercises.map((ex) => (
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
            {ex.tutorialMediaUrl && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-1 h-6 px-2 text-xs"
                    onClick={(e) => e.stopPropagation()} // don't also select the card
                  >
                    <PlayCircle className="mr-1 h-3 w-3" /> Tutorial
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{ex.name} — Tutorial</DialogTitle>
                  </DialogHeader>
                  {ex.tutorialMediaType === "video" ? (
                    <video src={ex.tutorialMediaUrl} controls className="w-full rounded-md" />
                  ) : (
                    <img src={ex.tutorialMediaUrl} alt={`${ex.name} tutorial`} className="w-full rounded-md" />
                  )}
                </DialogContent>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
