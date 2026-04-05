import * as vscode from "vscode";
import { StorageService, DailyStats } from "./storage";
import { StatsService } from "./stats";

interface DayStats {
  date: string;
  day: string;
  hours: number;
  minutes: number;
  files: number;
  totalSeconds: number;
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
      this.panel.webview.html = this.getHtmlContent();
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "heildammTracker",
      "Heildamm — Time Tracker",
      vscode.ViewColumn.Two,
      { enableScripts: true }
    );

    this.panel.webview.html = this.getHtmlContent();

    this.panel.webview.onDidReceiveMessage((message) => {
      if (message.command === "export") {
        this.handleExport(message.format);
      }
    });

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  private handleExport(format: "csv" | "json"): void {
    const allData = this.storage.getAllData();
    if (format === "json") {
      const json = JSON.stringify(allData, null, 2);
      vscode.workspace
        .openTextDocument({ content: json, language: "json" })
        .then((doc) => vscode.window.showTextDocument(doc));
    } else {
      const lines = ["date,file,language,duration_seconds,duration_minutes"];
      allData.forEach((daily) => {
        daily.entries.forEach((entry) => {
          lines.push(
            `${daily.date},${this.escapeCsv(entry.file)},${this.escapeCsv(entry.language)},${entry.duration},${(entry.duration / 60).toFixed(1)}`
          );
        });
      });
      vscode.workspace
        .openTextDocument({ content: lines.join("\n"), language: "plaintext" })
        .then((doc) => vscode.window.showTextDocument(doc));
    }
  }

  private escapeCsv(v: string): string {
    return v.includes(",") || v.includes('"') || v.includes("\n")
      ? `"${v.replace(/"/g, '""')}"`
      : v;
  }

  private getHtmlContent(): string {
    const allData = this.storage.getAllData();
    const todayData = this.storage.getTodayData();

    const total = this.stats.calculateTotal(allData);
    const todayStats = this.stats.getTodayStats(todayData);
    const topFiles = this.stats.getTopFiles(allData, 30);
    const languages = this.stats.getLanguageBreakdown(allData);

    const dayStats = this.getDayStats(allData);
    const totalDays = dayStats.length;
    const totalSeconds = allData.reduce(
      (s, d) => s + d.entries.reduce((ss, e) => ss + e.duration, 0),
      0
    );
    const totalEntries = allData.reduce((s, d) => s + d.entries.length, 0);
    const avgHoursPerDay =
      totalDays > 0 ? (total.hours + total.minutes / 60) / totalDays : 0;
    const busyDay =
      dayStats.length > 0
        ? [...dayStats].sort((a, b) => b.totalSeconds - a.totalSeconds)[0]
        : null;
    const streak = this.getStreak(dayStats);

    const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    dayStats.forEach((d) => {
      const dow = new Date(d.date + "T00:00:00").getDay();
      weekdayTotals[dow] += d.totalSeconds;
      weekdayCounts[dow]++;
    });

    const monthMap: Record<string, number> = {};
    dayStats.forEach((d) => {
      const m = d.date.slice(0, 7);
      monthMap[m] = (monthMap[m] || 0) + d.totalSeconds;
    });
    const monthData = Object.entries(monthMap).sort(([a], [b]) =>
      a.localeCompare(b)
    );

    const chartDays = [...dayStats].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const chartDataJson = JSON.stringify(
      chartDays.map((d) => ({
        date: d.date,
        label: d.day,
        hours: +(d.hours + d.minutes / 60).toFixed(2),
        files: d.files,
        totalSeconds: d.totalSeconds,
      }))
    );

    const topFilesJson = JSON.stringify(
      topFiles.map((f) => ({
        file: f.file,
        language: f.language,
        duration: f.duration,
        label: this.stats.formatDuration(f.duration),
      }))
    );

    const languagesJson = JSON.stringify(
      languages.map((l) => ({
        language: l.language,
        duration: l.duration,
        label: this.stats.formatDuration(l.duration),
      }))
    );

    const weekdayJson = JSON.stringify(
      ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, i) => ({
        label,
        avgSeconds:
          weekdayCounts[i] > 0 ? weekdayTotals[i] / weekdayCounts[i] : 0,
        totalSeconds: weekdayTotals[i],
        days: weekdayCounts[i],
      }))
    );

    const monthDataJson = JSON.stringify(
      monthData.map(([month, secs]) => ({
        month,
        hours: +(secs / 3600).toFixed(1),
        label: new Date(month + "-01").toLocaleDateString("en", {
          month: "short",
          year: "2-digit",
        }),
      }))
    );

    const firstDate = chartDays.length > 0 ? chartDays[0].date : "—";
    const lastDate =
      chartDays.length > 0 ? chartDays[chartDays.length - 1].date : "—";

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Heildamm</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600;700;900&family=IBM+Plex+Mono:wght@300;400;500;600&display=swap');

