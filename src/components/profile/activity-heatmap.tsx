"use client";

import { useEffect, useState } from "react";
import { CalendarDay } from "@/types/gamification";
import { cn } from "@/lib/utils";

const WEEKS_TO_SHOW = 53;
const DAY_MS = 86_400_000;

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** 5-step shade scale based on reps that day, relative to the max day in range. */
function shadeClass(reps: number, maxReps: number): string {
  if (reps <= 0) return "bg-muted";
  if (maxReps <= 0) return "bg-primary/20";
  const ratio = reps / maxReps;
  if (ratio > 0.8) return "bg-primary";
  if (ratio > 0.5) return "bg-primary/70";
  if (ratio > 0.25) return "bg-primary/45";
  return "bg-primary/25";
}

export function ActivityHeatmap() {
  const [days, setDays] = useState<CalendarDay[] | null>(null);

  useEffect(() => {
    fetch("/api/calendar")
      .then((res) => res.json())
      .then((data) => setDays(data.days ?? []))
      .catch(() => setDays([]));
  }, []);

  if (!days) {
    return <div className="h-32 animate-pulse rounded-md bg-muted" />;
  }

  const byDate = new Map(days.map((d) => [d.date, d]));
  const maxReps = Math.max(0, ...days.map((d) => d.totalReps));

  // Build a 53-week x 7-day grid ending today, GitHub-style (columns = weeks).
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const totalDays = WEEKS_TO_SHOW * 7;
  const startDate = new Date(today.getTime() - (totalDays - 1) * DAY_MS);
  // Align start to the previous Sunday so columns line up as full weeks.
  startDate.setUTCDate(startDate.getUTCDate() - startDate.getUTCDay());

  const weeks: { date: string; reps: number }[][] = [];
  let cursor = new Date(startDate);

  for (let w = 0; w < WEEKS_TO_SHOW; w++) {
    const week: { date: string; reps: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const iso = toISODate(cursor);
      const entry = byDate.get(iso);
      week.push({ date: iso, reps: entry?.totalReps ?? 0 });
      cursor = new Date(cursor.getTime() + DAY_MS);
    }
    weeks.push(week);
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.reps} rep${day.reps === 1 ? "" : "s"}`}
                className={cn(
                  "h-3 w-3 rounded-sm",
                  shadeClass(day.reps, maxReps),
                  day.date > toISODate(today) && "invisible"
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
