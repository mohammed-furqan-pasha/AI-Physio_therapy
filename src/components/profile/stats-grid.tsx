import { Card, CardContent } from "@/components/ui/card";
import { ProfileFullStats } from "@/types/profile-stats";
import { Activity, Clock, HeartPulse, Repeat } from "lucide-react";

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

export function StatsGrid({ stats }: { stats: ProfileFullStats }) {
  const items = [
    { icon: <Activity className="h-5 w-5 text-teal-400" />, value: stats.totalSessions.toString(), label: "Total sessions" },
    { icon: <Repeat className="h-5 w-5 text-teal-400" />, value: stats.totalReps.toString(), label: "Total reps" },
    { icon: <Clock className="h-5 w-5 text-teal-400" />, value: formatDuration(stats.totalDurationSeconds), label: "Time practiced" },
    {
      icon: <HeartPulse className="h-5 w-5 text-teal-400" />,
      value: stats.avgPainLevel !== null ? stats.avgPainLevel.toFixed(1) : "—",
      label: "Avg pain (0-10)",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex flex-col items-center gap-1 p-4 text-center">
            {item.icon}
            <p className="text-xl font-bold">{item.value}</p>
            <p className="text-xs text-muted-foreground">{item.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
