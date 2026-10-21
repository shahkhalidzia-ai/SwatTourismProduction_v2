/**
 * Utility for calculating current week dates and labels for hotel availability grids
 */

export interface WeekDayColumn {
  dateStr: string;      // "2026-10-20"
  dayName: string;      // "Tue"
  dayNum: number;       // 20
  monthName: string;    // "Oct"
  label: string;        // "Tue 20"
  fullLabel: string;    // "Tue, Oct 20"
  isToday: boolean;
}

/**
 * Returns the dates for the current week starting on Monday.
 * @param offsetWeeks 0 for current week, 1 for next week, -1 for previous week, etc.
 * @param count Number of days to return (default 7: Mon-Sun)
 */
export function getCurrentWeekDays(offsetWeeks: number = 0, count: number = 7): WeekDayColumn[] {
  const now = new Date();
  const todayStr = toLocalDateString(now);

  // Day of week: 0 (Sun) to 6 (Sat). We want Monday to be day 0 of the week.
  const dayOfWeek = now.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7; // Sunday (0) -> 6, Monday (1) -> 0, Tuesday (2) -> 1, etc.

  // Monday of the target week
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday + (offsetWeeks * 7));

  const days: WeekDayColumn[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const dateStr = toLocalDateString(d);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString('en-US', { month: 'short' });

    days.push({
      dateStr,
      dayName,
      dayNum,
      monthName,
      label: `${dayName} ${dayNum}`,
      fullLabel: `${dayName}, ${monthName} ${dayNum}`,
      isToday: dateStr === todayStr,
    });
  }

  return days;
}

/**
 * Converts a Date to YYYY-MM-DD using local time
 */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if a date falls within a stay date range
 */
export function isDateInStayRange(dateStr: string, stayDatesStr?: string): boolean {
  if (!stayDatesStr || !dateStr) return false;

  // Handles formats like "2026-10-20 – 2026-10-23" or "2026-10-20 to 2026-10-23"
  const parts = stayDatesStr.split(/[–—to]+/).map((s) => s.trim());
  if (parts.length === 1) {
    return dateStr === parts[0];
  }
  if (parts.length >= 2) {
    const start = parts[0];
    const end = parts[1];
    return dateStr >= start && dateStr <= end;
  }
  return false;
}
