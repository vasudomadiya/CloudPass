import { createApp } from "./backend/app";
import fs from "fs";
import path from "path";

// Ensure required directories and files exist
const uploadsDir = path.join(process.cwd(), "uploads");
const dbFile = path.join(process.cwd(), "db.json");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(dbFile)) fs.writeFileSync(dbFile, "[]", "utf8");

const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = await createApp();

  app.listen(PORT, "0.0.0.0", () => {
    console.log(
      `FilePass26 backend server running on http://localhost:${PORT}`,
    );
    console.log("Backend separated from client - no conflicts!");
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
