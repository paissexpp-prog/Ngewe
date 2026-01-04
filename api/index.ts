import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(express.json());

// API Routes
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", message: "Finance API is running" });
});

// Handle static files in production
// Note: Vercel will serve static files from the output directory automatically
// but this is kept for compatibility if needed.
const staticPath = path.resolve(__dirname, "..", "dist", "public");
app.use(express.static(staticPath));

// Export the app for Vercel Serverless Functions
export default app;
