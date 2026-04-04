#!/usr/bin/env node

import chalk from "chalk";
import gradient from "gradient-string";
import fs from "fs";
import { select, text, confirm } from "@clack/prompts";
import { copy, ensureDir } from "fs-extra";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import { checkForUpdates } from "../lib/features/update-checker.js";
import {
  initializeAnalytics,
  setAnalyticsEnabled,
  trackProjectCreation,
} from "../lib/utils/analytics.js";
import {
  promptLintingSetup,
  displayLintingInfo,
} from "../lib/features/linting-formatting.js";
import { calculateDependencyStats } from "../lib/features/dependency-management.js";
import { displayProjectStructure } from "../lib/features/project-visualization.js";
import {
  displaySummaryScreen,
  displayResourceLinks,
} from "../lib/features/summary-screen.js";
import { generateReadme } from "../lib/features/readme-generator.js";

const COLORS = {
  primary: "#8e61c6",
  secondary: "#a277ff",
  accent: "#c5a3ff",
} as const;

const USER_PROMPTS = {
  projectName: "Project name",
  architecture: "Select your preferred architecture",
  variant: "Select your technology stack variant",
  location: "Where would you like to create your project?",
  createSubfolder:
    "Create the project in a new subfolder? (Recommended for keeping structure clean)",
  packageManager: "Select your preferred package manager",
  confirmCreation: "Proceed with creating",
  installDependencies: "Install dependencies now?",
  openVSCode: "Open project in VS Code?",
  projectNamePlaceholder: "my-next-app",
  currentDirectory: "Current directory",
  newSubfolder: "New subfolder with project name",
  pnpmRecommended: "pnpm (recommended)",
} as const;

const ARCHITECTURES = [
  "feature-based",
  "layer-based",
  "domain-driven",
  "monorepo",
] as const;
const VARIANTS = ["bare", "trpc", "prisma", "full"] as const;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASCII_ART = fs.readFileSync(
  new URL("./ascii.txt", import.meta.url),
  "utf8"
);

