import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password"),
  newsletterOptIn: boolean("newsletter_opt_in").notNull().default(false),
  provider: text("provider"), // google, amazon, x, or null for email/password
  providerId: text("provider_id"), // external provider's user ID
  isAuthor: boolean("is_author").notNull().default(false),
  authorName: text("author_name"), // Name to display for authored books
  authorBio: text("author_bio"),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  authorId: integer("author_id").notNull(), // Reference to users table
  description: text("description").notNull(),
  coverUrl: text("cover_url").notNull(),
  authorImageUrl: text("author_image_url"),
  promoted: boolean("promoted").default(false),
  genres: text("genres").array().notNull(), // Array of genre strings
});

export const ratings = pgTable("ratings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  enjoyment: integer("enjoyment").notNull(),
  writing: integer("writing").notNull(),
  themes: integer("themes").notNull(),
  characters: integer("characters").notNull(),
  worldbuilding: integer("worldbuilding").notNull(),
  review: text("review"),
});

export const bookshelves = pgTable("bookshelves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  status: text("status").notNull(), // reading, want-to-read, read
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  newsletterOptIn: true,
}).extend({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const updateProfileSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  authorName: true,
  authorBio: true,
}).extend({
  email: z.string().email("Invalid email format"),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
});

export const insertBookSchema = createInsertSchema(books).extend({
  genres: z.array(z.string()).min(1, "At least one genre is required"),
});

export const insertRatingSchema = createInsertSchema(ratings);
export const insertBookshelfSchema = createInsertSchema(bookshelves);

export const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type User = typeof users.$inferSelect;
export type Book = typeof books.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type Bookshelf = typeof bookshelves.$inferSelect;

export function calculateWeightedRating(rating: Rating): number {
  return (
    rating.enjoyment * 0.3 +
    rating.writing * 0.3 +
    rating.themes * 0.2 +
    rating.characters * 0.1 +
    rating.worldbuilding * 0.1
  );
}

export const AVAILABLE_GENRES = ["fantasy", "science fiction", "mystery", "romance", "thriller"] as const;