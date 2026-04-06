import * as vscode from "vscode";
import { StorageService } from "./storage";
import { ContextService } from "./context";
import { TimeTracker } from "./tracker";
import { StatsService } from "./stats";
import { ExporterService } from "./exporter";
import { TimeCommitAnalyzer } from "./time-commit-analyzer";
import { WebviewPanel } from "./webview";
import { TRACKING_INTERVAL_MS, Commands, StatusMessages } from "./constants";

let tracker: TimeTracker;
let storage: StorageService;
let context: ContextService;
let stats: StatsService;
let exporter: ExporterService;
let commitAnalyzer: TimeCommitAnalyzer;
let webviewPanel: WebviewPanel;
let activeTimer: NodeJS.Timeout | null = null;
let statusBar: vscode.StatusBarItem;
let statusBarMode: "total" | "project" = "total";

function startTracking(): void {
  if (activeTimer) clearInterval(activeTimer);

  activeTimer = setInterval(() => {
    tracker.recordActivity();
  }, TRACKING_INTERVAL_MS);
}

function stopTracking(): void {
  if (activeTimer) {
    clearInterval(activeTimer);
    activeTimer = null;
  }
}

function registerCommands(extensionContext: vscode.ExtensionContext): void {
  extensionContext.subscriptions.push(
    vscode.commands.registerCommand(Commands.SHOW_STATS, async () => {
      const allData = storage.getAllData();
      if (allData.length === 0) {
        vscode.window.showInformationMessage(StatusMessages.NO_DATA);
        return;
      }

      const total = stats.calculateTotal(allData);
      const topFiles = stats.getTopFiles(allData);
      const languages = stats.getLanguageBreakdown(allData);

      let message = `Total Time: ${total.hours}h ${total.minutes}m\n\n`;
      message += "Top Files:\n";
      topFiles.forEach((file) => {
        const duration = stats.formatDuration(file.duration);
        message += `  ${file.file} (${file.language}): ${duration}\n`;
      });

      message += "\nLanguages:\n";
      languages.slice(0, 5).forEach((lang) => {
        const duration = stats.formatDuration(lang.duration);
        message += `  ${lang.language}: ${duration}\n`;
      });

      vscode.window.showInformationMessage(message);
    }),
  );

  extensionContext.subscriptions.push(
    vscode.commands.registerCommand(Commands.SHOW_TODAY, async () => {
      const todayData = storage.getTodayData();
      const todayStats = stats.getTodayStats(todayData);

      let message = `Today's Stats\n\n`;
      message += `Time: ${todayStats.hours}h ${todayStats.minutes}m\n`;
      message += `Files: ${todayStats.fileCount}\n`;
      message += `Languages: ${todayStats.languageCount}\n`;

      if (todayData && todayData.entries.length > 0) {
        const topFiles = stats.getTopFiles([todayData], 3);
        message += "\nTop Files Today:\n";
        topFiles.forEach((file) => {
          const duration = stats.formatDuration(file.duration);
          message += `  ${file.file}: ${duration}\n`;
        });
      }

      vscode.window.showInformationMessage(message);
    }),
  );

  extensionContext.subscriptions.push(
    vscode.commands.registerCommand(Commands.OPEN_DATA_DIR, async () => {
      const dataDir = storage.getDir();
      vscode.commands.executeCommand(
        "revealFileInOS",
        vscode.Uri.file(dataDir),
      );
    }),
  );

  extensionContext.subscriptions.push(
    vscode.commands.registerCommand(Commands.CLEAR_DATA, async () => {
      const choice = await vscode.window.showWarningMessage(
        "Clear all tracking data?",
        "Yes",
        "No",
      );

      if (choice === "Yes") {
        storage.clearAllData();
        vscode.window.showInformationMessage(StatusMessages.CLEARED);
      }
    }),
  );

  extensionContext.subscriptions.push(
    vscode.commands.registerCommand(
      "heildamm-time-tracker.open-dashboard",
      async () => {
        webviewPanel.show(extensionContext.extensionUri);
      },
    ),
  );

  extensionContext.subscriptions.push(
    vscode.commands.registerCommand(Commands.EXPORT_CSV, async () => {
      const allData = storage.getAllData();
      if (allData.length === 0) {
        vscode.window.showInformationMessage(StatusMessages.NO_DATA);
        return;
      }

      const csv = exporter.exportToCSV(allData);
      vscode.workspace
        .openTextDocument({
          content: csv,
          language: "csv",
        })
        .then((doc) => vscode.window.showTextDocument(doc));
    }),
  );

  extensionContext.subscriptions.push(
    vscode.commands.registerCommand(Commands.EXPORT_MARKDOWN, async () => {
      const allData = storage.getAllData();
      if (allData.length === 0) {
        vscode.window.showInformationMessage(StatusMessages.NO_DATA);
        return;
      }

      const markdown = exporter.exportToMarkdown(allData);
      vscode.workspace
        .openTextDocument({
          content: markdown,
          language: "markdown",
        })
        .then((doc) => vscode.window.showTextDocument(doc));
    }),
  );

  extensionContext.subscriptions.push(
    vscode.commands.registerCommand(Commands.TOGGLE_STATUS_BAR, async () => {
      statusBarMode = statusBarMode === "total" ? "project" : "total";
      updateStatusBar();
    }),
  );

  extensionContext.subscriptions.push(
    vscode.commands.registerCommand(Commands.ARCHAEOLOGY_REPORT, async () => {
      const allData = storage.getAllData();
      if (allData.length === 0) {
        vscode.window.showInformationMessage(StatusMessages.NO_DATA);
        return;
      }

      const analysis = commitAnalyzer.analyzeTimeToCommit(allData);
      const opportunities =
        commitAnalyzer.getOptimizationOpportunities(allData);

      let report = `# Software Archaeology Report\n\n`;
      report += `**Analysis Period:** ${analysis.period}\n\n`;

      report += `## Summary\n\n`;
      report += `- **Total Time Invested:** ${Math.round(analysis.totalTimeInvested / 3600)}h ${Math.round((analysis.totalTimeInvested % 3600) / 60)}m\n`;
      report += `- **Total Commits:** ${analysis.totalCommits}\n`;
      report += `- **Average Time per Commit:** ${Math.round(analysis.averageTimePerCommit / 60)}m\n`;
      report += `- **Commit Velocity:** ${analysis.commitVelocity.toFixed(1)} commits/day\n`;
      report += `- **Cost per Commit:** ${Math.round(analysis.costPerCommit / 60)}m\n\n`;

      report += `## Productivity Insights\n\n`;
      report += `- **Most Productive Day:** ${analysis.mostProductiveDay}\n`;
      report += `- **Least Productive Day:** ${analysis.leastProductiveDay}\n\n`;

      if (opportunities.length > 0) {
        report += `## Optimization Opportunities\n\n`;
        report += `Commits that took significantly longer than average (${Math.round(analysis.averageTimePerCommit / 60)}m):\n\n`;
        opportunities.slice(0, 5).forEach((m) => {
          const timeInvested = Math.round(m.timeInvestedBeforeCommit / 60);
          report += `- **${m.commitHash}:** ${m.message}\n`;
          report += `  - Time: ${timeInvested}m | Files: ${m.filesChanged} | Changes: +${m.insertions}-${m.deletions}\n`;
        });
        report += `\n`;
      }

      report += `## Recent Commits\n\n`;
      analysis.metrics.slice(0, 10).forEach((m) => {
        const time = Math.round(m.timeInvestedBeforeCommit / 60);
        report += `- **${m.commitHash}:** ${m.message}\n`;
        report += `  Time: ${time}m | Files: ${m.filesChanged} | Productivity Score: ${m.productivityScore.toFixed(0)}\n`;
      });

      vscode.workspace
        .openTextDocument({
          content: report,
          language: "markdown",
        })
        .then((doc) => vscode.window.showTextDocument(doc));
    }),
  );
}

