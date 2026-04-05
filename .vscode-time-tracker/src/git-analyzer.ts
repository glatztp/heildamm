import { execSync } from "child_process";
import * as path from "path";

export interface GitCommit {
  hash: string;
  shortHash: string;
  author: string;
  timestamp: number; // milliseconds
  dateStr: string;
  message: string;
  branch: string;
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export interface CommitMetrics {
  totalCommits: number;
  commits: GitCommit[];
  firstCommit: GitCommit | null;
  lastCommit: GitCommit | null;
  commitsByDay: Record<string, number>;
  commitsByDayOfWeek: Record<number, number>;
  avgCommitsPerDay: number;
}

export class GitAnalyzer {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Get commit history with detailed metrics
   */
  getCommitHistory(days: number = 30, branch: string = "HEAD"): CommitMetrics {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const format = "%H|%h|%an|%aI|%s";
      const cmd = `cd "${this.projectPath}" && git log --since="${since.toISOString()}" --format="${format}" ${branch} -- 2>/dev/null || true`;

      const output = execSync(cmd, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "ignore"],
      }).trim();

      if (!output) {
        return {
          totalCommits: 0,
          commits: [],
          firstCommit: null,
          lastCommit: null,
          commitsByDay: {},
          commitsByDayOfWeek: {},
          avgCommitsPerDay: 0,
        };
      }

      const commits = output
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const [hash, shortHash, author, timestamp, message] = line.split("|");
          const date = new Date(timestamp);
          const dateStr = date.toISOString().split("T")[0];

          return {
            hash,
            shortHash,
            author,
            timestamp: date.getTime(),
            dateStr,
            message: message || "(no message)",
            branch,
            filesChanged: 0,
            insertions: 0,
            deletions: 0,
            dayOfWeek: date.getDay(),
          };
        });

      // Calculate metrics
      const commitsByDay: Record<string, number> = {};
      const commitsByDayOfWeek: Record<number, number> = {};

      commits.forEach((commit) => {
        commitsByDay[commit.dateStr] = (commitsByDay[commit.dateStr] || 0) + 1;
        const dow = new Date(commit.timestamp).getDay();
        commitsByDayOfWeek[dow] = (commitsByDayOfWeek[dow] || 0) + 1;
      });

      const uniqueDays = Object.keys(commitsByDay).length;
      const avgCommitsPerDay = uniqueDays > 0 ? commits.length / uniqueDays : 0;

      return {
        totalCommits: commits.length,
        commits: commits.sort((a, b) => b.timestamp - a.timestamp),
        firstCommit:
          commits.length > 0
            ? commits.reduce((a, b) => (a.timestamp < b.timestamp ? a : b))
            : null,
        lastCommit: commits.length > 0 ? commits[0] : null,
        commitsByDay,
        commitsByDayOfWeek,
        avgCommitsPerDay,
      };
    } catch (error) {
      console.error("Failed to get commit history:", error);
      return {
        totalCommits: 0,
        commits: [],
        firstCommit: null,
        lastCommit: null,
        commitsByDay: {},
        commitsByDayOfWeek: {},
        avgCommitsPerDay: 0,
      };
    }
  }

  /**
   * Get commits in a time range
   */
  getCommitsInRange(startDate: Date, endDate: Date): GitCommit[] {
    try {
      const format = "%H|%h|%an|%aI|%s";
      const cmd = `cd "${this.projectPath}" && git log --since="${startDate.toISOString()}" --until="${endDate.toISOString()}" --format="${format}" -- 2>/dev/null || true`;

      const output = execSync(cmd, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "ignore"],
      }).trim();

      if (!output) return [];

      return output
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const [hash, shortHash, author, timestamp, message] = line.split("|");
          const date = new Date(timestamp);
          const dateStr = date.toISOString().split("T")[0];

          return {
            hash,
            shortHash,
            author,
            timestamp: date.getTime(),
            dateStr,
            message: message || "(no message)",
            branch: "HEAD",
            filesChanged: 0,
            insertions: 0,
            deletions: 0,
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error("Failed to get commits in range:", error);
      return [];
    }
  }

  /**
   * Get current branch
   */
  getCurrentBranch(): string {
    try {
      const cmd = `cd "${this.projectPath}" && git rev-parse --abbrev-ref HEAD`;
      return execSync(cmd, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "ignore"],
      }).trim();
    } catch {
      return "unknown";
    }
  }

  /**
   * Get files changed in commit
   */
  getCommitStats(commitHash: string): {
    filesChanged: number;
    insertions: number;
    deletions: number;
  } {
    try {
      const cmd = `cd "${this.projectPath}" && git show --stat --format="" ${commitHash}`;
      const output = execSync(cmd, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "ignore"],
      }).trim();

      const lines = output.split("\n");
      const lastLine = lines[lines.length - 2] || "";

      const match = lastLine.match(
        /(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/,
      );

      return {
        filesChanged: match ? parseInt(match[1]) || 0 : 0,
        insertions: match ? parseInt(match[2]) || 0 : 0,
        deletions: match ? parseInt(match[3]) || 0 : 0,
      };
    } catch {
      return { filesChanged: 0, insertions: 0, deletions: 0 };
    }
  }

  /**
   * Get tags (for features/releases)
   */
  getTags(): Array<{ name: string; hash: string; date: Date }> {
    try {
      const cmd = `cd "${this.projectPath}" && git tag --list --format='%(refname:short)|%(objectname:short)|%(creatordate:iso)' 2>/dev/null || true`;
      const output = execSync(cmd, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "ignore"],
      }).trim();

      if (!output) return [];

      return output
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => {
          const [name, hash, date] = line.split("|");
          return {
            name,
            hash,
            date: new Date(date),
          };
        });
    } catch {
      return [];
    }
  }
}
