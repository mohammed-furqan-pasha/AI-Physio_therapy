"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Point {
  day: string;
  reps: number;
}

function last14Days(calendarDays: { date: string; totalReps: number }[]): Point[] {
  const byDate = new Map(calendarDays.map((d) => [d.date, d.totalReps]));
  const points: Point[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000);
    const iso = d.toISOString().slice(0, 10);
    points.push({ day: d.toLocaleDateString(undefined, { weekday: "short" }), reps: byDate.get(iso) ?? 0 });
  }
  return points;
}

export function WeeklyActivityChart() {
  const [data, setData] = useState<Point[] | null>(null);

  useEffect(() => {
    fetch("/api/calendar")
      .then((res) => res.json())
      .then((json) => setData(last14Days(json.days ?? [])))
      .catch(() => setData([]));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Last 14 days</CardTitle>
      </CardHeader>
      <CardContent className="h-56">
        {!data ? (
          <div className="h-full w-full animate-pulse rounded-md bg-muted" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={12} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "rgba(15,23,42,0.9)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 8,
                  color: "white",
                }}
              />
              <Bar dataKey="reps" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
