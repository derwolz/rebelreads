import { Router, Request, Response } from "express";
import { objectStorage } from "../services/object-storage";
import path from "path";

const router = Router();

/**
 * GET /api/storage/:dir/:filename
 * Serves files from the object storage
 */
router.get("/:directory/:filename", async (req: Request, res: Response) => {
  try {
    const directory = req.params.directory;
    const filename = req.params.filename;
    const storageKey = `${directory}/${filename}`;
    
    // Get the file from object storage
    const fileBuffer = await objectStorage.getFile(storageKey);
    
    if (!fileBuffer) {
      return res.status(404).json({ error: "File not found" });
    }
    
    // Set appropriate content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    const contentType = getContentType(ext);
    
    // Set headers and send the file
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
    res.send(fileBuffer);
  } catch (error) {
    console.error("Error serving file from object storage:", error);
    res.status(500).json({ error: "Failed to serve file" });
  }
});

/**
 * Helper function to get content type from file extension
 */
function getContentType(extension: string): string {
  const contentTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.pdf': 'application/pdf',
    '.json': 'application/json',
    '.txt': 'text/plain',
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
  };
  
  return contentTypes[extension] || 'application/octet-stream';
}

export default router;