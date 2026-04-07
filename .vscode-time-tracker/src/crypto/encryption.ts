import * as crypto from "crypto";
import * as zlib from "zlib";
import { KeyManager } from "./key-manager";

export class EncryptionService {
  private algorithm = "aes-256-gcm";
  private encoding: BufferEncoding = "utf-8";
  private keyManager: KeyManager;

  constructor() {
    this.keyManager = new KeyManager();
  }

  private getEncryptionKey(): Buffer {
    return this.keyManager.getKey();
  }

  encrypt(data: unknown): string {
    try {
      const jsonString = JSON.stringify(data);

      const compressed = zlib.gzipSync(jsonString);

      const iv = crypto.randomBytes(16);
      const key = this.getEncryptionKey();

      const cipher = crypto.createCipheriv(
        this.algorithm,
        key,
        iv,
      ) as crypto.CipherGCM;

      let encrypted = cipher.update(compressed);
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      const authTag = cipher.getAuthTag();

      const combined = Buffer.concat([iv, authTag, encrypted]);
      const result = "|v2|" + combined.toString("base64");

      return result;
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  private decryptOptimized(encrypted: string): unknown {
    try {
      const base64Data = encrypted.replace(/^\|v2\|/, "");
      const combined = Buffer.from(base64Data, "base64");

      const iv = combined.subarray(0, 16);
      const authTag = combined.subarray(16, 32);
      const encryptedData = combined.subarray(32);

      const key = this.getEncryptionKey();
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        key,
        iv,
      ) as crypto.DecipherGCM;
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedData);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      const decompressed = zlib.gunzipSync(decrypted);
      return JSON.parse(decompressed.toString("utf-8"));
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt data - may be corrupted or tampered");
    }
  }

  private decryptLegacy(encrypted: string): unknown {
    try {
      const iv = Buffer.from(encrypted.substring(0, 32), "hex");
      const authTag = Buffer.from(encrypted.substring(32, 64), "hex");
      const encryptedData = encrypted.substring(64);

      const key = this.getEncryptionKey();
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        key,
        iv,
      ) as crypto.DecipherGCM;
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encryptedData, "hex", this.encoding);
      decrypted += decipher.final(this.encoding);

      return JSON.parse(decrypted);
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt data - may be corrupted or tampered");
    }
  }

  decrypt(encrypted: string): unknown {
    if (encrypted.startsWith("|v2|")) {
      return this.decryptOptimized(encrypted);
    } else if (/^[0-9a-f]{64,}$/.test(encrypted)) {
      return this.decryptLegacy(encrypted);
    } else {
      throw new Error("Unknown encryption format");
    }
  }

  isEncrypted(data: string): boolean {
    try {
      return data.startsWith("|v2|") || /^[0-9a-f]{64,}$/.test(data);
    } catch {
      return false;
    }
  }

  getEncryptionVersion(data: string): "v1" | "v2" | "none" {
    if (data.startsWith("|v2|")) return "v2";
    if (/^[0-9a-f]{64,}$/.test(data)) return "v1";
    return "none";
  }
}
