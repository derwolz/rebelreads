import { pgTable, text, serial, integer, timestamp, boolean, date, jsonb, decimal, varchar, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { validateEmail, isDisposableEmail, isSuspiciousLocalPart } from './utils/email-validator';

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
  domain: z.string().optional(), // Store the extracted domain name
  faviconUrl: z.string().optional(), // Store the URL to the website's favicon
});

export type ReferralLink = z.infer<typeof referralLinkSchema>;

export const FORMAT_OPTIONS = ["softback", "hardback", "digital", "audiobook"] as const;
export type BookFormatType = typeof FORMAT_OPTIONS[number];

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

export const RATING_CRITERIA = [
  "enjoyment",
  "writing",
  "themes",
  "characters",
  "worldbuilding"
] as const;

export const RATING_CRITERIA_DESCRIPTIONS = {
  enjoyment: "A measurement of how engaging the novel is. Fun, memorable, entertaining.",
  writing: "A measurement of wordchoice, plot, style, overall skill in presenting the book.",
  characters: "A measurement of how well characters are portrayed. The characters are interesting, engaging, real.",
  themes: "A measurement of the ideas. Are they well explored, or interesting.",
  worldbuilding: "A measurement of the world. Magic systems true to mechanics, physics, general believability of elements."
} as const;

export const DEFAULT_RATING_WEIGHTS = {
  enjoyment: 0.35,
  writing: 0.25,
  themes: 0.2,
  characters: 0.12,
  worldbuilding: 0.08
} as const;

// Rating sentiment thresholds with count requirements
export type SentimentLevel = 
  | "overwhelmingly_negative" 
  | "very_negative" 
  | "mostly_negative" 
  | "mixed" 
  | "mostly_positive" 
  | "very_positive" 
  | "overwhelmingly_positive";

export type RatingSentimentThresholds = {
  sentimentLevel: SentimentLevel;
  ratingMin: number;
  ratingMax: number;
  requiredCount: number;
}

// Table to store the sentiment threshold configuration
export const ratingSentimentThresholds = pgTable("rating_sentiment_thresholds", {
  id: serial("id").primaryKey(),
  criteriaName: text("criteria_name").notNull(), // enjoyment, writing, themes, characters, worldbuilding
  sentimentLevel: text("sentiment_level").notNull(), // Maps to SentimentLevel type
  ratingMin: decimal("rating_min").notNull(),
  ratingMax: decimal("rating_max").notNull(),
  requiredCount: integer("required_count").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Base users table with common authentication and profile fields
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password"),
  newsletterOptIn: boolean("newsletter_opt_in").notNull().default(false),
  provider: text("provider"), // google, amazon, x, or null for email/password
  providerId: text("provider_id"), // external provider's user ID
  profileImageUrl: text("profile_image_url"), // General user profile image
  bio: text("bio"), // General user bio
  displayName: text("display_name"), // Added display name field
  socialLinks: jsonb("social_links").$type<SocialMediaLink[]>().default([]),
  socialMediaLinks: jsonb("social_media_links").$type<SocialMediaLink[]>().default([]),
  credits: decimal("credits").notNull().default("0"), // Credits for users
  is_pro: boolean("is_pro").notNull().default(false), // Pro user status
  pro_expires_at: timestamp("pro_expires_at"), // When pro subscription expires
  hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
});

// Authors table with author-specific information
export const authors = pgTable("authors", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  author_name: text("author_name").notNull(), // Name to display for authored books
  author_image_url: text("author_image_url"), // Author profile image
  birth_date: date("birth_date"),
  death_date: date("death_date"),
  website: text("website"),
  bio: text("bio"), // Author-specific bio
  socialMediaLinks: jsonb("social_media_links").default([]), // Author social media links
});

// Publisher-specific information is contained in the publishers table already defined below

// Define experience action types for users and authors
export const USER_EXPERIENCE_ACTIONS = [
  "leave_rating",           // When a user rates a book
  "leave_review",           // When a user writes a review
  "book_completed",         // When a user marks a book as completed
  "referral_click",         // When a user clicks on a referral link
  "follow_author",          // When a user follows an author
  "create_bookshelf",       // When a user creates a bookshelf
  "share_bookshelf",        // When a user shares a bookshelf
  "daily_login",            // When a user logs in daily
  "profile_completion",     // When a user completes their profile
  "comment_on_shelf"        // When a user comments on a bookshelf
] as const;

export const AUTHOR_EXPERIENCE_ACTIONS = [
  "publish_book",           // When an author publishes a book
  "receive_rating",         // When an author's book receives a rating
  "receive_review",         // When an author's book receives a review
  "referral_conversion",    // When someone clicks on an author's book referral link
  "gain_follower",          // When an author gains a follower
  "respond_to_review",      // When an author responds to a review
  "author_bash_submission", // When an author participates in Author Bash
  "update_book",            // When an author updates book details
  "daily_login",            // When an author logs in daily
  "profile_completion"      // When an author completes their profile
] as const;

// Experience levels table for users
export const userLevels = pgTable("user_levels", {
  level: integer("level").primaryKey(),
  experienceRequired: integer("experience_required").notNull(), // Total XP needed to reach this level
  title: text("title").notNull(), // Title displayed for this level
  benefits: jsonb("benefits").default({}), // Benefits unlocked at this level (JSON)
  description: text("description"), // Description of what this level means
  iconUrl: text("icon_url"), // Icon URL for this level
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Experience levels table for authors
export const authorLevels = pgTable("author_levels", {
  level: integer("level").primaryKey(),
  experienceRequired: integer("experience_required").notNull(), // Total XP needed to reach this level
  title: text("title").notNull(), // Title displayed for this level
  benefits: jsonb("benefits").default({}), // Benefits unlocked at this level (JSON)
  description: text("description"), // Description of what this level means
  iconUrl: text("icon_url"), // Icon URL for this level
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// User experience records
export const userExperience = pgTable("user_experience", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // One of USER_EXPERIENCE_ACTIONS
  amount: integer("amount").notNull(), // Amount of XP gained
  metadata: jsonb("metadata").default({}), // Additional context (target book, etc)
  timestamp: timestamp("timestamp").notNull().defaultNow()
});

// Author experience records
export const authorExperience = pgTable("author_experience", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => authors.id),
  action: text("action").notNull(), // One of AUTHOR_EXPERIENCE_ACTIONS
  amount: integer("amount").notNull(), // Amount of XP gained
  metadata: jsonb("metadata").default({}), // Additional context (target book, etc)
  timestamp: timestamp("timestamp").notNull().defaultNow()
});

// Badges table - for both users and authors
export const badges = pgTable("badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  iconUrl: text("icon_url").notNull(),
  type: text("type").notNull(), // 'user' or 'author'
  rarity: text("rarity").notNull(), // 'common', 'rare', 'epic', 'legendary'
  requirements: jsonb("requirements").default({}), // JSON with badge requirements
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// User badges relation table
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  badgeId: integer("badge_id").notNull().references(() => badges.id),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  isEquipped: boolean("is_equipped").default(false) // Whether the badge is currently displayed
});

