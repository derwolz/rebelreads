/**
 * Object Storage Routes
 * 
 * These routes handle serving files from the object storage
 * and provide endpoints for managing stored files.
 */
import { Router, Request, Response } from "express";
import { objectStorage } from "../services/object-storage";
import { sirenedImageBucket } from "../services/sirened-image-bucket";
import path from "path";

const router = Router();

/**
 * GET /api/storage/:key(*)
 * Serve a file from object storage
 */
router.get("/:key(*)", async (req: Request, res: Response) => {
  try {
    const storageKey = req.params.key;
    
    if (!storageKey) {
      return res.status(400).json({ error: "No storage key provided" });
    }
    
    // Get the file from object storage
    const file = await objectStorage.getFile(storageKey);
    
    if (!file) {
      return res.status(404).json({ error: "File not found" });
    }
    
    // Set content type based on file extension
    const ext = path.extname(storageKey).toLowerCase();
    let contentType = 'application/octet-stream'; // Default
    
    // Set appropriate content types for common file types
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.gif':
        contentType = 'image/gif';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.txt':
        contentType = 'text/plain';
        break;
    }
    
    // Set Cache-Control header for efficient caching
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
    
    // Send the file with the appropriate content type
    res.contentType(contentType);
    res.send(file);
    
  } catch (error) {
    console.error("Error serving file from object storage:", error);
    res.status(500).json({ error: "Failed to serve file" });
  }
});

export default router;