function setupStatusBar(extContext: vscode.ExtensionContext): void {
  statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBar.command = "heildamm-time-tracker.open-dashboard";
  statusBar.tooltip =
    "Click to open dashboard | Status: total/project time today";

  updateStatusBar();
  setInterval(updateStatusBar, 30000);

  extContext.subscriptions.push(statusBar);
}

function updateStatusBar(): void {
  const todayData = storage.getTodayData();
  const todayStats = stats.getTodayStats(todayData);

  let text = "";
  if (statusBarMode === "total") {
    text = `${todayStats.hours}h ${todayStats.minutes}m`;
  } else {
    const currentProject = context.getProject();
    const projectTime = stats.getTodayProjectTime(todayData, currentProject);
    const hours = Math.floor(projectTime / 3600);
    const minutes = Math.floor((projectTime % 3600) / 60);
    text = `${currentProject}: ${hours}h ${minutes}m`;
  }

  statusBar.text = text;
  statusBar.show();
}

export function activate(extensionContext: vscode.ExtensionContext): void {
  storage = new StorageService();
  context = new ContextService();
  stats = new StatsService();
  exporter = new ExporterService();

  const workspacePath =
    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
  commitAnalyzer = new TimeCommitAnalyzer(workspacePath);

  webviewPanel = new WebviewPanel(storage, stats, commitAnalyzer);

  const idleTimeMinutes =
    vscode.workspace
      .getConfiguration("heildamm-time-tracker")
      .get<number>("idleTime", 5) || 5;

  tracker = new TimeTracker(
    context,
    (entry) => {
      storage.saveEntry(entry);
    },
    idleTimeMinutes * 60 * 1000,
  );

  storage.ensureDirectory();
  startTracking();
  setupStatusBar(extensionContext);
  registerCommands(extensionContext);

  console.log(`Status: ${StatusMessages.ACTIVATED}: ${context.getAuthor()}`);

  extensionContext.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration("heildamm-time-tracker.idleTime")) {
        const newIdleTime =
          vscode.workspace
            .getConfiguration("heildamm-time-tracker")
            .get<number>("idleTime", 5) || 5;
        tracker.setIdleThreshold(newIdleTime);
        vscode.window.showInformationMessage(
          `Idle time threshold updated to ${newIdleTime} minutes`,
        );
      }
    }),
  );

  extensionContext.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      context.setActiveEditor(editor);
      tracker.resetSession();
    }),
  );

  extensionContext.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument(() => {
      tracker.updateActivity();
    }),
  );

  extensionContext.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(() => {
      tracker.recordActivity();
    }),
  );

  extensionContext.subscriptions.push(
    new vscode.Disposable(() => {
      stopTracking();
    }),
  );
}

export function deactivate(): void {
  stopTracking();
}
