import * as fs from "fs";
import * as path from "path";
import { STORAGE_DIR_NAME, getLocalDateString } from "./constants";
import { DailyStats, TimeEntry } from "./storage";

export interface BackupMetadata {
  timestamp: number;
  originalDate: string;
  backupDate: string;
  entryCount: number;
  checksum: string;
}

export class BackupRecoveryService {
  private dataDir: string;
  private backupDir: string;
  private inMemoryCache: Map<string, DailyStats> = new Map();
  private metadataFile: string;

  constructor() {
    this.dataDir = this.getDataDir();
    this.backupDir = path.join(this.dataDir, ".backup");
    this.metadataFile = path.join(this.backupDir, "metadata.json");
  }

  private getDataDir(): string {
    const homeDir =
      process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH || "";
    return path.join(homeDir, STORAGE_DIR_NAME);
  }

  initialize(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }

    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    if (!fs.existsSync(this.metadataFile)) {
      this.saveMetadata({});
    }
  }

  backupDailyStats(dailyStats: DailyStats): void {
    this.initialize();

    const backupFileName = `${dailyStats.date}.backup.json`;
    const backupPath = path.join(this.backupDir, backupFileName);

    try {
      fs.writeFileSync(
        backupPath,
        JSON.stringify(dailyStats, null, 2),
        "utf-8",
      );

      this.inMemoryCache.set(dailyStats.date, { ...dailyStats });

      const checksum = this.calculateChecksum(dailyStats);
      this.updateMetadata(dailyStats.date, {
        timestamp: Date.now(),
        originalDate: dailyStats.date,
        backupDate: getLocalDateString(),
        entryCount: dailyStats.entries.length,
        checksum,
      });
    } catch (error) {
      console.error(
        `Failed to backup daily stats for ${dailyStats.date}:`,
        error,
      );
    }
  }

  recoverFromBackup(date: string): DailyStats | null {
    if (this.inMemoryCache.has(date)) {
      console.log(`Recovering ${date} from memory cache`);
      return this.inMemoryCache.get(date) || null;
    }

    const backupPath = path.join(this.backupDir, `${date}.backup.json`);
    if (fs.existsSync(backupPath)) {
      try {
        const data = JSON.parse(
          fs.readFileSync(backupPath, "utf-8"),
        ) as DailyStats;
        console.log(`Recovered ${date} from backup file`);

        this.restoreFromBackup(date, data);
        this.inMemoryCache.set(date, data);
        return data;
      } catch (error) {
        console.error(`Failed to recover from backup for ${date}:`, error);
      }
    }

    return null;
  }

  verifyAndRepair(): { verified: number; repaired: number; missing: number } {
    this.initialize();

    let verified = 0;
    let repaired = 0;
    let missing = 0;

    const files = fs
      .readdirSync(this.dataDir)
      .filter((f) => f.endsWith(".json") && !f.includes(".backup"));

    files.forEach((file) => {
      const date = file.replace(".json", "");
      const filepath = path.join(this.dataDir, file);

      try {
        const data = JSON.parse(
          fs.readFileSync(filepath, "utf-8"),
        ) as DailyStats;

        if (this.isValidDailyStats(data)) {
          verified++;
          this.backupDailyStats(data);
        } else {
          throw new Error("Invalid DailyStats structure");
        }
      } catch (error) {
        console.warn(`Corrupted file detected: ${file}`);
        const recovered = this.recoverFromBackup(date);
        if (recovered) {
          fs.writeFileSync(filepath, JSON.stringify(recovered, null, 2));
          repaired++;
        } else {
          missing++;
          console.error(`Could not repair ${file}`);
        }
      }
    });

    return { verified, repaired, missing };
  }

  getAllDataWithRecovery(): DailyStats[] {
    this.initialize();

    const files = fs
      .readdirSync(this.dataDir)
      .filter((f) => f.endsWith(".json") && !f.includes(".backup"));

    const data: DailyStats[] = [];

    files.forEach((file) => {
      const filepath = path.join(this.dataDir, file);

      try {
        const dailyData = JSON.parse(
          fs.readFileSync(filepath, "utf-8"),
        ) as DailyStats;

        if (this.isValidDailyStats(dailyData)) {
          data.push(dailyData);
          this.inMemoryCache.set(dailyData.date, dailyData);
        }
      } catch (error) {
        const date = file.replace(".json", "");
        const recovered = this.recoverFromBackup(date);

        if (recovered) {
          data.push(recovered);
          fs.writeFileSync(filepath, JSON.stringify(recovered, null, 2));
        }
      }
    });

    return data;
  }

  ensureDataIntegrity(entry: TimeEntry): TimeEntry {
    const sanitizeString = (
      value: string | undefined,
      fallback: string,
    ): string => {
      if (!value || typeof value !== "string" || value.trim().length === 0) {
        return fallback;
      }
      return value.trim();
    };

    const sanitizeNumber = (
      value: number | undefined,
      fallback: number,
    ): number => {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return fallback;
      }
      return value;
    };

    const cleanedEntry: TimeEntry = {
      timestamp: sanitizeNumber(entry.timestamp, Date.now()),
      duration: Math.max(0, sanitizeNumber(entry.duration, 0)),
      file: sanitizeString(entry.file, "untitled"),
      language: sanitizeString(entry.language, "text"),
      project: sanitizeString(entry.project, "project"),
      author: sanitizeString(entry.author, "developer"),
      branch: sanitizeString(entry.branch, "main"),
    };

    if (cleanedEntry.timestamp <= 0) {
      cleanedEntry.timestamp = Date.now();
    }

    if (cleanedEntry.file === "") cleanedEntry.file = "untitled";
    if (cleanedEntry.language === "") cleanedEntry.language = "text";
    if (cleanedEntry.project === "") cleanedEntry.project = "project";
    if (cleanedEntry.author === "") cleanedEntry.author = "developer";
    if (cleanedEntry.branch === "") cleanedEntry.branch = "main";

    return cleanedEntry;
  }

  getBackupStats(): {
    backupCount: number;
    oldestBackup: string | null;
    newestBackup: string | null;
    totalBackupSize: number;
  } {
    this.initialize();

    try {
      const files = fs
        .readdirSync(this.backupDir)
        .filter((f) => f.endsWith(".backup.json"));

      if (files.length === 0) {
        return {
          backupCount: 0,
          oldestBackup: null,
          newestBackup: null,
          totalBackupSize: 0,
        };
      }

      const dates = files.map((f) => f.replace(".backup.json", "")).sort();

      let totalSize = 0;
      files.forEach((file) => {
        const stat = fs.statSync(path.join(this.backupDir, file));
        totalSize += stat.size;
      });

      return {
        backupCount: files.length,
        oldestBackup: dates[0],
        newestBackup: dates[dates.length - 1],
        totalBackupSize: totalSize,
      };
    } catch (error) {
      console.error("Failed to get backup stats:", error);
      return {
        backupCount: 0,
        oldestBackup: null,
        newestBackup: null,
        totalBackupSize: 0,
      };
    }
  }

  cleanupOldBackups(keepDays: number = 90): number {
    this.initialize();

    let deletedCount = 0;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);

    try {
      const files = fs
        .readdirSync(this.backupDir)
        .filter((f) => f.endsWith(".backup.json"));

      files.forEach((file) => {
        const backupPath = path.join(this.backupDir, file);
        const stat = fs.statSync(backupPath);

        if (stat.mtime < cutoffDate) {
          fs.unlinkSync(backupPath);
          deletedCount++;
        }
      });
    } catch (error) {
      console.error("Failed to cleanup old backups:", error);
    }

    return deletedCount;
  }

  private restoreFromBackup(date: string, data: DailyStats): void {
    const filepath = path.join(this.dataDir, `${date}.json`);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  }

  private isValidDailyStats(data: unknown): data is DailyStats {
    if (data == null || typeof data !== "object") {
      return false;
    }
    const obj = data as Record<string, unknown>;
    return (
      typeof obj.date === "string" &&
      Array.isArray(obj.entries) &&
      (obj.entries as unknown[]).every((entry: unknown) =>
        this.isValidTimeEntry(entry),
      ) === true
    );
  }

  private isValidTimeEntry(entry: unknown): entry is TimeEntry {
    if (entry == null || typeof entry !== "object") {
      return false;
    }
    const obj = entry as Record<string, unknown>;

    if (typeof obj.timestamp !== "number" || obj.timestamp <= 0) {
      return false;
    }
    if (typeof obj.duration !== "number" || obj.duration < 0) {
      return false;
    }
    if (typeof obj.file !== "string" || obj.file.length === 0) {
      return false;
    }
    if (typeof obj.language !== "string" || obj.language.length === 0) {
      return false;
    }
    if (typeof obj.project !== "string" || obj.project.length === 0) {
      return false;
    }
    if (typeof obj.author !== "string" || obj.author.length === 0) {
      return false;
    }
    if (typeof obj.branch !== "string" || obj.branch.length === 0) {
      return false;
    }

    return true;
  }

  private calculateChecksum(data: DailyStats): string {
    const crypto = require("crypto");
    return crypto.createHash("md5").update(JSON.stringify(data)).digest("hex");
  }

  private updateMetadata(date: string, metadata: BackupMetadata): void {
    try {
      let allMetadata: Record<string, BackupMetadata> = {};

      if (fs.existsSync(this.metadataFile)) {
        allMetadata = JSON.parse(
          fs.readFileSync(this.metadataFile, "utf-8"),
        ) as Record<string, BackupMetadata> as Record<string, BackupMetadata>;
      }

      allMetadata[date] = metadata;
      this.saveMetadata(allMetadata);
    } catch (error) {
      console.error("Failed to update metadata:", error);
    }
  }

  private saveMetadata(metadata: Record<string, BackupMetadata>): void {
    try {
      fs.writeFileSync(
        this.metadataFile,
        JSON.stringify(metadata, null, 2),
        "utf-8",
      );
    } catch (error) {
      console.error("Failed to save metadata:", error);
    }
  }
}
