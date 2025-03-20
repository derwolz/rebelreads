// Add the createKeywordBid method to the storage interface
export interface ICampaignStorage {
  // Campaign methods
  getCampaigns(authorId: number): Promise<Campaign[]>;
  createCampaign(campaign: InsertCampaign): Promise<Campaign>;
  updateCampaignStatus(id: number, status: "active" | "completed" | "paused"): Promise<Campaign>;
  updateCampaignMetrics(id: number, metrics: any): Promise<Campaign>;

  // Credit methods
  getUserCredits(userId: number): Promise<string>;
  addCredits(userId: number, amount: string, description?: string): Promise<User>;
  deductCredits(userId: number, amount: string, campaignId: number): Promise<User>;
  getCreditTransactions(userId: number): Promise<CreditTransaction[]>;

  // Gifted books methods
  getGiftedBooks(campaignId: number): Promise<GiftedBook[]>;
  createGiftedBook(data: InsertGiftedBook): Promise<GiftedBook>;
  claimGiftedBook(uniqueCode: string, userId: number): Promise<GiftedBook>;
  getAvailableGiftedBook(): Promise<{ giftedBook: GiftedBook; book: Book } | null>;

  // Keyword bidding methods
  createKeywordBid(bid: InsertKeywordBid): Promise<KeywordBid>;
  updateKeywordBid(id: number, bid: Partial<InsertKeywordBid>): Promise<KeywordBid>;
  getKeywordBids(campaignId: number): Promise<KeywordBid[]>;
  updateBidMetrics(id: number, impressions: number, clicks: number, spend: string): Promise<KeywordBid>;
  adjustAutomaticBids(campaignId: number): Promise<void>;
}

import { AccountStorage } from "./storage/account";
import { BookStorage } from "./storage/books";
import { AnalyticsStorage } from "./storage/analytics";
import { LandingPageStorage } from "./storage/landing-page";
import { CampaignStorage } from "./storage/campaigns";
import { PublisherStorage } from "./storage/publisher";

// Create instances of all storage modules
const accountStorage = new AccountStorage();
const bookStorage = new BookStorage();
const analyticsStorage = new AnalyticsStorage();
const landingPageStorage = new LandingPageStorage();
const campaignStorage = new CampaignStorage();
const publisherStorage = new PublisherStorage();

