import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { BetaProvider } from "@/hooks/use-beta";
import { ThemeProvider } from "@/hooks/use-theme";
import { OnboardingProvider } from "@/hooks/use-onboarding";
import EmailCollectionPage from "@/pages/admin/email-collection";
import { MainNav } from "@/components/main-nav";
import { AuthModal } from "@/components/auth-modal";
import { ReviewInviteDialog } from "@/components/review-invite-dialog";
import { RatingCriteriaWizard } from "@/components/rating-criteria-wizard";
import { FloatingSignup } from "@/components/floating-signup";
import { ImpressionSync } from "@/components/impression-sync";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import NewLandingPage from "@/pages/new-landing-page";
import BookDetails from "@/pages/book-details";
import SettingsPage from "@/pages/settings-page";
import AuthorPage from "@/pages/author-page";
import DashboardPage from "@/pages/dashboard-page";
import ProDashboard from "@/pages/pro-dashboard";
import { SearchBooksPage } from "@/pages/search-books-page";
import { SearchAuthorsPage } from "@/pages/search-authors-page";
import { ProtectedRoute } from "./lib/protected-route";
import ProActionPage from "@/pages/pro-action-page";
import ProAuthorProfilePage from "@/pages/pro-author-profile-page";
import FollowerTest from "@/pages/follower-test";
import PublisherPage from "@/pages/publisher-page";
import PublisherDashboard from "@/pages/publisher-dashboard";
import { HomepageSettingsPage } from "@/pages/homepage-settings-page";
import { useAuthModal } from "@/hooks/use-auth-modal";
import AdminPanel from "@/pages/admin-panel";
import SalesPanel from "@/pages/sales-panel";
import HowItWorks from "@/pages/how-it-works";
import PartnerWithUs from "@/pages/partner";
import AdShowcasePage from "@/pages/ad-showcase-page";
import ProReviewsPage from "@/pages/pro-reviews-page";
import DiscoverPage from "@/pages/discover-page";
import BookShelfPage from "@/pages/book-shelf-page";
import FeedbackButton from "@/components/feedback-button";

import AuthWallPage from "@/pages/auth-wall-page";
import { Redirect, useLocation } from "wouter";
import { useBeta } from "@/hooks/use-beta";
import { useAuth } from "@/hooks/use-auth";
import { TestImages } from "@/pages/test-images";
import AuthCheckPage from "@/pages/auth-check";
import { ImageGuidePage } from "@/pages/image-guide";

function Router() {
  const showLandingPage = import.meta.env.VITE_SHOW_LANDING === "true";
  const [location] = useLocation();
  const { isBetaActive, isLoading: isBetaLoading } = useBeta();
  const { user, isLoading: isAuthLoading } = useAuth();

  const allowedPaths = ["/landing", "/how-it-works", "/partner", "/new-landing"];
  const isApiPath = location.startsWith("/api");
  const isAuthWallPath = location === "/auth";
  const [path, hash] = location.split("#");

  // Show loading state while checking auth and beta status
  if (isBetaLoading || isAuthLoading) {
    return null;
  }

  // If beta mode is active and user is not logged in, redirect to auth wall
  // unless it's an allowed path or already on the auth wall
  if (isBetaActive && !user && !allowedPaths.includes(path) && !isApiPath && !isAuthWallPath) {
    return <Redirect to="/auth" />;
  }
  
  // If landing page is configured to show, honor that setting
  // but only if not in beta mode (beta mode takes precedence)
  if (!isBetaActive && showLandingPage && !allowedPaths.includes(path) && !isApiPath) {
    return <Redirect to={`/landing${hash ? '#' + hash : ''}`} />;
  }

  // Component selection based on landing page setting
  const HomeComponent = showLandingPage ? NewLandingPage : HomePage;

  return (
    <>
      {!allowedPaths.includes(path) && path !== "/auth" && <MainNav />}

      <Switch>
        {/* Always accessible routes */}
        <Route path="/landing" component={NewLandingPage} />
        <Route path="/new-landing" component={NewLandingPage} />

        <Route path="/how-it-works" component={HowItWorks} />
        <Route path="/partner" component={PartnerWithUs} />
        
        {/* Auth wall */}
        <Route path="/auth" component={AuthWallPage} />
        <Route path="/auth-check" component={AuthCheckPage} />

        {/* Public routes that require authentication in beta mode */}
        <Route path="/" component={HomeComponent} />
        <Route path="/books/:id" component={BookDetails} />
        <Route path="/search/books" component={SearchBooksPage} />
        <Route path="/search/authors" component={SearchAuthorsPage} />
        <Route path="/authors/:id" component={AuthorPage} />
        <Route path="/publishers/:id" component={PublisherPage} />
        <Route path="/ad-showcase" component={AdShowcasePage} />
        <Route path="/test-images" component={TestImages} />
        <Route path="/image-guide" component={ImageGuidePage} />
        
        {/* Discover routes - new taxonomy-based search pages */}
        <Route path="/discover" component={DiscoverPage} />
        <Route path="/discover/:type" component={DiscoverPage} />
        <Route path="/discover/:type/:id" component={DiscoverPage} />

        {/* Protected routes (always require login) */}
        <ProtectedRoute path="/settings" component={SettingsPage} />
        <ProtectedRoute path="/settings/account" component={SettingsPage} />
        <ProtectedRoute path="/settings/appearance" component={SettingsPage} />
        <ProtectedRoute path="/settings/rating-preferences" component={SettingsPage} />
        <ProtectedRoute path="/settings/genre-preferences" component={SettingsPage} />
        <ProtectedRoute path="/settings/filters" component={SettingsPage} />
        <ProtectedRoute path="/settings/book-shelf" component={SettingsPage} />
        <ProtectedRoute path="/settings/homepage" component={() => <HomepageSettingsPage />} />
        <ProtectedRoute path="/settings/author" component={SettingsPage} />
        <ProtectedRoute path="/dashboard" component={DashboardPage} />
        <ProtectedRoute path="/book-shelf/:id" component={BookShelfPage} />
        <ProtectedRoute path="/pro" component={ProDashboard} />
        <ProtectedRoute path="/pro/action" component={ProActionPage} />
        <ProtectedRoute path="/pro/reviews" component={ProReviewsPage} />
        <ProtectedRoute path="/pro/book-management" component={ProDashboard} />
        <ProtectedRoute path="/pro/author" component={ProAuthorProfilePage} />
        <ProtectedRoute path="/follower-test" component={FollowerTest} />

        {/* Admin routes */}
        <ProtectedRoute path="/admin" component={AdminPanel} />
        <ProtectedRoute path="/admin/users" component={AdminPanel} />
        <ProtectedRoute path="/admin/settings" component={AdminPanel} />
        <ProtectedRoute path="/admin/reports" component={AdminPanel} />
        <ProtectedRoute path="/admin/email-collection" component={EmailCollectionPage} />
        
        {/* Sales routes */}
        <ProtectedRoute path="/sales" component={SalesPanel} />
        
        {/* Publisher routes */}
        <ProtectedRoute path="/publisher" component={PublisherDashboard} />

        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  const { isOpen, setIsOpen } = useAuthModal();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <BetaProvider>
          <AuthProvider>
            <OnboardingProvider>
              <Router />
              <FeedbackButton />
              <AuthModal isOpen={isOpen} onOpenChange={setIsOpen} />
              <ReviewInviteDialog />
              <RatingCriteriaWizard />
              <ImpressionSync />
              <Toaster />
            </OnboardingProvider>
          </AuthProvider>
        </BetaProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;