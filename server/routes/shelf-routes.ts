import { Router, Request, Response } from "express";
import { db } from "../db";
import { bookShelves, shelfBooks, notes, books, bookImages, authors, users, shelfComments, bookGenreTaxonomies, genreTaxonomies } from "../../shared/schema";
import { eq, and, desc, asc, inArray, or } from "drizzle-orm";
import { insertBookShelfSchema, insertShelfBookSchema, insertNoteSchema, insertShelfCommentSchema } from "../../shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";
import { objectStorage } from "../services/object-storage";

// Configure multer for in-memory storage (for use with object storage)
const bookshelfCoverUpload = multer({
  storage: multer.memoryStorage(), // Store in memory so we can upload to object storage
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB size limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const router = Router();

// Helper function to verify shelf ownership
async function verifyShelfOwnership(shelfId: number, userId: number): Promise<boolean> {
  const shelf = await db.query.bookShelves.findFirst({
    where: and(
      eq(bookShelves.id, shelfId),
      eq(bookShelves.userId, userId)
    )
  });
  
  return !!shelf;
}

// Helper function to verify if user is an author
async function verifyUserIsAuthor(userId: number): Promise<boolean> {
  const authorRecord = await db.query.authors.findFirst({
    where: eq(authors.userId, userId)
  });
  
  return !!authorRecord;
}

// Get all shelves for the current user
router.get("/api/bookshelves", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const userShelves = await db.query.bookShelves.findMany({
      where: eq(bookShelves.userId, req.user.id),
      orderBy: asc(bookShelves.rank)
    });
    
    return res.status(200).json(userShelves);
  } catch (error) {
    console.error("Error fetching bookshelves:", error);
    return res.status(500).send("Internal server error");
  }
});

// Create a new bookshelf
router.post("/api/bookshelves", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const validatedData = insertBookShelfSchema.parse({
      ...req.body,
      userId: req.user.id
    });

    // Get the highest rank to place the new shelf at the end
    const highestRank = await db
      .select({ maxRank: bookShelves.rank })
      .from(bookShelves)
      .where(eq(bookShelves.userId, req.user.id))
      .orderBy(desc(bookShelves.rank))
      .limit(1);

    const newRank = highestRank.length > 0 ? highestRank[0].maxRank + 1 : 0;

    // Create insert data with correct type
    const insertData = {
      title: validatedData.title,
      userId: req.user.id,
      rank: newRank,
      ...(validatedData.coverImageUrl && typeof validatedData.coverImageUrl === 'string' 
        ? { coverImageUrl: validatedData.coverImageUrl } 
        : {})
    };
    
    const [newShelf] = await db
      .insert(bookShelves)
      .values(insertData)
      .returning();

    return res.status(201).json(newShelf);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error("Error creating bookshelf:", error);
    return res.status(500).send("Internal server error");
  }
});

// Update a bookshelf
router.patch("/api/bookshelves/:id", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized");
  }

  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).send("Invalid ID");
  }

  try {
    // Verify ownership
    const isOwner = await verifyShelfOwnership(id, req.user.id);
    if (!isOwner) {
      return res.status(403).send("Forbidden");
    }

    const validatedData = insertBookShelfSchema.partial().parse(req.body);

    // Create update data with correct type
    const updateData: Record<string, any> = {
      updatedAt: new Date()
    };
    
    // Only add string type coverImageUrl
    if (validatedData.title) {
      updateData.title = validatedData.title;
    }
    
    if (validatedData.coverImageUrl && typeof validatedData.coverImageUrl === 'string') {
      updateData.coverImageUrl = validatedData.coverImageUrl;
    }
    
    const [updatedShelf] = await db
      .update(bookShelves)
      .set(updateData)
      .where(and(
        eq(bookShelves.id, id),
        eq(bookShelves.userId, req.user.id)
      ))
      .returning();

    return res.status(200).json(updatedShelf);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error("Error updating bookshelf:", error);
    return res.status(500).send("Internal server error");
  }
});

