import {
  Book,
  books,
  bookGenreTaxonomies,
  genreTaxonomies,
  InsertBookGenreTaxonomy,
  userGenreViews,
  viewGenres,
  ratings,
  reading_status,
  bookImages,
  BookImage,
  authors
} from "@shared/schema";
import { db } from "../db";
import { eq, and, ilike, sql, desc, not, inArray } from "drizzle-orm";
import { applyContentFilters } from "../utils/content-filters";

export interface IBookStorage {
  getBooks(): Promise<Book[]>;
  getAllBooks(): Promise<(Book & { authorName?: string })[]>; // Admin method to get all books with author names
  getBook(id: number): Promise<Book | undefined>;
  getBookByAuthorAndTitle(authorName: string, title: string): Promise<Book | undefined>;
  getBooksByAuthor(authorId: number): Promise<Book[]>;
  createBook(book: Omit<Book, "id">): Promise<Book>;
  promoteBook(id: number): Promise<Book>;
  updateBook(id: number, data: Partial<Book>): Promise<Book>;
  updateBookTaxonomies(bookId: number, taxonomyData: any[]): Promise<void>;
  getBookTaxonomies(bookId: number): Promise<{
    taxonomyId: number;
    rank: number;
    importance: number;
    name: string;
    type: string;
    description?: string;
  }[]>;
  deleteBook(id: number, authorId: number): Promise<void>;
  deleteAllAuthorBooks(userId: number): Promise<void>;
  getAuthorGenres(authorId: number): Promise<{ genre: string; count: number }[]>;
  selectBooks(query: string): Promise<Book[]>;
  updateInternalDetails(id: number, details: string): Promise<Book>;
  getRecommendations(userId: number, limit?: number): Promise<Book[]>;
  getComingSoonBooks(limit?: number): Promise<Book[]>; // New method for upcoming unreleased books
  addBookImage(image: Omit<BookImage, "id">): Promise<BookImage>; // For uploading book images
}

export class BookStorage implements IBookStorage {
  async getAllBooks(): Promise<(Book & { authorName?: string })[]> {
    try {
      // Get all books with author names for admin purposes
      const allBooks = await db
        .select({
          id: books.id,
          title: books.title,
          authorId: books.authorId,
          authorName: authors.author_name,
          description: books.description,
          promoted: books.promoted,
          pageCount: books.pageCount,
          formats: books.formats,
          publishedDate: books.publishedDate,
          awards: books.awards,
          originalTitle: books.originalTitle,
          series: books.series,
          setting: books.setting,
          characters: books.characters,
          isbn: books.isbn,
          asin: books.asin,
          language: books.language,
          referralLinks: books.referralLinks,
          impressionCount: books.impressionCount,
          clickThroughCount: books.clickThroughCount,
          lastImpressionAt: books.lastImpressionAt,
          lastClickThroughAt: books.lastClickThroughAt,
          internal_details: books.internal_details
        })
        .from(books)
        .leftJoin(authors, eq(books.authorId, authors.id))
        .orderBy(desc(books.id));
      
      return allBooks;
    } catch (error) {
      console.error('Error in getAllBooks():', error);
      return [];
    }
  }
  
  async getBooks(): Promise<Book[]> {
    try {
      // Get all books with author information
      const allBooks = await db
        .select({
          id: books.id,
          title: books.title,
          authorId: books.authorId,
          description: books.description,
          promoted: books.promoted,
          pageCount: books.pageCount,
          formats: books.formats,
          publishedDate: books.publishedDate,
          awards: books.awards,
          originalTitle: books.originalTitle,
          series: books.series,
          setting: books.setting,
          characters: books.characters,
          isbn: books.isbn,
          asin: books.asin,
          language: books.language,
          referralLinks: books.referralLinks,
          impressionCount: books.impressionCount,
          clickThroughCount: books.clickThroughCount,
          lastImpressionAt: books.lastImpressionAt,
          lastClickThroughAt: books.lastClickThroughAt,
          internal_details: books.internal_details,
          // Join author information
          authorName: authors.author_name,
          authorImageUrl: authors.author_image_url
        })
        .from(books)
        .leftJoin(authors, eq(books.authorId, authors.id));
      
      if (allBooks.length === 0) return [];
      
      // Get all books IDs
      const bookIds = allBooks.map(book => book.id);
      
      
      
      // Fetch all images for these books
      const allImages = await db.select()
        .from(bookImages)
        .where(inArray(bookImages.bookId, bookIds));
      
      
      
        
      
      // Group images by book ID for easy lookup
      const imagesByBookId = new Map<number, BookImage[]>();
      
      allImages.forEach(image => {
        if (!imagesByBookId.has(image.bookId)) {
          imagesByBookId.set(image.bookId, []);
        }
        imagesByBookId.get(image.bookId)!.push(image);
      });
      
      // Log each book's image count
      bookIds.forEach(bookId => {
        const images = imagesByBookId.get(bookId) || [];
        
      });
      
      // Add images to books and log all book objects for debugging
      const result = allBooks.map(book => ({
        ...book,
        images: imagesByBookId.get(book.id) || []
      })) as Book[];
      
      // Log one book with its complete data for debugging
      if (result.length > 0) {
        
      }
      
      return result;
    } catch (error) {
      console.error('Error in getBooks():', error);
      return [];
    }
  }

