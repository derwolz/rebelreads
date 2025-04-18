import { Router } from 'express';
import { db } from '../db';
import { books, authors } from '@shared/schema';
import { sql } from 'drizzle-orm';

// Define author type for type safety
type AuthorInfo = {
  id: number;
  name: string;
  bio: string | null;
  imageUrl: string | null;
};

export function registerRandomBookRoutes(router: Router) {
  // Get a random book with all its images
  router.get('/api/books/random', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 1;
      
      // Get random books with all their images and author info
      const randomBooks = await db.query.books.findMany({
        with: {
          images: true,
          author: {
            columns: {
              id: true,
              name: true,
              bio: true,
              imageUrl: true
            }
          }
        },
        limit,
        orderBy: sql`RANDOM()`
      });

      if (randomBooks.length === 0) {
        return res.status(404).json({ error: 'No books found' });
      }

      // Transform the response to include author information
      const booksWithAuthor = randomBooks.map(book => {
        const { author, ...bookData } = book;
        return {
          ...bookData,
          authorName: author ? (author as any).name : 'Unknown Author',
          authorImageUrl: author ? (author as any).imageUrl : null
        };
      });

      res.json(booksWithAuthor);
    } catch (error) {
      console.error('Error fetching random book:', error);
      res.status(500).json({ error: 'Failed to fetch random book' });
    }
  });
}