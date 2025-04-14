import { AccountStorage } from "./storage/account";
import { BookStorage } from "./storage/books";
import { AnalyticsStorage } from "./storage/analytics";
import { LandingPageStorage } from "./storage/landing-page";
import { CampaignStorage } from "./storage/campaigns";
import { PublisherStorage } from "./storage/publisher";
import { AuthorStorage } from "./storage/author";
import { AuthorAnalyticsStorage } from "./storage/author-analytics";
import { BetaKeyStorage } from "./storage/beta-keys";
import { HomepageLayoutStorage } from "./storage/homepage-layout";
import { FeedbackStorage } from "./storage/feedback";
import { SellerStorage } from "./storage/seller";

// Create instances of all storage modules
const accountStorage = new AccountStorage();
const bookStorage = new BookStorage();
const analyticsStorage = new AnalyticsStorage();
const landingPageStorage = new LandingPageStorage();
const campaignStorage = new CampaignStorage();
const publisherStorage = new PublisherStorage();
const authorStorage = new AuthorStorage();
const authorAnalyticsStorage = new AuthorAnalyticsStorage();
const betaKeyStorage = new BetaKeyStorage();
const homepageLayoutStorage = new HomepageLayoutStorage();
const feedbackStorage = new FeedbackStorage();
const sellerStorage = new SellerStorage();

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
  getReplies: accountStorage.getReplies.bind(accountStorage),
  createReply: accountStorage.createReply.bind(accountStorage),
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
  getRatingPreferences: accountStorage.getRatingPreferences.bind(accountStorage),
  saveRatingPreferences: accountStorage.saveRatingPreferences.bind(accountStorage),
  getUserGenreViews: accountStorage.getUserGenreViews.bind(accountStorage),
  getViewGenres: accountStorage.getViewGenres.bind(accountStorage),
  createGenreView: accountStorage.createGenreView.bind(accountStorage),
  updateGenreView: accountStorage.updateGenreView.bind(accountStorage),
  deleteGenreView: accountStorage.deleteGenreView.bind(accountStorage),
  addGenreToView: accountStorage.addGenreToView.bind(accountStorage),
  removeGenreFromView: accountStorage.removeGenreFromView.bind(accountStorage),
  updateGenreRank: accountStorage.updateGenreRank.bind(accountStorage),
  
  // Author analytics
  recordAuthorAction: authorAnalyticsStorage.recordAuthorAction.bind(authorAnalyticsStorage),
  getAuthorActions: authorAnalyticsStorage.getAuthorActions.bind(authorAnalyticsStorage),
  recordPageView: authorAnalyticsStorage.recordPageView.bind(authorAnalyticsStorage),
  updatePageViewExit: authorAnalyticsStorage.updatePageViewExit.bind(authorAnalyticsStorage),
  getAuthorPageViews: authorAnalyticsStorage.getAuthorPageViews.bind(authorAnalyticsStorage),
  recordFormAnalytics: authorAnalyticsStorage.recordFormAnalytics.bind(authorAnalyticsStorage),
  updateFormStatus: authorAnalyticsStorage.updateFormStatus.bind(authorAnalyticsStorage),
  getAuthorFormAnalytics: authorAnalyticsStorage.getAuthorFormAnalytics.bind(authorAnalyticsStorage),
  getAuthorActivitySummary: authorAnalyticsStorage.getAuthorActivitySummary.bind(authorAnalyticsStorage),

  // Book management
  getBooks: bookStorage.getBooks.bind(bookStorage),
  getBook: bookStorage.getBook.bind(bookStorage),
  getBooksByAuthor: bookStorage.getBooksByAuthor.bind(bookStorage),
  createBook: bookStorage.createBook.bind(bookStorage),
  promoteBook: bookStorage.promoteBook.bind(bookStorage),
  updateBook: bookStorage.updateBook.bind(bookStorage),
  updateBookTaxonomies: bookStorage.updateBookTaxonomies.bind(bookStorage),
  getBookTaxonomies: bookStorage.getBookTaxonomies.bind(bookStorage),
  deleteBook: bookStorage.deleteBook.bind(bookStorage),
  getAuthorGenres: bookStorage.getAuthorGenres.bind(bookStorage),
  selectBooks: bookStorage.selectBooks.bind(bookStorage),
  updateInternalDetails: bookStorage.updateInternalDetails.bind(bookStorage),
  getRecommendations: bookStorage.getRecommendations.bind(bookStorage),

  // Analytics
  recordBookImpression:
    analyticsStorage.recordBookImpression.bind(analyticsStorage),
  recordBookClickThrough:
    analyticsStorage.recordBookClickThrough.bind(analyticsStorage),
  updateBookStats: analyticsStorage.updateBookStats.bind(analyticsStorage),
  getBookImpressions: analyticsStorage.getBookImpressions.bind(analyticsStorage),
  getBookClickThroughs: analyticsStorage.getBookClickThroughs.bind(analyticsStorage),
  getBooksMetrics: analyticsStorage.getBooksMetrics.bind(analyticsStorage),
  calculatePopularBooks: analyticsStorage.calculatePopularBooks.bind(analyticsStorage),
  getPopularBooks: analyticsStorage.getPopularBooks.bind(analyticsStorage),

  // Landing page
  createLandingSession:
    landingPageStorage.createLandingSession.bind(landingPageStorage),
  updateLandingSession:
    landingPageStorage.updateLandingSession.bind(landingPageStorage),
  endLandingSession:
    landingPageStorage.endLandingSession.bind(landingPageStorage),
  recordLandingEvent:
    landingPageStorage.recordLandingEvent.bind(landingPageStorage),
  getLandingSession:
    landingPageStorage.getLandingSession.bind(landingPageStorage),
  createSignupInterest:
    landingPageStorage.createSignupInterest.bind(landingPageStorage),
  getSignupInterests:
    landingPageStorage.getSignupInterests.bind(landingPageStorage),
  createPartnershipInquiry:
    landingPageStorage.createPartnershipInquiry.bind(landingPageStorage),
  getPartnershipInquiries:
    landingPageStorage.getPartnershipInquiries.bind(landingPageStorage),

  // Campaigns
  getCampaigns: campaignStorage.getCampaigns.bind(campaignStorage),
  createCampaign: campaignStorage.createCampaign.bind(campaignStorage),
  updateCampaignStatus:
    campaignStorage.updateCampaignStatus.bind(campaignStorage),
  updateCampaignMetrics:
    campaignStorage.updateCampaignMetrics.bind(campaignStorage),
  getUserCredits: campaignStorage.getUserCredits.bind(campaignStorage),
  addCredits: campaignStorage.addCredits.bind(campaignStorage),
  deductCredits: campaignStorage.deductCredits.bind(campaignStorage),
  getCreditTransactions:
    campaignStorage.getCreditTransactions.bind(campaignStorage),
  getGiftedBooks: campaignStorage.getGiftedBooks.bind(campaignStorage),
  createGiftedBook: campaignStorage.createGiftedBook.bind(campaignStorage),
  claimGiftedBook: campaignStorage.claimGiftedBook.bind(campaignStorage),
  getAvailableGiftedBook:
    campaignStorage.getAvailableGiftedBook.bind(campaignStorage),
  
  // Ad impressions tracking
  recordAdImpression: campaignStorage.recordAdImpression.bind(campaignStorage),
  recordAdClick: campaignStorage.recordAdClick.bind(campaignStorage),
  getAdImpressions: campaignStorage.getAdImpressions.bind(campaignStorage),
  getAdImpressionsByBook: campaignStorage.getAdImpressionsByBook.bind(campaignStorage),
  getAdMetrics: campaignStorage.getAdMetrics.bind(campaignStorage),

  // Publisher
  getPublishers: publisherStorage.getPublishers.bind(publisherStorage),
  getPublisher: publisherStorage.getPublisher.bind(publisherStorage),
  getPublisherByUserId: publisherStorage.getPublisherByUserId.bind(publisherStorage),
  createPublisher: publisherStorage.createPublisher.bind(publisherStorage),
  isUserPublisher: publisherStorage.isUserPublisher.bind(publisherStorage),
  updatePublisher: publisherStorage.updatePublisher.bind(publisherStorage),
  getPublisherAuthors:
    publisherStorage.getPublisherAuthors.bind(publisherStorage),
  addAuthorToPublisher:
    publisherStorage.addAuthorToPublisher.bind(publisherStorage),
  removeAuthorFromPublisher:
    publisherStorage.removeAuthorFromPublisher.bind(publisherStorage),
  getAuthorPublisher:
    publisherStorage.getAuthorPublisher.bind(publisherStorage),
    
  // Publisher Sellers
  createPublisherSeller:
    publisherStorage.createPublisherSeller.bind(publisherStorage),
  getPublisherSeller:
    publisherStorage.getPublisherSeller.bind(publisherStorage),
  getPublisherSellerByUserId:
    publisherStorage.getPublisherSellerByUserId.bind(publisherStorage),
  getPublisherSellerByEmail:
    publisherStorage.getPublisherSellerByEmail.bind(publisherStorage),
  getPublisherSellerByVerificationCode:
    publisherStorage.getPublisherSellerByVerificationCode.bind(publisherStorage),
  updatePublisherSeller:
    publisherStorage.updatePublisherSeller.bind(publisherStorage),
  isPublisherSeller:
    publisherStorage.isPublisherSeller.bind(publisherStorage),
  generateVerificationCode:
    publisherStorage.generateVerificationCode.bind(publisherStorage),
    
  // Author
  getAuthors: authorStorage.getAuthors.bind(authorStorage),
  getAuthor: authorStorage.getAuthor.bind(authorStorage),
  getAuthorByUserId: authorStorage.getAuthorByUserId.bind(authorStorage),
  createAuthor: authorStorage.createAuthor.bind(authorStorage),
  isUserAuthor: authorStorage.isUserAuthor.bind(authorStorage),
  updateAuthor: authorStorage.updateAuthor.bind(authorStorage),
  getAuthorFollowerCount: authorStorage.getAuthorFollowerCount.bind(authorStorage),
  getAuthorAggregateRatings: authorStorage.getAuthorAggregateRatings.bind(authorStorage),

  // Session store for auth
  sessionStore: accountStorage.sessionStore,
  
  // Beta key management
  createBetaKey: betaKeyStorage.createBetaKey.bind(betaKeyStorage),
  generateBetaKey: betaKeyStorage.generateBetaKey.bind(betaKeyStorage),
  getBetaKeys: betaKeyStorage.getBetaKeys.bind(betaKeyStorage),
  getBetaKey: betaKeyStorage.getBetaKey.bind(betaKeyStorage),
  getBetaKeyByKey: betaKeyStorage.getBetaKeyByKey.bind(betaKeyStorage),
  updateBetaKey: betaKeyStorage.updateBetaKey.bind(betaKeyStorage),
  deleteBetaKey: betaKeyStorage.deleteBetaKey.bind(betaKeyStorage),
  validateBetaKey: betaKeyStorage.validateBetaKey.bind(betaKeyStorage),
  recordBetaKeyUsage: betaKeyStorage.recordBetaKeyUsage.bind(betaKeyStorage),
  getBetaKeyUsage: betaKeyStorage.getBetaKeyUsage.bind(betaKeyStorage),
  hasUserUsedBetaKey: betaKeyStorage.hasUserUsedBetaKey.bind(betaKeyStorage),
  isBetaActive: betaKeyStorage.isBetaActive.bind(betaKeyStorage),
  
  // Homepage layout
  getHomepageLayout: homepageLayoutStorage.getHomepageLayout.bind(homepageLayoutStorage),
  updateHomepageLayout: homepageLayoutStorage.updateHomepageLayout.bind(homepageLayoutStorage),
  
  // Feedback
  createFeedbackTicket: feedbackStorage.createFeedbackTicket.bind(feedbackStorage),
  getFeedbackTickets: feedbackStorage.getFeedbackTickets.bind(feedbackStorage),
  getFeedbackTicket: feedbackStorage.getFeedbackTicket.bind(feedbackStorage),
  getFeedbackTicketByNumber: feedbackStorage.getFeedbackTicketByNumber.bind(feedbackStorage),
  updateFeedbackTicket: feedbackStorage.updateFeedbackTicket.bind(feedbackStorage),
  getUserFeedbackTickets: feedbackStorage.getUserFeedbackTickets.bind(feedbackStorage),
  getNewTickets: feedbackStorage.getNewTickets.bind(feedbackStorage),
  getResolvedTickets: feedbackStorage.getResolvedTickets.bind(feedbackStorage),
  
  // Seller management
  isUserSeller: sellerStorage.isUserSeller.bind(sellerStorage),
  getSellerByUserId: sellerStorage.getSellerByUserId.bind(sellerStorage),
  getSellerById: sellerStorage.getSellerById.bind(sellerStorage),
  createSeller: sellerStorage.createSeller.bind(sellerStorage),
  updateSeller: sellerStorage.updateSeller.bind(sellerStorage),
  getAllActiveSellers: sellerStorage.getAllActiveSellers.bind(sellerStorage),
  createPublisherSellerVerificationCode: sellerStorage.createPublisherSellerVerificationCode.bind(sellerStorage),
  getSPVerificationCode: sellerStorage.getPublisherSellerByVerificationCode.bind(sellerStorage),
  getSellerDetailsByVerificationCode: sellerStorage.getSellerDetailsByVerificationCode.bind(sellerStorage),
  getSellerVerificationCodes: sellerStorage.getSellerVerificationCodes.bind(sellerStorage),
  searchUsers: sellerStorage.searchUsers.bind(sellerStorage),
  getVerifiedPublishers: sellerStorage.getVerifiedPublishers.bind(sellerStorage),
};

// Export interfaces from their respective modules
export type { IAccountStorage } from "./storage/account";
export type { IBookStorage } from "./storage/books";
export type { IAnalyticsStorage } from "./storage/analytics";
export type { ILandingPageStorage } from "./storage/landing-page";
export type { ICampaignStorage } from "./storage/campaigns";
export type { IPublisherStorage } from "./storage/publisher";
export type { IAuthorStorage } from "./storage/author";
export type { IAuthorAnalyticsStorage } from "./storage/author-analytics";
export type { IBetaKeyStorage } from "./storage/beta-keys";
export type { IHomepageLayoutStorage } from "./storage/homepage-layout";
export type { IFeedbackStorage } from "./storage/feedback";
export type { ISellerStorage } from "./storage/seller";

// Re-export storage classes
export {
  AccountStorage,
  BookStorage,
  AnalyticsStorage,
  LandingPageStorage,
  CampaignStorage,
  PublisherStorage,
  AuthorStorage,
  AuthorAnalyticsStorage,
  BetaKeyStorage,
  HomepageLayoutStorage,
  FeedbackStorage,
  SellerStorage,
};