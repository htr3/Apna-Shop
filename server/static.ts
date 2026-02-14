import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function serveStatic(app: Express) {
  // Point to dist/public where built frontend is located
  const distPath = path.resolve(__dirname, "../dist/public");
  if (!fs.existsSync(distPath)) {
    console.warn(
      `Build directory not found: ${distPath}. Frontend will not be served. Make sure to run: npm run build:client`,
    );
    return;
  }

  // Serve static files (CSS, JS, images, etc.)
  app.use(express.static(distPath));

  // Fall through to index.html for SPA routing (all non-API routes)
  // This must come AFTER all API routes are registered in routes.ts
  app.get(/^(?!\/api).*$/, (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