// Author badges relation table
export const authorBadges = pgTable("author_badges", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => authors.id),
  badgeId: integer("badge_id").notNull().references(() => badges.id),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  isEquipped: boolean("is_equipped").default(false) // Whether the badge is currently displayed
});

// Titles table - for both users and authors
export const titles = pgTable("titles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // 'user' or 'author'
  requirements: jsonb("requirements").default({}), // JSON with title requirements
  createdAt: timestamp("created_at").notNull().defaultNow()
});

// User titles relation table
export const userTitles = pgTable("user_titles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  titleId: integer("title_id").notNull().references(() => titles.id),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  isEquipped: boolean("is_equipped").default(false) // Whether the title is currently displayed
});

// Author titles relation table
export const authorTitles = pgTable("author_titles", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull().references(() => authors.id),
  titleId: integer("title_id").notNull().references(() => titles.id),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  isEquipped: boolean("is_equipped").default(false) // Whether the title is currently displayed
});

// Track current experience and level for users
export const userProgression = pgTable("user_progression", {
  userId: integer("user_id").primaryKey().references(() => users.id),
  currentExperience: integer("current_experience").notNull().default(0),
  currentLevel: integer("current_level").notNull().default(1).references(() => userLevels.level),
  activeTitleId: integer("active_title_id").references(() => titles.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

// Track current experience and level for authors
export const authorProgression = pgTable("author_progression", {
  authorId: integer("author_id").primaryKey().references(() => authors.id),
  currentExperience: integer("current_experience").notNull().default(0),
  currentLevel: integer("current_level").notNull().default(1).references(() => authorLevels.level),
  activeTitleId: integer("active_title_id").references(() => titles.id),
  updatedAt: timestamp("updated_at").notNull().defaultNow()
});

export const followers = pgTable("followers", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(), // The user who is following
  followingId: integer("following_id").notNull(), // The author being followed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"), // Add deletedAt field for tracking unfollows
});

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  authorId: integer("author_id").notNull().references(() => authors.id), // Reference to authors table
  description: text("description").notNull(),
  // coverUrl column removed - using book_images table instead
  // author name and authorImageUrl removed - these come from the authors table now
  promoted: boolean("promoted").default(false),
  // genres column removed - using book_genre_taxonomies relationship table instead
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
  impressionCount: integer("impression_count").notNull().default(0),
  clickThroughCount: integer("click_through_count").notNull().default(0),
  lastImpressionAt: timestamp("last_impression_at"),
  lastClickThroughAt: timestamp("last_click_through_at"),
  internal_details: text("internal_details"), // Added new field
});

// Define the image types for books
// We require the user to upload 4 types, and the other 3 are generated
export const UPLOAD_IMAGE_TYPES = [
  "background",     // 1300x1500 - Used as background on book details page
  "spine",          // 56x256 - Used in grid layouts (renamed from grid-item)
  "hero",           // 1500x600 - Used in hero sections
  "full"            // 1600x2560 - Full resolution book cover image
] as const;

// All image types including auto-generated ones
export const IMAGE_TYPES = [
  ...UPLOAD_IMAGE_TYPES,
  "book-cover",     // 480x770 - Auto-generated from full
  "book-card",      // 256x412 - Auto-generated from full
  "mini",           // 60x96 - Auto-generated from full (tall, not wide)
  "vertical-banner", // Additional banner format
  "horizontal-banner", // Additional banner format
] as const;