  async selectBooks(query: string): Promise<Book[]> {
    if (!query) {
      return [];
    }

    // Get author information first to include in search vector
    const booksWithAuthors = await db
      .select({
        bookId: books.id,
        authorName: authors.author_name
      })
      .from(books)
      .leftJoin(authors, eq(books.authorId, authors.id));

    // Create map of book ID to author name for easy lookup
    const authorNameByBookId = new Map<number, string>();
    booksWithAuthors.forEach(item => {
      authorNameByBookId.set(item.bookId, item.authorName || '');
    });

    // Create the search vector SQL once to avoid repetition
    const searchVector = sql`
      setweight(to_tsvector('english', coalesce(${books.title}, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(${books.description}, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(${books.internal_details}, '')), 'B')
    `;

    const searchQuery = sql`plainto_tsquery('english', ${query})`;

    const results = await db
      .select({
        id: books.id,
        title: books.title,
        description: books.description,
        internal_details: books.internal_details,
        publishedDate: books.publishedDate,
        promoted: books.promoted,
        authorId: books.authorId,
        pageCount: books.pageCount,
        formats: books.formats,
        awards: books.awards,
        originalTitle: books.originalTitle,
        series: books.series,
        setting: books.setting,
        characters: books.characters,
        isbn: books.isbn,
        asin: books.asin,
        language: books.language,
        referralLinks: books.referralLinks,
        impressionCount: books.impressionCount,
        clickThroughCount: books.clickThroughCount,
        lastImpressionAt: books.lastImpressionAt,
        lastClickThroughAt: books.lastClickThroughAt,
        search_rank: sql<number>`ts_rank(${searchVector}, ${searchQuery})`.as('search_rank')
      })
      .from(books)
      .where(sql`${searchVector} @@ ${searchQuery}`)
      .orderBy(sql`ts_rank(${searchVector}, ${searchQuery}) DESC`)
      .limit(20);
      
    // Extract all book IDs for fetching images and author info
    const bookIds = results.map(book => book.id);
    
    if (bookIds.length === 0) return [];
    
    // Fetch all images for the search results
    const allImages = await db.select()
      .from(bookImages)
      .where(inArray(bookImages.bookId, bookIds));
    
    // Fetch author information for these books
    const authorInfo = await db
      .select({
        bookId: books.id,
        authorName: authors.author_name,
        authorImageUrl: authors.author_image_url
      })
      .from(books)
      .innerJoin(authors, eq(books.authorId, authors.id))
      .where(inArray(books.id, bookIds));
    
    // Create author info map
    const authorInfoByBookId = new Map<number, { authorName: string, authorImageUrl: string | null }>();
    authorInfo.forEach(info => {
      authorInfoByBookId.set(info.bookId, {
        authorName: info.authorName,
        authorImageUrl: info.authorImageUrl
      });
    });
    
    // Group images by book ID for efficient lookup
    const imagesByBookId = new Map<number, BookImage[]>();
    
    allImages.forEach(image => {
      if (!imagesByBookId.has(image.bookId)) {
        imagesByBookId.set(image.bookId, []);
      }
      imagesByBookId.get(image.bookId)!.push(image);
    });
    
    // Add images and author info to the search results
    return results.map(({ search_rank, ...book }) => {
      const bookId = book.id;
      const authorInfo = authorInfoByBookId.get(bookId) || { authorName: '', authorImageUrl: null };
      
      return {
        ...book,
        images: imagesByBookId.get(bookId) || [],
        authorName: authorInfo.authorName,
        authorImageUrl: authorInfo.authorImageUrl
      };
    }) as Book[];
  }

  async getBook(id: number): Promise<Book | undefined> {
    
    
    // Get the book data with author information
    const [book] = await db
      .select({
        id: books.id,
        title: books.title,
        authorId: books.authorId,
        description: books.description,
        promoted: books.promoted,
        pageCount: books.pageCount,
        formats: books.formats,
        publishedDate: books.publishedDate,
        awards: books.awards,
        originalTitle: books.originalTitle,
        series: books.series,
        setting: books.setting,
        characters: books.characters,
        isbn: books.isbn,
        asin: books.asin,
        language: books.language,
        referralLinks: books.referralLinks,
        impressionCount: books.impressionCount,
        clickThroughCount: books.clickThroughCount,
        lastImpressionAt: books.lastImpressionAt,
        lastClickThroughAt: books.lastClickThroughAt,
        internal_details: books.internal_details,
        // Join author information
        authorName: authors.author_name,
        authorImageUrl: authors.author_image_url
      })
      .from(books)
      .leftJoin(authors, eq(books.authorId, authors.id))
      .where(eq(books.id, id));
    
    if (!book) {
      
      return undefined;
    }
    
    
    
    // Get the book images
    const images = await db
      .select()
      .from(bookImages)
      .where(eq(bookImages.bookId, id));
    
    
    
    // Attach the images to the book object
    const result = {
      ...book,
      images: images
    } as Book;
    
    
    
    return result;
  }

