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
  currentStreakDays: number;
  longestStreakDays: number;
  periodHistory: DoHabitPeriodResult[];
};

export type AvoidHabitStats = {
  type: "AVOID";
  currentPeriod: AvoidHabitPeriodResult;
  achievementRate: number;
  currentStreakDays: number;
  longestStreakDays: number;
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

function daysBetween(start: Date, end: Date): number {
  return Math.max(
    0,
    Math.floor((end.getTime() - start.getTime()) / 86400000) + 1
  );
}

function computeStreakDays(periodResults: PeriodResult[]): {
  currentStreakDays: number;
  longestStreakDays: number;
} {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Build runs of consecutive achieved periods
  const runs: PeriodResult[][] = [];
  let currentRun: PeriodResult[] = [];

  for (const result of periodResults) {
    if (result.achieved) {
      currentRun.push(result);
    } else {
      if (currentRun.length > 0) {
        runs.push(currentRun);
        currentRun = [];
      }
    }
  }
  if (currentRun.length > 0) {
    runs.push(currentRun);
  }

  function runDays(run: PeriodResult[]): number {
    let total = 0;
    for (const r of run) {
      const isCurrentPeriod = today >= r.period.start && today <= r.period.end;
      const end = isCurrentPeriod ? today : r.period.end;
      total += daysBetween(r.period.start, end);
    }
    return total;
  }

  const longestStreakDays =
    runs.length > 0 ? Math.max(...runs.map(runDays)) : 0;

  // Current streak: the last run, only if it includes the most recent period
  let currentStreakDays = 0;
  if (runs.length > 0) {
    const lastRun = runs[runs.length - 1];
    const lastPeriod = lastRun[lastRun.length - 1].period;
    const lastInResults = periodResults[periodResults.length - 1].period;
    if (lastPeriod.key === lastInResults.key) {
      currentStreakDays = runDays(lastRun);
    }
  }

  return { currentStreakDays, longestStreakDays };
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

  const { currentStreakDays, longestStreakDays } =
    computeStreakDays(periodHistory);

  const currentPeriod =
    periodHistory.find((p) => p.period.key === current.key) ??
    evaluateDoHabitPeriod(config, events, current);

  return {
    type: "DO",
    currentPeriod,
    achievementRate,
    currentStreakDays,
    longestStreakDays,
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

  const { currentStreakDays, longestStreakDays } =
    computeStreakDays(periodHistory);

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
    currentStreakDays,
    longestStreakDays,
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