:root {
  --p:       #9d6fd4;
  --p-lo:    rgba(157,111,212,0.08);
  --p-mid:   rgba(157,111,212,0.18);
  --p-hi:    rgba(157,111,212,0.35);
  --p-line:  rgba(157,111,212,0.22);
  --accent:  #c49ef0;
  --bg:      var(--vscode-editor-background);
  --fg:      var(--vscode-editor-foreground);
  --surface: var(--vscode-sideBar-background, rgba(255,255,255,0.03));
  --border:  var(--vscode-panel-border, rgba(157,111,212,0.15));
  --muted:   var(--vscode-descriptionForeground);
  --mono:    'IBM Plex Mono', monospace;
  --cond:    'Barlow Condensed', sans-serif;
}

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: var(--mono);
  background: var(--bg);
  color: var(--fg);
  font-size: 11px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* ── SCROLLBAR ── */
::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--p-mid); border-radius: 2px; }

/* ── TOPBAR ── */
.topbar {
  position: sticky; top: 0; z-index: 100;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; height: 44px;
}
.logo {
  font-family: var(--cond);
  font-weight: 900; font-size: 20px; letter-spacing: 0.04em;
  color: var(--p); display: flex; align-items: baseline; gap: 10px;
}
.logo-eyebrow {
  font-size: 9px; font-weight: 400; font-family: var(--mono);
  color: var(--muted); letter-spacing: 0.18em; text-transform: uppercase;
}
.topbar-actions { display: flex; gap: 6px; align-items: center; }

/* ── BUTTONS ── */
.btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 11px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: transparent; color: var(--muted);
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.04em;
  cursor: pointer; transition: all .15s;
}
.btn:hover { border-color: var(--p); color: var(--p); background: var(--p-lo); }
.btn.active { border-color: var(--p); color: var(--p); background: var(--p-mid); }
.btn-primary {
  background: var(--p); color: #fff; border-color: var(--p);
  font-weight: 600;
}
.btn-primary:hover { opacity: .82; color: #fff; background: var(--p); }

/* ── SIDENAV ── */
.sidenav {
  position: fixed; left: 0; top: 44px; bottom: 0; width: 40px;
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column; align-items: center;
  padding: 10px 0; gap: 2px; z-index: 90; background: var(--bg);
}
.nav-item {
  width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;
  border-radius: 4px; cursor: pointer; font-size: 13px;
  transition: all .15s; color: var(--muted);
  border: none; background: transparent; text-decoration: none;
}
.nav-item:hover, .nav-item.active { background: var(--p-mid); color: var(--p); }
.nav-divider { width: 20px; height: 1px; background: var(--border); margin: 4px 0; }

/* ── MAIN LAYOUT ── */
.main { margin-left: 40px; padding: 20px 24px 64px; }

/* ── SECTION ── */
.section { margin-bottom: 32px; }
.section-label {
  font-size: 9px; font-weight: 600; letter-spacing: 0.22em;
  text-transform: uppercase; color: var(--muted);
  margin-bottom: 12px;
  display: flex; align-items: center; gap: 10px;
}
.section-label::after {
  content: ''; flex: 1; height: 1px; background: var(--border);
}

/* ── KPI STRIP ── */
.kpi-strip {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr 1fr 1fr 1fr 1fr 1fr;
  gap: 1px; background: var(--border);
  border: 1px solid var(--border);
  border-radius: 6px; overflow: hidden;
  margin-bottom: 28px;
}
.kpi {
  background: var(--bg);
  padding: 18px 16px 14px;
  position: relative; overflow: hidden;
  transition: background .15s;
  cursor: default;
}
.kpi::before {
  content: ''; position: absolute;
  top: 0; left: 0; right: 0; height: 1px;
  background: transparent; transition: background .2s;
}
.kpi:hover { background: var(--p-lo); }
.kpi:hover::before { background: var(--p); }
.kpi-label {
  font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--muted); margin-bottom: 10px; display: block; font-weight: 500;
}
.kpi-value {
  font-family: var(--cond);
  font-size: 44px; font-weight: 900; line-height: 1;
  letter-spacing: -1px; color: var(--p);
}
.kpi-value.fg { color: var(--fg); }
.kpi-unit {
  font-family: var(--cond);
  font-size: 18px; font-weight: 300;
  color: var(--muted); letter-spacing: 0;
  margin-left: 2px;
}
.kpi-sub { font-size: 10px; color: var(--muted); margin-top: 6px; line-height: 1.4; }

/* ── CHART CARD ── */
.chart-card {
  border: 1px solid var(--border); border-radius: 6px; overflow: hidden;
}
.chart-toolbar {
  display: flex; align-items: center; gap: 4px;
  padding: 8px 12px; border-bottom: 1px solid var(--border);
  background: var(--surface); flex-wrap: wrap;
}
.toolbar-sep { width: 1px; height: 14px; background: var(--border); margin: 0 4px; }
.date-range {
  display: flex; align-items: center; gap: 6px;
  margin-left: auto; font-size: 10px; color: var(--muted);
}
input[type="date"] {
  background: transparent; border: 1px solid var(--border); border-radius: 3px;
  padding: 3px 7px; color: var(--fg);
  font-family: var(--mono); font-size: 10px; outline: none;
}
input[type="date"]:focus { border-color: var(--p); }
.chart-area { padding: 16px 14px 10px; }
canvas { display: block; width: 100%; }
.chart-footer {
  display: flex; gap: 16px; padding: 8px 14px;
  border-top: 1px solid var(--border); background: var(--surface);
  font-size: 10px; color: var(--muted); align-items: center;
}
.legend-pip {
  width: 10px; height: 3px; border-radius: 2px;
  background: var(--p); display: inline-block; margin-right: 5px;
}

