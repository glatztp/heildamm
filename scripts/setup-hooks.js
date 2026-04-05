#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import process from "process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hooksDir = path.join(__dirname, "..", ".git", "hooks");

if (fs.existsSync(hooksDir)) {
  const postCommitHook = path.join(hooksDir, "post-commit");
  const hookContent = `#!/bin/bash\nnode "${path.join(__dirname, "track-activity.js")}" || true\n`;

  try {
    fs.writeFileSync(postCommitHook, hookContent);
    if (process.platform !== "win32") {
      fs.chmodSync(postCommitHook, 0o755);
    }
  } catch {
    // ignore
  }
}
