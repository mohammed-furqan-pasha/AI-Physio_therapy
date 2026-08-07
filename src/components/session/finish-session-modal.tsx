"use client";

import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ConfettiBurst } from "@/components/session/confetti-burst";
import { FinishSessionResult } from "@/types/gamification";
import { Flame, Trophy, Zap } from "lucide-react";

interface FinishSessionModalProps {
  result: FinishSessionResult;
  onClose: () => void;
}

export function FinishSessionModal({ result, onClose }: FinishSessionModalProps) {
  const router = useRouter();
  const { session, profile, leveledUp, streakExtended } = result;
  const celebrate = leveledUp || streakExtended;

  function handleContinue() {
    onClose();
    router.push("/dashboard");
  }

  return (
    <>
      {celebrate && <ConfettiBurst />}
      <Dialog open onOpenChange={(open) => !open && handleContinue()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session complete 🎉</DialogTitle>
            <DialogDescription>Nice work — here&apos;s how it went.</DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <StatBlock label="Reps completed" value={session.totalReps.toString()} />
            <StatBlock
              label="XP earned"
              value={`+${session.xpEarned}`}
              icon={<Zap className="h-4 w-4 text-amber-500" />}
            />
            <StatBlock
              label="Current streak"
              value={`${profile.currentStreak} day${profile.currentStreak === 1 ? "" : "s"}`}
              icon={<Flame className="h-4 w-4 text-orange-500" />}
            />
            <StatBlock label="Total XP" value={profile.xpTotal.toString()} />
          </div>

          {leveledUp && (
            <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-800">
              <Trophy className="h-4 w-4" />
              Level up! You&apos;re now level {profile.level}.
            </div>
          )}

          {!leveledUp && streakExtended && (
            <div className="flex items-center gap-2 rounded-md border border-orange-300 bg-orange-50 p-3 text-sm font-medium text-orange-800">
              <Flame className="h-4 w-4" />
              Streak extended to {profile.currentStreak} days — keep it going!
            </div>
          )}

          <Button size="lg" className="w-full" onClick={handleContinue}>
            Continue
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function StatBlock({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="flex items-center gap-1.5">
        {icon}
        <p className="text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}
