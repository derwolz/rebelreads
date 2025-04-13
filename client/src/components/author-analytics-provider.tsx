import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthorAnalytics } from "@/hooks/use-author-analytics";
import { useAuth } from "@/hooks/use-auth";

interface AuthorAnalyticsProviderProps {
  children: ReactNode;
}

/**
 * Provider component that automatically tracks page views
 * and provides analytics context for author dashboard
 */
export function AuthorAnalyticsProvider({ children }: AuthorAnalyticsProviderProps) {
  const [location] = useLocation();
  const { trackPageView } = useAuthorAnalytics();
  const { user, isAuthor } = useAuth();

  // Track page view whenever location changes
  useEffect(() => {
    // Only track for authors
    if (isAuthor) {
      const referrer = document.referrer || "";
      
      // Log for debugging
      console.log("Tracking page view:", {
        pageUrl: location,
        referrer,
        authorId: user?.id
      });
      
      // We use a ref to track if this is the first render to avoid duplicate calls
      const trackingTimeout = setTimeout(() => {
        trackPageView(location, referrer);
      }, 100);
      
      return () => {
        clearTimeout(trackingTimeout);
      };
    }
  }, [location, user]);  // Remove trackPageView from deps to prevent multiple calls

  return <>{children}</>;
}