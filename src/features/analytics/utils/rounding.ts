export function roundToDecimal(value: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function roundToHundredths(value: number): number {
  return roundToDecimal(value, 2);
}

export function roundToTenths(value: number): number {
  return roundToDecimal(value, 1);
}

export function roundToWhole(value: number): number {
  return Math.round(value);
}

export function roundPercent(value: number): number {
  return roundToWhole(value);
}

export function calculatePercentage(part: number, total: number): number {
  return total > 0 ? roundToHundredths((part / total) * 100) : 0;
}

export function calculateAverage(sum: number, count: number): number {
  return count > 0 ? roundToHundredths(sum / count) : 0;
}

export function calculateFrequency(count: number, days: number): number {
  return days > 0 ? roundToHundredths(count / days) : 0;
}
