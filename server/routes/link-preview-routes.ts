import express from "express";
import fetch from "node-fetch";

// Define types for the API responses
interface UserResponse {
  id: number;
  username: string;
  displayName: string | null;
  profileImageUrl: string | null;
}

interface ShelfResponse {
  shelf: {
    id: number;
    userId: number;
    title: string;
    coverImageUrl: string;
    rank: number;
    isShared: boolean;
    createdAt: string;
    updatedAt: string;
  };
  owner: {
    id: number;
    username: string;
    displayName?: string;
    profileImageUrl?: string;
  };
  books: any[];
}

const router = express.Router();

// GET /api/link-preview/book-shelf - Public endpoint for previewing shared bookshelves
router.get("/book-shelf", async (req, res) => {
  try {
    const { username, shelfname } = req.query;

    if (!username || !shelfname) {
      return res.status(400).json({ error: "Missing username or shelfname" });
    }

    // First get the user info as we'll need it for the display name
    const userResponse = await fetch(`http://localhost:${process.env.PORT}/api/users/by-username/${encodeURIComponent(username as string)}`);
    
    if (!userResponse.ok) {
      return res.status(404).json({ error: "User not found" });
    }
    
    const userData = await userResponse.json() as UserResponse;
    
    // Now get the bookshelf data
    const shelfResponse = await fetch(
      `http://localhost:${process.env.PORT}/api/book-shelf?username=${
        encodeURIComponent(username as string)
      }&shelfname=${
        encodeURIComponent(shelfname as string)
      }`
    );
    
    if (!shelfResponse.ok) {
      return res.status(404).json({ error: "Bookshelf not found or not shared" });
    }
    
    const shelfData = await shelfResponse.json() as ShelfResponse;
    
    // Make sure it's a shared bookshelf
    if (!shelfData.shelf || !shelfData.shelf.isShared) {
      return res.status(404).json({ error: "Bookshelf not found or not shared" });
    }
    
    // Add user display name to the response
    const owner = {
      ...shelfData.owner,
      displayName: userData.displayName || userData.username
    };
    
    // Return only the data needed for preview
    return res.json({
      shelf: shelfData.shelf,
      owner,
      books: [] // Not needed for preview
    });
  } catch (error) {
    console.error("Error in bookshelf preview:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET /api/link-preview/books/:id - Public endpoint for previewing books
router.get("/books/:id", async (req, res) => {
  try {
    const bookId = req.params.id;
    
    // Fetch the book data from the existing API
    const bookResponse = await fetch(`http://localhost:${process.env.PORT}/api/books/${bookId}`);
    
    if (!bookResponse.ok) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    const book = await bookResponse.json();
    
    // Return the book data as is - it should already have images
    return res.json(book);
  } catch (error) {
    console.error("Error in book preview:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;