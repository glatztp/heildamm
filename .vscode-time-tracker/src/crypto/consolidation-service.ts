import * as fs from "fs";
import * as path from "path";
import * as zlib from "zlib";
import * as util from "util";
import { STORAGE_DIR_NAME, getLocalDateString } from "../constants";
import { DailyStats, TimeEntry } from "../storage";

const gzip = util.promisify(zlib.gzip);
const gunzip = util.promisify(zlib.gunzip);

export interface ConsolidatedStats {
  type: "weekly" | "monthly";
  startDate: string;
  endDate: string;
  consolidatedAt: string;
  dayCount: number;
  totalEntries: number;
  entries: TimeEntry[];
}

export interface ConsolidationStats {
  consolidatedWeeks: number;
  consolidatedMonths: number;
  totalConsolidatedDays: number;
  totalConsolidatedSize: number;
  savedSpace: number;
  avgCompressionRatio: number;
}

export class ConsolidationService {
  private dataDir: string;
  private consolidatedDir: string;
  private indexFile: string;

  constructor() {
    const homeDir =
      process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH || "";
    this.dataDir = path.join(homeDir, STORAGE_DIR_NAME);
    this.consolidatedDir = path.join(this.dataDir, ".consolidated");
    this.indexFile = path.join(this.consolidatedDir, "index.json");
  }

  private ensureDirectory(): void {
    if (!fs.existsSync(this.consolidatedDir)) {
      fs.mkdirSync(this.consolidatedDir, { recursive: true });
    }
  }

  async consolidateByWeek(weekOf: string): Promise<number> {
    this.ensureDirectory();

    try {
      const startDate = this.getWeekStart(new Date(weekOf));
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      return this.consolidatePeriod(startDate, endDate, "weekly");
    } catch (error) {
      console.error("Failed to consolidate week:", error);
      throw new Error("Failed to consolidate week");
    }
  }

  async consolidateByMonth(monthOf: string): Promise<number> {
    this.ensureDirectory();

    try {
      const date = new Date(monthOf);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      return this.consolidatePeriod(startDate, endDate, "monthly");
    } catch (error) {
      console.error("Failed to consolidate month:", error);
      throw new Error("Failed to consolidate month");
    }
  }

  private async consolidatePeriod(
    startDate: Date,
    endDate: Date,
    type: "weekly" | "monthly",
  ): Promise<number> {
    const allDailyData: TimeEntry[] = [];
    const filesToRemove: string[] = [];
    let beforeSize = 0;
    let afterSize = 0;

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = getLocalDateString(current);
      const filepath = path.join(this.dataDir, `${dateStr}.json`);

      if (fs.existsSync(filepath)) {
        try {
          const content = fs.readFileSync(filepath, "utf-8");
          const stat = fs.statSync(filepath);
          beforeSize += stat.size;

          const data = JSON.parse(content) as DailyStats;
          allDailyData.push(...data.entries);
          filesToRemove.push(filepath);
        } catch (error) {
          console.warn(`Could not consolidate ${dateStr}:`, error);
        }
      }

      current.setDate(current.getDate() + 1);
    }

    if (allDailyData.length === 0) {
      console.warn("No data to consolidate");
      return 0;
    }

    const consolidated: ConsolidatedStats = {
      type,
      startDate: getLocalDateString(startDate),
      endDate: getLocalDateString(endDate),
      consolidatedAt: new Date().toISOString(),
      dayCount: filesToRemove.length,
      totalEntries: allDailyData.length,
      entries: allDailyData,
    };

    const compressed = await gzip(JSON.stringify(consolidated));
    afterSize = compressed.length;

    const consolidatedFilename = `${type}-${getLocalDateString(startDate)}.gz`;
    const consolidatedPath = path.join(
      this.consolidatedDir,
      consolidatedFilename,
    );

    fs.writeFileSync(consolidatedPath, compressed);

    filesToRemove.forEach((file) => {
      try {
        fs.unlinkSync(file);
      } catch (error) {
        console.error(`Failed to remove ${file}:`, error);
      }
    });

    this.updateIndex(type, getLocalDateString(startDate));

    const savedSize = beforeSize - afterSize;
    console.log(
      `Consolidated ${filesToRemove.length} days: ${beforeSize} -> ${afterSize} bytes (saved ${savedSize} bytes)`,
    );

