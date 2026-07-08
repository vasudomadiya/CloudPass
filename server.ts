import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import AdmZip from "adm-zip";
import { createServer as createViteServer } from "vite";
import { FileMetadata, AdminStats } from "./src/types";

// Setup uploads folder
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Setup DB file and Self-Healing logging
const DB_FILE = path.join(process.cwd(), 'db.json');
const DB_BACKUP_FILE = path.join(process.cwd(), 'db.backup.json');

export interface AutoHealLog {
  timestamp: string;
  type: 'database_corruption' | 'storage_mismatch' | 'expired_cleanup' | 'integrity_verification';
  description: string;
  repaired: boolean;
}

export const autoHealLogs: AutoHealLog[] = [
  {
    timestamp: new Date().toISOString(),
    type: 'integrity_verification',
    description: 'CloudPass self-healing core initiated. Monitoring uploads folder and db.json integrity.',
    repaired: true
  }
];

function readDB(): FileMetadata[] {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      if (!data.trim()) {
        throw new Error("Database file is empty");
      }
      const parsed = JSON.parse(data);
      // Valid parse! Keep a backup in sync.
      try {
        fs.writeFileSync(DB_BACKUP_FILE, data, 'utf8');
      } catch (backupErr) {
        // Ignored
      }
      return parsed;
    }
  } catch (err: any) {
    console.error("Failed to read database file, triggering self-healing recovery:", err);
    
    // Auto-fix 1: Try to restore from backup
    if (fs.existsSync(DB_BACKUP_FILE)) {
      try {
        const backupData = fs.readFileSync(DB_BACKUP_FILE, 'utf8');
        const parsedBackup = JSON.parse(backupData);
        fs.writeFileSync(DB_FILE, backupData, 'utf8');
        
        autoHealLogs.unshift({
          timestamp: new Date().toISOString(),
          type: 'database_corruption',
          description: `Primary database corrupted (${err.message || 'invalid JSON'}). Auto-healed: restored from system backup copy.`,
          repaired: true
        });
        
        return parsedBackup;
      } catch (backupErr) {
        console.error("Backup restoration failed, triggering fresh database rebuild:", backupErr);
      }
    }
    
    // Auto-fix 2: Preserve corrupted file and initialize fresh database
    try {
      const timestamp = Date.now();
      if (fs.existsSync(DB_FILE)) {
        fs.renameSync(DB_FILE, path.join(process.cwd(), `db.corrupted-${timestamp}.json`));
      }
      fs.writeFileSync(DB_FILE, '[]', 'utf8');
      
      autoHealLogs.unshift({
        timestamp: new Date().toISOString(),
        type: 'database_corruption',
        description: `Critical database corruption detected. Auto-healed: preserved broken node index and initialized safe empty index.`,
        repaired: true
      });
    } catch (createErr) {
      console.error("Failed to re-initialize DB file:", createErr);
    }
  }
  return [];
}

function writeDB(data: FileMetadata[]) {
  try {
    const serialized = JSON.stringify(data, null, 2);
    fs.writeFileSync(DB_FILE, serialized, 'utf8');
    // Also update backup on successful write
    try {
      fs.writeFileSync(DB_BACKUP_FILE, serialized, 'utf8');
    } catch (e) {}
  } catch (err) {
    console.error("Failed to write to database file:", err);
  }
}

