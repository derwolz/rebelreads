/**
 * Test routes for book file uploads
 */
import { Router, Request, Response } from "express";
import { sirenedBookBucket } from "../services/sirened-book-bucket";
import multer from "multer";
import path from "path";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

/**
 * GET /api/test-book-file
 * Simple HTML form to test book file uploads
 */
router.get("/", (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Book File Upload Test</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        form { margin-bottom: 20px; border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
        input, button, select { margin: 10px 0; display: block; }
        button { padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background-color: #45a049; }
        .result { background-color: #f8f8f8; padding: 20px; border-radius: 5px; white-space: pre-wrap; }
        .uploaded-files { margin-top: 20px; }
        .file-item { padding: 10px; border-bottom: 1px solid #eee; }
        .file-item a { color: #0066cc; text-decoration: none; }
        .file-item a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <h1>Book File Upload Test</h1>
      
      <form action="/api/test-book-file/upload" method="post" enctype="multipart/form-data">
        <h2>Upload Test</h2>
        <div>
          <label for="file">Select book file to upload:</label>
          <input type="file" id="file" name="file" required>
        </div>
        <div>
          <label for="formatType">Format Type:</label>
          <select id="formatType" name="formatType">
            <option value="digital">Digital (PDF, EPUB, MOBI)</option>
            <option value="audiobook">Audiobook</option>
            <option value="softback">Softback</option>
            <option value="hardback">Hardback</option>
          </select>
        </div>
        <div>
          <label for="bookId">Book ID (optional):</label>
          <input type="number" id="bookId" name="bookId">
        </div>
        <button type="submit">Upload</button>
      </form>
      
      <h2>List Book Files</h2>
      <form action="/api/test-book-file/list" method="get">
        <div>
          <label for="listFormatType">Format Type:</label>
          <select id="listFormatType" name="formatType">
            <option value="digital">Digital</option>
            <option value="audiobook">Audiobook</option>
            <option value="softback">Softback</option>
            <option value="hardback">Hardback</option>
          </select>
        </div>
        <div>
          <label for="listBookId">Book ID (optional):</label>
          <input type="number" id="listBookId" name="bookId">
        </div>
        <button type="submit">List Files</button>
      </form>
      
      <div class="uploaded-files">
        <h2>Book Files</h2>
        <p>Click "List Files" above to see uploaded book files.</p>
      </div>
    </body>
    </html>
  `);
});

/**
 * POST /api/test-book-file/upload
 * Upload a book file using sirenedBookBucket
 */
router.post("/upload", upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Get format type from form
    const formatType = req.body.formatType || 'digital';
    
    // Get optional book ID
    const bookId = req.body.bookId ? parseInt(req.body.bookId) : undefined;
    
    // Upload using sirenedBookBucket
    const storageKey = await sirenedBookBucket.uploadBookFile(req.file, formatType, bookId);
    
    // Get the public URL
    const publicUrl = sirenedBookBucket.getPublicUrl(storageKey);
    
    // Return success response
    res.json({
      success: true,
      message: "Book file uploaded successfully",
      storageKey,
      publicUrl
    });
  } catch (error: any) {
    console.error("Error uploading book file:", error);
    res.status(500).json({ error: "Failed to upload book file", message: error.message });
  }
});

/**
 * GET /api/test-book-file/list
 * List book files
 */
router.get("/list", async (req: Request, res: Response) => {
  try {
    // Get format type from query
    const formatType = req.query.formatType as any || 'digital';
    
    // Get optional book ID
    const bookId = req.query.bookId ? parseInt(req.query.bookId as string) : undefined;
    
    // List files using sirenedBookBucket
    const files = await sirenedBookBucket.listBookFiles(formatType, bookId);
    
    // Return the list of files
    res.json({
      success: true,
      files,
      baseUrl: '/api/storage'
    });
  } catch (error: any) {
    console.error("Error listing files:", error);
    res.status(500).json({ error: "Failed to list files", message: error.message });
  }
});

/**
 * DELETE /api/test-book-file/delete/:key
 * Delete a book file from storage
 */
router.delete("/delete/:key(*)", async (req: Request, res: Response) => {
  try {
    const storageKey = req.params.key;
    
    if (!storageKey) {
      return res.status(400).json({ error: "No storage key provided" });
    }
    
    // Delete the file using sirenedBookBucket
    const success = await sirenedBookBucket.deleteBookFile(storageKey);
    
    if (success) {
      res.json({
        success: true,
        message: "File deleted successfully",
        storageKey
      });
    } else {
      res.status(404).json({
        success: false,
        message: "File not found or could not be deleted",
        storageKey
      });
    }
  } catch (error: any) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file", message: error.message });
  }
});

export default router;