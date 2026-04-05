#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import process from "process";

const { log } = globalThis.console;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const activityFile = path.join(__dirname, "..", ".activity.json");

if (!fs.existsSync(activityFile)) {
  log("\n📋 Nenhuma atividade registrada ainda\n");
  process.exit(0);
}

let activities = [];
try {
  activities = JSON.parse(fs.readFileSync(activityFile, "utf-8"));
} catch {
  log("\n📋 Nenhuma atividade registrada ainda\n");
  process.exit(0);
}

const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  blue: "\x1b[34m",
  gray: "\x1b[90m",
};

log(
  "\n" +
    colors.cyan +
    colors.bright +
    "═══════════════════════════════════════════════════════════════════" +
    colors.reset,
);
log(
  colors.cyan +
    colors.bright +
    "                    📊 RELATÓRIO DE ATIVIDADES" +
    colors.reset,
);
log(
  colors.cyan +
    colors.bright +
    "═══════════════════════════════════════════════════════════════════" +
    colors.reset +
    "\n",
);

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

  log(colors.bright + colors.blue + `👤 ${author}` + colors.reset);
  log(colors.dim + `   Email: ${colors.reset}${stats[0].email || "N/A"}`);
  log(
    colors.green +
      `   ✚ ${totalInsertions} linhas adicionadas` +
      colors.reset +
      colors.red +
      ` | ✖ ${totalDeletions} linhas removidas` +
      colors.reset +
      colors.yellow +
      ` | 📁 ${totalFiles} arquivos` +
      colors.reset,
  );
  log(colors.dim + `   ${stats.length} commits total` + colors.reset);
  log();
});

log(
  colors.cyan +
    colors.bright +
    "─────────────────────────────────────────────────────────────────────" +
    colors.reset,
);
log(colors.bright + "🔄 Últimos 10 Commits:" + colors.reset + "\n");

const recent = activities.slice(-10).reverse();
recent.forEach((act, idx) => {
  const changes =
    colors.green +
    `+${act.insertions || 0}` +
    colors.reset +
    colors.red +
    ` -${act.deletions || 0}` +
    colors.reset;
  log(
    `${colors.dim}${idx + 1}.${colors.reset} ${colors.bright + act.date}${colors.reset} ${act.time} ${colors.bright}${act.author}${colors.reset}`,
  );
  log(`   ${colors.yellow}${act.message}${colors.reset}`);
  log(
    `   ${changes} ${colors.gray}${(act.files || []).length} arquivo(s)${colors.reset}`,
  );
  log();
});

log(
  colors.cyan +
    colors.bright +
    "═══════════════════════════════════════════════════════════════════" +
    colors.reset +
    "\n",
);
