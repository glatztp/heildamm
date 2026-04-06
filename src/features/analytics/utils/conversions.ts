export const MS_TO_HOURS = 1000 * 60 * 60;
export const MS_TO_MINUTES = 1000 * 60;
export const MS_TO_DAYS = 1000 * 60 * 60 * 24;

export function millisecondsToHours(ms: number): number {
  return ms / MS_TO_HOURS;
}

export function millisecondsToMinutes(ms: number): number {
  return ms / MS_TO_MINUTES;
}

export function millisecondsToSeconds(ms: number): number {
  return ms / 1000;
}

export function millisecondsToTimeDiff(ms: number): {
  days: number;
  hours: number;
  minutes: number;
} {
  const days = Math.floor(ms / MS_TO_DAYS);
  const remainingAfterDays = ms % MS_TO_DAYS;

  const hours = Math.floor(remainingAfterDays / MS_TO_HOURS);
  const remainingAfterHours = remainingAfterDays % MS_TO_HOURS;

  const minutes = Math.floor(remainingAfterHours / MS_TO_MINUTES);

  return { days, hours, minutes };
}

export function timeDiffToTotalHours(
  days: number,
  hours: number,
  minutes: number,
): number {
  return days * 24 + hours + minutes / 60;
}

export function hoursToMS(hours: number): number {
  return hours * MS_TO_HOURS;
}

export function daysToMS(days: number): number {
  return days * MS_TO_DAYS;
}
