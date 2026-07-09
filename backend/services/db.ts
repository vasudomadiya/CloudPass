import fs from "fs";
import path from "path";
import { FileMetadata } from "../../src/types";

const DB_FILE = path.join(process.cwd(), "db.json");
const DB_BACKUP_FILE = path.join(process.cwd(), "db.backup.json");

export interface AutoHealLog {
  timestamp: string;
  type:
    | "database_corruption"
    | "storage_mismatch"
    | "expired_cleanup"
    | "integrity_verification";
  description: string;
  repaired: boolean;
}

export const autoHealLogs: AutoHealLog[] = [
  {
    timestamp: new Date().toISOString(),
    type: "integrity_verification",
    description:
      "FilePass26 self-healing core initiated. Monitoring uploads folder and db.json integrity.",
    repaired: true,
  },
];

export function readDB(): FileMetadata[] {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf8");
      if (!data.trim()) {
        throw new Error("Database file is empty");
      }
      const parsed = JSON.parse(data);
      try {
        fs.writeFileSync(DB_BACKUP_FILE, data, "utf8");
      } catch (backupErr) {
        // Ignored
      }
      return parsed;
    }
  } catch (err: any) {
    console.error(
      "Failed to read database file, triggering self-healing recovery:",
      err,
    );

    if (fs.existsSync(DB_BACKUP_FILE)) {
      try {
        const backupData = fs.readFileSync(DB_BACKUP_FILE, "utf8");
        const parsedBackup = JSON.parse(backupData);
        fs.writeFileSync(DB_FILE, backupData, "utf8");

        autoHealLogs.unshift({
          timestamp: new Date().toISOString(),
          type: "database_corruption",
          description: `Primary database corrupted (${err.message || "invalid JSON"}). Auto-healed: restored from system backup copy.`,
          repaired: true,
        });

        return parsedBackup;
      } catch (backupErr) {
        console.error(
          "Backup restoration failed, triggering fresh database rebuild:",
          backupErr,
        );
      }
    }

    try {
      const timestamp = Date.now();
      if (fs.existsSync(DB_FILE)) {
        fs.renameSync(
          DB_FILE,
          path.join(process.cwd(), `db.corrupted-${timestamp}.json`),
        );
      }
      fs.writeFileSync(DB_FILE, "[]", "utf8");

      autoHealLogs.unshift({
        timestamp: new Date().toISOString(),
        type: "database_corruption",
        description: `Critical database corruption detected. Auto-healed: preserved broken node index and initialized safe empty index.`,
        repaired: true,
      });
    } catch (createErr) {
      console.error("Failed to re-initialize DB file:", createErr);
    }
  }
  return [];
}

export function writeDB(data: FileMetadata[]) {
  try {
    const serialized = JSON.stringify(data, null, 2);
    fs.writeFileSync(DB_FILE, serialized, "utf8");
    try {
      fs.writeFileSync(DB_BACKUP_FILE, serialized, "utf8");
    } catch (e) {}
  } catch (err) {
    console.error("Failed to write to database file:", err);
  }
}
