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
      (s, d) => s + d.entries.reduce((ss, e) => ss + e.duration, 0), 0
    );
    const totalEntries = allData.reduce((s, d) => s + d.entries.length, 0);
    const avgHoursPerDay =
      totalDays > 0 ? (total.hours + total.minutes / 60) / totalDays : 0;
    const busyDay =
      dayStats.length > 0
        ? [...dayStats].sort((a, b) => b.totalSeconds - a.totalSeconds)[0]
        : null;
    const streak = this.getStreak(dayStats);

    // Weekday distribution
    const weekdayTotals = [0, 0, 0, 0, 0, 0, 0];
    const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
    dayStats.forEach((d) => {
      const dow = new Date(d.date + "T00:00:00").getDay();
      weekdayTotals[dow] += d.totalSeconds;
      weekdayCounts[dow]++;
    });

    // Month aggregation
    const monthMap: Record<string, number> = {};
    dayStats.forEach((d) => {
      const m = d.date.slice(0, 7);
      monthMap[m] = (monthMap[m] || 0) + d.totalSeconds;
    });
    const monthData = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b));

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
        avgSeconds: weekdayCounts[i] > 0 ? weekdayTotals[i] / weekdayCounts[i] : 0,
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
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;900&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

:root {
  --p: #8e61c6;
  --p-dim: rgba(142,97,198,0.12);
  --p-glow: rgba(142,97,198,0.3);
  --p-bright: #b48ce0;
  --bg: var(--vscode-editor-background);
  --fg: var(--vscode-editor-foreground);
  --border: var(--vscode-panel-border);
  --muted: var(--vscode-descriptionForeground);
  --badge: var(--vscode-badge-background);
}

*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{
  font-family:'IBM Plex Mono',monospace;
  background:var(--bg);
  color:var(--fg);
  font-size:12px;
  line-height:1.5;
}

/* TOPBAR */
.topbar{
  position:sticky;top:0;z-index:100;
  background:var(--bg);
  border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;
  padding:0 24px;height:46px;
}
.logo{
  font-family:'Barlow Condensed',sans-serif;
  font-weight:900;font-size:22px;letter-spacing:-0.5px;
  color:var(--p);display:flex;align-items:baseline;gap:8px;
}
.logo-sub{
  font-size:9px;font-weight:400;font-family:'IBM Plex Mono',monospace;
  color:var(--muted);letter-spacing:0.14em;text-transform:uppercase;
}
.topbar-right{display:flex;gap:6px;align-items:center;}

