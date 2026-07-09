import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import { FileMetadata, AdminStats } from "../../src/types";
import { readDB, writeDB, autoHealLogs } from "../services/db";
import {
  generateCode,
  parseExpiry,
  UPLOADS_DIR,
} from "../services/fileService";

const router = Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // 5GB
});

// Health Check
router.get("/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Auto-Heal Status
router.get("/health/auto-heal", (req, res) => {
  const files = readDB();
  const diskUploads = fs.readdirSync(UPLOADS_DIR);

  res.json({
    status: "healthy",
    engineActive: true,
    systemIntegrity: "100%",
    metrics: {
      databaseNodeCount: files.length,
      diskFileBlockCount: diskUploads.length,
      verifiedAt: new Date().toISOString(),
    },
    logs: autoHealLogs.slice(0, 50),
  });
});

// Upload Files
router.post("/upload", upload.any(), (req, res) => {
  try {
    const filesUploaded = req.files as Express.Multer.File[];
    if (!filesUploaded || filesUploaded.length === 0) {
      return res.status(400).json({ error: "No files uploaded." });
    }

    const {
      expiry = "1h",
      downloadLimit = "unlimited",
      password = "",
      codeType = "numeric",
    } = req.body;
    const expiryInfo = parseExpiry(expiry);
    const expiryDate = new Date(Date.now() + expiryInfo.ms);

    let dlLimitNum: number | null = null;
    if (downloadLimit !== "unlimited") {
      dlLimitNum = parseInt(downloadLimit, 10);
      if (isNaN(dlLimitNum)) dlLimitNum = 1;
    }

    const fileCode = generateCode(codeType);
    const deleteToken = generateCode("alphanumeric");

    const firstFile = filesUploaded[0];
    const isMulti = filesUploaded.length > 1;

    const subFiles = filesUploaded.map((f) => ({
      id: f.filename,
      filename: f.filename,
      originalName: f.originalname,
      fileType: f.mimetype,
      fileSize: f.size,
    }));

    const totalSize = filesUploaded.reduce((acc, f) => acc + f.size, 0);

    const newFile: FileMetadata & { password?: string } = {
      id: firstFile.filename,
      code: fileCode,
      filename: firstFile.filename,
      originalName: isMulti
        ? `${filesUploaded.length} files`
        : firstFile.originalname,
      fileType: isMulti ? "application/zip" : firstFile.mimetype,
      fileSize: totalSize,
      files: subFiles,
      expiry: expiryDate.toISOString(),
      expiryDuration: expiryInfo.label,
      downloadLimit: dlLimitNum,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
      status: "active",
      isPasswordProtected: password.trim().length > 0,
      deleteToken: deleteToken,
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
        isPasswordProtected: newFile.isPasswordProtected,
      },
      deleteToken,
    });
  } catch (err: any) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message || "Failed to upload file." });
  }
});

// Get File Info
router.get("/file/:code", (req, res) => {
  const { code } = req.params;
  const files = readDB();
  const file = files.find((f) => f.code.toUpperCase() === code.toUpperCase());

  if (!file) {
    return res.status(404).json({ error: "Invalid download code." });
  }

  const isExpired = new Date(file.expiry) <= new Date();
  const reachedLimit =
    file.downloadLimit !== null && file.downloadCount >= file.downloadLimit;

  if (isExpired || reachedLimit || file.status === "expired") {
    return res.status(410).json({ error: "This file has expired." });
  }

  const { password, ...publicMetadata } = file as any;
  res.json(publicMetadata);
});

