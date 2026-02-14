import { describe, it, expect } from "vitest";
import {
  evaluateDoHabitPeriod,
  evaluateAvoidHabitPeriod,
  calculateDoHabitStats,
  calculateAvoidHabitStats,
  type HabitEvent,
} from "@/lib/domain/habit/evaluate";
import { getWeekPeriod, getMonthPeriod } from "@/lib/domain/habit/period";

// ─── Helpers ─────────────────────────────────────────────────────────

function makeEvent(date: string, amount = 1): HabitEvent {
  return {
    occurredAt: new Date(date),
    value: { amount },
  };
}

function makeAvoidEvent(date: string): HabitEvent {
  return {
    occurredAt: new Date(date),
    value: { value: 1 },
  };
}

// ─── evaluateDoHabitPeriod ───────────────────────────────────────────

describe("evaluateDoHabitPeriod", () => {
  const config = { type: "DO" as const, period: "WEEK" as const, target: 3 };

  it("counts events in period and checks against target", () => {
    const period = getWeekPeriod(new Date("2025-02-12")); // W07: Feb 10–16
    const events = [
      makeEvent("2025-02-10"),
      makeEvent("2025-02-12"),
      makeEvent("2025-02-14"),
    ];
    const result = evaluateDoHabitPeriod(config, events, period);
    expect(result.count).toBe(3);
    expect(result.target).toBe(3);
    expect(result.achieved).toBe(true);
  });

  it("sums amount values from events", () => {
    const period = getWeekPeriod(new Date("2025-02-12"));
    const events = [makeEvent("2025-02-11", 2), makeEvent("2025-02-13", 3)];
    const result = evaluateDoHabitPeriod(config, events, period);
    expect(result.count).toBe(5);
    expect(result.achieved).toBe(true);
  });

  it("excludes events outside the period", () => {
    const period = getWeekPeriod(new Date("2025-02-12")); // Feb 10–16
    const events = [
      makeEvent("2025-02-09"), // before
      makeEvent("2025-02-12"), // in period
      makeEvent("2025-02-17"), // after
    ];
    const result = evaluateDoHabitPeriod(config, events, period);
    expect(result.count).toBe(1);
    expect(result.achieved).toBe(false);
  });

  it("returns not achieved when count < target", () => {
    const period = getWeekPeriod(new Date("2025-02-12"));
    const events = [makeEvent("2025-02-11")];
    const result = evaluateDoHabitPeriod(config, events, period);
    expect(result.count).toBe(1);
    expect(result.achieved).toBe(false);
  });

  it("handles zero events", () => {
    const period = getWeekPeriod(new Date("2025-02-12"));
    const result = evaluateDoHabitPeriod(config, [], period);
    expect(result.count).toBe(0);
    expect(result.achieved).toBe(false);
  });

  it("works with MONTH period", () => {
    const monthConfig = { type: "DO" as const, period: "MONTH" as const, target: 5 };
    const period = getMonthPeriod(new Date("2025-02-15"));
    const events = Array.from({ length: 5 }, (_, i) =>
      makeEvent(`2025-02-${String(i + 1).padStart(2, "0")}`)
    );
    const result = evaluateDoHabitPeriod(monthConfig, events, period);
    expect(result.count).toBe(5);
    expect(result.achieved).toBe(true);
  });
});

// ─── evaluateAvoidHabitPeriod ────────────────────────────────────────

