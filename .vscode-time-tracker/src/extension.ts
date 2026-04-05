import * as vscode from "vscode";
import { StorageService } from "./storage";
import { ContextService } from "./context";
import { TimeTracker } from "./tracker";
import { StatsService } from "./stats";
import { WebviewPanel } from "./webview";
import { TRACKING_INTERVAL_MS, Commands, StatusMessages } from "./constants";

let tracker: TimeTracker;
let storage: StorageService;
let context: ContextService;
let stats: StatsService;
let webviewPanel: WebviewPanel;
let activeTimer: NodeJS.Timeout | null = null;
let statusBar: vscode.StatusBarItem;

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
}

function setupStatusBar(context: vscode.ExtensionContext): void {
  statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );
  statusBar.command = "heildamm-time-tracker.open-dashboard";
  statusBar.tooltip = "Click to open time tracking dashboard";

  const updateStatusBar = (): void => {
    const todayData = storage.getTodayData();
    const todayStats = stats.getTodayStats(todayData);
    statusBar.text = `Time: ${todayStats.hours}h ${todayStats.minutes}m`;
    statusBar.show();
  };

  updateStatusBar();
  setInterval(updateStatusBar, 30000);

  context.subscriptions.push(statusBar);
}

export function activate(extensionContext: vscode.ExtensionContext): void {
  storage = new StorageService();
  context = new ContextService();
  stats = new StatsService();
  webviewPanel = new WebviewPanel(storage, stats);

  tracker = new TimeTracker(context, (entry) => {
    storage.saveEntry(entry);
  });

  storage.ensureDirectory();
  startTracking();
  setupStatusBar(extensionContext);
  registerCommands(extensionContext);

  console.log(`Status: ${StatusMessages.ACTIVATED}: ${context.getAuthor()}`);

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
