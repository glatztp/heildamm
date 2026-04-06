import fs from "fs";
import { platform } from "os";
import { HEILDAMM_DIR, ANALYTICS_FILE } from "./utils/index.js";
import { getMostPopular, aggregateDistribution } from "./utils/index.js";
import {
  roundPercent,
  calculatePercentage,
  roundToWhole,
} from "./utils/index.js";
import { hasData } from "./utils/index.js";

export interface ProjectMetrics {
  architecture: "feature-based" | "layer-based" | "domain-driven" | "monorepo";
  variant: "bare" | "trpc" | "prisma" | "full";
  packageManager: "pnpm" | "npm" | "yarn";
  timestamp: string;
  nodeVersion: string;
  platform: "win32" | "darwin" | "linux";
  cicdEnabled: boolean;
  cicdPlatform?: "github" | "gitlab" | "vercel";
  dependenciesSelected?: string[];
}

export interface AnalyticsStore {
  version: "1.0";
  enabled: boolean;
  firstRun: string;
  lastRun: string;
  projects: ProjectMetrics[];
}

export interface TrendData {
  month: string;
  count: number;
  architectures: Record<string, number>;
}

export interface AggregatedStats {
  totalProjects: number;
  architectureDistribution: Record<string, number>;
  variantDistribution: Record<string, number>;
  packageManagerPreference: Record<string, number>;
  platformDistribution: Record<string, number>;
  cicdAdoptionRate: number;
  averageProjectsPerMonth: number;
  mostPopularArchitecture: string;
  mostPopularVariant: string;
  mostPopularPackageManager: string;
  trendData: TrendData[];
}

export interface AnalyticsExport {
  stats: AggregatedStats;
  generatedAt: string;
  period: {
    from: string;
    to: string;
  };
  privacyNotice: string;
}

export async function initializeAnalytics(): Promise<void> {
  if (!fs.existsSync(HEILDAMM_DIR)) {
    fs.mkdirSync(HEILDAMM_DIR, { recursive: true });
  }

  if (!fs.existsSync(ANALYTICS_FILE)) {
    const store: AnalyticsStore = {
      version: "1.0",
      enabled: false,
      firstRun: new Date().toISOString(),
      lastRun: new Date().toISOString(),
      projects: [],
    };
    try {
      fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(store, null, 2));
    } catch (error) {
      console.error("[Analytics] Failed to initialize:", error);
    }
  }
}

export function getAnalyticsStore(): AnalyticsStore {
  try {
    const data = fs.readFileSync(ANALYTICS_FILE, "utf8");
    return JSON.parse(data) as AnalyticsStore;
  } catch {
    return {
      version: "1.0",
      enabled: false,
      firstRun: new Date().toISOString(),
      lastRun: new Date().toISOString(),
      projects: [],
    };
  }
}

function saveAnalyticsStore(store: AnalyticsStore): void {
  try {
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(store, null, 2));
  } catch (error) {
    console.error("[Analytics] Failed to save data:", error);
  }
}

export function isAnalyticsEnabled(): boolean {
  const store = getAnalyticsStore();
  return store.enabled;
}

export function setAnalyticsEnabled(enabled: boolean): void {
  const store = getAnalyticsStore();
  store.enabled = enabled;
  saveAnalyticsStore(store);
}

export function trackProjectCreation(
  architecture: string,
  variant: string,
  packageManager: string,
  cicdConfig?: { enabled: boolean; platform?: string },
): void {
  const enabled = isAnalyticsEnabled();

  if (!enabled) return;

  try {
    const store = getAnalyticsStore();

    const metric: ProjectMetrics = {
      architecture: architecture as
        | "feature-based"
        | "layer-based"
        | "domain-driven"
        | "monorepo",
      variant: variant as "bare" | "trpc" | "prisma" | "full",
      packageManager: packageManager as "pnpm" | "npm" | "yarn",
      timestamp: new Date().toISOString(),
      nodeVersion: process.versions.node,
      platform: platform() as "win32" | "darwin" | "linux",
      cicdEnabled: cicdConfig?.enabled ?? false,
      cicdPlatform: cicdConfig?.platform as
        | "github"
        | "gitlab"
        | "vercel"
        | undefined,
    };

    store.projects.push(metric);
    store.lastRun = new Date().toISOString();

    if (store.projects.length > 10000) {
      store.projects = store.projects.slice(-10000);
    }

    saveAnalyticsStore(store);
  } catch {
    // Silently fail
  }
}