// Book images table to store different image sizes for each book
export const bookImages = pgTable("book_images", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => books.id),
  imageUrl: text("image_url").notNull(),
  imageType: text("image_type").notNull(), // One of IMAGE_TYPES
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  sizeKb: integer("size_kb"), // Size of image in kilobytes
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Schema for inserting book images
export const insertBookImageSchema = createInsertSchema(bookImages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for image data in book upload
export const imageUploadSchema = z.object({
  file: z.any(), // File object (will be handled by multer)
  type: z.enum(UPLOAD_IMAGE_TYPES),
  width: z.number(),
  height: z.number(),
});

// Define the book image types
export type BookImage = typeof bookImages.$inferSelect;
export type InsertBookImage = typeof bookImages.$inferInsert;

// Book files table to store different file formats for each book
export const bookFiles = pgTable("book_files", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => books.id),
  fileUrl: text("file_url").notNull(),
  formatType: text("format_type").notNull(), // One of FORMAT_OPTIONS
  fileSize: integer("file_size"), // Size of file in bytes
  fileName: text("file_name").notNull(), // Original filename
  mimeType: text("mime_type"), // MIME type of the file
  storageKey: text("storage_key").notNull(), // Key in object storage
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Schema for inserting book files
export const insertBookFileSchema = createInsertSchema(bookFiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Schema for file data in book upload
export const fileUploadSchema = z.object({
  file: z.any(), // File object (will be handled by multer)
  formatType: z.enum(FORMAT_OPTIONS),
});

// Define the book file types
export type BookFile = typeof bookFiles.$inferSelect;
export type InsertBookFile = typeof bookFiles.$inferInsert;

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
  // Changed to use -1 (thumbs down), 0 (not answered), or 1 (thumbs up)
  enjoyment: integer("enjoyment").notNull().default(0),
  writing: integer("writing").notNull().default(0),
  themes: integer("themes").notNull().default(0),
  characters: integer("characters").notNull().default(0),
  worldbuilding: integer("worldbuilding").notNull().default(0),
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

// Violation types for content reporting
export const CONTENT_VIOLATION_TYPES = [
  "copyright_infringement",
  "adult_content",
  "hate_speech",
  "misleading_information",
  "inappropriate_content",
  "illegal_content",
  "spam",
  "other"
] as const;

export const NOTE_TYPES = [
  "book",
  "shelf"
] as const;

// Table for shelf comments
export const shelfComments = pgTable("shelf_comments", {
  id: serial("id").primaryKey(),
  shelfId: integer("shelf_id").notNull().references(() => bookShelves.id),
  userId: integer("user_id").references(() => users.id), // Optional for anonymous comments
  username: text("username"), // For anonymous users
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertShelfCommentSchema = createInsertSchema(shelfComments).omit({
  id: true,
  createdAt: true,
});

export const contentReports = pgTable("content_reports", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => books.id),
  userId: integer("user_id").notNull().references(() => users.id),
  violationType: text("violation_type").notNull(), // One of CONTENT_VIOLATION_TYPES
  details: text("details"),
  status: text("status").notNull().default("pending"), // "pending", "reviewed", "resolved", "dismissed"
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Schema for content report creation
export const insertContentReportSchema = createInsertSchema(contentReports).omit({
  id: true,
  status: true, 
  adminNotes: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  violationType: z.enum(CONTENT_VIOLATION_TYPES),
});

export type ContentReport = typeof contentReports.$inferSelect;
export type InsertContentReport = z.infer<typeof insertContentReportSchema>;

export const replies = pgTable("replies", {
  id: serial("id").primaryKey(),
  reviewId: integer("review_id").notNull(),
  authorId: integer("author_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Reading status table for wishlisting and completion tracking
export const reading_status = pgTable("reading_status", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  isWishlisted: boolean("is_wishlisted").notNull().default(false),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
});

export const rating_preferences = pgTable("rating_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  // Individual columns for each rating criteria with decimal type
  themes: decimal("themes").notNull().default("0.2"),
  worldbuilding: decimal("worldbuilding").notNull().default("0.08"),
  writing: decimal("writing").notNull().default("0.25"),
  enjoyment: decimal("enjoyment").notNull().default("0.35"),
  characters: decimal("characters").notNull().default("0.12"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookImpressions = pgTable("book_impressions", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull(),
  userId: integer("user_id"), // Optional, as not all users might be logged in
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  source: text("source").notNull(), // e.g., 'card', 'grid', 'carousel'
  context: text("context").notNull(), // e.g., 'home', 'search', 'author-page'
  type: text("type").default("view"), // e.g., 'view', 'detail-expand', 'card-click', 'referral-click'
  weight: decimal("weight").default("1"), // Weight of the interaction (0.25, 0.5, 1.0)
  position: integer("position"), // Position in list/container (index in carousel, grid, etc.)
  container_type: text("container_type"), // Type of container: 'carousel', 'book-rack', 'grid', 'book-shelf', 'wishlist'
  container_id: text("container_id"), // ID of the container (e.g., carousel ID, shelf ID)
  metadata: jsonb("metadata").default({}), // Additional tracking metadata (device info, section data)
});

export const bookClickThroughs = pgTable("book_click_throughs", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull(),
  userId: integer("user_id"), // Optional, as not all users might be logged in
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  source: text("source").notNull(), // Where the click came from (component type)
  referrer: text("referrer"), // Previous page URL
  position: integer("position"), // Position in list/container (index in carousel, grid, etc.)
  container_type: text("container_type"), // Type of container: 'carousel', 'book-rack', 'grid', 'book-shelf', 'wishlist'
  container_id: text("container_id"), // ID of the container (e.g., carousel ID, shelf ID)
  metadata: jsonb("metadata").default({}), // Additional tracking metadata
});

// Dedicated table for referral link tracking
export const referralClicks = pgTable("referral_clicks", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull().references(() => books.id),
  userId: integer("user_id").references(() => users.id), // Optional, as not all users might be logged in
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  sourceContext: text("source_context").notNull(), // Where the click originated from (book_details, book-shelf/share)
  retailerName: text("retailer_name").notNull(), // Name of the retailer (Amazon, Barnes & Noble, etc.)
  targetDomain: text("target_domain").notNull(), // Actual domain being linked to (amazon.com, bn.com)
  targetSubdomain: text("target_subdomain"), // Subdomain if applicable
  targetUrl: text("target_url").notNull(), // Full destination URL
  deviceInfo: jsonb("device_info").default({}), // Device information
  metadata: jsonb("metadata").default({}), // Additional tracking data
});

export const publishers = pgTable("publishers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => users.id),
  name: text("name").notNull(), // For backwards compatibility
  publisher_name: text("publisher_name").notNull(),
  publisher_description: text("publisher_description"),
  business_email: text("business_email"),
  business_phone: text("business_phone"),
  business_address: text("business_address"),
  description: text("description"), // For backwards compatibility
  website: text("website"),
  logoUrl: text("logo_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Sellers table for publisher sales representatives
export const sellers = pgTable("sellers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company").notNull(),
  status: text("status").notNull().default("active"), // "active", "inactive", "suspended"
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Publisher sellers table to authenticate sellers assigning publishers
export const publisherSellers = pgTable("publisher_sellers", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => sellers.id),
  verification_code: text("verification_code"), // Code used to verify seller status
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const publishersAuthors = pgTable("publishers_authors", {
  id: serial("id").primaryKey(),
  publisherId: integer("publisher_id").notNull(),
  authorId: integer("author_id").notNull(),
  contractStart: timestamp("contract_start").notNull(),
  contractEnd: timestamp("contract_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: decimal("amount").notNull(),
  type: text("type").notNull(), // "deposit", "withdrawal", "campaign_spend"
  description: text("description"),
  campaignId: integer("campaign_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Add after campaigns table definition (line 220)
export const keywordBids = pgTable("keyword_bids", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  keyword: text("keyword").notNull(),
  maxBid: decimal("max_bid").notNull(),
  currentBid: decimal("current_bid").notNull(),
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  spend: decimal("spend").notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Update campaigns table (around line 220)
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "ad", "survey", "review_boost"
  status: text("status").notNull().default("active"), // "active", "completed", "paused"
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  spent: decimal("spent").notNull().default("0"),
  budget: decimal("budget").notNull(),
  keywords: text("keywords").array(),
  adType: text("ad_type"), // "banner", "feature", or "keyword" for ad campaigns
  authorId: integer("author_id").notNull(),
  metrics: jsonb("metrics").default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  biddingStrategy: text("bidding_strategy").default("manual"), // "manual", "automatic"
  dailyBudget: decimal("daily_budget"),
  maxBidAmount: decimal("max_bid_amount"),
  targetCPC: decimal("target_cpc"), // Target cost per click
  targetPosition: integer("target_position"), // Target position in search results
});

export const campaignBooks = pgTable("campaign_books", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  bookId: integer("book_id").notNull(),
});

// Add after insertGiftedBookSchema (around line 370)
export const insertKeywordBidSchema = createInsertSchema(keywordBids).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  impressions: true,
  clicks: true,
  spend: true,
});

// Update insertCampaignSchema (around line 243)
export const insertCampaignSchema = createInsertSchema(campaigns, {
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
}).extend({
  books: z.array(z.number()).min(1, "At least one book must be selected"),
  keywords: z.array(z.string()).optional(),
  type: z.enum(["ad", "survey", "review_boost"]),
  status: z.enum(["active", "completed", "paused"]).default("active"),
  adType: z.enum(["banner", "feature", "keyword"]).optional(),
  biddingStrategy: z.enum(["manual", "automatic"]).default("manual"),
  dailyBudget: z.number().optional(),
  maxBidAmount: z.number().optional(),
  targetCPC: z.number().optional(),
  targetPosition: z.number().optional(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  newsletterOptIn: true,
  provider: true,
  providerId: true,
}).extend({
  email: z.string()
    .email("Invalid email format")
    .refine((email) => {
      // Prevent disposable/temporary emails
      return !isDisposableEmail(email);
    }, {
      message: "Disposable or temporary email addresses are not allowed"
    })
    .refine((email) => {
      // Check for suspicious auto-generated emails
      return !isSuspiciousLocalPart(email);
    }, {
      message: "This email address appears to be auto-generated"
    }),
  password: z.string().min(8, "Password must be at least 8 characters").nullable(),
  provider: z.string().nullable().optional(),
  providerId: z.string().nullable().optional(),
  betaKey: z.string().optional(),
}).refine((data) => {
  // If using OAuth (provider exists), password can be null
  // Otherwise, password is required
  if (data.provider) {
    return true;
  }
  return !!data.password;
}, {
  message: "Password is required for email/password authentication",
  path: ["password"]
});

export const updateProfileSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  displayName: true,
  bio: true,
  profileImageUrl: true,
  socialMediaLinks: true,
  socialLinks: true,
  provider: true,
  providerId: true,
}).extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string()
    .email("Invalid email format")
    .refine((email) => {
      // Prevent disposable/temporary emails
      return !isDisposableEmail(email);
    }, {
      message: "Disposable or temporary email addresses are not allowed"
    })
    .refine((email) => {
      // Check for suspicious auto-generated emails
      return !isSuspiciousLocalPart(email);
    }, {
      message: "This email address appears to be auto-generated"
    }),
  currentPassword: z.string().optional(),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .optional(),
  confirmPassword: z.string().optional(),
  socialMediaLinks: z.array(socialMediaLinkSchema).max(4, "Maximum 4 social media links allowed").optional(),
  socialLinks: z.array(socialMediaLinkSchema).max(4, "Maximum 4 social media links allowed").optional(),
}).refine((data) => {
  // Only validate password fields if we're trying to change the password
  // If newPassword is provided, all password fields must be filled
  if (data.newPassword) {
    return data.currentPassword && data.confirmPassword;
  }
  // If currentPassword is provided, all password fields must be filled
  if (data.currentPassword) {
    return data.newPassword && data.confirmPassword;
  }
  // If confirmPassword is provided, all password fields must be filled
  if (data.confirmPassword) {
    return data.newPassword && data.currentPassword;
  }
  // Otherwise, profile can be updated without password fields
  return true;
}, {
  message: "All password fields are required when changing password",
}).refine((data) => {
  // Passwords must match if provided
  if (data.newPassword && data.confirmPassword) {
    return data.newPassword === data.confirmPassword;
  }
  return true;
}, {
  message: "Passwords do not match",
});

export const insertBookSchema = createInsertSchema(books).extend({
  formats: z.array(z.enum(FORMAT_OPTIONS)).min(1, "At least one format is required"),
  publishedDate: z.date().optional(),
  pageCount: z.number().min(1, "Page count must be at least 1").optional(),
  awards: z.array(z.string()).optional(),
  characters: z.array(z.string()).optional(),
  language: z.string().optional(),
  referralLinks: z.array(referralLinkSchema).optional(),
  impressionCount: z.number().int().min(0).default(0),
  clickThroughCount: z.number().int().min(0).default(0),
  internal_details: z.string().optional(),
  // New taxonomy fields
  genreTaxonomies: z.array(z.object({
    id: z.number().optional(),
    taxonomyId: z.number(),
    rank: z.number(),
    type: z.enum(["genre", "subgenre", "theme", "trope"]),
    name: z.string() // For display purposes
  })).superRefine((val, ctx) => {
    // Check total number of taxonomies
    if (val.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_small,
        minimum: 5,
        type: "array",
        inclusive: true,
        path: ["genreTaxonomies"],
        message: "At least 5 taxonomies are required (in total across all types)",
      });
    }
    
    // Still keep maximum limits per type to prevent overloading
    const genres = val.filter(item => item.type === "genre");
    const subgenres = val.filter(item => item.type === "subgenre");
    const themes = val.filter(item => item.type === "theme");
    const tropes = val.filter(item => item.type === "trope");
    
    if (genres.length > 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: 2,
        type: "array",
        inclusive: true,
        path: ["genreTaxonomies", "genre"],
        message: "Maximum 2 genres allowed",
      });
    }
    
    if (subgenres.length > 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: 5,
        type: "array",
        inclusive: true,
        path: ["genreTaxonomies", "subgenre"],
        message: "Maximum 5 subgenres allowed",
      });
    }
    
    if (themes.length > 6) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: 6,
        type: "array",
        inclusive: true,
        path: ["genreTaxonomies", "theme"],
        message: "Maximum 6 themes allowed",
      });
    }
    
    if (tropes.length > 7) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: 7,
        type: "array",
        inclusive: true,
        path: ["genreTaxonomies", "trope"],
        message: "Maximum 7 tropes allowed",
      });
    }
  }),
});

