import * as vscode from "vscode";
import { StorageService, DailyStats } from "./storage";
import { StatsService } from "./stats";

interface DayStats {
  date: string;
  day: string;
  hours: number;
  minutes: number;
  files: number;
}

export class WebviewPanel {
  private panel: vscode.WebviewPanel | undefined;
  private storage: StorageService;
  private stats: StatsService;

  constructor(storage: StorageService, stats: StatsService) {
    this.storage = storage;
    this.stats = stats;
  }

  show(extensionUri: vscode.Uri): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Two);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "heildammTracker",
      "Time Tracking Dashboard",
      vscode.ViewColumn.Two,
      { enableScripts: true },
    );

    this.panel.webview.html = this.getHtmlContent();

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  private getHtmlContent(): string {
    const allData = this.storage.getAllData();
    const todayData = this.storage.getTodayData();

    const total = this.stats.calculateTotal(allData);
    const todayStats = this.stats.getTodayStats(todayData);
    const topFiles = this.stats.getTopFiles(allData, 15);
    const languages = this.stats.getLanguageBreakdown(allData);

    const dayStats = this.getDayStats(allData);
    const totalDays = dayStats.length;
    const avgHoursPerDay =
      totalDays > 0
        ? (total.hours + total.minutes / 60) / totalDays
        : 0;
    const busyDay = dayStats.length > 0 ? dayStats[0] : null;
    const streak = this.getStreak(dayStats);

    const dayStatsHtml = dayStats
      .slice(0, 14)
      .map((day) => {
        const barHeight = Math.max((day.hours + day.minutes / 60) * 20, 5);
        return `
          <div class="day-stat">
            <div class="day-bar" style="height: ${barHeight}px;"></div>
            <div class="day-label">${day.day}</div>
            <div class="day-time">${day.hours}h</div>
          </div>
        `;
      })
      .join("");

    const topFilesHtml = topFiles
      .map((file) => {
        const duration = this.stats.formatDuration(file.duration);
        const totalSeconds = allData.reduce(
          (sum, d) =>
            sum +
            d.entries.reduce((s, e) => s + e.duration, 0),
          0,
        );
        const percent =
          totalSeconds > 0
            ? Math.round((file.duration / totalSeconds) * 100)
            : 0;
        return `
          <div class="file-item">
            <div class="file-header">
              <span class="file-name">${this.escapeHtml(file.file)}</span>
              <span class="file-lang">${file.language}</span>
            </div>
            <div class="file-bar">
              <div class="file-progress" style="width: ${percent}%"></div>
            </div>
            <div class="file-stats">${duration} (${percent}%)</div>
          </div>
        `;
      })
      .join("");

    const languagesHtml = languages
      .map((lang) => {
        const duration = this.stats.formatDuration(lang.duration);
        const totalSeconds = allData.reduce(
          (sum, d) =>
            sum +
            d.entries.reduce((s, e) => s + e.duration, 0),
          0,
        );
        const percent =
          totalSeconds > 0
            ? Math.round((lang.duration / totalSeconds) * 100)
            : 0;
        return `
          <div class="lang-item">
            <div class="lang-header">
              <span class="lang-name">${lang.language}</span>
              <span class="lang-percent">${percent}%</span>
            </div>
            <div class="lang-bar">
              <div class="lang-progress" style="width: ${percent}%"></div>
            </div>
            <div class="lang-time">${duration}</div>
          </div>
        `;
      })
      .join("");

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              background: var(--vscode-editor-background);
              color: var(--vscode-editor-foreground);
              padding: 20px;
              line-height: 1.6;
            }

            .container {
              max-width: 1200px;
              margin: 0 auto;
            }

            h1 {
              font-size: 28px;
              margin-bottom: 30px;
              color: #8e61c6;
              font-weight: 600;
            }

            h2 {
              font-size: 16px;
              margin-top: 30px;
              margin-bottom: 15px;
              color: var(--vscode-editor-foreground);
              border-bottom: 1px solid var(--vscode-panel-border);
              padding-bottom: 10px;
            }

            .stats-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
              gap: 15px;
              margin-bottom: 30px;
            }

            .stat-card {
              background: var(--vscode-editor-background);
              border: 1px solid var(--vscode-panel-border);
              border-radius: 8px;
              padding: 15px;
              text-align: center;
            }

            .stat-label {
              font-size: 11px;
              color: var(--vscode-descriptionForeground);
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }

            .stat-value {
              font-size: 28px;
              font-weight: 600;
              color: #8e61c6;
              margin-bottom: 4px;
            }

            .stat-sub {
              font-size: 12px;
              color: var(--vscode-descriptionForeground);
            }

            .day-stats-container {
              display: flex;
              gap: 8px;
              align-items: flex-end;
              height: 120px;
              padding: 20px;
              background: var(--vscode-editor-background);
              border: 1px solid var(--vscode-panel-border);
              border-radius: 8px;
              margin-bottom: 20px;
              overflow-x: auto;
            }

            .day-stat {
              flex: 0 0 auto;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: flex-end;
              min-width: 40px;
            }

            .day-bar {
              width: 30px;
              background: #8e61c6;
              border-radius: 3px 3px 0 0;
              transition: background 0.2s;
              margin-bottom: 6px;
            }

            .day-bar:hover {
              background: #a277ff;
            }

            .day-label {
              font-size: 10px;
              color: var(--vscode-descriptionForeground);
              text-align: center;
            }

            .day-time {
              font-size: 9px;
              color: var(--vscode-descriptionForeground);
              margin-top: 4px;
            }

            .file-item {
              background: var(--vscode-editor-background);
              border: 1px solid var(--vscode-panel-border);
              border-radius: 6px;
              padding: 12px;
              margin-bottom: 10px;
            }

            .file-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 8px;
              gap: 10px;
            }

            .file-name {
              font-weight: 500;
              font-size: 13px;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              flex: 1;
            }

            .file-lang {
              font-size: 11px;
              color: var(--vscode-descriptionForeground);
              background: var(--vscode-badge-background);
              padding: 2px 8px;
              border-radius: 3px;
              white-space: nowrap;
            }

            .file-bar {
              width: 100%;
              height: 4px;
              background: var(--vscode-progressBar-background);
              border-radius: 2px;
              overflow: hidden;
              margin-bottom: 6px;
            }

            .file-progress {
              height: 100%;
              background: #8e61c6;
            }

            .file-stats {
              font-size: 11px;
              color: var(--vscode-descriptionForeground);
              text-align: right;
            }

            .lang-item {
              padding: 12px 0;
              border-bottom: 1px solid var(--vscode-panel-border);
            }

            .lang-item:last-child {
              border-bottom: none;
            }

            .lang-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 6px;
            }

            .lang-name {
              font-size: 13px;
              font-weight: 500;
            }

            .lang-percent {
              font-size: 13px;
              color: #8e61c6;
              font-weight: 600;
            }

            .lang-bar {
              width: 100%;
              height: 3px;
              background: var(--vscode-progressBar-background);
              border-radius: 2px;
              overflow: hidden;
              margin-bottom: 4px;
            }

            .lang-progress {
              height: 100%;
              background: #8e61c6;
            }

            .lang-time {
              font-size: 11px;
              color: var(--vscode-descriptionForeground);
            }

            .two-column {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }

            .column {
              background: var(--vscode-editor-background);
              border: 1px solid var(--vscode-panel-border);
              border-radius: 8px;
              padding: 15px;
            }

            .metric {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid var(--vscode-panel-border);
            }

            .metric:last-child {
              border-bottom: none;
            }

            .metric-label {
              font-size: 12px;
              color: var(--vscode-descriptionForeground);
            }

            .metric-value {
              font-size: 14px;
              font-weight: 600;
              color: #8e61c6;
            }

            @media (max-width: 768px) {
              .two-column {
                grid-template-columns: 1fr;
              }

              .day-stats-container {
                height: 100px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Tracking Dashboard</h1>

            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-label">Total Time</div>
                <div class="stat-value">${total.hours}h</div>
                <div class="stat-sub">${total.minutes}m</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Today</div>
                <div class="stat-value">${todayStats.hours}h</div>
                <div class="stat-sub">${todayStats.minutes}m</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Coding Days</div>
                <div class="stat-value">${totalDays}</div>
                <div class="stat-sub">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Streak</div>
                <div class="stat-value">${streak}</div>
                <div class="stat-sub">days</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Avg Daily</div>
                <div class="stat-value">${Math.floor(avgHoursPerDay)}h</div>
                <div class="stat-sub">${Math.round((avgHoursPerDay % 1) * 60)}m</div>
              </div>
              <div class="stat-card">
                <div class="stat-label">Busiest Day</div>
                <div class="stat-value">${busyDay ? busyDay.hours : 0}h</div>
                <div class="stat-sub">${busyDay ? busyDay.day : "N/A"}</div>
              </div>
            </div>

            <h2>Last 14 Days Activity</h2>
            <div class="day-stats-container">
              ${dayStatsHtml || '<div style="width: 100%; text-align: center; color: var(--vscode-descriptionForeground);">No data</div>'}
            </div>

            <div class="two-column">
              <div class="column">
                <h2 style="margin-top: 0;">Today Metrics</h2>
                <div class="metric">
                  <span class="metric-label">Files Edited</span>
                  <span class="metric-value">${todayStats.fileCount}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Languages</span>
                  <span class="metric-value">${todayStats.languageCount}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Focus Time</span>
                  <span class="metric-value">${todayStats.hours}h ${todayStats.minutes}m</span>
                </div>
              </div>
              <div class="column">
                <h2 style="margin-top: 0;">Overall Stats</h2>
                <div class="metric">
                  <span class="metric-label">Total Days</span>
                  <span class="metric-value">${totalDays}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Avg Per Day</span>
                  <span class="metric-value">${Math.floor(avgHoursPerDay)}h ${Math.round((avgHoursPerDay % 1) * 60)}m</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Current Streak</span>
                  <span class="metric-value">${streak} days</span>
                </div>
              </div>
            </div>

            <h2>Top 15 Files</h2>
            ${topFilesHtml || '<div style="color: var(--vscode-descriptionForeground);">No data</div>'}

            <h2>Languages Breakdown</h2>
            ${languagesHtml || '<div style="color: var(--vscode-descriptionForeground);">No data</div>'}
          </div>
        </body>
      </html>
    `;
  }

  private getDayStats(allData: DailyStats[]): DayStats[] {
    const dayMap: { [key: string]: DayStats } = {};

    allData.forEach((daily) => {
      const date = new Date(daily.date + "T00:00:00");
      const days = [
        "Sun",
        "Mon",
        "Tue",
        "Wed",
        "Thu",
        "Fri",
        "Sat",
      ];
      const day = days[date.getDay()];

      let totalSeconds = 0;
      const files = new Set<string>();

      daily.entries.forEach((entry) => {
        totalSeconds += entry.duration;
        files.add(entry.file);
      });

      dayMap[daily.date] = {
        date: daily.date,
        day,
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        files: files.size,
      };
    });

    return Object.values(dayMap)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .reverse();
  }

  private getStreak(dayStats: DayStats[]): number {
    if (dayStats.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split("T")[0];

      const found = dayStats.find((d) => d.date === dateStr);
      if (found) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return streak;
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
