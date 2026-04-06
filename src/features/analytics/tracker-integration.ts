import fs from "fs";
import { join } from "path";
import { homedir } from "os";
import {
  TRACKER_VSCODE_PATH,
  TRACKER_HEILDAMM_PATH,
  DEFAULT_EMPTY_RESPONSE,
} from "./utils/index.js";
import { millisecondsToHours } from "./utils/index.js";
import { roundToHundredths } from "./utils/index.js";

export interface TimeTrackerSession {
  projectPath: string;
  duration: number;
  startTime: string;
  endTime: string;
  language?: string;
  fileName?: string;
  isActive: boolean;
}

export interface TimeTrackerData {
  totalTime: number;
  sessions: TimeTrackerSession[];
  lastUpdated: string;
}

export interface ProjectTimeMetrics {
  projectPath: string;
  totalTrackedTime: number;
  sessionsCount: number;
  averageSessionDuration: number;
  longestSession: number;
  shortestSession: number;
  lastTrackedAt: string;
}

const TRACKER_DATA_PATHS = {
  vscode: TRACKER_VSCODE_PATH,
  heildamm: TRACKER_HEILDAMM_PATH,
};

export function getTrackerData(projectPath: string): ProjectTimeMetrics | null {
  try {
    if (fs.existsSync(TRACKER_DATA_PATHS.vscode)) {
      const trackerData = JSON.parse(
        fs.readFileSync(TRACKER_DATA_PATHS.vscode, "utf8"),
      );

      if (trackerData && typeof trackerData === "object") {
        return parseTrackerMetrics(trackerData, projectPath);
      }
    }

    if (fs.existsSync(TRACKER_DATA_PATHS.heildamm)) {
      const heildammData = JSON.parse(
        fs.readFileSync(TRACKER_DATA_PATHS.heildamm, "utf8"),
      );

      const projectData = heildammData[projectPath];
      if (projectData) {
        return projectData as ProjectTimeMetrics;
      }
    }

    return null;
  } catch {
    return null;
  }
}

function parseTrackerMetrics(
  trackerData: Record<string, unknown>,
  projectPath: string,
): ProjectTimeMetrics | null {
  try {
    const sessions = trackerData.sessions as TimeTrackerSession[] | undefined;

    if (!sessions || sessions.length === 0) {
      return null;
    }

    const projectSessions = sessions.filter((s) =>
      s.projectPath.includes(projectPath.split("/").pop() || ""),
    );

    if (projectSessions.length === 0) {
      return null;
    }

    const totalTime = projectSessions.reduce((sum, s) => sum + s.duration, 0);
    const durations = projectSessions.map((s) => s.duration);

    return {
      projectPath,
      totalTrackedTime: millisecondsToHours(totalTime),
      sessionsCount: projectSessions.length,
      averageSessionDuration: millisecondsToHours(
        projectSessions.length > 0 ? totalTime / projectSessions.length : 0,
      ),
      longestSession: millisecondsToHours(Math.max(...durations)),
      shortestSession: millisecondsToHours(Math.min(...durations)),
      lastTrackedAt:
        projectSessions[projectSessions.length - 1]?.endTime ||
        new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function syncTrackerData(): void {
  try {
    if (!fs.existsSync(TRACKER_DATA_PATHS.vscode)) {
      return;
    }

    const trackerData = JSON.parse(
      fs.readFileSync(TRACKER_DATA_PATHS.vscode, "utf8"),
    );

    const heildammDataDir = join(homedir(), ".heildamm");
    if (!fs.existsSync(heildammDataDir)) {
      fs.mkdirSync(heildammDataDir, { recursive: true });
    }

    fs.writeFileSync(
      TRACKER_DATA_PATHS.heildamm,
      JSON.stringify(
        {
          ...trackerData,
          syncedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
  } catch {
    // ignore
  }
}

export function getAggregatedTrackerStats(): {
  totalTrackedHours: number;
  totalSessions: number;
  averageSessionHours: number;
  projectsTracked: number;
} {
  try {
    if (!fs.existsSync(TRACKER_DATA_PATHS.heildamm)) {
      return DEFAULT_EMPTY_RESPONSE;
    }

    const data = JSON.parse(
      fs.readFileSync(TRACKER_DATA_PATHS.heildamm, "utf8"),
    );

    const sessions = data.sessions as TimeTrackerSession[] | undefined;

    if (!sessions || sessions.length === 0) {
      return DEFAULT_EMPTY_RESPONSE;
    }

    const totalTimeMs = sessions.reduce(
      (sum: number, s: TimeTrackerSession) => sum + s.duration,
      0,
    );
    const totalHours = millisecondsToHours(totalTimeMs);
    const uniqueProjects = new Set(sessions.map((s) => s.projectPath)).size;

    return {
      totalTrackedHours: roundToHundredths(totalHours),
      totalSessions: sessions.length,
      averageSessionHours: roundToHundredths(totalHours / sessions.length),
      projectsTracked: uniqueProjects,
    };
  } catch {
    return DEFAULT_EMPTY_RESPONSE;
  }
}
