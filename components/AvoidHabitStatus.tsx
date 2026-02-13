"use client";

import type { AvoidHabitStats } from "@/lib/domain/habit/evaluate";

export default function AvoidHabitStatus({ stats }: { stats: AvoidHabitStats }) {
  const { daysSinceLastOccurrence, currentPeriod } = stats;
  const clean = currentPeriod.achieved;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`inline-block h-2.5 w-2.5 rounded-full ${
            clean ? "bg-habit-avoid" : "bg-muted-foreground"
          }`}
        />
        <span className="text-muted-foreground">
          {clean ? "今週クリーン" : `今週 ${currentPeriod.occurrences} 回`}
        </span>
      </div>
      {daysSinceLastOccurrence !== null && (
        <p className="text-sm text-muted-foreground">
          最後の記録から{" "}
          <span className="font-medium text-foreground">
            {daysSinceLastOccurrence}
          </span>{" "}
          日経過
        </p>
      )}
    </div>
  );
}
