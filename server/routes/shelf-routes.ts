import { Router, Request, Response } from "express";
import { db } from "../db";
import { bookShelves, shelfBooks, notes, books } from "../../shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { insertBookShelfSchema, insertShelfBookSchema, insertNoteSchema } from "../../shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure directories for bookshelf cover image uploads
const uploadsDir = "./uploads";
const bookshelfCoversDir = path.join(uploadsDir, "bookshelf-covers");

// Create directories if they don't exist
[uploadsDir, bookshelfCoversDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for bookshelf cover image uploads
const bookshelfCoverStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, bookshelfCoversDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const bookshelfCoverUpload = multer({
  storage: bookshelfCoverStorage,
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

    const [newShelf] = await db
      .insert(bookShelves)
      .values({
        ...validatedData,
        userId: req.user.id,
        rank: newRank
      })
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

    const [updatedShelf] = await db
      .update(bookShelves)
      .set({
        ...validatedData,
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

    // Generate URL path for the cover image
    const coverImageUrl = `/uploads/bookshelf-covers/${req.file.filename}`;

    // Update the bookshelf with the new cover image URL
    const [updatedShelf] = await db
      .update(bookShelves)
      .set({
        coverImageUrl,
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

export default router;