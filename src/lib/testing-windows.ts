import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  format,
} from "date-fns";
import { Frequency } from "@/types/equipment";

export interface TestingWindow {
  start: Date;
  end: Date;
  id: string;
}

export function getTestingWindow(frequency: Frequency, date: Date): TestingWindow {
  switch (frequency) {
    case "WEEKLY":
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }),
        end: endOfWeek(date, { weekStartsOn: 1 }),
        id: format(date, "RRRR-'W'II"), // ISO week year and week number
      };
    case "MONTHLY":
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
        id: format(date, "yyyy-MM"),
      };
    case "QUARTERLY":
      return {
        start: startOfQuarter(date),
        end: endOfQuarter(date),
        id: format(date, "yyyy-'Q'q"),
      };
    case "ANNUAL":
      return {
        start: startOfYear(date),
        end: endOfYear(date),
        id: format(date, "yyyy"),
      };
    default:
      throw new Error(`Invalid frequency: ${frequency}`);
  }
}

/**
 * Checks if a given timestamp falls within the testing window for a frequency and reference date.
 */
export function isWithinWindow(timestamp: Date, frequency: Frequency, referenceDate: Date): boolean {
  const window = getTestingWindow(frequency, referenceDate);
  return timestamp >= window.start && timestamp <= window.end;
}
