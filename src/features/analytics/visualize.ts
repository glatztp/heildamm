import chalk from "chalk";
import gradient from "gradient-string";
import type { AggregatedStats, TrendData } from "./core.js";
import type {
  TimeToCommitRatio,
  ProductivityInsights,
} from "./productivity-insights.js";
import { getAnalyticsStore } from "./core.js";

const COLORS = {
  primary: "#8e61c6",
  secondary: "#a277ff",
  accent: "#c5a3ff",
} as const;

const SEPARATORS = {
  top: "┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓",
  bottom: "┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛",
  middle: "├────────────────────────────────────────────────────────────────┤",
  vertical: "│",
};

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
      return `    ${label.padEnd(18)} ${bar} ${String(value).padStart(4)} (${percent.padStart(5)}%)`;
    })
    .join("\n");
}

function renderLineChart(trendData: TrendData[]): string {
  if (trendData.length === 0) return "    No data available\n";

  const maxCount = Math.max(...trendData.map((d) => d.count), 1);
  const height = 10;

  const lines: string[] = [];

  for (let h = height; h >= 0; h--) {
    const threshold = (h / height) * maxCount;
    let line = `    ${String(Math.round(threshold)).padStart(4)} │ `;

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

  lines.push("         ├─" + "──".repeat(trendData.length));
  lines.push(
    "         │ " + trendData.map((d) => d.month.substring(5)).join(" "),
  );

  return lines.join("\n");
}

function pad(
  text: string,
  width: number,
  align: "left" | "right" = "left",
): string {
  if (align === "right") {
    return text.padStart(width);
  }
  return text.padEnd(width);
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function displayAnalyticsDashboard(stats: AggregatedStats): void {
  const store = getAnalyticsStore();

  console.log("\n");
  console.log(chalk.hex(COLORS.primary)(SEPARATORS.top));

  // Title
  console.log(
    chalk.hex(COLORS.primary)(SEPARATORS.vertical) +
      chalk
        .hex(COLORS.secondary)
        .bold(
          gradient.cristal.multiline(
            pad("  📊 HEILDAMM ANALYTICS DASHBOARD", 63),
          )[0],
        )
        .padEnd(62) +
      chalk.hex(COLORS.primary)(SEPARATORS.vertical),
  );

  console.log(chalk.hex(COLORS.primary)(SEPARATORS.middle));

  // Period Information
  const firstProject = store.projects[0];
  const lastProject = store.projects[store.projects.length - 1];
  const periodStart = firstProject ? formatDate(firstProject.timestamp) : "N/A";
  const periodEnd = lastProject ? formatDate(lastProject.timestamp) : "N/A";

  const periodText = `Período: ${periodStart} até ${periodEnd} (${store.projects.length} projetos)`;
  const paddedPeriod = pad(pad("  " + periodText, 62, "left"), 62);
  console.log(
    chalk.hex(COLORS.primary)(SEPARATORS.vertical) +
      chalk.gray(paddedPeriod) +
      chalk.hex(COLORS.primary)(SEPARATORS.vertical),
  );

  console.log(chalk.hex(COLORS.primary)(SEPARATORS.middle));

  // Overall Statistics - Grid Format
  console.log(
    chalk.hex(COLORS.primary)(SEPARATORS.vertical) +
      chalk
        .bold(chalk.hex(COLORS.secondary)("  📈 ESTATÍSTICAS GERAIS"))
        .padEnd(63) +
      chalk.hex(COLORS.primary)(SEPARATORS.vertical),
  );
  console.log(chalk.hex(COLORS.primary)(SEPARATORS.middle));

  const stats1 = `  🎯 Total de Projetos: ${chalk.bold.cyan(String(stats.totalProjects))}`;
  const stats2 = `  📅 Média Por Mês: ${chalk.bold.cyan(String(stats.averageProjectsPerMonth))}`;
  const stats3 = `  🔄 Taxa CI/CD: ${chalk.bold.cyan(stats.cicdAdoptionRate + "%")}`;

  console.log(
    chalk.hex(COLORS.primary)(SEPARATORS.vertical) +
      pad(stats1, 30) +
      pad(stats2, 32) +
      chalk.hex(COLORS.primary)(SEPARATORS.vertical),
  );

  console.log(
    chalk.hex(COLORS.primary)(SEPARATORS.vertical) +
      pad(stats3, 62) +
      chalk.hex(COLORS.primary)(SEPARATORS.vertical),
  );

  console.log(chalk.hex(COLORS.primary)(SEPARATORS.middle));

  // Top Choices
  console.log(
    chalk.hex(COLORS.primary)(SEPARATORS.vertical) +
      chalk
        .bold(chalk.hex(COLORS.secondary)("  ⭐ CONFIGURAÇÕES MAIS POPULARES"))
        .padEnd(63) +
      chalk.hex(COLORS.primary)(SEPARATORS.vertical),
  );
  console.log(chalk.hex(COLORS.primary)(SEPARATORS.middle));

  const archText = `  Architecture: ${chalk.bold.yellow(stats.mostPopularArchitecture)}`;
  const variantText = `  Variant: ${chalk.bold.yellow(stats.mostPopularVariant)}`;
  const pmText = `  Gerenciador: ${chalk.bold.yellow(stats.mostPopularPackageManager)}`;

  console.log(
    chalk.hex(COLORS.primary)(SEPARATORS.vertical) +
      pad(archText, 31) +
      pad(variantText, 31) +
      chalk.hex(COLORS.primary)(SEPARATORS.vertical),
  );

  console.log(
    chalk.hex(COLORS.primary)(SEPARATORS.vertical) +
      pad(pmText, 62) +
      chalk.hex(COLORS.primary)(SEPARATORS.vertical),
  );

  console.log(chalk.hex(COLORS.primary)(SEPARATORS.bottom));
  console.log();

  // Architecture Distribution
  console.log(
    chalk.bold(chalk.hex(COLORS.secondary)("📦 DISTRIBUIÇÃO DE ARQUITETURA\n")),
  );
  console.log(renderBarChart(stats.architectureDistribution));
  console.log();

  // Variant Distribution
  console.log(
    chalk.bold(chalk.hex(COLORS.secondary)("🎨 DISTRIBUIÇÃO DE VARIANTES\n")),
  );
  console.log(renderBarChart(stats.variantDistribution));
  console.log();

  // Package Manager Preference
  console.log(
    chalk.bold(
      chalk.hex(COLORS.secondary)(
        "📦 PREFERÊNCIA DE GERENCIADORES DE PACOTES\n",
      ),
    ),
  );
  console.log(renderBarChart(stats.packageManagerPreference));
  console.log();

  // Platform Distribution
  console.log(
    chalk.bold(chalk.hex(COLORS.secondary)("💻 DISTRIBUIÇÃO POR PLATAFORMA\n")),
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

  // Trend Data
  if (stats.trendData.length > 0) {
    console.log(
      chalk.bold(
        chalk.hex(COLORS.secondary)("📈 PROJETOS AO LONGO DO TEMPO\n"),
      ),
    );
    console.log(renderLineChart(stats.trendData));
    console.log();
  }

  // Summary Footer
  console.log(chalk.hex(COLORS.primary)("─".repeat(70)));
  console.log(
    chalk.gray(
      "✓ Todos os dados são anônimos. Nenhuma informação pessoal é armazenada ou transmitida.\n",
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
    `  Status: ${enabled ? chalk.green("Enabled") : chalk.red("Disabled")}`,
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

export function displayProductivityDashboard(
  insights: ProductivityInsights,
): void {
  console.log("\n");
  console.log(gradient.cristal.multiline("PRODUCTIVITY INSIGHTS DASHBOARD"));
  console.log();

  console.log(chalk.bold(chalk.hex(COLORS.secondary)("Overall Score\n")));
  const scoreBar =
    "█".repeat(Math.round(insights.averageProductivityScore / 5)) +
    "░".repeat(20 - Math.round(insights.averageProductivityScore / 5));
  const scoreColor =
    insights.averageProductivityScore >= 80
      ? chalk.green
      : insights.averageProductivityScore >= 50
        ? chalk.yellow
        : chalk.red;
  console.log(
    `  ${scoreColor(scoreBar)} ${chalk.bold(insights.averageProductivityScore)}/100\n`,
  );

  if (insights.timeToCommitRatios.length > 0) {
    console.log(
      chalk.bold(chalk.hex(COLORS.secondary)("Time-to-Commit Analysis\n")),
    );

    for (const ratio of insights.timeToCommitRatios.slice(0, 5)) {
      const projectName = ratio.projectPath.split("/").pop() || "project";
      const efficiencyColor =
        ratio.efficiency === "high"
          ? chalk.green
          : ratio.efficiency === "medium"
            ? chalk.yellow
            : chalk.red;

      console.log(`  ${chalk.bold(projectName)}`);
      console.log(`     Tracked Time: ${ratio.totalTrackedHours}h`);
      console.log(
        `     Time/Commit: ${(ratio.totalTrackedHours / 10).toFixed(2)}h (${efficiencyColor(ratio.efficiency)})`,
      );
      console.log(
        `     Commit Frequency: every ${ratio.commitFrequencyDays.toFixed(1)} days`,
      );
      console.log();
    }
  }

  if (insights.patterns) {
    console.log(chalk.bold(chalk.hex(COLORS.secondary)("Work Patterns\n")));
    console.log(
      `  Average Session: ${insights.patterns.averageSessionLength.toFixed(1)}h`,
    );
    console.log(
      `  Longest Session: ${insights.patterns.longestWorkSession.toFixed(1)}h`,
    );
    console.log(
      `  Commits per Session: ${insights.patterns.commitsPerSession}`,
    );
    console.log(
      `  Avg Time per Commit: ${insights.patterns.estimatedTimePerCommit.toFixed(1)}h\n`,
    );
  }

  if (insights.recommendations.length > 0) {
    console.log(chalk.bold(chalk.hex(COLORS.secondary)("Recommendations\n")));
    for (const rec of insights.recommendations) {
      console.log(`  ${rec}`);
    }
    console.log();
  }
}

export function displayTimeToCommitDetails(ratio: TimeToCommitRatio): void {
  console.log("\n");
  console.log(chalk.hex(COLORS.secondary).bold(`Time-to-Commit Analysis`));
  console.log(`Project: ${chalk.bold(ratio.projectPath)}\n`);

  const scoreBar =
    "█".repeat(Math.round(ratio.productivityScore / 5)) +
    "░".repeat(20 - Math.round(ratio.productivityScore / 5));

  console.log(
    `  Productivity Score: ${scoreBar} ${chalk.bold(ratio.productivityScore)}/100`,
  );
  console.log();

  console.log(chalk.bold("Metrics:"));
  console.log(
    `  Total Tracked Time: ${chalk.cyan(ratio.totalTrackedHours + "h")}`,
  );
  console.log(
    `  Hours Since Last Commit: ${chalk.cyan(ratio.hoursSinceLastCommit + "h")}`,
  );
  console.log(
    `  Commit Frequency: ${chalk.cyan("every " + ratio.commitFrequencyDays + " days")}`,
  );
  console.log();

  console.log(chalk.bold("Efficiency:"));
  const efficiencyEmoji =
    ratio.efficiency === "high"
      ? ">"
      : ratio.efficiency === "medium"
        ? "-"
        : "!";
  const efficiencyColor =
    ratio.efficiency === "high"
      ? chalk.green
      : ratio.efficiency === "medium"
        ? chalk.yellow
        : chalk.red;
  console.log(
    `  ${efficiencyEmoji} ${efficiencyColor(ratio.efficiency.toUpperCase())}`,
  );
  console.log();

  if (ratio.insights.length > 0) {
    console.log(chalk.bold("Insights:"));
    for (const insight of ratio.insights) {
      console.log(`  ${insight}`);
    }
    console.log();
  }
}
