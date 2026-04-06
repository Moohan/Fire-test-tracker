import { describe, it, expect } from "vitest";
import { getTestingWindow, isWithinWindow } from "./testing-windows";

describe("testing-windows", () => {
  describe("WEEKLY", () => {
    it("should return the correct window for a Monday (start of week)", () => {
      const date = new Date("2024-04-01T12:00:00Z"); // Monday
      const window = getTestingWindow("WEEKLY", date);
      expect(window.start.toISOString()).toContain("2024-04-01T00:00:00");
      expect(window.end.toISOString()).toContain("2024-04-07T23:59:59");
    });

    it("should return the correct window for a Sunday (end of week)", () => {
      const date = new Date("2024-04-07T12:00:00Z"); // Sunday
      const window = getTestingWindow("WEEKLY", date);
      expect(window.start.toISOString()).toContain("2024-04-01T00:00:00");
      expect(window.end.toISOString()).toContain("2024-04-07T23:59:59");
    });
  });

  describe("MONTHLY", () => {
    it("should return the correct window for a month", () => {
      const date = new Date("2024-02-15T12:00:00Z"); // Feb (Leap Year)
      const window = getTestingWindow("MONTHLY", date);
      expect(window.start.toISOString()).toContain("2024-02-01T00:00:00");
      expect(window.end.toISOString()).toContain("2024-02-29T23:59:59");
    });
  });

  describe("QUARTERLY", () => {
    it("should return the correct window for Q1", () => {
      const date = new Date("2024-02-15T12:00:00Z");
      const window = getTestingWindow("QUARTERLY", date);
      expect(window.start.toISOString()).toContain("2024-01-01T00:00:00");
      expect(window.end.toISOString()).toContain("2024-03-31T23:59:59");
    });

    it("should return the correct window for Q4", () => {
      const date = new Date("2024-11-15T12:00:00Z");
      const window = getTestingWindow("QUARTERLY", date);
      expect(window.start.toISOString()).toContain("2024-10-01T00:00:00");
      expect(window.end.toISOString()).toContain("2024-12-31T23:59:59");
    });
  });

  describe("ANNUAL", () => {
    it("should return the correct window for a year", () => {
      const date = new Date("2024-06-15T12:00:00Z");
      const window = getTestingWindow("ANNUAL", date);
      expect(window.start.toISOString()).toContain("2024-01-01T00:00:00");
      expect(window.end.toISOString()).toContain("2024-12-31T23:59:59");
    });
  });

  describe("isWithinWindow", () => {
    it("should return true if timestamp is within the window", () => {
      const refDate = new Date("2024-04-01T12:00:00Z"); // Monday
      const testDate = new Date("2024-04-03T09:00:00Z"); // Wednesday
      expect(isWithinWindow(testDate, "WEEKLY", refDate)).toBe(true);
    });

    it("should return false if timestamp is outside the window", () => {
      const refDate = new Date("2024-04-01T12:00:00Z"); // Monday
      const testDate = new Date("2024-04-08T09:00:00Z"); // Next Monday
      expect(isWithinWindow(testDate, "WEEKLY", refDate)).toBe(false);
    });
  });
});
