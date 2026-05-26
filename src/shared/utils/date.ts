/**
 * Normalizes natural language date expressions to YYYY-MM-DD format.
 * Handles: "today", "tomorrow", "day after tomorrow",
 *          "next monday" through "next sunday",
 *          and passes through valid YYYY-MM-DD strings as-is.
 */
export function normalizeDate(input: string): string {
  const text = input.trim().toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  if (text === 'today') {
    return formatDate(today);
  }

  if (text === 'tomorrow' || text === 'tmrw' || text === 'tmr') {
    return formatDate(addDays(today, 1));
  }

  if (text === 'day after tomorrow') {
    return formatDate(addDays(today, 2));
  }

  if (text === 'yesterday') {
    return formatDate(addDays(today, -1));
  }

  // "next monday", "next tuesday", etc.
  const nextDayMatch = text.match(/^next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (nextDayMatch) {
    const targetDay = dayNameToNumber(nextDayMatch[1]);
    const currentDay = today.getDay();
    let daysAhead = targetDay - currentDay;
    if (daysAhead <= 0) daysAhead += 7;
    return formatDate(addDays(today, daysAhead));
  }

  // "this monday", "this friday", etc.
  const thisDayMatch = text.match(/^this\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (thisDayMatch) {
    const targetDay = dayNameToNumber(thisDayMatch[1]);
    const currentDay = today.getDay();
    let daysAhead = targetDay - currentDay;
    if (daysAhead <= 0) daysAhead += 7;
    return formatDate(addDays(today, daysAhead));
  }

  // "monday", "friday" — treat as next occurrence
  const dayOnlyMatch = text.match(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (dayOnlyMatch) {
    const targetDay = dayNameToNumber(dayOnlyMatch[1]);
    const currentDay = today.getDay();
    let daysAhead = targetDay - currentDay;
    if (daysAhead <= 0) daysAhead += 7;
    return formatDate(addDays(today, daysAhead));
  }

  // Fallback: return as-is (let the backend validate)
  return text;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dayNameToNumber(name: string): number {
  const days: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };
  return days[name] ?? 0;
}
