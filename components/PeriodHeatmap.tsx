"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { PeriodResult } from "@/lib/domain/habit/evaluate";

export default function PeriodHeatmap({
  periods,
}: {
  periods: PeriodResult[];
}) {
  // Show at most 12 recent periods
  const visible = periods.slice(-12);

  return (
    <div className="flex gap-1 flex-wrap">
      {visible.map((p) => (
        <Tooltip key={p.period.key}>
          <TooltipTrigger asChild>
            <div
              className={`h-4 w-4 rounded-sm ${
                p.achieved
                  ? "bg-emerald-400"
                  : "bg-muted"
              }`}
            />
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {p.period.key}: {p.achieved ? "達成" : "未達成"}
            </p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
