import { Router, Request, Response } from "express";
import { dbStorage } from "../storage";
import { adminAuthMiddleware } from "../middleware/admin-auth";
import { sql, eq, desc, and, between } from "drizzle-orm";
import { db } from "../db";
import { 
  authorAnalytics, 
  authorPageViews, 
  authorFormAnalytics, 
  users,
  books,
  bookImages,
  bookGenreTaxonomies,
  genreTaxonomies,
  authors
} from "@shared/schema";
import { subDays, parse } from "date-fns";
import multer from "multer";
import path from "path";
import fs from "fs";
import AdmZip from "adm-zip";
import sanitizeFilename from "sanitize-filename";
import clamav from "clamav.js";

// Configure dirs
const uploadsDir = "./uploads";
const coversDir = path.join(uploadsDir, "covers");
const tempDir = path.join(uploadsDir, "temp");
const safeExtractDir = path.join(uploadsDir, "safe_extract");

// Ensure all required directories exist
[uploadsDir, coversDir, tempDir, safeExtractDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Initialize ClamAV with error handling
let clamavScanner;
try {
  clamavScanner = clamav.createScanner({
    active: process.env.NODE_ENV === 'production',
    debug_mode: false,
    preference: 'clamdscan', // Use daemon if available, fallback to clamscan
    clamscan: {
      path: '/usr/bin/clamscan',
      db: '/var/lib/clamav',
      scan_archives: true,
      remove_infected: false,
      file_list: null
    },
    clamdscan: {
      socket: '/tmp/clamd.socket',
      local_fallback: true,
      host: '127.0.0.1',
      port: 3310,
      timeout: 60000,
      config_file: null
    }
  });
  console.log("ClamAV scanner initialized successfully");
} catch (error) {
  console.warn("ClamAV initialization failed, virus scanning will be skipped:", error);
  clamavScanner = {
    // Mock implementation for development environments
    is_infected: (filePath: string, callback: any) => {
      console.log(`[DEV] Mock virus scan for ${filePath}`);
      callback(null, filePath, false); // Assume clean in development
    }
  };
}

// File security helper functions
const isFileNameSafe = (filename: string): boolean => {
  const sanitized = sanitizeFilename(filename);
  return sanitized === filename && !filename.includes("../") && !filename.includes("/");
};

const scanFile = async (filePath: string): Promise<boolean> => {
  try {
    // In production environment, use real virus scanning
    if (process.env.NODE_ENV === 'production') {
      return new Promise((resolve) => {
        clamavScanner.is_infected(filePath, (err, file, is_infected) => {
          if (err) {
            console.error(`Error scanning file ${filePath}:`, err);
            resolve(false); // Fail safe - treat as infected if scan fails
          } else {
            resolve(!is_infected);
          }
        });
      });
    } else {
      // In development, skip actual virus scanning but log the attempt
      console.log(`Development mode: Skipping virus scan for ${filePath}`);
      return true;
    }
  } catch (error) {
    console.error("ClamAV scan error:", error);
    return false; // Fail safe
  }
};

// Configure multer for file uploads
const fileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Store ZIP files in temp directory, images directly in covers
    if (file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
      cb(null, tempDir);
    } else {
      cb(null, coversDir);
    }
  },
  filename: (req, file, cb) => {
    // Safe filename generation
    const originalName = sanitizeFilename(file.originalname);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(originalName));
  },
});

// Create multer upload middleware with field configuration
const multipleImageUpload = multer({
  storage: fileStorage,
  fileFilter: (req, file, cb) => {
    // Allow image files and ZIP files
    if (file.mimetype.startsWith('image/') || 
        file.mimetype === 'application/zip' || 
        file.mimetype === 'application/x-zip-compressed') {
      return cb(null, true);
    }
    cb(new Error('Only image files and ZIP archives are allowed'));
  },
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  }
}).fields([
  { name: 'bookZip', maxCount: 1 },
  { name: 'bookImage_book-detail', maxCount: 1 },
  { name: 'bookImage_background', maxCount: 1 },
  { name: 'bookImage_book-card', maxCount: 1 },
  { name: 'bookImage_grid-item', maxCount: 1 },
  { name: 'bookImage_mini', maxCount: 1 },
  { name: 'bookImage_hero', maxCount: 1 }
]);

