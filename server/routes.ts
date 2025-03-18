import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { setupAuth } from "./auth";
import { dbStorage } from "./storage";

// Import route modules
import landingRoutes from "./routes/landing-routes";
import accountRoutes from "./routes/account-routes";
import proRoutes from "./routes/pro-routes";
import homeRoutes from "./routes/home-routes";
import searchRoutes from "./routes/search-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication
  setupAuth(app);

  // Configure file uploads path
  app.use("/uploads", express.static("uploads"));

  // Register all route modules
  app.use("/api/landing", landingRoutes);
  app.use("/api", accountRoutes);
  app.use("/api/pro", proRoutes);
  app.use("/api", homeRoutes);
  app.use("/api/search", searchRoutes);

  const httpServer = createServer(app);
  return httpServer;
}