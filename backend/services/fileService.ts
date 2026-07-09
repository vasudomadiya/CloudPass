import fs from "fs";
import path from "path";
import { FileMetadata } from "../../../src/types";
import { readDB, writeDB, autoHealLogs } from "./db";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure uploads dir exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function cleanExpiredFiles() {
  const files = readDB();
  const now = new Date();
  const active: FileMetadata[] = [];
  let updated = false;

  for (const file of files) {
    const isExpired = new Date(file.expiry) <= now;
    const reachedLimit =
      file.downloadLimit !== null && file.downloadCount >= file.downloadLimit;

    let fileMissingOnDisk = false;
    if (file.status === "active") {
      if (file.files && file.files.length > 0) {
        const anyMissing = file.files.some(
          (sub) => !fs.existsSync(path.join(UPLOADS_DIR, sub.filename)),
        );
        if (anyMissing) {
          fileMissingOnDisk = true;
        }
      } else {
        const filePath = path.join(UPLOADS_DIR, file.filename);
        if (!fs.existsSync(filePath)) {
          fileMissingOnDisk = true;
        }
      }
    }

    if (file.status === "active" && fileMissingOnDisk) {
      file.status = "expired";
      updated = true;
      console.log(
        `Self-Healing: File "${file.originalName}" is missing on disk.`,
      );
      autoHealLogs.unshift({
        timestamp: new Date().toISOString(),
        type: "storage_mismatch",
        description: `Storage node missing for "${file.originalName}".`,
        repaired: true,
      });
    } else if (file.status === "active" && (isExpired || reachedLimit)) {
      if (file.files && file.files.length > 0) {
        for (const sub of file.files) {
          const filePath = path.join(UPLOADS_DIR, sub.filename);
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
              console.log(`Deleted expired sub-file: ${sub.originalName}`);
            } catch (err) {
              console.error(`Failed to delete sub-file ${sub.filename}:`, err);
            }
          }
        }
      } else {
        const filePath = path.join(UPLOADS_DIR, file.filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`Deleted expired file: ${file.originalName}`);
          } catch (err) {
            console.error(`Failed to delete file ${file.filename}:`, err);
          }
        }
      }

      file.status = "expired";
      updated = true;
      autoHealLogs.unshift({
        timestamp: new Date().toISOString(),
        type: "expired_cleanup",
        description: `File expiration reached for "${file.originalName}".`,
        repaired: true,
      });
    }
    active.push(file);
  }

  if (updated || files.length !== active.length) {
    writeDB(active);
  }
}

export function generateCode(type: "numeric" | "alphanumeric"): string {
  const files = readDB();
  const existingCodes = new Set(
    files.filter((f) => f.status === "active").map((f) => f.code.toUpperCase()),
  );

  let code = "";
  let attempts = 0;

  while (attempts < 1000) {
    if (type === "numeric") {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    } else {
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      code = "";
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    if (!existingCodes.has(code.toUpperCase())) {
      return code;
    }
    attempts++;
  }
  return code;
}

export const parseExpiry = (val: string): { ms: number; label: string } => {
  switch (val) {
    case "10m":
      return { ms: 10 * 60 * 1000, label: "10 Minutes" };
    case "30m":
      return { ms: 30 * 60 * 1000, label: "30 Minutes" };
    case "1h":
      return { ms: 60 * 60 * 1000, label: "1 Hour" };
    case "6h":
      return { ms: 6 * 60 * 60 * 1000, label: "6 Hours" };
    case "24h":
    case "1d":
      return { ms: 24 * 60 * 60 * 1000, label: "24 Hours" };
    case "3d":
      return { ms: 3 * 24 * 60 * 60 * 1000, label: "3 Days" };
    case "7d":
      return { ms: 7 * 24 * 60 * 60 * 1000, label: "7 Days" };
    case "30d":
      return { ms: 30 * 24 * 60 * 60 * 1000, label: "30 Days" };
    default:
      return { ms: 60 * 60 * 1000, label: "1 Hour" };
  }
};

export { UPLOADS_DIR };