export const insertRatingSchema = createInsertSchema(ratings);
export const insertReadingStatusSchema = createInsertSchema(reading_status);
export const insertFollowerSchema = createInsertSchema(followers);
export const insertImpressionSchema = createInsertSchema(bookImpressions);
export const insertClickThroughSchema = createInsertSchema(bookClickThroughs);
export const insertReferralClickSchema = createInsertSchema(referralClicks).omit({
  id: true,
  timestamp: true
});
export const insertRatingPreferencesSchema = createInsertSchema(rating_preferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // Individual criteria fields as optional in the insert schema
  themes: z.number().min(0).max(1).optional(),
  worldbuilding: z.number().min(0).max(1).optional(),
  writing: z.number().min(0).max(1).optional(),
  enjoyment: z.number().min(0).max(1).optional(),
  characters: z.number().min(0).max(1).optional(),
});

export const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
  betaKey: z.string().optional(),
});

export type LoginData = z.infer<typeof loginSchema>;

export const insertPublisherSchema = createInsertSchema(publishers)
  .omit({ id: true, createdAt: true })
  .extend({
    userId: z.number(),
    publisher_name: z.string().min(1, "Publisher name is required"),
    publisher_description: z.string().optional(),
    business_email: z.string().email("Please enter a valid email").optional(),
    business_phone: z.string().optional(),
    business_address: z.string().optional(),
    website: z.string().url("Please enter a valid URL").optional(),
    logoUrl: z.string().optional(),
  });

export const insertSellerSchema = createInsertSchema(sellers)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    userId: z.number(),
    name: z.string().min(1, "Seller name is required"),
    email: z.string().email("Please enter a valid email"),
    company: z.string().min(1, "Company name is required"),
    status: z.enum(["active", "inactive", "suspended"]).default("active"),
    notes: z.string().optional(),
  });

export const insertPublisherSellerSchema = createInsertSchema(publisherSellers)
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    sellerId: z.number(),
    verification_code: z.string().optional(),
  });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type User = typeof users.$inferSelect;
export type Author = typeof authors.$inferSelect;

export const insertAuthorSchema = createInsertSchema(authors)
  .omit({ id: true })
  .extend({
    author_name: z.string().min(1, "Author name is required"),
    bio: z.string().optional(),
  });
export type Book = typeof books.$inferSelect & {
  images?: BookImage[];
  // Optional author information that can be joined from the authors table
  authorName?: string;
  authorImageUrl?: string | null;
};
export type Rating = typeof ratings.$inferSelect;
export type ReadingStatus = typeof reading_status.$inferSelect;
export type InsertReadingStatus = typeof reading_status.$inferInsert;
export type Follower = typeof followers.$inferSelect;
export type BookImpression = typeof bookImpressions.$inferSelect;
export type BookClickThrough = typeof bookClickThroughs.$inferSelect;
export type ReferralClick = typeof referralClicks.$inferSelect;
export type InsertBookImpression = typeof bookImpressions.$inferInsert;
export type InsertBookClickThrough = typeof bookClickThroughs.$inferInsert;
export type InsertReferralClick = z.infer<typeof insertReferralClickSchema>;
export type InsertBook = typeof books.$inferInsert;
export type Campaign = typeof campaigns.$inferSelect;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type Publisher = typeof publishers.$inferSelect;
export type InsertPublisher = z.infer<typeof insertPublisherSchema>;
export type Seller = typeof sellers.$inferSelect;
export type InsertSeller = z.infer<typeof insertSellerSchema>;
export type PublisherSeller = typeof publisherSellers.$inferSelect;
export type InsertPublisherSeller = z.infer<typeof insertPublisherSellerSchema>;
export type PublisherAuthor = typeof publishersAuthors.$inferSelect;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;
export type RatingPreferences = typeof rating_preferences.$inferSelect;
export type InsertRatingPreferences = z.infer<typeof insertRatingPreferencesSchema>;

