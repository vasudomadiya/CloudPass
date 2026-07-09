import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiRouter from "./routes/api";
import { cleanExpiredFiles } from "./services/fileService";

export async function createApp() {
  const app = express();

  app.use(express.json());

  // API Routes - All backend logic separated here
  app.use("/api", apiRouter);

  // Vite SSR Integration for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
    });
    app.use(vite.middlewares);

    app.use("*", async (req, res) => {
      try {
        let html = await vite.transformIndexHtml(
          req.originalUrl,
          `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FilePass26</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
        );
        res.status(200).set({ "Content-Type": "text/html" }).end(html);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        res.status(500).end(e.stack);
      }
    });
  } else {
    // Production: serve pre-built static files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  return app;
}

// Start background cleanup job every 10 seconds
setInterval(cleanExpiredFiles, 10000);
