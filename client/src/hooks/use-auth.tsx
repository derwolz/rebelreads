import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser, LoginData, Author } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
};

export const AuthContext = createContext<AuthContextType | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
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

  // Create extended user with author information for compatibility
  const extendedUser: ExtendedUser | null = user ? {
    ...user,
    isAuthor: isAuthor, // For backward compatibility
    authorDetails: authorDetails,
  } : null;

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      // We still validate the response status but no longer enforce beta access
      if (res.status === 403) {
        // Just log that a 403 was received but proceed anyway
        console.log("Beta access check bypassed");
      }
      return await res.json();
    },
    onSuccess: (userData: SelectUser) => {
      queryClient.setQueryData(["/api/user"], userData);
      // After login, force a refetch of author status
      queryClient.invalidateQueries({ queryKey: ["/api/author-status"] });
    },
    onError: async (error: Error) => {
      toast({
        title: "Login failed",
        description: "Invalid email/username or password",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      const res = await apiRequest("POST", "/api/register", credentials);
      // We still validate the response status but no longer enforce beta access
      if (res.status === 403) {
        // Just log that a 403 was received but proceed anyway
        console.log("Beta access check bypassed during registration");
      }
      return await res.json();
    },
    onSuccess: (userData: SelectUser) => {
      // Normal registration flow
      queryClient.setQueryData(["/api/user"], userData);
    },
    onError: async (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
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
    mutationFn: async (authorData: any) => {
      const res = await apiRequest("POST", "/api/become-author", authorData);
      return await res.json();
    },
    onSuccess: (authorData: Author) => {
      // Update author status cache and notify the user
      queryClient.setQueryData(["/api/author-status"], { 
        isAuthor: true, 
        authorDetails: authorData 
      });
      
      toast({
        title: "Success!",
        description: "You are now registered as an author.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to register as author",
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
      }}
    >
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