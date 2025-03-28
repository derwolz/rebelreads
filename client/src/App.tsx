import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { MainNav } from "@/components/main-nav";
import { AuthModal } from "@/components/auth-modal";
import { ReviewInviteDialog } from "@/components/review-invite-dialog";
import { FloatingSignup } from "@/components/floating-signup";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import LandingPage from "@/pages/landing-page";
import BookDetails from "@/pages/book-details";
import SettingsPage from "@/pages/settings-page";
import AuthorPage from "@/pages/author-page";
import DashboardPage from "@/pages/dashboard-page";
import ProDashboard from "@/pages/pro-dashboard";
import { SearchBooksPage } from "@/pages/search-books-page";
import { SearchAuthorsPage } from "@/pages/search-authors-page";
import { ProtectedRoute } from "./lib/protected-route";
import ProActionPage from "@/pages/pro-action-page";
import PublisherPage from "@/pages/publisher-page";
import { useAuthModal } from "@/hooks/use-auth-modal";
import AdminPanel from "@/pages/admin-panel";
import HowItWorks from "@/pages/how-it-works";
import PartnerWithUs from "@/pages/partner";
import AdShowcasePage from "@/pages/ad-showcase-page";
import { Redirect, useLocation } from "wouter";

function Router() {
  const showLandingPage = import.meta.env.VITE_SHOW_LANDING === "true";
  const [location] = useLocation();

  const allowedPaths = ["/landing", "/how-it-works", "/partner"];
  const isApiPath = location.startsWith("/api");
  const [path, hash] = location.split("#");

  if (showLandingPage && !allowedPaths.includes(path) && !isApiPath) {
    return <Redirect to={`/landing${hash ? '#' + hash : ''}`} />;
  }

  return (
    <>
      {!allowedPaths.includes(path) && <MainNav />}

      <Switch>
        {/* Public routes */}
        <Route path="/" component={showLandingPage ? LandingPage : HomePage} />
        <Route path="/landing" component={LandingPage} />
        <Route path="/how-it-works" component={HowItWorks} />
        <Route path="/partner" component={PartnerWithUs} />
        <Route path="/books/:id" component={BookDetails} />
        <Route path="/search/books" component={SearchBooksPage} />
        <Route path="/search/authors" component={SearchAuthorsPage} />
        <Route path="/authors/:id" component={AuthorPage} />
        <Route path="/publishers/:id" component={PublisherPage} />
        <Route path="/ad-showcase" component={AdShowcasePage} />

        {/* Protected routes */}
        <ProtectedRoute path="/settings" component={SettingsPage} />
        <ProtectedRoute path="/settings/account" component={SettingsPage} />
        <ProtectedRoute path="/settings/appearance" component={SettingsPage} />
        <ProtectedRoute path="/dashboard" component={DashboardPage} />
        <ProtectedRoute path="/pro" component={ProDashboard} />
        <ProtectedRoute path="/pro/action" component={ProActionPage} />
        <ProtectedRoute path="/pro/reviews" component={ProDashboard} />
        <ProtectedRoute path="/pro/book-management" component={ProDashboard} />

        {/* Admin routes */}
        <ProtectedRoute path="/admin" component={AdminPanel} />
        <ProtectedRoute path="/admin/users" component={AdminPanel} />
        <ProtectedRoute path="/admin/settings" component={AdminPanel} />
        <ProtectedRoute path="/admin/reports" component={AdminPanel} />

        <Route component={NotFound} />
      </Switch>

      {allowedPaths.includes(path) && <FloatingSignup />}
    </>
  );
}

function App() {
  const { isOpen, setIsOpen } = useAuthModal();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <AuthProvider>
          <Router />
          <AuthModal isOpen={isOpen} onOpenChange={setIsOpen} />
          <ReviewInviteDialog />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;