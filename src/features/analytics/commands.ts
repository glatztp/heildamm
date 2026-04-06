import chalk from "chalk";
import { select, confirm } from "@clack/prompts";
import fs from "fs";
import { join } from "path";
import { homedir } from "os";
import {
  isAnalyticsEnabled,
  setAnalyticsEnabled,
  calculateAggregatedStats,
  clearAnalyticsData,
  exportAnalyticsData,
  getAnalyticsStore,
} from "./core.js";
import {
  displayAnalyticsDashboard,
  displayAnalyticsSettings,
  createAnalyticsReport,
  displayProductivityDashboard,
  displayTimeToCommitDetails,
} from "./visualize.js";
import {
  syncTrackerData,
  getAggregatedTrackerStats,
} from "./tracker-integration.js";
import { generateProductivityInsights } from "./productivity-insights.js";

export async function handleAnalyticsCommand(
  subcommand?: string,
): Promise<void> {
  if (!subcommand) {
    const action = await select({
      message: "What would you like to do?",
      options: [
        { label: "View Dashboard", value: "view" },
        { label: "Productivity Insights", value: "productivity" },
        { label: "Sync Time Tracker Data", value: "sync-tracker" },
        { label: "Toggle Analytics", value: "toggle" },
        { label: "Export Data", value: "export" },
        { label: "Clear Data", value: "clear" },
        { label: "View Settings", value: "settings" },
      ],
    });

    if (typeof action === "symbol") process.exit(0);
    subcommand = action as string;
  }

  switch (subcommand) {
    case "view":
      await viewDashboard();
      break;
    case "productivity":
      await viewProductivity();
      break;
    case "sync-tracker":
      await syncTrackerCommand();
      break;
    case "toggle":
      await toggleAnalytics();
      break;
    case "export":
      await exportData();
      break;
    case "clear":
      await clearData();
      break;
    case "settings":
      await viewSettings();
      break;
    default:
      console.log(chalk.red(`Unknown command: ${subcommand}`));
  }
}

async function viewDashboard(): Promise<void> {
  const stats = calculateAggregatedStats();

  if (stats.totalProjects === 0) {
    console.log(chalk.yellow("\nNo projects recorded yet.\n"));
    console.log(
      chalk.gray(
        "Create a project with 'npx create-heildamm' to start tracking analytics.\n",
      ),
    );
    return;
  }

  displayAnalyticsDashboard(stats);
}

async function toggleAnalytics(): Promise<void> {
  displayAnalyticsSettings(!isAnalyticsEnabled());

  const confirmed = await confirm({
    message: `${!isAnalyticsEnabled() ? "Enable" : "Disable"} analytics?`,
  });

  if (typeof confirmed === "symbol") {
    process.exit(0);
  }

  if (confirmed) {
    setAnalyticsEnabled(!isAnalyticsEnabled());
    const newStatus = isAnalyticsEnabled();
    console.log(
      chalk.green(`Analytics ${newStatus ? "enabled" : "disabled"}\n`),
    );
  } else {
    console.log(chalk.gray("Cancelled.\n"));
  }
}

async function exportData(): Promise<void> {
  const store = getAnalyticsStore();

  if (!store.projects || store.projects.length === 0) {
    console.log(chalk.yellow("\nNo data to export.\n"));
    return;
  }

  const exportData = exportAnalyticsData();
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `heildamm-analytics-${timestamp}.json`;
  const filepath = join(process.cwd(), filename);

  fs.writeFileSync(filepath, JSON.stringify(exportData, null, 2));

  const stats = calculateAggregatedStats();
  const report = createAnalyticsReport(stats);
  const reportFilename = `heildamm-analytics-${timestamp}.md`;
  const reportFilepath = join(process.cwd(), reportFilename);
  fs.writeFileSync(reportFilepath, report);

  console.log(chalk.green(`Analytics exported successfully\n`));
  console.log(chalk.gray(`  JSON Report:     ${filename}`));
  console.log(chalk.gray(`  Markdown Report: ${reportFilename}\n`));
}