// Delete a bookshelf
router.delete("/api/bookshelves/:id", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized");
  }

  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).send("Invalid ID");
  }

  try {
    // Verify ownership
    const isOwner = await verifyShelfOwnership(id, req.user.id);
    if (!isOwner) {
      return res.status(403).send("Forbidden");
    }

    // First remove all books from the shelf
    await db
      .delete(shelfBooks)
      .where(eq(shelfBooks.shelfId, id));

    // Then remove all notes associated with the shelf
    await db
      .delete(notes)
      .where(and(
        eq(notes.shelfId, id),
        eq(notes.type, "shelf")
      ));

    // Remove all comments associated with the shelf
    await db
      .delete(shelfComments)
      .where(eq(shelfComments.shelfId, id));
    
    // Finally delete the shelf
    const [deletedShelf] = await db
      .delete(bookShelves)
      .where(and(
        eq(bookShelves.id, id),
        eq(bookShelves.userId, req.user.id)
      ))
      .returning();

    return res.status(200).json(deletedShelf);
  } catch (error) {
    console.error("Error deleting bookshelf:", error);
    return res.status(500).send("Internal server error");
  }
});

// Update shelf ranks (for drag and drop)
router.patch("/api/bookshelves/rank", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized");
  }

  const shelfRanks = z.array(z.object({
    id: z.number(),
    rank: z.number()
  })).parse(req.body);

  try {
    // Verify all shelves belong to the user
    for (const shelf of shelfRanks) {
      const isOwner = await verifyShelfOwnership(shelf.id, req.user.id);
      if (!isOwner) {
        return res.status(403).send(`Forbidden: Shelf ${shelf.id} does not belong to this user`);
      }
    }

    // Update ranks in transaction
    for (const shelf of shelfRanks) {
      await db
        .update(bookShelves)
        .set({ rank: shelf.rank, updatedAt: new Date() })
        .where(and(
          eq(bookShelves.id, shelf.id),
          eq(bookShelves.userId, req.user.id)
        ));
    }

    // Get updated shelves
    const updatedShelves = await db.query.bookShelves.findMany({
      where: eq(bookShelves.userId, req.user.id),
      orderBy: asc(bookShelves.rank)
    });

    return res.status(200).json(updatedShelves);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error("Error updating shelf ranks:", error);
    return res.status(500).send("Internal server error");
  }
});

// Get books for a specific shelf
router.get("/api/bookshelves/:id/books", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized");
  }

  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).send("Invalid ID");
  }

  try {
    // Verify ownership
    const isOwner = await verifyShelfOwnership(id, req.user.id);
    if (!isOwner) {
      return res.status(403).send("Forbidden");
    }

    // Get books on this shelf with their details
    const shelfBooksWithDetails = await db
      .select({
        id: shelfBooks.id,
        bookId: shelfBooks.bookId,
        shelfId: shelfBooks.shelfId,
        rank: shelfBooks.rank,
        addedAt: shelfBooks.addedAt,
        book: books
      })
      .from(shelfBooks)
      .innerJoin(books, eq(shelfBooks.bookId, books.id))
      .where(eq(shelfBooks.shelfId, id))
      .orderBy(asc(shelfBooks.rank));

    return res.status(200).json(shelfBooksWithDetails);
  } catch (error) {
    console.error("Error fetching shelf books:", error);
    return res.status(500).send("Internal server error");
  }
});