export function calculateAggregatedStats(): AggregatedStats {
  const store = getAnalyticsStore();
  const projects = store.projects || [];

  if (!hasData(projects)) {
    return {
      totalProjects: 0,
      architectureDistribution: {},
      variantDistribution: {},
      packageManagerPreference: {},
      platformDistribution: {},
      cicdAdoptionRate: 0,
      averageProjectsPerMonth: 0,
      mostPopularArchitecture: "N/A",
      mostPopularVariant: "N/A",
      mostPopularPackageManager: "N/A",
      trendData: [],
    };
  }

  // Usar aggregateDistribution para as distribuições
  const archResult = aggregateDistribution(projects, (p) => p.architecture);
  const variantResult = aggregateDistribution(projects, (p) => p.variant);
  const packageManagerResult = aggregateDistribution(
    projects,
    (p) => p.packageManager,
  );
  const platformResult = aggregateDistribution(projects, (p) => p.platform);

  const architectureDistribution = archResult.distribution;
  const variantDistribution = variantResult.distribution;
  const packageManagerPreference = packageManagerResult.distribution;
  const platformDistribution = platformResult.distribution;

  const monthlyTrends: Record<
    string,
    { count: number; architectures: Record<string, number> }
  > = {};

  let cicdCount = 0;

  for (const project of projects) {
    if (project.cicdEnabled) cicdCount += 1;

    const date = new Date(project.timestamp);
    const month = date.toISOString().slice(0, 7);
    if (!monthlyTrends[month]) {
      monthlyTrends[month] = { count: 0, architectures: {} };
    }
    monthlyTrends[month].count += 1;
    monthlyTrends[month].architectures[project.architecture] =
      (monthlyTrends[month].architectures[project.architecture] ?? 0) + 1;
  }

  const trendData = Object.entries(monthlyTrends)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      count: data.count,
      architectures: data.architectures,
    }));

  const monthsWithData = Object.keys(monthlyTrends).length;
  const averageProjectsPerMonth =
    monthsWithData > 0 ? roundToWhole(projects.length / monthsWithData) : 0;

  return {
    totalProjects: projects.length,
    architectureDistribution,
    variantDistribution,
    packageManagerPreference,
    platformDistribution,
    cicdAdoptionRate: roundPercent(
      calculatePercentage(cicdCount, projects.length),
    ),
    averageProjectsPerMonth,
    mostPopularArchitecture: getMostPopular(architectureDistribution) ?? "N/A",
    mostPopularVariant: getMostPopular(variantDistribution) ?? "N/A",
    mostPopularPackageManager:
      getMostPopular(packageManagerPreference) ?? "N/A",
    trendData,
  };
}

export function clearAnalyticsData(): void {
  const store: AnalyticsStore = {
    version: "1.0",
    enabled: false,
    firstRun: new Date().toISOString(),
    lastRun: new Date().toISOString(),
    projects: [],
  };
  saveAnalyticsStore(store);
}

export function exportAnalyticsData() {
  const stats = calculateAggregatedStats();
  const store = getAnalyticsStore();

  return {
    stats,
    generatedAt: new Date().toISOString(),
    period: {
      from: store?.firstRun || new Date().toISOString(),
      to: store?.lastRun || new Date().toISOString(),
    },
    privacyNotice:
      "This export contains only aggregated, anonymized statistics. No personal or sensitive information is included.",
  };
}
