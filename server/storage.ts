import { BaseStorage, baseStorage } from "./storage/base";
import { BookStorage, bookStorage } from "./storage/book-management";
import { SocialStorage, socialStorage } from "./storage/social";
import { CampaignStorage, campaignStorage } from "./storage/campaign";
import { LandingStorage, landingStorage } from "./storage/landing";

// Combine all storage interfaces
export interface IStorage extends 
  BaseStorage,
  BookStorage,
  SocialStorage,
  CampaignStorage,
  LandingStorage {
    getBooksMetrics(
      bookIds: number[],
      days?: number,
      metrics?: ("impressions" | "clicks" | "ctr")[]
    ): Promise<{
      date: string;
      metrics: {
        [key: string]: number;
      };
    }[]>;
}

// Create a combined storage class that implements all interfaces
class DatabaseStorage implements IStorage {
  private _sessionStore;
  // Base Storage
  getUser;
  getUserByUsername;
  getUserByEmail;
  createUser;
  updateUser;
  toggleAuthorStatus;

  // Book Storage
  getBooks;
  getBook;
  getBooksByAuthor;
  createBook;
  promoteBook;
  updateBook;
  deleteBook;
  getRatings;
  createRating;
  getUserRatings;
  getReadingStatus;
  toggleWishlist;
  markAsCompleted;
  getWishlistedBooks;
  getCompletedBooks;

  // Social Storage
  followAuthor;
  unfollowAuthor;
  isFollowing;
  getFollowerCount;
  getFollowingCount;
  getFollowerMetrics;
  recordBookImpression;
  recordBookClickThrough;
  updateBookStats;
  getAuthorGenres;
  getAuthorAggregateRatings;
  getFollowedAuthorsBooks;

  // Campaign Storage
  getCampaigns;
  createCampaign;
  updateCampaignStatus;
  updateCampaignMetrics;
  getPublishers;
  getPublisher;
  createPublisher;
  getPublisherAuthors;
  addAuthorToPublisher;
  removeAuthorFromPublisher;
  getAuthorPublisher;
  getUserCredits;
  addCredits;
  deductCredits;
  getCreditTransactions;
  getGiftedBooks;
  createGiftedBook;
  claimGiftedBook;
  getAvailableGiftedBook;

  // Landing Storage
  createLandingSession;
  updateLandingSession;
  endLandingSession;
  recordLandingEvent;
  getLandingSession;
  createSignupInterest;
  getSignupInterests;
  createPartnershipInquiry;
  getPartnershipInquiries;

