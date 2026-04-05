import { DailyStats, TimeEntry } from "./storage";
import { GitAnalyzer, GitCommit } from "./git-analyzer";

export interface TimeToCommitMetrics {
  commitHash: string;
  message: string;
  timestamp: number;
  timeSincePrevCommit: number; // seconds
  timeInvestedBeforeCommit: number; // seconds (time entries between prev commit and this commit)
  filesChanged: number;
  insertions: number;
  deletions: number;
  timePerFileChanged: number; // average time per file
  productivityScore: number; // lower is better (time / changes)
}

export interface PeriodProductivity {
  period: string; // "YYYY-MM-DD" or "YYYY-Www"
  totalTime: number; // seconds
  commits: number;
  avgTimePerCommit: number;
  productivityTrend: "high" | "medium" | "low";
  peakHourOfDay: number; // 0-23
}

export interface SoftwareArchaeology {
  period: string;
  commits: GitCommit[];
  timeEntries: TimeEntry[];
  metrics: TimeToCommitMetrics[];
  totalTimeInvested: number;
  totalCommits: number;
  averageTimePerCommit: number;
  mostProductiveDay: string;
  leastProductiveDay: string;
  commitVelocity: number; // commits per day
  costPerCommit: number; // seconds per commit
}

export class TimeCommitAnalyzer {
  private gitAnalyzer: GitAnalyzer;

  constructor(projectPath: string) {
    this.gitAnalyzer = new GitAnalyzer(projectPath);
  }

  /**
   * Analyze time-to-commit metrics for a period
   */
  analyzeTimeToCommit(
    allData: DailyStats[],
    days: number = 30,
  ): SoftwareArchaeology {
    const gitMetrics = this.gitAnalyzer.getCommitHistory(days);
    const allTimeEntries = allData.flatMap((d) => d.entries);

    const metricsPerCommit: TimeToCommitMetrics[] = [];

    for (let i = 0; i < gitMetrics.commits.length; i++) {
      const commit = gitMetrics.commits[i];
      const prevCommit = gitMetrics.commits[i + 1];

      // Time since previous commit
      const prevCommitTime = prevCommit
        ? prevCommit.timestamp
        : commit.timestamp - 24 * 60 * 60 * 1000;
      const timeSincePrevCommit = Math.round(
        (commit.timestamp - prevCommitTime) / 1000,
      );

      // Find time entries between prev commit and this commit
      const timeInvestedBeforeCommit = allTimeEntries
        .filter((entry) => {
          const entryTime = entry.timestamp;
          return entryTime >= prevCommitTime && entryTime <= commit.timestamp;
        })
        .reduce((sum, entry) => sum + entry.duration, 0);

      // Get commit stats
      const stats = this.gitAnalyzer.getCommitStats(commit.hash);

      // Calculate metrics
      const filesChanged = Math.max(stats.filesChanged, 1);
      const timePerFile = timeInvestedBeforeCommit / filesChanged;
      const changes = stats.insertions + stats.deletions;
      const productivityScore =
        changes > 0
          ? timeInvestedBeforeCommit / changes
          : timeInvestedBeforeCommit;

      metricsPerCommit.push({
        commitHash: commit.shortHash,
        message: commit.message,
        timestamp: commit.timestamp,
        timeSincePrevCommit,
        timeInvestedBeforeCommit,
        filesChanged: stats.filesChanged,
        insertions: stats.insertions,
        deletions: stats.deletions,
        timePerFileChanged: timePerFile,
        productivityScore,
      });
    }

    // Summary statistics
    const totalTimeInvested = allTimeEntries.reduce(
      (sum, e) => sum + e.duration,
      0,
    );
    const totalCommits = gitMetrics.totalCommits;
    const averageTimePerCommit =
      totalCommits > 0 ? totalTimeInvested / totalCommits : 0;

    // Find most and least productive days
    const timeByDay: Record<string, number> = {};
    allTimeEntries.forEach((entry) => {
      const day = new Date(entry.timestamp).toISOString().split("T")[0];
      timeByDay[day] = (timeByDay[day] || 0) + entry.duration;
    });

    const sortedDays = Object.entries(timeByDay).sort((a, b) => b[1] - a[1]);
    const mostProductiveDay =
      sortedDays.length > 0 ? sortedDays[0][0] : "unknown";
    const leastProductiveDay =
      sortedDays.length > 0 ? sortedDays[sortedDays.length - 1][0] : "unknown";

    const uniqueDays = Object.keys(timeByDay).length;
    const commitVelocity = uniqueDays > 0 ? totalCommits / uniqueDays : 0;
    const costPerCommit =
      totalCommits > 0 ? totalTimeInvested / totalCommits : 0;

    return {
      period: `${days} days`,
      commits: gitMetrics.commits,
      timeEntries: allTimeEntries,
      metrics: metricsPerCommit,
      totalTimeInvested,
      totalCommits,
      averageTimePerCommit,
      mostProductiveDay,
      leastProductiveDay,
      commitVelocity,
      costPerCommit,
    };
  }

  /**
   * Get daily productivity breakdown
   */
  getDailyProductivity(allData: DailyStats[]): PeriodProductivity[] {
    const gitMetrics = this.gitAnalyzer.getCommitHistory(30);
    const dailyMetrics: Record<string, PeriodProductivity> = {};

    // Initialize with time data
    allData.forEach((day) => {
      let totalTime = 0;
      const hours: Record<number, number> = {};

      day.entries.forEach((entry) => {
        totalTime += entry.duration;
        const hour = new Date(entry.timestamp).getHours();
        hours[hour] = (hours[hour] || 0) + entry.duration;
      });

      const peakHour = Object.entries(hours).sort((a, b) => b[1] - a[1])[0];

      dailyMetrics[day.date] = {
        period: day.date,
        totalTime,
        commits: 0,
        avgTimePerCommit: 0,
        productivityTrend: "medium",
        peakHourOfDay: peakHour ? parseInt(peakHour[0]) : 12,
      };
    });

    // Add commit data
    gitMetrics.commits.forEach((commit) => {
      const day = commit.dateStr;
      if (dailyMetrics[day]) {
        dailyMetrics[day].commits++;
      }
    });

    // Calculate productivity trends
    Object.values(dailyMetrics).forEach((day) => {
      const avgPerCommit =
        day.commits > 0 ? day.totalTime / day.commits : day.totalTime;
      day.avgTimePerCommit = avgPerCommit;

      // Score: low = good (commits without excessive time)
      const timePerChange =
        day.commits > 0 ? day.totalTime / day.commits : day.totalTime;
      day.productivityTrend =
        timePerChange < 1800 ? "high" : timePerChange < 5400 ? "medium" : "low";
    });

    return Object.values(dailyMetrics).sort(
      (a, b) => new Date(b.period).getTime() - new Date(a.period).getTime(),
    );
  }

  /**
   * Identify commits with unusual time ratios (opportunities for optimization)
   */
  getOptimizationOpportunities(
    allData: DailyStats[],
    threshold: number = 1.5, // 1.5x average time
  ): TimeToCommitMetrics[] {
    const analysis = this.analyzeTimeToCommit(allData);

    if (analysis.metrics.length === 0) return [];

    const avgTime = analysis.averageTimePerCommit;
    return analysis.metrics
      .filter((m) => m.timeInvestedBeforeCommit > avgTime * threshold)
      .sort((a, b) => b.timeInvestedBeforeCommit - a.timeInvestedBeforeCommit);
  }
}
