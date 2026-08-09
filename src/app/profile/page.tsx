"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchProfile } from "@/lib/supabase/profile";
import { fetchProfileFullStats } from "@/lib/supabase/session-stats";
import { levelProgress } from "@/lib/gamification/xp";
import { ProfileStats, GuardianInfo } from "@/types/gamification";
import { ProfileFullStats } from "@/types/profile-stats";
import { ActivityHeatmap } from "@/components/profile/activity-heatmap";
import { StatsGrid } from "@/components/profile/stats-grid";
import { WeeklyActivityChart } from "@/components/profile/weekly-activity-chart";
import { ExerciseBreakdown } from "@/components/profile/exercise-breakdown";
import { PainRangeBreakdown } from "@/components/profile/pain-range-breakdown";
import { RecentSessionsList } from "@/components/profile/recent-sessions-list";
import { GuardianCareCard } from "@/components/profile/guardian-care-card";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Flame, Loader2, Trophy, Zap } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileStats | null>(null);
  const [stats, setStats] = useState<ProfileFullStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchProfile(), fetchProfileFullStats()]).then(([p, s]) => {
      setProfile(p);
      setStats(s);
      setLoading(false);
    });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 p-6 py-10">
      <div className="flex w-full max-w-3xl items-center justify-start">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Link>
        </Button>
      </div>

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : !profile ? (
        <p className="text-sm text-muted-foreground">Couldn&apos;t load your profile.</p>
      ) : (
        <div className="flex w-full max-w-3xl flex-col gap-6">
          <ProfileHeader profile={profile} />

          {stats && <StatsGrid stats={stats} />}

          <WeeklyActivityChart />

          {stats && <ExerciseBreakdown entries={stats.exerciseBreakdown} />}

          {stats && <PainRangeBreakdown ranges={stats.painRangeBreakdown} />}

          <GuardianCareCard
            info={{
              age: profile.age ?? null,
              guardianName: profile.guardianName ?? null,
              guardianRelation: profile.guardianRelation ?? null,
              guardianPhone: profile.guardianPhone ?? null,
              guardianEmail: profile.guardianEmail ?? null,
            }}
            onSaved={(info) => setProfile({ ...profile, ...info })}
          />

          {stats && <RecentSessionsList sessions={stats.recentSessions} />}

          <Card>
            <CardContent className="p-6">
              <p className="mb-4 text-base font-semibold">Activity — last 365 days</p>
              <ActivityHeatmap />
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}

function ProfileHeader({ profile }: { profile: ProfileStats }) {
  const { level, progress } = levelProgress(profile.xpTotal);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-6 w-6 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">Level {level}</p>
              <p className="text-xs text-muted-foreground">{Math.round(progress * 100)}% to level {level + 1}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Zap className="h-4 w-4 text-amber-500" />
            {profile.xpTotal} XP total
          </div>
        </div>

        <ProgressBar value={progress} />

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="flex items-center gap-2 rounded-md border p-3">
            <Flame className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-lg font-bold">{profile.currentStreak}</p>
              <p className="text-xs text-muted-foreground">Current streak</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-md border p-3">
            <Trophy className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-lg font-bold">{profile.longestStreak}</p>
              <p className="text-xs text-muted-foreground">Longest streak</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