export const giftedBooks = pgTable("gifted_books", {
  id: serial("id").primaryKey(),
  uniqueCode: text("unique_code").notNull().unique(),
  bookId: integer("book_id").notNull(),
  campaignId: integer("campaign_id").notNull(),
  status: text("status").notNull().default("unclaimed"),
  claimedByUserId: integer("claimed_by_user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  claimedAt: timestamp("claimed_at"),
});

// Add after insertGiftedBookSchema (around line 370)
export const insertGiftedBookSchema = createInsertSchema(giftedBooks).omit({
  id: true,
  createdAt: true,
  claimedAt: true,
});

// Add after Campaign type (around line 351)
export type KeywordBid = typeof keywordBids.$inferSelect;
export type InsertKeywordBid = typeof keywordBids.$inferInsert;


// Add the type
export type GiftedBook = typeof giftedBooks.$inferSelect;
export type InsertGiftedBook = typeof giftedBooks.$inferInsert;

// Ad Tracking Table
export const adImpressions = pgTable("ad_impressions", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  bookId: integer("book_id").notNull(),
  userId: integer("user_id"), // Optional, as not all users might be logged in
  adType: text("ad_type").notNull(), // "horizontal", "vertical", "hero", "featured"
  position: text("position"), // Position on the page (e.g., "before-reviews", "between-sections")
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  clicked: boolean("clicked").notNull().default(false),
  clickedAt: timestamp("clicked_at"),
  source: text("source").notNull(), // Page source e.g., 'home', 'search', 'author-page', 'book-details'
  container_type: text("container_type"), // Type of container: 'carousel', 'grid', etc.
  container_id: text("container_id"), // ID of the container if applicable
  section_order: integer("section_order"), // Order in the page (first ad, second ad, etc.)
  metadata: jsonb("metadata").default({}), // Additional tracking metadata (device info, viewability)
});

export const insertAdImpressionSchema = createInsertSchema(adImpressions).omit({
  id: true,
  clickedAt: true,
});

export type AdImpression = typeof adImpressions.$inferSelect;
export type InsertAdImpression = typeof adImpressions.$inferInsert;

/**
 * Calculates the straight average rating (unweighted)
 * Used for Pro Book Management section
 */
export function calculateStraightAverageRating(rating: Rating): number {
  // Count the number of criteria that have values
  const criteriaCount = [
    rating.enjoyment, 
    rating.writing, 
    rating.themes, 
    rating.characters, 
    rating.worldbuilding
  ].filter(Boolean).length;
  
  // Sum up all numerical rating criteria
  const criteriaSum = 
    (rating.enjoyment || 0) + 
    (rating.writing || 0) + 
    (rating.themes || 0) + 
    (rating.characters || 0) + 
    (rating.worldbuilding || 0);
  
  return criteriaCount > 0 ? criteriaSum / criteriaCount : 0;
}

/**
 * Calculates a weighted rating based on user preferences
 * Used for most of the application outside of Pro Book Management
 * 
 * With the new thumbs up/down system:
 * - Thumbs up (1) contributes positively based on weight
 * - Thumbs down (-1) contributes negatively based on weight
 * - No rating (0) doesn't contribute
 */
export function calculateWeightedRating(
  rating: Rating, 
  customWeights?: Record<string, number> | RatingPreferences
): number {
  let weights: Record<string, number>;
  
  // If RatingPreferences object is provided with individual columns
  if (customWeights && 'themes' in customWeights) {
    // Handle string values from DB by converting to numbers
    weights = {
      enjoyment: typeof customWeights.enjoyment === 'string' ? parseFloat(customWeights.enjoyment) : Number(customWeights.enjoyment),
      writing: typeof customWeights.writing === 'string' ? parseFloat(customWeights.writing) : Number(customWeights.writing),
      themes: typeof customWeights.themes === 'string' ? parseFloat(customWeights.themes) : Number(customWeights.themes),
      characters: typeof customWeights.characters === 'string' ? parseFloat(customWeights.characters) : Number(customWeights.characters),
      worldbuilding: typeof customWeights.worldbuilding === 'string' ? parseFloat(customWeights.worldbuilding) : Number(customWeights.worldbuilding)
    };
  } 
  // If custom weights are provided as a Record
  else if (customWeights && typeof customWeights === 'object' && !('id' in customWeights)) {
    weights = customWeights as Record<string, number>;
  }
  // Default fallback using system default weights
  else {
    weights = {...DEFAULT_RATING_WEIGHTS};
  }
  
  // Ensure all weights are valid numbers
  Object.keys(weights).forEach(key => {
    if (isNaN(weights[key])) {
      weights[key] = DEFAULT_RATING_WEIGHTS[key as keyof typeof DEFAULT_RATING_WEIGHTS];
    }
  });
  
  // Count how many criteria were actually rated (non-zero)
  let ratedCriteriaCount = 0;
  let totalWeightedRating = 0;
  let totalWeight = 0;
  
  // Process each criterion
  const criteria = ['enjoyment', 'writing', 'themes', 'characters', 'worldbuilding'] as const;
  
  for (const criterion of criteria) {
    const value = rating[criterion];
    
    // Skip if this criterion wasn't rated
    if (value === 0) continue;
    
    ratedCriteriaCount++;
    const weight = weights[criterion];
    totalWeight += weight;
    
    // Convert -1/1 to a value we can use
    // -1 (thumbs down) maps to 1 (negative contribution)
    // 1 (thumbs up) maps to 5 (positive contribution)
    const normalizedValue = value === 1 ? 5 : 1;
    totalWeightedRating += normalizedValue * weight;
  }
  
  // If nothing was rated, return a neutral score
  if (ratedCriteriaCount === 0) return 0;
  
  // Calculate the weighted average
  return totalWeightedRating / totalWeight;
}

/**
 * Calculates a compatibility rating based on the weighted rating
 * Multiplies the weighted rating by 3 to produce a value between -3 and 3
 * - Negative values indicate incompatibility (shown in red)
 * - Positive values indicate compatibility (shown in purple)
 */
export function calculateCompatibilityRating(
  rating: Rating, 
  customWeights?: Record<string, number> | RatingPreferences
): number {
  // Get weighted rating (between 1-5)
  const weightedRating = calculateWeightedRating(rating, customWeights);
  
  // Transform to a scale of -3 to 3
  // When weightedRating is 3 (neutral), compatibilityRating is 0
  // When weightedRating > 3, compatibilityRating is positive (up to 3)
  // When weightedRating < 3, compatibilityRating is negative (down to -3)
  return (weightedRating - 3) * 1.5;
}