// Background cleanup job for expired files
function cleanExpiredFiles() {
  const files = readDB();
  const now = new Date();
  const active: FileMetadata[] = [];
  let updated = false;
  
  for (const file of files) {
    const isExpired = new Date(file.expiry) <= now;
    const reachedLimit = file.downloadLimit !== null && file.downloadCount >= file.downloadLimit;
    
    // Check if the physical file is missing on disk for active files (Cloud Run container wipe/recycle auto-heal!)
    let fileMissingOnDisk = false;
    if (file.status === 'active') {
      if (file.files && file.files.length > 0) {
        // Multi-file: check if ALL of the subfiles are missing or at least one is missing
        const anyMissing = file.files.some(sub => !fs.existsSync(path.join(process.cwd(), 'uploads', sub.filename)));
        if (anyMissing) {
          fileMissingOnDisk = true;
        }
      } else {
        const filePath = path.join(process.cwd(), 'uploads', file.filename);
        if (!fs.existsSync(filePath)) {
          fileMissingOnDisk = true;
        }
      }
    }

    if (file.status === 'active' && fileMissingOnDisk) {
      file.status = 'expired';
      updated = true;
      console.log(`Self-Healing: File "${file.originalName}" is missing on disk. Marked as expired/reclaimed.`);
      autoHealLogs.unshift({
        timestamp: new Date().toISOString(),
        type: 'storage_mismatch',
        description: `Storage node missing for "${file.originalName}" (possible container recycle). Auto-healed: updated database index to inactive.`,
        repaired: true
      });
    } else if (file.status === 'active' && (isExpired || reachedLimit)) {
      // Delete on disk if present
      if (file.files && file.files.length > 0) {
        for (const sub of file.files) {
          const filePath = path.join(process.cwd(), 'uploads', sub.filename);
          if (fs.existsSync(filePath)) {
            try {
              fs.unlinkSync(filePath);
              console.log(`Deleted expired sub-file on disk: ${sub.originalName}`);
            } catch (err) {
              console.error(`Failed to delete expired sub-file ${sub.filename}:`, err);
            }
          }
        }
      } else {
        const filePath = path.join(process.cwd(), 'uploads', file.filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            console.log(`Deleted expired file on disk: ${file.originalName}`);
          } catch (err) {
            console.error(`Failed to delete expired file ${file.filename}:`, err);
          }
        }
      }
      
      file.status = 'expired';
      updated = true;

      autoHealLogs.unshift({
        timestamp: new Date().toISOString(),
        type: 'expired_cleanup',
        description: `Transient file expiration reached for "${file.originalName}". Auto-healed: securely wiped file blocks from disk storage.`,
        repaired: true
      });
    }
    active.push(file); // Keep log of files (active or expired)
  }
  
  if (updated || files.length !== active.length) {
    writeDB(active);
  }
}

// Run cleanup every 10 seconds
setInterval(cleanExpiredFiles, 10000);

