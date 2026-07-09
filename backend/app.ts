import express from "express";
import path from "path";
import fs from "fs";
import type { Request, Response, NextFunction } from "express";
import apiRouter from "./routes/api";
import { cleanExpiredFiles } from "./services/fileService";

export async function createApp() {
  const app = express();

  // CORS for dev (Vite runs on 5173)
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // API Routes MUST be before static files
  app.use("/api", apiRouter);

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "filepass26-backend" });
  });

  // Serve frontend static files
  const distPath = path.join(process.cwd(), "dist");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Multer error handler (oversized files, etc.)
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 5GB.' });
    }
    if (err?.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Unexpected file field.' });
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ error: err?.message || 'Internal server error.' });
  });

  return app;
}

// Start background cleanup job every 10 seconds
setInterval(cleanExpiredFiles, 10000);
