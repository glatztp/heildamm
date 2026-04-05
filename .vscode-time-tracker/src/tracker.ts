import { TimeEntry } from "./storage";
import { ContextService } from "./context";
import { IDLE_THRESHOLD_MS, MIN_SESSION_DURATION } from "./constants";

export class TimeTracker {
  private lastActivityTime: number = Date.now();
  private sessionStartTime: number = Date.now();
  private context: ContextService;
  private onEntryRecorded: (entry: TimeEntry) => void;

  constructor(
    context: ContextService,
    onEntryRecorded: (entry: TimeEntry) => void,
  ) {
    this.context = context;
    this.onEntryRecorded = onEntryRecorded;
  }

  recordActivity(): void {
    if (!this.context.isActive()) return;

    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivityTime;

    if (timeSinceLastActivity > IDLE_THRESHOLD_MS) {
      this.sessionStartTime = now;
    } else {
      const duration = Math.round((now - this.sessionStartTime) / 1000);
      if (duration >= MIN_SESSION_DURATION) {
        const entry: TimeEntry = {
          timestamp: now,
          duration,
          file: this.context.getFile(),
          language: this.context.getLanguage(),
          project: this.context.getProject(),
          author: this.context.getAuthor(),
        };

        this.onEntryRecorded(entry);
      }

      this.sessionStartTime = now;
    }

    this.lastActivityTime = now;
  }

  updateActivity(): void {
    this.lastActivityTime = Date.now();
  }

  resetSession(): void {
    this.sessionStartTime = Date.now();
    this.lastActivityTime = Date.now();
  }

  getSessionDuration(): number {
    return Math.round((Date.now() - this.sessionStartTime) / 1000);
  }
}
