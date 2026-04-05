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
} from "./visualize.js";

export async function handleAnalyticsCommand(
  subcommand?: string
): Promise<void> {
  if (!subcommand) {
    const action = await select({
      message: "What would you like to do?",
      options: [
        { label: "View Dashboard", value: "view" },
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
        "Create a project with 'npx create-heildamm' to start tracking analytics.\n"
      )
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
      chalk.green(`Analytics ${newStatus ? "enabled" : "disabled"}\n`)
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
    `  Status:                ${enabled ? chalk.green("Enabled ✓") : chalk.red("Disabled ✗")}`
  );
  console.log(`  Total Projects:        ${store.projects?.length ?? 0}`);
  console.log(
    `  First Run:             ${new Date(store.firstRun).toLocaleDateString()}`
  );
  console.log(
    `  Last Run:              ${new Date(store.lastRun).toLocaleDateString()}`
  );

  const stats = calculateAggregatedStats();
  if (stats.totalProjects > 0) {
    console.log(`  Average Per Month:     ${stats.averageProjectsPerMonth}`);
    console.log(
      `  Most Popular:          ${stats.mostPopularArchitecture} + ${stats.mostPopularVariant}`
    );
  }

  console.log(
    chalk.gray(
      `\n  Store Location:        ${join(homedir(), ".heildamm", "analytics.json")}`
    )
  );
  console.log(
    chalk.gray(
      `\n  All data is anonymized and stored locally. No data is transmitted.`
    )
  );
  console.log();
}
