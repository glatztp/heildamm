import { execSync } from "child_process";
import {
  calculateFrequency as calculateCommitFrequency,
} from "./utils/index.js";
import { millisecondsToTimeDiff, MS_TO_DAYS } from "./utils/index.js";

export interface GitCommit {
  hash: string;
  author: string;
  timestamp: string;
  message: string;
  files: number;
  additions: number;
  deletions: number;
}

export interface GitMetrics {
  totalCommits: number;
  commitsInLastMonth: number;
  averageCommitFrequency: number;
  totalFilesChanged: number;
  totalLinesAdded: number;
  totalLinesDeleted: number;
  lastCommitDate: string;
  firstCommitDate: string;
}

export function getLastCommitHash(projectPath: string): string | null {
  try {
    const hash = execSync("git rev-parse HEAD", {
      cwd: projectPath,
      encoding: "utf-8",
    }).trim();
    return hash || null;
  } catch {
    return null;
  }
}

export function getCommitHistory(
  projectPath: string,
  maxCommits: number = 100,
): GitCommit[] {
  try {
    const format = "%H|%an|%aI|%s|%nfiles:%x00additions:%x00deletions:%x00";

    const output = execSync(
      `git log --pretty=format:"${format}" --name-status -${maxCommits}`,
      {
        cwd: projectPath,
        encoding: "utf-8",
      },
    );

    const commits: GitCommit[] = [];
    const commitBlocks = output.split("\n\n").filter((b) => b.trim());

    for (const block of commitBlocks) {
      const lines = block.split("\n");
      const [hash, author, timestamp, message] = lines[0].split("|");

      if (!hash) continue;

      let files = 0,
        additions = 0,
        deletions = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.match(/^[MAD]\s+/)) {
          files++;
        }
      }

      try {
        const stats = execSync(`git show --shortstat ${hash}`, {
          cwd: projectPath,
          encoding: "utf-8",
        });

        const addMatch = stats.match(/(\d+) insertions?\(/);
        const delMatch = stats.match(/(\d+) deletions?\(/);

        if (addMatch) additions = parseInt(addMatch[1], 10);
        if (delMatch) deletions = parseInt(delMatch[1], 10);
      } catch {
        // ignore
      }

      commits.push({
        hash: hash.trim(),
        author: author?.trim() || "Unknown",
        timestamp: timestamp?.trim() || new Date().toISOString(),
        message: message?.trim() || "No message",
        files,
        additions,
        deletions,
      });
    }

    return commits;
  } catch {
    return [];
  }
}

export function calculateGitMetrics(projectPath: string): GitMetrics {
  try {
    const commits = getCommitHistory(projectPath, 500);

    if (commits.length === 0) {
      return {
        totalCommits: 0,
        commitsInLastMonth: 0,
        averageCommitFrequency: 0,
        totalFilesChanged: 0,
        totalLinesAdded: 0,
        totalLinesDeleted: 0,
        lastCommitDate: new Date().toISOString(),
        firstCommitDate: new Date().toISOString(),
      };
    }

    const now = new Date();
    const oneMonthAgo = new Date(now.getTime() - 30 * MS_TO_DAYS);

    const commitsInLastMonth = commits.filter(
      (c) => new Date(c.timestamp) > oneMonthAgo,
    ).length;

    const firstCommitDate = commits[commits.length - 1]?.timestamp;
    const lastCommitDate = commits[0]?.timestamp;

    const daysDiff =
      firstCommitDate && lastCommitDate
        ? (new Date(lastCommitDate).getTime() -
            new Date(firstCommitDate).getTime()) /
          MS_TO_DAYS
        : 1;

    return {
      totalCommits: commits.length,
      commitsInLastMonth,
      averageCommitFrequency: calculateCommitFrequency(
        commits.length,
        daysDiff,
      ),
      totalFilesChanged: commits.reduce((sum, c) => sum + c.files, 0),
      totalLinesAdded: commits.reduce((sum, c) => sum + c.additions, 0),
      totalLinesDeleted: commits.reduce((sum, c) => sum + c.deletions, 0),
      lastCommitDate: lastCommitDate || new Date().toISOString(),
      firstCommitDate: firstCommitDate || new Date().toISOString(),
    };
  } catch {
    return {
      totalCommits: 0,
      commitsInLastMonth: 0,
      averageCommitFrequency: 0,
      totalFilesChanged: 0,
      totalLinesAdded: 0,
      totalLinesDeleted: 0,
      lastCommitDate: new Date().toISOString(),
      firstCommitDate: new Date().toISOString(),
    };
  }
}

export function getTimeSinceLastCommit(projectPath: string): {
  days: number;
  hours: number;
  minutes: number;
} {
  try {
    const lastCommitTimestamp = execSync("git log -1 --format=%aI", {
      cwd: projectPath,
      encoding: "utf-8",
    }).trim();

    const lastCommitDate = new Date(lastCommitTimestamp);
    const now = new Date();
    const diffMs = now.getTime() - lastCommitDate.getTime();

    return millisecondsToTimeDiff(diffMs);
  } catch {
    return { days: 0, hours: 0, minutes: 0 };
  }
}