const router = Router();

// Check if user is admin
router.get("/check", adminAuthMiddleware, (req: Request, res: Response) => {
  res.json({ isAdmin: true });
});

// Temporary debug route without auth middleware for troubleshooting
router.get("/debug-auth", (req: Request, res: Response) => {
  console.log('Debug auth route - User object:', req.user);
  console.log('Debug auth route - isAuthenticated:', req.isAuthenticated());
  res.json({ 
    authenticated: req.isAuthenticated(),
    userId: req.user?.id,
    userEmail: req.user?.email,
    userIsAuthor: req.user?.isAuthor,
    user: req.user
  });
});

// Get aggregate user stats
router.get("/analytics/user-stats", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    // Get total users
    const [totalUsers] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users);
    
    // Get total authors
    const [totalAuthors] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(eq(users.isAuthor, true));
    
    // Since we don't have createdAt field, we'll simplify the response
    const newUsersData: { date: string; count: number }[] = [];
    
    res.json({
      totalUsers: totalUsers.count,
      totalAuthors: totalAuthors.count,
      newUsers: newUsersData
    });
  } catch (error) {
    console.error("Error getting user stats:", error);
    res.status(500).json({ error: "Failed to retrieve user statistics" });
  }
});

// Get all page views data for admins
router.get("/analytics/page-views", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { days = "30", authorId } = req.query;
    
    const startDate = subDays(new Date(), parseInt(days as string));
    
    // Base conditions
    const conditions = [sql`${authorPageViews.enteredAt} >= ${startDate}`];
    
    // Add author condition if provided
    if (authorId && !isNaN(parseInt(authorId as string))) {
      conditions.push(eq(authorPageViews.authorId, parseInt(authorId as string)));
    }
    
    // Get page view counts by URL
    const pageViewsByUrl = await db
      .select({
        pageUrl: authorPageViews.pageUrl,
        count: sql<number>`count(*)::int`,
        avgDuration: sql<number>`avg(COALESCE(${authorPageViews.duration}, 0))::int`
      })
      .from(authorPageViews)
      .where(and(...conditions))
      .groupBy(authorPageViews.pageUrl)
      .orderBy(desc(sql<number>`count(*)`));
    
    // Get page views by date
    const pageViewsByDate = await db
      .select({
        date: sql<string>`date_trunc('day', ${authorPageViews.enteredAt})::date::text`,
        count: sql<number>`count(*)::int`
      })
      .from(authorPageViews)
      .where(and(...conditions))
      .groupBy(sql`date_trunc('day', ${authorPageViews.enteredAt})`)
      .orderBy(sql`date_trunc('day', ${authorPageViews.enteredAt})`);
    
    res.json({
      pageViewsByUrl,
      pageViewsByDate
    });
  } catch (error) {
    console.error("Error getting page views data:", error);
    res.status(500).json({ error: "Failed to retrieve page views data" });
  }
});

// Get all author actions for admins
router.get("/analytics/author-actions", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { days = "30", authorId } = req.query;
    
    const startDate = subDays(new Date(), parseInt(days as string));
    
    // Base conditions
    const conditions = [sql`${authorAnalytics.timestamp} >= ${startDate}`];
    
    // Add author condition if provided
    if (authorId && !isNaN(parseInt(authorId as string))) {
      conditions.push(eq(authorAnalytics.authorId, parseInt(authorId as string)));
    }
    
    // Get action counts by type
    const actionsByType = await db
      .select({
        actionType: authorAnalytics.actionType,
        count: sql<number>`count(*)::int`
      })
      .from(authorAnalytics)
      .where(and(...conditions))
      .groupBy(authorAnalytics.actionType)
      .orderBy(desc(sql<number>`count(*)`));
    
    // Get actions by date
    const actionsByDate = await db
      .select({
        date: sql<string>`date_trunc('day', ${authorAnalytics.timestamp})::date::text`,
        count: sql<number>`count(*)::int`
      })
      .from(authorAnalytics)
      .where(and(...conditions))
      .groupBy(sql`date_trunc('day', ${authorAnalytics.timestamp})`)
      .orderBy(sql`date_trunc('day', ${authorAnalytics.timestamp})`);
    
    res.json({
      actionsByType,
      actionsByDate
    });
  } catch (error) {
    console.error("Error getting author actions data:", error);
    res.status(500).json({ error: "Failed to retrieve author actions data" });
  }
});