    return savedSize;
  }

  async expandConsolidated(
    consolidatedStart: string,
    type: "weekly" | "monthly",
  ): Promise<number> {
    this.ensureDirectory();

    try {
      const filename = `${type}-${consolidatedStart}.gz`;
      const filepath = path.join(this.consolidatedDir, filename);

      if (!fs.existsSync(filepath)) {
        throw new Error(`Consolidated file not found: ${filename}`);
      }

      const compressed = fs.readFileSync(filepath);
      const decompressed = await gunzip(compressed);
      const consolidated = JSON.parse(
        decompressed.toString("utf-8"),
      ) as ConsolidatedStats;

      const entriesByDate: Map<string, TimeEntry[]> = new Map();
      consolidated.entries.forEach((entry) => {
        const date = getLocalDateString(new Date(entry.timestamp));
        if (!entriesByDate.has(date)) {
          entriesByDate.set(date, []);
        }
        entriesByDate.get(date)!.push(entry);
      });

      let totalSize = 0;
      entriesByDate.forEach((entries, date) => {
        const dailyData: DailyStats = { date, entries };
        const filePath = path.join(this.dataDir, `${date}.json`);

        const content = JSON.stringify(dailyData, null, 2);
        fs.writeFileSync(filePath, content);
        totalSize += content.length;
      });

      fs.unlinkSync(filepath);
      this.removeFromIndex(type, consolidatedStart);

      console.log(`Expanded ${consolidated.dayCount} days`);
      return totalSize;
    } catch (error) {
      console.error("Failed to expand consolidated data:", error);
      throw new Error("Failed to expand consolidated data");
    }
  }

  getConsolidationStats(): ConsolidationStats {
    this.ensureDirectory();

    let consolidatedWeeks = 0;
    let consolidatedMonths = 0;
    let totalConsolidatedDays = 0;
    let totalConsolidatedSize = 0;
    let totalOriginalSize = 0;

    try {
      const index = this.loadIndex();

      Object.entries(index).forEach(([type, dates]) => {
        if (type === "weekly") {
          consolidatedWeeks = dates.length;
        } else if (type === "monthly") {
          consolidatedMonths = dates.length;
        }

        dates.forEach((date) => {
          const filename = `${type}-${date}.gz`;
          const filepath = path.join(this.consolidatedDir, filename);

          if (fs.existsSync(filepath)) {
            const stat = fs.statSync(filepath);
            totalConsolidatedSize += stat.size;

            totalOriginalSize += Math.round(stat.size / 0.3);
            totalConsolidatedDays += 7;
          }
        });
      });
    } catch (error) {
      console.error("Failed to get consolidation stats:", error);
    }

    const savedSpace = totalOriginalSize - totalConsolidatedSize;
    const avgCompressionRatio =
      totalOriginalSize > 0 ? (savedSpace / totalOriginalSize) * 100 : 0;

    return {
      consolidatedWeeks,
      consolidatedMonths,
      totalConsolidatedDays,
      totalConsolidatedSize,
      savedSpace,
      avgCompressionRatio: Math.round(avgCompressionRatio),
    };
  }

  listConsolidated(): {
    weekly: string[];
    monthly: string[];
  } {
    this.ensureDirectory();

    try {
      const index = this.loadIndex();
      return {
        weekly: index.weekly || [],
        monthly: index.monthly || [],
      };
    } catch {
      return { weekly: [], monthly: [] };
    }
  }

  private getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  private loadIndex(): Record<string, string[]> {
    try {
      if (fs.existsSync(this.indexFile)) {
        return JSON.parse(fs.readFileSync(this.indexFile, "utf-8"));
      }
    } catch (error) {
      console.warn("Failed to load consolidation index:", error);
    }
    return { weekly: [], monthly: [] };
  }

  private updateIndex(type: "weekly" | "monthly", date: string): void {
    const index = this.loadIndex();
    if (!index[type]) {
      index[type] = [];
    }
    if (!index[type].includes(date)) {
      index[type].push(date);
      index[type].sort();
    }
    fs.writeFileSync(this.indexFile, JSON.stringify(index, null, 2));
  }

  private removeFromIndex(type: "weekly" | "monthly", date: string): void {
    const index = this.loadIndex();
    if (index[type]) {
      index[type] = index[type].filter((d) => d !== date);
    }
    fs.writeFileSync(this.indexFile, JSON.stringify(index, null, 2));
  }
}
