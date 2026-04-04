#!/usr/bin/env node

import chalk from "chalk";
import gradient from "gradient-string";
import fs from "fs";
import { select, text, confirm } from "@clack/prompts";
import { copy, ensureDir } from "fs-extra";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const PRIMARY_COLOR = "#8e61c6";
const SECONDARY_COLOR = "#a277ff";
const ACCENT_COLOR = "#c5a3ff";

const __dirname = dirname(fileURLToPath(import.meta.url));

const ARCHITECTURES = [
  "feature-based",
  "layer-based",
  "domain-driven",
  "monorepo",
];
const VARIANTS = ["bare", "trpc", "prisma", "full"];
const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn"];

function clearTerminal(): void {
  process.stdout.write("\x1Bc");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const ascii = fs.readFileSync(new URL("./ascii.txt", import.meta.url), "utf8");

async function showProgressBar(width = 40): Promise<void> {
  for (let i = 0; i <= width; i++) {
    const progress = "▰".repeat(i) + "▱".repeat(width - i);
    const percent = Math.round((i / width) * 100);
    process.stdout.write(
      `\r   ${chalk.hex(PRIMARY_COLOR)(progress)} ${percent}%`,
    );
    await sleep(15);
  }
  console.log("\n");
}

function renderWelcome() {
  clearTerminal();

  console.log(gradient(PRIMARY_COLOR, ACCENT_COLOR).multiline(ascii));
  console.log("");

  const welcomeMsg = chalk.hex(PRIMARY_COLOR).bold("Welcome to Heildamm");
  console.log(`   ${welcomeMsg}\n`);

  const description = chalk.hex(SECONDARY_COLOR)(
    "   This toolkit assists you in scaffolding Next.js projects\n" +
      "   with carefully designed architectural patterns.\n",
  );
  console.log(description);

  const docLink = chalk.hex(ACCENT_COLOR)(
    "   Documentation: https://github.com/glatztp/create-heildamm\n",
  );
  console.log(docLink);
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

async function installDependencies(
  targetPath: string,
  packageManager: string,
): Promise<void> {
  console.log(
    chalk
      .hex(PRIMARY_COLOR)
      .bold(`\n   Installing dependencies with ${packageManager}...\n`),
  );

  const width = 40;
  try {
    for (let i = 0; i <= width; i++) {
      const progress = "▰".repeat(i) + "▱".repeat(width - i);
      const percent = Math.round((i / width) * 100);
      process.stdout.write(
        `\r   ${chalk.hex(PRIMARY_COLOR)(progress)} ${percent}%`,
      );
      await sleep(Math.random() * 30);
    }
    console.log("\n");

    const installCmd =
      packageManager === "pnpm"
        ? "pnpm install"
        : packageManager === "yarn"
          ? "yarn install"
          : "npm install";

    execSync(installCmd, { cwd: targetPath, stdio: "inherit" });
  } catch (error) {
    console.log(
      chalk.hex(PRIMARY_COLOR)(
        `\n   Warning: Dependency installation encountered issues.\n`,
      ),
    );
  }
}

async function createProject() {
  renderWelcome();

  console.log(chalk.hex(PRIMARY_COLOR).bold("   Project Configuration\n"));

  let projectName: string;
  try {
    projectName = (await text({
      message: "Project name",
      placeholder: "my-next-app",
      validate: (value) => {
        if (!value) return "Project name is required";
        if (!/^[a-zA-Z0-9-_]+$/.test(value))
          return "Only letters, numbers, hyphens and underscores are allowed";
      },
    })) as string;
  } catch (e) {
    console.log(chalk.hex(PRIMARY_COLOR)("\n   Operation cancelled.\n"));
    process.exit(0);
  }

  let architecture: string;
  try {
    architecture = (await select({
      message: "Select your preferred architecture",
      options: ARCHITECTURES.map((arch) => ({
        value: arch,
        label: arch,
      })),
    })) as string;
  } catch (e) {
    console.log(chalk.hex(PRIMARY_COLOR)("\n   Operation cancelled.\n"));
    process.exit(0);
  }

  let variant: string;
  try {
    variant = (await select({
      message: "Select your technology stack variant",
      options: VARIANTS.map((v) => ({
        value: v,
        label: v,
      })),
    })) as string;
  } catch (e) {
    console.log(chalk.hex(PRIMARY_COLOR)("\n   Operation cancelled.\n"));
    process.exit(0);
  }

  let projectLocation: string;
  try {
    projectLocation = (await select({
      message: "Where would you like to create your project?",
      options: [
        {
          value: "current",
          label: "Current directory",
        },
        {
          value: "subfolder",
          label: "New subfolder with project name",
        },
      ],
    })) as string;
  } catch (e) {
    console.log(chalk.hex(PRIMARY_COLOR)("\n   Operation cancelled.\n"));
    process.exit(0);
  }

  let createInExisting = true;
  if (projectLocation === "subfolder") {
    try {
      createInExisting = (await confirm({
        message:
          "Create the project in a new subfolder? (Recommended for keeping structure clean)",
      })) as boolean;
    } catch (e) {
      console.log(chalk.hex(PRIMARY_COLOR)("\n   Operation cancelled.\n"));
      process.exit(0);
    }
  }

  let packageManager: string;
  try {
    packageManager = (await select({
      message: "Select your preferred package manager",
      options: [
        { value: "pnpm", label: "pnpm (recommended)" },
        { value: "npm", label: "npm" },
        { value: "yarn", label: "yarn" },
      ],
    })) as string;
  } catch (e) {
    console.log(chalk.hex(PRIMARY_COLOR)("\n   Operation cancelled.\n"));
    process.exit(0);
  }

  const locationDisplay = createInExisting
    ? `${projectName}/`
    : "current directory";

  let confirmed: boolean;
  try {
    confirmed = (await confirm({
      message: `Proceed with creating ${chalk.hex(ACCENT_COLOR)(projectName)} in ${chalk.hex(ACCENT_COLOR)(locationDisplay)}?`,
    })) as boolean;
  } catch (e) {
    console.log(chalk.hex(PRIMARY_COLOR)("\n   Operation cancelled.\n"));
    process.exit(0);
  }

  if (!confirmed) {
    console.log(chalk.hex(PRIMARY_COLOR)("\n   Operation cancelled.\n"));
    process.exit(0);
  }

  try {
    clearTerminal();
    console.log(gradient(PRIMARY_COLOR, ACCENT_COLOR).multiline(ascii));
    console.log(
      chalk.hex(PRIMARY_COLOR).bold("\n   Creating your project...\n"),
    );

    await showProgressBar();

    const templatePath = resolve(
      __dirname,
      "..",
      "..",
      "templates",
      architecture,
      variant,
    );

    let targetPath: string;
    if (createInExisting) {
      targetPath = resolve(process.cwd(), projectName);
    } else {
      targetPath = process.cwd();
    }

    await ensureDir(targetPath);
    await copy(templatePath, targetPath);

    console.log(`\n${chalk.hex(PRIMARY_COLOR)("─".repeat(57))}\n`);
    console.log(
      chalk.hex(ACCENT_COLOR).bold(`   Project created successfully!\n`),
    );

    let autoInstall: boolean;
    try {
      autoInstall = (await confirm({
        message: "Install dependencies now?",
      })) as boolean;
    } catch (e) {
      autoInstall = false;
    }

    if (autoInstall) {
      await installDependencies(targetPath, packageManager);
    }

    const installCmd =
      packageManager === "pnpm"
        ? "pnpm install"
        : packageManager === "yarn"
          ? "yarn install"
          : "npm install";

    const nextSteps = createInExisting
      ? `   cd ${projectName}\n${autoInstall ? "" : `   ${installCmd}\n`}   ${packageManager} dev`
      : `${autoInstall ? "" : `   ${installCmd}\n`}   ${packageManager} dev`;

    if (autoInstall) {
      console.log(
        chalk.hex(SECONDARY_COLOR)(
          `\n   Dependencies installed! Ready to start:\n\n${nextSteps}\n`,
        ),
      );
    } else {
      console.log(
        chalk.hex(SECONDARY_COLOR)(`\n   Next steps:\n\n${nextSteps}\n`),
      );
    }
    console.log(`${chalk.hex(PRIMARY_COLOR)("─".repeat(57))}\n`);

    if (isVSCodeAvailable()) {
      let openVSCodeNow: boolean;
      try {
        openVSCodeNow = (await confirm({
          message: "Open project in VS Code?",
        })) as boolean;

        if (openVSCodeNow) {
          openVSCode(targetPath);
          console.log(chalk.hex(ACCENT_COLOR)("   Opening VS Code...\n"));
        }
      } catch (e) {
        // Silently fail if user cancels
      }
    }
  } catch (error) {
    console.log(
      chalk.hex(PRIMARY_COLOR)(
        `\n   Error creating project: ${(error as Error).message}\n`,
      ),
    );
    process.exit(1);
  }
}

async function run(): Promise<void> {
  const args = process.argv.slice(2);

  if (args[0] === "--help" || args[0] === "-h") {
    renderWelcome();
  } else {
    await createProject();
  }
}

run();
