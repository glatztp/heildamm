#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import process from "process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const author = execSync("git config user.name", { encoding: "utf-8" }).trim();
  const email = execSync("git config user.email", { encoding: "utf-8" }).trim();
  const date = new Date();
  const dateStr = `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
  const timeStr = `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

  let diffStat = "";
  let filesChanged = [];
  let commitMsg = "";

  try {
    diffStat = execSync("git diff HEAD~1 HEAD --shortstat 2>nul", {
      encoding: "utf-8",
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
    }).trim();
  } catch {
    // ignore
  }

  try {
    filesChanged = execSync("git diff HEAD~1 HEAD --name-only 2>nul", {
      encoding: "utf-8",
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
    })
      .trim()
      .split("\n")
      .filter((f) => f);
  } catch {
    // ignore
  }

  try {
    commitMsg = execSync("git log -1 --pretty=%B 2>nul", {
      encoding: "utf-8",
      shell: process.platform === "win32" ? "cmd.exe" : "/bin/bash",
    }).trim();
  } catch {
    // ignore
  }

  const insertions = diffStat.match(/(\d+) insertions?/)
    ? parseInt(diffStat.match(/(\d+) insertions?/)[1])
    : 0;
  const deletions = diffStat.match(/(\d+) deletions?/)
    ? parseInt(diffStat.match(/(\d+) deletions?/)[1])
    : 0;

  const activityFile = path.join(__dirname, "..", ".activity.json");
  let activities = [];

  if (fs.existsSync(activityFile)) {
    try {
      activities = JSON.parse(fs.readFileSync(activityFile, "utf-8"));
    } catch {
      // ignore
    }
  }

  activities.push({
    date: dateStr,
    time: timeStr,
    author,
    email,
    files: filesChanged,
    insertions,
    deletions,
    message: commitMsg.split("\n")[0] || "Sem mensagem",
  });

  if (activities.length > 100) {
    activities = activities.slice(-100);
  }

  fs.writeFileSync(activityFile, JSON.stringify(activities, null, 2));
} catch {
  // silencioso
}
