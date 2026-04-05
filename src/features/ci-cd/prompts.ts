import chalk from "chalk";
import {
  type CICDConfig,
  type CICDPlatform,
  type CICDOption,
} from "./types.js";

const COLORS = {
  primary: "#8e61c6",
  secondary: "#a277ff",
  accent: "#c5a3ff",
} as const;

export const CI_CD_OPTIONS: CICDOption[] = [
  {
    value: "github",
    label: "GitHub Actions",
    description: "Automated workflows with GitHub Actions",
  },
  {
    value: "gitlab",
    label: "GitLab CI/CD",
    description: "GitLab CI/CD pipelines",
  },
  {
    value: "azure",
    label: "Azure DevOps",
    description: "Azure DevOps pipelines",
  },
  {
    value: "none",
    label: "None - Configure later",
    description: "Skip CI/CD setup",
  },
];

export function getCICDPromptOptions(): Array<{
  value: string;
  label: string;
}> {
  return CI_CD_OPTIONS.map((option) => ({
    value: option.value,
    label: option.label,
  }));
}

export function displayCICDInfo(config: CICDConfig): void {
  if (!config.enabled) {
    console.log(
      chalk.hex(COLORS.secondary)(
        "   CI/CD: Not configured (you can add it later)\n"
      )
    );
    return;
  }

  const platformNames: Record<CICDPlatform, string> = {
    github: "GitHub Actions",
    gitlab: "GitLab CI/CD",
    azure: "Azure DevOps",
    none: "None",
  };

  const platformFeatures: Record<CICDPlatform, string[]> = {
    github: [
      "Automated testing on push",
      "Build and deploy workflows",
      "Dependency updates",
    ],
    gitlab: [
      "GitLab CI/CD pipelines",
      "Automated deployment",
      "Security scanning",
    ],
    azure: ["Build pipelines", "Release management", "Automated testing"],
    none: [],
  };

  const platform = config.platform || "none";
  const features = platformFeatures[platform];

  console.log(
    chalk.hex(COLORS.primary)(`   ✓ CI/CD: ${platformNames[platform]}`)
  );
  if (features.length > 0) {
    features.forEach((feature) => {
      console.log(chalk.hex(COLORS.secondary)(`     • ${feature}`));
    });
  }
  console.log();
}
