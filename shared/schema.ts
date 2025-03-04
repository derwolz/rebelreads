import { pgTable, text, serial, integer, timestamp, boolean, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const RETAILER_OPTIONS = [
  "Amazon",
  "Barnes & Noble",
  "Book Depository",
  "IndieBound",
  "Waterstones",
  "Custom"
] as const;

export const referralLinkSchema = z.object({
  retailer: z.enum(RETAILER_OPTIONS),
  url: z.string().url("Please enter a valid URL"),
  customName: z.string().optional(),
});

export type ReferralLink = z.infer<typeof referralLinkSchema>;

export const FORMAT_OPTIONS = ["softback", "hardback", "digital", "audiobook"] as const;

export const AVAILABLE_GENRES = ["fantasy", "science fiction", "mystery", "romance", "thriller"] as const;

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
  authorImageUrl: text("author_image_url"), // Author profile image
  profileImageUrl: text("profile_image_url"), // General user profile image
  bio: text("bio"), // General user bio
  birthDate: date("birth_date"),
  deathDate: date("death_date"),
  website: text("website"),
});

export const followers = pgTable("followers", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(), // The user who is following
  followingId: integer("following_id").notNull(), // The author being followed
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
  pageCount: integer("page_count"),
  formats: text("formats").array().notNull(), // Array of formats (softback, hardback, etc)
  publishedDate: date("published_date"),
  awards: text("awards").array(),
  originalTitle: text("original_title"),
  series: text("series"),
  setting: text("setting"),
  characters: text("characters").array(),
  isbn: text("isbn"),
  asin: text("asin"),
  language: text("language").notNull().default("English"),
  referralLinks: jsonb("referral_links").default([]),
});

export interface ReviewAnalysis {
  sentiment: {
    label: string;
    score: number;
  };
  themes: Array<{
    label: string;
    score: number;
  }>;
}

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
  analysis: jsonb("analysis").$type<ReviewAnalysis>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
  birthDate: true,
  deathDate: true,
  website: true,
  profileImageUrl: true,
  bio: true,
}).extend({
  email: z.string().email("Invalid email format"),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
  website: z.string().url("Please enter a valid URL").optional().nullable(),
  deathDate: z.date().optional().nullable(),
  profileImageUrl: z.string().url("Please enter a valid URL").optional().nullable(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional().nullable(),
});

export const insertBookSchema = createInsertSchema(books).extend({
  genres: z.array(z.string()).min(1, "At least one genre is required"),
  formats: z.array(z.enum(FORMAT_OPTIONS)).min(1, "At least one format is required"),
  publishedDate: z.date().optional(),
  pageCount: z.number().min(1, "Page count must be at least 1").optional(),
  awards: z.array(z.string()).optional(),
  characters: z.array(z.string()).optional(),
  language: z.string().optional(),
  referralLinks: z.array(referralLinkSchema).optional(),
});

export const insertRatingSchema = createInsertSchema(ratings);
export const insertBookshelfSchema = createInsertSchema(bookshelves);
export const insertFollowerSchema = createInsertSchema(followers);

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
export type Follower = typeof followers.$inferSelect;

export function calculateWeightedRating(rating: Rating): number {
  return (
    rating.enjoyment * 0.3 +     // 30% weight for enjoyment
    rating.writing * 0.2 +       // 20% weight for writing
    rating.themes * 0.2 +        // 20% weight for themes
    rating.characters * 0.1 +    // 10% weight for characters
    rating.worldbuilding * 0.1   // 10% weight for worldbuilding
  );
}