function clearTerminal(): void {
  process.stdout.write("\x1Bc");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function drawProgressBar(width = 40, delay = 15): Promise<void> {
  for (let i = 0; i <= width; i++) {
    const progress = "█".repeat(i) + "░".repeat(width - i);
    const percent = Math.round((i / width) * 100);
    process.stdout.write(
      `\r   ${chalk.hex(COLORS.primary)(progress)} ${percent}%`
    );
    await sleep(delay);
  }
  console.log("\n");
}

function getInstallCommand(packageManager: string): string {
  const commands: Record<string, string> = {
    pnpm: "pnpm install",
    yarn: "yarn install",
    npm: "npm install",
  };
  return commands[packageManager] || "npm install";
}

function isVSCodeAvailable(): boolean {
  try {
    execSync("code --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function openVSCode(projectPath: string): void {
  try {
    execSync(`code "${projectPath}"`, { stdio: "ignore" });
  } catch {}
}

function logCancelled(): void {
  console.log(chalk.hex(COLORS.primary)("\n   Operation cancelled.\n"));
}

function processPackageJson(filePath: string, projectName: string): void {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const updated = content.replace(/\{\{projectName\}\}/g, projectName);
    fs.writeFileSync(filePath, updated, "utf-8");
  } catch (error) {}
}

function logError(message: string): void {
  console.log(chalk.hex(COLORS.primary)(`\n   Error: ${message}\n`));
}

async function installDependencies(
  targetPath: string,
  packageManager: string
): Promise<void> {
  console.log(
    chalk.hex(COLORS.primary)(
      `\n   ↓ Installing dependencies with ${packageManager}...\n`
    )
  );

  try {
    await drawProgressBar(40, Math.random() * 30);
    execSync(getInstallCommand(packageManager), {
      cwd: targetPath,
      stdio: "inherit",
    });
  } catch {
    console.log(
      chalk.hex(COLORS.primary)(
        `\n   ⚠ Installation encountered issues. Continue anyway.\n`
      )
    );
  }
}

async function promptText(
  message: string,
  placeholder?: string,
  validate?: (value: string) => string | void
): Promise<string> {
  try {
    return (await text({
      message,
      placeholder,
      validate,
    })) as string;
  } catch {
    logCancelled();
    process.exit(0);
  }
}

async function promptSelect(
  message: string,
  options: Array<{ value: string; label: string }>
): Promise<string> {
  try {
    return (await select({
      message,
      options,
    })) as string;
  } catch {
    logCancelled();
    process.exit(0);
  }
}

async function promptConfirm(message: string): Promise<boolean> {
  try {
    return (await confirm({ message })) as boolean;
  } catch {
    return false;
  }
}

function renderWelcome(): void {
  clearTerminal();
  console.log(gradient(COLORS.primary, COLORS.accent).multiline(ASCII_ART));
  console.log(
    `\n   ${chalk.hex(COLORS.primary).bold("Welcome to Heildamm")}\n`
  );
  console.log(
    chalk.hex(COLORS.secondary)(
      `   Scaffold Next.js projects with opinionated architectures\n`
    )
  );
  console.log(
    chalk.hex(COLORS.accent)(
      `   Docs: https://github.com/glatztp/create-heildamm\n`
    )
  );
}

async function createProject(): Promise<void> {
  renderWelcome();

  await checkForUpdates();
  await initializeAnalytics();

  console.log(chalk.hex(COLORS.primary).bold("   Project Configuration\n"));

  const projectName = await promptText(
    USER_PROMPTS.projectName,
    USER_PROMPTS.projectNamePlaceholder,
    (value) => {
      if (!value) return "Project name is required";
      if (!/^[a-zA-Z0-9-_]+$/.test(value))
        return "Only letters, numbers, hyphens and underscores are allowed";
    }
  );

  const architecture = await promptSelect(
    USER_PROMPTS.architecture,
    ARCHITECTURES.map((arch) => ({ value: arch, label: arch }))
  );

  const variant = await promptSelect(
    USER_PROMPTS.variant,
    VARIANTS.map((v) => ({ value: v, label: v }))
  );

  displayProjectStructure(architecture, variant);

  const projectLocation = await promptSelect(USER_PROMPTS.location, [
    { value: "current", label: USER_PROMPTS.currentDirectory },
    { value: "subfolder", label: USER_PROMPTS.newSubfolder },
  ]);

  let createInSubfolder = true;
  if (projectLocation === "subfolder") {
    createInSubfolder = await promptConfirm(USER_PROMPTS.createSubfolder);
  }

  const packageManager = await promptSelect(USER_PROMPTS.packageManager, [
    { value: "pnpm", label: USER_PROMPTS.pnpmRecommended },
    { value: "npm", label: "npm" },
    { value: "yarn", label: "yarn" },
  ]);

  const lintingConfig = await promptLintingSetup();
  await displayLintingInfo(lintingConfig);

  const enableAnalytics = await promptConfirm(
    "\n Enable anonymous analytics to help improve Heildamm?"
  );
  if (enableAnalytics) {
    setAnalyticsEnabled(true);
    console.log(chalk.hex(COLORS.accent)("   Analytics enabled\n"));
  }

  const locationDisplay = createInSubfolder
    ? `${projectName}/`
    : "current directory";

  const locationName = chalk.hex(COLORS.accent)(locationDisplay);
  const confirmed = await promptConfirm(
    `${USER_PROMPTS.confirmCreation} ${chalk.hex(COLORS.accent)(projectName)} in ${locationName}?`
  );

  if (!confirmed) {
    logCancelled();
    process.exit(0);
  }

  try {
    clearTerminal();
    console.log(gradient(COLORS.primary, COLORS.accent).multiline(ASCII_ART));
    console.log(chalk.hex(COLORS.primary)(`\n   Creating your project...\n`));

    await drawProgressBar();

    const templatePath = resolve(
      __dirname,
      "..",
      "..",
      "templates",
      architecture,
      variant
    );

    const targetPath = createInSubfolder
      ? resolve(process.cwd(), projectName)
      : process.cwd();

    await ensureDir(targetPath);
    await copy(templatePath, targetPath);
    processPackageJson(resolve(targetPath, "package.json"), projectName);

    const readmeContent = generateReadme(
      projectName,
      architecture,
      variant,
      packageManager,
      lintingConfig.eslint
    );
    fs.writeFileSync(resolve(targetPath, "README.md"), readmeContent);

    const autoInstall = await promptConfirm(USER_PROMPTS.installDependencies);

    if (autoInstall) {
      await installDependencies(targetPath, packageManager);
    }

    await trackProjectCreation(projectName, architecture, variant);

    clearTerminal();
    console.log(gradient(COLORS.primary, COLORS.accent).multiline(ASCII_ART));

    const dependencyStats = calculateDependencyStats(
      resolve(targetPath, "package.json")
    );

    displaySummaryScreen({
      name: projectName,
      architecture,
      variant,
      packageManager,
      location: createInSubfolder ? `${projectName}/` : ".",
      hasLinting: lintingConfig,
      autoInstalled: autoInstall,
      dependencyStats,
    });

    displayResourceLinks();

    if (isVSCodeAvailable()) {
      const open = await promptConfirm(USER_PROMPTS.openVSCode);
      if (open) {
        openVSCode(targetPath);
        console.log(chalk.hex(COLORS.accent)("   Opening VS Code...\n"));
      }
    }
  } catch (error) {
    logError((error as Error).message);
    process.exit(1);
  }
}

async function run(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    renderWelcome();
  } else {
    await createProject();
  }
}

run().catch((error) => {
  logError(
    error instanceof Error ? error.message : "An unknown error occurred"
  );
  process.exit(1);
});
