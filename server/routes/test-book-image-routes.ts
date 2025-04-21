/**
 * Test routes for book image uploads using Replit Object Storage
 */
import { Router, Request, Response } from "express";
import { objectStorage } from "../services/object-storage";
import { sirenedImageBucket } from "../services/sirened-image-bucket";
import multer from "multer";
import path from "path";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB size limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

/**
 * GET /api/test-book-image
 * Simple HTML form to test book image uploads
 */
router.get("/", (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Book Image Upload Test</title>
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
      <h1>Book Image Upload Test</h1>
      
      <form action="/api/test-book-image/upload" method="post" enctype="multipart/form-data">
        <h2>Upload Test</h2>
        <div>
          <label for="image">Select image file to upload:</label>
          <input type="file" id="image" name="image" required>
        </div>
        <div>
          <label for="imageType">Image Type:</label>
          <select id="imageType" name="imageType">
            <option value="book-detail">Book Detail (480x600)</option>
            <option value="book-card">Book Card (256x440)</option>
            <option value="background">Background (1300x1500)</option>
            <option value="grid-item">Grid Item (56x212)</option>
            <option value="mini">Mini (48x64)</option>
            <option value="hero">Hero (1500x600)</option>
          </select>
        </div>
        <div>
          <label for="bookId">Book ID (optional):</label>
          <input type="text" id="bookId" name="bookId" placeholder="Leave empty for general folder">
        </div>
        <button type="submit">Upload</button>
      </form>
      
      <div>
        <h2>Uploaded Files</h2>
        <button onclick="listFiles()">Refresh File List</button>
        <div id="file-list" class="uploaded-files">
          Loading...
        </div>
      </div>
      
      <script>
        // Load the file list on page load
        document.addEventListener('DOMContentLoaded', listFiles);
        
        function listFiles() {
          const fileList = document.getElementById('file-list');
          fileList.innerHTML = 'Loading...';
          
          fetch('/api/test-book-image/list')
            .then(response => response.json())
            .then(data => {
              if (data.files && data.files.length > 0) {
                fileList.innerHTML = data.files.map(file => {
                  return \`<div class="file-item">
                    <div>File: <strong>\${file}</strong></div>
                    <div>
                      <a href="\${data.baseUrl}/\${file}" target="_blank">View File</a> | 
                      <a href="#" onclick="deleteFile('\${file}'); return false;">Delete</a>
                    </div>
                  </div>\`;
                }).join('');
              } else {
                fileList.innerHTML = '<p>No files found.</p>';
              }
            })
            .catch(error => {
              fileList.innerHTML = '<p>Error loading files: ' + error.message + '</p>';
            });
        }
        
        function deleteFile(storageKey) {
          if (!confirm('Are you sure you want to delete this file?')) {
            return;
          }
          
          fetch(\`/api/test-book-image/delete/\${encodeURIComponent(storageKey)}\`, {
            method: 'DELETE'
          })
            .then(response => response.json())
            .then(data => {
              alert(data.message);
              listFiles();
            })
            .catch(error => {
              alert('Error deleting file: ' + error.message);
            });
        }
      </script>
    </body>
    </html>
  `);
});

/**
 * POST /api/test-book-image/upload
 * Upload a book image using sirenedImageBucket
 */
router.post("/upload", upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Get image type from form
    const imageType = req.body.imageType || 'book-detail';
    
    // Get optional book ID
    const bookId = req.body.bookId ? parseInt(req.body.bookId) : undefined;
    
    // Upload using sirenedImageBucket (which uses our updated objectStorage)
    const storageKey = await sirenedImageBucket.uploadBookImage(req.file, imageType, bookId);
    
    // Get the public URL
    const publicUrl = sirenedImageBucket.getPublicUrl(storageKey);
    
    // Return success response
    res.json({
      success: true,
      message: "Book image uploaded successfully",
      storageKey,
      publicUrl
    });
  } catch (error) {
    console.error("Error uploading book image:", error);
    res.status(500).json({ error: "Failed to upload book image" });
  }
});

/**
 * GET /api/test-book-image/list
 * List files in the covers directory
 */
router.get("/list", async (req: Request, res: Response) => {
  try {
    // List files in the covers directory
    const files = await objectStorage.listFiles('covers');
    
    // Return the list of files
    res.json({
      success: true,
      files,
      baseUrl: '/api/storage'
    });
  } catch (error) {
    console.error("Error listing files:", error);
    res.status(500).json({ error: "Failed to list files" });
  }
});

/**
 * DELETE /api/test-book-image/delete/:key
 * Delete a file from object storage
 */
router.delete("/delete/:key(*)", async (req: Request, res: Response) => {
  try {
    const storageKey = req.params.key;
    
    if (!storageKey) {
      return res.status(400).json({ error: "No storage key provided" });
    }
    
    // Delete the file
    const success = await objectStorage.deleteFile(storageKey);
    
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
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ error: "Failed to delete file" });
  }
});

export default router;