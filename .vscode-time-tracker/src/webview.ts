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
      { enableScripts: true },
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
            `${daily.date},${this.escapeCsv(entry.file)},${this.escapeCsv(entry.language)},${entry.duration},${(entry.duration / 60).toFixed(1)}`,
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
      0,
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
      a.localeCompare(b),
    );

    const chartDays = [...dayStats].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    const chartDataJson = JSON.stringify(
      chartDays.map((d) => ({
        date: d.date,
        label: d.day,
        hours: +(d.hours + d.minutes / 60).toFixed(2),
        files: d.files,
        totalSeconds: d.totalSeconds,
      })),
    );

    const topFilesJson = JSON.stringify(
      topFiles.map((f) => ({
        file: f.file,
        language: f.language,
        duration: f.duration,
        label: this.stats.formatDuration(f.duration),
      })),
    );

    const languagesJson = JSON.stringify(
      languages.map((l) => ({
        language: l.language,
        duration: l.duration,
        label: this.stats.formatDuration(l.duration),
      })),
    );

    const weekdayJson = JSON.stringify(
      ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((labelPt, i) => ({
        labelPt,
        labelEn: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i],
        avgSeconds:
          weekdayCounts[i] > 0 ? weekdayTotals[i] / weekdayCounts[i] : 0,
        totalSeconds: weekdayTotals[i],
        days: weekdayCounts[i],
      })),
    );

    const monthDataJson = JSON.stringify(
      monthData.map(([month, secs]) => ({
        month,
        hours: +(secs / 3600).toFixed(1),
        label: new Date(month + "-01").toLocaleDateString("en", {
          month: "short",
          year: "2-digit",
        }),
      })),
    );

    const firstDate = chartDays.length > 0 ? chartDays[0].date : "—";
    const lastDate =
      chartDays.length > 0 ? chartDays[chartDays.length - 1].date : "—";

    return /* html */ `<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Heildamm</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;500;600;700;900&family=IBM+Plex+Mono:wght@300;400;500;600&display=swap');

:root {
  --p:      #9d6fd4;
  --p-lo:   rgba(157,111,212,0.08);
  --p-mid:  rgba(157,111,212,0.18);
  --p-hi:   rgba(157,111,212,0.35);
  --p-line: rgba(157,111,212,0.22);
  --accent: #c49ef0;
  --bg:     var(--vscode-editor-background);
  --fg:     var(--vscode-editor-foreground);
  --surf:   var(--vscode-sideBar-background, rgba(255,255,255,0.03));
  --bdr:    var(--vscode-panel-border, rgba(157,111,212,0.15));
  --muted:  var(--vscode-descriptionForeground);
  --mono:   'IBM Plex Mono', monospace;
  --cond:   'Barlow Condensed', sans-serif;
  --nav-w:  40px;
  --top-h:  44px;
  --bot-h:  26px;
}
.en { display: none; }
body.lang-pt .pt { display: revert; }
body.lang-pt .en { display: none; }
body.lang-en .pt { display: none; }
body.lang-en .en { display: revert; }

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
  border-bottom: 1px solid var(--bdr);
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 0 14px 0 10px;
  height: var(--top-h);
}
.logo {
  font-family: var(--cond);
  font-weight: 900; font-size: 19px; letter-spacing: 0.04em;
  color: var(--p); display: flex; align-items: baseline; gap: 8px;
  white-space: nowrap;
}
.logo-sub {
  font-size: 9px; font-weight: 400; font-family: var(--mono);
  color: var(--muted); letter-spacing: 0.16em; text-transform: uppercase;
}
.topbar-center { font-size: 10px; color: var(--muted); text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.topbar-actions { display: flex; gap: 5px; align-items: center; flex-shrink: 0; }
.lang-toggle { display: flex; border: 1px solid var(--bdr); border-radius: 3px; overflow: hidden; }
.lang-toggle .btn { border: none; border-radius: 0; padding: 3px 8px; font-size: 9px; letter-spacing: .06em; }
.lang-toggle .btn + .btn { border-left: 1px solid var(--bdr); }
.lang-toggle .btn.active { background: var(--p-mid); color: var(--p); }

/* ── BUTTONS ── */
.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 4px;
  padding: 3px 10px; min-height: 24px;
  border: 1px solid var(--bdr); border-radius: 3px;
  background: transparent; color: var(--muted);
  font-family: var(--mono); font-size: 10px; letter-spacing: 0.03em;
  cursor: pointer; transition: all .15s; white-space: nowrap;
}
.btn:hover  { border-color: var(--p); color: var(--p); background: var(--p-lo); }
.btn.active { border-color: var(--p); color: var(--p); background: var(--p-mid); }

/* ── SIDENAV ── */
.sidenav {
  position: fixed; left: 0; top: var(--top-h); bottom: 0; width: var(--nav-w);
  border-right: 1px solid var(--bdr);
  display: flex; flex-direction: column; align-items: center;
  padding: 10px 0; gap: 2px; z-index: 90; background: var(--bg);
}
.nav-item {
  width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
  border-radius: 4px; cursor: pointer; font-size: 13px;
  transition: all .15s; color: var(--muted);
  border: none; background: transparent; text-decoration: none;
}
.nav-item:hover, .nav-item.active { background: var(--p-mid); color: var(--p); }
.nav-divider { width: 18px; height: 1px; background: var(--bdr); margin: 3px 0; }

/* ── MAIN LAYOUT ── */
.main { margin-left: var(--nav-w); padding: 18px 20px calc(var(--bot-h) + 18px); min-width: 0; overflow-x: hidden; }

/* ── SECTION ── */
.section { margin-bottom: 28px; }
.section-label {
  font-size: 9px; font-weight: 600; letter-spacing: 0.2em;
  text-transform: uppercase; color: var(--muted);
  margin-bottom: 10px;
  display: flex; align-items: center; gap: 8px;
}
.section-label::after {
  content: ''; flex: 1; height: 1px; background: var(--bdr);
}

/* ── KPI STRIP ── */
.kpi-strip {
  display: grid;
  grid-template-columns: minmax(0,2fr) minmax(0,2fr) repeat(6, minmax(0,1fr));
  gap: 1px; background: var(--bdr);
  border: 1px solid var(--bdr);
  border-radius: 6px; overflow: hidden;
  margin-bottom: 24px;
}
.kpi {
  background: var(--bg);
  padding: 16px 12px 12px;
  position: relative; overflow: hidden;
  transition: background .15s;
  cursor: default; min-width: 0;
}
.kpi::before {
  content: ''; position: absolute;
  top: 0; left: 0; right: 0; height: 2px;
  background: transparent; transition: background .2s;
}
.kpi:hover { background: var(--p-lo); }
.kpi:hover::before { background: var(--p); }
.kpi-label {
  font-size: 9px; letter-spacing: 0.11em; text-transform: uppercase;
  color: var(--muted); margin-bottom: 8px; display: block; font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.kpi-value {
  font-family: var(--cond);
  font-size: 38px; font-weight: 900; line-height: 1;
  letter-spacing: -1px; color: var(--p);
  white-space: nowrap;
}
.kpi-value.fg { color: var(--fg); }
.kpi-unit {
  font-family: var(--cond);
  font-size: 16px; font-weight: 300;
  color: var(--muted); letter-spacing: 0;
  margin-left: 1px;
}
.kpi-sub { font-size: 10px; color: var(--muted); margin-top: 5px; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* ── CHART CARD ── */
.chart-card {
  border: 1px solid var(--bdr); border-radius: 6px; overflow: hidden;
}
.chart-toolbar {
  display: flex; align-items: center; gap: 4px;
  padding: 7px 10px; border-bottom: 1px solid var(--bdr);
  background: var(--surf); flex-wrap: wrap; row-gap: 4px;
}
.toolbar-sep { width: 1px; height: 14px; background: var(--bdr); margin: 0 3px; flex-shrink: 0; }
.date-range {
  display: flex; align-items: center; gap: 5px;
  margin-left: auto; font-size: 10px; color: var(--muted); flex-shrink: 0;
}
input[type="date"] {
  background: transparent; border: 1px solid var(--bdr); border-radius: 3px;
  padding: 2px 6px; color: var(--fg);
  font-family: var(--mono); font-size: 10px; outline: none;
}
input[type="date"]:focus { border-color: var(--p); }
.chart-area { padding: 14px 12px 8px; }
canvas { display: block; width: 100% !important; }
.chart-footer {
  display: flex; gap: 12px; padding: 7px 12px;
  border-top: 1px solid var(--bdr); background: var(--surf);
  font-size: 10px; color: var(--muted); align-items: center;
}
.legend-pip {
  width: 10px; height: 3px; border-radius: 2px;
  background: var(--p); display: inline-block; margin-right: 4px; flex-shrink: 0;
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
.grid-3 { display: grid; grid-template-columns: minmax(0,1.7fr) minmax(0,1fr) minmax(0,1.1fr); gap: 12px; }
.grid-2 { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: 12px; }

/* ── PANEL ── */
.panel {
  border: 1px solid var(--bdr); border-radius: 6px;
  overflow: hidden; display: flex; flex-direction: column; min-width: 0;
}
.panel-header {
  padding: 9px 12px; border-bottom: 1px solid var(--bdr);
  display: flex; align-items: center; justify-content: space-between;
  background: var(--surf); flex-shrink: 0; gap: 8px; min-width: 0;
}
.panel-title {
  font-family: var(--cond);
  font-size: 12px; font-weight: 700;
  letter-spacing: 0.08em; text-transform: uppercase;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.panel-meta { font-size: 10px; color: var(--p); white-space: nowrap; flex-shrink: 0; }
.panel-body { overflow-y: auto; flex: 1; }

/* ── FILE ROWS ── */
.file-row {
  display: grid; grid-template-columns: 20px minmax(0,1fr) auto;
  align-items: center; gap: 8px; padding: 7px 12px;
  border-bottom: 1px solid var(--bdr);
  transition: background .1s; cursor: default;
}
.file-row:last-child { border-bottom: none; }
.file-row:hover { background: var(--p-lo); }
.file-rank { font-size: 9px; color: var(--muted); text-align: right; font-feature-settings: "tnum"; flex-shrink: 0; }
.file-info { overflow: hidden; min-width: 0; }
.file-name {
  font-size: 11px; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; margin-bottom: 3px;
}
.bar-row { display: flex; align-items: center; gap: 5px; }
.bar-track { flex: 1; height: 2px; background: var(--bdr); border-radius: 1px; overflow: hidden; min-width: 0; }
.bar-fill { height: 100%; background: var(--p); border-radius: 1px; }
.bar-pct { font-size: 9px; color: var(--muted); width: 24px; text-align: right; font-feature-settings: "tnum"; flex-shrink: 0; }
.file-right { text-align: right; flex-shrink: 0; }
.file-time { font-size: 11px; font-weight: 500; color: var(--p); font-feature-settings: "tnum"; white-space: nowrap; }
.lang-tag {
  display: inline-block; margin-top: 2px;
  padding: 1px 5px; border-radius: 2px;
  background: var(--p-lo); color: var(--p);
  font-size: 9px; border: 1px solid var(--p-line);
}

/* ── LANGUAGE ROWS ── */
.lang-row {
  padding: 9px 12px; border-bottom: 1px solid var(--bdr);
  transition: background .1s; min-width: 0;
}
.lang-row:last-child { border-bottom: none; }
.lang-row:hover { background: var(--p-lo); }
.lang-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 5px; gap: 6px; }
.lang-name { font-size: 12px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lang-pct {
  font-family: var(--cond);
  font-size: 24px; font-weight: 900; line-height: 1;
  color: var(--p); font-feature-settings: "tnum"; flex-shrink: 0;
}
.lang-pct-unit { font-size: 13px; font-weight: 400; }
.lang-time { font-size: 9px; color: var(--muted); margin-top: 3px; }

/* ── WEEKDAY CHART ── */
.weekday-wrap { padding: 14px 12px; }
.weekday-bars {
  display: grid; grid-template-columns: repeat(7, minmax(0,1fr));
  gap: 4px; align-items: flex-end; height: 68px; margin-bottom: 0;
}
.wd-col { display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
.wd-bar {
  width: 100%; background: var(--p); border-radius: 2px 2px 0 0;
  min-height: 3px; transition: opacity .15s;
}
.wd-bar:hover { opacity: .6; }
.weekday-labels {
  display: grid; grid-template-columns: repeat(7, minmax(0,1fr));
  gap: 4px; margin-top: 6px;
}
.wd-lbl { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.wd-day { font-size: 9px; color: var(--muted); letter-spacing: .03em; }
.wd-val { font-size: 9px; color: var(--p); font-feature-settings: "tnum"; }
.peak-day-block { border-top: 1px solid var(--bdr); padding: 11px 12px; }
.peak-label { font-size: 9px; color: var(--muted); letter-spacing: .12em; text-transform: uppercase; margin-bottom: 5px; }
.peak-value { font-family: var(--cond); font-size: 34px; font-weight: 900; color: var(--p); line-height: 1; }
.peak-sub { font-size: 10px; color: var(--muted); margin-top: 3px; }

/* ── CALENDAR HEATMAP ── */
.cal-container { padding: 12px; overflow-x: auto; }
.cal-month-labels { position: relative; height: 14px; font-size: 9px; color: var(--muted); margin-bottom: 4px; margin-left: 16px; }
.cal-month-labels span { position: absolute; top: 0; letter-spacing: .04em; }
.cal-body { display: flex; gap: 3px; }
.cal-wd-labels { display: flex; flex-direction: column; gap: 3px; margin-right: 3px; flex-shrink: 0; }
.cal-wd-labels span { font-size: 9px; color: var(--muted); height: 11px; display: flex; align-items: center; }
.cal-grid { display: flex; gap: 3px; }
.cal-week { display: flex; flex-direction: column; gap: 3px; }
.cal-cell {
  width: 11px; height: 11px; border-radius: 2px;
  background: var(--bdr); transition: transform .12s; cursor: default; flex-shrink: 0;
}
.cal-cell:hover { transform: scale(1.5); z-index: 2; position: relative; }
.cal-cell.l1 { background: rgba(157,111,212,0.18); }
.cal-cell.l2 { background: rgba(157,111,212,0.38); }
.cal-cell.l3 { background: rgba(157,111,212,0.62); }
.cal-cell.l4 { background: var(--p); }
.cal-weekday-labels { display: flex; flex-direction: column; gap: 3px; margin-right: 4px; }

/* ── MONTH BARS ── */
.month-list { padding: 10px 12px 14px; }
.month-row { display: grid; grid-template-columns: 40px minmax(0,1fr) 46px; align-items: center; gap: 7px; padding: 3px 0; }
.month-label { font-size: 9px; color: var(--muted); text-align: right; letter-spacing: .05em; }
.month-val { font-size: 10px; color: var(--p); text-align: right; font-feature-settings: "tnum"; font-weight: 500; }

/* ── TOP DAYS TABLE ── */
.data-table { width: 100%; border-collapse: collapse; font-size: 11px; table-layout: fixed; }
.data-table th {
  text-align: left; font-size: 9px; letter-spacing: .1em; text-transform: uppercase;
  color: var(--muted); padding: 7px 12px; border-bottom: 1px solid var(--bdr);
  font-weight: 500; background: var(--surf); white-space: nowrap;
}
.data-table td { padding: 6px 12px; border-bottom: 1px solid var(--bdr); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: var(--p-lo); }
.td-right { text-align: right; color: var(--p); font-feature-settings: "tnum"; font-weight: 500; }
.td-muted { color: var(--muted); }

/* ── FOOTER ── */
.footer {
  position: fixed; bottom: 0; left: var(--nav-w); right: 0; height: var(--bot-h);
  background: var(--bg); border-top: 1px solid var(--bdr);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; font-size: 10px; color: var(--muted); z-index: 80;
}
.status-dot {
  width: 5px; height: 5px; border-radius: 50%; background: var(--p);
  display: inline-block; margin-right: 5px;
  animation: blink 2.4s ease-in-out infinite;
}
@keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: .2; } }

@media (max-width: 860px) {
  .kpi-strip { grid-template-columns: repeat(4, minmax(0,1fr)); }
  .grid-3 { grid-template-columns: minmax(0,1fr); }
  .grid-2 { grid-template-columns: minmax(0,1fr); }
  .date-range { display: none; }
}
@media (max-width: 540px) {
  .kpi-strip { grid-template-columns: repeat(2, minmax(0,1fr)); }
}
</style>
</head>
<body class="lang-pt">

<header class="topbar">
  <div class="logo">
    HEILDAMM
    <span class="logo-sub">
      <span class="pt">rastreador</span><span class="en">time tracker</span>
    </span>
  </div>
  <div class="topbar-center">${firstDate} → ${lastDate}</div>
  <div class="topbar-actions">
    <button class="btn" onclick="exportData('csv')">↓ CSV</button>
    <button class="btn" onclick="exportData('json')">↓ JSON</button>
    <div class="lang-toggle" style="margin-left:4px">
      <button class="btn active" id="btn-pt" onclick="setLang('pt')">PT</button>
      <button class="btn"        id="btn-en" onclick="setLang('en')">EN</button>
    </div>
  </div>
</header>

<nav class="sidenav">
  <a class="nav-item active" href="#overview" title="Overview">◈</a>
  <a class="nav-item" href="#activity" title="Atividade / Activity">▦</a>
  <div class="nav-divider"></div>
  <a class="nav-item" href="#breakdown" title="Breakdown">≡</a>
  <a class="nav-item" href="#heatmap" title="Heatmap">⊞</a>
  <a class="nav-item" href="#monthly" title="Mensal / Monthly">◫</a>
</nav>

<main class="main">

  <!-- KPI STRIP -->
  <div id="overview">
    <div class="kpi-strip">

      <div class="kpi">
        <span class="kpi-label pt">Total codado</span>
        <span class="kpi-label en">Total coded</span>
        <div class="kpi-value">${total.hours}<span class="kpi-unit"> h</span>&thinsp;${total.minutes}<span class="kpi-unit"> m</span></div>
        <div class="kpi-sub pt">em todas as sessões</div>
        <div class="kpi-sub en">across all sessions</div>
      </div>

      <div class="kpi">
        <span class="kpi-label pt">Hoje</span>
        <span class="kpi-label en">Today</span>
        <div class="kpi-value fg">${todayStats.hours}<span class="kpi-unit"> h</span>&thinsp;${todayStats.minutes}<span class="kpi-unit"> m</span></div>
        <div class="kpi-sub pt">${todayStats.fileCount} arquivos · ${todayStats.languageCount} lang</div>
        <div class="kpi-sub en">${todayStats.fileCount} files · ${todayStats.languageCount} lang</div>
      </div>

      <div class="kpi">
        <span class="kpi-label pt">Dias ativos</span>
        <span class="kpi-label en">Days active</span>
        <div class="kpi-value">${totalDays}</div>
        <div class="kpi-sub pt">dias únicos</div>
        <div class="kpi-sub en">unique days</div>
      </div>

      <div class="kpi">
        <span class="kpi-label pt">Sequência</span>
        <span class="kpi-label en">Streak</span>
        <div class="kpi-value">${streak}</div>
        <div class="kpi-sub pt">dias seguidos</div>
        <div class="kpi-sub en">days running</div>
      </div>

      <div class="kpi">
        <span class="kpi-label pt">Média / dia</span>
        <span class="kpi-label en">Avg / day</span>
        <div class="kpi-value fg">${Math.floor(avgHoursPerDay)}<span class="kpi-unit"> h</span></div>
        <div class="kpi-sub pt">${Math.round((avgHoursPerDay % 1) * 60)}m nos dias ativos</div>
        <div class="kpi-sub en">${Math.round((avgHoursPerDay % 1) * 60)}m on active days</div>
      </div>

      <div class="kpi">
        <span class="kpi-label pt">Dia pico</span>
        <span class="kpi-label en">Peak day</span>
        <div class="kpi-value">${busyDay ? busyDay.hours : 0}<span class="kpi-unit"> h</span></div>
        <div class="kpi-sub">${busyDay ? busyDay.date : "—"}</div>
      </div>

      <div class="kpi">
        <span class="kpi-label pt">Sessões</span>
        <span class="kpi-label en">Sessions</span>
        <div class="kpi-value fg">${totalEntries}</div>
        <div class="kpi-sub pt">sessões de arquivo</div>
        <div class="kpi-sub en">file sessions</div>
      </div>

      <div class="kpi">
        <span class="kpi-label pt">Linguagens</span>
        <span class="kpi-label en">Languages</span>
        <div class="kpi-value">${languages.length}</div>
        <div class="kpi-sub pt">detectadas</div>
        <div class="kpi-sub en">detected</div>
      </div>

    </div>
  </div>

  <!-- DAILY ACTIVITY CHART -->
  <div id="activity" class="section">
    <div class="section-label">
      <span class="pt">atividade diária</span><span class="en">daily activity</span>
    </div>
    <div class="chart-card">
      <div class="chart-toolbar">
        <button class="btn" data-range="7">7D</button>
        <button class="btn" data-range="14">14D</button>
        <button class="btn" data-range="30">30D</button>
        <button class="btn" data-range="90">90D</button>
        <button class="btn" data-range="180">6M</button>
        <button class="btn" data-range="365">1A</button>
        <button class="btn active" data-range="all"><span class="pt">Tudo</span><span class="en">All</span></button>
        <div class="toolbar-sep"></div>
        <div class="date-range">
          <span class="pt">de</span><span class="en">from</span>
          <input type="date" id="date-from"/>
          <span class="pt">até</span><span class="en">to</span>
          <input type="date" id="date-to"/>
          <button class="btn" id="apply-range"><span class="pt">aplicar</span><span class="en">apply</span></button>
        </div>
      </div>
      <div class="chart-area">
        <canvas id="main-chart" height="200"></canvas>
      </div>
      <div class="chart-footer">
        <span><span class="legend-pip"></span><span class="pt">horas por dia</span><span class="en">hours per day</span></span>
        <span style="opacity:.45">— <span class="pt">média</span><span class="en">avg</span></span>
        <span style="margin-left:auto" id="chart-summary"></span>
      </div>
    </div>
  </div>

  <!-- BREAKDOWN -->
  <div id="breakdown" class="section">
    <div class="section-label">breakdown</div>
    <div class="grid-3">

      <div class="panel" style="max-height:460px">
        <div class="panel-header">
          <span class="panel-title pt">Top Arquivos</span>
          <span class="panel-title en">Top Files</span>
          <span class="panel-meta" id="files-count"></span>
        </div>
        <div class="panel-body" id="files-list"></div>
      </div>

      <div class="panel" style="max-height:460px">
        <div class="panel-header">
          <span class="panel-title pt">Linguagens</span>
          <span class="panel-title en">Languages</span>
          <span class="panel-meta" id="lang-count"></span>
        </div>
        <div class="panel-body" id="lang-list"></div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <span class="panel-title pt">Por Dia da Semana</span>
          <span class="panel-title en">By Weekday</span>
          <span class="panel-meta pt">média</span>
          <span class="panel-meta en">avg</span>
        </div>
        <div class="weekday-wrap">
          <div class="weekday-bars" id="weekday-bars"></div>
          <div class="weekday-labels" id="weekday-labels"></div>
        </div>
        <div class="peak-day-block" id="peak-day"></div>
      </div>

    </div>
  </div>

  <!-- HEATMAP -->
  <div id="heatmap" class="section">
    <div class="section-label" style="justify-content:space-between;gap:12px">
      <span style="font-size:9px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:var(--muted);white-space:nowrap">
        <span class="pt">mapa de calor</span><span class="en">contribution heatmap</span>
      </span>
      <span style="display:flex;align-items:center;gap:3px;font-size:9px;color:var(--muted);flex-shrink:0">
        <span class="pt">menos</span><span class="en">less</span>
        <span style="width:10px;height:10px;background:var(--bdr);border-radius:2px;display:inline-block"></span>
        <span style="width:10px;height:10px;background:rgba(157,111,212,0.18);border-radius:2px;display:inline-block"></span>
        <span style="width:10px;height:10px;background:rgba(157,111,212,0.38);border-radius:2px;display:inline-block"></span>
        <span style="width:10px;height:10px;background:rgba(157,111,212,0.62);border-radius:2px;display:inline-block"></span>
        <span style="width:10px;height:10px;background:var(--p);border-radius:2px;display:inline-block"></span>
        <span class="pt">mais</span><span class="en">more</span>
      </span>
    </div>
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title pt">Visão de 52 semanas</span>
        <span class="panel-title en">52-week view</span>
        <span class="panel-meta" id="cal-meta"></span>
      </div>
      <div class="cal-container">
        <div class="cal-month-labels" id="cal-months"></div>
        <div class="cal-body">
          <div class="cal-wd-labels" id="cal-wd-labels"></div>
          <div class="cal-grid" id="cal-grid"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- MONTHLY + TOP DAYS -->
  <div id="monthly" class="section">
    <div class="section-label">
      <span class="pt">mensal &amp; top dias</span><span class="en">monthly &amp; top days</span>
    </div>
    <div class="grid-2">

      <div class="panel">
        <div class="panel-header">
          <span class="panel-title pt">Horas por mês</span>
          <span class="panel-title en">Hours per month</span>
          <span class="panel-meta" id="months-range"></span>
        </div>
        <div class="month-list" id="month-bars"></div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <span class="panel-title pt">Top 15 dias</span>
          <span class="panel-title en">Top 15 days</span>
          <span class="panel-meta pt">todos os tempos</span>
          <span class="panel-meta en">all time</span>
        </div>
        <div class="panel-body" style="max-height:360px">
          <table class="data-table" style="table-layout:fixed">
            <colgroup>
              <col style="width:28px">
              <col style="width:auto">
              <col style="width:36px">
              <col style="width:68px">
              <col style="width:44px">
            </colgroup>
            <thead>
              <tr>
                <th>#</th>
                <th><span class="pt">Data</span><span class="en">Date</span></th>
                <th><span class="pt">Dia</span><span class="en">Day</span></th>
                <th style="text-align:right"><span class="pt">Tempo</span><span class="en">Time</span></th>
                <th style="text-align:right"><span class="pt">Arq.</span><span class="en">Files</span></th>
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
  <span>
    <span class="status-dot"></span>
    ${totalDays} <span class="pt">dias</span><span class="en">days</span> ·
    ${totalEntries} <span class="pt">sessões</span><span class="en">sessions</span> ·
    ${languages.length} <span class="pt">linguagens</span><span class="en">languages</span>
  </span>
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

const DAYS_PT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const DAYS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
let LANG = 'pt';

document.getElementById('footer-clock').textContent = new Date().toLocaleTimeString();

const vscode = acquireVsCodeApi();
function exportData(f) { vscode.postMessage({ command: 'export', format: f }); }

function setLang(lang) {
  LANG = lang;
  document.body.className = 'lang-' + lang;
  document.getElementById('btn-pt').classList.toggle('active', lang === 'pt');
  document.getElementById('btn-en').classList.toggle('active', lang === 'en');
  renderWeekdays();
  renderPeakDay();
  renderTopDays();
  updateCalMeta();
  redrawChartSummary();
}

function getDayName(dateStr) {
  const dow = new Date(dateStr + 'T00:00:00').getDay();
  return LANG === 'pt' ? DAYS_PT[dow] : DAYS_EN[dow];
}

function fmtSecs(s) {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? h + 'h ' + m + 'm' : m + 'm';
}

// Tooltip
const tt = document.getElementById('tt');
function showTip(e, html) {
  tt.innerHTML = html;
  const x = Math.min(e.clientX + 14, window.innerWidth - 170);
  const y = Math.max(e.clientY - 10, 8);
  tt.style.left = x + 'px';
  tt.style.top  = y + 'px';
  tt.classList.add('on');
}
function hideTip() { tt.classList.remove('on'); }

// ── FILES ──────────────────────────────────────────
(function () {
  const maxD = Math.max(...TOP_FILES.map(f => f.duration), 1);
  document.getElementById('files-count').textContent = TOP_FILES.length;
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
  document.getElementById('lang-count').textContent = LANGUAGES.length;
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
function renderWeekdays() {
  const maxAvg = Math.max(...WEEKDAYS.map(w => w.avgSeconds), 1);
  const barsEl   = document.getElementById('weekday-bars');
  const labelsEl = document.getElementById('weekday-labels');
  barsEl.innerHTML = ''; labelsEl.innerHTML = '';

  WEEKDAYS.forEach(w => {
    const h     = Math.round(w.avgSeconds / maxAvg * 100);
    const label = LANG === 'pt' ? w.labelPt : w.labelEn;

    const col = document.createElement('div');
    col.className = 'wd-col';
    col.innerHTML = \`<div class="wd-bar" style="height:\${h}%"></div>\`;
    col.addEventListener('mouseenter', e => {
      const avgLbl  = LANG === 'pt' ? 'média'   : 'avg';
      const sessLbl = LANG === 'pt' ? 'sessões' : 'sessions';
      showTip(e, \`<div class="tooltip-date">\${label}</div><div class="tooltip-row">\${avgLbl} <span>\${fmtSecs(w.avgSeconds)}</span></div><div class="tooltip-row">\${sessLbl} <span>\${w.days}</span></div>\`);
    });
    col.addEventListener('mouseleave', hideTip);
    barsEl.appendChild(col);

    const lbl = document.createElement('div');
    lbl.className = 'wd-lbl';
    lbl.innerHTML = \`<span class="wd-day">\${label.slice(0,2)}</span><span class="wd-val">\${fmtSecs(w.avgSeconds)}</span>\`;
    labelsEl.appendChild(lbl);
  });
}
renderWeekdays();

function renderPeakDay() {
  const best    = WEEKDAYS.reduce((a, b) => b.avgSeconds > a.avgSeconds ? b : a, WEEKDAYS[0]);
  const label   = LANG === 'pt' ? best.labelPt : best.labelEn;
  const title   = LANG === 'pt' ? 'Dia pico da semana' : 'Peak weekday';
  const avgLbl  = LANG === 'pt' ? 'média'   : 'avg';
  const sessLbl = LANG === 'pt' ? 'sessões' : 'sessions';
  document.getElementById('peak-day').innerHTML = \`
    <div class="peak-label">\${title}</div>
    <div class="peak-value">\${label}</div>
    <div class="peak-sub">\${avgLbl} \${fmtSecs(best.avgSeconds)} · \${best.days} \${sessLbl}</div>\`;
}
renderPeakDay();

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
function renderTopDays() {
  const sorted = [...RAW_DAYS].sort((a, b) => b.hours - a.hours).slice(0, 15);
  document.getElementById('top-days-body').innerHTML = sorted.map((d, i) => {
    const dow = getDayName(d.date);
    const h = Math.floor(d.hours), m = Math.round((d.hours % 1) * 60);
    return \`<tr>
      <td class="td-muted">\${i + 1}</td>
      <td>\${d.date}</td>
      <td class="td-muted">\${dow}</td>
      <td class="td-right">\${h}h \${m}m</td>
      <td class="td-right">\${d.files}</td>
    </tr>\`;
  }).join('');
}
renderTopDays();

// ── CALENDAR HEATMAP ───────────────────────────────
let _calActiveDays = 0;
function updateCalMeta() {
  document.getElementById('cal-meta').textContent =
    LANG === 'pt' ? _calActiveDays + ' dias ativos' : _calActiveDays + ' active days';
}

(function () {
  const dayMap = {};
  RAW_DAYS.forEach(d => { dayMap[d.date] = d.hours; });
  const vals = Object.values(dayMap).filter(v => v > 0);
  const maxH = vals.length ? Math.max(...vals) : 1;
  _calActiveDays = vals.length;

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

  const grid     = document.getElementById('cal-grid');
  const monthsEl = document.getElementById('cal-months');
  const wdEl     = document.getElementById('cal-wd-labels');

  ['M', '', 'W', '', 'F', '', ''].forEach(l => {
    const s = document.createElement('span');
    s.textContent = l;
    wdEl.appendChild(s);
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
      const h  = dayMap[ds] || 0;
      const cell = document.createElement('div');
      cell.className = 'cal-cell ' + lvl(h);
      cell.addEventListener('mouseenter', e => {
        const coded = LANG === 'pt' ? 'h codadas' : 'h coded';
        const none  = LANG === 'pt' ? 'sem atividade' : 'no activity';
        showTip(e, \`<div class="tooltip-date">\${ds}</div><div class="tooltip-row">\${h > 0 ? h.toFixed(1) + coded : none}</div>\`);
      });
      cell.addEventListener('mouseleave', hideTip);
      wk.appendChild(cell);
      d.setDate(d.getDate() + 1);
      if (d > today) break;
    }
    grid.appendChild(wk);
    weekIdx++;
  }
  updateCalMeta();
})();

function redrawChartSummary() {
  const el = document.getElementById('chart-summary');
  if (!el.dataset.total) return;
  const t = el.dataset.total, a = el.dataset.avg;
  el.textContent = LANG === 'pt'
    ? 'total ' + t + 'h · média ' + a + 'h/dia'
    : 'total ' + t + 'h · avg '   + a + 'h/day';
}

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
  summaryEl.dataset.total = totalH.toFixed(1);
  summaryEl.dataset.avg   = avgH.toFixed(1);
  redrawChartSummary();

  const dpr = window.devicePixelRatio || 1;
  const W = canvas.parentElement.clientWidth - 24;
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
  showTip(e, \`<div class="tooltip-date">\${d.date} \${d.label}</div><div class="tooltip-row">\${LANG==='pt'?'tempo':'time'} <span>\${h}h \${m}m</span></div><div class="tooltip-row">\${LANG==='pt'?'arquivos':'files'} <span>\${d.files}</span></div>\`);
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
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
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
