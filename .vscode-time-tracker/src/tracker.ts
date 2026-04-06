import { TimeEntry } from "./storage";
import { ContextService } from "./context";
import { MIN_SESSION_DURATION } from "./constants";

export class TimeTracker {
  private lastActivityTime: number = Date.now();
  private sessionStartTime: number = Date.now();
  private hasRealActivitySinceLastRecord: boolean = false;
  private context: ContextService;
  private onEntryRecorded: (entry: TimeEntry) => void;
  private idleThresholdMs: number = 5 * 60 * 1000;

  constructor(
    context: ContextService,
    onEntryRecorded: (entry: TimeEntry) => void,
    idleThresholdMs?: number,
  ) {
    this.context = context;
    this.onEntryRecorded = onEntryRecorded;
    if (idleThresholdMs) {
      this.idleThresholdMs = idleThresholdMs;
    }
  }

  recordActivity(): void {
    if (!this.context.isActive()) return;

    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivityTime;

    if (timeSinceLastActivity > this.idleThresholdMs) {
      this.sessionStartTime = now;
      this.lastActivityTime = now;
      this.hasRealActivitySinceLastRecord = false;
      return;
    }

    if (!this.hasRealActivitySinceLastRecord) {
      return;
    }

    const duration = Math.round((now - this.sessionStartTime) / 1000);
    if (duration >= MIN_SESSION_DURATION) {
      const entry: TimeEntry = {
        timestamp: now,
        duration,
        file: this.context.getFile(),
        language: this.context.getLanguage(),
        project: this.context.getProject(),
        author: this.context.getAuthor(),
        branch: this.context.getBranch(),
      };
      this.onEntryRecorded(entry);
    }

    this.sessionStartTime = now;
    this.lastActivityTime = now;
    this.hasRealActivitySinceLastRecord = false;
  }

  updateActivity(): void {
    this.lastActivityTime = Date.now();
    this.hasRealActivitySinceLastRecord = true;
  }

  resetSession(): void {
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();
    this.hasRealActivitySinceLastRecord = false;
  }

  getSessionDuration(): number {
    return Math.round((Date.now() - this.sessionStartTime) / 1000);
  }

  setIdleThreshold(minutes: number): void {
    this.idleThresholdMs = minutes * 60 * 1000;
  }
}