import fs from "fs";
import { join } from "path";
import { homedir } from "os";
import chalk from "chalk";

const CACHE_DIR = join(homedir(), ".heildamm");
const UPDATE_CACHE_FILE = join(CACHE_DIR, ".update-check");
const CACHE_DURATION = 24 * 60 * 60 * 1000;

interface UpdateCache {
  lastChecked: number;
  latestVersion: string;
  currentVersion: string;
}

function getCurrentVersion(): string {
  try {
    const packageJson = JSON.parse(
      fs.readFileSync(
        join(__dirname, "..", "..", "..", "package.json"),
        "utf8",
      ),
    );
    return packageJson.version;
  } catch {
    return "0.0.0";
  }
}

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const response = await fetch(
      "https://registry.npmjs.org/create-heildamm/latest",
    );
    if (!response.ok) return null;

    const data = (await response.json()) as { version: string };
    return data.version;
  } catch {
    return null;
  }
}

function compareVersions(current: string, latest: string): number {
  const currentParts = current.split(".").map(Number);
  const latestParts = latest.split(".").map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const curr = currentParts[i] || 0;
    const lat = latestParts[i] || 0;

    if (curr < lat) return -1;
    if (curr > lat) return 1;
  }

  return 0;
}

function getCachedVersion(): string | null {
  try {
    if (!fs.existsSync(UPDATE_CACHE_FILE)) return null;

    const data = JSON.parse(
      fs.readFileSync(UPDATE_CACHE_FILE, "utf8"),
    ) as UpdateCache;
    const now = Date.now();

    if (now - data.lastChecked > CACHE_DURATION) {
      return null;
    }

    return data.latestVersion;
  } catch {
    return null;
  }
}

function cacheVersion(latestVersion: string): void {
  try {
    const data: UpdateCache = {
      lastChecked: Date.now(),
      latestVersion,
      currentVersion: getCurrentVersion(),
    };
    fs.writeFileSync(UPDATE_CACHE_FILE, JSON.stringify(data));
  } catch {
    // Silently fail
  }
}

export async function checkForUpdates(): Promise<void> {
  const currentVersion = getCurrentVersion();

  // Try cache first
  let latestVersion = getCachedVersion();

  // If cache miss, fetch from npm
  if (!latestVersion) {
    latestVersion = await fetchLatestVersion();
    if (latestVersion) {
      cacheVersion(latestVersion);
    }
  }

  if (!latestVersion) return;

  const comparison = compareVersions(currentVersion, latestVersion);

  if (comparison < 0) {
    console.log(
      chalk.hex("#a277ff")(
        `\n   A new version of create-heildamm is available: ${latestVersion}`,
      ),
    );
    console.log(
      chalk.hex("#a277ff")(
        `   Execute: npm install -g create-heildamm@latest\n`,
      ),
    );
  }
}
