import { confirm } from "@clack/prompts";
import chalk from "chalk";

const COLORS = {
  primary: "#8e61c6",
  secondary: "#a277ff",
} as const;

export interface LintingConfig {
  eslint: boolean;
  prettier: boolean;
  husky: boolean;
}

export async function promptLintingSetup(): Promise<LintingConfig> {
  try {
    console.log(
      chalk.hex(COLORS.secondary)("\n   Development Tools Configuration\n")
    );

    const eslint = (await confirm({
      message: "Add ESLint for code quality?",
      initialValue: true,
    })) as boolean;

    const prettier = (await confirm({
      message: "Add Prettier for code formatting?",
      initialValue: true,
    })) as boolean;

    const husky = (await confirm({
      message: "Add Husky for git hooks (pre-commit)?",
      initialValue: true,
    })) as boolean;

    return { eslint, prettier, husky };
  } catch {
    return { eslint: false, prettier: false, husky: false };
  }
}

export function generateESLintConfig(): string {
  return JSON.stringify(
    {
      extends: ["next/core-web-vitals"],
      rules: {
        "@next/next/no-html-link-for-pages": "off",
      },
    },
    null,
    2
  );
}

export function generatePrettierConfig(): string {
  return JSON.stringify(
    {
      semi: true,
      trailingComma: "es5",
      singleQuote: false,
      printWidth: 80,
      tabWidth: 2,
      useTabs: false,
    },
    null,
    2
  );
}

export function generateHuskyPreCommitHook(): string {
  return `#!/bin/sh
# This hook runs on pre-commit
# Add your pre-commit checks here
npx lint-staged
`;
}

export function generateLintStagedConfig(): string {
  return JSON.stringify(
    {
      "*.{js,jsx,ts,tsx}": ["eslint --fix", "prettier --write"],
      "*.{json,md}": ["prettier --write"],
    },
    null,
    2
  );
}

export function getLintingDependencies(config: LintingConfig): string[] {
  const deps: string[] = [];

  if (config.eslint) {
    deps.push("eslint", "@next/eslint-plugin-next");
  }

  if (config.prettier) {
    deps.push("prettier");
  }

  if (config.husky) {
    deps.push("husky", "lint-staged");
  }

  return deps;
}

export async function displayLintingInfo(config: LintingConfig): Promise<void> {
  console.log(
    chalk.hex(COLORS.secondary)("\n   Development tools configured:\n")
  );

  if (config.eslint) {
    console.log(chalk.hex(COLORS.primary)("   - ESLint"));
  }
  if (config.prettier) {
    console.log(chalk.hex(COLORS.primary)("   - Prettier"));
  }
  if (config.husky) {
    console.log(chalk.hex(COLORS.primary)("   - Husky + lint-staged"));
  }
}
