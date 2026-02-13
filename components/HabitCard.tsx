"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import DoHabitProgress from "./DoHabitProgress";
import AvoidHabitStatus from "./AvoidHabitStatus";
import PeriodHeatmap from "./PeriodHeatmap";
import StreakBadge from "./StreakBadge";
import AddEventDialog from "./AddEventDialog";
import EditEventDialog from "./EditEventDialog";
import type {
  HabitStats,
  DoHabitStats,
  AvoidHabitStats,
} from "@/lib/domain/habit/evaluate";

export type DashboardHabitEvent = {
  id: string;
  value: Record<string, unknown>;
  occurredAt: string;
};

export type DashboardHabitData = {
  id: string;
  name: string;
  type: string;
  config: unknown;
  createdAt: string;
  configError: boolean;
  stats: HabitStats | null;
  events?: DashboardHabitEvent[];
};

type Props = {
  habit: DashboardHabitData;
  onDelete: (id: string) => void;
  onRefresh: () => void;
};

export default function HabitCard({ habit, onDelete, onRefresh }: Props) {
  async function handleDelete() {
    if (!confirm("この習慣を削除しますか？")) return;
    const res = await fetch(`/api/habits/${habit.id}`, { method: "DELETE" });
    if (res.ok) onDelete(habit.id);
  }

  const isDoHabit = habit.type === "DO";
  const stats = habit.stats;
  const borderColor = isDoHabit ? "border-l-habit-do" : "border-l-habit-avoid";

  const achievementPct = stats ? Math.round(stats.achievementRate * 100) : 0;
  const achievementColor =
    achievementPct >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : achievementPct >= 50
        ? "text-foreground"
        : "text-muted-foreground";

  return (
    <Card className={`border-l-4 ${borderColor}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{habit.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className={
                  isDoHabit
                    ? "bg-habit-do-muted text-habit-do"
                    : "bg-habit-avoid-muted text-habit-avoid"
                }
              >
                {isDoHabit ? "Do" : "Avoid"}
              </Badge>
              {stats && (
                <StreakBadge
                  currentDays={stats.currentStreakDays}
                  longestDays={stats.longestStreakDays}
                />
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <AddEventDialog
              habitId={habit.id}
              habitType={habit.type}
              onEventCreated={onRefresh}
            />
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              削除
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {habit.configError && (
          <p className="text-sm text-muted-foreground">
            設定が不正です。習慣を編集して設定を更新してください。
          </p>
        )}

        {stats && isDoHabit && (
          <DoHabitProgress
            result={(stats as DoHabitStats).currentPeriod}
            periodLabel={
              (habit.config as { period?: string })?.period === "MONTH"
                ? "今月"
                : "今週"
            }
          />
        )}

        {stats && !isDoHabit && (
          <AvoidHabitStatus stats={stats as AvoidHabitStats} />
        )}

        {stats && (
          <>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">達成率</span>
                <span className={`font-medium ${achievementColor}`}>
                  {achievementPct}%
                </span>
              </div>
              <Progress
                value={achievementPct}
                className={`h-1.5 ${
                  isDoHabit ? "[&>[data-slot=progress-indicator]]:bg-habit-do" : "[&>[data-slot=progress-indicator]]:bg-habit-avoid"
                }`}
              />
            </div>
            <PeriodHeatmap
              periods={stats.periodHistory}
              habitType={habit.type}
            />
          </>
        )}

        {habit.events && habit.events.length > 0 && (
          <div className="space-y-1 pt-1 border-t">
            <p className="text-xs text-muted-foreground font-medium">直近のイベント</p>
            {habit.events.map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between text-xs text-muted-foreground"
              >
                <span>
                  {new Date(evt.occurredAt).toLocaleDateString("ja-JP", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <div className="flex items-center gap-1">
                  <span>
                    {isDoHabit && typeof (evt.value as { amount?: number }).amount === "number"
                      ? `${(evt.value as { amount: number }).amount}回`
                      : "記録"}
                  </span>
                  <EditEventDialog
                    event={evt}
                    habitType={habit.type}
                    onUpdated={onRefresh}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