// Add a book to a shelf
router.post("/api/bookshelves/:id/books", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized");
  }

  const shelfId = parseInt(req.params.id);
  if (isNaN(shelfId)) {
    return res.status(400).send("Invalid shelf ID");
  }

  try {
    // Verify ownership
    const isOwner = await verifyShelfOwnership(shelfId, req.user.id);
    if (!isOwner) {
      return res.status(403).send("Forbidden");
    }

    const validatedData = insertShelfBookSchema.parse({
      ...req.body,
      shelfId
    });

    // Check if book already exists on this shelf
    const existingBook = await db.query.shelfBooks.findFirst({
      where: and(
        eq(shelfBooks.shelfId, shelfId),
        eq(shelfBooks.bookId, validatedData.bookId)
      )
    });

    if (existingBook) {
      return res.status(400).send("Book already exists on this shelf");
    }

    // Get the highest rank to place the new book at the end
    const highestRank = await db
      .select({ maxRank: shelfBooks.rank })
      .from(shelfBooks)
      .where(eq(shelfBooks.shelfId, shelfId))
      .orderBy(desc(shelfBooks.rank))
      .limit(1);

    const newRank = highestRank.length > 0 ? highestRank[0].maxRank + 1 : 0;

    const [newShelfBook] = await db
      .insert(shelfBooks)
      .values({
        ...validatedData,
        rank: newRank
      })
      .returning();

    // Get the full book details
    const bookDetail = await db.query.books.findFirst({
      where: eq(books.id, validatedData.bookId)
    });

    return res.status(201).json({
      ...newShelfBook,
      book: bookDetail
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error("Error adding book to shelf:", error);
    return res.status(500).send("Internal server error");
  }
});

// Remove a book from a shelf
router.delete("/api/bookshelves/:shelfId/books/:bookId", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized");
  }

  const shelfId = parseInt(req.params.shelfId);
  const bookId = parseInt(req.params.bookId);
  
  if (isNaN(shelfId) || isNaN(bookId)) {
    return res.status(400).send("Invalid IDs");
  }

  try {
    // Verify ownership
    const isOwner = await verifyShelfOwnership(shelfId, req.user.id);
    if (!isOwner) {
      return res.status(403).send("Forbidden");
    }

    // Remove the book from the shelf
    const [removedBook] = await db
      .delete(shelfBooks)
      .where(and(
        eq(shelfBooks.shelfId, shelfId),
        eq(shelfBooks.bookId, bookId)
      ))
      .returning();

    if (!removedBook) {
      return res.status(404).send("Book not found on this shelf");
    }

    return res.status(200).json(removedBook);
  } catch (error) {
    console.error("Error removing book from shelf:", error);
    return res.status(500).send("Internal server error");
  }
});

// Update book ranks in a shelf (for drag and drop)
router.patch("/api/bookshelves/:id/books/rank", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized");
  }

  const shelfId = parseInt(req.params.id);
  if (isNaN(shelfId)) {
    return res.status(400).send("Invalid shelf ID");
  }

  const bookRanks = z.array(z.object({
    id: z.number(),
    rank: z.number()
  })).parse(req.body);

  try {
    // Verify ownership
    const isOwner = await verifyShelfOwnership(shelfId, req.user.id);
    if (!isOwner) {
      return res.status(403).send("Forbidden");
    }

    // Update ranks in transaction
    for (const book of bookRanks) {
      await db
        .update(shelfBooks)
        .set({ rank: book.rank })
        .where(and(
          eq(shelfBooks.id, book.id),
          eq(shelfBooks.shelfId, shelfId)
        ));
    }

    // Get updated books
    const updatedBooks = await db
      .select()
      .from(shelfBooks)
      .where(eq(shelfBooks.shelfId, shelfId))
      .orderBy(asc(shelfBooks.rank));

    return res.status(200).json(updatedBooks);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error("Error updating book ranks:", error);
    return res.status(500).send("Internal server error");
  }
});

