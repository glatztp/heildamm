import * as fs from "fs";
import * as path from "path";
import { STORAGE_DIR_NAME } from "./constants";

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

  constructor() {
    this.dataDir = this.getDataDir();
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
    const today = new Date().toISOString().split("T")[0];
    const filepath = path.join(this.dataDir, `${today}.json`);

    let dailyData: DailyStats = { date: today, entries: [] };

    if (fs.existsSync(filepath)) {
      try {
        dailyData = JSON.parse(fs.readFileSync(filepath, "utf-8"));
      } catch (error) {
        console.error("Failed to parse daily stats:", error);
      }
    }

    dailyData.entries.push(entry);
    fs.writeFileSync(filepath, JSON.stringify(dailyData, null, 2));
  }

  getAllData(): DailyStats[] {
    this.ensureDirectory();
    const files = fs
      .readdirSync(this.dataDir)
      .filter((f) => f.endsWith(".json"));

    return files
      .map((file) => {
        try {
          return JSON.parse(
            fs.readFileSync(path.join(this.dataDir, file), "utf-8"),
          );
        } catch (error) {
          console.error(`Failed to read ${file}:`, error);
          return null;
        }
      })
      .filter((data): data is DailyStats => data !== null);
  }

  getTodayData(): DailyStats | null {
    const today = new Date().toISOString().split("T")[0];
    const filepath = path.join(this.dataDir, `${today}.json`);

    if (!fs.existsSync(filepath)) {
      return null;
    }

    try {
      return JSON.parse(fs.readFileSync(filepath, "utf-8"));
    } catch (error) {
      console.error("Failed to parse today's stats:", error);
      return null;
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

  getDir(): string {
    return this.dataDir;
  }
}
