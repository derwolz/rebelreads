/**
 * Test routes for object storage
 */
import { Router, Request, Response } from "express";
import { objectStorage } from "../services/object-storage";
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
    // Allow all file types for testing
    cb(null, true);
  }
});

/**
 * GET /api/test-upload
 * Simple HTML form to test uploads
 */
router.get("/", (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Object Storage Test</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        form { margin-bottom: 20px; border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
        input, button { margin: 10px 0; }
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
      <h1>Replit Object Storage Test</h1>
      
      <form action="/api/test-upload/upload" method="post" enctype="multipart/form-data">
        <h2>Upload Test</h2>
        <div>
          <label for="file">Select file to upload:</label>
          <input type="file" id="file" name="file" required>
        </div>
        <div>
          <label for="directory">Directory (optional):</label>
          <input type="text" id="directory" name="directory" placeholder="test" value="test">
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
          
          fetch('/api/test-upload/list')
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
          
          fetch(\`/api/test-upload/delete/\${encodeURIComponent(storageKey)}\`, {
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
 * POST /api/test-upload/upload
 * Upload a file to object storage
 */
router.post("/upload", upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Get directory from request, default to 'test'
    const directory = req.body.directory || 'test';
    
    // Upload to object storage
    const storageKey = await objectStorage.uploadFile(req.file, directory);
    
    // Get the public URL
    const publicUrl = objectStorage.getPublicUrl(storageKey);
    
    // Return success response
    res.json({
      success: true,
      message: "File uploaded successfully",
      storageKey,
      publicUrl
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

/**
 * GET /api/test-upload/list
 * List files in the test directory
 */
router.get("/list", async (req: Request, res: Response) => {
  try {
    // List files in the test directory
    const files = await objectStorage.listFiles('test');
    
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
 * DELETE /api/test-upload/delete/:key
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