import * as fs from "fs";
import * as path from "path";
import { STORAGE_DIR_NAME, getLocalDateString } from "./constants";
import { BackupRecoveryService } from "./backup-recovery-service";

export interface TimeEntry {
  timestamp: number;
  duration: number;
  file: string;
  language: string;
  project: string;
  author: string;
  branch: string;
}

export interface DailyStats {
  date: string;
  entries: TimeEntry[];
}

export class StorageService {
  private dataDir: string;
  private backupService: BackupRecoveryService;

  constructor() {
    this.dataDir = this.getDataDir();
    this.backupService = new BackupRecoveryService();
    this.backupService.initialize();
    this.backupService.verifyAndRepair();
  }

  private getDataDir(): string {
    const homeDir =
      process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH || "";
    return path.join(homeDir, STORAGE_DIR_NAME);
  }

  ensureDirectory(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  saveEntry(entry: TimeEntry): void {
    this.ensureDirectory();
    const cleanedEntry = this.backupService.ensureDataIntegrity(entry);

    const today = getLocalDateString();
    const filepath = path.join(this.dataDir, `${today}.json`);

    let dailyData: DailyStats = { date: today, entries: [] };

    if (fs.existsSync(filepath)) {
      try {
        dailyData = JSON.parse(
          fs.readFileSync(filepath, "utf-8"),
        ) as DailyStats;
      } catch (error) {
        console.error("Failed to parse daily stats:", error);
        const recovered = this.backupService.recoverFromBackup(today);
        if (recovered) {
          dailyData = recovered;
        }
      }
    }

    dailyData.entries.push(cleanedEntry);
    fs.writeFileSync(filepath, JSON.stringify(dailyData, null, 2));
    this.backupService.backupDailyStats(dailyData);
  }

  getAllData(): DailyStats[] {
    this.ensureDirectory();
    return this.backupService.getAllDataWithRecovery();
  }

  getTodayData(): DailyStats | null {
    const today = getLocalDateString();
    const filepath = path.join(this.dataDir, `${today}.json`);

    if (!fs.existsSync(filepath)) {
      console.log(`Today's data file missing, attempting recovery...`);
      return this.backupService.recoverFromBackup(today);
    }

    try {
      const data = JSON.parse(fs.readFileSync(filepath, "utf-8")) as DailyStats;
      if (!data.date || !Array.isArray(data.entries)) {
        throw new Error("Invalid DailyStats structure");
      }

      return data;
    } catch (error) {
      console.error("Failed to parse today's stats:", error);
      return this.backupService.recoverFromBackup(today);
    }
  }

  clearAllData(): void {
    this.ensureDirectory();
    const files = fs
      .readdirSync(this.dataDir)
      .filter((f) => f.endsWith(".json"));

    files.forEach((file) => {
      fs.unlinkSync(path.join(this.dataDir, file));
    });
  }

  getBackupStats(): {
    backupCount: number;
    oldestBackup: string | null;
    newestBackup: string | null;
    totalBackupSize: number;
  } {
    return this.backupService.getBackupStats();
  }

  verifyDataIntegrity(): {
    verified: number;
    repaired: number;
    missing: number;
  } {
    return this.backupService.verifyAndRepair();
  }

  cleanupOldBackups(keepDays?: number): number {
    return this.backupService.cleanupOldBackups(keepDays);
  }

  getDir(): string {
    return this.dataDir;
  }
}
