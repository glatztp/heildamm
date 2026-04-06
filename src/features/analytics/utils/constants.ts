import { join } from "path";
import { homedir } from "os";

export const HEILDAMM_DIR = join(homedir(), ".heildamm");
export const TRACKER_VSCODE_PATH = join(
  homedir(),
  ".vscode-time-tracker",
  "data.json",
);
export const TRACKER_HEILDAMM_PATH = join(HEILDAMM_DIR, "tracker-data.json");
export const ANALYTICS_FILE = join(HEILDAMM_DIR, "analytics.json");

export const DEFAULT_EMPTY_RESPONSE = {
  totalTrackedHours: 0,
  totalSessions: 0,
  averageSessionHours: 0,
  projectsTracked: 0,
};

export const DEFAULT_GIT_METRICS = {
  totalCommits: 0,
  commitsInLastMonth: 0,
  averageCommitFrequency: 0,
  totalFilesChanged: 0,
  totalLinesAdded: 0,
  totalLinesDeleted: 0,
  lastCommitDate: new Date().toISOString(),
  firstCommitDate: new Date().toISOString(),
};

export const DEFAULT_TIME_DIFF = {
  days: 0,
  hours: 0,
  minutes: 0,
};

export const EFFICIENCY_THRESHOLDS = {
  high: 2,
  medium: 5,
};

export const SCORE_WEIGHTS = {
  efficiency: 0.6,
  frequency: 0.4,
};

export const SCORE_RANGES = {
  high: 100,
  medium: 70,
  low: 40,
};

export const COMMIT_FREQUENCY_THRESHOLDS = {
  high: 5,
  medium: 2,
};

export const PRODUCTIVITY_SCORE_THRESHOLD = {
  high: 80,
  medium: 50,
};
