import express from "express";
import apiRouter from "./routes/api";
import { cleanExpiredFiles } from "./services/fileService";

export async function createApp() {
  const app = express();

  app.use(express.json());

  // API Routes - All backend logic separated here
  app.use("/api", apiRouter);

  // Health check for monitoring
  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "filepass26-backend" });
  });

  // 404 for undefined routes
  app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  return app;
}

// Start background cleanup job every 10 seconds
setInterval(cleanExpiredFiles, 10000);
