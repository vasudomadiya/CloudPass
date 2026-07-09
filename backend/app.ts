import express from "express";
import path from "path";
import fs from "fs";
import apiRouter from "./routes/api";
import { cleanExpiredFiles } from "./services/fileService";

export async function createApp() {
  const app = express();

  app.use(express.json());

  // API Routes
  app.use("/api", apiRouter);

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "filepass26-backend" });
  });

  // Serve frontend static files in production
  const distPath = path.join(process.cwd(), "dist");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    app.use((req, res) => {
      res.status(404).json({ error: "Not found" });
    });
  }

  return app;
}

// Start background cleanup job every 10 seconds
setInterval(cleanExpiredFiles, 10000);