// Get all form analytics data for admins
router.get("/analytics/form-data", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { days = "30", authorId } = req.query;
    
    const startDate = subDays(new Date(), parseInt(days as string));
    
    // Base conditions
    const conditions = [sql`${authorFormAnalytics.startedAt} >= ${startDate}`];
    
    // Add author condition if provided
    if (authorId && !isNaN(parseInt(authorId as string))) {
      conditions.push(eq(authorFormAnalytics.authorId, parseInt(authorId as string)));
    }
    
    // Get form analytics by form ID
    const formDataByFormId = await db
      .select({
        formId: authorFormAnalytics.formId,
        started: sql<number>`count(*)::int`,
        completed: sql<number>`SUM(CASE WHEN ${authorFormAnalytics.status} = 'completed' THEN 1 ELSE 0 END)::int`,
        abandoned: sql<number>`SUM(CASE WHEN ${authorFormAnalytics.status} = 'abandoned' THEN 1 ELSE 0 END)::int`,
        avgDuration: sql<number>`avg(COALESCE(${authorFormAnalytics.duration}, 0))::int`
      })
      .from(authorFormAnalytics)
      .where(and(...conditions))
      .groupBy(authorFormAnalytics.formId)
      .orderBy(desc(sql<number>`count(*)`));
    
    // Calculate completion rates
    const formsWithRates = formDataByFormId.map(form => ({
      ...form,
      completionRate: form.started > 0 ? (form.completed / form.started) : 0
    }));
    
    res.json(formsWithRates);
  } catch (error) {
    console.error("Error getting form analytics data:", error);
    res.status(500).json({ error: "Failed to retrieve form analytics data" });
  }
});

// Search for authors or books
router.get("/search", adminAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: "Search query is required" });
    }
    
    // Search for authors
    const matchingAuthors = await db
      .select({
        id: users.id,
        type: sql<string>`'author'`,
        displayName: users.displayName,
        email: users.email,
        username: users.username,
        isAuthor: users.isAuthor
      })
      .from(users)
      .where(
        and(
          eq(users.isAuthor, true),
          sql`(
            ${users.displayName} ILIKE ${`%${query}%`} OR 
            ${users.username} ILIKE ${`%${query}%`} OR 
            ${users.email} ILIKE ${`%${query}%`}
          )`
        )
      )
      .limit(10);
    
    // Search for books
    const matchingBooks = await db
      .select({
        id: books.id,
        type: sql<string>`'book'`,
        title: books.title,
        author: books.author,
        authorId: books.authorId
      })
      .from(books)
      .where(
        sql`(
          ${books.title} ILIKE ${`%${query}%`} OR 
          ${books.author} ILIKE ${`%${query}%`}
        )`
      )
      .limit(10);
    
    // Combine results
    const results = [...matchingAuthors, ...matchingBooks];
    
    res.json(results);
  } catch (error) {
    console.error("Error searching:", error);
    res.status(500).json({ error: "Failed to perform search" });
  }
});

