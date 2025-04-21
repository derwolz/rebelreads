import { Router, Request, Response } from "express";
import { objectStorage } from "../services/object-storage";
import path from "path";

const router = Router();

/**
 * GET /api/storage/:key
 * Serve files from object storage
 * Public endpoint - no authentication required
 */
router.get("/:key(*)", async (req: Request, res: Response) => {
  try {
    const key = req.params.key;
    
    if (!key) {
      return res.status(400).json({ error: "Storage key is required" });
    }
    
    // Make sure we're not trying to access anything outside the storage directories
    if (key.includes("../") || key.includes("..\\")) {
      return res.status(400).json({ error: "Invalid storage key" });
    }
    
    // Serve the file based on the storage key
    const result = await objectStorage.getFile(key);
    
    if (!result) {
      return res.status(404).json({ error: "File not found" });
    }
    
    const { contentType, stream } = result;
    
    // Set appropriate content type
    res.setHeader("Content-Type", contentType);
    
    // Set cache headers for better performance
    res.setHeader("Cache-Control", "public, max-age=31536000"); // 1 year
    
    // Stream the file to the response
    stream.pipe(res);
  } catch (error) {
    console.error("Error serving file from object storage:", error);
    
    if (error instanceof Error && error.message.includes("not found")) {
      return res.status(404).json({ error: "File not found" });
    }
    
    res.status(500).json({ error: "Failed to serve file from storage" });
  }
});

export default router;