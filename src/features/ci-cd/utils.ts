import {
  generateGitHubWorkflow,
  generateGitLabCI,
  generateAzurePipeline,
} from "./generators.js";
import { type CICDPlatform, type CICDConfig } from "./types.js";
import fs from "fs";
import { resolve } from "path";
import { ensureDir } from "fs-extra";

export function getCICDTemplateDirectory(
  platform: CICDPlatform
): string | null {
  const mapping: Record<CICDPlatform, string> = {
    github: ".github/workflows",
    gitlab: ".gitlab-ci",
    azure: ".azure-pipelines",
    none: "",
  };

  return mapping[platform] || null;
}

export async function saveCICDFiles(
  targetPath: string,
  cicdConfig: CICDConfig,
  packageManager: string
): Promise<void> {
  if (
    !cicdConfig.enabled ||
    !cicdConfig.platform ||
    cicdConfig.platform === "none"
  ) {
    return;
  }

  const platform = cicdConfig.platform;

  if (platform === "github") {
    const workflowDir = resolve(targetPath, ".github", "workflows");
    await ensureDir(workflowDir);
    const workflow = generateGitHubWorkflow("", packageManager);
    fs.writeFileSync(resolve(workflowDir, "ci-cd.yml"), workflow, "utf-8");
  } else if (platform === "gitlab") {
    const gitlabCi = generateGitLabCI("", packageManager);
    fs.writeFileSync(resolve(targetPath, ".gitlab-ci.yml"), gitlabCi, "utf-8");
  } else if (platform === "azure") {
    const azureDir = resolve(targetPath, "azure-pipelines");
    await ensureDir(azureDir);
    const pipeline = generateAzurePipeline("", packageManager);
    fs.writeFileSync(resolve(azureDir, "pipeline.yml"), pipeline, "utf-8");
  }
}