// Get detailed view of a bookshelf with its books and notes
// Supports either ID-based or query parameter-based routing
router.get("/api/book-shelf", async (req: Request, res: Response) => {
  const username = req.query.username as string;
  const shelfName = req.query.shelfname as string;

  if (!username || !shelfName) {
    return res.status(400).send("Missing username or shelf name");
  }

  try {
    // Find the user by username
    const targetUser = await db.query.users.findFirst({
      where: eq(users.username, username)
    });

    if (!targetUser) {
      return res.status(404).send("User not found");
    }

    // Get the shelf details with different checks for authenticated vs unauthenticated users
    let shelfQuery;
    if (req.user) {
      // Authenticated user: can see their own shelves or shared shelves
      shelfQuery = await db.query.bookShelves.findFirst({
        where: and(
          eq(bookShelves.userId, targetUser.id),
          eq(bookShelves.title, shelfName),
          // Only allow viewing if owned by the user or if it's shared
          or(
            eq(bookShelves.userId, req.user.id),
            eq(bookShelves.isShared, true)
          )
        )
      });
    } else {
      // Unauthenticated user: can only see shared shelves
      shelfQuery = await db.query.bookShelves.findFirst({
        where: and(
          eq(bookShelves.userId, targetUser.id),
          eq(bookShelves.title, shelfName),
          eq(bookShelves.isShared, true)
        )
      });
    }

    const shelf = shelfQuery;
    if (!shelf) {
      return res.status(404).send("Bookshelf not found or not shared");
    }

    // If authenticated, check permissions for non-shared shelves
    if (req.user && !shelf.isShared && shelf.userId !== req.user.id) {
      return res.status(403).send("Forbidden");
    }
  
    // Continue with rest of function...
    
    const shelfId = shelf.id;

    // Get the shelf details (for backward compatibility with existing code)
    const shelfDetails = await db.query.bookShelves.findFirst({
      where: eq(bookShelves.id, shelfId)
    });

    if (!shelfDetails) {
      return res.status(404).send("Bookshelf not found");
    }

    // Get shelf notes (only if authenticated and viewing own shelf)
    let shelfNotes: typeof notes.$inferSelect[] = [];
    if (req.user) {
      shelfNotes = await db.query.notes.findMany({
        where: and(
          eq(notes.shelfId, shelfId),
          eq(notes.userId, req.user.id),
          eq(notes.type, "shelf")
        ),
        orderBy: desc(notes.createdAt)
      });
    }

    // First get a reference to the table outside the query to avoid TypeScript errors
    const shelfBooksTable = shelfBooks;
    
    // Get books on this shelf
    const shelfBooksRows = await db
      .select({
        id: shelfBooksTable.id,
        bookId: shelfBooksTable.bookId,
        shelfId: shelfBooksTable.shelfId,
        rank: shelfBooksTable.rank,
        addedAt: shelfBooksTable.addedAt
      })
      .from(shelfBooksTable)
      .where(eq(shelfBooksTable.shelfId, shelfId))
      .orderBy(asc(shelfBooksTable.rank));
      
    // Create an enhanced result array with full book details
    const shelfBooksWithDetails: any[] = [];
    
    // Fetch detailed information for each book
    for (const shelfBookRow of shelfBooksRows) {
      // Get basic book information
      const book = await db.query.books.findFirst({
        where: eq(books.id, shelfBookRow.bookId)
      });
      
      if (book) {
        // Get book images
        const bookImagesTable = bookImages;
        const images = await db.query.bookImages.findMany({
          where: eq(bookImagesTable.bookId, shelfBookRow.bookId)
        });
        
        // Get author information
        const author = await db.query.authors.findFirst({
          where: eq(authors.id, book.authorId)
        });
        
        // Get book taxonomies (genres)
        const genreTaxonomies = await db
          .select({
            taxonomyId: bookGenreTaxonomies.taxonomyId,
            rank: bookGenreTaxonomies.rank,
            importance: bookGenreTaxonomies.importance,
            name: genreTaxonomies.name,
            type: genreTaxonomies.type,
            description: genreTaxonomies.description,
          })
          .from(bookGenreTaxonomies)
          .innerJoin(
            genreTaxonomies,
            eq(bookGenreTaxonomies.taxonomyId, genreTaxonomies.id)
          )
          .where(eq(bookGenreTaxonomies.bookId, shelfBookRow.bookId))
          .orderBy(bookGenreTaxonomies.rank);
        
        // Create an enhanced book object with additional properties
        const enhancedBook = {
          ...book,
          authorName: author?.author_name || "Unknown Author",
          images: images,
          genreTaxonomies: genreTaxonomies.map(item => ({
            taxonomyId: Number(item.taxonomyId),
            rank: Number(item.rank),
            importance: Number(item.importance),
            name: item.name,
            type: item.type,
            description: item.description
          }))
        };
        
        // Compile enhanced book entry
        shelfBooksWithDetails.push({
          ...shelfBookRow,
          book: enhancedBook
        });
      }
    }

    // Get book notes for all books in this shelf (only if authenticated)
    const bookIds = shelfBooksWithDetails.map(sb => sb.bookId);
    
    // Define type for book notes array
    let bookNotes: Array<typeof notes.$inferSelect> = [];
    if (bookIds.length > 0 && req.user) {
      const userId = req.user.id;
      bookNotes = await db.query.notes.findMany({
        where: and(
          inArray(notes.bookId, bookIds),
          eq(notes.userId, userId),
          eq(notes.type, "book")
        )
      });
    }

    // Return complete shelf data
    return res.status(200).json({
      shelf,
      shelfNotes,
      books: shelfBooksWithDetails,
      bookNotes
    });
  } catch (error) {
    console.error("Error fetching bookshelf details:", error);
    return res.status(500).send("Internal server error");
  }
});

