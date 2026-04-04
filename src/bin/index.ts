#!/usr/bin/env node

import chalk from "chalk";
import gradient from "gradient-string";
import fs from "fs";
import { select, text, confirm } from "@clack/prompts";
import { copy, ensureDir } from "fs-extra";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

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
const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn"] as const;

const __dirname = dirname(fileURLToPath(import.meta.url));
const ASCII_ART = fs.readFileSync(
  new URL("./ascii.txt", import.meta.url),
  "utf8",
);

function clearTerminal(): void {
  process.stdout.write("\x1Bc");
}

function createBoxLine(width = 55): string {
  const line = BOX.border.repeat(width);
  return `   ${BOX.topLeft}${line}${BOX.topRight}`;
}

function createBottomBoxLine(width = 55): string {
  const line = BOX.border.repeat(width);
  return `   ${BOX.bottomLeft}${line}${BOX.bottomRight}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function drawProgressBar(width = 40, delay = 15): Promise<void> {
  for (let i = 0; i <= width; i++) {
    const progress = "█".repeat(i) + "░".repeat(width - i);
    const percent = Math.round((i / width) * 100);
    process.stdout.write(
      `\r   ${chalk.hex(COLORS.primary)(progress)} ${percent}%`,
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
  } catch {
    // Silently fail if VS Code open fails
  }
}

function logCancelled(): void {
  console.log(chalk.hex(COLORS.primary)("\n   Operation cancelled.\n"));
}

function logError(message: string): void {
  console.log(chalk.hex(COLORS.primary)(`\n   ✗ Error: ${message}\n`));
}

function logSuccess(message: string): void {
  console.log(
    chalk
      .hex(COLORS.accent)
      .bold(
        `${BOX.vertical}   ${message.padEnd(53 - BOX.vertical.length)}${BOX.vertical}`,
      ),
  );
}

async function installDependencies(
  targetPath: string,
  packageManager: string,
): Promise<void> {
  console.log(
    chalk.hex(COLORS.primary)(
      `\n   ↓ Installing dependencies with ${packageManager}...\n`,
    ),
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
        `\n   ⚠ Installation encountered issues. Continue anyway.\n`,
      ),
    );
  }
}

async function promptText(
  message: string,
  placeholder?: string,
  validate?: (value: string) => string | void,
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
  options: Array<{ value: string; label: string }>,
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
    `\n   ${chalk.hex(COLORS.primary).bold("Welcome to Heildamm")}\n`,
  );
  console.log(
    chalk.hex(COLORS.secondary)(
      `   Scaffold Next.js projects with opinionated architectures\n`,
    ),
  );
  console.log(
    chalk.hex(COLORS.accent)(
      `   Docs: https://github.com/glatztp/create-heildamm\n`,
    ),
  );
}

function renderSuccessMessage(nextSteps: string, targetPath: string): void {
  clearTerminal();
  console.log(gradient(COLORS.primary, COLORS.accent).multiline(ASCII_ART));
  console.log(`\n${createBoxLine()}`);
  logSuccess("✓ Project created successfully!");
  console.log(`${createBottomBoxLine()}\n`);

  console.log(
    chalk.hex(COLORS.secondary)(`   ${nextSteps.split("\n").join("\n   ")}`),
  );
  console.log();

  if (isVSCodeAvailable()) {
    promptConfirm(USER_PROMPTS.openVSCode)
      .then((open) => {
        if (open) {
          openVSCode(targetPath);
          console.log(chalk.hex(COLORS.accent)("\n   Opening VS Code...\n"));
        }
      })
      .catch(() => {
        // Silently fail if user cancels
      });
  }
}

async function createProject(): Promise<void> {
  renderWelcome();
  console.log(chalk.hex(COLORS.primary).bold("   Project Configuration\n"));

  // Gather project configuration
  const projectName = await promptText(
    USER_PROMPTS.projectName,
    USER_PROMPTS.projectNamePlaceholder,
    (value) => {
      if (!value) return "Project name is required";
      if (!/^[a-zA-Z0-9-_]+$/.test(value))
        return "Only letters, numbers, hyphens and underscores are allowed";
    },
  );

  const architecture = await promptSelect(
    USER_PROMPTS.architecture,
    ARCHITECTURES.map((arch) => ({ value: arch, label: arch })),
  );

  const variant = await promptSelect(
    USER_PROMPTS.variant,
    VARIANTS.map((v) => ({ value: v, label: v })),
  );

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

  const locationDisplay = createInSubfolder
    ? `${projectName}/`
    : "current directory";

  const locationName = chalk.hex(COLORS.accent)(locationDisplay);
  const confirmed = await promptConfirm(
    `${USER_PROMPTS.confirmCreation} ${chalk.hex(COLORS.accent)(projectName)} in ${locationName}?`,
  );

  if (!confirmed) {
    logCancelled();
    process.exit(0);
  }

  // Create project
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
      variant,
    );

    const targetPath = createInSubfolder
      ? resolve(process.cwd(), projectName)
      : process.cwd();

    await ensureDir(targetPath);
    await copy(templatePath, targetPath);

    // Ask about dependencies
    const autoInstall = await promptConfirm(USER_PROMPTS.installDependencies);

    if (autoInstall) {
      await installDependencies(targetPath, packageManager);
    }

    // Display next steps
    const nextSteps = createInSubfolder
      ? `cd ${projectName}\n${autoInstall ? "" : `${getInstallCommand(packageManager)}\n`}${packageManager} dev`
      : `${autoInstall ? "" : `${getInstallCommand(packageManager)}\n`}${packageManager} dev`;

    renderSuccessMessage(nextSteps, targetPath);
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
    error instanceof Error ? error.message : "An unknown error occurred",
  );
  process.exit(1);
});
