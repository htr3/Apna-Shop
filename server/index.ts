import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes.js";
import { serveStatic } from "./static.js";
import { createServer } from "http";
import { schedulerService } from "./services/schedulerService.js";
import { seedUsers } from "./db.js";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

// Add health check endpoint for Cloud Run
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Startup sequence - start server quickly, initialize in background
async function startServer() {
  try {
    // Set up error middleware immediately
    app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      console.error("Internal Server Error:", err);

      if (res.headersSent) {
        return next(err);
      }

      return res.status(status).json({ message });
    });

    // Setup frontend serving immediately (important for production)
    if (process.env.NODE_ENV === "production") {
      log("Setting up static file serving for production...");
      serveStatic(app);
    } else {
      log("Setting up Vite in development mode...");
      const { setupVite } = await import("./vite.js");
      await setupVite(httpServer, app);
    }

    log("Routes and middleware registered");
  } catch (error) {
    log(`ERROR during sync initialization: ${error instanceof Error ? error.message : String(error)}`, "error");
    console.error("Full error details:", error);
    throw error;
  }

  // Start server listening immediately
  const port = parseInt(process.env.PORT || "3000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
    },
    () => {
      log(`✓ Server is running on port ${port}`);
      log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
    },
  );

  // Run database initialization in background (don't block server startup)
  (async () => {
    try {
      log("Initializing database connection in background...");

      // Add timeout for database initialization (30 seconds max)
      const dbInitTimeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Database initialization timeout after 30 seconds")), 30000)
      );

      await Promise.race([seedUsers(), dbInitTimeout]);
      log("Database initialized successfully");

      // Register dynamic API routes after database is ready
      log("Registering API routes...");
      await registerRoutes(httpServer, app);
      log("API routes registered successfully");

      // Start scheduled jobs for reminders
      log("Starting scheduler service...");
      schedulerService.startAll();
      log("Scheduler service started");

      log("✓ Full server initialization complete");

    } catch (error) {
      log(`WARNING: Background initialization error: ${error instanceof Error ? error.message : String(error)}`, "warn");
      console.error("Full error details:", error);
      log("Server is still running, some features may not be available");
    }
  })();
}

// Start the server
startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
