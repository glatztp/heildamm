import chalk from "chalk";
import { type CICDConfig } from "../ci-cd/index.js";

const COLORS = {
  primary: "#8e61c6",
  secondary: "#a277ff",
  accent: "#c5a3ff",
} as const;

const BOX = {
  border: "─",
  topLeft: "┌",
  topRight: "┐",
  bottomLeft: "└",
  bottomRight: "┘",
  vertical: "│",
  verticalRight: "├",
  verticalLeft: "┤",
} as const;

interface ProjectConfig {
  name: string;
  architecture: string;
  variant: string;
  packageManager: string;
  location: string;
  hasLinting: {
    eslint: boolean;
    prettier: boolean;
    husky: boolean;
  };
  hasCICD?: CICDConfig;
  autoInstalled: boolean;
  dependencyStats?: {
    total: number;
    prod: number;
    dev: number;
    size: string;
  };
}

function createSummaryBox(width = 60): string {
  const line = BOX.border.repeat(width);
  return `${BOX.topLeft}${line}${BOX.topRight}`;
}

function createBottomBox(width = 60): string {
  const line = BOX.border.repeat(width);
  return `${BOX.bottomLeft}${line}${BOX.bottomRight}`;
}

function createSeparator(width = 60): string {
  const line = BOX.border.repeat(width);
  return `${BOX.verticalRight}${line}${BOX.verticalLeft}`;
}

function padRight(text: string, width: number): string {
  return text + " ".repeat(Math.max(0, width - text.length));
}

export function displaySummaryScreen(config: ProjectConfig): void {
  const width = 58;
  const boxWidth = 60;

  console.log();
  console.log(chalk.hex(COLORS.secondary)(createSummaryBox(boxWidth)));

  const header = "PROJECT CREATED SUCCESSFULLY";
  const headerPadded = padRight(header, width);
  console.log(
    chalk
      .hex(COLORS.accent)
      .bold(`${BOX.vertical} ${headerPadded} ${BOX.vertical}`)
  );

  console.log(chalk.hex(COLORS.secondary)(createSeparator(boxWidth)));

  const rows: Array<[string, string]> = [
    ["Project Name", config.name],
    ["Location", config.location],
    ["Architecture", config.architecture],
    ["Variant", config.variant],
    ["Package Manager", config.packageManager],
  ];

  rows.forEach(([label, value]) => {
    const content = `${label}: ${value}`;
    const padding = " ".repeat(Math.max(0, width - content.length));
    const line = `${BOX.vertical} ${label}: ${value}${padding} ${BOX.vertical}`;
    console.log(
      chalk.hex(COLORS.primary)(
        line.replace(value, chalk.hex(COLORS.accent)(value))
      )
    );
  });

  if (
    config.hasLinting.eslint ||
    config.hasLinting.prettier ||
    config.hasLinting.husky
  ) {
    console.log(chalk.hex(COLORS.secondary)(createSeparator(boxWidth)));
    const toolsLabel = "Development Tools:";
    const toolsPadding = " ".repeat(Math.max(0, width - toolsLabel.length));
    console.log(`${BOX.vertical} ${toolsLabel}${toolsPadding} ${BOX.vertical}`);

    const tools: string[] = [];
    if (config.hasLinting.eslint) tools.push("ESLint");
    if (config.hasLinting.prettier) tools.push("Prettier");
    if (config.hasLinting.husky) tools.push("Husky");

    tools.forEach((tool) => {
      const toolStr = `- ${tool}`;
      const padding = " ".repeat(Math.max(0, width - toolStr.length));
      const line = `${BOX.vertical} ${toolStr}${padding} ${BOX.vertical}`;
      console.log(chalk.hex(COLORS.primary)(line));
    });
  }

  if (config.hasCICD && config.hasCICD.enabled) {
    console.log(chalk.hex(COLORS.secondary)(createSeparator(boxWidth)));
    const cicdLabel = "CI/CD Configuration:";
    const cicdPadding = " ".repeat(Math.max(0, width - cicdLabel.length));
    console.log(`${BOX.vertical} ${cicdLabel}${cicdPadding} ${BOX.vertical}`);

    const platformNames: Record<string, string> = {
      github: "GitHub Actions",
      gitlab: "GitLab CI/CD",
      azure: "Azure DevOps",
      none: "None",
    };

    const platform = config.hasCICD.platform || "none";
    const platformStr = `- ${platformNames[platform] || platform}`;
    const padding = " ".repeat(Math.max(0, width - platformStr.length));
    const line = `${BOX.vertical} ${platformStr}${padding} ${BOX.vertical}`;
    console.log(chalk.hex(COLORS.primary)(line));
  }

  if (config.dependencyStats) {
    console.log(chalk.hex(COLORS.secondary)(createSeparator(boxWidth)));
    const depsLabel = "Dependency Overview:";
    const depsPadding = " ".repeat(Math.max(0, width - depsLabel.length));
    console.log(`${BOX.vertical} ${depsLabel}${depsPadding} ${BOX.vertical}`);

    const depLines: Array<[string, string]> = [
      ["Total Dependencies", config.dependencyStats.total.toString()],
      ["Production", config.dependencyStats.prod.toString()],
      ["Development", config.dependencyStats.dev.toString()],
      ["Estimated Size", config.dependencyStats.size],
    ];

    depLines.forEach(([label, value]) => {
      const content = `${label}: ${value}`;
      const padding = " ".repeat(Math.max(0, width - content.length));
      const line = `${BOX.vertical} ${label}: ${value}${padding} ${BOX.vertical}`;
      console.log(
        chalk.hex(COLORS.primary)(
          line.replace(value, chalk.hex(COLORS.accent)(value))
        )
      );
    });
  }

  console.log(chalk.hex(COLORS.secondary)(createBottomBox(boxWidth)));
}

export function displayResourceLinks(): void {
  console.log(chalk.hex(COLORS.secondary).bold("   Resources:\n"));

  const resources = [
    ["Next.js Documentation", "https://nextjs.org/docs"],
    ["React Documentation", "https://react.dev"],
    ["Heildamm Repository", "https://github.com/glatztp/create-heildamm"],
  ];

  resources.forEach(([name, url]) => {
    console.log(
      chalk.hex(COLORS.primary)(`   - ${name}:`),
      chalk.hex(COLORS.accent)(url)
    );
  });

  console.log();
}
