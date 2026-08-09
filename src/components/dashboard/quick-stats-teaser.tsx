"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProfile } from "@/lib/supabase/profile";
import { levelProgress } from "@/lib/gamification/xp";
import { ProfileStats } from "@/types/gamification";
import { Flame, Trophy, ChevronRight } from "lucide-react";

export function QuickStatsTeaser() {
  const [profile, setProfile] = useState<ProfileStats | null>(null);

  useEffect(() => {
    fetchProfile().then(setProfile);
  }, []);

  if (!profile) return null;

  const { level } = levelProgress(profile.xpTotal);

  return (
    <Link
      href="/profile"
      className="flex w-full max-w-3xl items-center justify-between rounded-2xl border border-white/15 bg-white/10 px-5 py-3 backdrop-blur-xl transition-colors hover:bg-white/15"
    >
      <div className="flex items-center gap-5 text-sm">
        <span className="flex items-center gap-1.5">
          <Trophy className="h-4 w-4 text-amber-400" />
          Level {level}
        </span>
        <span className="flex items-center gap-1.5">
          <Flame className="h-4 w-4 text-orange-400" />
          {profile.currentStreak} day streak
        </span>
        <span className="hidden text-muted-foreground sm:inline">{profile.xpTotal} XP total</span>
      </div>
      <span className="flex items-center gap-1 text-xs text-teal-300">
        View profile <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </Link>
  );
}
