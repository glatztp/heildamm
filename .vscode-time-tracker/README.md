# Heildamm Time Tracker

**Real-time VS Code activity tracking extension with unlimited local data storage**

Heildamm Time Tracker monitors your coding activity automatically, records time spent on each file, and integrates seamlessly with git-based project analysis. All data is stored locally without any external services or data limits.

---

## Overview

Understanding how time is invested across projects and files is essential for productivity insights and project planning. Heildamm Time Tracker provides automatic, non-intrusive activity monitoring that respects your privacy while capturing valuable metrics.

### Key Features

- **Real-time Activity Tracking**: Automatic monitoring of file edits and focus
- **Language Detection**: Records programming language for each session
- **Idle Detection**: Automatic pause after 5 minutes of inactivity
- **Local Storage**: All data stored in `~/.heildamm-time-tracker/` directory
- **Daily JSON Files**: One file per day for easy management
- **Git Integration**: Works seamlessly with `show-activity.js` for unified reporting
- **Status Bar Widget**: Quick access to today's statistics
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

- **Show All Stats**: View total time, top files, and language breakdown
- **Show Today**: Display today's tracking summary
- **Open Data Directory**: Access tracking files directly
- **Clear Data**: Remove all tracking data (with confirmation)

### Status Bar

A time widget appears in the status bar showing today's total tracked time. Click it to view detailed stats.

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

## License

MIT
