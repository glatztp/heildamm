import * as zlib from "zlib";
import * as util from "util";

const gzip = util.promisify(zlib.gzip);
const gunzip = util.promisify(zlib.gunzip);

export class CompressionService {
  async compress(data: unknown): Promise<string> {
    try {
      const jsonString = JSON.stringify(data);
      const compressed = await gzip(jsonString);
      return compressed.toString("base64");
    } catch (error) {
      console.error("Compression failed:", error);
      throw new Error("Failed to compress data");
    }
  }

  async decompress<T = unknown>(compressed: string): Promise<T> {
    try {
      const buffer = Buffer.from(compressed, "base64");
      const decompressed = await gunzip(buffer);
      return JSON.parse(decompressed.toString("utf-8"));
    } catch (error) {
      console.error("Decompression failed:", error);
      throw new Error("Failed to decompress data - may be corrupted");
    }
  }

  isCompressed(data: string): boolean {
    try {
      return data.startsWith("H4sI") && /^[A-Za-z0-9+/=]+$/.test(data);
    } catch {
      return false;
    }
  }

  getCompressionRatio(original: number, compressed: number): number {
    return Math.round(((original - compressed) / original) * 100);
  }
}
