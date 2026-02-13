"use client";

import { Progress } from "@/components/ui/progress";
import type { DoHabitPeriodResult } from "@/lib/domain/habit/evaluate";

export default function DoHabitProgress({
  result,
  periodLabel,
}: {
  result: DoHabitPeriodResult;
  periodLabel: string;
}) {
  const percentage = Math.min(
    Math.round((result.count / result.target) * 100),
    100
  );

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{periodLabel}</span>
        <span className="font-medium">
          {result.count}/{result.target} 回
        </span>
      </div>
      <Progress
        value={percentage}
        className="h-2 [&>[data-slot=progress-indicator]]:bg-habit-do"
      />
    </div>
  );
}