async function clearData(): Promise<void> {
  const confirmed = await confirm({
    message:
      "Are you sure you want to clear all analytics data? This cannot be undone.",
  });

  if (typeof confirmed === "symbol") {
    process.exit(0);
  }

  if (confirmed) {
    clearAnalyticsData();
    console.log(chalk.green("Analytics data cleared\n"));
  } else {
    console.log(chalk.gray("Cancelled.\n"));
  }
}

async function viewSettings(): Promise<void> {
  const enabled = isAnalyticsEnabled();
  const store = getAnalyticsStore();

  console.log("\n");
  console.log(chalk.bold("Analytics Settings\n"));
  console.log(
    `  Status:                ${enabled ? chalk.green("Enabled") : chalk.red("Disabled")}`,
  );
  console.log(`  Total Projects:        ${store.projects?.length ?? 0}`);
  console.log(
    `  First Run:             ${new Date(store.firstRun).toLocaleDateString()}`,
  );
  console.log(
    `  Last Run:              ${new Date(store.lastRun).toLocaleDateString()}`,
  );

  const stats = calculateAggregatedStats();
  if (stats.totalProjects > 0) {
    console.log(`  Average Per Month:     ${stats.averageProjectsPerMonth}`);
    console.log(
      `  Most Popular:          ${stats.mostPopularArchitecture} + ${stats.mostPopularVariant}`,
    );
  }

  console.log(
    chalk.gray(
      `\n  Store Location:        ${join(homedir(), ".heildamm", "analytics.json")}`,
    ),
  );
  console.log(
    chalk.gray(
      `\n  All data is anonymized and stored locally. No data is transmitted.`,
    ),
  );
  console.log();
}

async function viewProductivity(): Promise<void> {
  console.log(chalk.cyan("\n📊 Syncing tracker data...\n"));
  syncTrackerData();

  let currentProjectPath = process.cwd();

  try {
    while (!fs.existsSync(join(currentProjectPath, ".git"))) {
      const parent = join(currentProjectPath, "..");
      if (parent === currentProjectPath) {
        console.log(chalk.yellow("No git repository found in current path\n"));
        return;
      }
      currentProjectPath = parent;
    }
  } catch {
    console.log(chalk.yellow("Unable to locate git repository\n"));
    return;
  }

  const trackerStats = getAggregatedTrackerStats();

  if (trackerStats.totalTrackedHours === 0) {
    console.log(chalk.yellow("\nNo time tracking data found.\n"));
    console.log(
      chalk.gray(
        "Make sure your vscode-time-tracker extension has recorded sessions.\n",
      ),
    );
    return;
  }

  const insights = generateProductivityInsights([currentProjectPath]);

  if (insights.timeToCommitRatios.length === 0) {
    console.log(
      chalk.yellow("\nInsufficient data for productivity analysis\n"),
    );
    console.log(chalk.gray("Make sure your project has:\n"));
    console.log(chalk.gray("  - Git commits\n"));
    console.log(chalk.gray("  - Time tracking sessions\n"));
    return;
  }

  displayProductivityDashboard(insights);

  const firstRatio = insights.timeToCommitRatios[0];
  if (firstRatio) {
    displayTimeToCommitDetails(firstRatio);
  }
}

async function syncTrackerCommand(): Promise<void> {
  console.log(chalk.cyan("\nSyncing vscode-time-tracker data...\n"));

  try {
    syncTrackerData();

    const stats = getAggregatedTrackerStats();

    console.log(chalk.green("Sync completed!\n"));
    console.log(chalk.bold("Current Statistics:"));
    console.log(
      `  Total Tracked Time:  ${chalk.cyan(stats.totalTrackedHours + "h")}`,
    );
    console.log(
      `  Total Sessions:      ${chalk.cyan(stats.totalSessions.toString())}`,
    );
    console.log(
      `  Projects Tracked:    ${chalk.cyan(stats.projectsTracked.toString())}`,
    );
    console.log(
      `  Average Session:     ${chalk.cyan(stats.averageSessionHours + "h")}\n`,
    );
  } catch (error) {
    console.log(chalk.red("Failed to sync tracker data"));
    if (error instanceof Error) {
      console.log(chalk.gray(error.message));
    }
  }
}