/* ── TOOLTIP ── */
.tooltip {
  position: fixed;
  background: var(--vscode-editorWidget-background, #1a1a2e);
  border: 1px solid var(--p-line);
  border-radius: 5px;
  padding: 10px 13px;
  font-family: var(--mono); font-size: 11px;
  pointer-events: none; opacity: 0; transition: opacity .1s;
  z-index: 9999; line-height: 2; min-width: 150px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}
.tooltip.on { opacity: 1; }
.tooltip-date { font-weight: 600; color: var(--p); font-size: 12px; }
.tooltip-row { color: var(--muted); }
.tooltip-row span { color: var(--fg); }

/* ── GRID LAYOUTS ── */
.grid-3 { display: grid; grid-template-columns: 1.7fr 1fr 1.1fr; gap: 14px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }

/* ── PANEL ── */
.panel {
  border: 1px solid var(--border); border-radius: 6px;
  overflow: hidden; display: flex; flex-direction: column;
}
.panel-header {
  padding: 10px 14px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  background: var(--surface); flex-shrink: 0;
}
.panel-title {
  font-family: var(--cond);
  font-size: 12px; font-weight: 700;
  letter-spacing: 0.1em; text-transform: uppercase;
}
.panel-meta { font-size: 10px; color: var(--p); }
.panel-body { overflow-y: auto; flex: 1; }

/* ── FILE ROWS ── */
.file-row {
  display: grid; grid-template-columns: 20px 1fr auto;
  align-items: center; gap: 10px; padding: 8px 14px;
  border-bottom: 1px solid var(--border);
  transition: background .1s; cursor: default;
}
.file-row:last-child { border-bottom: none; }
.file-row:hover { background: var(--p-lo); }
.file-rank { font-size: 9px; color: var(--muted); text-align: right; font-feature-settings: "tnum"; }
.file-info { overflow: hidden; }
.file-name {
  font-size: 11px; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px;
}
.bar-row { display: flex; align-items: center; gap: 6px; }
.bar-track { flex: 1; height: 2px; background: var(--border); border-radius: 1px; overflow: hidden; }
.bar-fill { height: 100%; background: var(--p); border-radius: 1px; }
.bar-pct { font-size: 9px; color: var(--muted); width: 26px; text-align: right; font-feature-settings: "tnum"; }
.file-right { text-align: right; flex-shrink: 0; }
.file-time { font-size: 11px; font-weight: 500; color: var(--p); font-feature-settings: "tnum"; white-space: nowrap; }
.lang-tag {
  display: inline-block; margin-top: 3px;
  padding: 1px 6px; border-radius: 2px;
  background: var(--p-lo); color: var(--p);
  font-size: 9px; border: 1px solid var(--p-line);
}

/* ── LANGUAGE ROWS ── */
.lang-row {
  padding: 10px 14px; border-bottom: 1px solid var(--border);
  transition: background .1s;
}
.lang-row:last-child { border-bottom: none; }
.lang-row:hover { background: var(--p-lo); }
.lang-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px; }
.lang-name { font-size: 12px; font-weight: 500; }
.lang-pct {
  font-family: var(--cond);
  font-size: 26px; font-weight: 900; line-height: 1;
  color: var(--p); font-feature-settings: "tnum";
}
.lang-pct-unit { font-size: 14px; font-weight: 400; }
.lang-time { font-size: 9px; color: var(--muted); margin-top: 4px; }

/* ── WEEKDAY CHART ── */
.weekday-wrap { padding: 16px 14px; }
.weekday-bars {
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: 6px; align-items: flex-end; height: 72px;
  margin-bottom: 10px;
}
.wd-bar-wrap {
  display: flex; flex-direction: column; align-items: center;
  gap: 4px; height: 100%; justify-content: flex-end;
}
.wd-bar {
  width: 100%; background: var(--p); border-radius: 2px 2px 0 0;
  min-height: 3px; transition: opacity .15s;
}
.wd-bar:hover { opacity: .6; }
.wd-day { font-size: 9px; color: var(--muted); letter-spacing: .04em; }
.wd-val { font-size: 9px; color: var(--p); font-feature-settings: "tnum"; }
.peak-day-block {
  border-top: 1px solid var(--border);
  padding: 12px 14px;
}
.peak-label { font-size: 9px; color: var(--muted); letter-spacing: .14em; text-transform: uppercase; margin-bottom: 6px; }
.peak-value {
  font-family: var(--cond);
  font-size: 36px; font-weight: 900; color: var(--p); line-height: 1;
}
.peak-sub { font-size: 10px; color: var(--muted); margin-top: 4px; }

