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
import genreRoutes from "./routes/genre-routes";
import homepageRoutes from "./routes/homepage-routes";
import bookCollectionsRoutes from "./routes/book-collections-routes";
import popularBooksRoutes from "./routes/popular-books-routes";
import feedbackRoutes from "./routes/feedback-routes";
import salesRoutes from "./routes/sales-routes";
import catalogueRoutes from "./routes/catalogue-routes";
import publisherRoutes from "./routes/publisher-routes";
import catalogueAuthorsRoutes from "./routes/catalogue-routes-authors";
import cataloguePublisherRoutes from "./routes/catalogue-routes-publisher";
import cataloguePublisherAuthorsRoutes from "./routes/catalogue-routes-publisher-authors";
import cataloguePublisherBooksRoutes from "./routes/catalogue-routes-publisher-books";
import filterRoutes from "./routes/filter-routes";
import simpleApiRoutes from "./routes/simple-api";
import debugRoutes from "./routes/debug-routes";
import publicAuthorRoutes from "./routes/public-author-routes";
import discoverRoutes from "./routes/discover-routes";
import shelfRoutes from "./routes/shelf-routes";
import { registerContentReportsRoutes } from "./routes/content-reports-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Configure file uploads path (public before auth)
  app.use("/uploads", express.static("uploads"));
  
  // Special debug routes that bypass security checks for diagnostic purposes
  // These must be registered BEFORE authentication
  app.use("/api/system-debug", debugRoutes);
  
  // Block all debug endpoints to prevent unauthorized data access
  app.all('/api/debug/*', (req, res, next) => {
    console.warn(`Blocked access attempt to debug endpoint: ${req.path}`);
    return res.status(403).json({ 
      error: "Access denied",
      message: "Debug endpoints have been disabled for security reasons" 
    });
  });
  
  // Register public routes BEFORE auth to make them available without authentication
  app.use("/api/public", publicAuthorRoutes);
  
  // Setup authentication
  setupAuth(app);

  // Register this simple API route first to ensure it takes precedence for certain endpoints
  app.use("/api", simpleApiRoutes);
  
  // Register authenticated route modules
  app.use("/api/landing", landingRoutes);
  app.use("/api", accountRoutes);
  app.use("/api/pro", proRoutes);
  app.use("/api", homeRoutes);
  app.use("/api/search", searchRoutes);
  app.use("/api/ads", adsRoutes);
  app.use("/api/author-analytics", authorAnalyticsRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/beta", betaRoutes);
  app.use("/api/genres", genreRoutes);
  app.use("/api/homepage-layout", homepageRoutes);
  app.use("/api/recommendations", bookCollectionsRoutes);
  app.use("/api/popular-books", popularBooksRoutes);
  app.use("/api/feedback", feedbackRoutes);
  // Register the public verification endpoint before authentication middlewares
  app.get("/api/public/verify-seller-code/:code", async (req, res) => {
    try {
      const code = req.params.code;

      if (!code) {
        return res.status(400).json({ error: "Verification code is required" });
      }

      // Get the seller information from the verification code
      const sellerInfo = await dbStorage.getSellerDetailsByVerificationCode(code);

      if (!sellerInfo) {
        return res.status(404).json({ error: "Invalid verification code" });
      }

      // Don't expose seller's notes to public, just return necessary info
      return res.json({
        valid: true,
        seller: {
          name: sellerInfo.name,
          company: sellerInfo.company,
          status: sellerInfo.status
        }
      });
    } catch (error) {
      console.error("Error verifying code:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
  
  // Regular authenticated sales routes
  app.use("/api/sales", salesRoutes);
  
  // Register authenticated catalogue routes
  app.use("/api/catalogue", catalogueRoutes);
  app.use("/api/catalogue/authors", catalogueAuthorsRoutes);
  app.use("/api/catalogue/publisher", cataloguePublisherRoutes);
  app.use("/api/catalogue/publishers/authors", cataloguePublisherAuthorsRoutes);
  app.use("/api/catalogue/publishers/books", cataloguePublisherBooksRoutes);
  
  // Register publisher routes
  app.use("/api/publishers", publisherRoutes);
  
  // Register content filter routes
  app.use("/api/filters", filterRoutes);
  
  // Register discover routes for taxonomy-based search
  app.use("/api/discover", discoverRoutes);
  
  // Register bookshelf and notes routes
  app.use("/", shelfRoutes);
  
  // Register content reports routes directly
  registerContentReportsRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}