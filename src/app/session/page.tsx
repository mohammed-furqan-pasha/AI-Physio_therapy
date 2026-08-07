"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { usePeerHost } from "@/lib/peer/use-peer-host";
import { QrDisplay } from "@/components/session/qr-display";
import { VideoCanvas } from "@/components/session/video-canvas";
import { RepCounterHud } from "@/components/session/rep-counter-hud";
import { FinishSessionButton } from "@/components/session/finish-session-button";
import { ExerciseSelector } from "@/components/session/exercise-selector";
import { useSessionStore } from "@/store/session-store";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function SessionPage() {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <SessionPageInner />
    </Suspense>
  );
}

function SessionPageInner() {
  const searchParams = useSearchParams();
  const preselectedExerciseId = searchParams.get("exercise");

  const { peerId, status, remoteStream, error } = usePeerHost();
  const isSessionActive = useSessionStore((s) => s.isSessionActive);
  const startSession = useSessionStore((s) => s.startSession);
  const resetSession = useSessionStore((s) => s.resetSession);
  const loadExercises = useSessionStore((s) => s.loadExercises);
  const setExercise = useSessionStore((s) => s.setExercise);
  const exercises = useSessionStore((s) => s.exercises);
  const exercise = useSessionStore((s) => s.exercise);

  useEffect(() => {
    // Kick off the exercise catalog fetch as early as possible (while
    // waiting for the phone to connect) so it's ready by the time the
    // user reaches the exercise picker.
    loadExercises();
    return () => {
      resetSession();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // If the user arrived via a report's "Try it" link (/session?exercise=<id>),
    // preselect that exercise once the catalog has loaded.
    if (!preselectedExerciseId) return;
    if (exercises.some((e) => e.id === preselectedExerciseId)) {
      setExercise(preselectedExerciseId);
    }
  }, [preselectedExerciseId, exercises, setExercise]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center gap-6 p-6 py-10">
      <div className="flex w-full max-w-3xl items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      {!remoteStream || status !== "connected" ? (
        <div className="flex flex-col items-center gap-6">
          <QrDisplay peerId={peerId} />
          <p className="text-sm text-muted-foreground">
            {status === "waiting_for_peer" && "Waiting for your phone to connect..."}
            {status === "connecting" && "Connecting..."}
          </p>
        </div>
      ) : (
        <div className="flex w-full max-w-6xl flex-1 gap-6 portrait:flex-col landscape:flex-row landscape:items-start">
          <div className="flex flex-col items-center gap-4 landscape:w-72 landscape:shrink-0 landscape:items-stretch">
            {!isSessionActive && (
              <div className="flex flex-col items-center gap-4 landscape:items-stretch">
                <ExerciseSelector />
                <Button size="lg" onClick={startSession}>
                  Start Tracking
                </Button>
              </div>
            )}
            <RepCounterHud />
            {exercise?.tutorialMediaUrl && (
              <div className="w-full overflow-hidden rounded-xl border">
                {exercise.tutorialMediaType === "video" ? (
                  <video src={exercise.tutorialMediaUrl} autoPlay loop muted playsInline className="w-full" />
                ) : (
                  <img src={exercise.tutorialMediaUrl} alt={`${exercise.name} tutorial`} className="w-full" />
                )}
              </div>
            )}
            {isSessionActive && <FinishSessionButton />}
          </div>

          <div className="flex flex-1 items-start justify-center">
            <VideoCanvas stream={remoteStream} />
          </div>
        </div>
      )}
    </main>
  );
}
