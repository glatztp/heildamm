import chalk from "chalk";
import gradient from "gradient-string";
import type { AggregatedStats, TrendData } from "./core.js";

const COLORS = {
  primary: "#8e61c6",
  secondary: "#a277ff",
  accent: "#c5a3ff",
} as const;

function renderBarChart(
  data: Record<string, number>,
  maxWidth: number = 30,
  maxValue?: number,
): string {
  const max = maxValue || Math.max(...Object.values(data), 1);
  const sortedEntries = Object.entries(data).sort((a, b) => b[1] - a[1]);

  return sortedEntries
    .map(([label, value]) => {
      const percentage = (value / max) * 100;
      const barWidth = Math.round((percentage / 100) * maxWidth);
      const bar = "█".repeat(barWidth) + "░".repeat(maxWidth - barWidth);
      const percent = percentage.toFixed(1);
      return `  ${label.padEnd(15)} │ ${bar} │ ${String(value).padStart(4)} (${percent}%)`;
    })
    .join("\n");
}

function renderLineChart(trendData: TrendData[]): string {
  if (trendData.length === 0) return "  No data available\n";

  const maxCount = Math.max(...trendData.map((d) => d.count), 1);
  const height = 10;

  const lines: string[] = [];

  for (let h = height; h >= 0; h--) {
    const threshold = (h / height) * maxCount;
    let line = `  ${String(Math.round(threshold)).padStart(4)} │ `;

    for (let i = 0; i < trendData.length; i++) {
      const point = trendData[i];
      if (point.count >= threshold) {
        line += "█ ";
      } else {
        line += "  ";
      }
    }

    lines.push(line);
  }

  lines.push("       ├─" + "──".repeat(trendData.length));
  lines.push(
    "       │ " + trendData.map((d) => d.month.substring(5)).join(" "),
  );

  return lines.join("\n");
}

export function displayAnalyticsDashboard(stats: AggregatedStats): void {
  console.log("\n");
  console.log(gradient.cristal.multiline("HEILDAMM ANALYTICS DASHBOARD"));
  console.log();

  console.log(chalk.bold(chalk.hex(COLORS.secondary)("Overall Statistics\n")));
  console.log(
    `  Total Projects Created:        ${chalk.bold(String(stats.totalProjects))}`,
  );
  console.log(
    `  Average Per Month:             ${chalk.bold(String(stats.averageProjectsPerMonth))}`,
  );
  console.log(
    `  CI/CD Adoption Rate:           ${chalk.bold(stats.cicdAdoptionRate + "%")}`,
  );
  console.log(
    `  Most Popular Architecture:     ${chalk.bold(stats.mostPopularArchitecture)}`,
  );
  console.log(
    `  Most Popular Variant:          ${chalk.bold(stats.mostPopularVariant)}`,
  );
  console.log(
    `  Most Popular Package Manager:  ${chalk.bold(stats.mostPopularPackageManager)}\n`,
  );

  console.log(
    chalk.bold(chalk.hex(COLORS.secondary)("Architecture Distribution\n")),
  );
  console.log(renderBarChart(stats.architectureDistribution));
  console.log();

  console.log(
    chalk.bold(chalk.hex(COLORS.secondary)("Variant Distribution\n")),
  );
  console.log(renderBarChart(stats.variantDistribution));
  console.log();

  console.log(
    chalk.bold(chalk.hex(COLORS.secondary)("Package Manager Preference\n")),
  );
  console.log(renderBarChart(stats.packageManagerPreference));
  console.log();

  console.log(
    chalk.bold(chalk.hex(COLORS.secondary)("Platform Distribution\n")),
  );
  const platformNames = {
    win32: "Windows",
    darwin: "macOS",
    linux: "Linux",
  };
  const platformsFormatted = Object.entries(stats.platformDistribution).reduce(
    (acc, [key, value]) => {
      acc[platformNames[key as keyof typeof platformNames] || key] = value;
      return acc;
    },
    {} as Record<string, number>,
  );
  console.log(renderBarChart(platformsFormatted));
  console.log();

  if (stats.trendData.length > 0) {
    console.log(
      chalk.bold(chalk.hex(COLORS.secondary)("Projects Over Time\n")),
    );
    console.log(renderLineChart(stats.trendData));
    console.log();
  }

  console.log(
    chalk.gray(
      "Note: All statistics are anonymized. No personal data is collected or stored.\n",
    ),
  );
}

