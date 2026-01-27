import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  getTodayDate,
  calculateDurationMinutes,
  isValidDuration,
  formatDuration,
  calculateOverlapMinutes,
  getDateRangeForDay,
  buildDailySummary,
} from "../../backend/utils.js";

describe("Utility Functions", () => {
  describe("getTodayDate", () => {
    it("should return date string in YYYY-MM-DD format", () => {
      const date = getTodayDate();
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should return today's date when time is after 4 AM", () => {
      const date = getTodayDate();
      const expectedDate = new Date().toISOString().split("T")[0];
      expect(date).toBe(expectedDate);
    });
  });

  describe("calculateDurationMinutes", () => {
    it("should calculate correct duration between two times", () => {
      const start = "2025-12-18T10:00:00Z";
      const end = "2025-12-18T10:30:00Z";
      const duration = calculateDurationMinutes(start, end);
      expect(duration).toBe(30);
    });

    it("should handle 1 hour duration", () => {
      const start = "2025-12-18T10:00:00Z";
      const end = "2025-12-18T11:00:00Z";
      const duration = calculateDurationMinutes(start, end);
      expect(duration).toBe(60);
    });

    it("should handle seconds correctly", () => {
      const start = "2025-12-18T10:00:00Z";
      const end = "2025-12-18T10:00:45Z";
      const duration = calculateDurationMinutes(start, end);
      expect(duration).toBe(0); // Less than 1 minute
    });
  });

  describe("isValidDuration", () => {
    it("should return true for duration >= 1 minute", () => {
      const start = "2025-12-18T10:00:00Z";
      const end = "2025-12-18T10:01:00Z";
      expect(isValidDuration(start, end)).toBe(true);
    });

    it("should return false for duration < 1 minute", () => {
      const start = "2025-12-18T10:00:00Z";
      const end = "2025-12-18T10:00:45Z";
      expect(isValidDuration(start, end)).toBe(false);
    });

    it("should return false for zero duration", () => {
      const start = "2025-12-18T10:00:00Z";
      const end = "2025-12-18T10:00:00Z";
      expect(isValidDuration(start, end)).toBe(false);
    });
  });

  describe("formatDuration", () => {
    it("should format 0 minutes as 00:00", () => {
      expect(formatDuration(0)).toBe("00:00");
    });

    it("should format 30 minutes as 00:30", () => {
      expect(formatDuration(30)).toBe("00:30");
    });

    it("should format 60 minutes as 01:00", () => {
      expect(formatDuration(60)).toBe("01:00");
    });

    it("should format 90 minutes as 01:30", () => {
      expect(formatDuration(90)).toBe("01:30");
    });

    it("should format 120 minutes as 02:00", () => {
      expect(formatDuration(120)).toBe("02:00");
    });

    it("should handle null/undefined", () => {
      expect(formatDuration(null)).toBe("00:00");
      expect(formatDuration(undefined)).toBe("00:00");
    });
  });

  describe("calculateOverlapMinutes", () => {
    it("should return overlap minutes within a range", () => {
      const rangeStart = new Date("2026-01-15T04:00:00");
      const rangeEnd = new Date("2026-01-16T04:00:00");
      const start = new Date("2026-01-15T02:00:00");
      const end = new Date("2026-01-15T06:00:00");
      expect(calculateOverlapMinutes(start, end, rangeStart, rangeEnd)).toBe(
        120
      );
    });

    it("should return 0 for non-overlapping ranges", () => {
      const rangeStart = new Date("2026-01-15T04:00:00");
      const rangeEnd = new Date("2026-01-16T04:00:00");
      const start = new Date("2026-01-16T05:00:00");
      const end = new Date("2026-01-16T06:00:00");
      expect(calculateOverlapMinutes(start, end, rangeStart, rangeEnd)).toBe(0);
    });
  });

  describe("buildDailySummary", () => {
    it("should group tasks and projects for the selected day", () => {
      const dayRange = getDateRangeForDay("2026-01-15", 4);

      const entries = [
        {
          id: 1,
          task_id: 10,
          task_name: "Task One",
          start_time: new Date(
            dayRange.start.getTime() + 60 * 60 * 1000
          ).toISOString(),
          end_time: new Date(
            dayRange.start.getTime() + 3 * 60 * 60 * 1000
          ).toISOString(),
          project_ids: "2",
        },
        {
          id: 2,
          task_id: 11,
          task_name: "Task Two",
          start_time: new Date(
            dayRange.start.getTime() - 2 * 60 * 60 * 1000
          ).toISOString(),
          end_time: new Date(
            dayRange.start.getTime() + 2 * 60 * 60 * 1000
          ).toISOString(),
          project_ids: null,
        },
        {
          id: 3,
          task_id: 10,
          task_name: "Task One",
          start_time: new Date(
            dayRange.start.getTime() + 4 * 60 * 60 * 1000
          ).toISOString(),
          end_time: new Date(
            dayRange.start.getTime() + 5 * 60 * 60 * 1000
          ).toISOString(),
          project_ids: "2,3",
        },
      ];

      const projects = [
        { id: 1, name: "No Project", is_builtin: 1 },
        { id: 2, name: "Client A", is_builtin: 0 },
        { id: 3, name: "Internal", is_builtin: 0 },
      ];

      const summary = buildDailySummary({ entries, projects, dayRange });

      expect(summary.byTask).toEqual([
        { id: 10, name: "Task One", total_minutes: 180 },
        { id: 11, name: "Task Two", total_minutes: 120 },
      ]);

      expect(summary.byProject).toEqual([
        { id: 1, name: "No Project", total_minutes: 120, is_builtin: 1 },
        { id: 2, name: "Client A", total_minutes: 180, is_builtin: 0 },
        { id: 3, name: "Internal", total_minutes: 60, is_builtin: 0 },
      ]);

      expect(summary.byTaskPerProject).toEqual([
        {
          project_id: 1,
          project_name: "No Project",
          task_id: 11,
          task_name: "Task Two",
          total_minutes: 120,
          project_is_builtin: 1,
        },
        {
          project_id: 2,
          project_name: "Client A",
          task_id: 10,
          task_name: "Task One",
          total_minutes: 180,
          project_is_builtin: 0,
        },
        {
          project_id: 3,
          project_name: "Internal",
          task_id: 10,
          task_name: "Task One",
          total_minutes: 60,
          project_is_builtin: 0,
        },
      ]);
    });
  });
});