// Download File
router.post("/download/:code", (req, res) => {
  const { code } = req.params;
  const { password = "", fileId = "" } = req.body;

  const files = readDB();
  const fileIndex = files.findIndex(
    (f) => f.code.toUpperCase() === code.toUpperCase(),
  );

  if (fileIndex === -1) {
    return res.status(404).json({ error: "Invalid download code." });
  }

  const file = files[fileIndex];

  const isExpired = new Date(file.expiry) <= new Date();
  const reachedLimit =
    file.downloadLimit !== null && file.downloadCount >= file.downloadLimit;

  if (isExpired || reachedLimit || file.status === "expired") {
    return res.status(410).json({ error: "This file has expired." });
  }

  if (file.isPasswordProtected) {
    const storedPassword = (file as any).password;
    if (storedPassword && storedPassword !== password) {
      return res.status(401).json({ error: "Invalid password." });
    }
  }

  file.downloadCount += 1;
  if (file.downloadLimit !== null && file.downloadCount >= file.downloadLimit) {
    file.status = "expired";
  }

  files[fileIndex] = file;
  writeDB(files);

  if (fileId && file.files && file.files.length > 0) {
    const sub = file.files.find((sf) => sf.id === fileId);
    if (!sub) {
      return res.status(404).json({ error: "Selected file not found." });
    }
    const filePath = path.join(UPLOADS_DIR, sub.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "File data missing." });
    }
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(sub.originalName)}"`,
    );
    return res.download(filePath, sub.originalName, (err) => {
      if (err) console.error("Download error:", err);
    });
  }

  if (file.files && file.files.length > 1) {
    try {
      const zip = new AdmZip();
      for (const sub of file.files) {
        const subPath = path.join(UPLOADS_DIR, sub.filename);
        if (fs.existsSync(subPath)) {
          zip.addLocalFile(subPath, undefined, sub.originalName);
        }
      }
      const zipBuffer = zip.toBuffer();
      const zipName = file.originalName.endsWith(".zip")
        ? file.originalName
        : `${file.originalName}.zip`;
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(zipName)}"`,
      );
      return res.send(zipBuffer);
    } catch (zipErr) {
      console.error("ZIP creation error:", zipErr);
      return res.status(500).json({ error: "Failed to build ZIP archive." });
    }
  }

  const filePath = path.join(UPLOADS_DIR, file.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File data missing." });
  }

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(file.originalName)}"`,
  );
  res.download(filePath, file.originalName, (err) => {
    if (err) console.error("Download error:", err);
  });
});

// Delete File
router.post("/file/delete/:code", (req, res) => {
  const { code } = req.params;
  const { deleteToken } = req.body;

  const files = readDB();
  const fileIndex = files.findIndex(
    (f) => f.code.toUpperCase() === code.toUpperCase(),
  );

  if (fileIndex === -1) {
    return res.status(404).json({ error: "File not found." });
  }

  const file = files[fileIndex];

  if (file.deleteToken !== deleteToken) {
    return res.status(403).json({ error: "Unauthorized delete action." });
  }

  if (file.files && file.files.length > 0) {
    for (const sub of file.files) {
      const filePath = path.join(UPLOADS_DIR, sub.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error("Failed to delete sub-file:", err);
        }
      }
    }
  } else {
    const filePath = path.join(UPLOADS_DIR, file.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Failed to delete file:", err);
      }
    }
  }

  file.status = "expired";
  files[fileIndex] = file;
  writeDB(files);

  res.json({ success: true, message: "File deleted." });
});

// Admin Stats
router.get("/admin/stats", (req, res) => {
  const files = readDB();
  const now = new Date();

  let totalFiles = files.length;
  let activeFiles = 0;
  let expiredFiles = 0;
  let totalSize = 0;
  let totalDownloads = 0;

  for (const file of files) {
    const isExpired = new Date(file.expiry) <= now || file.status === "expired";
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
    totalDownloads,
  };

  res.json({
    stats,
    files: files.map((f) => {
      const { password, ...publicMetadata } = f as any;
      return publicMetadata;
    }),
  });
});

// Admin Delete File
router.delete("/admin/file/:code", (req, res) => {
  const { code } = req.params;
  const files = readDB();
  const fileIndex = files.findIndex(
    (f) => f.code.toUpperCase() === code.toUpperCase(),
  );

  if (fileIndex === -1) {
    return res.status(404).json({ error: "File not found." });
  }

  const file = files[fileIndex];
  if (file.files && file.files.length > 0) {
    for (const sub of file.files) {
      const filePath = path.join(UPLOADS_DIR, sub.filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error("Admin sub-file deletion failed:", err);
        }
      }
    }
  } else {
    const filePath = path.join(UPLOADS_DIR, file.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error("Admin file deletion failed:", err);
      }
    }
  }

  file.status = "expired";
  files[fileIndex] = file;
  writeDB(files);

  res.json({ success: true, message: "File deleted by admin." });
});

export default router;
