import { createApp } from "./backend/app";

const PORT = 3000;

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
  