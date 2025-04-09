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
import adsRoutes from "./routes/ads-routes";
import authorAnalyticsRoutes from "./routes/author-analytics-routes";
import adminRoutes from "./routes/admin-routes";
import betaRoutes from "./routes/beta-routes";
import testAuthRoutes from "./routes/test-auth-routes";

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
  app.use("/api/ads", adsRoutes);
  app.use("/api/author-analytics", authorAnalyticsRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/beta", betaRoutes);
  app.use("/api/test-auth", testAuthRoutes);

  const httpServer = createServer(app);
  return httpServer;
}