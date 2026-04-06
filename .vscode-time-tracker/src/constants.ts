export const IDLE_THRESHOLD_MS = 5 * 60 * 1000;
export const TRACKING_INTERVAL_MS = 30 * 1000;
export const STORAGE_DIR_NAME = ".heildamm-time-tracker";
export const MIN_SESSION_DURATION = 5;

export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export enum Commands {
  SHOW_STATS = "heildamm-time-tracker.show-stats",
  SHOW_TODAY = "heildamm-time-tracker.show-today",
  OPEN_DATA_DIR = "heildamm-time-tracker.open-data-dir",
  CLEAR_DATA = "heildamm-time-tracker.clear-data",
  EXPORT_CSV = "heildamm-time-tracker.export-csv",
  EXPORT_MARKDOWN = "heildamm-time-tracker.export-markdown",
  TOGGLE_STATUS_BAR = "heildamm-time-tracker.toggle-statusbar",
  ARCHAEOLOGY_REPORT = "heildamm-time-tracker.archaeology-report",
}

export enum StatusMessages {
  ACTIVATED = "Heildamm Time Tracker activated",
  NO_DATA = "No tracking data found",
  CLEARED = "Tracking data cleared",
}