  constructor(
    private readonly base: BaseStorage,
    private readonly book: BookStorage,
    private readonly social: SocialStorage,
    private readonly campaign: CampaignStorage,
    private readonly landing: LandingStorage
  ) {
    this._sessionStore = base.sessionStore;

    // Bind all methods in constructor
    // Base Storage
    this.getUser = this.base.getUser.bind(this.base);
    this.getUserByUsername = this.base.getUserByUsername.bind(this.base);
    this.getUserByEmail = this.base.getUserByEmail.bind(this.base);
    this.createUser = this.base.createUser.bind(this.base);
    this.updateUser = this.base.updateUser.bind(this.base);
    this.toggleAuthorStatus = this.base.toggleAuthorStatus.bind(this.base);

    // Book Storage
    this.getBooks = this.book.getBooks.bind(this.book);
    this.getBook = this.book.getBook.bind(this.book);
    this.getBooksByAuthor = this.book.getBooksByAuthor.bind(this.book);
    this.createBook = this.book.createBook.bind(this.book);
    this.promoteBook = this.book.promoteBook.bind(this.book);
    this.updateBook = this.book.updateBook.bind(this.book);
    this.deleteBook = this.book.deleteBook.bind(this.book);
    this.getRatings = this.book.getRatings.bind(this.book);
    this.createRating = this.book.createRating.bind(this.book);
    this.getUserRatings = this.book.getUserRatings.bind(this.book);
    this.getReadingStatus = this.book.getReadingStatus.bind(this.book);
    this.toggleWishlist = this.book.toggleWishlist.bind(this.book);
    this.markAsCompleted = this.book.markAsCompleted.bind(this.book);
    this.getWishlistedBooks = this.book.getWishlistedBooks.bind(this.book);
    this.getCompletedBooks = this.book.getCompletedBooks.bind(this.book);

    // Social Storage
    this.followAuthor = this.social.followAuthor.bind(this.social);
    this.unfollowAuthor = this.social.unfollowAuthor.bind(this.social);
    this.isFollowing = this.social.isFollowing.bind(this.social);
    this.getFollowerCount = this.social.getFollowerCount.bind(this.social);
    this.getFollowingCount = this.social.getFollowingCount.bind(this.social);
    this.getFollowerMetrics = this.social.getFollowerMetrics.bind(this.social);
    this.recordBookImpression = this.social.recordBookImpression.bind(this.social);
    this.recordBookClickThrough = this.social.recordBookClickThrough.bind(this.social);
    this.updateBookStats = this.social.updateBookStats.bind(this.social);
    this.getAuthorGenres = this.social.getAuthorGenres.bind(this.social);
    this.getAuthorAggregateRatings = this.social.getAuthorAggregateRatings.bind(this.social);
    this.getFollowedAuthorsBooks = this.social.getFollowedAuthorsBooks.bind(this.social);

    // Campaign Storage
    this.getCampaigns = this.campaign.getCampaigns.bind(this.campaign);
    this.createCampaign = this.campaign.createCampaign.bind(this.campaign);
    this.updateCampaignStatus = this.campaign.updateCampaignStatus.bind(this.campaign);
    this.updateCampaignMetrics = this.campaign.updateCampaignMetrics.bind(this.campaign);
    this.getPublishers = this.campaign.getPublishers.bind(this.campaign);
    this.getPublisher = this.campaign.getPublisher.bind(this.campaign);
    this.createPublisher = this.campaign.createPublisher.bind(this.campaign);
    this.getPublisherAuthors = this.campaign.getPublisherAuthors.bind(this.campaign);
    this.addAuthorToPublisher = this.campaign.addAuthorToPublisher.bind(this.campaign);
    this.removeAuthorFromPublisher = this.campaign.removeAuthorFromPublisher.bind(this.campaign);
    this.getAuthorPublisher = this.campaign.getAuthorPublisher.bind(this.campaign);
    this.getUserCredits = this.campaign.getUserCredits.bind(this.campaign);
    this.addCredits = this.campaign.addCredits.bind(this.campaign);
    this.deductCredits = this.campaign.deductCredits.bind(this.campaign);
    this.getCreditTransactions = this.campaign.getCreditTransactions.bind(this.campaign);
    this.getGiftedBooks = this.campaign.getGiftedBooks.bind(this.campaign);
    this.createGiftedBook = this.campaign.createGiftedBook.bind(this.campaign);
    this.claimGiftedBook = this.campaign.claimGiftedBook.bind(this.campaign);
    this.getAvailableGiftedBook = this.campaign.getAvailableGiftedBook.bind(this.campaign);
    this.getBooksMetrics = this.campaign.getBooksMetrics.bind(this.campaign);


    // Landing Storage
    this.createLandingSession = this.landing.createLandingSession.bind(this.landing);
    this.updateLandingSession = this.landing.updateLandingSession.bind(this.landing);
    this.endLandingSession = this.landing.endLandingSession.bind(this.landing);
    this.recordLandingEvent = this.landing.recordLandingEvent.bind(this.landing);
    this.getLandingSession = this.landing.getLandingSession.bind(this.landing);
    this.createSignupInterest = this.landing.createSignupInterest.bind(this.landing);
    this.getSignupInterests = this.landing.getSignupInterests.bind(this.landing);
    this.createPartnershipInquiry = this.landing.createPartnershipInquiry.bind(this.landing);
    this.getPartnershipInquiries = this.landing.getPartnershipInquiries.bind(this.landing);
  }

  get sessionStore() {
    return this._sessionStore;
  }
}

// Create and export the combined storage instance
export const dbStorage = new DatabaseStorage(
  baseStorage,
  bookStorage,
  socialStorage,
  campaignStorage,
  landingStorage
);

// Export all storage types
export type {
  BaseStorage,
  BookStorage,
  SocialStorage,
  CampaignStorage,
  LandingStorage
};