  async getBooksByAuthor(authorId: number): Promise<Book[]> {
    // Get all books by this author with author information
    const authorBooks = await db
      .select({
        id: books.id,
        title: books.title,
        authorId: books.authorId,
        description: books.description,
        promoted: books.promoted,
        pageCount: books.pageCount,
        formats: books.formats,
        publishedDate: books.publishedDate,
        awards: books.awards,
        originalTitle: books.originalTitle,
        series: books.series,
        setting: books.setting,
        characters: books.characters,
        isbn: books.isbn,
        asin: books.asin,
        language: books.language,
        referralLinks: books.referralLinks,
        impressionCount: books.impressionCount,
        clickThroughCount: books.clickThroughCount,
        lastImpressionAt: books.lastImpressionAt,
        lastClickThroughAt: books.lastClickThroughAt,
        internal_details: books.internal_details,
        // Join author information
        authorName: authors.author_name,
        authorImageUrl: authors.author_image_url
      })
      .from(books)
      .leftJoin(authors, eq(books.authorId, authors.id))
      .where(eq(books.authorId, authorId));
    
    // Get all book IDs to fetch images and taxonomies
    const bookIds = authorBooks.map(book => book.id);
    
    if (bookIds.length === 0) return [];
    
    // Fetch all images for these books in a single query for efficiency
    const allImages = await db.select()
      .from(bookImages)
      .where(inArray(bookImages.bookId, bookIds));
    
    // Group images by book ID for easy lookup
    const imagesByBookId = new Map<number, BookImage[]>();
    
    allImages.forEach(image => {
      if (!imagesByBookId.has(image.bookId)) {
        imagesByBookId.set(image.bookId, []);
      }
      imagesByBookId.get(image.bookId)!.push(image);
    });
    
    // Fetch all taxonomies for these books
    const allTaxonomiesByBook = new Map<number, any[]>();
    
    // For each book, get its taxonomies
    for (const bookId of bookIds) {
      const taxonomies = await this.getBookTaxonomies(bookId);
      allTaxonomiesByBook.set(bookId, taxonomies);
    }
    
    // Add images and taxonomies to books
    return authorBooks.map(book => ({
      ...book,
      images: imagesByBookId.get(book.id) || [],
      genreTaxonomies: allTaxonomiesByBook.get(book.id) || []
    })) as Book[];
  }

  async createBook(book: Omit<Book, "id">): Promise<Book> {
    const [newBook] = await db.insert(books).values(book).returning();
    return newBook;
  }

  async promoteBook(id: number): Promise<Book> {
    const [book] = await db
      .update(books)
      .set({ promoted: true })
      .where(eq(books.id, id))
      .returning();
    return book;
  }

  async updateBook(id: number, data: Partial<Book>): Promise<Book> {
    // Extract special fields that need separate handling
    const { genreTaxonomies, bookImages, hasAwards, authorname, bookname, ...bookData } = data as any;
    
    // Filter out any empty or undefined values to avoid SQL errors
    const cleanBookData: any = {};
    for (const key in bookData) {
      if (bookData[key] !== undefined && bookData[key] !== null && key !== "id") {
        cleanBookData[key] = bookData[key];
      }
    }
    
    // Only proceed with update if we have valid data to update
    if (Object.keys(cleanBookData).length === 0) {
      // If no valid fields to update, just return the current book
      const book = await this.getBook(id);
      return book as Book;
    }
    
    // Perform the update with clean data
    try {
      const [book] = await db
        .update(books)
        .set(cleanBookData)
        .where(eq(books.id, id))
        .returning();
      
      return book;
    } catch (error) {
      console.error(`Error updating book ${id}:`, error);
      throw error;
    }
  }
  
  async updateBookTaxonomies(bookId: number, taxonomyData: any[]): Promise<void> {
    // First, delete any existing taxonomies for this book
    await db.delete(bookGenreTaxonomies)
      .where(eq(bookGenreTaxonomies.bookId, bookId));
    
    if (taxonomyData && taxonomyData.length > 0) {
      // Then insert the new ones with their importance calculated
      const newTaxonomies = taxonomyData.map((item, index) => {
        // Calculate importance value using 1 / (1 + ln(rank))
        const rank = item.rank || index + 1;
        const importance = 1 / (1 + Math.log(rank));
        
        return {
          bookId: bookId,
          taxonomyId: item.taxonomyId,
          rank: rank,
          importance: importance.toString() // Convert to string for decimal field
        } as InsertBookGenreTaxonomy;
      });
      
      await db.insert(bookGenreTaxonomies)
        .values(newTaxonomies);
    }
  }

