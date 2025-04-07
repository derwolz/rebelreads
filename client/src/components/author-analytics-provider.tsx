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
  const { user } = useAuth();

  // Track page view whenever location changes
  useEffect(() => {
    // Only track for authors
    if (user?.isAuthor) {
      const referrer = document.referrer || "";
      trackPageView(location, referrer);
    }
  }, [location, trackPageView, user]);

  return <>{children}</>;
}