export const landing_sessions = pgTable("landing_sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  lastSectionViewed: integer("last_section_viewed").default(0),
  totalSectionsViewed: integer("total_sections_viewed").default(0),
  selectedTheme: text("selected_theme"), // "reader" or "author"
  clickedHowItWorks: boolean("clicked_how_it_works").default(false),
  clickedSignup: boolean("clicked_signup").default(false),
  completedSignup: boolean("completed_signup").default(false),
  startedPartnerForm: boolean("started_partner_form").default(false),
  submittedPartnerForm: boolean("submitted_partner_form").default(false),
  timeSpentSeconds: integer("time_spent_seconds"),
  deviceInfo: jsonb("device_info").default({}),
});

export const landing_events = pgTable("landing_events", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  eventType: text("event_type").notNull(),
  eventData: jsonb("event_data").default({}),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Add after landing_events table
export const signup_interests = pgTable("signup_interests", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  isPublisher: boolean("is_publisher").default(false),
  isAuthorInterest: boolean("is_author_interest").default(false),
  // Legacy column that needs to be kept for backward compatibility
  isAuthor: boolean("is_author").default(false),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const partnership_inquiries = pgTable("partnership_inquiries", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  message: text("message").notNull(),
  sessionId: text("session_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Add insert schemas
export const insertSignupInterestSchema = createInsertSchema(signup_interests).omit({
  id: true,
  createdAt: true,
});

export const insertPartnershipInquirySchema = createInsertSchema(partnership_inquiries).omit({
  id: true,
  createdAt: true,
});

// Add types
export type SignupInterest = typeof signup_interests.$inferSelect;
export type InsertSignupInterest = typeof signup_interests.$inferInsert;
export type PartnershipInquiry = typeof partnership_inquiries.$inferSelect;
export type InsertPartnershipInquiry = typeof partnership_inquiries.$inferInsert;

// Add insert schemas
export const insertLandingSessionSchema = createInsertSchema(landing_sessions).omit({
  id: true,
  startTime: true,
});

export const insertLandingEventSchema = createInsertSchema(landing_events).omit({
  id: true,
  timestamp: true,
});

// Add types
export type LandingSession = typeof landing_sessions.$inferSelect;
export type InsertLandingSession = typeof landing_sessions.$inferInsert;
export type LandingEvent = typeof landing_events.$inferSelect;
export type InsertLandingEvent = typeof landing_events.$inferInsert;

// Event type enum for type safety
export const LANDING_EVENT_TYPES = [
  "section_view",
  "theme_change",
  "how_it_works_click",
  "signup_click",
  "signup_complete",
  "partner_form_start",
  "partner_form_submit",
  "exit"
] as const;

export const landingEventSchema = z.object({
  type: z.enum(LANDING_EVENT_TYPES),
  data: z.record(z.unknown()).optional(),
});

// Add after creditTransactions table
export const reviewPurchases = pgTable("review_purchases", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").notNull(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, cancelled
  credits: decimal("credits").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Add the insert schema
export const insertReviewPurchaseSchema = createInsertSchema(reviewPurchases).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

// Add the type
export type ReviewPurchase = typeof reviewPurchases.$inferSelect;
export type InsertReviewPurchase = typeof reviewPurchases.$inferInsert;

// Author analytics tables
export const AUTHOR_ACTION_TYPES = [
  "pro_page_view",
  "form_submission",
  "form_started", 
  "link_click",
  "wizard_step",
  "wizard_exit",
  "template_download",
  "navigation"
] as const;

export const authorAnalytics = pgTable("author_analytics", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull(),
  actionType: text("action_type").notNull(),
  actionData: jsonb("action_data").default({}),
  pageUrl: text("page_url"),
  referrerUrl: text("referrer_url"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  sessionId: text("session_id"),
  deviceInfo: jsonb("device_info").default({}),
});

export const authorPageViews = pgTable("author_page_views", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull(),
  pageUrl: text("page_url").notNull(),
  enteredAt: timestamp("entered_at").notNull().defaultNow(),
  exitedAt: timestamp("exited_at"),
  duration: integer("duration"),
  sessionId: text("session_id"),
});

export const authorFormAnalytics = pgTable("author_form_analytics", {
  id: serial("id").primaryKey(),
  authorId: integer("author_id").notNull(), 
  formId: text("form_id").notNull(), // e.g., "book_creation", "ad_campaign"
  status: text("status").notNull(), // "started", "completed", "abandoned"
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  duration: integer("duration"),
  formData: jsonb("form_data").default({}),
  stepData: jsonb("step_data").default({}), // track which steps were completed
  abandonedStep: text("abandoned_step"),
  sessionId: text("session_id"),
});

export const insertAuthorAnalyticsSchema = createInsertSchema(authorAnalytics).omit({
  id: true,
  timestamp: true,
});

export const insertAuthorPageViewSchema = createInsertSchema(authorPageViews).omit({
  id: true,
  enteredAt: true,
  duration: true,
});

export const insertAuthorFormAnalyticsSchema = createInsertSchema(authorFormAnalytics).omit({
  id: true,
  startedAt: true,
  duration: true,
});

export type AuthorAnalytics = typeof authorAnalytics.$inferSelect;
export type InsertAuthorAnalytics = typeof authorAnalytics.$inferInsert;
export type AuthorPageView = typeof authorPageViews.$inferSelect;
export type InsertAuthorPageView = typeof authorPageViews.$inferInsert;
export type AuthorFormAnalytics = typeof authorFormAnalytics.$inferSelect;
export type InsertAuthorFormAnalytics = typeof authorFormAnalytics.$inferInsert;

// Beta key system
export const betaKeys = pgTable("beta_keys", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").notNull().default(0),
  createdBy: integer("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
});

export const betaKeyUsage = pgTable("beta_key_usage", {
  id: serial("id").primaryKey(),
  betaKeyId: integer("beta_key_id").notNull(),
  userId: integer("user_id").notNull(),
  usedAt: timestamp("used_at").notNull().defaultNow(),
});

export const insertBetaKeySchema = createInsertSchema(betaKeys).omit({
  id: true,
  createdAt: true,
  usageCount: true,
});

export type BetaKey = typeof betaKeys.$inferSelect;
export type InsertBetaKey = typeof betaKeys.$inferInsert;
export type BetaKeyUsage = typeof betaKeyUsage.$inferSelect;

// Genre taxonomy tables
export const genreTaxonomies = pgTable("genre_taxonomies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Major genre, Subgenre, Trope, or Theme
  description: text("description"),
  type: text("type").notNull(), // genre, subgenre, trope, theme
  parentId: integer("parent_id"), // For subgenres, references a major genre
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Book - Genre Taxonomy relationship table
export const bookGenreTaxonomies = pgTable("book_genre_taxonomies", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull(),
  taxonomyId: integer("taxonomy_id").notNull(),
  rank: integer("rank").notNull(), // Position for ordering importance
  importance: decimal("importance").notNull(), // Calculated value using 1 / (1 + ln(rank))
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User genre views table - stores user's custom content views
export const userGenreViews = pgTable("user_genre_views", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(), // Links to a user
  name: text("name").notNull(), // Name of the view (e.g., "Science Fiction", "Fantasy", etc.)
  rank: integer("rank").notNull(), // Order of the view in the user's preference list
  isDefault: boolean("is_default").default(false), // Whether this is the default view
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// View genres table - stores genres associated with each genre view
export const viewGenres = pgTable("view_genres", {
  id: serial("id").primaryKey(),
  viewId: integer("view_id").notNull(), // Links to user_genre_views
  taxonomyId: integer("taxonomy_id").notNull(), // Links to genre_taxonomies
  type: text("type").notNull(), // "genre", "subgenre", "theme", "trope"
  rank: integer("rank").notNull(), // Order of the genre within the view
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Create insert schemas
export const insertGenreTaxonomySchema = createInsertSchema(genreTaxonomies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
});

export const insertBookGenreTaxonomySchema = createInsertSchema(bookGenreTaxonomies).omit({
  id: true,
  createdAt: true,
  importance: true,
});

export const insertUserGenreViewSchema = createInsertSchema(userGenreViews).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertViewGenreSchema = createInsertSchema(viewGenres).omit({
  id: true,
  createdAt: true,
});

// Define types
export type GenreTaxonomy = typeof genreTaxonomies.$inferSelect;
export type InsertGenreTaxonomy = typeof genreTaxonomies.$inferInsert;
export type BookGenreTaxonomy = typeof bookGenreTaxonomies.$inferSelect;
export type InsertBookGenreTaxonomy = typeof bookGenreTaxonomies.$inferInsert;

export type UserGenreView = typeof userGenreViews.$inferSelect;
export type InsertUserGenreView = typeof userGenreViews.$inferInsert;
export type ViewGenre = typeof viewGenres.$inferSelect;
export type InsertViewGenre = typeof viewGenres.$inferInsert;

// Homepage section types
export const HOMEPAGE_SECTION_TYPES = [
  "authors_you_follow",
  "popular",
  "you_may_also_like", 
  "wishlist", 
  "unreviewed", 
  "reviewed", 
  "completed",
  "custom_genre_view",
  "coming_soon"
] as const;

export const DISPLAY_MODE_TYPES = ["carousel", "grid", "book_rack"] as const;

export const homepageLayouts = pgTable("homepage_layouts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  sections: jsonb("sections").$type<HomepageSection[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertHomepageLayoutSchema = createInsertSchema(homepageLayouts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export interface HomepageSection {
  id: string;
  type: typeof HOMEPAGE_SECTION_TYPES[number];
  displayMode: typeof DISPLAY_MODE_TYPES[number];
  title: string;
  itemCount: number;
  customViewId?: number; // Only for custom_genre_view type
  visible: boolean;
}

export type HomepageLayout = typeof homepageLayouts.$inferSelect;
export type InsertHomepageLayout = typeof homepageLayouts.$inferInsert;

// Block type constants
export const BLOCK_TYPE_OPTIONS = ["author", "publisher", "book", "taxonomy"] as const;

// User blocks table for filtering content
// BookShelves table to store user-created bookshelves
export const bookShelves = pgTable("book_shelves", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  coverImageUrl: text("cover_image_url").default("/images/default-bookshelf-cover.svg"),
  rank: integer("rank").notNull().default(0), // For drag and drop ordering
  isShared: boolean("is_shared").notNull().default(false), // Whether the bookshelf is shared publicly (for authors)
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ShelfBooks table to associate books with shelves
export const shelfBooks = pgTable("shelf_books", {
  id: serial("id").primaryKey(),
  shelfId: integer("shelf_id").notNull().references(() => bookShelves.id),
  bookId: integer("book_id").notNull().references(() => books.id),
  rank: integer("rank").notNull().default(0), // For drag and drop ordering within a shelf
  addedAt: timestamp("added_at").notNull().defaultNow(),
});

// Notes table for both books and shelves
export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: text("type").notNull(), // "book" or "shelf"
  bookId: integer("book_id").references(() => books.id),
  shelfId: integer("shelf_id").references(() => bookShelves.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userBlocks = pgTable("user_blocks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  blockType: text("block_type").notNull(), // One of BLOCK_TYPE_OPTIONS
  blockId: integer("block_id").notNull(), // ID of author, publisher, book, or taxonomy 
  blockName: text("block_name").notNull(), // Name for display purposes
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserBlockSchema = createInsertSchema(userBlocks).omit({
  id: true,
  createdAt: true,
});

export type UserBlock = typeof userBlocks.$inferSelect;
export type InsertUserBlock = z.infer<typeof insertUserBlockSchema>;

// Table for popular books recommendation with sigmoid decay
export const popularBooks = pgTable("popular_books", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull(),
  totalImpressions: integer("total_impressions").notNull(),
  totalClickThroughs: integer("total_click_throughs").notNull(),
  sigmoidValue: decimal("sigmoid_value").notNull(),
  rank: integer("rank").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  firstRankedAt: timestamp("first_ranked_at").notNull(),
  calculatedAt: timestamp("calculated_at").notNull().defaultNow(),
});

export const insertPopularBookSchema = createInsertSchema(popularBooks).omit({
  id: true,
  calculatedAt: true,
});

export type PopularBook = typeof popularBooks.$inferSelect;
export type InsertPopularBook = typeof popularBooks.$inferInsert;

// Feedback ticket status options
export const FEEDBACK_STATUS_OPTIONS = [
  "new",
  "in_progress",
  "resolved",
  "closed"
] as const;

// Feedback type options
export const FEEDBACK_TYPE_OPTIONS = [
  "bug_report",
  "feature_request",
  "general_feedback",
  "question"
] as const;

// Define the admin note structure
export type AdminNote = {
  id: string;
  content: string;
  createdAt: Date;
  createdBy?: number; // Optional admin user ID
};

// Feedback tickets table for beta feedback
export const feedbackTickets = pgTable("feedback_tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: text("ticket_number").notNull().unique(),
  userId: integer("user_id"),
  type: text("type").notNull(), // One of FEEDBACK_TYPE_OPTIONS
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("new"), // One of FEEDBACK_STATUS_OPTIONS
  priority: integer("priority").default(1), // 1-3 (low, medium, high)
  assignedTo: integer("assigned_to"), // Optional - user ID of admin assigned to ticket
  adminNotes: text("admin_notes"), // Legacy field - keeping for backward compatibility
  adminNotesData: jsonb("admin_notes_data").$type<AdminNote[]>().default([]), // Structured notes with timestamps
  deviceInfo: jsonb("device_info"), // Browser, OS, screen size, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Schema for inserting feedback tickets
export const insertFeedbackTicketSchema = createInsertSchema(feedbackTickets, {
  type: z.enum(FEEDBACK_TYPE_OPTIONS),
  status: z.enum(FEEDBACK_STATUS_OPTIONS).default("new"),
}).omit({
  id: true,
  ticketNumber: true, // Auto-generated
  createdAt: true,
  updatedAt: true,
  resolvedAt: true,
});

export type FeedbackTicket = typeof feedbackTickets.$inferSelect;
export type InsertFeedbackTicket = z.infer<typeof insertFeedbackTicketSchema>;

// Insert schemas for BookShelves, ShelfBooks, and Notes
export const insertBookShelfSchema = createInsertSchema(bookShelves).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  rank: true, // We'll handle rank in the API
}).extend({
  title: z.string().min(1, "Bookshelf title is required"),
  coverImageUrl: z.union([z.string(), z.instanceof(File), z.null()]).optional(),
  isShared: z.boolean().optional().default(false) // Optional for backward compatibility
});

export const insertShelfBookSchema = createInsertSchema(shelfBooks).omit({
  id: true,
  addedAt: true,
  rank: true, // We'll handle rank in the API
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  content: z.string().min(1, "Note content is required"),
  type: z.enum(NOTE_TYPES),
}).refine((data) => {
  // Validate that exactly one of bookId or shelfId is provided based on type
  if (data.type === "book") {
    return !!data.bookId && !data.shelfId;
  } else if (data.type === "shelf") {
    return !!data.shelfId && !data.bookId;
  }
  return false;
}, {
  message: "A note must be associated with either a book or a shelf, but not both",
  path: ["type"]
});

// Verification codes table for email verification, password resets, and security checks
export const verificationCodes = pgTable("verification_codes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  code: text("code").notNull(),
  type: text("type").notNull(), // "email_verification", "password_reset", "login_verification"
  email: text("email"), // Store the email being verified (if different from current)
  ipAddress: text("ip_address"), // IP address when code was created
  userAgent: text("user_agent"), // Browser/device identifier
  expiresAt: timestamp("expires_at").notNull(), // When the code expires
  isUsed: boolean("is_used").notNull().default(false),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertVerificationCodeSchema = createInsertSchema(verificationCodes).omit({
  id: true,
  isUsed: true,
  usedAt: true,
  createdAt: true,
});

export type VerificationCode = typeof verificationCodes.$inferSelect;
export type InsertVerificationCode = z.infer<typeof insertVerificationCodeSchema>;

// Trusted devices table for login verification
export const trustedDevices = pgTable("trusted_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  ipAddress: text("ip_address").notNull(), // IP address of the device
  userAgent: text("user_agent").notNull(), // User agent of the device
  fingerprint: text("fingerprint").notNull(), // Hash of IP+UserAgent
  lastUsed: timestamp("last_used").notNull().defaultNow(), // When the device was last used
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertTrustedDeviceSchema = createInsertSchema(trustedDevices).omit({
  id: true,
  createdAt: true,
});

export type TrustedDevice = typeof trustedDevices.$inferSelect;
export type InsertTrustedDevice = z.infer<typeof insertTrustedDeviceSchema>;

export type BookShelf = typeof bookShelves.$inferSelect;
export type InsertBookShelf = z.infer<typeof insertBookShelfSchema>;
export type ShelfBook = typeof shelfBooks.$inferSelect;
export type InsertShelfBook = z.infer<typeof insertShelfBookSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type ShelfComment = typeof shelfComments.$inferSelect;
export type InsertShelfComment = z.infer<typeof insertShelfCommentSchema>;

// AuthorBash - Experimental Game Mode

// Weekly questions for authors
export const authorBashQuestions = pgTable("authorbash_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  weekNumber: integer("week_number").notNull(),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Author responses to weekly questions
export const authorBashResponses = pgTable("authorbash_responses", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id").notNull().references(() => authorBashQuestions.id),
  authorId: integer("author_id").notNull().references(() => authors.id),
  imageUrl: text("image_url"), // Optional field - can be null
  text: text("text"), // Optional field - can be null, limited to 200 characters when provided
  retentionCount: integer("retention_count").default(0), // Number of times this response was retained
  impressionCount: integer("impression_count").default(0), // Number of times this response was viewed
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Track user game sessions
export const authorBashGames = pgTable("authorbash_games", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Track which responses users have seen and retained
export const authorBashRetentions = pgTable("authorbash_retentions", {
  id: serial("id").primaryKey(),
  gameId: integer("game_id").notNull().references(() => authorBashGames.id),
  responseId: integer("response_id").notNull().references(() => authorBashResponses.id),
  isRetained: boolean("is_retained").notNull().default(false),
  viewedAt: timestamp("viewed_at").notNull().defaultNow(),
  retainedAt: timestamp("retained_at"),
});

// Define relations between tables
export const authorBashQuestionRelations = relations(authorBashQuestions, ({ many }) => ({
  responses: many(authorBashResponses),
}));

export const authorBashResponseRelations = relations(authorBashResponses, ({ one, many }) => ({
  question: one(authorBashQuestions, {
    fields: [authorBashResponses.questionId],
    references: [authorBashQuestions.id],
  }),
  author: one(authors, {
    fields: [authorBashResponses.authorId],
    references: [authors.id],
  }),
  retentions: many(authorBashRetentions),
}));

export const authorBashGameRelations = relations(authorBashGames, ({ one, many }) => ({
  user: one(users, {
    fields: [authorBashGames.userId],
    references: [users.id],
  }),
  retentions: many(authorBashRetentions),
}));

export const authorBashRetentionRelations = relations(authorBashRetentions, ({ one }) => ({
  game: one(authorBashGames, {
    fields: [authorBashRetentions.gameId],
    references: [authorBashGames.id],
  }),
  response: one(authorBashResponses, {
    fields: [authorBashRetentions.responseId],
    references: [authorBashResponses.id],
  }),
}));

// Create insert schemas
export const insertAuthorBashQuestionSchema = createInsertSchema(authorBashQuestions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAuthorBashResponseSchema = createInsertSchema(authorBashResponses).omit({
  id: true,
  retentionCount: true,
  impressionCount: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  text: z.string().max(200, "Response text cannot exceed 200 characters").optional(),
  imageUrl: z.string().optional(),
});

export const insertAuthorBashGameSchema = createInsertSchema(authorBashGames).omit({
  id: true,
  completedAt: true,
  createdAt: true,
});

export const insertAuthorBashRetentionSchema = createInsertSchema(authorBashRetentions).omit({
  id: true,
  retainedAt: true,
});

// Define types
export type AuthorBashQuestion = typeof authorBashQuestions.$inferSelect;
export type InsertAuthorBashQuestion = z.infer<typeof insertAuthorBashQuestionSchema>;
export type AuthorBashResponse = typeof authorBashResponses.$inferSelect;
export type InsertAuthorBashResponse = z.infer<typeof insertAuthorBashResponseSchema>;
export type AuthorBashGame = typeof authorBashGames.$inferSelect;
export type InsertAuthorBashGame = z.infer<typeof insertAuthorBashGameSchema>;
export type AuthorBashRetention = typeof authorBashRetentions.$inferSelect;
export type InsertAuthorBashRetention = z.infer<typeof insertAuthorBashRetentionSchema>;