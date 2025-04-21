/**
 * Test routes for book file uploads
 */
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { sirenedBookBucket } from '../services/sirened-book-bucket';

const router = Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

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
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          form { margin-bottom: 30px; padding: 20px; border: 1px solid #ddd; border-radius: 5px; }
          input, select, button { margin: 10px 0; padding: 8px; }
          button { cursor: pointer; background: #4285f4; color: white; border: none; border-radius: 4px; }
          h3 { margin-top: 30px; }
          ul { list-style-type: none; padding: 0; }
          li { margin: 10px 0; padding: 10px; border: 1px solid #eee; border-radius: 4px; }
          .actions { display: flex; gap: 10px; }
          .delete-btn { background: #ea4335; }
        </style>
      </head>
      <body>
        <h1>Test Book File Upload</h1>
        
        <form action="/api/test-book-file/upload" method="post" enctype="multipart/form-data">
          <h2>Upload Book File</h2>
          <div>
            <label for="bookId">Book ID:</label>
            <input type="number" id="bookId" name="bookId" required value="1">
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
            <label for="file">File:</label>
            <input type="file" id="file" name="file" required>
          </div>
          <button type="submit">Upload</button>
        </form>

        <h3>List Book Files</h3>
        <form action="/api/test-book-file/list" method="get">
          <div>
            <label for="listBookId">Book ID:</label>
            <input type="number" id="listBookId" name="bookId" required value="1">
          </div>
          <button type="submit">List Files</button>
        </form>

        <div id="file-list">
          <!-- File list will be populated via AJAX -->
        </div>

        <script>
          document.addEventListener('DOMContentLoaded', function() {
            // Load the file list on page load
            const bookId = document.getElementById('listBookId').value;
            loadFileList(bookId);

            // Handle list form submission via AJAX
            document.querySelector('form[action="/api/test-book-file/list"]').addEventListener('submit', function(e) {
              e.preventDefault();
              const bookId = document.getElementById('listBookId').value;
              loadFileList(bookId);
            });

            // Function to load file list
            function loadFileList(bookId) {
              fetch('/api/test-book-file/list?bookId=' + bookId)
                .then(response => response.json())
                .then(data => {
                  const fileList = document.getElementById('file-list');
                  fileList.innerHTML = '<h3>Files for Book ID: ' + bookId + '</h3>';
                  
                  if (data.length === 0) {
                    fileList.innerHTML += '<p>No files found.</p>';
                    return;
                  }
                  
                  const ul = document.createElement('ul');
                  data.forEach(file => {
                    const li = document.createElement('li');
                    li.innerHTML = \`
                      <div><strong>Path:</strong> \${file}</div>
                      <div class="actions">
                        <a href="/api/test-book-file/download?path=\${encodeURIComponent(file)}" target="_blank">
                          <button>Download</button>
                        </a>
                        <button class="delete-btn" onclick="deleteFile('\${file}')">Delete</button>
                      </div>
                    \`;
                    ul.appendChild(li);
                  });
                  fileList.appendChild(ul);
                })
                .catch(error => {
                  console.error('Error loading file list:', error);
                  document.getElementById('file-list').innerHTML = '<p>Error loading file list.</p>';
                });
            }

            // Add global function for delete
            window.deleteFile = function(path) {
              if (confirm('Are you sure you want to delete this file?')) {
                fetch('/api/test-book-file/delete/' + encodeURIComponent(path), {
                  method: 'DELETE'
                })
                .then(response => response.json())
                .then(data => {
                  alert(data.message);
                  // Reload file list after deletion
                  const bookId = document.getElementById('listBookId').value;
                  loadFileList(bookId);
                })
                .catch(error => {
                  console.error('Error deleting file:', error);
                  alert('Error deleting file.');
                });
              }
            };
          });
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

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (!bookId || !formatType) {
      return res.status(400).json({ error: 'Book ID and format type are required' });
    }

    // Upload file to object storage
    const path = await sirenedBookBucket.uploadBookFile(
      parseInt(bookId),
      formatType,
      {
        fieldname: file.fieldname,
        originalname: file.originalname,
        encoding: file.encoding, 
        mimetype: file.mimetype,
        buffer: file.buffer,
        size: file.size
      }
    );

    // Redirect back to the test page
    res.redirect('/api/test-book-file');
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/test-book-file/list
 * List book files
 */
router.get("/list", async (req: Request, res: Response) => {
  try {
    const { bookId } = req.query;

    if (!bookId) {
      return res.status(400).json({ error: 'Book ID is required' });
    }

    // List files in object storage
    const files = await sirenedBookBucket.listBookFiles(parseInt(bookId as string));
    res.json(files);
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/test-book-file/download
 * Download a book file
 */
router.get("/download", async (req: Request, res: Response) => {
  try {
    const { path } = req.query;

    if (!path) {
      return res.status(400).json({ error: 'Path is required' });
    }

    // Get file from object storage
    const { data, contentType } = await sirenedBookBucket.getBookFile(path as string);

    // Extract the filename from the path
    const filename = path.toString().split('/').pop() || 'download';

    // Set headers for download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    // Send the file data
    res.send(data);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * DELETE /api/test-book-file/delete/:key
 * Delete a book file from storage
 */
router.delete("/delete/:key(*)", async (req: Request, res: Response) => {
  try {
    const { key } = req.params;

    if (!key) {
      return res.status(400).json({ error: 'Key is required' });
    }

    // Delete file from object storage
    await sirenedBookBucket.deleteBookFile(key);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;