/* ── CALENDAR HEATMAP ── */
.cal-container { padding: 14px; overflow-x: auto; }
.cal-month-labels {
  position: relative; height: 16px;
  font-size: 9px; color: var(--muted); margin-bottom: 4px;
}
.cal-month-labels span { position: absolute; top: 0; letter-spacing: .04em; }
.cal-grid { display: flex; gap: 3px; }
.cal-week { display: flex; flex-direction: column; gap: 3px; }
.cal-cell {
  width: 11px; height: 11px; border-radius: 2px;
  background: var(--border); transition: transform .12s; cursor: default;
}
.cal-cell:hover { transform: scale(1.5); z-index: 2; position: relative; }
.cal-cell.l1 { background: rgba(157,111,212,0.18); }
.cal-cell.l2 { background: rgba(157,111,212,0.38); }
.cal-cell.l3 { background: rgba(157,111,212,0.62); }
.cal-cell.l4 { background: var(--p); }
.cal-weekday-labels {
  display: flex; flex-direction: column; gap: 3px;
  margin-right: 4px; margin-top: 0;
}

/* ── MONTH BARS ── */
.month-list { padding: 10px 14px 16px; }
.month-row {
  display: grid; grid-template-columns: 42px 1fr 52px;
  align-items: center; gap: 8px; padding: 4px 0;
}
.month-label { font-size: 9px; color: var(--muted); text-align: right; letter-spacing: .06em; }
.month-val { font-size: 10px; color: var(--p); text-align: right; font-feature-settings: "tnum"; font-weight: 500; }

/* ── TOP DAYS TABLE ── */
.data-table { width: 100%; border-collapse: collapse; font-size: 11px; }
.data-table th {
  text-align: left; font-size: 9px; letter-spacing: .12em; text-transform: uppercase;
  color: var(--muted); padding: 8px 14px; border-bottom: 1px solid var(--border);
  font-weight: 500; background: var(--surface);
}
.data-table td { padding: 7px 14px; border-bottom: 1px solid var(--border); }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--p-lo); }
.td-right { text-align: right; color: var(--p); font-feature-settings: "tnum"; font-weight: 500; }
.td-muted { color: var(--muted); }

/* ── FOOTER ── */
.footer {
  position: fixed; bottom: 0; left: 40px; right: 0; height: 26px;
  background: var(--bg); border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 18px; font-size: 10px; color: var(--muted); z-index: 80;
}
.status-dot {
  width: 5px; height: 5px; border-radius: 50%; background: var(--p);
  display: inline-block; margin-right: 6px;
  animation: blink 2.4s ease-in-out infinite;
}
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: .2; } }

@media (max-width: 920px) {
  .kpi-strip { grid-template-columns: repeat(4, 1fr); }
  .grid-3, .grid-2 { grid-template-columns: 1fr; }
}
</style>
</head>
<body>

<header class="topbar">
  <div class="logo">
    HEILDAMM
    <span class="logo-eyebrow">time tracker</span>
  </div>
  <div class="topbar-actions">
    <span style="font-size:10px;color:var(--muted);margin-right:2px">${firstDate} → ${lastDate}</span>
    <button class="btn" onclick="exportData('csv')">↓ CSV</button>
    <button class="btn" onclick="exportData('json')">↓ JSON</button>
  </div>
</header>

<nav class="sidenav">
  <a class="nav-item active" href="#overview" title="Overview">◈</a>
  <a class="nav-item" href="#activity" title="Activity">▦</a>
  <div class="nav-divider"></div>
  <a class="nav-item" href="#breakdown" title="Breakdown">≡</a>
  <a class="nav-item" href="#heatmap" title="Heatmap">⊞</a>
  <a class="nav-item" href="#monthly" title="Monthly">◫</a>
</nav>

