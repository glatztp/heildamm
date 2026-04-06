import { getTrackerData } from "./tracker-integration.js";
import { calculateGitMetrics, getTimeSinceLastCommit } from "./git-analyzer.js";
import {
  timeDiffToTotalHours,
  MS_TO_DAYS,
  roundToHundredths,
  roundToTenths,
  calculateAverage,
  EFFICIENCY_THRESHOLDS,
  SCORE_WEIGHTS,
  formatHours,
  formatFrequencyPerDay,
} from "./utils/index.js";

export interface TimeToCommitRatio {
  projectPath: string;
  totalTrackedHours: number;
  hoursSinceLastCommit: number;
  commitFrequencyDays: number;
  productivityScore: number;
  efficiency: "high" | "medium" | "low";
  insights: string[];
}

export interface ProductivityPattern {
  peakHourOfDay?: number;
  mostActiveDay?: string;
  averageSessionLength: number;
  longestWorkSession: number;
  commitsPerSession: number;
  estimatedTimePerCommit: number;
}

export interface ProductivityInsights {
  timeToCommitRatios: TimeToCommitRatio[];
  averageProductivityScore: number;
  patterns: ProductivityPattern;
  recommendations: string[];
  generatedAt: string;
}

export function calculateTimeToCommitRatio(
  projectPath: string,
): TimeToCommitRatio | null {
  try {
    const trackerData = getTrackerData(projectPath);
    const gitMetrics = calculateGitMetrics(projectPath);
    const timeSinceLastCommit = getTimeSinceLastCommit(projectPath);

    if (!trackerData || gitMetrics.totalCommits === 0) {
      return null;
    }

    const hoursSinceLastCommit = timeDiffToTotalHours(
      timeSinceLastCommit.days,
      timeSinceLastCommit.hours,
      timeSinceLastCommit.minutes,
    );

    const commitFrequencyMs =
      new Date(gitMetrics.lastCommitDate).getTime() -
      new Date(gitMetrics.firstCommitDate).getTime();
    const commitFrequencyDays = Math.max(
      1,
      commitFrequencyMs / MS_TO_DAYS / Math.max(1, gitMetrics.totalCommits - 1),
    );

    const timePerCommit =
      trackerData.totalTrackedTime / gitMetrics.totalCommits;
    const efficiency =
      timePerCommit < EFFICIENCY_THRESHOLDS.high
        ? "high"
        : timePerCommit < EFFICIENCY_THRESHOLDS.medium
          ? "medium"
          : "low";
    const efficiencyScore =
      efficiency === "high" ? 100 : efficiency === "medium" ? 70 : 40;

    const commitFrequencyScore =
      gitMetrics.commitsInLastMonth > 5
        ? 100
        : gitMetrics.commitsInLastMonth > 2
          ? 70
          : 40;

    const productivityScore = roundToTenths(
      efficiencyScore * SCORE_WEIGHTS.efficiency +
        commitFrequencyScore * SCORE_WEIGHTS.frequency,
    );

    const insights = generateInsights(
      trackerData.totalTrackedTime,
      gitMetrics,
      timePerCommit,
      efficiency,
    );

    return {
      projectPath,
      totalTrackedHours: roundToHundredths(trackerData.totalTrackedTime),
      hoursSinceLastCommit: roundToHundredths(hoursSinceLastCommit),
      commitFrequencyDays: roundToHundredths(commitFrequencyDays),
      productivityScore,
      efficiency,
      insights,
    };
  } catch {
    return null;
  }
}

function generateInsights(
  totalHours: number,
  gitMetrics: ReturnType<typeof calculateGitMetrics>,
  timePerCommit: number,
  efficiency: "high" | "medium" | "low",
): string[] {
  const insights: string[] = [];

  if (efficiency === "high") {
    insights.push(
      `✓ Excelente eficiência! ${formatHours(timePerCommit)} por commit`,
    );
  } else if (efficiency === "medium") {
    insights.push(
      `• Produtividade normal. ${formatHours(timePerCommit)} por commit em média`,
    );
  } else {
    insights.push(
      `⚠ Baixa eficiência detectada. Considere refatorar fluxo de trabalho`,
    );
  }

  const commitRate = gitMetrics.averageCommitFrequency;
  if (commitRate > 1) {
    insights.push(
      `✓ Commits frequentes (${formatFrequencyPerDay(commitRate)})`,
    );
  } else if (commitRate > 0.2) {
    insights.push(
      `• Ritmo moderado de commits (${formatFrequencyPerDay(commitRate)})`,
    );
  } else {
    insights.push(
      `⚠ Commits pouco frequentes (${formatFrequencyPerDay(commitRate)})`,
    );
  }

  if (gitMetrics.totalLinesAdded + gitMetrics.totalLinesDeleted > 0) {
    const ratio =
      gitMetrics.totalLinesAdded /
      (gitMetrics.totalLinesAdded + gitMetrics.totalLinesDeleted);
    if (ratio > 0.7) {
      insights.push(
        `✓ Código em crescimento (${roundToTenths(ratio * 100)}% adições)`,
      );
    } else {
      insights.push(
        `• Refatoração ativa (${roundToTenths((1 - ratio) * 100)}% deletions)`,
      );
    }
  }

  return insights;
}

export function analyzeProductivityPatterns(
  projectPath: string,
): ProductivityPattern | null {
  try {
    const trackerData = getTrackerData(projectPath);
    const gitMetrics = calculateGitMetrics(projectPath);

    if (!trackerData || gitMetrics.totalCommits === 0) {
      return null;
    }

    return {
      averageSessionLength: trackerData.averageSessionDuration,
      longestWorkSession: trackerData.longestSession,
      commitsPerSession: roundToHundredths(
        gitMetrics.totalCommits / trackerData.sessionsCount,
      ),
      estimatedTimePerCommit: roundToHundredths(
        trackerData.totalTrackedTime / gitMetrics.totalCommits,
      ),
    };
  } catch {
    return null;
  }
}

export function generateProductivityInsights(
  projectPaths: string[],
): ProductivityInsights {
  const ratios: TimeToCommitRatio[] = [];
  const scores: number[] = [];

  for (const path of projectPaths) {
    const ratio = calculateTimeToCommitRatio(path);
    if (ratio) {
      ratios.push(ratio);
      scores.push(ratio.productivityScore);
    }
  }

  const avgScore =
    scores.length > 0
      ? calculateAverage(
          scores.reduce((a, b) => a + b, 0),
          scores.length,
        )
      : 0;

  // Padrão agregado (usa primeiro projeto como referência)
  const firstProjectPattern =
    projectPaths.length > 0
      ? analyzeProductivityPatterns(projectPaths[0])
      : null;

  const recommendations: string[] = [];

  if (avgScore < 50) {
    recommendations.push("Considere revisar seu fluxo de trabalho");
    recommendations.push(
      "Aumente a frequência de commits para melhor rastreabilidade",
    );
  }

  if (avgScore > 80) {
    recommendations.push("Excelente produtividade! Continue assim");
    recommendations.push("Documenta seus padrões para comunicar ao time");
  }

  if (firstProjectPattern && firstProjectPattern.estimatedTimePerCommit > 8) {
    recommendations.push(
      "Commits grandes detectados - considere commits menores e mais frequentes",
    );
  }

  return {
    timeToCommitRatios: ratios,
    averageProductivityScore: avgScore,
    patterns: firstProjectPattern || {
      averageSessionLength: 0,
      longestWorkSession: 0,
      commitsPerSession: 0,
      estimatedTimePerCommit: 0,
    },
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}
