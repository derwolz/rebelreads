import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { runMigrations } from "./db-migrations";
import { Scheduler } from "./scheduler";

// Run database migrations before starting the server
(async () => {
  try {
    await runMigrations();
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

  // Add a more specific error handler for API routes
  app.use('/api/*', (req: Request, res: Response, next: NextFunction) => {
    // If we get this far with an API request, the route doesn't exist
    // or wasn't properly handled by any middleware
    if (!res.headersSent) {
      console.warn(`API route not found: ${req.method} ${req.path}`);
      return res.status(404).json({ 
        error: "API endpoint not found", 
        path: req.path
      });
    }
    next();
  });

  // General error handler for all routes
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // If it's an API route, always return JSON
    if (req.path.startsWith('/api/')) {
      console.error(`API error at ${req.path}:`, err);
      return res.status(status).json({ 
        error: message,
        path: req.path
      });
    }
    
    // For non-API routes, proceed with normal error handling
    res.status(status).json({ message });
    throw err;
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