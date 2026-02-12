import { z } from "zod";
import { DoHabitConfigSchema, AvoidHabitConfigSchema } from "./habitConfig";
import {
  type Period,
  type PeriodType,
  getPeriod,
  generatePeriodRange,
  getCurrentPeriod,
} from "./period";

// ─── Types ───────────────────────────────────────────────────────────

type DoConfig = z.infer<typeof DoHabitConfigSchema>;
type AvoidConfig = z.infer<typeof AvoidHabitConfigSchema>;

export type HabitEvent = {
  occurredAt: Date;
  value: Record<string, unknown>;
};

export type PeriodResult = {
  period: Period;
  achieved: boolean;
};

export type DoHabitPeriodResult = PeriodResult & {
  count: number;
  target: number;
};

export type AvoidHabitPeriodResult = PeriodResult & {
  occurrences: number;
};

export type DoHabitStats = {
  type: "DO";
  currentPeriod: DoHabitPeriodResult;
  achievementRate: number;
  currentStreak: number;
  longestStreak: number;
  periodHistory: DoHabitPeriodResult[];
};

export type AvoidHabitStats = {
  type: "AVOID";
  currentPeriod: AvoidHabitPeriodResult;
  achievementRate: number;
  currentStreak: number;
  longestStreak: number;
  daysSinceLastOccurrence: number | null;
  periodHistory: AvoidHabitPeriodResult[];
};

export type HabitStats = DoHabitStats | AvoidHabitStats;

// ─── Helpers ─────────────────────────────────────────────────────────

function eventsInPeriod(events: HabitEvent[], period: Period): HabitEvent[] {
  return events.filter(
    (e) => e.occurredAt >= period.start && e.occurredAt <= period.end
  );
}

function computeStreaks(periodResults: PeriodResult[]): {
  currentStreak: number;
  longestStreak: number;
} {
  let currentStreak = 0;
  let longestStreak = 0;
  let streak = 0;

  for (const result of periodResults) {
    if (result.achieved) {
      streak++;
      if (streak > longestStreak) longestStreak = streak;
    } else {
      streak = 0;
    }
  }

  // Current streak: count backward from the last period
  currentStreak = 0;
  for (let i = periodResults.length - 1; i >= 0; i--) {
    if (periodResults[i].achieved) {
      currentStreak++;
    } else {
      break;
    }
  }

  return { currentStreak, longestStreak };
}

// ─── Do Habit ────────────────────────────────────────────────────────

export function evaluateDoHabitPeriod(
  config: DoConfig,
  events: HabitEvent[],
  period: Period
): DoHabitPeriodResult {
  const periodEvents = eventsInPeriod(events, period);
  const count = periodEvents.reduce((sum, e) => {
    const amount =
      typeof (e.value as { amount?: number }).amount === "number"
        ? (e.value as { amount: number }).amount
        : 1;
    return sum + amount;
  }, 0);

  return {
    period,
    count,
    target: config.target,
    achieved: count >= config.target,
  };
}

export function calculateDoHabitStats(
  config: DoConfig,
  events: HabitEvent[],
  habitCreatedAt: Date
): DoHabitStats {
  const periodType: PeriodType = config.period;
  const now = new Date();
  const current = getCurrentPeriod(periodType);
  const allPeriods = generatePeriodRange(habitCreatedAt, now, periodType);

  const periodHistory = allPeriods.map((p) =>
    evaluateDoHabitPeriod(config, events, p)
  );

  const completedPeriods = periodHistory.filter(
    (p) => p.period.key !== current.key
  );
  const achievedCount = completedPeriods.filter((p) => p.achieved).length;
  const achievementRate =
    completedPeriods.length > 0 ? achievedCount / completedPeriods.length : 0;

  const { currentStreak, longestStreak } = computeStreaks(periodHistory);

  const currentPeriod =
    periodHistory.find((p) => p.period.key === current.key) ??
    evaluateDoHabitPeriod(config, events, current);

  return {
    type: "DO",
    currentPeriod,
    achievementRate,
    currentStreak,
    longestStreak,
    periodHistory,
  };
}

// ─── Avoid Habit ─────────────────────────────────────────────────────

export function evaluateAvoidHabitPeriod(
  config: AvoidConfig,
  events: HabitEvent[],
  period: Period
): AvoidHabitPeriodResult {
  const periodEvents = eventsInPeriod(events, period);
  const occurrences = periodEvents.length;

  return {
    period,
    occurrences,
    achieved: occurrences <= config.threshold,
  };
}

export function calculateAvoidHabitStats(
  config: AvoidConfig,
  events: HabitEvent[],
  habitCreatedAt: Date
): AvoidHabitStats {
  const periodType: PeriodType = "WEEK";
  const now = new Date();
  const current = getCurrentPeriod(periodType);
  const allPeriods = generatePeriodRange(habitCreatedAt, now, periodType);

  const periodHistory = allPeriods.map((p) =>
    evaluateAvoidHabitPeriod(config, events, p)
  );

  const completedPeriods = periodHistory.filter(
    (p) => p.period.key !== current.key
  );
  const achievedCount = completedPeriods.filter((p) => p.achieved).length;
  const achievementRate =
    completedPeriods.length > 0 ? achievedCount / completedPeriods.length : 0;

  const { currentStreak, longestStreak } = computeStreaks(periodHistory);

  // Days since last occurrence
  let daysSinceLastOccurrence: number | null = null;
  if (events.length > 0) {
    const sorted = [...events].sort(
      (a, b) => b.occurredAt.getTime() - a.occurredAt.getTime()
    );
    const lastOccurrence = sorted[0].occurredAt;
    daysSinceLastOccurrence = Math.floor(
      (now.getTime() - lastOccurrence.getTime()) / 86400000
    );
  }

  const currentPeriod =
    periodHistory.find((p) => p.period.key === current.key) ??
    evaluateAvoidHabitPeriod(config, events, current);

  return {
    type: "AVOID",
    currentPeriod,
    achievementRate,
    currentStreak,
    longestStreak,
    daysSinceLastOccurrence,
    periodHistory,
  };
}

// ─── Unified Entry Point ─────────────────────────────────────────────

export function calculateHabitStats(
  config: { type: string } & Record<string, unknown>,
  events: HabitEvent[],
  habitCreatedAt: Date
): HabitStats {
  if (config.type === "DO") {
    const parsed = DoHabitConfigSchema.parse(config);
    return calculateDoHabitStats(parsed, events, habitCreatedAt);
  } else {
    const parsed = AvoidHabitConfigSchema.parse(config);
    return calculateAvoidHabitStats(parsed, events, habitCreatedAt);
  }
}