export function displayAnalyticsSummary(stats: AggregatedStats): void {
  console.log("\n");
  console.log(chalk.hex(COLORS.secondary).bold("Analytics Summary:"));
  console.log(
    `   • Total Projects: ${chalk.bold(String(stats.totalProjects))}`,
  );
  console.log(
    `   • Top Architecture: ${chalk.bold(stats.mostPopularArchitecture)}`,
  );
  console.log(`   • Top Variant: ${chalk.bold(stats.mostPopularVariant)}`);
  console.log(`   • CI/CD Rate: ${chalk.bold(stats.cicdAdoptionRate + "%")}`);
  console.log();
}

export function displayAnalyticsSettings(enabled: boolean): void {
  console.log("\n");
  console.log(chalk.hex(COLORS.secondary).bold("Analytics & Usage"));
  console.log(
    `  Status: ${enabled ? chalk.green("Enabled ✓") : chalk.red("Disabled ✗")}`,
  );
  console.log();
  console.log(
    chalk.gray(
      `  Analytics helps improve Heildamm by collecting anonymized\n` +
        `  usage statistics. No personal data is stored or transmitted.\n` +
        `  You can disable this at any time.\n`,
    ),
  );
}

export function createAnalyticsReport(stats: AggregatedStats): string {
  let report = "# Heildamm Analytics Report\n\n";
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Total Projects: ${stats.totalProjects}\n\n`;

  report += "## Architecture Distribution\n";
  for (const [arch, count] of Object.entries(stats.architectureDistribution)) {
    const percent = ((count / stats.totalProjects) * 100).toFixed(1);
    report += `- ${arch}: ${count} (${percent}%)\n`;
  }

  report += "\n## Variant Distribution\n";
  for (const [variant, count] of Object.entries(stats.variantDistribution)) {
    const percent = ((count / stats.totalProjects) * 100).toFixed(1);
    report += `- ${variant}: ${count} (${percent}%)\n`;
  }

  report += "\n## Package Manager Preference\n";
  for (const [pm, count] of Object.entries(stats.packageManagerPreference)) {
    const percent = ((count / stats.totalProjects) * 100).toFixed(1);
    report += `- ${pm}: ${count} (${percent}%)\n`;
  }

  report += "\n## Platform Distribution\n";
  const platformNames = {
    win32: "Windows",
    darwin: "macOS",
    linux: "Linux",
  };
  for (const [platform, count] of Object.entries(stats.platformDistribution)) {
    const name =
      platformNames[platform as keyof typeof platformNames] || platform;
    const percent = ((count / stats.totalProjects) * 100).toFixed(1);
    report += `- ${name}: ${count} (${percent}%)\n`;
  }

  report += `\n## CI/CD Adoption\n`;
  report += `- Adoption Rate: ${stats.cicdAdoptionRate}%\n`;

  report += `\n## Statistics\n`;
  report += `- Average Projects Per Month: ${stats.averageProjectsPerMonth}\n`;
  report += `- Most Popular Architecture: ${stats.mostPopularArchitecture}\n`;
  report += `- Most Popular Variant: ${stats.mostPopularVariant}\n`;
  report += `- Most Popular Package Manager: ${stats.mostPopularPackageManager}\n`;

  report += "\n---\n";
  report +=
    "*All data is anonymized. No personal information is included in this report.*\n";

  return report;
}
