import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { STORAGE_DIR_NAME } from "../constants";

export class KeyManager {
  private keyFilePath: string;
  private keyFileName = ".encryption-key";

  constructor() {
    const homeDir =
      process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH || "";
    const dataDir = path.join(homeDir, STORAGE_DIR_NAME);
    this.keyFilePath = path.join(dataDir, this.keyFileName);
  }

  private ensureKeyDirectory(): void {
    const dir = path.dirname(this.keyFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private generateNewKey(): { key: Buffer; salt: Buffer } {
    const key = crypto.randomBytes(32);
    const salt = crypto.randomBytes(16);
    return { key, salt };
  }

  private saveKey(key: Buffer, salt: Buffer): void {
    this.ensureKeyDirectory();
    const data = JSON.stringify({
      key: key.toString("hex"),
      salt: salt.toString("hex"),
      created: new Date().toISOString(),
    });
    fs.writeFileSync(this.keyFilePath, data, { mode: 0o600 });
  }

  private loadKey(): { key: Buffer; salt: Buffer } | null {
    try {
      if (!fs.existsSync(this.keyFilePath)) {
        return null;
      }
      const data = JSON.parse(fs.readFileSync(this.keyFilePath, "utf-8"));
      return {
        key: Buffer.from(data.key, "hex"),
        salt: Buffer.from(data.salt, "hex"),
      };
    } catch (error) {
      console.error("Failed to load encryption key:", error);
      return null;
    }
  }

  getKey(): Buffer {
    let keyData = this.loadKey();

    if (!keyData) {
      keyData = this.generateNewKey();
      this.saveKey(keyData.key, keyData.salt);
    }

    return keyData.key;
  }

  getSalt(): Buffer {
    let keyData = this.loadKey();

    if (!keyData) {
      keyData = this.generateNewKey();
      this.saveKey(keyData.key, keyData.salt);
    }

    return keyData.salt;
  }

  getKeyFilePath(): string {
    return this.keyFilePath;
  }
}
