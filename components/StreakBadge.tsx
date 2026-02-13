"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function StreakBadge({
  currentDays,
  longestDays,
}: {
  currentDays: number;
  longestDays: number;
}) {
  if (currentDays === 0 && longestDays === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className="text-xs gap-1">
          {currentDays > 0 ? `${currentDays}日連続` : "0日連続"}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>現在のストリーク: {currentDays}日</p>
        <p>最長ストリーク: {longestDays}日</p>
      </TooltipContent>
    </Tooltip>
  );
}
