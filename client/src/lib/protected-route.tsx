import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { AuthorAnalyticsProvider } from "@/components/author-analytics-provider";
import { useToast } from "@/hooks/use-toast";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading, isAuthor } = useAuth();
  const { toast } = useToast();
  
  // Check if this is a Pro route that needs analytics tracking
  const isProRoute = path.startsWith("/pro");
  
  // Check if user is an author for Pro routes
  const isAuthorRequired = isProRoute;
  const hasPermission = !isAuthorRequired || isAuthor;

  const renderComponent = () => {
    // Show toast if trying to access Pro route without author permissions
    if (isProRoute && user && !isAuthor) {
      toast({
        title: "Author access required",
        description: "You need author privileges to access this area.",
        variant: "destructive",
      });
      return <Redirect to="/" />;
    }
    
    // For Pro routes with proper author permissions, wrap with AuthorAnalyticsProvider
    if (isProRoute && user && isAuthor) {
      console.log("Rendering Pro route with analytics tracking");
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
      ) : !hasPermission ? (
        <Redirect to="/" />
      ) : (
        renderComponent()
      )}
    </Route>
  );
}
