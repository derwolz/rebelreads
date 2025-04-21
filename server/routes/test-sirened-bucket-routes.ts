/**
 * Test routes for Sirened Image Bucket
 * 
 * These routes allow testing the SirenedImageBucket service
 * with the @replit/object-storage implementation.
 */
import { Router, Request, Response } from "express";
import { sirenedImageBucket } from "../services/sirened-image-bucket";
import multer from "multer";
import path from "path";

const router = Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * GET /api/test-sirened-bucket
 * Simple HTML form to test Sirened Image Bucket
 */
router.get("/", (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sirened Image Bucket Test</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        section { margin-bottom: 40px; }
        form { margin-bottom: 20px; border: 1px solid #ddd; padding: 20px; border-radius: 5px; }
        input, button, select { margin: 10px 0; }
        button { padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background-color: #45a049; }
        .result { background-color: #f8f8f8; padding: 20px; border-radius: 5px; white-space: pre-wrap; }
        .uploaded-files { margin-top: 20px; }
        .file-item { padding: 10px; border-bottom: 1px solid #eee; display: flex; align-items: center; }
        .file-item img { max-width: 100px; max-height: 100px; margin-right: 20px; }
        .file-item a { color: #0066cc; text-decoration: none; }
        .file-item a:hover { text-decoration: underline; }
        .file-info { flex: 1; }
        .file-actions { display: flex; gap: 10px; }
      </style>
    </head>
    <body>
      <h1>Sirened Image Bucket Test</h1>
      
      <section>
        <h2>Upload Book Image</h2>
        <form action="/api/test-sirened-bucket/upload-book" method="post" enctype="multipart/form-data">
          <div>
            <label for="image">Select image to upload:</label>
            <input type="file" id="image" name="image" accept="image/*" required>
          </div>
          <div>
            <label for="imageType">Image Type:</label>
            <select id="imageType" name="imageType">
              <option value="book-detail">Book Detail</option>
              <option value="book-thumbnail">Book Thumbnail</option>
              <option value="book-banner">Book Banner</option>
              <option value="author-avatar">Author Avatar</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label for="bookId">Book ID (optional):</label>
            <input type="number" id="bookId" name="bookId">
          </div>
          <button type="submit">Upload</button>
        </form>
      </section>
      
      <section>
        <h2>Upload Profile Image</h2>
        <form action="/api/test-sirened-bucket/upload-profile" method="post" enctype="multipart/form-data">
          <div>
            <label for="profileImage">Select profile image:</label>
            <input type="file" id="profileImage" name="image" accept="image/*" required>
          </div>
          <div>
            <label for="userId">User ID:</label>
            <input type="number" id="userId" name="userId" required>
          </div>
          <button type="submit">Upload</button>
        </form>
      </section>
      
      <section>
        <h2>List Images by Type</h2>
        <form action="/api/test-sirened-bucket/list" method="get">
          <div>
            <label for="listImageType">Image Type:</label>
            <select id="listImageType" name="imageType">
              <option value="book-detail">Book Detail</option>
              <option value="book-thumbnail">Book Thumbnail</option>
              <option value="book-banner">Book Banner</option>
              <option value="author-avatar">Author Avatar</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div>
            <label for="listBookId">Book ID (optional):</label>
            <input type="number" id="listBookId" name="bookId">
          </div>
          <button type="submit">List Images</button>
        </form>
        
        <div id="image-results" class="uploaded-files">
          <!-- Image results will be loaded here -->
        </div>
      </section>
      
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          // Get the list form and results container
          const listForm = document.querySelector('form[action="/api/test-sirened-bucket/list"]');
          const resultsContainer = document.getElementById('image-results');
          
          // Handle list form submission
          listForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const imageType = this.elements.imageType.value;
            const bookId = this.elements.bookId.value;
            
            // Build URL
            let url = '/api/test-sirened-bucket/list?imageType=' + encodeURIComponent(imageType);
            if (bookId) {
              url += '&bookId=' + encodeURIComponent(bookId);
            }
            
            // Fetch the list
            fetch(url)
              .then(response => response.json())
              .then(data => {
                // Clear the results container
                resultsContainer.innerHTML = '';
                
                if (data.files && data.files.length > 0) {
                  // Create a heading
                  const heading = document.createElement('h3');
                  heading.textContent = 'Found ' + data.files.length + ' image(s)';
                  resultsContainer.appendChild(heading);
                  
                  // Create an item for each file
                  data.files.forEach(file => {
                    const item = document.createElement('div');
                    item.className = 'file-item';
                    
                    // Create thumbnail if it's an image
                    const img = document.createElement('img');
                    img.src = data.baseUrl + '/' + file;
                    img.alt = file;
                    item.appendChild(img);
                    
                    // Create file info
                    const info = document.createElement('div');
                    info.className = 'file-info';
                    
                    // Create file name display
                    const name = document.createElement('div');
                    name.textContent = file;
                    info.appendChild(name);
                    
                    // Create link to the file
                    const link = document.createElement('a');
                    link.href = data.baseUrl + '/' + file;
                    link.textContent = 'View full image';
                    link.target = '_blank';
                    info.appendChild(link);
                    
                    item.appendChild(info);
                    
                    // Create actions
                    const actions = document.createElement('div');
                    actions.className = 'file-actions';
                    
                    // Create delete button
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.onclick = function() {
                      if (confirm('Are you sure you want to delete this file?')) {
                        fetch('/api/test-sirened-bucket/delete/' + encodeURIComponent(file), {
                          method: 'DELETE'
                        })
                        .then(response => response.json())
                        .then(result => {
                          if (result.success) {
                            item.remove();
                          } else {
                            alert('Failed to delete file: ' + result.message);
                          }
                        })
                        .catch(error => {
                          console.error('Error deleting file:', error);
                          alert('An error occurred while deleting the file');
                        });
                      }
                    };
                    actions.appendChild(deleteButton);
                    
                    item.appendChild(actions);
                    
                    resultsContainer.appendChild(item);
                  });
                } else {
                  // No files found
                  const message = document.createElement('p');
                  message.textContent = 'No images found.';
                  resultsContainer.appendChild(message);
                }
              })
              .catch(error => {
                console.error('Error listing files:', error);
                resultsContainer.innerHTML = '<p>Error listing files: ' + error.message + '</p>';
              });
          });
        });
      </script>
    </body>
    </html>
  `);
});

/**
 * POST /api/test-sirened-bucket/upload-book
 * Upload a book image using SirenedImageBucket
 */
router.post("/upload-book", upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Get image type from form
    const imageType = req.body.imageType as any || 'book-detail';
    
    // Get optional book ID
    const bookId = req.body.bookId ? parseInt(req.body.bookId) : undefined;
    
    // Upload using sirenedImageBucket
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
  } catch (error: any) {
    console.error("Error uploading book image:", error);
    res.status(500).json({ error: "Failed to upload book image", message: error.message });
  }
});

/**
 * POST /api/test-sirened-bucket/upload-profile
 * Upload a profile image using SirenedImageBucket
 */
router.post("/upload-profile", upload.single('image'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    
    // Get user ID
    if (!req.body.userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    const userId = parseInt(req.body.userId);
    
    // Upload using sirenedImageBucket
    const storageKey = await sirenedImageBucket.uploadProfileImage(req.file, userId);
    
    // Get the public URL
    const publicUrl = sirenedImageBucket.getPublicUrl(storageKey);
    
    // Return success response
    res.json({
      success: true,
      message: "Profile image uploaded successfully",
      storageKey,
      publicUrl
    });
  } catch (error: any) {
    console.error("Error uploading profile image:", error);
    res.status(500).json({ error: "Failed to upload profile image", message: error.message });
  }
});

/**
 * GET /api/test-sirened-bucket/list
 * List files based on image type and optional book ID
 */
router.get("/list", async (req: Request, res: Response) => {
  try {
    // Get image type from query
    const imageType = req.query.imageType as any || 'book-detail';
    
    // Get optional book ID
    const bookId = req.query.bookId ? parseInt(req.query.bookId as string) : undefined;
    
    // List files using sirenedImageBucket
    const files = await sirenedImageBucket.listImages(imageType, bookId);
    
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
 * DELETE /api/test-sirened-bucket/delete/:key
 * Delete a file from storage
 */
router.delete("/delete/:key(*)", async (req: Request, res: Response) => {
  try {
    const storageKey = req.params.key;
    
    if (!storageKey) {
      return res.status(400).json({ error: "No storage key provided" });
    }
    
    // Delete the file using sirenedImageBucket
    const success = await sirenedImageBucket.deleteImage(storageKey);
    
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