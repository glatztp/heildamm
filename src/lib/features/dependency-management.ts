import fs from "fs";
import chalk from "chalk";

const COLORS = {
  primary: "#8e61c6",
  secondary: "#a277ff",
  accent: "#c5a3ff",
} as const;

interface DependencyStats {
  total: number;
  prod: number;
  dev: number;
  size: string;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export function calculateDependencyStats(
  packageJsonPath: string
): DependencyStats {
  try {
    const content = fs.readFileSync(packageJsonPath, "utf8");
    const packageJson = JSON.parse(content) as PackageJson;

    const prod = Object.keys(packageJson.dependencies || {}).length;
    const dev = Object.keys(packageJson.devDependencies || {}).length;
    const total = prod + dev;

    const approxSize = total * 5;
    const size =
      approxSize > 1000
        ? `~${(approxSize / 1000).toFixed(1)}GB`
        : `~${approxSize}MB`;

    return { total, prod, dev, size };
  } catch {
    return { total: 0, prod: 0, dev: 0, size: "0MB" };
  }
}

export function displayDependencyStats(
  _projectName: string,
  packageJsonPath: string,
  _packageManager: string
): void {
  const stats = calculateDependencyStats(packageJsonPath);

  console.log(chalk.hex(COLORS.secondary)("\n   Dependency Overview:\n"));
  console.log(
    chalk.hex(COLORS.primary)(
      `Total Dependencies: ${chalk.hex(COLORS.accent)(stats.total.toString())}`
    )
  );
  console.log(
    chalk.hex(COLORS.primary)(
      `Production: ${chalk.hex(COLORS.accent)(stats.prod.toString())}`
    )
  );
  console.log(
    chalk.hex(COLORS.primary)(
      `Development: ${chalk.hex(COLORS.accent)(stats.dev.toString())}`
    )
  );
  console.log(
    chalk.hex(COLORS.primary)(
      `Estimated Size: ${chalk.hex(COLORS.accent)(stats.size)}`
    )
  );
}

export function getUpdateCommand(packageManager: string): string {
  const commands: Record<string, string> = {
    pnpm: "pnpm update",
    npm: "npm update",
    yarn: "yarn upgrade",
  };
  return commands[packageManager] || "npm update";
}

export function displayUpdateTip(packageManager: string): void {
  const command = getUpdateCommand(packageManager);
  console.log(
    chalk.hex(COLORS.secondary)(
      `\n   To update dependencies: ${chalk.hex(COLORS.accent)(command)}\n`
    )
  );
}
