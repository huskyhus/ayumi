import prisma from "@/lib/prisma";
import { HARDCODED_USER_ID } from "@/lib/constants";
import { HabitConfigSchema } from "@/lib/domain/habit/habitConfig";
import { calculateHabitStats, type HabitStats } from "@/lib/domain/habit/evaluate";
import DashboardClient from "@/components/DashboardClient";
import type { DashboardHabitData } from "@/components/HabitCard";

export default async function DashboardPage() {
  const habits = await prisma.habit.findMany({
    where: { userId: HARDCODED_USER_ID },
    include: { events: { orderBy: { occurredAt: "desc" } } },
    orderBy: { createdAt: "asc" },
  });

  const dashboardHabits: DashboardHabitData[] = habits.map((habit) => {
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
  dashboardHabits.sort(
    (a, b) => (typeOrder[a.type] ?? 2) - (typeOrder[b.type] ?? 2)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Ayumi</h1>
      <DashboardClient initialHabits={dashboardHabits} />
    </div>
  );
}
