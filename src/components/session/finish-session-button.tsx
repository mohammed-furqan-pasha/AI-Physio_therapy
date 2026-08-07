"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/store/session-store";
import { SessionSummaryPayload } from "@/types/session";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

/**
 * Per spec: this is the ONLY place in the app that writes to the database.
 * Everything during the live session lives purely in the Zustand store
 * (in-memory). Clicking this fires exactly one POST to /api/sessions.
 */
export function FinishSessionButton() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const exercise = useSessionStore((s) => s.exercise);
  const reps = useSessionStore((s) => s.reps);
  const maxAngleThisSession = useSessionStore((s) => s.maxAngleThisSession);
  const sessionStartedAt = useSessionStore((s) => s.sessionStartedAt);
  const formWarningsEncountered = useSessionStore((s) => s.formWarningsEncountered);
  const resetSession = useSessionStore((s) => s.resetSession);
  const isSessionActive = useSessionStore((s) => s.isSessionActive);

  async function handleFinish() {
    if (!sessionStartedAt) {
      resetSession();
      return;
    }

    setSaving(true);

    const durationSeconds = Math.round((Date.now() - sessionStartedAt) / 1000);

    const payload: SessionSummaryPayload = {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      totalReps: reps,
      durationSeconds,
      maxAngle: maxAngleThisSession,
      formWarningsEncountered: Array.from(formWarningsEncountered),
      completedAt: new Date().toISOString(),
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

      toast.success(`Session saved — ${reps} reps in ${durationSeconds}s`);
      resetSession();
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save session");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Button
      size="lg"
      variant="destructive"
      className="w-full max-w-3xl"
      onClick={handleFinish}
      disabled={saving || !isSessionActive}
    >
      {saving ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving...
        </>
      ) : (
        "Finish Session"
      )}
    </Button>
  );
}
