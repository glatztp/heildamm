export interface DistributionResult {
  distribution: Record<string, number>;
  mostPopular: string;
  totalCount: number;
}

export function aggregateDistribution<T>(
  items: T[],
  keyExtractor: (item: T) => string,
): DistributionResult {
  const distribution: Record<string, number> = {};

  for (const item of items) {
    const key = keyExtractor(item);
    distribution[key] = (distribution[key] ?? 0) + 1;
  }

  let mostPopular = "N/A";
  let maxCount = 0;

  for (const [key, value] of Object.entries(distribution)) {
    if (value > maxCount) {
      maxCount = value;
      mostPopular = key;
    }
  }

  return {
    distribution,
    mostPopular,
    totalCount: items.length,
  };
}

export function getMostPopular(dist: Record<string, number>): string {
  let max = 0;
  let popular = "N/A";

  for (const [key, value] of Object.entries(dist)) {
    if (value > max) {
      max = value;
      popular = key;
    }
  }

  return popular;
}

export function getDistributionPercentages(
  dist: Record<string, number>,
  total: number,
): Record<string, number> {
  const percentages: Record<string, number> = {};

  for (const [key, value] of Object.entries(dist)) {
    percentages[key] = total > 0 ? Math.round((value / total) * 100) : 0;
  }

  return percentages;
}
