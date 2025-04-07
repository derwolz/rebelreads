import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { AuthorAnalyticsProvider } from "@/components/author-analytics-provider";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  
  // Check if this is a Pro route that needs analytics tracking
  const isProRoute = path.startsWith("/pro");

  const renderComponent = () => {
    // For Pro routes, wrap with AuthorAnalyticsProvider
    if (isProRoute) {
      return (
        <AuthorAnalyticsProvider>
          <Component />
        </AuthorAnalyticsProvider>
      );
    }
    
    // For other routes, render component directly
    return <Component />;
  };

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      ) : !user ? (
        <Redirect to="/auth" />
      ) : (
        renderComponent()
      )}
    </Route>
  );
}