<main class="main">

  <!-- KPI STRIP -->
  <div id="overview">
    <div class="kpi-strip">

      <div class="kpi">
        <span class="kpi-label">Total coded</span>
        <div class="kpi-value">${total.hours}<span class="kpi-unit">h</span>&thinsp;${total.minutes}<span class="kpi-unit">m</span></div>
        <div class="kpi-sub">across all sessions</div>
      </div>

      <div class="kpi">
        <span class="kpi-label">Today</span>
        <div class="kpi-value fg">${todayStats.hours}<span class="kpi-unit">h</span>&thinsp;${todayStats.minutes}<span class="kpi-unit">m</span></div>
        <div class="kpi-sub">${todayStats.fileCount} files · ${todayStats.languageCount} languages</div>
      </div>

      <div class="kpi">
        <span class="kpi-label">Days active</span>
        <div class="kpi-value">${totalDays}</div>
        <div class="kpi-sub">unique days</div>
      </div>

      <div class="kpi">
        <span class="kpi-label">Streak</span>
        <div class="kpi-value">${streak}</div>
        <div class="kpi-sub">days running</div>
      </div>

      <div class="kpi">
        <span class="kpi-label">Avg / day</span>
        <div class="kpi-value fg">${Math.floor(avgHoursPerDay)}<span class="kpi-unit">h</span></div>
        <div class="kpi-sub">${Math.round((avgHoursPerDay % 1) * 60)}m on active days</div>
      </div>

      <div class="kpi">
        <span class="kpi-label">Peak day</span>
        <div class="kpi-value">${busyDay ? busyDay.hours : 0}<span class="kpi-unit">h</span></div>
        <div class="kpi-sub">${busyDay ? busyDay.date : "—"}</div>
      </div>

      <div class="kpi">
        <span class="kpi-label">Sessions</span>
        <div class="kpi-value fg">${totalEntries}</div>
        <div class="kpi-sub">file sessions</div>
      </div>

      <div class="kpi">
        <span class="kpi-label">Languages</span>
        <div class="kpi-value">${languages.length}</div>
        <div class="kpi-sub">detected</div>
      </div>

    </div>
  </div>

  <!-- DAILY ACTIVITY CHART -->
  <div id="activity" class="section">
    <div class="section-label">Daily activity</div>
    <div class="chart-card">
      <div class="chart-toolbar">
        <button class="btn" data-range="7">7D</button>
        <button class="btn" data-range="14">14D</button>
        <button class="btn" data-range="30">30D</button>
        <button class="btn" data-range="90">90D</button>
        <button class="btn" data-range="180">6M</button>
        <button class="btn" data-range="365">1Y</button>
        <button class="btn active" data-range="all">All</button>
        <div class="toolbar-sep"></div>
        <div class="date-range">
          <span>from</span>
          <input type="date" id="date-from"/>
          <span>to</span>
          <input type="date" id="date-to"/>
          <button class="btn" id="apply-range">apply</button>
        </div>
      </div>
      <div class="chart-area">
        <canvas id="main-chart" height="200"></canvas>
      </div>
      <div class="chart-footer">
        <span><span class="legend-pip"></span>hours per day</span>
        <span style="opacity:.5">— avg</span>
        <span style="margin-left:auto" id="chart-summary"></span>
      </div>
    </div>
  </div>

  <!-- BREAKDOWN -->
  <div id="breakdown" class="section">
    <div class="section-label">Breakdown</div>
    <div class="grid-3">

      <div class="panel" style="max-height:480px">
        <div class="panel-header">
          <span class="panel-title">Top Files</span>
          <span class="panel-meta" id="files-count"></span>
        </div>
        <div class="panel-body" id="files-list"></div>
      </div>

      <div class="panel" style="max-height:480px">
        <div class="panel-header">
          <span class="panel-title">Languages</span>
          <span class="panel-meta" id="lang-count"></span>
        </div>
        <div class="panel-body" id="lang-list"></div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">By Weekday</span>
          <span class="panel-meta">avg per day</span>
        </div>
        <div class="weekday-wrap">
          <div class="weekday-bars" id="weekday-bars"></div>
          <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px" id="weekday-labels"></div>
        </div>
        <div class="peak-day-block" id="peak-day"></div>
      </div>

    </div>
  </div>

  <!-- HEATMAP -->
  <div id="heatmap" class="section">
    <div class="section-label" style="justify-content:space-between">
      <span style="letter-spacing:.22em;font-size:9px;font-weight:600;text-transform:uppercase;color:var(--muted)">Contribution heatmap</span>
      <span style="display:flex;align-items:center;gap:4px;font-size:9px;color:var(--muted)">
        less
        <span style="width:10px;height:10px;background:var(--border);border-radius:2px;display:inline-block"></span>
        <span style="width:10px;height:10px;background:rgba(157,111,212,0.18);border-radius:2px;display:inline-block"></span>
        <span style="width:10px;height:10px;background:rgba(157,111,212,0.38);border-radius:2px;display:inline-block"></span>
        <span style="width:10px;height:10px;background:rgba(157,111,212,0.62);border-radius:2px;display:inline-block"></span>
        <span style="width:10px;height:10px;background:var(--p);border-radius:2px;display:inline-block"></span>
        more
      </span>
    </div>
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">52-week view</span>
        <span class="panel-meta" id="cal-meta"></span>
      </div>
      <div class="cal-container">
        <div class="cal-month-labels" id="cal-months"></div>
        <div style="display:flex;gap:3px">
          <div style="display:flex;flex-direction:column;gap:3px;margin-right:2px;margin-top:0;padding-top:0" id="cal-weekday-labels"></div>
          <div class="cal-grid" id="cal-grid"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- MONTHLY + TOP DAYS -->
  <div id="monthly" class="section">
    <div class="section-label">Monthly &amp; top days</div>
    <div class="grid-2">

      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Hours per month</span>
          <span class="panel-meta" id="months-range"></span>
        </div>
        <div class="month-list" id="month-bars"></div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Top 15 days</span>
          <span class="panel-meta">all time</span>
        </div>
        <div class="panel-body" style="max-height:380px">
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Day</th>
                <th style="text-align:right">Time</th>
                <th style="text-align:right">Files</th>
              </tr>
            </thead>
            <tbody id="top-days-body"></tbody>
          </table>
        </div>
      </div>

    </div>
  </div>

</main>

<footer class="footer">
  <span><span class="status-dot"></span>${totalDays} days · ${totalEntries} sessions · ${languages.length} languages</span>
  <span id="footer-clock"></span>
