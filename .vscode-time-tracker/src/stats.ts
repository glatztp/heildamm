import { DailyStats, TimeEntry } from "./storage";

export interface FileStats {
  file: string;
  language: string;
  duration: number;
}

export interface LanguageStats {
  language: string;
  duration: number;
}

export interface BranchStats {
  branch: string;
  duration: number;
}

export interface ProjectStats {
  project: string;
  duration: number;
  fileCount: number;
}

export interface AuthorStats {
  author: string;
  totalDuration: number;
  fileCount: number;
  languageBreakdown: LanguageStats[];
}

export class StatsService {
  calculateTotal(allData: DailyStats[]): { hours: number; minutes: number } {
    let totalSeconds = 0;
    allData.forEach((day) => {
      day.entries.forEach((entry) => {
        totalSeconds += entry.duration;
      });
    });

    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
    };
  }

  getTopFiles(allData: DailyStats[], limit: number = 5): FileStats[] {
    const stats: { [key: string]: FileStats } = {};

    allData.forEach((day) => {
      day.entries.forEach((entry) => {
        if (!stats[entry.file]) {
          stats[entry.file] = {
            file: entry.file,
            language: entry.language,
            duration: 0,
          };
        }
        stats[entry.file].duration += entry.duration;
      });
    });

    return Object.values(stats)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  getLanguageBreakdown(allData: DailyStats[]): LanguageStats[] {
    const stats: { [key: string]: LanguageStats } = {};

    allData.forEach((day) => {
      day.entries.forEach((entry) => {
        if (!stats[entry.language]) {
          stats[entry.language] = {
            language: entry.language,
            duration: 0,
          };
        }
        stats[entry.language].duration += entry.duration;
      });
    });

    return Object.values(stats).sort((a, b) => b.duration - a.duration);
  }

  getBranchBreakdown(allData: DailyStats[]): BranchStats[] {
    const stats: { [key: string]: BranchStats } = {};

    allData.forEach((day) => {
      day.entries.forEach((entry) => {
        if (!stats[entry.branch]) {
          stats[entry.branch] = {
            branch: entry.branch,
            duration: 0,
          };
        }
        stats[entry.branch].duration += entry.duration;
      });
    });

    return Object.values(stats).sort((a, b) => b.duration - a.duration);
  }

  getProjectBreakdown(allData: DailyStats[]): ProjectStats[] {
    const stats: { [key: string]: ProjectStats } = {};

    allData.forEach((day) => {
      day.entries.forEach((entry) => {
        if (!stats[entry.project]) {
          stats[entry.project] = {
            project: entry.project,
            duration: 0,
            fileCount: 0,
          };
        }
        stats[entry.project].duration += entry.duration;
      });
    });

    Object.keys(stats).forEach((project) => {
      const files = new Set<string>();
      allData.forEach((day) => {
        day.entries
          .filter((e) => e.project === project)
          .forEach((e) => {
            files.add(e.file);
          });
      });
      stats[project].fileCount = files.size;
    });

    return Object.values(stats).sort((a, b) => b.duration - a.duration);
  }

  getTodayProjectTime(todayData: DailyStats | null, project: string): number {
    if (!todayData) return 0;
    return todayData.entries
      .filter((e) => e.project === project)
      .reduce((sum, e) => sum + e.duration, 0);
  }

  getAuthorStats(allData: DailyStats[]): AuthorStats[] {
    const stats: { [key: string]: AuthorStats } = {};

    allData.forEach((day) => {
      day.entries.forEach((entry) => {
        if (!stats[entry.author]) {
          stats[entry.author] = {
            author: entry.author,
            totalDuration: 0,
            fileCount: 0,
            languageBreakdown: [],
          };
        }
        stats[entry.author].totalDuration += entry.duration;
      });
    });

    Object.keys(stats).forEach((author) => {
      const files = new Set<string>();
      allData.forEach((day) => {
        day.entries
          .filter((e) => e.author === author)
          .forEach((e) => {
            files.add(e.file);
          });
      });
      stats[author].fileCount = files.size;
      stats[author].languageBreakdown = this.getLanguageBreakdown(allData);
    });

    return Object.values(stats);
  }

  getTodayStats(todayData: DailyStats | null): {
    hours: number;
    minutes: number;
    fileCount: number;
    languageCount: number;
  } {
    if (!todayData || todayData.entries.length === 0) {
      return { hours: 0, minutes: 0, fileCount: 0, languageCount: 0 };
    }

    let totalSeconds = 0;
    const files = new Set<string>();
    const languages = new Set<string>();

    todayData.entries.forEach((entry) => {
      totalSeconds += entry.duration;
      files.add(entry.file);
      languages.add(entry.language);
    });

    return {
      hours: Math.floor(totalSeconds / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      fileCount: files.size,
      languageCount: languages.size,
    };
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
}
