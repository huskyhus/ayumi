export type PeriodType = "WEEK" | "MONTH";

export type Period = {
  type: PeriodType;
  key: string;
  start: Date;
  end: Date;
};

/**
 * Returns the ISO 8601 week number and ISO year for a given date.
 * ISO weeks start on Monday.
 */
export function getISOWeek(date: Date): { isoYear: number; isoWeek: number } {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  // Set to nearest Thursday: current date + 4 - current day number (Mon=1, Sun=7)
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const isoWeek = Math.ceil(
    ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
  );
  return { isoYear: d.getUTCFullYear(), isoWeek };
}

/**
 * Returns the ISO week Period containing the given date.
 * Week starts Monday 00:00:00 and ends Sunday 23:59:59.999.
 */
export function getWeekPeriod(date: Date): Period {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayOfWeek = d.getUTCDay() || 7; // Mon=1 ... Sun=7
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - (dayOfWeek - 1));
  monday.setUTCHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  const { isoYear, isoWeek } = getISOWeek(date);
  const key = `${isoYear}-W${String(isoWeek).padStart(2, "0")}`;

  return { type: "WEEK", key, start: monday, end: sunday };
}

/**
 * Returns the calendar month Period containing the given date.
 */
export function getMonthPeriod(date: Date): Period {
  const year = date.getFullYear();
  const month = date.getMonth();

  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

  const key = `${year}-${String(month + 1).padStart(2, "0")}`;

  return { type: "MONTH", key, start, end };
}

/**
 * Returns the Period of the given type containing the given date.
 */
export function getPeriod(date: Date, periodType: PeriodType): Period {
  return periodType === "WEEK" ? getWeekPeriod(date) : getMonthPeriod(date);
}

/**
 * Returns the current Period of the given type.
 */
export function getCurrentPeriod(periodType: PeriodType): Period {
  return getPeriod(new Date(), periodType);
}

/**
 * Generates an array of consecutive periods between startDate and endDate (inclusive).
 */
export function generatePeriodRange(
  startDate: Date,
  endDate: Date,
  periodType: PeriodType
): Period[] {
  const periods: Period[] = [];
  let current = getPeriod(startDate, periodType);

  while (current.start <= endDate) {
    periods.push(current);
    // Advance to the next period
    const nextStart = new Date(current.end.getTime() + 1);
    current = getPeriod(nextStart, periodType);
  }

  return periods;
}