// Helper function to extract CSV from a ZIP file
const extractCsvFromZip = async (zipFilePath: string): Promise<{ csvContent: string, imageFiles: Map<string, Buffer> }> => {
  try {
    // Create a new zip object
    const zip = new AdmZip(zipFilePath);
    const zipEntries = zip.getEntries();

    // Variables to store CSV content and images
    let csvContent = '';
    const imageFiles = new Map<string, Buffer>();

    // Scan for viruses in zip file
    // For zip handling security we're implementing both whitelist and sanitization
    // First validate the zip file is virus-free
    const isClean = await scanFile(zipFilePath);
    if (!isClean) {
      throw new Error("Virus detected in ZIP file. Upload rejected.");
    }

    // Process each entry in the zip
    for (const entry of zipEntries) {
      const entryName = entry.entryName;
      
      // Skip directories and hidden files
      if (entry.isDirectory || entryName.startsWith('__MACOSX/') || entryName.startsWith('.')) {
        continue;
      }

      // All filenames must be safe
      if (!isFileNameSafe(path.basename(entryName))) {
        console.warn(`Skipping file with unsafe name: ${entryName}`);
        continue;
      }

      // Check file extension for CSV
      if (entryName.toLowerCase().endsWith('.csv')) {
        csvContent = entry.getData().toString('utf8');
      } 
      // Check for image files
      else if (/\.(jpg|jpeg|png|gif|webp)$/i.test(entryName)) {
        // Extract the image and add to our collection
        const imageData = entry.getData();
        
        // Additional virus scan for each image file
        const tempImagePath = path.join(tempDir, sanitizeFilename(path.basename(entryName)));
        fs.writeFileSync(tempImagePath, imageData);
        
        const isImageClean = await scanFile(tempImagePath);
        if (!isImageClean) {
          fs.unlinkSync(tempImagePath); // Delete infected file
          console.warn(`Infected image detected: ${entryName} - Skipping`);
          continue;
        }
        
        // Clean up temp file
        fs.unlinkSync(tempImagePath);
        
        // Store the image with a normalized key name
        const imageType = path.basename(entryName, path.extname(entryName)).toLowerCase();
        imageFiles.set(imageType, imageData);
      }
    }

    // Validate that we found a CSV file
    if (!csvContent) {
      throw new Error("No CSV file found in the ZIP archive");
    }

    return { csvContent, imageFiles };
  } catch (error) {
    console.error("Error extracting from ZIP:", error);
    throw error;
  }
};

// Helper function to save image from buffer to disk
const saveImageFromBuffer = (buffer: Buffer, imageType: string): string => {
  // Create a unique filename with a timestamp
  const filename = Date.now() + "-" + Math.round(Math.random() * 1e9) + ".png";
  const filePath = path.join(coversDir, filename);
  
  // Write the buffer to file
  fs.writeFileSync(filePath, buffer);
  
  // Return the relative URL
  return '/uploads/covers/' + filename;
};

// Utility function to calculate taxonomy importance based on rank
const calculateImportance = (rank: number): number => {
  if (rank === 0) return 1; // First item has importance 1
  return 1 / (1 + Math.log(rank + 1));
};

