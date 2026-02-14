import prisma from "@/lib/prisma";
import { HARDCODED_USER_ID } from "@/lib/constants";
import { HabitConfigSchema } from "./habitConfig";
import { calculateHabitStats, type HabitStats } from "./evaluate";

// ─── Types ───────────────────────────────────────────────────────────

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
  events: DashboardHabitEvent[];
};

// ─── Service ─────────────────────────────────────────────────────────

const TYPE_ORDER: Record<string, number> = { DO: 0, AVOID: 1 };

export async function getDashboardData(): Promise<DashboardHabitData[]> {
  const habits = await prisma.habit.findMany({
    where: { userId: HARDCODED_USER_ID },
    include: { events: { orderBy: { occurredAt: "desc" } } },
    orderBy: { createdAt: "asc" },
  });

  const result: DashboardHabitData[] = habits.map((habit) => {
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

  result.sort(
    (a, b) => (TYPE_ORDER[a.type] ?? 2) - (TYPE_ORDER[b.type] ?? 2)
  );

  return result;
}