// Combine all storage instances into a single object
export const dbStorage = {
  // User and account management
  getUser: accountStorage.getUser.bind(accountStorage),
  getUserByEmail: accountStorage.getUserByEmail.bind(accountStorage),
  getUserByUsername: accountStorage.getUserByUsername.bind(accountStorage),
  createUser: accountStorage.createUser.bind(accountStorage),
  updateUser: accountStorage.updateUser.bind(accountStorage),
  toggleAuthorStatus: accountStorage.toggleAuthorStatus.bind(accountStorage),
  getRatings: accountStorage.getRatings.bind(accountStorage),
  createRating: accountStorage.createRating.bind(accountStorage),
  getUserRatings: accountStorage.getUserRatings.bind(accountStorage),
  getReadingStatus: accountStorage.getReadingStatus.bind(accountStorage),
  toggleWishlist: accountStorage.toggleWishlist.bind(accountStorage),
  markAsCompleted: accountStorage.markAsCompleted.bind(accountStorage),
  getWishlistedBooks: accountStorage.getWishlistedBooks.bind(accountStorage),
  getCompletedBooks: accountStorage.getCompletedBooks.bind(accountStorage),
  followAuthor: accountStorage.followAuthor.bind(accountStorage),
  unfollowAuthor: accountStorage.unfollowAuthor.bind(accountStorage),
  isFollowing: accountStorage.isFollowing.bind(accountStorage),
  getFollowerCount: accountStorage.getFollowerCount.bind(accountStorage),
  getFollowingCount: accountStorage.getFollowingCount.bind(accountStorage),
  getFollowerMetrics: accountStorage.getFollowerMetrics.bind(accountStorage),

  // Book management
  getBooks: bookStorage.getBooks.bind(bookStorage),
  getBook: bookStorage.getBook.bind(bookStorage),
  getBooksByAuthor: bookStorage.getBooksByAuthor.bind(bookStorage),
  createBook: bookStorage.createBook.bind(bookStorage),
  promoteBook: bookStorage.promoteBook.bind(bookStorage),
  updateBook: bookStorage.updateBook.bind(bookStorage),
  deleteBook: bookStorage.deleteBook.bind(bookStorage),
  getAuthorGenres: bookStorage.getAuthorGenres.bind(bookStorage),
  selectBooks: bookStorage.selectBooks.bind(bookStorage),
  updateInternalDetails: bookStorage.updateInternalDetails.bind(bookStorage),

  // Analytics
  recordBookImpression: analyticsStorage.recordBookImpression.bind(analyticsStorage),
  recordBookClickThrough: analyticsStorage.recordBookClickThrough.bind(analyticsStorage),
  updateBookStats: analyticsStorage.updateBookStats.bind(analyticsStorage),
  getBooksMetrics: analyticsStorage.getBooksMetrics.bind(analyticsStorage),

  // Landing page
  createLandingSession: landingPageStorage.createLandingSession.bind(landingPageStorage),
  updateLandingSession: landingPageStorage.updateLandingSession.bind(landingPageStorage),
  endLandingSession: landingPageStorage.endLandingSession.bind(landingPageStorage),
  recordLandingEvent: landingPageStorage.recordLandingEvent.bind(landingPageStorage),
  getLandingSession: landingPageStorage.getLandingSession.bind(landingPageStorage),
  createSignupInterest: landingPageStorage.createSignupInterest.bind(landingPageStorage),
  getSignupInterests: landingPageStorage.getSignupInterests.bind(landingPageStorage),
  createPartnershipInquiry: landingPageStorage.createPartnershipInquiry.bind(landingPageStorage),
  getPartnershipInquiries: landingPageStorage.getPartnershipInquiries.bind(landingPageStorage),

  // Campaigns
  getCampaigns: campaignStorage.getCampaigns.bind(campaignStorage),
  createCampaign: campaignStorage.createCampaign.bind(campaignStorage),
  updateCampaignStatus: campaignStorage.updateCampaignStatus.bind(campaignStorage),
  updateCampaignMetrics: campaignStorage.updateCampaignMetrics.bind(campaignStorage),
  getUserCredits: campaignStorage.getUserCredits.bind(campaignStorage),
  addCredits: campaignStorage.addCredits.bind(campaignStorage),
  deductCredits: campaignStorage.deductCredits.bind(campaignStorage),
  getCreditTransactions: campaignStorage.getCreditTransactions.bind(campaignStorage),
  getGiftedBooks: campaignStorage.getGiftedBooks.bind(campaignStorage),
  createGiftedBook: campaignStorage.createGiftedBook.bind(campaignStorage),
  claimGiftedBook: campaignStorage.claimGiftedBook.bind(campaignStorage),
  getAvailableGiftedBook: campaignStorage.getAvailableGiftedBook.bind(campaignStorage),

  // Add keyword bidding bindings
  createKeywordBid: campaignStorage.createKeywordBid.bind(campaignStorage),
  updateKeywordBid: campaignStorage.updateKeywordBid.bind(campaignStorage),
  getKeywordBids: campaignStorage.getKeywordBids.bind(campaignStorage),
  updateBidMetrics: campaignStorage.updateBidMetrics.bind(campaignStorage),
  adjustAutomaticBids: campaignStorage.adjustAutomaticBids.bind(campaignStorage),

  // Publisher
  getPublishers: publisherStorage.getPublishers.bind(publisherStorage),
  getPublisher: publisherStorage.getPublisher.bind(publisherStorage),
  createPublisher: publisherStorage.createPublisher.bind(publisherStorage),
  getPublisherAuthors: publisherStorage.getPublisherAuthors.bind(publisherStorage),
  addAuthorToPublisher: publisherStorage.addAuthorToPublisher.bind(publisherStorage),
  removeAuthorFromPublisher: publisherStorage.removeAuthorFromPublisher.bind(publisherStorage),
  getAuthorPublisher: publisherStorage.getAuthorPublisher.bind(publisherStorage),

  // Session store for auth
  sessionStore: accountStorage.sessionStore,
};

// Export interfaces from their respective modules
export type { IAccountStorage } from "./storage/account";
export type { IBookStorage } from "./storage/books";
export type { IAnalyticsStorage } from "./storage/analytics";
export type { ILandingPageStorage } from "./storage/landing-page";
export type { ICampaignStorage } from "./storage/campaigns";
export type { IPublisherStorage } from "./storage/publisher";

// Re-export storage classes
export {
  AccountStorage,
  BookStorage,
  AnalyticsStorage,
  LandingPageStorage,
  CampaignStorage,
  PublisherStorage,
};