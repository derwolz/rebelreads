import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/hooks/use-theme";
import { MainNav } from "@/components/main-nav";
import { AuthModal } from "@/components/auth-modal";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
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

function Router() {
  return (
    <>
      <MainNav />
      <Switch>
        {/* Public routes */}
        <Route path="/" component={HomePage} />
        <Route path="/books/:id" component={BookDetails} />
        <Route path="/search/books" component={SearchBooksPage} />
        <Route path="/search/authors" component={SearchAuthorsPage} />
        <Route path="/authors/:id" component={AuthorPage} />
        <Route path="/publishers/:id" component={PublisherPage} />

        {/* Protected routes */}
        <ProtectedRoute path="/settings" component={SettingsPage} />
        <ProtectedRoute path="/settings/account" component={SettingsPage} />
        <ProtectedRoute path="/settings/appearance" component={SettingsPage} />
        <ProtectedRoute path="/dashboard" component={DashboardPage} />
        <ProtectedRoute path="/pro" component={ProDashboard} />
        <ProtectedRoute path="/pro/action" component={ProActionPage} />
        <ProtectedRoute path="/pro/reviews" component={ProDashboard} />
        <ProtectedRoute path="/pro/author-settings" component={ProDashboard} />

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
        <AuthProvider>
          <Router />
          <AuthModal isOpen={isOpen} onOpenChange={setIsOpen} />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;