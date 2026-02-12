"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function StreakBadge({
  current,
  longest,
}: {
  current: number;
  longest: number;
}) {
  if (current === 0 && longest === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="secondary" className="text-xs gap-1">
          {current > 0 ? `${current} 連続` : "0 連続"}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>現在のストリーク: {current}</p>
        <p>最長ストリーク: {longest}</p>
      </TooltipContent>
    </Tooltip>
  );
}
