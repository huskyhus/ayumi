import { describe, it, expect } from "vitest";
import {
  getISOWeek,
  getWeekPeriod,
  getMonthPeriod,
  getPeriod,
  getCurrentPeriod,
  generatePeriodRange,
} from "@/lib/domain/habit/period";

// ─── getISOWeek ──────────────────────────────────────────────────────

describe("getISOWeek", () => {
  it("returns correct ISO week for a known date (2025-01-06 = W02)", () => {
    const { isoYear, isoWeek } = getISOWeek(new Date("2025-01-06"));
    expect(isoYear).toBe(2025);
    expect(isoWeek).toBe(2);
  });

  it("handles year boundary: 2024-12-30 belongs to ISO 2025-W01", () => {
    const { isoYear, isoWeek } = getISOWeek(new Date("2024-12-30"));
    expect(isoYear).toBe(2025);
    expect(isoWeek).toBe(1);
  });

  it("handles year boundary: 2025-12-29 belongs to ISO 2026-W01", () => {
    const { isoYear, isoWeek } = getISOWeek(new Date("2025-12-29"));
    expect(isoYear).toBe(2026);
    expect(isoWeek).toBe(1);
  });

  it("returns W01 for 2025-01-01 (Wednesday in W01)", () => {
    const { isoYear, isoWeek } = getISOWeek(new Date("2025-01-01"));
    expect(isoYear).toBe(2025);
    expect(isoWeek).toBe(1);
  });
});

// ─── getWeekPeriod ───────────────────────────────────────────────────

describe("getWeekPeriod", () => {
  it("returns Monday–Sunday for a mid-week date", () => {
    // 2025-02-12 is Wednesday
    const period = getWeekPeriod(new Date("2025-02-12"));
    expect(period.type).toBe("WEEK");
    expect(period.key).toBe("2025-W07");
    expect(period.start.getUTCDay()).toBe(1); // Monday
    expect(period.start.getUTCDate()).toBe(10);
    expect(period.end.getUTCDay()).toBe(0); // Sunday
    expect(period.end.getUTCDate()).toBe(16);
  });

  it("returns same period for Monday and Sunday of the same week", () => {
    const mon = getWeekPeriod(new Date("2025-02-10"));
    const sun = getWeekPeriod(new Date("2025-02-16"));
    expect(mon.key).toBe(sun.key);
    expect(mon.start.getTime()).toBe(sun.start.getTime());
  });

  it("start is 00:00:00.000 and end is 23:59:59.999", () => {
    const period = getWeekPeriod(new Date("2025-02-12"));
    expect(period.start.getUTCHours()).toBe(0);
    expect(period.start.getUTCMinutes()).toBe(0);
    expect(period.end.getUTCHours()).toBe(23);
    expect(period.end.getUTCMinutes()).toBe(59);
    expect(period.end.getUTCSeconds()).toBe(59);
    expect(period.end.getUTCMilliseconds()).toBe(999);
  });
});

// ─── getMonthPeriod ──────────────────────────────────────────────────

describe("getMonthPeriod", () => {
  it("returns correct month period for Feb 2025", () => {
    const period = getMonthPeriod(new Date("2025-02-15"));
    expect(period.type).toBe("MONTH");
    expect(period.key).toBe("2025-02");
    expect(period.start.getUTCDate()).toBe(1);
    expect(period.end.getUTCDate()).toBe(28); // 2025 is not a leap year
  });

  it("handles leap year (Feb 2024)", () => {
    const period = getMonthPeriod(new Date("2024-02-15"));
    expect(period.key).toBe("2024-02");
    expect(period.end.getUTCDate()).toBe(29);
  });

  it("handles December correctly", () => {
    const period = getMonthPeriod(new Date("2025-12-25"));
    expect(period.key).toBe("2025-12");
    expect(period.start.getUTCDate()).toBe(1);
    expect(period.end.getUTCDate()).toBe(31);
  });
});

// ─── getPeriod ───────────────────────────────────────────────────────

describe("getPeriod", () => {
  it("delegates to getWeekPeriod for WEEK type", () => {
    const period = getPeriod(new Date("2025-02-12"), "WEEK");
    expect(period.type).toBe("WEEK");
    expect(period.key).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("delegates to getMonthPeriod for MONTH type", () => {
    const period = getPeriod(new Date("2025-02-12"), "MONTH");
    expect(period.type).toBe("MONTH");
    expect(period.key).toMatch(/^\d{4}-\d{2}$/);
  });
});

// ─── getCurrentPeriod ────────────────────────────────────────────────

describe("getCurrentPeriod", () => {
  it("returns a period containing today", () => {
    const now = new Date();
    const period = getCurrentPeriod("WEEK");
    expect(period.start <= now).toBe(true);
    expect(period.end >= now).toBe(true);
  });
});

// ─── generatePeriodRange ─────────────────────────────────────────────

describe("generatePeriodRange", () => {
  it("generates correct number of weeks", () => {
    // 3 weeks: Feb 10–16, Feb 17–23, Feb 24–Mar 2
    const start = new Date("2025-02-12"); // mid-week Wed
    const end = new Date("2025-02-26");   // mid-week Wed, 2 weeks later
    const periods = generatePeriodRange(start, end, "WEEK");
    expect(periods.length).toBe(3);
    expect(periods[0].key).toBe("2025-W07");
    expect(periods[2].key).toBe("2025-W09");
  });

  it("generates correct number of months", () => {
    const start = new Date("2025-01-15");
    const end = new Date("2025-03-10");
    const periods = generatePeriodRange(start, end, "MONTH");
    expect(periods.length).toBe(3);
    expect(periods.map((p) => p.key)).toEqual(["2025-01", "2025-02", "2025-03"]);
  });

  it("returns single period when start and end are in same week", () => {
    const start = new Date("2025-02-10");
    const end = new Date("2025-02-14");
    const periods = generatePeriodRange(start, end, "WEEK");
    expect(periods.length).toBe(1);
  });

  it("returns empty array if start is after end", () => {
    const start = new Date("2025-03-01");
    const end = new Date("2025-02-01");
    const periods = generatePeriodRange(start, end, "WEEK");
    expect(periods.length).toBe(0);
  });

  it("all periods are contiguous with no gaps", () => {
    const start = new Date("2025-01-01");
    const end = new Date("2025-03-31");
    const periods = generatePeriodRange(start, end, "WEEK");
    for (let i = 1; i < periods.length; i++) {
      const gap = periods[i].start.getTime() - periods[i - 1].end.getTime();
      expect(gap).toBe(1); // 1ms gap (end is 23:59:59.999, next start is 00:00:00.000)
    }
  });
});
