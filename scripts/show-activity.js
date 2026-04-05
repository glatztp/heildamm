#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import process from "process";
import chalk from "chalk";

const { log } = globalThis.console;

const COLORS = {
  primary: "#8e61c6",
  secondary: "#a277ff",
  accent: "#c5a3ff",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getGitCommits = () => {
  try {
    const format = "%an%n%aI%n%s%n%H~~DELIM~~%n";
    const output = execSync(`git log --pretty=format:"${format}"`, {
      encoding: "utf-8",
      cwd: path.join(__dirname, ".."),
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
    });

    const commits = [];
    const entries = output.split("~~DELIM~~\n").filter((e) => e.trim());

    entries.slice(0, 50).forEach((entry) => {
      const lines = entry.trim().split("\n");
      if (lines.length >= 4) {
        const author = lines[0];
        const dateIso = lines[1];
        const message = lines[2] || "";
        const hash = lines[3];

        try {
          const statOutput = execSync(`git show --numstat ${hash}`, {
            encoding: "utf-8",
            cwd: path.join(__dirname, ".."),
            shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
          });

          let insertions = 0,
            deletions = 0;
          const statLines = statOutput.split("\n");
          statLines.forEach((line) => {
            const parts = line.split("\t");
            if (parts.length >= 2 && /^\d+$/.test(parts[0])) {
              insertions += parseInt(parts[0]) || 0;
              deletions += parseInt(parts[1]) || 0;
            }
          });

          const date = new Date(dateIso);
          const dateStr = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}`;

          commits.push({
            author,
            date: dateStr,
            message,
            insertions,
            deletions,
          });
        } catch {
          // ignore
        }
      }
    });

    return commits;
  } catch {
    return [];
  }
};

const getTrackerData = () => {
  const homeDir =
    process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH || "";
  const trackerDir = path.join(homeDir, ".heildamm-time-tracker");

  if (!fs.existsSync(trackerDir)) {
    return {};
  }

  const trackerData = {};
  const files = fs.readdirSync(trackerDir).filter((f) => f.endsWith(".json"));

  files.forEach((file) => {
    try {
      const data = JSON.parse(
        fs.readFileSync(path.join(trackerDir, file), "utf-8"),
      );
      data.entries.forEach((entry) => {
        if (!trackerData[entry.author]) {
          trackerData[entry.author] = {
            totalSeconds: 0,
            files: {},
            language: {},
          };
        }
        trackerData[entry.author].totalSeconds += entry.duration;

        if (!trackerData[entry.author].files[entry.file]) {
          trackerData[entry.author].files[entry.file] = 0;
        }
        trackerData[entry.author].files[entry.file] += entry.duration;

        if (!trackerData[entry.author].language[entry.language]) {
          trackerData[entry.author].language[entry.language] = 0;
        }
        trackerData[entry.author].language[entry.language] += entry.duration;
      });
    } catch {
      // ignore
    }
  });

  return trackerData;
};

const activities = getGitCommits();
if (activities.length === 0) {
  log(chalk.yellow("   No commits found\n"));
  process.exit(0);
}

const trackerData = getTrackerData();

log("\n" + chalk.bold.hex(COLORS.primary)("CORE ACTIVITY\n"));

const byAuthor = {};
activities.forEach((act) => {
  if (!byAuthor[act.author]) {
    byAuthor[act.author] = [];
  }
  byAuthor[act.author].push(act);
});

Object.keys(byAuthor).forEach((author) => {
  const stats = byAuthor[author];
  const totalInsertions = stats.reduce(
    (sum, s) => sum + (s.insertions || 0),
    0,
  );
  const totalDeletions = stats.reduce((sum, s) => sum + (s.deletions || 0), 0);
  const trackerTime = trackerData[author];
  const totalSeconds = trackerTime ? trackerTime.totalSeconds : 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  log(chalk.hex(COLORS.primary).bold(`${author}`));
  log(
    "  " +
      chalk.green(`+${totalInsertions}`) +
      chalk.red(` -${totalDeletions}`) +
      chalk.hex(COLORS.accent)(` | ${timeStr} | ${stats.length} commits`),
  );
  log();
});

log(chalk.bold.hex(COLORS.primary)("COMMITS\n"));

const recent = activities.slice(-5).reverse();
recent.forEach((act) => {
  const date = act.date.substring(0, 5);
  const msg = act.message.substring(0, 50).padEnd(50);

  log(
    "  " +
      chalk.hex(COLORS.secondary)(date + "  ") +
      chalk.white(msg) +
      chalk.green(` +${act.insertions || 0}`) +
      chalk.red(` -${act.deletions || 0}`),
  );
});

log();

log(chalk.gray("─".repeat(80)) + "\n");