</footer>

<div class="tooltip" id="tt"></div>

<script>
const RAW_DAYS   = ${chartDataJson};
const TOP_FILES  = ${topFilesJson};
const LANGUAGES  = ${languagesJson};
const WEEKDAYS   = ${weekdayJson};
const MONTH_DATA = ${monthDataJson};
const TOTAL_SECS = ${totalSeconds};

document.getElementById('footer-clock').textContent = new Date().toLocaleTimeString();

const vscode = acquireVsCodeApi();
function exportData(f) { vscode.postMessage({ command: 'export', format: f }); }

function fmtSecs(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? h + 'h ' + m + 'm' : m + 'm';
}

// Tooltip
const tt = document.getElementById('tt');
function showTip(e, html) {
  tt.innerHTML = html;
  const x = Math.min(e.clientX + 16, window.innerWidth - 180);
  tt.style.left = x + 'px';
  tt.style.top = (e.clientY - 10) + 'px';
  tt.classList.add('on');
}
function hideTip() { tt.classList.remove('on'); }
document.addEventListener('mousemove', e => {
  if (tt.classList.contains('on')) {
    const x = Math.min(e.clientX + 16, window.innerWidth - 180);
    tt.style.left = x + 'px';
    tt.style.top = (e.clientY - 10) + 'px';
  }
});