// Removed the ID-based bookshelf endpoint to only use query parameters

// Get all notes for a shelf
router.get("/api/bookshelves/:id/notes", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized");
  }

  const shelfId = parseInt(req.params.id);
  if (isNaN(shelfId)) {
    return res.status(400).send("Invalid shelf ID");
  }

  try {
    // Verify ownership
    const isOwner = await verifyShelfOwnership(shelfId, req.user.id);
    if (!isOwner) {
      return res.status(403).send("Forbidden");
    }

    const shelfNotes = await db.query.notes.findMany({
      where: and(
        eq(notes.shelfId, shelfId),
        eq(notes.userId, req.user.id),
        eq(notes.type, "shelf")
      ),
      orderBy: desc(notes.createdAt)
    });

    return res.status(200).json(shelfNotes);
  } catch (error) {
    console.error("Error fetching shelf notes:", error);
    return res.status(500).send("Internal server error");
  }
});

// Add a note to a shelf
router.post("/api/bookshelves/:id/notes", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized");
  }

  const shelfId = parseInt(req.params.id);
  if (isNaN(shelfId)) {
    return res.status(400).send("Invalid shelf ID");
  }

  try {
    // Verify ownership
    const isOwner = await verifyShelfOwnership(shelfId, req.user.id);
    if (!isOwner) {
      return res.status(403).send("Forbidden");
    }

    const validatedData = insertNoteSchema.parse({
      ...req.body,
      userId: req.user.id,
      shelfId,
      type: "shelf"
    });

    const [newNote] = await db
      .insert(notes)
      .values(validatedData)
      .returning();

    return res.status(201).json(newNote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error("Error adding note to shelf:", error);
    return res.status(500).send("Internal server error");
  }
});

// Get book notes
router.get("/api/books/:id/notes", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized");
  }

  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).send("Invalid book ID");
  }

  try {
    const bookNotes = await db.query.notes.findMany({
      where: and(
        eq(notes.bookId, bookId),
        eq(notes.userId, req.user.id),
        eq(notes.type, "book")
      ),
      orderBy: desc(notes.createdAt)
    });

    return res.status(200).json(bookNotes);
  } catch (error) {
    console.error("Error fetching book notes:", error);
    return res.status(500).send("Internal server error");
  }
});

