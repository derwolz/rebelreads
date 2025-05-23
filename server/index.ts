import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations } from "./db-migrations";
import { runImpressionMigrations } from "./db-migrations-impressions";
import { runTrackingMigrations } from "./db-migrations-tracking";
import { Scheduler } from "./scheduler";

// Run database migrations before starting the server
(async () => {
  try {
    console.log("Running database migrations...");
    await runMigrations();
    // Run the new impression migrations
    await runImpressionMigrations();
    // Run the enhanced tracking migrations
    await runTrackingMigrations();
    console.log("Database migrations completed successfully");
  } catch (error) {
    console.error("Error running migrations:", error);
  }
})();

const app = express();
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));

// Increase the request size limit for large file uploads
app.use((req, res, next) => {
  // Set timeout to 10 minutes for large uploads
  req.setTimeout(600000); // 10 minutes in milliseconds
  res.setTimeout(600000); // Also set response timeout
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Set default content type header for API routes
  if (path.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json');
    
    // Ensure content type header is set for JSON responses
    const originalSend = res.send;
    res.send = function(body) {
      if (!res.headersSent && typeof body === 'object') {
        this.setHeader('Content-Type', 'application/json');
      }
      return originalSend.call(this, body);
    };
    
    // Check if the client is requesting JSON
    const acceptHeader = req.headers.accept || '';
    if (!acceptHeader.includes('application/json')) {
      // Add JSON as acceptable response type to prevent HTML fallback
      req.headers.accept = 'application/json, ' + acceptHeader;
    }
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    // Ensure content type is set to application/json for all json responses
    this.setHeader('Content-Type', 'application/json');
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // Set content type to application/json explicitly
    res.setHeader('Content-Type', 'application/json');
    
    // Log the error but don't rethrow it - that causes HTML error pages
    console.error("API Error:", { status, message, error: err });
    
    // Return a proper JSON response
    return res.status(status).json({ 
      error: message,
      status: status 
    });
    
    // REMOVED: throw err; - This was causing HTML error pages to be generated
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Start the scheduler for periodic tasks
    const scheduler = Scheduler.getInstance();
    scheduler.startAll();
    log("Scheduler started for periodic tasks including popular books calculation");
  });
})();