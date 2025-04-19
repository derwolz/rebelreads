import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser, LoginData, Author } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AuthorBetaNotification } from "@/components/author-beta-notification";

// Define types for author status response
interface AuthorStatus {
  isAuthor: boolean;
  authorDetails: Author | null;
}

// Extended user interface that includes isAuthor flag for compatibility
interface ExtendedUser extends SelectUser {
  isAuthor?: boolean; // For backward compatibility
  authorDetails?: Author | null;
  noBetaAccess?: boolean; // Flag for users without beta access
  message?: string; // Message to display to users without beta access
}

type AuthContextType = {
  user: ExtendedUser | null;
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  isAuthor: boolean;
  authorDetails: Author | null;
  loginMutation: UseMutationResult<SelectUser, Error, any>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
  becomeAuthorMutation: UseMutationResult<Author, Error, any>;
  revokeAuthorMutation: UseMutationResult<any, Error, { confirmUsername: string }>;
};

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // State for the author beta notification
  const [showAuthorBetaNotification, setShowAuthorBetaNotification] = useState(false);
  
  // Fetch basic user data
  const {
    data: user,
    error,
    isLoading: isUserLoading,
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false, // Don't retry on 401s
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
  });

  // Fetch author status if user is authenticated
  const {
    data: authorStatus,
    isLoading: isAuthorStatusLoading,
  } = useQuery<AuthorStatus, Error>({
    queryKey: ["/api/author-status"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: !!user, // Only run this query if user is authenticated
    retry: false,
    refetchOnWindowFocus: false,
  });

  const isLoading = isUserLoading || (!!user && isAuthorStatusLoading);
  const isAuthenticated = Boolean(user);
  const isAuthor = authorStatus?.isAuthor || false;
  const authorDetails = authorStatus?.authorDetails || null;
  
  // Check if the user is an author with Pro status from a beta promotion
  // that hasn't seen the notification yet
  useEffect(() => {
    // Only run this check when we have both the user and author details loaded
    if (!isLoading && isAuthor && user?.is_pro) {
      // Check if we've already shown the notification for this user
      const hasShownBetaNotification = localStorage.getItem('author_beta_notification_shown');
      if (!hasShownBetaNotification) {
        // Show notification after a slight delay
        setTimeout(() => {
          setShowAuthorBetaNotification(true);
        }, 1000);
      }
    }
  }, [isLoading, isAuthor, user]);

  // Create extended user with author information for compatibility
  const extendedUser: ExtendedUser | null = user ? {
    ...user,
    isAuthor: isAuthor, // For backward compatibility
    authorDetails: authorDetails,
  } : null;

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      if (res.status === 403) {
        // 403 indicates no beta access
        const data = await res.json();
        throw new Error(data.message || "You don't have beta access yet.");
      }
      return await res.json();
    },
    onSuccess: (userData: SelectUser) => {
      queryClient.setQueryData(["/api/user"], userData);
      // After login, force a refetch of author status
      queryClient.invalidateQueries({ queryKey: ["/api/author-status"] });
    },
    onError: async (error: Error) => {
      if (error.message.includes("beta access")) {
        // First log the user out to ensure they can't access the site
        try {
          // Perform logout
          await apiRequest("POST", "/api/logout");
          // Clear user data from cache
          queryClient.setQueryData(["/api/user"], null);
          queryClient.setQueryData(["/api/author-status"], null);
        } catch (logoutError) {
          console.error("Error during logout:", logoutError);
        }
        
        toast({
          title: "Beta Access Required",
          description: "Thank you for your interest! We'll notify you when beta access is available.",
        });
        
        // Then redirect to landing page
        window.location.href = "/landing?nobeta=true";
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email/username or password",
          variant: "destructive",
        });
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      if (res.status === 403) {
        // 403 indicates no beta access
        const data = await res.json();
        throw new Error(data.message || "You don't have beta access yet.");
      }
      return await res.json();
    },
    onSuccess: (userData: SelectUser) => {
      // Normal registration flow
      queryClient.setQueryData(["/api/user"], userData);
    },
    onError: async (error: Error) => {
      if (error.message.includes("beta access")) {
        // First log the user out to ensure they can't access the site
        try {
          // Perform logout
          await apiRequest("POST", "/api/logout");
          // Clear user data from cache
          queryClient.setQueryData(["/api/user"], null);
          queryClient.setQueryData(["/api/author-status"], null);
        } catch (logoutError) {
          console.error("Error during logout:", logoutError);
        }
        
        toast({
          title: "Account Created!",
          description: "Thank you for your interest! We'll notify you when beta access is available.",
        });
        
        // Redirect to landing page
        window.location.href = "/landing?nobeta=true";
      } else {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      queryClient.setQueryData(["/api/author-status"], null);
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const becomeAuthorMutation = useMutation({
    mutationFn: async () => {
      // The server endpoint expects 'author_name' (with underscore) as defined in the schema
      const res = await apiRequest("POST", "/api/become-author", {
        author_name: user?.username || "",
        bio: ""
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to register as author");
      }
      
      return await res.json();
    },
    onSuccess: (response: any) => {
      // The response may include additional info like beta_promotion status
      const authorData: Author = response;
      const betaPromotion = response.beta_promotion === true;
      
      // Update author status cache
      queryClient.setQueryData(["/api/author-status"], { 
        isAuthor: true, 
        authorDetails: authorData 
      });
      
      toast({
        title: "Success!",
        description: "You are now registered as an author.",
      });
      
      // Show beta notification if promotion was applied
      if (betaPromotion) {
        // Show the beta notification dialog after a brief delay
        setTimeout(() => {
          setShowAuthorBetaNotification(true);
        }, 500);
      }
      
      // Also invalidate user data to make sure UI updates properly
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      console.error("Author registration error:", error);
      toast({
        title: "Failed to register as author",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const revokeAuthorMutation = useMutation({
    mutationFn: async ({ confirmUsername }: { confirmUsername: string }) => {
      const res = await apiRequest("POST", "/api/revoke-author", {
        confirmUsername
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to revoke author status");
      }
      
      return await res.json();
    },
    onSuccess: () => {
      // Update author status cache and notify the user
      queryClient.setQueryData(["/api/author-status"], { 
        isAuthor: false, 
        authorDetails: null 
      });
      
      toast({
        title: "Author status revoked",
        description: "Your author status has been revoked. Your subscription benefits will remain active until their expiration.",
      });
      
      // Also invalidate user data to make sure UI updates properly
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Redirect to home page since we're no longer on an author page
      window.location.href = "/";
    },
    onError: (error: Error) => {
      console.error("Author revocation error:", error);
      toast({
        title: "Failed to revoke author status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: extendedUser,
        isLoading,
        error,
        isAuthenticated,
        isAuthor,
        authorDetails,
        loginMutation,
        logoutMutation,
        registerMutation,
        becomeAuthorMutation,
        revokeAuthorMutation,
      }}
    >
      {/* Show the beta notification when an author is created during beta */}
      <AuthorBetaNotification 
        isOpen={showAuthorBetaNotification} 
        onClose={() => {
          // Close the dialog
          setShowAuthorBetaNotification(false);
          
          // Remember that we've shown this notification to the user
          localStorage.setItem('author_beta_notification_shown', 'true');
        }} 
      />
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}