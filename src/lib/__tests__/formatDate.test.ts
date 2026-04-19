import { describe, it, expect } from 'vitest';
import { formatDate } from '@/lib/formatDate';

describe('formatDate()', () => {
  it('returns empty string for null', () => {
    expect(formatDate(null)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(formatDate('')).toBe('');
  });

  it('formats a timestamp from today as HH:MM time', () => {
    const now = new Date();
    const result = formatDate(now.toISOString());
    // Accepts 24-hour ("14:05") and 12-hour ("02:05 PM") locale formats
    expect(result).toMatch(/^\d{1,2}:\d{2}(\s?(AM|PM))?$/i);
  });

  it('formats a timestamp from yesterday as "Yesterday"', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(formatDate(yesterday.toISOString())).toBe('Yesterday');
  });

  it('formats an older timestamp as a short locale date (e.g. "Jan 15")', () => {
    // Fixed past date — well outside today/yesterday window
    const old = new Date('2026-01-15T12:00:00Z');
    const result = formatDate(old.toISOString());
    expect(result).toContain('Jan');
    expect(result).toContain('15');
  });

  it('formats a date from two days ago as a short locale date', () => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const result = formatDate(twoDaysAgo.toISOString());
    expect(result).not.toBe('Yesterday');
    expect(result).not.toMatch(/^\d{2}:\d{2}$/);
  });
});
