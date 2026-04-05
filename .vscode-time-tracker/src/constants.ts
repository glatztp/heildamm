export const IDLE_THRESHOLD_MS = 5 * 60 * 1000; 
export const TRACKING_INTERVAL_MS = 30 * 1000;
export const STORAGE_DIR_NAME = ".heildamm-time-tracker";
export const MIN_SESSION_DURATION = 5;

export enum Commands {
  SHOW_STATS = "heildamm-time-tracker.show-stats",
  SHOW_TODAY = "heildamm-time-tracker.show-today",
  OPEN_DATA_DIR = "heildamm-time-tracker.open-data-dir",
  CLEAR_DATA = "heildamm-time-tracker.clear-data",
}

export enum StatusMessages {
  ACTIVATED = "Heildamm Time Tracker activated",
  NO_DATA = "No tracking data found",
  CLEARED = "Tracking data cleared",
}
