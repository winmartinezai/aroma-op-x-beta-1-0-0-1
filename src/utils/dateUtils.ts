export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  // Ensure Monday is start of week
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getEndOfWeek = (date: Date): Date => {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const getStartOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getEndOfMonth = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
};

export const isWithinRange = (dateStr: string, start: Date, end: Date): boolean => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const checkDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  return checkDate >= s && checkDate <= e;
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
};

export const formatDateRange = (start: Date, end: Date): string => {
  const sMonth = start.toLocaleDateString('en-US', { month: 'short' });
  const sDay = start.getDate();
  const eMonth = end.toLocaleDateString('en-US', { month: 'short' });
  const eDay = end.getDate();
  const year = end.getFullYear();

  if (sMonth === eMonth) {
    return `${sMonth} ${sDay} - ${eDay}, ${year}`;
  }
  return `${sMonth} ${sDay} - ${eMonth} ${eDay}, ${year}`;
};

export const getMonthDays = (year: number, month: number) => {
  const date = new Date(year, month, 1);
  const days = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

export const getPayrollPeriod = (date: Date): { start: Date; end: Date } => {
  // Bi-weekly logic starting from a known anchor date
  // Anchor: Jan 1, 2024 (Monday)
  const anchor = new Date(2024, 0, 1);
  const diffTime = date.getTime() - anchor.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const periodsPassed = Math.floor(diffDays / 14);

  const start = new Date(anchor);
  start.setDate(anchor.getDate() + (periodsPassed * 14));
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 13);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};
