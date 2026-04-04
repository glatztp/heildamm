import fs from "fs";
import { join } from "path";
import { homedir } from "os";

const ANALYTICS_DIR = join(homedir(), ".heildamm");
const ANALYTICS_FILE = join(ANALYTICS_DIR, "analytics.json");

interface AnalyticsData {
  enabled: boolean;
  projectsCreated: number;
  firstRun: string;
  lastRun: string;
}

export async function initializeAnalytics(): Promise<void> {
  if (!fs.existsSync(ANALYTICS_DIR)) {
    fs.mkdirSync(ANALYTICS_DIR, { recursive: true });
  }

  if (!fs.existsSync(ANALYTICS_FILE)) {
    const data: AnalyticsData = {
      enabled: false,
      projectsCreated: 0,
      firstRun: new Date().toISOString(),
      lastRun: new Date().toISOString(),
    };
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2));
  }
}

export function isAnalyticsEnabled(): boolean {
  try {
    const data = JSON.parse(
      fs.readFileSync(ANALYTICS_FILE, "utf8"),
    ) as AnalyticsData;
    return data.enabled;
  } catch {
    return false;
  }
}

export function setAnalyticsEnabled(enabled: boolean): void {
  const data = getAnalyticsData();
  data.enabled = enabled;
  updateAnalyticsData(data);
}

export function getAnalyticsData(): AnalyticsData {
  try {
    return JSON.parse(fs.readFileSync(ANALYTICS_FILE, "utf8")) as AnalyticsData;
  } catch {
    return {
      enabled: false,
      projectsCreated: 0,
      firstRun: new Date().toISOString(),
      lastRun: new Date().toISOString(),
    };
  }
}

export function updateAnalyticsData(data: AnalyticsData): void {
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2));
}

export async function trackProjectCreation(
  projectName: string,
  architecture: string,
  variant: string,
): Promise<void> {
  if (!isAnalyticsEnabled()) return;

  try {
    const data = getAnalyticsData();
    data.projectsCreated += 1;
    data.lastRun = new Date().toISOString();
    updateAnalyticsData(data);

    // Could be extended with remote tracking later
    console.log(
      `[Analytics] Project created: ${projectName} (${architecture}/${variant})`,
    );
  } catch {
    // Silently fail
  }
}
