import { pgTable, text, serial, integer, timestamp, boolean, date, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const SOCIAL_MEDIA_PLATFORMS = [
  "Twitter",
  "Instagram",
  "Facebook",
  "LinkedIn",
  "GitHub",
  "Custom"
] as const;

export const socialMediaLinkSchema = z.object({
  platform: z.enum(SOCIAL_MEDIA_PLATFORMS),
  url: z.string().url("Please enter a valid URL"),
  customName: z.string().optional(),
});

export type SocialMediaLink = z.infer<typeof socialMediaLinkSchema>;

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

export const AVAILABLE_GENRES = [
  "Fantasy",
  "Science Fiction",
  "Mystery",
  "Romance",
  "Thriller",
  "Horror",
  "Literary Fiction",
  "Historical Fiction",
  "Young Adult",
  "Biography",
  "Non-fiction",
  "Poetry",
  "Drama",
  "Adventure",
  "Crime"
] as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password"),
  newsletterOptIn: boolean("newsletter_opt_in").notNull().default(false),
  provider: text("provider"),
  providerId: text("provider_id"),
  isAuthor: boolean("is_author").notNull().default(false),
  isPublisher: boolean("is_publisher").notNull().default(false),
  authorName: text("author_name"),
  authorBio: text("author_bio"),
  authorImageUrl: text("author_image_url"),
  profileImageUrl: text("profile_image_url"),
  bio: text("bio"),
  birthDate: date("birth_date"),
  deathDate: date("death_date"),
  website: text("website"),
  favoriteGenres: text("favorite_genres").array(),
  displayName: text("display_name"),
  socialMediaLinks: jsonb("social_media_links").$type<SocialMediaLink[]>().default([]),
  publisherName: text("publisher_name"),
  publisherDescription: text("publisher_description"),
  businessEmail: text("business_email"),
  businessPhone: text("business_phone"),
  businessAddress: text("business_address"),
});

export const followers = pgTable("followers", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(),
  followingId: integer("following_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  authorId: integer("author_id").notNull(),
  description: text("description").notNull(),
  coverUrl: text("cover_url").notNull(),
  authorImageUrl: text("author_image_url"),
  promoted: boolean("promoted").default(false),
  genres: text("genres").array().notNull(),
  pageCount: integer("page_count"),
  formats: text("formats").array().notNull(),
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
  impressionCount: integer("impression_count").notNull().default(0),
  clickThroughCount: integer("click_through_count").notNull().default(0),
  lastImpressionAt: timestamp("last_impression_at"),
  lastClickThroughAt: timestamp("last_click_through_at"),
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
  featured: boolean("featured").default(false),
  report_status: text("report_status").default("none"),
  report_reason: text("report_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  authorId: integer("author_id").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const replies = pgTable("replies", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  authorId: integer("author_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reading_status = pgTable("reading_status", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  isWishlisted: boolean("is_wishlisted").notNull().default(false),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
});

export const bookImpressions = pgTable("book_impressions", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull(),
  userId: integer("user_id"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  source: text("source").notNull(),
  context: text("context").notNull(),
});

export const bookClickThroughs = pgTable("book_click_throughs", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull(),
  userId: integer("user_id"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  source: text("source").notNull(),
  referrer: text("referrer"),
});

export const publishers = pgTable("publishers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  website: text("website"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const publishersAuthors = pgTable("publishers_authors", {
  id: serial("id").primaryKey(),
  publisherId: integer("publisher_id").notNull(),
  authorId: integer("author_id").notNull(),
  contractStart: timestamp("contract_start").notNull(),
  contractEnd: timestamp("contract_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  newsletterOptIn: true,
  isAuthor: true,
}).extend({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  isAuthor: z.boolean().default(false),
});

export const updateProfileSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  displayName: true,
  bio: true,
  profileImageUrl: true,
  favoriteGenres: true,
  socialMediaLinks: true,
}).extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email format"),
  currentPassword: z.string().optional(),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .optional(),
  confirmPassword: z.string().optional(),
  socialMediaLinks: z.array(socialMediaLinkSchema).max(4, "Maximum 4 social media links allowed").optional(),
}).refine((data) => {
  if (data.newPassword || data.currentPassword || data.confirmPassword) {
    return data.newPassword && data.currentPassword && data.confirmPassword;
  }
  return true;
}, {
  message: "All password fields are required when changing password",
}).refine((data) => {
  if (data.newPassword && data.confirmPassword) {
    return data.newPassword === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords do not match",
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
  impressionCount: z.number().int().min(0).default(0),
  clickThroughCount: z.number().int().min(0).default(0),
});

export const insertRatingSchema = createInsertSchema(ratings);
export const insertReadingStatusSchema = createInsertSchema(reading_status);
export const insertFollowerSchema = createInsertSchema(followers);
export const insertImpressionSchema = createInsertSchema(bookImpressions);
export const insertClickThroughSchema = createInsertSchema(bookClickThroughs);

export const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export const insertPublisherSchema = createInsertSchema(publishers, {
  name: z.string().min(1, "Publisher name is required"),
  description: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional(),
  logoUrl: z.string().optional(),
});

export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull().default("active"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  spent: decimal("spent").notNull().default("0"),
  budget: decimal("budget").notNull(),
  keywords: text("keywords").array(),
  adType: text("ad_type"),
  authorId: integer("author_id").notNull(),
  metrics: jsonb("metrics").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const campaignBooks = pgTable("campaign_books", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  bookId: integer("book_id").notNull(),
});

export const insertCampaignSchema = createInsertSchema(campaigns, {
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
}).extend({
  books: z.array(z.number()).min(1, "At least one book must be selected"),
  keywords: z.array(z.string()).optional(),
  type: z.enum(["ad", "survey", "review_boost"]),
  status: z.enum(["active", "completed", "paused"]).default("active"),
  adType: z.enum(["banner", "feature"]).optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type User = typeof users.$inferSelect;
export type Book = typeof books.$inferSelect;
export type Rating = typeof ratings.$inferSelect;
export type ReadingStatus = typeof reading_status.$inferSelect;
export type InsertReadingStatus = typeof reading_status.$inferInsert;
export type Follower = typeof followers.$inferSelect;
export type BookImpression = typeof bookImpressions.$inferSelect;
export type BookClickThrough = typeof bookClickThroughs.$inferSelect;
export type InsertBookImpression = typeof bookImpressions.$inferInsert;
export type InsertBookClickThrough = typeof bookClickThroughs.$inferInsert;
export type InsertBook = typeof books.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Publisher = typeof publishers.$inferSelect;
export type InsertPublisher = z.infer<typeof insertPublisherSchema>;
export type PublisherAuthor = typeof publishersAuthors.$inferSelect;

export const publisherRegistrationSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  newsletterOptIn: true,
}).extend({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  publisherName: z.string().min(2, "Publisher name must be at least 2 characters"),
  description: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional(),
  businessEmail: z.string().email("Invalid business email format"),
  businessPhone: z.string().optional(),
  businessAddress: z.string().optional(),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type PublisherRegistration = z.infer<typeof publisherRegistrationSchema>;

export function calculateWeightedRating(rating: Rating): number {
  return (
    rating.enjoyment * 0.3 +
    rating.writing * 0.2 +
    rating.themes * 0.2 +
    rating.characters * 0.1 +
    rating.worldbuilding * 0.1
  );
}