/* PILLS */
.pill{
  display:inline-flex;align-items:center;gap:4px;
  padding:4px 10px;border:1px solid var(--border);border-radius:20px;
  background:transparent;color:var(--muted);
  font-family:'IBM Plex Mono',monospace;font-size:10px;
  cursor:pointer;transition:all .15s;letter-spacing:0.03em;
}
.pill:hover{border-color:var(--p);color:var(--p);}
.pill.active{border-color:var(--p);color:var(--p);background:var(--p-dim);}
.pill-solid{background:var(--p);color:#fff;border-color:var(--p);font-weight:600;}
.pill-solid:hover{opacity:.85;color:#fff;}

/* SIDENAV */
.sidenav{
  position:fixed;left:0;top:46px;bottom:0;width:44px;
  border-right:1px solid var(--border);
  display:flex;flex-direction:column;align-items:center;
  padding:12px 0;gap:4px;z-index:90;background:var(--bg);
}
.nav-btn{
  width:32px;height:32px;display:flex;align-items:center;justify-content:center;
  border-radius:6px;cursor:pointer;font-size:14px;
  transition:all .15s;color:var(--muted);
  border:none;background:transparent;text-decoration:none;
}
.nav-btn:hover,.nav-btn.active{background:var(--p-dim);color:var(--p);}

/* MAIN */
.main{margin-left:44px;padding:24px 28px 60px;max-width:1400px;}

/* SECTION */
.section{margin-bottom:36px;}
.sec-head{
  display:flex;align-items:baseline;justify-content:space-between;
  margin-bottom:14px;
}
.sec-title{
  font-family:'Barlow Condensed',sans-serif;
  font-size:10px;font-weight:700;
  letter-spacing:0.2em;text-transform:uppercase;color:var(--muted);
}
.sec-meta{font-size:10px;color:var(--muted);}

/* HERO KPI STRIP */
.hero-strip{
  display:grid;grid-template-columns:repeat(8,1fr);
  gap:1px;background:var(--border);
  border:1px solid var(--border);border-radius:8px;overflow:hidden;
  margin-bottom:32px;
}
.hero-kpi{
  background:var(--bg);padding:16px 14px 12px;
  position:relative;overflow:hidden;transition:background .15s;
}
.hero-kpi::after{
  content:'';position:absolute;top:0;left:0;right:0;height:2px;
  background:transparent;transition:background .2s;
}
.hero-kpi:hover{background:var(--p-dim);}
.hero-kpi:hover::after{background:var(--p);}
.kpi-label{
  font-size:9px;letter-spacing:0.12em;text-transform:uppercase;
  color:var(--muted);margin-bottom:8px;display:block;
}
.kpi-number{
  font-family:'Barlow Condensed',sans-serif;
  font-size:40px;font-weight:900;line-height:1;
  letter-spacing:-2px;color:var(--p);
}
.kpi-number.fg{color:var(--fg);}
.kpi-unit{
  font-family:'Barlow Condensed',sans-serif;
  font-size:17px;font-weight:400;letter-spacing:0;color:var(--muted);
}
.kpi-sub{font-size:10px;color:var(--muted);margin-top:5px;}

/* CHART CARD */
.chart-card{border:1px solid var(--border);border-radius:8px;overflow:hidden;}
.chart-toolbar{
  display:flex;align-items:center;gap:5px;
  padding:8px 14px;border-bottom:1px solid var(--border);flex-wrap:wrap;
}
.sep{width:1px;height:16px;background:var(--border);margin:0 4px;}
.range-custom{
  display:flex;align-items:center;gap:5px;
  margin-left:auto;font-size:10px;color:var(--muted);
}
input[type="date"]{
  background:transparent;border:1px solid var(--border);border-radius:4px;
  padding:3px 6px;color:var(--fg);
  font-family:'IBM Plex Mono',monospace;font-size:10px;
}
.chart-body{padding:14px 14px 8px;position:relative;}
canvas{display:block;width:100%;}
.chart-legend{
  display:flex;gap:16px;padding:8px 14px;
  border-top:1px solid var(--border);font-size:10px;color:var(--muted);
}
.legend-dot{
  width:8px;height:8px;border-radius:2px;
  background:var(--p);display:inline-block;margin-right:4px;
}

/* TOOLTIP */
.tooltip{
  position:fixed;
  background:var(--vscode-editorWidget-background,#1e1e1e);
  border:1px solid var(--p);border-radius:6px;
  padding:10px 14px;font-family:'IBM Plex Mono',monospace;font-size:11px;
  pointer-events:none;opacity:0;transition:opacity .1s;
  z-index:9999;line-height:1.9;min-width:160px;
  box-shadow:0 4px 20px var(--p-glow);
}
.tooltip.on{opacity:1;}
.tooltip strong{color:var(--p);}

/* GRID */
.grid-3{display:grid;grid-template-columns:1.8fr 1fr 1fr;gap:16px;}
.grid-2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}

/* PANEL */
.panel{
  border:1px solid var(--border);border-radius:8px;
  overflow:hidden;display:flex;flex-direction:column;
}
.panel-head{
  padding:10px 14px;border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;flex-shrink:0;
}
.panel-title{
  font-family:'Barlow Condensed',sans-serif;
  font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;
}
.panel-badge{
  font-size:10px;color:var(--p);
  background:var(--p-dim);padding:1px 7px;border-radius:10px;
}
.panel-scroll{overflow-y:auto;flex:1;}
.panel-scroll::-webkit-scrollbar{width:3px;}
.panel-scroll::-webkit-scrollbar-thumb{background:var(--p-dim);border-radius:2px;}

/* FILE ROWS */
.file-row{
  display:grid;grid-template-columns:22px 1fr auto;
  align-items:center;gap:10px;padding:7px 14px;
  border-bottom:1px solid var(--border);
  transition:background .1s;
}
.file-row:last-child{border-bottom:none;}
.file-row:hover{background:var(--p-dim);}
.file-rank{font-size:9px;color:var(--muted);text-align:right;font-feature-settings:"tnum";}
.file-center{overflow:hidden;}
.file-name{font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;}
.file-bar-row{display:flex;align-items:center;gap:5px;}
.bar-bg{flex:1;height:2px;background:var(--border);border-radius:1px;overflow:hidden;}
.bar-fill{height:100%;background:var(--p);border-radius:1px;}
.bar-fill.alt{background:var(--p-bright);}
.bar-pct{font-size:9px;color:var(--muted);width:28px;text-align:right;font-feature-settings:"tnum";}
.file-right{text-align:right;flex-shrink:0;}
.file-dur{font-size:11px;font-weight:500;white-space:nowrap;color:var(--p);font-feature-settings:"tnum";}
.lang-badge{
  display:inline-block;margin-top:2px;padding:1px 5px;border-radius:2px;
  background:var(--p-dim);color:var(--p);font-size:9px;
}

/* LANG ROWS */
.lang-row{padding:9px 14px;border-bottom:1px solid var(--border);transition:background .1s;}
.lang-row:last-child{border-bottom:none;}
.lang-row:hover{background:var(--p-dim);}
.lang-header{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;}
.lang-name{font-size:12px;font-weight:500;}
.lang-right{display:flex;align-items:baseline;gap:8px;}
.lang-pct-big{
  font-family:'Barlow Condensed',sans-serif;
  font-size:22px;font-weight:900;line-height:1;color:var(--p);font-feature-settings:"tnum";
}
.lang-time{font-size:9px;color:var(--muted);margin-top:3px;}

/* WEEKDAY */
.weekday-grid{
  display:grid;grid-template-columns:repeat(7,1fr);
  gap:6px;padding:14px;
}
.wd-col{display:flex;flex-direction:column;align-items:center;gap:4px;}
.wd-bar-wrap{width:100%;height:60px;display:flex;align-items:flex-end;}
.wd-bar{
  width:100%;background:var(--p);border-radius:2px 2px 0 0;
  min-height:2px;transition:opacity .2s;
}
.wd-bar:hover{opacity:.65;}
.wd-label{font-size:9px;color:var(--muted);letter-spacing:.05em;}
.wd-val{font-size:9px;color:var(--p);font-feature-settings:"tnum";}

/* MONTH LIST */
.month-list{padding:10px 14px 14px;}
.month-row{
  display:grid;grid-template-columns:38px 1fr 54px;
  align-items:center;gap:8px;padding:3px 0;
}
.month-label{font-size:9px;color:var(--muted);letter-spacing:.06em;text-align:right;}
.month-val{font-size:10px;color:var(--p);text-align:right;font-feature-settings:"tnum";}

/* TOP DAYS TABLE */
.stat-table{width:100%;border-collapse:collapse;font-size:11px;}
.stat-table th{
  text-align:left;font-size:9px;letter-spacing:.1em;text-transform:uppercase;
  color:var(--muted);padding:8px 14px;border-bottom:1px solid var(--border);font-weight:400;
}
.stat-table td{padding:7px 14px;border-bottom:1px solid var(--border);}
.stat-table tr:last-child td{border-bottom:none;}
.stat-table tr:hover td{background:var(--p-dim);}
.td-num{text-align:right;color:var(--p);font-feature-settings:"tnum";font-weight:500;}

/* CALENDAR */
.cal-wrap{padding:12px 14px;overflow-x:auto;}
.cal-grid{display:flex;gap:3px;}
.cal-week{display:flex;flex-direction:column;gap:3px;}
.cal-day{
  width:10px;height:10px;border-radius:2px;
  background:var(--border);transition:transform .1s;cursor:default;
}
.cal-day:hover{transform:scale(1.5);}
.cal-day.l1{background:rgba(142,97,198,0.2);}
.cal-day.l2{background:rgba(142,97,198,0.45);}
.cal-day.l3{background:rgba(142,97,198,0.7);}
.cal-day.l4{background:#8e61c6;}

/* FOOTER */
.footer{
  position:fixed;bottom:0;left:44px;right:0;height:28px;
  background:var(--bg);border-top:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;
  padding:0 20px;font-size:10px;color:var(--muted);z-index:80;
}
.dot{
  width:6px;height:6px;border-radius:50%;background:var(--p);
  display:inline-block;margin-right:5px;animation:pulse 2s infinite;
}
@keyframes pulse{0%,100%{opacity:1;}50%{opacity:.25;}}

::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-thumb{background:var(--border);border-radius:2px;}

@media(max-width:900px){
  .hero-strip{grid-template-columns:repeat(4,1fr);}
  .grid-3,.grid-2{grid-template-columns:1fr;}
}
</style>
</head>
<body>

<header class="topbar">
  <div class="logo">HEILDAMM <span class="logo-sub">time tracker</span></div>
  <div class="topbar-right">
    <span style="font-size:10px;color:var(--muted);margin-right:4px">${firstDate} → ${lastDate}</span>
    <button class="pill" onclick="exportData('csv')">↓ CSV</button>
    <button class="pill" onclick="exportData('json')">↓ JSON</button>
    <button class="pill pill-solid" onclick="location.reload()">↺ Refresh</button>
  </div>
</header>

<nav class="sidenav">
  <a class="nav-btn active" href="#kpis" title="Overview">◈</a>
  <a class="nav-btn" href="#chart" title="Chart">▦</a>
  <a class="nav-btn" href="#breakdown" title="Files">≡</a>
  <a class="nav-btn" href="#calendar" title="Heatmap">⊞</a>
  <a class="nav-btn" href="#months" title="Monthly">◫</a>
</nav>

<main class="main">

  <!-- KPI STRIP -->
  <div id="kpis" class="hero-strip">
    <div class="hero-kpi">
      <span class="kpi-label">Total Time</span>
      <div class="kpi-number">${total.hours}<span class="kpi-unit">h</span>${total.minutes}<span class="kpi-unit">m</span></div>
      <div class="kpi-sub">all time</div>
    </div>
    <div class="hero-kpi">
      <span class="kpi-label">Today</span>
      <div class="kpi-number fg">${todayStats.hours}<span class="kpi-unit">h</span>${todayStats.minutes}<span class="kpi-unit">m</span></div>
      <div class="kpi-sub">${todayStats.fileCount} files · ${todayStats.languageCount} lang</div>
    </div>
    <div class="hero-kpi">
      <span class="kpi-label">Days Active</span>
      <div class="kpi-number">${totalDays}</div>
      <div class="kpi-sub">unique days</div>
    </div>
    <div class="hero-kpi">
      <span class="kpi-label">Streak</span>
      <div class="kpi-number">${streak}</div>
      <div class="kpi-sub">days running</div>
    </div>
    <div class="hero-kpi">
      <span class="kpi-label">Avg / Day</span>
      <div class="kpi-number fg">${Math.floor(avgHoursPerDay)}<span class="kpi-unit">h</span>${Math.round((avgHoursPerDay % 1) * 60)}<span class="kpi-unit">m</span></div>
      <div class="kpi-sub">on active days</div>
    </div>
    <div class="hero-kpi">
      <span class="kpi-label">Busiest Day</span>
      <div class="kpi-number">${busyDay ? busyDay.hours : 0}<span class="kpi-unit">h</span></div>
      <div class="kpi-sub">${busyDay ? busyDay.date : "—"}</div>
    </div>
    <div class="hero-kpi">
      <span class="kpi-label">Entries</span>
      <div class="kpi-number fg">${totalEntries}</div>
      <div class="kpi-sub">file sessions</div>
    </div>
    <div class="hero-kpi">
      <span class="kpi-label">Languages</span>
      <div class="kpi-number">${languages.length}</div>
      <div class="kpi-sub">detected</div>
    </div>
  </div>

  <!-- CHART -->
  <div id="chart" class="section">
    <div class="sec-head">
      <span class="sec-title">Daily Activity</span>
      <span class="sec-meta" id="chart-meta"></span>
    </div>
    <div class="chart-card">
      <div class="chart-toolbar">
        <button class="pill" data-range="7">7D</button>
        <button class="pill" data-range="14">14D</button>
        <button class="pill" data-range="30">30D</button>
        <button class="pill" data-range="90">90D</button>
        <button class="pill" data-range="180">6M</button>
        <button class="pill" data-range="365">1Y</button>
        <button class="pill active" data-range="all">ALL</button>
        <div class="sep"></div>
        <div class="range-custom">
          <span>from</span>
          <input type="date" id="date-from"/>
          <span>to</span>
          <input type="date" id="date-to"/>
          <button class="pill" id="apply-range">apply</button>
        </div>
      </div>
      <div class="chart-body">
        <canvas id="main-chart" height="190"></canvas>
      </div>
      <div class="chart-legend">
        <span><span class="legend-dot"></span>hours coded per day</span>
        <span style="margin-left:auto;color:var(--muted)" id="chart-summary"></span>
      </div>
    </div>
  </div>

  <!-- BREAKDOWN -->
  <div id="breakdown" class="section">
    <div class="sec-head"><span class="sec-title">Breakdown</span></div>
    <div class="grid-3">
      <div class="panel" style="max-height:460px">
        <div class="panel-head">
          <span class="panel-title">Top Files</span>
          <span class="panel-badge" id="files-count"></span>
        </div>
        <div class="panel-scroll" id="files-list"></div>
      </div>
      <div class="panel" style="max-height:460px">
        <div class="panel-head">
          <span class="panel-title">Languages</span>
          <span class="panel-badge" id="lang-count"></span>
        </div>
        <div class="panel-scroll" id="lang-list"></div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <span class="panel-title">By Weekday</span>
          <span class="sec-meta">avg</span>
        </div>
        <div class="weekday-grid" id="weekday-grid"></div>
        <div style="border-top:1px solid var(--border);padding:12px 14px" id="weekday-best"></div>
      </div>
    </div>
  </div>

  <!-- CALENDAR -->
  <div id="calendar" class="section">
    <div class="sec-head">
      <span class="sec-title">Contribution Heatmap</span>
      <div style="display:flex;align-items:center;gap:4px;font-size:9px;color:var(--muted)">
        less
        <span style="width:9px;height:9px;background:var(--border);border-radius:2px;display:inline-block"></span>
        <span style="width:9px;height:9px;background:rgba(142,97,198,0.2);border-radius:2px;display:inline-block"></span>
        <span style="width:9px;height:9px;background:rgba(142,97,198,0.45);border-radius:2px;display:inline-block"></span>
        <span style="width:9px;height:9px;background:rgba(142,97,198,0.7);border-radius:2px;display:inline-block"></span>
        <span style="width:9px;height:9px;background:#8e61c6;border-radius:2px;display:inline-block"></span>
        more
      </div>
    </div>
    <div class="panel">
      <div class="panel-head">
        <span class="panel-title">52 Week View</span>
        <span class="sec-meta" id="cal-stats"></span>
      </div>
      <div class="cal-wrap">
        <div style="display:flex;gap:0;margin-bottom:5px;font-size:9px;color:var(--muted);position:relative;height:14px" id="cal-months"></div>
        <div class="cal-grid" id="cal-grid"></div>
        <div style="display:flex;gap:0;margin-top:5px;font-size:9px;color:var(--muted)" id="cal-weekdays">
          <span style="height:10px;display:flex;align-items:center;margin-bottom:3px;margin-right:13px">M</span>
          <span style="height:10px;display:flex;align-items:center;margin-bottom:3px;margin-right:13px"> </span>
          <span style="height:10px;display:flex;align-items:center;margin-bottom:3px;margin-right:13px">W</span>
          <span style="height:10px;display:flex;align-items:center;margin-bottom:3px;margin-right:13px"> </span>
          <span style="height:10px;display:flex;align-items:center">F</span>
        </div>
      </div>
    </div>
  </div>

  <!-- MONTHLY + TOP DAYS -->
  <div id="months" class="section">
    <div class="sec-head">
      <span class="sec-title">Monthly &amp; Top Days</span>
      <span class="sec-meta" id="months-range"></span>
    </div>
    <div class="grid-2">
      <div class="panel">
        <div class="panel-head"><span class="panel-title">Hours per Month</span></div>
        <div class="month-list" id="month-bars"></div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <span class="panel-title">Top Days — All Time</span>
          <span class="sec-meta">top 15</span>
        </div>
        <div class="panel-scroll" style="max-height:360px">
          <table class="stat-table">
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
  <span><span class="dot"></span>heildamm · ${totalDays} days · ${totalEntries} sessions · ${languages.length} languages</span>
  <span id="footer-time"></span>
</footer>

<div class="tooltip" id="tt"></div>

<script>
const RAW_DAYS   = ${chartDataJson};
const TOP_FILES  = ${topFilesJson};
const LANGUAGES  = ${languagesJson};
const WEEKDAYS   = ${weekdayJson};
const MONTH_DATA = ${monthDataJson};
const TOTAL_SECS = ${totalSeconds};

document.getElementById('footer-time').textContent = new Date().toLocaleString();

const vscode = acquireVsCodeApi();
function exportData(f){ vscode.postMessage({command:'export',format:f}); }

function fmtH(secs){
  const h=Math.floor(secs/3600), m=Math.floor((secs%3600)/60);
  return h>0 ? h+'h '+m+'m' : m+'m';
}

const tt = document.getElementById('tt');
function showTip(e, html){
  tt.innerHTML = html;
  tt.style.left=(e.clientX+14)+'px';
  tt.style.top=(e.clientY-14)+'px';
  tt.classList.add('on');
}
function hideTip(){ tt.classList.remove('on'); }

/* FILES */
(function(){
  const maxD = Math.max(...TOP_FILES.map(f=>f.duration),1);
  document.getElementById('files-count').textContent = TOP_FILES.length;
  document.getElementById('files-list').innerHTML = TOP_FILES.map((f,i)=>{
    const pct = TOTAL_SECS>0?Math.round(f.duration/TOTAL_SECS*100):0;
    const bar = Math.round(f.duration/maxD*100);
    const name = f.file.split(/[\\\\/]/).pop();
    return \`<div class="file-row" title="\${f.file}">
      <span class="file-rank">\${i+1}</span>
      <div class="file-center">
        <div class="file-name">\${name}</div>
        <div class="file-bar-row">
          <div class="bar-bg"><div class="bar-fill" style="width:\${bar}%"></div></div>
          <span class="bar-pct">\${pct}%</span>
        </div>
      </div>
      <div class="file-right">
        <div class="file-dur">\${f.label}</div>
        <div class="lang-badge">\${f.language}</div>
      </div>
    </div>\`;
  }).join('');
})();

/* LANGUAGES */
(function(){
  const tot = LANGUAGES.reduce((s,l)=>s+l.duration,0);
  document.getElementById('lang-count').textContent = LANGUAGES.length+' langs';
  document.getElementById('lang-list').innerHTML = LANGUAGES.map(l=>{
    const pct = tot>0?Math.round(l.duration/tot*100):0;
    return \`<div class="lang-row">
      <div class="lang-header">
        <span class="lang-name">\${l.language}</span>
        <div class="lang-right">
          <span class="lang-pct-big">\${pct}<span style="font-size:14px;font-weight:400">%</span></span>
        </div>
      </div>
      <div class="bar-bg"><div class="bar-fill alt" style="width:\${pct}%"></div></div>
      <div class="lang-time">\${l.label}</div>
    </div>\`;
  }).join('');
})();

/* WEEKDAY */
(function(){
  const maxAvg = Math.max(...WEEKDAYS.map(w=>w.avgSeconds),1);
  document.getElementById('weekday-grid').innerHTML = WEEKDAYS.map(w=>{
    const h = Math.round(w.avgSeconds/maxAvg*60);
    return \`<div class="wd-col">
      <div class="wd-bar-wrap">
        <div class="wd-bar" style="height:\${h}px" title="\${fmtH(w.avgSeconds)} avg on \${w.days} \${w.label}s"></div>
      </div>
      <div class="wd-label">\${w.label}</div>
      <div class="wd-val">\${fmtH(w.avgSeconds)}</div>
    </div>\`;
  }).join('');
  const best = WEEKDAYS.reduce((a,b)=>b.avgSeconds>a.avgSeconds?b:a,WEEKDAYS[0]);
  document.getElementById('weekday-best').innerHTML =
    \`<div style="font-size:9px;color:var(--muted);letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px">Peak day</div>
    <div style="font-family:'Barlow Condensed',sans-serif;font-size:30px;font-weight:900;color:var(--p)">\${best.label}</div>
    <div style="font-size:10px;color:var(--muted);margin-top:2px">avg \${fmtH(best.avgSeconds)} · \${best.days} sessions</div>\`;
})();

/* MONTH BARS */
(function(){
  const maxH = Math.max(...MONTH_DATA.map(m=>m.hours),1);
  document.getElementById('months-range').textContent =
    MONTH_DATA.length ? MONTH_DATA[0].label+' → '+MONTH_DATA[MONTH_DATA.length-1].label : '';
  document.getElementById('month-bars').innerHTML = MONTH_DATA.map(m=>{
    const bar = Math.round(m.hours/maxH*100);
    return \`<div class="month-row">
      <span class="month-label">\${m.label}</span>
      <div class="bar-bg"><div class="bar-fill" style="width:\${bar}%"></div></div>
      <span class="month-val">\${m.hours}h</span>
    </div>\`;
  }).join('');
})();

/* TOP DAYS */
(function(){
  const DAYS=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const sorted=[...RAW_DAYS].sort((a,b)=>b.hours-a.hours).slice(0,15);
  document.getElementById('top-days-body').innerHTML = sorted.map((d,i)=>{
    const dow=DAYS[new Date(d.date+'T00:00:00').getDay()];
    const h=Math.floor(d.hours), m=Math.round((d.hours%1)*60);
    return \`<tr>
      <td style="color:var(--muted)">\${i+1}</td>
      <td>\${d.date}</td>
      <td style="color:var(--muted)">\${dow}</td>
      <td class="td-num">\${h}h \${m}m</td>
      <td class="td-num">\${d.files}</td>
    </tr>\`;
  }).join('');
})();

/* CALENDAR HEATMAP */
(function(){
  const dayMap={};
  RAW_DAYS.forEach(d=>{ dayMap[d.date]=d.hours; });
  const vals=Object.values(dayMap);
  const maxH=vals.length?Math.max(...vals,0.01):1;

  function lvl(h){
    if(!h||h===0) return '';
    if(h<maxH*.25) return 'l1';
    if(h<maxH*.5)  return 'l2';
    if(h<maxH*.75) return 'l3';
    return 'l4';
  }

  const today=new Date(); today.setHours(0,0,0,0);
  const start=new Date(today); start.setDate(start.getDate()-363);
  start.setDate(start.getDate()-start.getDay()); // go back to Sunday

  const grid=document.getElementById('cal-grid');
  const monthsEl=document.getElementById('cal-months');
  grid.innerHTML=''; monthsEl.innerHTML='';

  let lastM=-1, weekIdx=0;
  for(let d=new Date(start); d<=today;){
    const wk=document.createElement('div'); wk.className='cal-week';
    if(d.getMonth()!==lastM){
      lastM=d.getMonth();
      const sp=document.createElement('span');
      sp.textContent=d.toLocaleDateString('en',{month:'short'});
      sp.style.cssText=\`position:absolute;left:\${weekIdx*13}px;top:0;\`;
      monthsEl.appendChild(sp);
    }
    for(let i=0;i<7;i++){
      const ds=d.toISOString().split('T')[0];
      const h=dayMap[ds]||0;
      const cell=document.createElement('div');
      cell.className='cal-day '+lvl(h);
      cell.addEventListener('mouseenter',e=>{
        showTip(e,\`<strong>\${ds}</strong><br>\${h>0?h.toFixed(1)+'h coded':'no activity'}\`);
      });
      cell.addEventListener('mouseleave',hideTip);
      wk.appendChild(cell);
      d.setDate(d.getDate()+1);
      if(d>today) break;
    }
    grid.appendChild(wk);
    weekIdx++;
  }

  const activeDays=Object.values(dayMap).filter(h=>h>0).length;
  document.getElementById('cal-stats').textContent=activeDays+' active days in view';
})();

/* MAIN CHART */
const canvas=document.getElementById('main-chart');
const ctx2=canvas.getContext('2d');
let _data=RAW_DAYS;

function drawChart(data){
  const metaEl=document.getElementById('chart-meta');
  const sumEl=document.getElementById('chart-summary');
  if(!data||!data.length){
    ctx2.clearRect(0,0,canvas.width,canvas.height);
    metaEl.textContent='0 days'; return;
  }
  const totalH=data.reduce((s,d)=>s+d.hours,0);
  const avgH=totalH/data.length;
  metaEl.textContent=data.length+' days';
  sumEl.textContent='total '+totalH.toFixed(1)+'h · avg '+avgH.toFixed(1)+'h/day';

  const dpr=window.devicePixelRatio||1;
  const W=canvas.parentElement.clientWidth-28;
  const H=210;
  canvas.style.width=W+'px'; canvas.style.height=H+'px';
  canvas.width=W*dpr; canvas.height=H*dpr;
  ctx2.scale(dpr,dpr);
  ctx2.clearRect(0,0,W,H);

  const pL=44,pR=12,pT=18,pB=36;
  const cW=W-pL-pR, cH=H-pT-pB;
  const maxH=Math.max(...data.map(d=>d.hours),0.1);

  // grid lines
  for(let i=0;i<=5;i++){
    const y=pT+(cH/5)*i;
    const val=maxH-(maxH/5)*i;
    ctx2.strokeStyle='rgba(142,97,198,0.1)';
    ctx2.lineWidth=1;
    ctx2.setLineDash([]);
    ctx2.beginPath();
    ctx2.moveTo(pL,y); ctx2.lineTo(pL+cW,y);
    ctx2.stroke();
    ctx2.fillStyle='rgba(142,97,198,0.5)';
    ctx2.font="9px 'IBM Plex Mono',monospace";
    ctx2.textAlign='right';
    ctx2.fillText(val.toFixed(1)+'h',pL-4,y+3);
  }

  // avg dashed line
  const avgY=pT+cH-(avgH/maxH)*cH;
  ctx2.strokeStyle='rgba(142,97,198,0.45)';
  ctx2.lineWidth=1; ctx2.setLineDash([4,4]);
  ctx2.beginPath(); ctx2.moveTo(pL,avgY); ctx2.lineTo(pL+cW,avgY); ctx2.stroke();
  ctx2.setLineDash([]);
  ctx2.fillStyle='rgba(142,97,198,0.6)';
  ctx2.font="9px 'IBM Plex Mono',monospace";
  ctx2.textAlign='left';
  ctx2.fillText('avg',pL+4,avgY-3);

  // bars
  const gap=cW/data.length;
  const barW=Math.max(Math.min(gap*.72,22),1.5);

  data.forEach((d,i)=>{
    const x=pL+gap*i+gap/2-barW/2;
    const h=(d.hours/maxH)*cH;
    const y=pT+cH-h;
    const isAboveAvg=d.hours>avgH;

    ctx2.shadowColor=isAboveAvg?'rgba(142,97,198,0.5)':'transparent';
    ctx2.shadowBlur=isAboveAvg?8:0;
    ctx2.fillStyle=isAboveAvg?'#8e61c6':'rgba(142,97,198,0.5)';
    ctx2.globalAlpha=1;
    ctx2.beginPath();
    if(ctx2.roundRect) ctx2.roundRect(x,y,barW,h,[2,2,0,0]);
    else ctx2.rect(x,y,barW,h);
    ctx2.fill();
    ctx2.shadowBlur=0;
  });

  // x labels
  ctx2.fillStyle='rgba(142,97,198,0.5)';
  ctx2.font="9px 'IBM Plex Mono',monospace";
  ctx2.textAlign='center';
  const maxL=Math.floor(cW/40);
  const step=Math.max(1,Math.floor(data.length/maxL));
  data.forEach((d,i)=>{
    if(i%step!==0&&i!==data.length-1) return;
    ctx2.fillText(d.date.slice(5),pL+gap*i+gap/2,pT+cH+17);
  });

  canvas._d=data; canvas._pL=pL; canvas._gap=gap;
  canvas._pT=pT; canvas._cH=cH; canvas._maxH=maxH;
}

canvas.addEventListener('mousemove',e=>{
  if(!canvas._d) return;
  const r=canvas.getBoundingClientRect();
  const idx=Math.floor((e.clientX-r.left-canvas._pL)/canvas._gap);
  if(idx<0||idx>=canvas._d.length){ hideTip(); return; }
  const d=canvas._d[idx];
  const h=Math.floor(d.hours), m=Math.round((d.hours%1)*60);
  showTip(e, \`<strong>\${d.date}</strong> \${d.label}<br>⏱ \${h}h \${m}m<br>📄 \${d.files} files\`);
});
canvas.addEventListener('mouseleave',hideTip);

document.querySelectorAll('[data-range]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('[data-range]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const r=btn.dataset.range;
    if(r==='all'){ _data=RAW_DAYS; }
    else{
      const cut=new Date(); cut.setDate(cut.getDate()-+r);
      _data=RAW_DAYS.filter(d=>new Date(d.date+'T00:00:00')>=cut);
    }
    drawChart(_data);
  });
});

document.getElementById('apply-range').addEventListener('click',()=>{
  const f=document.getElementById('date-from').value;
  const t=document.getElementById('date-to').value;
  if(!f||!t) return;
  document.querySelectorAll('[data-range]').forEach(b=>b.classList.remove('active'));
  const from=new Date(f+'T00:00:00'), to=new Date(t+'T23:59:59');
  _data=RAW_DAYS.filter(d=>{ const dt=new Date(d.date+'T00:00:00'); return dt>=from&&dt<=to; });
  drawChart(_data);
});

if(RAW_DAYS.length){
  document.getElementById('date-from').value=RAW_DAYS[0].date;
  document.getElementById('date-to').value=RAW_DAYS[RAW_DAYS.length-1].date;
}

drawChart(RAW_DAYS);
window.addEventListener('resize',()=>drawChart(_data));
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