import { DailyStats, TimeEntry } from "./storage";
import { getLocalDateString } from "./constants";

export class ExporterService {
  exportToCSV(
    data: DailyStats[],
    startDate?: string,
    endDate?: string,
  ): string {
    const filtered = this.filterByDateRange(data, startDate, endDate);
    const entries = filtered.flatMap((day) => day.entries);

    if (entries.length === 0) {
      return "No data found for the specified period";
    }

    const headers = [
      "Date",
      "Time",
      "Duration (min)",
      "File",
      "Language",
      "Project",
      "Branch",
      "Author",
    ];
    const rows = entries.map((entry) => {
      const date = getLocalDateString(new Date(entry.timestamp));
      const time = new Date(entry.timestamp).toISOString().split("T")[1];
      const durationMin = Math.round(entry.duration / 60);
      return [
        date,
        time,
        durationMin,
        entry.file,
        entry.language,
        entry.project,
        entry.branch,
        entry.author,
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) =>
            typeof cell === "string" && cell.includes(",") ? `"${cell}"` : cell,
          )
          .join(","),
      ),
    ].join("\n");

    return csvContent;
  }

  exportToMarkdown(
    data: DailyStats[],
    startDate?: string,
    endDate?: string,
  ): string {
    const filtered = this.filterByDateRange(data, startDate, endDate);

    if (filtered.length === 0) {
      return "# No Data\n\nNo tracking data found for the specified period.";
    }

    let markdown = `# Time Tracking Report\n\n`;
    markdown += `**Period:** ${startDate || "all time"} to ${endDate || "today"}\n\n`;

    let totalSeconds = 0;
    const projectStats: { [key: string]: number } = {};
    const languageStats: { [key: string]: number } = {};

    filtered.forEach((day) => {
      markdown += `## ${day.date}\n\n`;
      markdown += `| File | Language | Project | Branch | Duration | Author |\n`;
      markdown += `|------|----------|---------|--------|----------|--------|\n`;

      day.entries.forEach((entry) => {
        totalSeconds += entry.duration;
        projectStats[entry.project] =
          (projectStats[entry.project] || 0) + entry.duration;
        languageStats[entry.language] =
          (languageStats[entry.language] || 0) + entry.duration;

        const duration = this.formatDuration(entry.duration);
        markdown += `| ${entry.file} | ${entry.language} | ${entry.project} | ${entry.branch} | ${duration} | ${entry.author} |\n`;
      });

      markdown += `\n`;
    });

    markdown += `## Summary\n\n`;
    markdown += `**Total Time:** ${this.formatDuration(totalSeconds)}\n\n`;

    markdown += `### By Project\n\n`;
    Object.entries(projectStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([project, duration]) => {
        markdown += `- ${project}: ${this.formatDuration(duration)}\n`;
      });

    markdown += `\n### By Language\n\n`;
    Object.entries(languageStats)
      .sort((a, b) => b[1] - a[1])
      .forEach(([language, duration]) => {
        markdown += `- ${language}: ${this.formatDuration(duration)}\n`;
      });

    return markdown;
  }


  getLastNDays(data: DailyStats[], days: number): DailyStats[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = getLocalDateString(cutoffDate);

    return data.filter((day) => day.date >= cutoffDateStr);
  }


  private filterByDateRange(
    data: DailyStats[],
    startDate?: string,
    endDate?: string,
  ): DailyStats[] {
    return data.filter((day) => {
      if (startDate && day.date < startDate) return false;
      if (endDate && day.date > endDate) return false;
      return true;
    });
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  }
}