// Bulk upload books with ZIP file processing
router.post("/books/bulk", adminAuthMiddleware, multipleImageUpload, async (req: Request, res: Response) => {
  try {
    console.log('Admin bulk book upload request received');
    
    // Process uploaded files
    const uploadedFiles = req.files as { [fieldname: string]: Express.Multer.File[] };
    let csvBooks: any[] = [];
    let extractedImages: Map<string, Buffer> | null = null;
    
    // Check if a ZIP file was uploaded
    if (uploadedFiles.bookZip && uploadedFiles.bookZip.length > 0) {
      const zipFile = uploadedFiles.bookZip[0];
      console.log(`Processing ZIP file: ${zipFile.originalname}`);
      
      try {
        // Extract CSV and images from ZIP
        const { csvContent, imageFiles } = await extractCsvFromZip(zipFile.path);
        
        // Parse the CSV data
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        // Simple CSV parser logic for header detection and parsing
        const parseCSVLine = (line: string): string[] => {
          const values: string[] = [];
          let currentValue = '';
          let insideQuotes = false;

          for (let i = 0; i < line.length; i++) {
            const char = line[i];

            if (char === '"') {
              insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
              values.push(currentValue.trim());
              currentValue = '';
            } else {
              currentValue += char;
            }
          }

          values.push(currentValue.trim());
          return values.map(value => value.replace(/^"|"$/g, ''));
        };
        
        const headers = parseCSVLine(lines[0]);
        
        // Validate required headers
        const requiredHeaders = ['Title', 'Author', 'formats'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          throw new Error(`Missing required CSV columns: ${missingHeaders.join(', ')}`);
        }
        
        // Parse the books
        csvBooks = lines.slice(1).map(line => {
          const values = parseCSVLine(line);
          const book: any = {};
          headers.forEach((header, index) => {
            if (index < values.length) {
              book[header] = values[index] ? values[index].trim() : '';
            } else {
              book[header] = '';
            }
          });
          return book;
        });
        
        console.log(`Extracted ${csvBooks.length} books from ZIP CSV`);
        
        // Save extracted images for processing
        extractedImages = imageFiles;
      } catch (error) {
        console.error('Error processing ZIP file:', error);
        return res.status(400).json({ 
          error: `Error processing ZIP file: ${error instanceof Error ? error.message : 'Unknown error'}` 
        });
      } finally {
        // Clean up the temporary zip file
        try {
          if (fs.existsSync(zipFile.path)) {
            fs.unlinkSync(zipFile.path);
          }
        } catch (cleanupError) {
          console.error('Error cleaning up temporary zip file:', cleanupError);
        }
      }
    } 
    // Otherwise check for direct CSV upload
    else if (req.body.csvData) {
      csvBooks = JSON.parse(req.body.csvData);
      console.log(`Processing ${csvBooks.length} books from direct CSV upload`);
    } 
    else {
      return res.status(400).json({ error: "No CSV data or ZIP file provided" });
    }

    // Process books one by one
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const csvBook of csvBooks) {
      try {
        // 1. Create or get author (always use userId = 2 as specified)
        let authorId = 2; // Default author ID
        
        // Check if author exists in authors table
        const existingAuthor = await db
          .select()
          .from(authors)
          .where(eq(authors.author_name, csvBook.Author))
          .limit(1);
        
        // If author doesn't exist, create new author
        if (existingAuthor.length === 0) {
          const [newAuthor] = await db
            .insert(authors)
            .values({
              userId: 2, // Always use userId=2 as specified
              author_name: csvBook.Author,
              author_image_url: null,
              bio: null
            })
            .returning();
          
          console.log(`Created new author: ${csvBook.Author} with ID ${newAuthor.id}`);
        } else {
          console.log(`Found existing author: ${csvBook.Author}`);
        }
        
        // 2. Parse date if present
        let publishedDate = null;
        if (csvBook.publish_date) {
          try {
            // Try different date formats
            publishedDate = parse(csvBook.publish_date, 'yyyy-MM-dd', new Date());
          } catch (e) {
            console.error(`Error parsing date for ${csvBook.Title}: ${e}`);
            // Keep as null if parsing fails
          }
        }
        
        // 3. Process formats (required field)
        const formats = csvBook.formats ? csvBook.formats.split(',').map((f: string) => f.trim()) : [];
        if (formats.length === 0) {
          throw new Error(`Book ${csvBook.Title} is missing required formats field`);
        }
        
        // 4. Process awards if present
        const awards = csvBook.awards ? csvBook.awards.split(',').map((a: string) => a.trim()) : [];
        
        // 5. Process characters if present
        const characters = csvBook.characters ? csvBook.characters.split(',').map((c: string) => c.trim()) : [];
        
        // 6. Validate required fields
        if (!csvBook.Title || !csvBook.Author) {
          throw new Error(`Missing required fields: Title and Author are required`);
        }
        
        // 7. Create book
        const [book] = await db
          .insert(books)
          .values({
            title: csvBook.Title,
            author: csvBook.Author,
            authorId: 2, // Always use authorId=2 as specified
            description: csvBook.Description || "No description provided",
            authorImageUrl: null,
            promoted: false,
            pageCount: csvBook.pages ? parseInt(csvBook.pages) : 0,
            formats: formats,
            publishedDate: publishedDate,
            awards: awards,
            originalTitle: null,
            series: csvBook.series || null,
            setting: csvBook.setting || null,
            characters: characters,
            isbn: csvBook.isbn || null,
            asin: csvBook.asin || null,
            language: csvBook.language || "English",
            referralLinks: csvBook.referralLinks ? JSON.parse(csvBook.referralLinks) : [],
            internal_details: csvBook.internal_details || null
          })
          .returning();
        
        console.log(`Created book: ${book.title} with ID ${book.id}`);
        
        // 8. Process book images
        const bookImageEntries = [];
        
        // Create book images from uploaded files
        // For each image type, check if an image was provided with the book's title
        // in the field name (e.g., bookImage_book-detail_Book Title)
        
        // Process each of the required image types
        const imageTypes = ["book-detail", "background", "hero", "book-card", "grid-item", "mini"];
        const fileKeys = Object.keys(uploadedFiles || {});
        
        for (const imageType of imageTypes) {
          // Try to find image file for this type
          const key = fileKeys.find(k => k === `bookImage_${imageType}`);
          
          if (key && uploadedFiles[key] && uploadedFiles[key].length > 0) {
            const file = uploadedFiles[key][0];
            const imageUrl = `/uploads/covers/${file.filename}`;
            
            // Set dimensions based on image type
            let width = 0;
            let height = 0;
            
            switch (imageType) {
              case "book-detail":
                width = 480;
                height = 600;
                break;
              case "background":
                width = 1300;
                height = 1500;
                break;
              case "book-card":
                width = 256;
                height = 440;
                break;
              case "grid-item":
                width = 56;
                height = 212;
                break;
              case "mini":
                width = 48;
                height = 64;
                break;
              case "hero":
                width = 1500;
                height = 600;
                break;
            }
            
            bookImageEntries.push({
              bookId: book.id,
              imageUrl,
              imageType,
              width,
              height,
              sizeKb: Math.round(file.size / 1024) // Convert bytes to KB
            });
            
            console.log(`Added ${imageType} image for book ${book.title}`);
          } else {
            // Check if this was a required field
            if (imageTypes.slice(0, 6).includes(imageType)) {
              console.warn(`Warning: Required image type ${imageType} not provided for book ${book.title}`);
            }
          }
        }
        
        // Insert all book images
        if (bookImageEntries.length > 0) {
          await db.insert(bookImages).values(bookImageEntries);
          console.log(`Inserted ${bookImageEntries.length} images for book ${book.title}`);
        } else {
          console.warn(`No images provided for book ${book.title}`);
        }
        
        // 9. Process taxonomies (genres, subgenres, themes, tropes)
        // Taxonomy types to process
        const taxonomyFields = [
          { csvField: 'genres', type: 'genre' },
          { csvField: 'subgenres', type: 'subgenre' },
          { csvField: 'themes', type: 'theme' },
          { csvField: 'tropes', type: 'trope' }
        ];
        
        for (const field of taxonomyFields) {
          if (csvBook[field.csvField]) {
            const items = csvBook[field.csvField].split(',')
              .map((item: string) => item.trim())
              .filter((item: string) => item.length > 0);
            
            // Calculate importance for each item
            await Promise.all(items.slice(0, 2).map(async (item: string, index: number) => {
              // Calculate importance using the specified formula
              const rank = index + 1;
              const importance = 1 / (1 + Math.log(rank));
              
              // Look up taxonomy ID
              const [taxonomy] = await db
                .select()
                .from(genreTaxonomies)
                .where(
                  and(
                    eq(genreTaxonomies.name, item),
                    eq(genreTaxonomies.type, field.type)
                  )
                )
                .limit(1);
              
              if (taxonomy) {
                // Insert book-taxonomy relationship
                await db
                  .insert(bookGenreTaxonomies)
                  .values({
                    bookId: book.id,
                    taxonomyId: taxonomy.id,
                    rank,
                    importance
                  });
                
                console.log(`Added ${field.type} "${item}" to book ${book.title} with importance ${importance}`);
              } else {
                console.warn(`Could not find ${field.type} "${item}" in taxonomy table`);
              }
            }));
          }
        }
        
        // Add to successful results
        successCount++;
        results.push({
          title: book.title,
          id: book.id,
          success: true
        });
        
      } catch (error) {
        console.error(`Error processing book ${csvBook.Title}:`, error);
        errorCount++;
        results.push({
          title: csvBook.Title,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
    
    res.json({
      success: true,
      total: csvBooks.length,
      successful: successCount,
      failed: errorCount,
      results
    });
    
  } catch (error) {
    console.error("Error in bulk book upload:", error);
    res.status(500).json({ 
      error: "Failed to process bulk book upload",
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;