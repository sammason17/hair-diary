import { describe, it, expect } from '@jest/globals';
import { getDayOfWeek, format12Hour, calculateEndTime } from '../calendarUtils';

describe('Calendar Utility Functions', () => {
  describe('getDayOfWeek()', () => {
    it('should return "Sunday" for a Sunday date', () => {
      // March 15, 2026 is a Sunday
      expect(getDayOfWeek('2026-03-15')).toBe('Sunday');
    });

    it('should return "Monday" for a Monday date', () => {
      // March 16, 2026 is a Monday
      expect(getDayOfWeek('2026-03-16')).toBe('Monday');
    });

    it('should return "Tuesday" for a Tuesday date', () => {
      // March 17, 2026 is a Tuesday
      expect(getDayOfWeek('2026-03-17')).toBe('Tuesday');
    });

    it('should return "Wednesday" for a Wednesday date', () => {
      // March 18, 2026 is a Wednesday
      expect(getDayOfWeek('2026-03-18')).toBe('Wednesday');
    });

    it('should return "Thursday" for a Thursday date', () => {
      // March 12, 2026 is a Thursday
      expect(getDayOfWeek('2026-03-12')).toBe('Thursday');
    });

    it('should return "Friday" for a Friday date', () => {
      // March 13, 2026 is a Friday
      expect(getDayOfWeek('2026-03-13')).toBe('Friday');
    });

    it('should return "Saturday" for a Saturday date', () => {
      // March 14, 2026 is a Saturday
      expect(getDayOfWeek('2026-03-14')).toBe('Saturday');
    });

    it('should handle different date formats correctly', () => {
      // Test with single digit month/day
      expect(getDayOfWeek('2026-01-01')).toBe('Thursday');

      // Test with double digit month/day
      expect(getDayOfWeek('2026-12-25')).toBe('Friday');
    });

    it('should handle leap year dates', () => {
      // February 29, 2024 is a leap year date (Thursday)
      expect(getDayOfWeek('2024-02-29')).toBe('Thursday');
    });
  });

  describe('format12Hour()', () => {
    it('should convert midnight (00:00) to 12:00 AM', () => {
      expect(format12Hour('00:00')).toBe('12:00 AM');
    });

    it('should convert early morning times to AM', () => {
      expect(format12Hour('07:00')).toBe('7:00 AM');
      expect(format12Hour('09:30')).toBe('9:30 AM');
      expect(format12Hour('11:45')).toBe('11:45 AM');
    });

    it('should convert noon (12:00) to 12:00 PM', () => {
      expect(format12Hour('12:00')).toBe('12:00 PM');
    });

    it('should convert afternoon times to PM', () => {
      expect(format12Hour('13:00')).toBe('1:00 PM');
      expect(format12Hour('15:30')).toBe('3:30 PM');
      expect(format12Hour('18:45')).toBe('6:45 PM');
    });

    it('should convert evening times to PM', () => {
      expect(format12Hour('20:00')).toBe('8:00 PM');
      expect(format12Hour('23:59')).toBe('11:59 PM');
    });

    it('should handle 15-minute intervals correctly', () => {
      expect(format12Hour('10:00')).toBe('10:00 AM');
      expect(format12Hour('10:15')).toBe('10:15 AM');
      expect(format12Hour('10:30')).toBe('10:30 AM');
      expect(format12Hour('10:45')).toBe('10:45 AM');
    });

    it('should pad single-digit minutes with zero', () => {
      expect(format12Hour('09:05')).toBe('9:05 AM');
      expect(format12Hour('14:00')).toBe('2:00 PM');
    });
  });

  describe('calculateEndTime()', () => {
    it('should add 30 minutes by default', () => {
      expect(calculateEndTime('10:00')).toBe('10:30');
      expect(calculateEndTime('14:30')).toBe('15:00');
    });

    it('should add custom duration in minutes', () => {
      expect(calculateEndTime('10:00', 15)).toBe('10:15');
      expect(calculateEndTime('10:00', 45)).toBe('10:45');
      expect(calculateEndTime('10:00', 60)).toBe('11:00');
    });

    it('should handle time that crosses hour boundary', () => {
      expect(calculateEndTime('10:45', 30)).toBe('11:15');
      expect(calculateEndTime('09:50', 20)).toBe('10:10');
    });

    it('should handle time that crosses multiple hours', () => {
      expect(calculateEndTime('10:00', 90)).toBe('11:30');
      expect(calculateEndTime('08:30', 120)).toBe('10:30');
    });

    it('should pad hours and minutes with zeros', () => {
      expect(calculateEndTime('07:00', 30)).toBe('07:30');
      expect(calculateEndTime('09:05', 5)).toBe('09:10');
    });

    it('should handle end of day times', () => {
      expect(calculateEndTime('19:30', 30)).toBe('20:00');
      expect(calculateEndTime('20:00', 60)).toBe('21:00');
    });

    it('should handle times near midnight', () => {
      expect(calculateEndTime('23:30', 30)).toBe('24:00');
      expect(calculateEndTime('23:45', 30)).toBe('24:15');
    });

    it('should handle zero duration', () => {
      expect(calculateEndTime('10:00', 0)).toBe('10:00');
    });
  });
});