// Add a note to a book
router.post("/api/books/:id/notes", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized");
  }

  const bookId = parseInt(req.params.id);
  if (isNaN(bookId)) {
    return res.status(400).send("Invalid book ID");
  }

  try {
    const validatedData = insertNoteSchema.parse({
      ...req.body,
      userId: req.user.id,
      bookId,
      type: "book"
    });

    const [newNote] = await db
      .insert(notes)
      .values(validatedData)
      .returning();

    return res.status(201).json(newNote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error("Error adding note to book:", error);
    return res.status(500).send("Internal server error");
  }
});

// Update a note
router.patch("/api/notes/:id", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized");
  }

  const noteId = parseInt(req.params.id);
  if (isNaN(noteId)) {
    return res.status(400).send("Invalid note ID");
  }

  try {
    // Check that the note belongs to the user
    const note = await db.query.notes.findFirst({
      where: and(
        eq(notes.id, noteId),
        eq(notes.userId, req.user.id)
      )
    });

    if (!note) {
      return res.status(403).send("Forbidden");
    }

    const validatedData = z.object({
      content: z.string().min(1, "Note content is required"),
    }).parse(req.body);

    const [updatedNote] = await db
      .update(notes)
      .set({
        content: validatedData.content,
        updatedAt: new Date()
      })
      .where(and(
        eq(notes.id, noteId),
        eq(notes.userId, req.user.id)
      ))
      .returning();

    return res.status(200).json(updatedNote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error("Error updating note:", error);
    return res.status(500).send("Internal server error");
  }
});

// Delete a note
router.delete("/api/notes/:id", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized");
  }

  const noteId = parseInt(req.params.id);
  if (isNaN(noteId)) {
    return res.status(400).send("Invalid note ID");
  }

  try {
    // Check that the note belongs to the user
    const note = await db.query.notes.findFirst({
      where: and(
        eq(notes.id, noteId),
        eq(notes.userId, req.user.id)
      )
    });

    if (!note) {
      return res.status(403).send("Forbidden");
    }

    const [deletedNote] = await db
      .delete(notes)
      .where(and(
        eq(notes.id, noteId),
        eq(notes.userId, req.user.id)
      ))
      .returning();

    return res.status(200).json(deletedNote);
  } catch (error) {
    console.error("Error deleting note:", error);
    return res.status(500).send("Internal server error");
  }
});

// Toggle shelf sharing (only for authors)
router.patch("/api/bookshelves/:id/share", async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized");
  }

  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).send("Invalid ID");
  }

  try {
    // Verify ownership
    const isOwner = await verifyShelfOwnership(id, req.user.id);
    if (!isOwner) {
      return res.status(403).send("Forbidden: You don't own this bookshelf");
    }

    // Verify user is an author
    const isAuthor = await verifyUserIsAuthor(req.user.id);
    if (!isAuthor) {
      return res.status(403).send("Forbidden: Only authors can share bookshelves");
    }

    // Validate request data
    const { isShared } = z.object({
      isShared: z.boolean()
    }).parse(req.body);

    // Update the shelf's shared status
    const [updatedShelf] = await db
      .update(bookShelves)
      .set({ 
        isShared,
        updatedAt: new Date()
      })
      .where(and(
        eq(bookShelves.id, id),
        eq(bookShelves.userId, req.user.id)
      ))
      .returning();

    return res.status(200).json(updatedShelf);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error("Error toggling shelf sharing status:", error);
    return res.status(500).send("Internal server error");
  }
});

