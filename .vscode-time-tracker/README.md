# Heildamm Time Tracker

**Real-time VS Code activity tracking extension with unlimited local data storage**

Heildamm Time Tracker monitors your coding activity automatically, records time spent on each file, and integrates seamlessly with git-based project analysis. All data is stored locally without any external services or data limits.

---

## Overview

Understanding how time is invested across projects and files is essential for productivity insights and project planning. Heildamm Time Tracker provides automatic, non-intrusive activity monitoring that respects your privacy while capturing valuable metrics.

### Key Features

- **Real-time Activity Tracking**: Automatic monitoring of file edits and focus
- **Language Detection**: Records programming language for each session
- **Branch Tracking**: Captures current git branch for each session
- **Idle Detection**: Automatic pause after 5 minutes of inactivity (configurable)
- **Local Storage**: All data stored in `~/.heildamm-time-tracker/` directory
- **Daily JSON Files**: One file per day for easy management
- **Git Integration**: Works seamlessly with git history analysis
- **Status Bar Widget**: Quick access to today's statistics (toggle: total time vs. project time)
- **Software Archaeology**: Correlate time investment with git commits to reveal effort per feature
- **Export Formats**: CSV and Markdown exports for reporting and sharing
- **Clean Architecture**: Modular design with separation of concerns

---

## Installation

### Prerequisites

- VS Code version 1.80.0 or higher
- Git configuration (for author name detection)

### Quick Start

1. Build the extension:

```bash
cd .vscode-time-tracker
npm install
npm run esbuild
```

2. Install the extension:

```bash
npm run package
```

3. Open VS Code and install from VSIX:
   - Press `Ctrl+Shift+P`
   - Type: "Install from VSIX"
   - Select the generated `.vsix` file

Or for development:

```bash
npm run esbuild-watch
npm run test
```

---

## Usage

### Commands

Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) and type any of the following commands:

#### Analytics & Reporting

- **Show All Stats**: View total time, top files, and language breakdown
- **Show Today**: Display today's tracking summary
- **Generate Software Archaeology Report**: Analyze time investment per git commit

#### Data Management

- **Open Dashboard**: Open the interactive dashboard for visual analytics
- **Export Data to CSV**: Export tracking data in spreadsheet-friendly format
- **Export Data to Markdown**: Export as markdown report with summaries
- **Open Data Directory**: Access tracking files directly (in `~/.heildamm-time-tracker/`)
- **Clear Data**: Remove all tracking data (with confirmation)

#### Display

- **Toggle Status Bar**: Switch between total time and per-project time display

### Status Bar

A time widget appears in the status bar showing today's total tracked time. Click it to toggle between:

- **Total time**: Total hours tracked today across all projects
- **Project time**: Hours tracked in the current project today

---

## Software Archaeology 🔍

The "time-to-commit ratio" feature is what transforms Heildamm from a tracker into a **software archaeology tool**.

### What It Does

It analyzes the relationship between time investment and git commits to show:

- **Cost per Commit**: Average time spent before each commit
- **Productivity Score**: Time vs. actual changes (commits without thrashing)
- **Effort Patterns**: Daily/hourly peaks and productivity trends
- **Optimization Opportunities**: Commits that took unexpectedly long

### Example Report

```
## Summary
- Total Time Invested: 42h 15m
- Total Commits: 87
- Average Time per Commit: 29m
- Commit Velocity: 2.9 commits/day

## Optimization Opportunities
- abc1234: Refactor auth system → 2h 45m (vs 29m average)
  Files: 12 | Changes: +450-320
```

### Use Cases

- **Portfolio**: Show the real effort behind projects
- **Retrospectives**: Data-driven team discussions
- **Freelance Invoicing**: Transparent hour breakdown by feature
- **Performance Analysis**: Identify productivity patterns and bottlenecks

→ See [SOFTWARE_ARCHAEOLOGY.md](SOFTWARE_ARCHAEOLOGY.md) for full documentation.

---

## Data Storage

### Location

```
~/.heildamm-time-tracker/
```

### Format

Daily JSON file: `YYYY-MM-DD.json`

```json
{
  "date": "2026-04-05",
  "entries": [
    {
      "timestamp": 1712282880000,
      "duration": 1800,
      "file": "extension.ts",
      "language": "typescript",
      "project": "create-heildamm",
      "author": "gabriel glatz"
    }
  ]
}
```

---

## Architecture

### Modular Design

- `extension.ts` - Main entry point and command registration
- `tracker.ts` - Activity recording and session management
- `storage.ts` - Data persistence layer
- `context.ts` - VS Code environment context
- `stats.ts` - Analytics and metric calculations
- `constants.ts` - Configuration and command definitions

---

## Integration

### With show-activity.js

The extension data integrates with the project's git activity script:

```bash
pnpm activity
```

This command displays both git commits and VS Code time tracking in a unified report.

---

## Security

### Data Encryption

All tracking data is encrypted automatically using **AES-256-GCM** to prevent unauthorized access or modification:

- **Random Encryption Keys**: Each user's data is protected with a cryptographically random 256-bit key
- **Machine-Locked Storage**: Keys are stored locally in `~/.heildamm-time-tracker/.encryption-key` (never committed to repositories)
- **Tampering Detection**: GCM authentication ensures data integrity
- **Transparent Encryption**: Automatic encryption/decryption on read/write operations

### Important Notes

- The `.encryption-key` file is **sensitive** - do not share or backup without proper security measures
- Data is encrypted at rest and cannot be manually edited without the encryption key
- Different users on the same machine get different encryption keys
- Encryption is automatic - no configuration needed

### Privacy

- All data remains on your local machine
- No tracking data is sent to external services
- Git integration only reads local git history (no external API calls)

---

## License

MIT