// ── FILES ──────────────────────────────────────────
(function () {
  const maxD = Math.max(...TOP_FILES.map(f => f.duration), 1);
  document.getElementById('files-count').textContent = TOP_FILES.length + ' files';
  document.getElementById('files-list').innerHTML = TOP_FILES.map((f, i) => {
    const pct = TOTAL_SECS > 0 ? Math.round(f.duration / TOTAL_SECS * 100) : 0;
    const bar = Math.round(f.duration / maxD * 100);
    const name = f.file.split(/[\\\\/]/).pop();
    return \`<div class="file-row" title="\${f.file}">
      <span class="file-rank">\${i + 1}</span>
      <div class="file-info">
        <div class="file-name">\${name}</div>
        <div class="bar-row">
          <div class="bar-track"><div class="bar-fill" style="width:\${bar}%"></div></div>
          <span class="bar-pct">\${pct}%</span>
        </div>
      </div>
      <div class="file-right">
        <div class="file-time">\${f.label}</div>
        <div class="lang-tag">\${f.language}</div>
      </div>
    </div>\`;
  }).join('');
})();

// ── LANGUAGES ──────────────────────────────────────
(function () {
  const tot = LANGUAGES.reduce((s, l) => s + l.duration, 0);
  document.getElementById('lang-count').textContent = LANGUAGES.length + ' languages';
  document.getElementById('lang-list').innerHTML = LANGUAGES.map(l => {
    const pct = tot > 0 ? Math.round(l.duration / tot * 100) : 0;
    return \`<div class="lang-row">
      <div class="lang-top">
        <span class="lang-name">\${l.language}</span>
        <span class="lang-pct">\${pct}<span class="lang-pct-unit">%</span></span>
      </div>
      <div class="bar-track"><div class="bar-fill" style="width:\${pct}%;background:var(--accent)"></div></div>
      <div class="lang-time">\${l.label}</div>
    </div>\`;
  }).join('');
})();

// ── WEEKDAY ────────────────────────────────────────
(function () {
  const maxAvg = Math.max(...WEEKDAYS.map(w => w.avgSeconds), 1);
  const barsEl = document.getElementById('weekday-bars');
  const labelsEl = document.getElementById('weekday-labels');

  WEEKDAYS.forEach(w => {
    const h = Math.round(w.avgSeconds / maxAvg * 100);
    const bar = document.createElement('div');
    bar.className = 'wd-bar-wrap';
    bar.innerHTML = \`<div class="wd-bar" style="height:\${h}%" title="\${fmtSecs(w.avgSeconds)} avg"></div>\`;
    bar.addEventListener('mouseenter', e => {
      showTip(e, \`<div class="tooltip-date">\${w.label}</div><div class="tooltip-row">avg <span>\${fmtSecs(w.avgSeconds)}</span></div><div class="tooltip-row">sessions <span>\${w.days}</span></div>\`);
    });
    bar.addEventListener('mouseleave', hideTip);
    barsEl.appendChild(bar);

    const lbl = document.createElement('div');
    lbl.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px';
    lbl.innerHTML = \`<span class="wd-day">\${w.label.slice(0,2)}</span><span class="wd-val">\${fmtSecs(w.avgSeconds)}</span>\`;
    labelsEl.appendChild(lbl);
  });

  const best = WEEKDAYS.reduce((a, b) => b.avgSeconds > a.avgSeconds ? b : a, WEEKDAYS[0]);
  document.getElementById('peak-day').innerHTML = \`
    <div class="peak-label">Peak weekday</div>
    <div class="peak-value">\${best.label}</div>
    <div class="peak-sub">avg \${fmtSecs(best.avgSeconds)} · \${best.days} sessions</div>\`;
})();

// ── MONTH BARS ─────────────────────────────────────
(function () {
  const maxH = Math.max(...MONTH_DATA.map(m => m.hours), 1);
  document.getElementById('months-range').textContent =
    MONTH_DATA.length ? MONTH_DATA[0].label + ' → ' + MONTH_DATA[MONTH_DATA.length - 1].label : '';
  document.getElementById('month-bars').innerHTML = MONTH_DATA.map(m => {
    const bar = Math.round(m.hours / maxH * 100);
    return \`<div class="month-row">
      <span class="month-label">\${m.label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:\${bar}%"></div></div>
      <span class="month-val">\${m.hours}h</span>
    </div>\`;
  }).join('');
})();

// ── TOP DAYS ───────────────────────────────────────
(function () {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const sorted = [...RAW_DAYS].sort((a, b) => b.hours - a.hours).slice(0, 15);
  document.getElementById('top-days-body').innerHTML = sorted.map((d, i) => {
    const dow = DAYS[new Date(d.date + 'T00:00:00').getDay()];
    const h = Math.floor(d.hours), m = Math.round((d.hours % 1) * 60);
    return \`<tr>
      <td class="td-muted">\${i + 1}</td>
      <td>\${d.date}</td>
      <td class="td-muted">\${dow}</td>
      <td class="td-right">\${h}h \${m}m</td>
      <td class="td-right">\${d.files}</td>
    </tr>\`;
  }).join('');
})();

// ── CALENDAR HEATMAP ───────────────────────────────
(function () {
  const dayMap = {};
  RAW_DAYS.forEach(d => { dayMap[d.date] = d.hours; });
  const vals = Object.values(dayMap).filter(v => v > 0);
  const maxH = vals.length ? Math.max(...vals) : 1;

  function lvl(h) {
    if (!h) return '';
    if (h < maxH * .25) return 'l1';
    if (h < maxH * .5)  return 'l2';
    if (h < maxH * .75) return 'l3';
    return 'l4';
  }

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setDate(start.getDate() - 363);
  start.setDate(start.getDate() - start.getDay());

  const grid = document.getElementById('cal-grid');
  const monthsEl = document.getElementById('cal-months');
  const wdLabels = document.getElementById('cal-weekday-labels');
  grid.innerHTML = ''; monthsEl.innerHTML = '';

  ['M', '', 'W', '', 'F'].forEach((l, i) => {
    const s = document.createElement('span');
    s.textContent = l;
    s.style.cssText = \`font-size:9px;color:var(--muted);height:11px;display:flex;align-items:center;\${i < 4 ? 'margin-bottom:3px' : ''}\`;
    wdLabels.appendChild(s);
  });

  let lastM = -1, weekIdx = 0;
  for (let d = new Date(start); d <= today;) {
    const wk = document.createElement('div'); wk.className = 'cal-week';

    if (d.getMonth() !== lastM) {
      lastM = d.getMonth();
      const sp = document.createElement('span');
      sp.textContent = d.toLocaleDateString('en', { month: 'short' });
      sp.style.left = (weekIdx * 14) + 'px';
      monthsEl.appendChild(sp);
    }

    for (let i = 0; i < 7; i++) {
      const ds = d.toISOString().split('T')[0];
      const h = dayMap[ds] || 0;
      const cell = document.createElement('div');
      cell.className = 'cal-cell ' + lvl(h);
      cell.addEventListener('mouseenter', e => {
        showTip(e, \`<div class="tooltip-date">\${ds}</div><div class="tooltip-row">\${h > 0 ? h.toFixed(1) + 'h coded' : 'no activity'}</div>\`);
      });
      cell.addEventListener('mouseleave', hideTip);
      wk.appendChild(cell);
      d.setDate(d.getDate() + 1);
      if (d > today) break;
    }
    grid.appendChild(wk);
    weekIdx++;
  }

  const activeDays = vals.length;
  document.getElementById('cal-meta').textContent = activeDays + ' active days';
})();

// ── MAIN CHART ─────────────────────────────────────
const canvas = document.getElementById('main-chart');
const ctx = canvas.getContext('2d');
let activeData = RAW_DAYS;

function drawChart(data) {
  const summaryEl = document.getElementById('chart-summary');
  if (!data || !data.length) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    summaryEl.textContent = ''; return;
  }

  const totalH = data.reduce((s, d) => s + d.hours, 0);
  const avgH = totalH / data.length;
  summaryEl.textContent = 'total ' + totalH.toFixed(1) + 'h · avg ' + avgH.toFixed(1) + 'h/day';

  const dpr = window.devicePixelRatio || 1;
  const W = canvas.parentElement.clientWidth - 28;
  const H = 210;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, W, H);

  const pL = 42, pR = 14, pT = 14, pB = 34;
  const cW = W - pL - pR, cH = H - pT - pB;
  const maxH = Math.max(...data.map(d => d.hours), 0.1);

  // Horizontal grid lines
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const y = pT + (cH / gridLines) * i;
    const val = maxH - (maxH / gridLines) * i;

    ctx.strokeStyle = 'rgba(157,111,212,0.08)';
    ctx.lineWidth = 1; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(pL, y); ctx.lineTo(pL + cW, y); ctx.stroke();

    ctx.fillStyle = 'rgba(157,111,212,0.4)';
    ctx.font = "9px 'IBM Plex Mono',monospace";
    ctx.textAlign = 'right';
    ctx.fillText(val.toFixed(1), pL - 5, y + 3);
  }

  // Avg line
  const avgY = pT + cH - (avgH / maxH) * cH;
  ctx.strokeStyle = 'rgba(157,111,212,0.3)';
  ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
  ctx.beginPath(); ctx.moveTo(pL, avgY); ctx.lineTo(pL + cW, avgY); ctx.stroke();
  ctx.setLineDash([]);

  // Area fill under avg
  ctx.fillStyle = 'rgba(157,111,212,0.04)';
  ctx.fillRect(pL, avgY, cW, pT + cH - avgY);

  // Bars
  const gap = cW / data.length;
  const barW = Math.max(Math.min(gap * .7, 20), 1.5);

  data.forEach((d, i) => {
    const x = pL + gap * i + gap / 2 - barW / 2;
    const bh = (d.hours / maxH) * cH;
    const y = pT + cH - bh;
    const isAbove = d.hours >= avgH;

    ctx.fillStyle = isAbove ? 'rgba(157,111,212,0.9)' : 'rgba(157,111,212,0.3)';
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, barW, bh, [2, 2, 0, 0]);
    else ctx.rect(x, y, barW, bh);
    ctx.fill();
  });

  // X labels
  ctx.fillStyle = 'rgba(157,111,212,0.45)';
  ctx.font = "9px 'IBM Plex Mono',monospace";
  ctx.textAlign = 'center';
  const maxLabels = Math.floor(cW / 44);
  const step = Math.max(1, Math.floor(data.length / maxLabels));
  data.forEach((d, i) => {
    if (i % step !== 0 && i !== data.length - 1) return;
    ctx.fillText(d.date.slice(5), pL + gap * i + gap / 2, pT + cH + 16);
  });

  canvas._data = data;
  canvas._pL = pL; canvas._gap = gap;
  canvas._pT = pT; canvas._cH = cH; canvas._maxH = maxH;
}

canvas.addEventListener('mousemove', e => {
  if (!canvas._data) return;
  const r = canvas.getBoundingClientRect();
  const idx = Math.floor((e.clientX - r.left - canvas._pL) / canvas._gap);
  if (idx < 0 || idx >= canvas._data.length) { hideTip(); return; }
  const d = canvas._data[idx];
  const h = Math.floor(d.hours), m = Math.round((d.hours % 1) * 60);
  showTip(e, \`<div class="tooltip-date">\${d.date} \${d.label}</div><div class="tooltip-row">time <span>\${h}h \${m}m</span></div><div class="tooltip-row">files <span>\${d.files}</span></div>\`);
});
canvas.addEventListener('mouseleave', hideTip);

document.querySelectorAll('[data-range]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-range]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const r = btn.dataset.range;
    if (r === 'all') { activeData = RAW_DAYS; }
    else {
      const cut = new Date(); cut.setDate(cut.getDate() - +r);
      activeData = RAW_DAYS.filter(d => new Date(d.date + 'T00:00:00') >= cut);
    }
    drawChart(activeData);
  });
});

document.getElementById('apply-range').addEventListener('click', () => {
  const f = document.getElementById('date-from').value;
  const t = document.getElementById('date-to').value;
  if (!f || !t) return;
  document.querySelectorAll('[data-range]').forEach(b => b.classList.remove('active'));
  activeData = RAW_DAYS.filter(d => {
    const dt = new Date(d.date + 'T00:00:00');
    return dt >= new Date(f + 'T00:00:00') && dt <= new Date(t + 'T23:59:59');
  });
  drawChart(activeData);
});

if (RAW_DAYS.length) {
  document.getElementById('date-from').value = RAW_DAYS[0].date;
  document.getElementById('date-to').value = RAW_DAYS[RAW_DAYS.length - 1].date;
}

drawChart(RAW_DAYS);
window.addEventListener('resize', () => drawChart(activeData));
</script>
</body>
</html>`;
  }

  private getDayStats(allData: DailyStats[]): DayStats[] {
    const dayMap: { [key: string]: DayStats } = {};
    allData.forEach((daily) => {
      const date = new Date(daily.date + "T00:00:00");
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      let totalSeconds = 0;
      const files = new Set<string>();
      daily.entries.forEach((e) => {
        totalSeconds += e.duration;
        files.add(e.file);
      });
      dayMap[daily.date] = {
        date: daily.date,
        day: days[date.getDay()],
        hours: Math.floor(totalSeconds / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        files: files.size,
        totalSeconds,
      };
    });
    return Object.values(dayMap).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  private getStreak(dayStats: DayStats[]): number {
    if (dayStats.length === 0) return 0;
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 3650; i++) {
      const check = new Date(today);
      check.setDate(check.getDate() - i);
      const str = check.toISOString().split("T")[0];
      if (dayStats.find((d) => d.date === str)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    return streak;
  }
}