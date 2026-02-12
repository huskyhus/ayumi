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
};

export async function GET() {
  const habits = await prisma.habit.findMany({
    where: { userId: HARDCODED_USER_ID },
    include: { events: { orderBy: { occurredAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

  const result: DashboardHabit[] = habits.map((habit) => {
    const configParsed = HabitConfigSchema.safeParse(habit.config);

    let stats: HabitStats | null = null;
    if (configParsed.success) {
      const events = habit.events.map((e) => ({
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
    };
  });

  return NextResponse.json(result);
}
