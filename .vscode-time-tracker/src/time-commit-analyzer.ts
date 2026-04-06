import { DailyStats, TimeEntry } from "./storage";
import { GitAnalyzer, GitCommit } from "./git-analyzer";
import { getLocalDateString } from "./constants";

export interface TimeToCommitMetrics {
  commitHash: string;
  message: string;
  timestamp: number;
  timeSincePrevCommit: number;
  timeInvestedBeforeCommit: number;
  filesChanged: number;
  insertions: number;
  deletions: number;
  timePerFileChanged: number;
  productivityScore: number;
}

export interface PeriodProductivity {
  period: string;
  totalTime: number;
  commits: number;
  avgTimePerCommit: number;
  productivityTrend: "high" | "medium" | "low";
  peakHourOfDay: number;
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
  commitVelocity: number;
  costPerCommit: number;
}

export interface EstimatedDayStats {
  date: string;
  estimatedSeconds: number;
  commits: number;
  changes: number;
  isEstimated: true;
  confidence: "high" | "medium" | "low";
}

export interface HistoricalEstimate {
  days: EstimatedDayStats[];
  totalEstimatedSeconds: number;
  calibratedSecondsPerLine: number;
  dataSource: "calibrated" | "default";
  firstCommitDate: string;
  lastCommitDate: string;
  totalCommitsAnalyzed: number;
}

export class TimeCommitAnalyzer {
  private gitAnalyzer: GitAnalyzer;

  private static readonly DEFAULT_SECONDS_PER_LINE = 120;
  private static readonly MAX_SESSION_SECONDS = 8 * 3600;
  private static readonly OFFHOURS_START = 22;
  private static readonly OFFHOURS_END = 6;

  constructor(projectPath: string) {
    this.gitAnalyzer = new GitAnalyzer(projectPath);
  }

  private calibrateFromRealData(allData: DailyStats[]): {
    secondsPerLine: number;
    confidence: number;
  } {
    if (allData.length === 0) {
      return {
        secondsPerLine: TimeCommitAnalyzer.DEFAULT_SECONDS_PER_LINE,
        confidence: 0,
      };
    }

    const allEntries = allData.flatMap((d) => d.entries);
    if (allEntries.length === 0) {
      return {
        secondsPerLine: TimeCommitAnalyzer.DEFAULT_SECONDS_PER_LINE,
        confidence: 0,
      };
    }

    const trackerStart = Math.min(...allEntries.map((e) => e.timestamp));
    const trackerEnd = Math.max(...allEntries.map((e) => e.timestamp));
    const trackerDays = Math.max(
      1,
      (trackerEnd - trackerStart) / (1000 * 60 * 60 * 24),
    );

    const realCommits = this.gitAnalyzer.getCommitsInRange(
      new Date(trackerStart),
      new Date(trackerEnd),
    );

    if (realCommits.length === 0) {
      return {
        secondsPerLine: TimeCommitAnalyzer.DEFAULT_SECONDS_PER_LINE,
        confidence: 0,
      };
    }

    let totalLines = 0;
    let totalSeconds = 0;

    for (const commit of realCommits) {
      const stats = this.gitAnalyzer.getCommitStats(commit.hash);
      totalLines += stats.insertions + stats.deletions;
    }

    totalSeconds = allEntries.reduce((s, e) => s + e.duration, 0);

    if (totalLines === 0) {
      return {
        secondsPerLine: TimeCommitAnalyzer.DEFAULT_SECONDS_PER_LINE,
        confidence: 0,
      };
    }

    const calibrated = totalSeconds / totalLines;

    const confidence = Math.min(1, trackerDays / 30);

    const blended =
      calibrated * confidence +
      TimeCommitAnalyzer.DEFAULT_SECONDS_PER_LINE * (1 - confidence);

    const clamped = Math.max(30, Math.min(600, blended));

    return { secondsPerLine: clamped, confidence };
  }

  private effectiveWorkingSeconds(fromMs: number, toMs: number): number {
    const totalSeconds = (toMs - fromMs) / 1000;

    if (totalSeconds < 600) return totalSeconds;

    let workingSeconds = 0;
    const step = 3600;
    let cursor = fromMs;

    while (cursor < toMs) {
      const hour = new Date(cursor).getHours();
      const isWorkingHour =
        hour >= TimeCommitAnalyzer.OFFHOURS_END &&
        hour < TimeCommitAnalyzer.OFFHOURS_START;

      const sliceEnd = Math.min(cursor + step * 1000, toMs);
      const sliceSecs = (sliceEnd - cursor) / 1000;

      if (isWorkingHour) {
        workingSeconds += sliceSecs;
      }

      cursor += step * 1000;
    }

    return Math.min(workingSeconds, TimeCommitAnalyzer.MAX_SESSION_SECONDS);
  }

