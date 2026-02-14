import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createServer } from "http";
import express from "express";
import { registerRoutes } from "../../server/routes.js";
import { serveStatic } from "../../server/static.js";
import { seedUsers } from "../../server/db.js";

let appInstance: any = null;

async function initializeApp() {
  if (appInstance) return appInstance;

  const app = express();
  const httpServer = createServer(app);

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Seed users on startup
  await seedUsers();

  // Register all routes
  await registerRoutes(httpServer, app);

  // Serve static files in production
  serveStatic(app);

  appInstance = app;
  return app;
}

export default async (req: VercelRequest, res: VercelResponse) => {
  const app = await initializeApp();
  app(req, res);
};

