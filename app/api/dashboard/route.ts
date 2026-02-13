import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { HabitConfigSchema } from "@/lib/domain/habit/habitConfig";
import { calculateHabitStats, type HabitStats } from "@/lib/domain/habit/evaluate";
import { HARDCODED_USER_ID } from "@/lib/constants";

export type DashboardHabit = {
  id: string;
  name: string;
  type: string;
  config: unknown;
  createdAt: string;
  configError: boolean;
  stats: HabitStats | null;
  events: { id: string; value: unknown; occurredAt: string }[];
};

export async function GET() {
  const habits = await prisma.habit.findMany({
    where: { userId: HARDCODED_USER_ID },
    include: { events: { orderBy: { occurredAt: "desc" } } },
    orderBy: { createdAt: "asc" },
  });

  const result: DashboardHabit[] = habits.map((habit) => {
    const configParsed = HabitConfigSchema.safeParse(habit.config);

    let stats: HabitStats | null = null;
    if (configParsed.success) {
      const events = habit.events
        .slice()
        .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime())
        .map((e) => ({
          occurredAt: e.occurredAt,
          value: e.value as Record<string, unknown>,
        }));
      stats = calculateHabitStats(configParsed.data, events, habit.createdAt);
    }

    return {
      id: habit.id,
      name: habit.name,
      type: habit.type,
      config: habit.config,
      createdAt: habit.createdAt.toISOString(),
      configError: !configParsed.success,
      stats,
      events: habit.events.slice(0, 5).map((e) => ({
        id: e.id,
        value: e.value as Record<string, unknown>,
        occurredAt: e.occurredAt.toISOString(),
      })),
    };
  });

  const typeOrder: Record<string, number> = { DO: 0, AVOID: 1 };
  result.sort(
    (a, b) => (typeOrder[a.type] ?? 2) - (typeOrder[b.type] ?? 2)
  );

  return NextResponse.json(result);
}