  estimateHistoricalTime(
    allData: DailyStats[],
    limitDays: number = 0,
  ): HistoricalEstimate {
    const { secondsPerLine, confidence } = this.calibrateFromRealData(allData);
    const dataSource: "calibrated" | "default" =
      confidence > 0.2 ? "calibrated" : "default";

    const trackedDates = new Set(allData.map((d) => d.date));

    const allHistory = this.gitAnalyzer.getCommitHistory(
      limitDays > 0 ? limitDays : 36500,
    );

    if (allHistory.commits.length === 0) {
      return {
        days: [],
        totalEstimatedSeconds: 0,
        calibratedSecondsPerLine: secondsPerLine,
        dataSource,
        firstCommitDate: "—",
        lastCommitDate: "—",
        totalCommitsAnalyzed: 0,
      };
    }

    const commits = [...allHistory.commits].sort(
      (a, b) => a.timestamp - b.timestamp,
    );

    const dayMap: Record<
      string,
      { estimatedSeconds: number; commits: number; changes: number }
    > = {};

    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      const dateStr = commit.dateStr;

      if (trackedDates.has(dateStr)) continue;

      const stats = this.gitAnalyzer.getCommitStats(commit.hash);
      const changes = stats.insertions + stats.deletions;
      const filesChanged = Math.max(stats.filesChanged, 1);

      const estimatedByChanges =
        changes > 0
          ? changes * secondsPerLine
          : filesChanged * secondsPerLine * 10;

      // teto pelo tempo real disponível entre commits
      const prevCommit = commits[i - 1];
      const windowStart = prevCommit
        ? prevCommit.timestamp
        : commit.timestamp - 4 * 3600 * 1000; // assume 4h antes se for o primeiro

      const effectiveCap = this.effectiveWorkingSeconds(
        windowStart,
        commit.timestamp,
      );

      const estimated = Math.min(estimatedByChanges, effectiveCap);

      if (!dayMap[dateStr]) {
        dayMap[dateStr] = { estimatedSeconds: 0, commits: 0, changes: 0 };
      }
      dayMap[dateStr].estimatedSeconds += estimated;
      dayMap[dateStr].commits += 1;
      dayMap[dateStr].changes += changes;
    }

    const days: EstimatedDayStats[] = Object.entries(dayMap)
      .map(([date, d]) => {
        const dayConfidence: "high" | "medium" | "low" =
          d.changes > 100 ? "high" : d.changes > 20 ? "medium" : "low";

        return {
          date,
          estimatedSeconds: Math.round(d.estimatedSeconds),
          commits: d.commits,
          changes: d.changes,
          isEstimated: true as const,
          confidence: dayConfidence,
        };
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    const totalEstimatedSeconds = days.reduce(
      (s, d) => s + d.estimatedSeconds,
      0,
    );

    const sortedCommits = commits;
    const firstCommitDate = sortedCommits[0]?.dateStr ?? "—";
    const lastCommitDate =
      sortedCommits[sortedCommits.length - 1]?.dateStr ?? "—";

    return {
      days,
      totalEstimatedSeconds,
      calibratedSecondsPerLine: Math.round(secondsPerLine),
      dataSource,
      firstCommitDate,
      lastCommitDate,
      totalCommitsAnalyzed: commits.length,
    };
  }

  toSyntheticDailyStats(estimate: HistoricalEstimate): DailyStats[] {
    return estimate.days.map((d) => ({
      date: d.date,
      entries: [
        {
          timestamp: new Date(d.date + "T12:00:00").getTime(),
          duration: d.estimatedSeconds,
          file: "__estimated__",
          language: "__estimated__",
          project: "__estimated__",
          author: "__estimated__",
          branch: "__estimated__",
        },
      ],
    }));
  }

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

      const prevCommitTime = prevCommit
        ? prevCommit.timestamp
        : commit.timestamp - 24 * 60 * 60 * 1000;
      const timeSincePrevCommit = Math.round(
        (commit.timestamp - prevCommitTime) / 1000,
      );

      const timeInvestedBeforeCommit = allTimeEntries
        .filter((entry) => {
          const entryTime = entry.timestamp;
          return entryTime >= prevCommitTime && entryTime <= commit.timestamp;
        })
        .reduce((sum, entry) => sum + entry.duration, 0);

      const stats = this.gitAnalyzer.getCommitStats(commit.hash);

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

    const totalTimeInvested = allTimeEntries.reduce(
      (sum, e) => sum + e.duration,
      0,
    );
    const totalCommits = gitMetrics.totalCommits;
    const averageTimePerCommit =
      totalCommits > 0 ? totalTimeInvested / totalCommits : 0;

    const timeByDay: Record<string, number> = {};
    allTimeEntries.forEach((entry) => {
      const day = getLocalDateString(new Date(entry.timestamp));
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

  getDailyProductivity(allData: DailyStats[]): PeriodProductivity[] {
    const gitMetrics = this.gitAnalyzer.getCommitHistory(30);
    const dailyMetrics: Record<string, PeriodProductivity> = {};

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

    gitMetrics.commits.forEach((commit) => {
      const day = commit.dateStr;
      if (dailyMetrics[day]) {
        dailyMetrics[day].commits++;
      }
    });

    Object.values(dailyMetrics).forEach((day) => {
      const avgPerCommit =
        day.commits > 0 ? day.totalTime / day.commits : day.totalTime;
      day.avgTimePerCommit = avgPerCommit;

      const timePerChange =
        day.commits > 0 ? day.totalTime / day.commits : day.totalTime;
      day.productivityTrend =
        timePerChange < 1800 ? "high" : timePerChange < 5400 ? "medium" : "low";
    });

    return Object.values(dailyMetrics).sort(
      (a, b) => new Date(b.period).getTime() - new Date(a.period).getTime(),
    );
  }

  getOptimizationOpportunities(
    allData: DailyStats[],
    threshold: number = 1.5,
  ): TimeToCommitMetrics[] {
    const analysis = this.analyzeTimeToCommit(allData);

    if (analysis.metrics.length === 0) return [];

    const avgTime = analysis.averageTimePerCommit;
    return analysis.metrics
      .filter((m) => m.timeInvestedBeforeCommit > avgTime * threshold)
      .sort((a, b) => b.timeInvestedBeforeCommit - a.timeInvestedBeforeCommit);
  }
}
