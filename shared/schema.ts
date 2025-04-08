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
  favoriteGenres: text("favorite_genres").array(), // Updated to array
  displayName: text("display_name"), // Added display name field
  socialMediaLinks: jsonb("social_media_links").$type<SocialMediaLink[]>().default([]),
  credits: decimal("credits").notNull().default("0"), // Add credits field
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
  impressionCount: integer("impression_count").notNull().default(0),
  clickThroughCount: integer("click_through_count").notNull().default(0),
  lastImpressionAt: timestamp("last_impression_at"),
  lastClickThroughAt: timestamp("last_click_through_at"),
  internal_details: text("internal_details"), // Added new field
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

// Replace bookshelves table with reading_status
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
  userId: integer("user_id"), // Optional, as not all users might be logged in
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  source: text("source").notNull(), // e.g., 'card', 'grid', 'carousel'
  context: text("context").notNull(), // e.g., 'home', 'search', 'author-page'
});

export const bookClickThroughs = pgTable("book_click_throughs", {
  id: serial("id").primaryKey(),
  bookId: integer("book_id").notNull(),
  userId: integer("user_id"), // Optional, as not all users might be logged in
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  source: text("source").notNull(), // Where the click came from
  referrer: text("referrer"), // Previous page URL
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
  isAuthor: true, // Add isAuthor to the schema
}).extend({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  isAuthor: z.boolean().default(false),
  betaKey: z.string().optional(),
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
  // If any password field is filled, all password fields must be filled
  if (data.newPassword || data.currentPassword || data.confirmPassword) {
    return data.newPassword && data.currentPassword && data.confirmPassword;
  }
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
  internal_details: z.string().optional(),
});

export const insertRatingSchema = createInsertSchema(ratings);
export const insertReadingStatusSchema = createInsertSchema(reading_status);
export const insertFollowerSchema = createInsertSchema(followers);
export const insertImpressionSchema = createInsertSchema(bookImpressions);
export const insertClickThroughSchema = createInsertSchema(bookClickThroughs);

export const loginSchema = z.object({
  email: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
  betaKey: z.string().optional(),
});

export type LoginData = z.infer<typeof loginSchema>;

export const insertPublisherSchema = createInsertSchema(publishers, {
  name: z.string().min(1, "Publisher name is required"),
  description: z.string().optional(),
  website: z.string().url("Please enter a valid URL").optional(),
  logoUrl: z.string().optional(),
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
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = typeof creditTransactions.$inferInsert;

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
  adType: text("ad_type").notNull(), // "ad", "review_boost", "featured"
  position: text("position"), // position on the page where the ad was shown
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  clicked: boolean("clicked").notNull().default(false),
  clickedAt: timestamp("clicked_at"),
  source: text("source").notNull(), // e.g., 'home', 'search', 'author-page'
});

export const insertAdImpressionSchema = createInsertSchema(adImpressions).omit({
  id: true,
  clickedAt: true,
});

export type AdImpression = typeof adImpressions.$inferSelect;
export type InsertAdImpression = typeof adImpressions.$inferInsert;

export function calculateWeightedRating(rating: Rating): number {
  return (
    rating.enjoyment * 0.3 +     // 30% weight for enjoyment
    rating.writing * 0.2 +       // 20% weight for writing
    rating.themes * 0.2 +        // 20% weight for themes
    rating.characters * 0.1 +    // 10% weight for characters
    rating.worldbuilding * 0.1   // 10% weight for worldbuilding
  );
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
  isAuthor: boolean("is_author").notNull(),
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