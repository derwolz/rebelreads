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
import { FilterStorage } from "./storage/filters";
import { ContentReportStorage } from "./storage/content-reports";
import { SecurityStorage } from "./storage/security";
import { ShelfStorage } from "./storage/shelf";
import { RatingSentimentStorage, ratingSentimentStorage } from "./storage/rating-sentiments";

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
const filterStorage = new FilterStorage();
const contentReportStorage = new ContentReportStorage();
const securityStorage = new SecurityStorage();
const shelfStorage = new ShelfStorage();

// Combine all storage instances into a single object
export const dbStorage = {
  // Rating Sentiments
  getSentimentThresholds: ratingSentimentStorage.getSentimentThresholds.bind(ratingSentimentStorage),
  getSentimentThresholdsByCriteria: ratingSentimentStorage.getSentimentThresholdsByCriteria.bind(ratingSentimentStorage),
  updateSentimentThreshold: ratingSentimentStorage.updateSentimentThreshold.bind(ratingSentimentStorage),
  
  // User and account management
  getUser: accountStorage.getUser.bind(accountStorage),
  getUserByEmail: accountStorage.getUserByEmail.bind(accountStorage),
  getUserByUsername: accountStorage.getUserByUsername.bind(accountStorage),
  getUserByProviderId: accountStorage.getUserByProviderId.bind(accountStorage),
  createUser: accountStorage.createUser.bind(accountStorage),
  updateUser: accountStorage.updateUser.bind(accountStorage),
  toggleAuthorStatus: accountStorage.toggleAuthorStatus.bind(accountStorage),
  getRatings: accountStorage.getRatings.bind(accountStorage),
  getRatingsForBooks: accountStorage.getRatingsForBooks.bind(accountStorage),
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
  isFollowingAuthor: accountStorage.isFollowing.bind(accountStorage), // Alias for isFollowing
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
  getAllBooks: bookStorage.getAllBooks.bind(bookStorage), // Admin method to get all books
  getBook: bookStorage.getBook.bind(bookStorage),
  getBookByAuthorAndTitle: bookStorage.getBookByAuthorAndTitle.bind(bookStorage),
  getBooksByAuthor: bookStorage.getBooksByAuthor.bind(bookStorage),
  createBook: bookStorage.createBook.bind(bookStorage),
  promoteBook: bookStorage.promoteBook.bind(bookStorage),
  updateBook: bookStorage.updateBook.bind(bookStorage),
  updateBookTaxonomies: bookStorage.updateBookTaxonomies.bind(bookStorage),
  getBookTaxonomies: bookStorage.getBookTaxonomies.bind(bookStorage),
  deleteBook: bookStorage.deleteBook.bind(bookStorage),
  deleteAllAuthorBooks: bookStorage.deleteAllAuthorBooks.bind(bookStorage),
  getAuthorGenres: bookStorage.getAuthorGenres.bind(bookStorage),
  selectBooks: bookStorage.selectBooks.bind(bookStorage),
  updateInternalDetails: bookStorage.updateInternalDetails.bind(bookStorage),
  getRecommendations: bookStorage.getRecommendations.bind(bookStorage),
  getComingSoonBooks: bookStorage.getComingSoonBooks.bind(bookStorage),
  addBookImage: bookStorage.addBookImage.bind(bookStorage),

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
  getAllCampaigns: campaignStorage.getAllCampaigns.bind(campaignStorage), // Admin method to get all campaigns
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
  getAuthorByName: authorStorage.getAuthorByName.bind(authorStorage),
  createAuthor: authorStorage.createAuthor.bind(authorStorage),
  isUserAuthor: authorStorage.isUserAuthor.bind(authorStorage),
  updateAuthor: authorStorage.updateAuthor.bind(authorStorage),
  getAuthorFollowerCount: authorStorage.getAuthorFollowerCount.bind(authorStorage),
  getAuthorAggregateRatings: authorStorage.getAuthorAggregateRatings.bind(authorStorage),
  deleteAuthor: authorStorage.deleteAuthor.bind(authorStorage),

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
  
  // Bookshelf
  getSharedBookshelvesForUser: shelfStorage.getSharedBookshelvesForUser.bind(shelfStorage),
  
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
  
  // Content filters and blocks
  getUserBlocks: filterStorage.getUserBlocks.bind(filterStorage),
  getUserBlocksByType: filterStorage.getUserBlocksByType.bind(filterStorage),
  createUserBlock: filterStorage.createUserBlock.bind(filterStorage),
  deleteUserBlock: filterStorage.deleteUserBlock.bind(filterStorage),
  deleteUserBlockByTypeAndId: filterStorage.deleteUserBlockByTypeAndId.bind(filterStorage),
  checkUserBlock: filterStorage.checkUserBlock.bind(filterStorage),
  searchContentToBlock: filterStorage.searchContentToBlock.bind(filterStorage),
  
  // Content reports
  getContentReports: contentReportStorage.getContentReports.bind(contentReportStorage),
  getContentReportsByBook: contentReportStorage.getContentReportsByBook.bind(contentReportStorage),
  getContentReportsByUser: contentReportStorage.getContentReportsByUser.bind(contentReportStorage),
  getContentReport: contentReportStorage.getContentReport.bind(contentReportStorage),
  createContentReport: contentReportStorage.createContentReport.bind(contentReportStorage),
  updateContentReportStatus: contentReportStorage.updateContentReportStatus.bind(contentReportStorage),
  deleteContentReport: contentReportStorage.deleteContentReport.bind(contentReportStorage),
  
  // Security and verification
  createVerificationCode: securityStorage.createVerificationCode.bind(securityStorage),
  getActiveVerificationCode: securityStorage.getActiveVerificationCode.bind(securityStorage),
  markVerificationCodeAsUsed: securityStorage.markVerificationCodeAsUsed.bind(securityStorage),
  invalidateVerificationCodes: securityStorage.invalidateVerificationCodes.bind(securityStorage),
  addTrustedDevice: securityStorage.addTrustedDevice.bind(securityStorage),
  getTrustedDevicesForUser: securityStorage.getTrustedDevicesForUser.bind(securityStorage),
  removeTrustedDevice: securityStorage.removeTrustedDevice.bind(securityStorage),
  updateTrustedDeviceLastUsed: securityStorage.updateTrustedDeviceLastUsed.bind(securityStorage),
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
export type { IContentReportStorage } from "./storage/content-reports";
export type { ISecurityStorage } from "./storage/security";
export type { IShelfStorage } from "./storage/shelf";

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
  FilterStorage,
  ContentReportStorage,
  ShelfStorage,
};