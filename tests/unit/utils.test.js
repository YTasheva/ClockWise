import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getTodayDate, calculateDurationMinutes, isValidDuration, formatDuration } from '../../backend/utils.js';

describe('Utility Functions', () => {
  describe('getTodayDate', () => {
    it('should return date string in YYYY-MM-DD format', () => {
      const date = getTodayDate();
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return today\'s date when time is after 4 AM', () => {
      const date = getTodayDate();
      const expectedDate = new Date().toISOString().split('T')[0];
      expect(date).toBe(expectedDate);
    });
  });

  describe('calculateDurationMinutes', () => {
    it('should calculate correct duration between two times', () => {
      const start = '2025-12-18T10:00:00Z';
      const end = '2025-12-18T10:30:00Z';
      const duration = calculateDurationMinutes(start, end);
      expect(duration).toBe(30);
    });

    it('should handle 1 hour duration', () => {
      const start = '2025-12-18T10:00:00Z';
      const end = '2025-12-18T11:00:00Z';
      const duration = calculateDurationMinutes(start, end);
      expect(duration).toBe(60);
    });

    it('should handle seconds correctly', () => {
      const start = '2025-12-18T10:00:00Z';
      const end = '2025-12-18T10:00:45Z';
      const duration = calculateDurationMinutes(start, end);
      expect(duration).toBe(0); // Less than 1 minute
    });
  });

  describe('isValidDuration', () => {
    it('should return true for duration >= 1 minute', () => {
      const start = '2025-12-18T10:00:00Z';
      const end = '2025-12-18T10:01:00Z';
      expect(isValidDuration(start, end)).toBe(true);
    });

    it('should return false for duration < 1 minute', () => {
      const start = '2025-12-18T10:00:00Z';
      const end = '2025-12-18T10:00:45Z';
      expect(isValidDuration(start, end)).toBe(false);
    });

    it('should return false for zero duration', () => {
      const start = '2025-12-18T10:00:00Z';
      const end = '2025-12-18T10:00:00Z';
      expect(isValidDuration(start, end)).toBe(false);
    });
  });

  describe('formatDuration', () => {
    it('should format 0 minutes as 00:00', () => {
      expect(formatDuration(0)).toBe('00:00');
    });

    it('should format 30 minutes as 00:30', () => {
      expect(formatDuration(30)).toBe('00:30');
    });

    it('should format 60 minutes as 01:00', () => {
      expect(formatDuration(60)).toBe('01:00');
    });

    it('should format 90 minutes as 01:30', () => {
      expect(formatDuration(90)).toBe('01:30');
    });

    it('should format 120 minutes as 02:00', () => {
      expect(formatDuration(120)).toBe('02:00');
    });

    it('should handle null/undefined', () => {
      expect(formatDuration(null)).toBe('00:00');
      expect(formatDuration(undefined)).toBe('00:00');
    });
  });
});