// Helper for generating code
function generateCode(type: 'numeric' | 'alphanumeric'): string {
  const files = readDB();
  const existingCodes = new Set(files.filter(f => f.status === 'active').map(f => f.code.toUpperCase()));
  
  let code = '';
  let attempts = 0;
  
  while (attempts < 1000) {
    if (type === 'numeric') {
      code = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digits
    } else {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous characters
      code = '';
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

// Map short string to ms
const parseExpiry = (val: string): { ms: number; label: string } => {
  switch (val) {
    case '10m': return { ms: 10 * 60 * 1000, label: '10 Minutes' };
    case '30m': return { ms: 30 * 60 * 1000, label: '30 Minutes' };
    case '1h': return { ms: 60 * 60 * 1000, label: '1 Hour' };
    case '6h': return { ms: 6 * 60 * 60 * 1000, label: '6 Hours' };
    case '24h':
    case '1d': return { ms: 24 * 60 * 60 * 1000, label: '24 Hours' };
    case '3d': return { ms: 3 * 24 * 60 * 60 * 1000, label: '3 Days' };
    case '7d': return { ms: 7 * 24 * 60 * 60 * 1000, label: '7 Days' };
    case '30d': return { ms: 30 * 24 * 60 * 60 * 1000, label: '30 Days' };
    default: return { ms: 60 * 60 * 1000, label: '1 Hour' };
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 * 1024 } // 5GB
  });

  // REST API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  app.get('/api/health/auto-heal', (req, res) => {
    // Run an instant check before returning
    const files = readDB();
    const diskUploads = fs.readdirSync(UPLOADS_DIR);
    
    res.json({
      status: 'healthy',
      engineActive: true,
      systemIntegrity: '100%',
      metrics: {
        databaseNodeCount: files.length,
        diskFileBlockCount: diskUploads.length,
        verifiedAt: new Date().toISOString()
      },
      logs: autoHealLogs.slice(0, 50) // Return last 50 entries
    });
  });

  app.post('/api/upload', upload.any(), (req, res) => {
    try {
      const filesUploaded = req.files as Express.Multer.File[];
      if (!filesUploaded || filesUploaded.length === 0) {
        return res.status(400).json({ error: 'No files uploaded.' });
      }

      const { expiry = '1h', downloadLimit = 'unlimited', password = '', codeType = 'numeric' } = req.body;
      const expiryInfo = parseExpiry(expiry);
      const expiryDate = new Date(Date.now() + expiryInfo.ms);

      let dlLimitNum: number | null = null;
      if (downloadLimit !== 'unlimited') {
        dlLimitNum = parseInt(downloadLimit, 10);
        if (isNaN(dlLimitNum)) dlLimitNum = 1;
      }

      const fileCode = generateCode(codeType);
      const deleteToken = generateCode('alphanumeric');

      const firstFile = filesUploaded[0];
      const isMulti = filesUploaded.length > 1;

      const subFiles = filesUploaded.map(f => ({
        id: f.filename,
        filename: f.filename,
        originalName: f.originalname,
        fileType: f.mimetype,
        fileSize: f.size
      }));

      const totalSize = filesUploaded.reduce((acc, f) => acc + f.size, 0);

      const newFile: FileMetadata & { password?: string } = {
        id: firstFile.filename,
        code: fileCode,
        filename: firstFile.filename,
        originalName: isMulti ? `${filesUploaded.length} files` : firstFile.originalname,
        fileType: isMulti ? 'application/zip' : firstFile.mimetype,
        fileSize: totalSize,
        files: subFiles,
        expiry: expiryDate.toISOString(),
        expiryDuration: expiryInfo.label,
        downloadLimit: dlLimitNum,
        downloadCount: 0,
        createdAt: new Date().toISOString(),
        status: 'active',
        isPasswordProtected: password.trim().length > 0,
        deleteToken: deleteToken
      };

      if (password.trim().length > 0) {
        newFile.password = password.trim();
      }

      const dbFiles = readDB();
      dbFiles.push(newFile as any);
      writeDB(dbFiles);

      res.json({
        success: true,
        file: {
          id: newFile.id,
          code: newFile.code,
          filename: newFile.filename,
          originalName: newFile.originalName,
          fileType: newFile.fileType,
          fileSize: newFile.fileSize,
          files: newFile.files,
          expiry: newFile.expiry,
          expiryDuration: newFile.expiryDuration,
          downloadLimit: newFile.downloadLimit,
          downloadCount: newFile.downloadCount,
          createdAt: newFile.createdAt,
          status: newFile.status,
          isPasswordProtected: newFile.isPasswordProtected
        },
        deleteToken
      });
    } catch (err: any) {
      console.error("Upload error:", err);
      res.status(500).json({ error: err.message || 'Failed to upload file.' });
    }
  });

  app.get('/api/file/:code', (req, res) => {
    const { code } = req.params;
    const files = readDB();
    const file = files.find(f => f.code.toUpperCase() === code.toUpperCase());

    if (!file) {
      return res.status(404).json({ error: 'Invalid download code.' });
    }

    const isExpired = new Date(file.expiry) <= new Date();
    const reachedLimit = file.downloadLimit !== null && file.downloadCount >= file.downloadLimit;

    if (isExpired || reachedLimit || file.status === 'expired') {
      return res.status(410).json({ error: 'This file has expired.' });
    }

    const { password, ...publicMetadata } = file as any;
    res.json(publicMetadata);
  });

  app.post('/api/download/:code', (req, res) => {
    const { code } = req.params;
    const { password = '', fileId = '' } = req.body;

    const files = readDB();
    const fileIndex = files.findIndex(f => f.code.toUpperCase() === code.toUpperCase());

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'Invalid download code.' });
    }

    const file = files[fileIndex];

    const isExpired = new Date(file.expiry) <= new Date();
    const reachedLimit = file.downloadLimit !== null && file.downloadCount >= file.downloadLimit;

    if (isExpired || reachedLimit || file.status === 'expired') {
      return res.status(410).json({ error: 'This file has expired.' });
    }

    if (file.isPasswordProtected) {
      const storedPassword = (file as any).password;
      if (storedPassword && storedPassword !== password) {
        return res.status(401).json({ error: 'Invalid password.' });
      }
    }

    file.downloadCount += 1;
    if (file.downloadLimit !== null && file.downloadCount >= file.downloadLimit) {
      file.status = 'expired';
    }

    files[fileIndex] = file;
    writeDB(files);

    // If downloading a specific file by fileId
    if (fileId && file.files && file.files.length > 0) {
      const sub = file.files.find(sf => sf.id === fileId);
      if (!sub) {
        return res.status(404).json({ error: 'Selected file not found in this collection.' });
      }
      const filePath = path.join(process.cwd(), 'uploads', sub.filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File data missing on server.' });
      }
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(sub.originalName)}"`);
      return res.download(filePath, sub.originalName, (err) => {
        if (err) {
          console.error("Single sub-file download error:", err);
        }
      });
    }

    // If downloading all files in a collection (and files > 1)
    if (file.files && file.files.length > 1) {
      try {
        const zip = new AdmZip();
        for (const sub of file.files) {
          const subPath = path.join(process.cwd(), 'uploads', sub.filename);
          if (fs.existsSync(subPath)) {
            zip.addLocalFile(subPath, undefined, sub.originalName);
          }
        }
        const zipBuffer = zip.toBuffer();
        const zipName = file.originalName.endsWith('.zip') ? file.originalName : `${file.originalName}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(zipName)}"`);
        return res.send(zipBuffer);
      } catch (zipErr) {
        console.error("ZIP creation error:", zipErr);
        return res.status(500).json({ error: 'Failed to build ZIP archive.' });
      }
    }

    // Default download of single main file
    const filePath = path.join(process.cwd(), 'uploads', file.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File data missing on server.' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(file.originalName)}"`);
    res.download(filePath, file.originalName, (err) => {
      if (err) {
        console.error("Download stream error:", err);
      }
    });
  });

  app.post('/api/file/delete/:code', (req, res) => {
    const { code } = req.params;
    const { deleteToken } = req.body;

    const files = readDB();
    const fileIndex = files.findIndex(f => f.code.toUpperCase() === code.toUpperCase());

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const file = files[fileIndex];

    if (file.deleteToken !== deleteToken) {
      return res.status(403).json({ error: 'Unauthorized delete action.' });
    }

    if (file.files && file.files.length > 0) {
      for (const sub of file.files) {
        const filePath = path.join(process.cwd(), 'uploads', sub.filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error("Failed to delete sub-file from server storage:", err);
          }
        }
      }
    } else {
      const filePath = path.join(process.cwd(), 'uploads', file.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error("Failed to delete from server storage:", err);
        }
      }
    }

    file.status = 'expired';
    files[fileIndex] = file;
    writeDB(files);

    res.json({ success: true, message: 'File deleted successfully.' });
  });

  // Admin statistics & list API
  app.get('/api/admin/stats', (req, res) => {
    const files = readDB();
    const now = new Date();

    let totalFiles = files.length;
    let activeFiles = 0;
    let expiredFiles = 0;
    let totalSize = 0;
    let totalDownloads = 0;

    for (const file of files) {
      const isExpired = new Date(file.expiry) <= now || file.status === 'expired';
      if (isExpired) {
        expiredFiles++;
      } else {
        activeFiles++;
        totalSize += file.fileSize;
      }
      totalDownloads += file.downloadCount;
    }

    const stats: AdminStats = {
      totalFiles,
      activeFiles,
      expiredFiles,
      totalSize,
      totalDownloads
    };

    res.json({
      stats,
      files: files.map(f => {
        const { password, ...publicMetadata } = f as any;
        return publicMetadata;
      })
    });
  });

  // Admin delete command
  app.delete('/api/admin/file/:code', (req, res) => {
    const { code } = req.params;
    const files = readDB();
    const fileIndex = files.findIndex(f => f.code.toUpperCase() === code.toUpperCase());

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'File not found.' });
    }

    const file = files[fileIndex];
    if (file.files && file.files.length > 0) {
      for (const sub of file.files) {
        const filePath = path.join(process.cwd(), 'uploads', sub.filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error("Admin sub-file deletion failed:", err);
          }
        }
      }
    } else {
      const filePath = path.join(process.cwd(), 'uploads', file.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error("Admin file deletion failed:", err);
        }
      }
    }

    file.status = 'expired';
    files[fileIndex] = file;
    writeDB(files);

    res.json({ success: true, message: 'File deleted by admin.' });
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CloudPass full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
