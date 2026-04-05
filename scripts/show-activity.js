#!/usr/bin/env node

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
const activityFile = path.join(__dirname, "..", ".activity.json");

if (!fs.existsSync(activityFile)) {
  log(chalk.yellow("   Nenhuma atividade registrada ainda\n"));
  process.exit(0);
}

let activities = [];
try {
  activities = JSON.parse(fs.readFileSync(activityFile, "utf-8"));
} catch {
  log(chalk.yellow("   Nenhuma atividade registrada ainda\n"));
  process.exit(0);
}

// Calcular tempo estimado por linha modificada
const estimateHours = (insertions, deletions) => {
  const totalLines = (insertions || 0) + (deletions || 0);
  const hours = Math.ceil(totalLines / 100);
  return Math.max(0.25, hours); // minimo 15 min
};

log("\n");
log(
  chalk.bold.hex(COLORS.primary)(
    "═══════════════════════════════════════════════════════════════════",
  ),
);
log(
  chalk.bold.hex(COLORS.primary)(
    "                      RELATORIO DE ATIVIDADES",
  ),
);
log(
  chalk.bold.hex(COLORS.primary)(
    "═══════════════════════════════════════════════════════════════════",
  ),
);
log("\n");

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
  const totalFiles = new Set(stats.flatMap((s) => s.files || [])).size;
  const totalHours = stats.reduce(
    (sum, s) => sum + estimateHours(s.insertions, s.deletions),
    0,
  );

  log(chalk.hex(COLORS.primary).bold(`  ${author}`));
  log(chalk.gray(`    Email: ${stats[0].email || "N/A"}`));
  log(
    chalk.hex(COLORS.secondary)(`    + ${totalInsertions} linhas`) +
      chalk.red(` | - ${totalDeletions} linhas`) +
      chalk.hex(COLORS.accent)(` | ${totalFiles} arquivos`),
  );
  log(
    chalk.white(
      `    ${totalHours.toFixed(1)}h trabalhadas | ${stats.length} commits`,
    ),
  );
  log();
});

log(
  chalk.bold.hex(COLORS.primary)(
    "─────────────────────────────────────────────────────────────────────",
  ),
);
log(chalk.bold.hex(COLORS.primary)("  Ultimos 10 Commits:\n"));

const recent = activities.slice(-10).reverse();
recent.forEach((act, idx) => {
  const hours = estimateHours(act.insertions, act.deletions);
  log(
    chalk.gray(`  ${idx + 1}.`) +
      chalk.hex(COLORS.secondary)(` ${act.date}`) +
      chalk.gray(` ${act.time}`) +
      chalk.bold.hex(COLORS.primary)(` ${act.author}`),
  );
  log(chalk.white(`     ${act.message}`));
  log(
    chalk.hex(COLORS.secondary)(`     + ${act.insertions || 0}`) +
      chalk.red(` - ${act.deletions || 0}`) +
      chalk.hex(COLORS.accent)(` (${hours.toFixed(2)}h)`) +
      chalk.gray(` | ${(act.files || []).length} arquivo(s)`),
  );
  log();
});

log(
  chalk.bold.hex(COLORS.primary)(
    "═══════════════════════════════════════════════════════════════════",
  ),
);
log("\n");
