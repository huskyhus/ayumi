"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DoHabitProgress from "./DoHabitProgress";
import AvoidHabitStatus from "./AvoidHabitStatus";
import PeriodHeatmap from "./PeriodHeatmap";
import StreakBadge from "./StreakBadge";
import AddEventDialog from "./AddEventDialog";
import type {
  HabitStats,
  DoHabitStats,
  AvoidHabitStats,
} from "@/lib/domain/habit/evaluate";

export type DashboardHabitData = {
  id: string;
  name: string;
  type: string;
  config: unknown;
  createdAt: string;
  configError: boolean;
  stats: HabitStats | null;
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

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">{habit.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isDoHabit ? "default" : "secondary"}>
                {isDoHabit ? "Do" : "Avoid"}
              </Badge>
              {stats && (
                <StreakBadge
                  current={stats.currentStreak}
                  longest={stats.longestStreak}
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
            <div className="text-xs text-muted-foreground">
              達成率: {Math.round(stats.achievementRate * 100)}%
            </div>
            <PeriodHeatmap periods={stats.periodHistory} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
