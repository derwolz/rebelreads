/**
 * Test routes for book file uploads
 */
import express, { Request, Response } from "express";
import multer from "multer";
import { sirenedBookBucket } from "../services/sirened-book-bucket";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * GET /api/test-book-file
 * Simple HTML form to test book file uploads
 */
router.get("/", (req: Request, res: Response) => {
  res.send(`
    <html>
      <head>
        <title>Test Book File Upload</title>
        <style>
          body { font-family: sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          h1 { color: #333; }
          form { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          label { display: block; margin-bottom: 5px; font-weight: bold; }
          input, select { margin-bottom: 15px; padding: 8px; width: 100%; }
          button { background: #4CAF50; color: white; border: none; padding: 10px 15px; cursor: pointer; border-radius: 3px; }
          .result { background: #e0f7fa; padding: 15px; border-radius: 5px; white-space: pre-wrap; margin-top: 20px; }
          .file-list { background: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px; }
          .file-list li { margin-bottom: 10px; }
          .file-list button { background: #f44336; margin-left: 10px; padding: 5px 10px; }
        </style>
      </head>
      <body>
        <h1>Test Book File Upload</h1>
        <form action="/api/test-book-file/upload" method="post" enctype="multipart/form-data">
          <div>
            <label for="bookId">Book ID:</label>
            <input type="number" id="bookId" name="bookId" required min="1" value="1">
          </div>
          <div>
            <label for="formatType">Format Type:</label>
            <select id="formatType" name="formatType" required>
              <option value="softback">Softback</option>
              <option value="hardback">Hardback</option>
              <option value="digital">Digital</option>
              <option value="audiobook">Audiobook</option>
            </select>
          </div>
          <div>
            <label for="file">Select File:</label>
            <input type="file" id="file" name="file" required>
          </div>
          <button type="submit">Upload File</button>
        </form>

        <h2>List Book Files</h2>
        <form id="listForm">
          <div>
            <label for="listBookId">Book ID:</label>
            <input type="number" id="listBookId" name="listBookId" required min="1" value="1">
          </div>
          <button type="submit">List Files</button>
        </form>
        <div id="fileList" class="file-list"></div>

        <script>
          // JavaScript to handle the list form submission
          document.getElementById('listForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            const bookId = document.getElementById('listBookId').value;
            
            try {
              const response = await fetch(\`/api/test-book-file/list?bookId=\${bookId}\`);
              const data = await response.json();
              
              const fileListDiv = document.getElementById('fileList');
              if (data.length === 0) {
                fileListDiv.innerHTML = '<p>No files found for this book.</p>';
              } else {
                let html = '<ul>';
                data.forEach(file => {
                  html += \`
                    <li>
                      \${file}
                      <a href="/api/test-book-file/download?path=\${encodeURIComponent(file)}" target="_blank">Download</a>
                      <button onclick="deleteFile('\${file}')">Delete</button>
                    </li>
                  \`;
                });
                html += '</ul>';
                fileListDiv.innerHTML = html;
              }
            } catch (error) {
              console.error('Error:', error);
              alert('Error listing files: ' + error.message);
            }
          });

          // Function to delete a file
          async function deleteFile(path) {
            if (!confirm('Are you sure you want to delete this file?')) return;
            
            try {
              const response = await fetch(\`/api/test-book-file/delete/\${encodeURIComponent(path)}\`, {
                method: 'DELETE'
              });
              
              if (response.ok) {
                alert('File deleted successfully!');
                // Refresh the file list
                document.getElementById('listForm').dispatchEvent(new Event('submit'));
              } else {
                const data = await response.json();
                alert('Error: ' + data.error);
              }
            } catch (error) {
              console.error('Error:', error);
              alert('Error deleting file: ' + error.message);
            }
          }
        </script>
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
    const { bookId, formatType } = req.body;
    const file = req.file;

    if (!bookId || !formatType || !file) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Upload the file to object storage
    const filePath = await sirenedBookBucket.uploadBookFile(
      parseInt(bookId),
      formatType,
      file
    );

    res.json({
      success: true,
      message: "File uploaded successfully",
      filePath
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ 
      error: "Failed to upload file", 
      details: (error as Error).message 
    });
  }
});

/**
 * GET /api/test-book-file/list
 * List book files
 */
router.get("/list", async (req: Request, res: Response) => {
  try {
    const bookId = req.query.bookId;

    if (!bookId) {
      return res.status(400).json({ error: "Book ID is required" });
    }

    // List files for the book
    const files = await sirenedBookBucket.listBookFiles(parseInt(bookId as string));

    res.json(files);
  } catch (error) {
    console.error("Error listing files:", error);
    res.status(500).json({ 
      error: "Failed to list files", 
      details: (error as Error).message 
    });
  }
});

/**
 * GET /api/test-book-file/download
 * Download a book file
 */
router.get("/download", async (req: Request, res: Response) => {
  try {
    const path = req.query.path as string;

    if (!path) {
      return res.status(400).json({ error: "File path is required" });
    }

    // Get the file from storage
    const { data, contentType } = await sirenedBookBucket.getBookFile(path);

    // Set content type and disposition
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${path.split('/').pop()}"`);
    
    // Send the file
    res.send(data);
  } catch (error) {
    console.error("Error downloading file:", error);
    res.status(500).json({ 
      error: "Failed to download file", 
      details: (error as Error).message 
    });
  }
});

/**
 * DELETE /api/test-book-file/delete/:key
 * Delete a book file from storage
 */
router.delete("/delete/:key(*)", async (req: Request, res: Response) => {
  try {
    const path = req.params.key;

    if (!path) {
      return res.status(400).json({ error: "File path is required" });
    }

    // Delete the file
    await sirenedBookBucket.deleteBookFile(path);

    res.json({
      success: true,
      message: "File deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ 
      error: "Failed to delete file", 
      details: (error as Error).message 
    });
  }
});

export default router;