  async deleteBook(id: number, authorId: number): Promise<void> {
    try {
      // First, delete any related book images to avoid foreign key constraint violations
      await db
        .delete(bookImages)
        .where(eq(bookImages.bookId, id));
      
      // Next, delete any book genre taxonomies
      await db
        .delete(bookGenreTaxonomies)
        .where(eq(bookGenreTaxonomies.bookId, id));
      
      // Delete reading statuses for this book
      await db
        .delete(reading_status)
        .where(eq(reading_status.bookId, id));
        
      // Delete ratings for this book
      await db
        .delete(ratings)
        .where(eq(ratings.bookId, id));
      
      // Delete content reports for this book
      try {
        const { contentReports } = await import('../../shared/schema');
        await db.delete(contentReports).where(eq(contentReports.bookId, id));
      } catch (error) {
        console.error(`Error deleting content reports for book ${id}:`, error);
        throw error;
      }
      
      // Delete impressions for this book
      try {
        const { bookImpressions } = await import('../../shared/schema');
        await db.delete(bookImpressions).where(eq(bookImpressions.bookId, id));
      } catch (error) {
        console.error(`Error deleting impressions for book ${id}:`, error);
        // Continue with deletion even if this fails
      }
      
      // Delete click-throughs for this book
      try {
        const { bookClickThroughs } = await import('../../shared/schema');
        await db.delete(bookClickThroughs).where(eq(bookClickThroughs.bookId, id));
      } catch (error) {
        console.error(`Error deleting click-throughs for book ${id}:`, error);
        // Continue with deletion even if this fails
      }
      
      // Delete shelf_books records that reference this book
      try {
        const { shelfBooks } = await import('../../shared/schema');
        await db.delete(shelfBooks).where(eq(shelfBooks.bookId, id));
      } catch (error) {
        console.error(`Error deleting shelf book entries for book ${id}:`, error);
        throw error;
      }
      
      // Delete notes related to this book
      try {
        const { notes } = await import('../../shared/schema');
        await db.delete(notes).where(eq(notes.bookId, id));
      } catch (error) {
        console.error(`Error deleting notes for book ${id}:`, error);
        // Continue with deletion even if this fails
      }
        
      // Now it's safe to delete the book itself
      await db
        .delete(books)
        .where(and(eq(books.id, id), eq(books.authorId, authorId)));
    } catch (error) {
      console.error(`Error deleting book ${id} for author ${authorId}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete all books by an author when they revoke author status
   * @param userId The user ID of the author to delete all books for
   */
  async deleteAllAuthorBooks(userId: number): Promise<void> {
    try {
      // First, find the author record to get the author ID
      const [author] = await db
        .select()
        .from(authors)
        .where(eq(authors.userId, userId));
        
      if (!author) {
        
        return;
      }
      
      const authorId = author.id;
      
      
      // Get all books by this author
      const authorBooks = await db
        .select({ id: books.id })
        .from(books)
        .where(eq(books.authorId, authorId));
        
      const bookIds = authorBooks.map(book => book.id);
      
      
      if (bookIds.length === 0) {
        return; // No books to delete
      }
      
      // First, delete all book images for these books
      await db
        .delete(bookImages)
        .where(inArray(bookImages.bookId, bookIds));
      
      
      // Delete all book genre taxonomies
      await db
        .delete(bookGenreTaxonomies)
        .where(inArray(bookGenreTaxonomies.bookId, bookIds));
      
      
      // Delete all reading statuses
      await db
        .delete(reading_status)
        .where(inArray(reading_status.bookId, bookIds));
      
      
      // Delete all ratings
      await db
        .delete(ratings)
        .where(inArray(ratings.bookId, bookIds));
      
      
      // Delete all content reports for these books - important to handle before deleting books due to FK constraint
      try {
        // Import contentReports from schema and use it to delete related content reports
        const { contentReports } = await import('../../shared/schema');
        await db.delete(contentReports).where(inArray(contentReports.bookId, bookIds));
        
      } catch (error) {
        console.error(`Error deleting content reports for books:`, error);
        throw error;
      }
      
      // Delete all book impressions
      try {
        const { bookImpressions } = await import('../../shared/schema');
        await db.delete(bookImpressions).where(inArray(bookImpressions.bookId, bookIds));
        
      } catch (error) {
        console.error(`Error deleting book impressions:`, error);
        // Continue with deletion even if this fails
      }
      
      // Delete all book click-throughs
      try {
        const { bookClickThroughs } = await import('../../shared/schema');
        await db.delete(bookClickThroughs).where(inArray(bookClickThroughs.bookId, bookIds));
        
      } catch (error) {
        console.error(`Error deleting book click-throughs:`, error);
        // Continue with deletion even if this fails
      }
      
      // Delete all shelf_books records that reference these books
      try {
        const { shelfBooks } = await import('../../shared/schema');
        await db.delete(shelfBooks).where(inArray(shelfBooks.bookId, bookIds));
        
      } catch (error) {
        console.error(`Error deleting shelf book entries:`, error);
        throw error;
      }
      
      // Delete notes related to these books
      try {
        const { notes } = await import('../../shared/schema');
        await db.delete(notes).where(inArray(notes.bookId, bookIds));
        
      } catch (error) {
        console.error(`Error deleting notes:`, error);
        // Continue with deletion even if this fails
      }
      
      // Finally, delete the books themselves
      await db
        .delete(books)
        .where(eq(books.authorId, authorId));
      
    } catch (error) {
      console.error(`Error deleting books for author with user ID ${userId}:`, error);
      throw error;
    }
  }

  async getAuthorGenres(
    authorId: number,
  ): Promise<{ genre: string; count: number }[]> {
    // Query book_genre_taxonomies table through a join with books table
    const result = await db
      .select({
        name: genreTaxonomies.name,
        count: sql<number>`count(*)`,
      })
      .from(books)
      .innerJoin(
        bookGenreTaxonomies, 
        eq(books.id, bookGenreTaxonomies.bookId)
      )
      .innerJoin(
        genreTaxonomies,
        eq(bookGenreTaxonomies.taxonomyId, genreTaxonomies.id)
      )
      .where(and(
        eq(books.authorId, authorId),
        eq(genreTaxonomies.type, 'genre')
      ))
      .groupBy(genreTaxonomies.name)
      .orderBy(sql`count(*) DESC`);
    
    // Transform result to expected format
    return result.map(item => ({
      genre: item.name,
      count: Number(item.count)
    }));
  }

  async getBookTaxonomies(bookId: number): Promise<{
    taxonomyId: number;
    rank: number;
    importance: number;
    name: string;
    type: string;
    description?: string;
  }[]> {
    // Query book taxonomies with details from the genre_taxonomies table
    const result = await db
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
      .where(eq(bookGenreTaxonomies.bookId, bookId))
      .orderBy(bookGenreTaxonomies.rank);
    
    return result.map(item => ({
      taxonomyId: Number(item.taxonomyId),
      rank: Number(item.rank),
      importance: Number(item.importance),
      name: item.name,
      type: item.type,
      description: item.description || undefined,
    }));
  }
  
  async updateInternalDetails(id: number, details: string): Promise<Book> {
    const [book] = await db
      .update(books)
      .set({ internal_details: details })
      .where(eq(books.id, id))
      .returning();
    return book;
  }

  async addBookImage(image: Omit<BookImage, "id">): Promise<BookImage> {
    try {
      // First, check if an image of this type already exists for the book
      const existingImages = await db
        .select()
        .from(bookImages)
        .where(
          and(
            eq(bookImages.bookId, image.bookId),
            eq(bookImages.imageType, image.imageType)
          )
        );
      
      // If we found existing images of this type, delete them first
      if (existingImages.length > 0) {
        console.log(`Found ${existingImages.length} existing ${image.imageType} images for book ${image.bookId}. Deleting them.`);
        
        await db
          .delete(bookImages)
          .where(
            and(
              eq(bookImages.bookId, image.bookId),
              eq(bookImages.imageType, image.imageType)
            )
          );
      }
      
      // Now insert the new image
      console.log(`Adding book image to database: ${JSON.stringify(image)}`);
      const [newImage] = await db
        .insert(bookImages)
        .values(image)
        .returning();
      
      console.log(`Successfully added book image: ${JSON.stringify(newImage)}`);
      return newImage;
    } catch (error) {
      console.error(`Error adding book image:`, error);
      throw error;
    }
  }

  async getBookByAuthorAndTitle(authorName: string, title: string): Promise<Book | undefined> {
    
    
    // Get the book data with author information, joining the authors table
    const [book] = await db
      .select({
        id: books.id,
        title: books.title,
        authorId: books.authorId,
        description: books.description,
        promoted: books.promoted,
        pageCount: books.pageCount,
        formats: books.formats,
        publishedDate: books.publishedDate,
        awards: books.awards,
        originalTitle: books.originalTitle,
        series: books.series,
        setting: books.setting,
        characters: books.characters,
        isbn: books.isbn,
        asin: books.asin,
        language: books.language,
        referralLinks: books.referralLinks,
        impressionCount: books.impressionCount,
        clickThroughCount: books.clickThroughCount,
        lastImpressionAt: books.lastImpressionAt,
        lastClickThroughAt: books.lastClickThroughAt,
        internal_details: books.internal_details,
        // Join author information
        authorName: authors.author_name,
        authorImageUrl: authors.author_image_url
      })
      .from(books)
      .leftJoin(authors, eq(books.authorId, authors.id))
      .where(
        and(
          eq(authors.author_name, authorName),
          eq(books.title, title)
        )
      );
    
    if (!book) {
      
      return undefined;
    }
    
    
    
    // Get the book images
    const images = await db
      .select()
      .from(bookImages)
      .where(eq(bookImages.bookId, book.id));
    
    
    // Attach the images to the book object
    const result = {
      ...book,
      images: images
    } as Book;
    
    
    
    return result;
  }

  async getRecommendations(userId: number, limit: number = 40): Promise<Book[]> {
    try {
      // First, find user's default genre view
      const userViews = await db
        .select()
        .from(userGenreViews)
        .where(
          and(
            eq(userGenreViews.userId, userId),
            eq(userGenreViews.isDefault, true)
          )
        );

      // If no default view is found, return some popular books
      if (!userViews || userViews.length === 0) {
        const popularBooks = await db
          .select({
            id: books.id,
            title: books.title,
            authorId: books.authorId,
            description: books.description,
            promoted: books.promoted,
            pageCount: books.pageCount,
            formats: books.formats,
            publishedDate: books.publishedDate,
            awards: books.awards,
            originalTitle: books.originalTitle,
            series: books.series,
            setting: books.setting,
            characters: books.characters,
            isbn: books.isbn,
            asin: books.asin,
            language: books.language,
            referralLinks: books.referralLinks,
            impressionCount: books.impressionCount,
            clickThroughCount: books.clickThroughCount,
            lastImpressionAt: books.lastImpressionAt,
            lastClickThroughAt: books.lastClickThroughAt,
            internal_details: books.internal_details,
            // Join author information
            authorName: authors.author_name,
            authorImageUrl: authors.author_image_url
          })
          .from(books)
          .leftJoin(authors, eq(books.authorId, authors.id))
          .orderBy(desc(books.impressionCount))
          .limit(7);
          
        // Get all book IDs to fetch images
        const bookIds = popularBooks.map(book => book.id);
        
        if (bookIds.length === 0) return [];
        
        // Fetch all images for these books
        const allImages = await db.select()
          .from(bookImages)
          .where(inArray(bookImages.bookId, bookIds));
        
        // Group images by book ID
        const imagesByBookId = new Map<number, BookImage[]>();
        
        allImages.forEach(image => {
          if (!imagesByBookId.has(image.bookId)) {
            imagesByBookId.set(image.bookId, []);
          }
          imagesByBookId.get(image.bookId)!.push(image);
        });
        
        // Add images to books
        return popularBooks.map(book => ({
          ...book,
          images: imagesByBookId.get(book.id) || []
        })) as Book[];
      }

      const defaultView = userViews[0];
      
      // Get taxonomies from the default view
      const userGenres = await db
        .select({
          taxonomyId: viewGenres.taxonomyId,
          rank: viewGenres.rank
        })
        .from(viewGenres)
        .where(eq(viewGenres.viewId, defaultView.id))
        .orderBy(viewGenres.rank);

      // If no genres in view, return popular books
      if (!userGenres || userGenres.length === 0) {
        const popularBooks = await db
          .select({
            id: books.id,
            title: books.title,
            authorId: books.authorId,
            description: books.description,
            promoted: books.promoted,
            pageCount: books.pageCount,
            formats: books.formats,
            publishedDate: books.publishedDate,
            awards: books.awards,
            originalTitle: books.originalTitle,
            series: books.series,
            setting: books.setting,
            characters: books.characters,
            isbn: books.isbn,
            asin: books.asin,
            language: books.language,
            referralLinks: books.referralLinks,
            impressionCount: books.impressionCount,
            clickThroughCount: books.clickThroughCount,
            lastImpressionAt: books.lastImpressionAt,
            lastClickThroughAt: books.lastClickThroughAt,
            internal_details: books.internal_details,
            // Join author information
            authorName: authors.author_name,
            authorImageUrl: authors.author_image_url
          })
          .from(books)
          .leftJoin(authors, eq(books.authorId, authors.id))
          .orderBy(desc(books.impressionCount))
          .limit(7);
          
        // Get all book IDs to fetch images
        const bookIds = popularBooks.map(book => book.id);
        
        if (bookIds.length === 0) return [];
        
        // Fetch all images for these books
        const allImages = await db.select()
          .from(bookImages)
          .where(inArray(bookImages.bookId, bookIds));
        
        // Group images by book ID
        const imagesByBookId = new Map<number, BookImage[]>();
        
        allImages.forEach(image => {
          if (!imagesByBookId.has(image.bookId)) {
            imagesByBookId.set(image.bookId, []);
          }
          imagesByBookId.get(image.bookId)!.push(image);
        });
        
        // Add images to books
        return popularBooks.map(book => ({
          ...book,
          images: imagesByBookId.get(book.id) || []
        })) as Book[];
      }

      // Get books the user has already rated or completed
      const userRatedBooks = await db
        .select({ bookId: ratings.bookId })
        .from(ratings)
        .where(eq(ratings.userId, userId));
      
      const userCompletedBooks = await db
        .select({ bookId: reading_status.bookId })
        .from(reading_status)
        .where(
          and(
            eq(reading_status.userId, userId),
            eq(reading_status.isCompleted, true)
          )
        );
      
      // Combine all book IDs to exclude
      const excludedBookIds = [
        ...userRatedBooks.map(rb => rb.bookId),
        ...userCompletedBooks.map(cb => cb.bookId)
      ];

      // Extract taxonomy IDs for the query
      const taxonomyIds = userGenres.map(genre => genre.taxonomyId);

      // Calculate a weighted similarity score for each book based on user's genre preferences
      // This query performs the following steps:
      // 1. Join books with book taxonomies
      // 2. Filter only the taxonomies that match user's preferences
      // 3. Calculate a score for each book based on the taxonomies' importance and the user's ranking
      // 4. Exclude books the user has already rated or completed
      // 5. Group by book to sum up the scores
      // 6. Order by total score in descending order
      // 7. Limit to the specified number
      // 8. Select a random subset of books from the top results
      
      // We need a different approach to avoid the PostgreSQL array issues
      let bookScoresQuery = sql`
        WITH book_scores AS (
          SELECT 
            b.id,
            SUM(
              bgt.importance::float * (1.0 / (vg.rank::float + 0.1))
            ) AS score
          FROM 
            books b
          JOIN 
            book_genre_taxonomies bgt ON b.id = bgt.book_id
          JOIN 
            view_genres vg ON bgt.taxonomy_id = vg.taxonomy_id
          WHERE 
            vg.view_id = ${defaultView.id}
      `;
      
      // Add taxonomy filter using multiple conditions instead of ANY operator
      if (taxonomyIds.length > 0) {
        const taxonomyConditions = taxonomyIds.map(id => `bgt.taxonomy_id = ${id}`).join(' OR ');
        bookScoresQuery = sql`${bookScoresQuery} AND (${sql.raw(taxonomyConditions)})`;
      }
      
      // Add exclusion filter if there are books to exclude
      if (excludedBookIds.length > 0) {
        const exclusionConditions = excludedBookIds.map(id => `b.id <> ${id}`).join(' AND ');
        bookScoresQuery = sql`${bookScoresQuery} AND (${sql.raw(exclusionConditions)})`;
      }
      
      bookScoresQuery = sql`${bookScoresQuery}
          GROUP BY 
            b.id
          ORDER BY 
            score DESC
          LIMIT ${limit}
        )
        SELECT 
          b.*,
          a.author_name,
          a.author_image_url,
          bs.score
        FROM 
          book_scores bs
        JOIN 
          books b ON bs.id = b.id
        LEFT JOIN
          authors a ON b.author_id = a.id
        ORDER BY 
          RANDOM()
        LIMIT 7
      `;
      
      const bookScores = await db.execute(bookScoresQuery);

      // Get all book IDs from the results
      let bookIds = bookScores.rows.map(row => row.id);
      
      if (bookIds.length === 0) return [];
      
      // Apply content filtering to book IDs
      
      bookIds = await applyContentFilters(userId, bookIds);
      
      
      if (bookIds.length === 0) return [];
      
      // Filter bookScores to only include books that passed content filtering
      const filteredBookScores = bookScores.rows.filter(row => bookIds.includes(row.id));
      
      // Fetch all images for these books
      const allImages = await db.select()
        .from(bookImages)
        .where(inArray(bookImages.bookId, bookIds));
      
      // Group images by book ID for efficient lookup
      const imagesByBookId = new Map<number, BookImage[]>();
      
      allImages.forEach(image => {
        if (!imagesByBookId.has(image.bookId)) {
          imagesByBookId.set(image.bookId, []);
        }
        imagesByBookId.get(image.bookId)!.push(image);
      });
      
      // Extract books from the filtered results and add image data
      return filteredBookScores.map(row => ({
        id: row.id,
        title: row.title,
        description: row.description,
        authorId: row.author_id,
        publishedDate: row.published_date,
        promoted: row.promoted,
        pageCount: row.page_count,
        formats: row.formats || [],
        awards: row.awards || [],
        originalTitle: row.original_title,
        series: row.series,
        setting: row.setting,
        characters: row.characters,
        isbn: row.isbn,
        asin: row.asin,
        language: row.language,
        referralLinks: row.referral_links || [],
        impressionCount: row.impression_count || 0,
        clickThroughCount: row.click_through_count || 0,
        lastImpressionAt: row.last_impression_at,
        lastClickThroughAt: row.last_click_through_at,
        internal_details: row.internal_details,
        // Add author information from the join
        authorName: row.author_name || '',
        authorImageUrl: row.author_image_url,
        // Add images array
        images: imagesByBookId.get(row.id) || []
      }));
    } catch (error) {
      console.error("Error getting recommendations:", error);
      // Fall back to popular books if there's an error
      const popularBooks = await db
        .select({
          id: books.id,
          title: books.title,
          authorId: books.authorId,
          description: books.description,
          promoted: books.promoted,
          pageCount: books.pageCount,
          formats: books.formats,
          publishedDate: books.publishedDate,
          awards: books.awards,
          originalTitle: books.originalTitle,
          series: books.series,
          setting: books.setting,
          characters: books.characters,
          isbn: books.isbn,
          asin: books.asin,
          language: books.language,
          referralLinks: books.referralLinks,
          impressionCount: books.impressionCount,
          clickThroughCount: books.clickThroughCount,
          lastImpressionAt: books.lastImpressionAt,
          lastClickThroughAt: books.lastClickThroughAt,
          internal_details: books.internal_details,
          // Join author information
          authorName: authors.author_name,
          authorImageUrl: authors.author_image_url
        })
        .from(books)
        .leftJoin(authors, eq(books.authorId, authors.id))
        .orderBy(desc(books.impressionCount))
        .limit(7);
      
      if (popularBooks.length === 0) return [];
      
      // Get all book IDs
      let bookIds = popularBooks.map(book => book.id);
      
      if (bookIds.length === 0) return [];
      
      // Apply content filtering to book IDs
      
      bookIds = await applyContentFilters(userId, bookIds);
      
      
      if (bookIds.length === 0) return [];
      
      // Filter popularBooks to only include books that passed content filtering
      const filteredBooks = popularBooks.filter(book => bookIds.includes(book.id));
      
      // Fetch all images for these books
      const allImages = await db.select()
        .from(bookImages)
        .where(inArray(bookImages.bookId, bookIds));
      
      // Group images by book ID
      const imagesByBookId = new Map<number, BookImage[]>();
      
      allImages.forEach(image => {
        if (!imagesByBookId.has(image.bookId)) {
          imagesByBookId.set(image.bookId, []);
        }
        imagesByBookId.get(image.bookId)!.push(image);
      });
      
      // Add images to books
      return filteredBooks.map(book => ({
        ...book,
        images: imagesByBookId.get(book.id) || []
      })) as Book[];
    }
  }
  
  /**
   * Get upcoming books with future publication dates
   * @param limit Maximum number of books to return
   * @returns Array of books with publication dates in the future
   */
  async getComingSoonBooks(limit = 10): Promise<Book[]> {
    try {
      const currentDate = new Date();
      
      // Query books with publication dates in the future
      const comingSoonBooks = await db
        .select({
          id: books.id,
          title: books.title,
          authorId: books.authorId,
          description: books.description,
          promoted: books.promoted,
          pageCount: books.pageCount,
          formats: books.formats,
          publishedDate: books.publishedDate,
          awards: books.awards,
          originalTitle: books.originalTitle,
          series: books.series,
          setting: books.setting,
          characters: books.characters,
          isbn: books.isbn,
          asin: books.asin,
          language: books.language,
          referralLinks: books.referralLinks,
          impressionCount: books.impressionCount,
          clickThroughCount: books.clickThroughCount,
          lastImpressionAt: books.lastImpressionAt,
          lastClickThroughAt: books.lastClickThroughAt,
          internal_details: books.internal_details,
          // Join author information
          authorName: authors.author_name,
          authorImageUrl: authors.author_image_url
        })
        .from(books)
        .leftJoin(authors, eq(books.authorId, authors.id))
        .where(and(
          // Only include books with publication dates in the future
          sql`${books.publishedDate} > ${currentDate}::date`,
          // Ensure publication date is not null
          sql`${books.publishedDate} IS NOT NULL`
        ))
        .orderBy(books.publishedDate) // Order by closest publication date first
        .limit(limit);
      
      if (comingSoonBooks.length === 0) return [];
      
      // Get all books IDs
      const bookIds = comingSoonBooks.map(book => book.id);
      
      // Fetch all images for these books
      const allImages = await db.select()
        .from(bookImages)
        .where(inArray(bookImages.bookId, bookIds));
      
      // Group images by book ID for easy lookup
      const imagesByBookId = new Map<number, BookImage[]>();
      
      allImages.forEach(image => {
        if (!imagesByBookId.has(image.bookId)) {
          imagesByBookId.set(image.bookId, []);
        }
        imagesByBookId.get(image.bookId)!.push(image);
      });
      
      // Add images to books
      return comingSoonBooks.map(book => ({
        ...book,
        images: imagesByBookId.get(book.id) || []
      })) as Book[];
    } catch (error) {
      console.error('Error in getComingSoonBooks():', error);
      return [];
    }
  }
}