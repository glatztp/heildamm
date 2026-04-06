import { roundToHundredths, roundToTenths } from "./rounding.js";

export function formatHours(hours: number): string {
  return `${roundToTenths(hours)}h`;
}

export function formatDays(days: number): string {
  return `${days} day${days !== 1 ? "s" : ""}`;
}

export function formatPercentage(value: number): string {
  return `${value}%`;
}

export function formatTimeDiff(
  days: number,
  hours: number,
  minutes: number,
): string {
  const parts: string[] = [];

  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);

  return parts.length > 0 ? parts.join(" ") : "0m";
}

export function formatFrequencyPerDay(frequency: number): string {
  return `${roundToHundredths(frequency)} per day`;
}

export function formatCommitFrequency(days: number): string {
  return `every ${roundToTenths(days)} days`;
}

export function formatSessionLength(hours: number): string {
  if (hours < 1) {
    return `${roundToHundredths(hours * 60)} min`;
  }
  return formatHours(hours);
}

export function formatTimePerCommit(hours: number): string {
  return formatHours(hours);
}

export function formatTrackedTime(hours: number): string {
  return formatHours(hours);
}

export function formatProjectName(projectPath: string): string {
  return projectPath.split("/").pop() || "project";
}