// Upload cover image for a bookshelf
router.post("/api/bookshelves/:id/cover", bookshelfCoverUpload.single("coverImage"), async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).send("Unauthorized");
  }

  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).send("Invalid shelf ID");
  }

  try {
    // Verify ownership
    const isOwner = await verifyShelfOwnership(id, req.user.id);
    if (!isOwner) {
      return res.status(403).send("Forbidden");
    }

    if (!req.file) {
      return res.status(400).send("No image uploaded");
    }

    // Upload the file to object storage in the 'bookshelf-covers' directory
    const storageKey = await objectStorage.uploadFile(req.file, 'bookshelf-covers');
    
    // Get the public URL for accessing the file
    const coverImageUrl = objectStorage.getPublicUrl(storageKey);

    // Update the bookshelf with the new cover image URL
    const [updatedShelf] = await db
      .update(bookShelves)
      .set({
        coverImageUrl: coverImageUrl,
        updatedAt: new Date()
      })
      .where(and(
        eq(bookShelves.id, id),
        eq(bookShelves.userId, req.user.id)
      ))
      .returning();

    return res.status(200).json(updatedShelf);
  } catch (error) {
    console.error("Error uploading cover image:", error);
    return res.status(500).send("Internal server error");
  }
});

// Get comments for a shared bookshelf
router.get("/api/bookshelves/:id/comments", async (req: Request, res: Response) => {
  const shelfId = parseInt(req.params.id);
  
  if (isNaN(shelfId)) {
    return res.status(400).send("Invalid shelf ID");
  }
  
  try {
    // Check if the shelf exists and is shared
    const shelf = await db.query.bookShelves.findFirst({
      where: eq(bookShelves.id, shelfId)
    });
    
    if (!shelf) {
      return res.status(404).send("Bookshelf not found");
    }
    
    if (!shelf.isShared) {
      return res.status(403).send("This bookshelf is not shared");
    }
    
    // Get comments with user info if available
    const comments = await db
      .select({
        id: shelfComments.id,
        shelfId: shelfComments.shelfId,
        userId: shelfComments.userId,
        username: shelfComments.username,
        content: shelfComments.content,
        createdAt: shelfComments.createdAt,
        userProfileImage: users.profileImageUrl,
        displayName: users.displayName
      })
      .from(shelfComments)
      .leftJoin(users, eq(shelfComments.userId, users.id))
      .where(eq(shelfComments.shelfId, shelfId))
      .orderBy(desc(shelfComments.createdAt));
    
    return res.status(200).json(comments);
  } catch (error) {
    console.error("Error fetching bookshelf comments:", error);
    return res.status(500).send("Internal server error");
  }
});

// Add a comment to a shared bookshelf
router.post("/api/bookshelves/:id/comments", async (req: Request, res: Response) => {
  const shelfId = parseInt(req.params.id);
  
  if (isNaN(shelfId)) {
    return res.status(400).send("Invalid shelf ID");
  }
  
  try {
    // Check if the shelf exists and is shared
    const shelf = await db.query.bookShelves.findFirst({
      where: eq(bookShelves.id, shelfId)
    });
    
    if (!shelf) {
      return res.status(404).send("Bookshelf not found");
    }
    
    if (!shelf.isShared) {
      return res.status(403).send("This bookshelf is not shared");
    }
    
    // Prepare comment data based on authentication status
    let commentData: any = {
      shelfId,
      content: req.body.content
    };
    
    // If user is logged in, associate comment with user
    if (req.user) {
      commentData.userId = req.user.id;
    } else if (req.body.username) {
      // For anonymous users with a provided username
      commentData.username = req.body.username;
    } else {
      // Default anonymous username
      commentData.username = "Anonymous";
    }
    
    // Validate the data
    const validatedData = insertShelfCommentSchema.parse(commentData);
    
    // Insert the comment
    const [newComment] = await db
      .insert(shelfComments)
      .values(validatedData)
      .returning();
    
    // If user is logged in, get their profile image and display name
    let userProfileImage = null;
    let displayName = null;
    if (req.user) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, req.user.id),
        columns: {
          profileImageUrl: true,
          displayName: true
        }
      });
      
      if (user) {
        userProfileImage = user.profileImageUrl;
        displayName = user.displayName;
      }
    }
    
    // Return the comment with user profile image and display name if available
    return res.status(201).json({
      ...newComment,
      userProfileImage,
      displayName
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error("Error adding bookshelf comment:", error);
    return res.status(500).send("Internal server error");
  }
});

export default router;