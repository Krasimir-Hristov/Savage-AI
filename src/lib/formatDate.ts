/**
 * Formats an ISO timestamp for display in the UI:
 * - null / empty → ''
 * - today        → "HH:MM" (local time)
 * - yesterday    → "Yesterday"
 * - older        → "Apr 19" (locale short date)
 */

const isSameDate = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();

  if (isSameDate(date, now)) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  if (isSameDate(date, yesterday)) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};