describe("evaluateAvoidHabitPeriod", () => {
  const config = { type: "AVOID" as const, threshold: 0 };

  it("achieves when no events in period (threshold=0)", () => {
    const period = getWeekPeriod(new Date("2025-02-12"));
    const result = evaluateAvoidHabitPeriod(config, [], period);
    expect(result.occurrences).toBe(0);
    expect(result.achieved).toBe(true);
  });

  it("fails when events exist (threshold=0)", () => {
    const period = getWeekPeriod(new Date("2025-02-12"));
    const events = [makeAvoidEvent("2025-02-12")];
    const result = evaluateAvoidHabitPeriod(config, events, period);
    expect(result.occurrences).toBe(1);
    expect(result.achieved).toBe(false);
  });

  it("respects threshold > 0", () => {
    const lenientConfig = { type: "AVOID" as const, threshold: 2 };
    const period = getWeekPeriod(new Date("2025-02-12"));
    const events = [makeAvoidEvent("2025-02-11"), makeAvoidEvent("2025-02-13")];
    const result = evaluateAvoidHabitPeriod(lenientConfig, events, period);
    expect(result.occurrences).toBe(2);
    expect(result.achieved).toBe(true); // 2 <= 2
  });

  it("excludes events outside the period", () => {
    const period = getWeekPeriod(new Date("2025-02-12")); // Feb 10–16
    const events = [
      makeAvoidEvent("2025-02-09"),
      makeAvoidEvent("2025-02-17"),
    ];
    const result = evaluateAvoidHabitPeriod(config, events, period);
    expect(result.occurrences).toBe(0);
    expect(result.achieved).toBe(true);
  });
});

// ─── calculateDoHabitStats ───────────────────────────────────────────

describe("calculateDoHabitStats", () => {
  const config = { type: "DO" as const, period: "WEEK" as const, target: 1 };

  it("computes achievementRate excluding current period", () => {
    // Habit created 4 weeks ago, achieved 2 out of 3 completed weeks
    const createdAt = new Date("2025-01-13"); // W03
    const events = [
      makeEvent("2025-01-14"), // W03: achieved
      // W04: no events → not achieved
      makeEvent("2025-01-28"), // W05: achieved
    ];
    const stats = calculateDoHabitStats(config, events, createdAt);
    expect(stats.type).toBe("DO");
    expect(stats.achievementRate).toBeGreaterThan(0);
    expect(stats.periodHistory.length).toBeGreaterThanOrEqual(3);
  });

  it("returns 0 achievementRate when no completed periods", () => {
    // Created this week, no completed periods yet
    const createdAt = new Date();
    const stats = calculateDoHabitStats(config, [], createdAt);
    expect(stats.achievementRate).toBe(0);
  });

  it("includes currentPeriod in result", () => {
    const createdAt = new Date();
    const stats = calculateDoHabitStats(config, [], createdAt);
    expect(stats.currentPeriod).toBeDefined();
    expect(stats.currentPeriod.period).toBeDefined();
  });

  it("streak days is 0 when no events", () => {
    const createdAt = new Date("2025-01-01");
    const stats = calculateDoHabitStats(config, [], createdAt);
    expect(stats.currentStreakDays).toBe(0);
    expect(stats.longestStreakDays).toBe(0);
  });
});

// ─── calculateAvoidHabitStats ────────────────────────────────────────

describe("calculateAvoidHabitStats", () => {
  const config = { type: "AVOID" as const, threshold: 0 };

  it("computes daysSinceLastOccurrence", () => {
    const createdAt = new Date("2025-01-01");
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const events = [makeAvoidEvent(threeDaysAgo.toISOString())];
    const stats = calculateAvoidHabitStats(config, events, createdAt);
    expect(stats.daysSinceLastOccurrence).toBe(3);
  });

  it("returns null daysSinceLastOccurrence when no events", () => {
    const createdAt = new Date("2025-01-01");
    const stats = calculateAvoidHabitStats(config, [], createdAt);
    expect(stats.daysSinceLastOccurrence).toBeNull();
  });

  it("streak includes all clean periods when no events ever", () => {
    const createdAt = new Date("2025-01-01");
    const stats = calculateAvoidHabitStats(config, [], createdAt);
    // All periods are achieved (0 occurrences <= 0 threshold)
    expect(stats.currentStreakDays).toBeGreaterThan(0);
    expect(stats.longestStreakDays).toBeGreaterThan(0);
    expect(stats.currentStreakDays).toBe(stats.longestStreakDays);
  });

  it("type is AVOID", () => {
    const createdAt = new Date("2025-01-01");
    const stats = calculateAvoidHabitStats(config, [], createdAt);
    expect(stats.type).toBe("AVOID");
  });

  it("achievementRate reflects completed periods", () => {
    const createdAt = new Date("2025-01-01");
    // No events means all periods are achieved
    const stats = calculateAvoidHabitStats(config, [], createdAt);
    expect(stats.achievementRate).toBe(1);
  });
});
