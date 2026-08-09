"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/store/session-store";
import { SessionSummaryPayload } from "@/types/session";
import { FinishSessionResult } from "@/types/gamification";
import { FinishSessionModal } from "@/components/session/finish-session-modal";
import { PainRatingDialog } from "@/components/session/pain-rating-dialog";
import { analyzePace } from "@/lib/gamification/pace";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Stage = "idle" | "rating" | "saving";

export function FinishSessionButton() {
  const [stage, setStage] = useState<Stage>("idle");
  const [result, setResult] = useState<FinishSessionResult | null>(null);

  const exercise = useSessionStore((s) => s.exercise);
  const reps = useSessionStore((s) => s.reps);
  const maxAngleThisSession = useSessionStore((s) => s.maxAngleThisSession);
  const sessionStartedAt = useSessionStore((s) => s.sessionStartedAt);
  const formWarningsEncountered = useSessionStore((s) => s.formWarningsEncountered);
  const repTimestamps = useSessionStore((s) => s.repTimestamps);
  const resetSession = useSessionStore((s) => s.resetSession);
  const isSessionActive = useSessionStore((s) => s.isSessionActive);

  function handleFinishClick() {
    if (!sessionStartedAt) {
      resetSession();
      return;
    }
    setStage("rating"); // ask for pain/RPE before saving anything
  }

  async function handleSubmitWithPain(painLevel: number) {
    setStage("saving");
    if (!sessionStartedAt) return;

    const durationSeconds = Math.round((Date.now() - sessionStartedAt) / 1000);
    const { repsPerMinute, paceCategory, setCount } = analyzePace(repTimestamps, durationSeconds);

    const payload: SessionSummaryPayload = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      totalReps: reps,
      durationSeconds,
      maxAngle: maxAngleThisSession,
      formWarningsEncountered: Array.from(formWarningsEncountered),
      completedAt: new Date().toISOString(),
      painLevel,
      setCount,
      repsPerMinute,
      paceCategory,
    };

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Failed to save session");
      }

      const data: FinishSessionResult = await res.json();
      setResult(data);
      setStage("idle");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save session");
      setStage("idle");
    }
  }

  return (
    <>
      <Button
        size="lg"
        variant="destructive"
        className="w-full max-w-3xl"
        onClick={handleFinishClick}
        disabled={stage !== "idle" || !isSessionActive}
      >
        {stage === "saving" ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Finish Session"
        )}
      </Button>

      <PainRatingDialog open={stage === "rating"} onSubmit={handleSubmitWithPain} />

      {result && (
        <FinishSessionModal
          result={result}
          onClose={() => {
            setResult(null);
            resetSession();
          }}
        />
      )}
    </>
  );
}
