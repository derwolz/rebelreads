import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCallback } from "react";

interface AuthorAction {
  actionType: string;
  objectId?: string;
  objectType?: string;
  details?: Record<string, any>;
  deviceInfo?: Record<string, any>;
}

interface PageView {
  pageUrl: string;
  referrer?: string;
  deviceInfo?: Record<string, any>;
  sessionId?: string;
}

interface FormAnalytics {
  formId: string;
  formName: string;
  deviceInfo?: Record<string, any>;
  sessionId?: string;
}

interface FormStatusUpdate {
  status: "started" | "completed" | "abandoned";
  formData?: Record<string, any>;
  abandonedStep?: string;
}

interface ApiResponse {
  id: number;
  [key: string]: any;
}

export function useAuthorAnalytics() {
  const queryClient = useQueryClient();

  // Record general author action (clicks, downloads, etc.)
  const recordAction = useMutation({
    mutationFn: async (action: AuthorAction) => {
      const response = await apiRequest("POST", "/api/author-analytics/action", action);
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/author-analytics/actions"] });
    },
  });

  // Record page view
  const recordPageView = useMutation({
    mutationFn: async (pageView: PageView) => {
      const response = await apiRequest("POST", "/api/author-analytics/page-view", pageView);
      const data = await response.json();
      return data as ApiResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/author-analytics/summary"] });
    },
  });

  // Update page view (when exiting)
  const updatePageViewExit = useMutation({
    mutationFn: async (pageViewId: number) => {
      const response = await apiRequest("POST", `/api/author-analytics/page-view/${pageViewId}/exit`);
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/author-analytics/summary"] });
    },
  });

  // Record form interaction
  const recordFormAnalytics = useMutation({
    mutationFn: async (formAnalytics: FormAnalytics) => {
      const response = await apiRequest("POST", "/api/author-analytics/form", formAnalytics);
      const data = await response.json();
      return data as ApiResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/author-analytics/summary"] });
    },
  });

  // Update form status
  const updateFormStatus = useMutation({
    mutationFn: async ({ formId, statusUpdate }: { formId: number; statusUpdate: FormStatusUpdate }) => {
      const response = await apiRequest(
        "POST", 
        `/api/author-analytics/form/${formId}/status`, 
        statusUpdate
      );
      const data = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/author-analytics/summary"] });
    },
  });

  // Track a button/link click
  const trackClick = useCallback((actionType: string, details?: Record<string, any>) => {
    recordAction.mutate({
      actionType,
      details,
      deviceInfo: {
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      },
    });
  }, [recordAction]);

  // Track when a form wizard is started
  const trackFormStart = useCallback((formId: string, formName: string) => {
    recordFormAnalytics.mutate({
      formId,
      formName,
      deviceInfo: {
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      },
    });
  }, [recordFormAnalytics]);

  // Track when a form wizard is completed or abandoned
  const trackFormCompletion = useCallback((formId: number, status: "completed" | "abandoned", formData?: Record<string, any>, abandonedStep?: string) => {
    updateFormStatus.mutate({
      formId,
      statusUpdate: {
        status,
        formData,
        abandonedStep,
      },
    });
  }, [updateFormStatus]);

  // Track page view with automatic exit tracking - limited to once per minute per URL
  const trackPageView = useCallback((pageUrl: string, referrer?: string) => {
    try {
      // Get or create a session ID for consistent tracking
      const sessionId = localStorage.getItem("authorSessionId") || 
        Math.random().toString(36).substring(2, 15);
      
      // Store the session ID
      localStorage.setItem("authorSessionId", sessionId);
      
      // Check if we've tracked this page recently (in last minute)
      const lastTrackedKey = `lastTracked_${pageUrl}`;
      const lastTrackedTime = localStorage.getItem(lastTrackedKey);
      const currentTime = Date.now();
      
      // Only track if we haven't tracked this page in the last minute
      if (!lastTrackedTime || (currentTime - parseInt(lastTrackedTime)) > 60000) {
        // Update tracking timestamp
        localStorage.setItem(lastTrackedKey, currentTime.toString());
        
        // Prepare payload according to schema (authorId will be added by the server)
        const payload = {
          pageUrl,
          sessionId,
          deviceInfo: {
            userAgent: navigator.userAgent,
            screenSize: `${window.innerWidth}x${window.innerHeight}`,
          },
          referrer: referrer || undefined
        };
        
        console.log("Tracking page view:", { pageUrl });

        // Record the page view
        recordPageView.mutateAsync(payload)
          .then((response) => {
            if (response && response.id) {
              const pageViewId = response.id;
              
              // Create a function to handle when user leaves the page
              const handlePageExit = () => {
                updatePageViewExit.mutate(pageViewId);
              };
              
              // Add event listeners for page exit
              window.addEventListener("beforeunload", handlePageExit);
              
              // Return a cleanup function to remove the event listener
              return () => {
                window.removeEventListener("beforeunload", handlePageExit);
                // Call the exit handler when the component is unmounted
                handlePageExit();
              };
            }
          })
          .catch((error) => {
            console.error("Error recording page view:", error);
          });
      } else {
        console.log("Skipping page view tracking (already tracked within last minute):", { pageUrl });
      }
    } catch (error) {
      console.error("Exception in trackPageView:", error);
    }
  }, [recordPageView, updatePageViewExit]);

  return {
    trackClick,
    trackPageView,
    trackFormStart,
    trackFormCompletion,
    isActionLoading: recordAction.isPending,
    isPageViewLoading: recordPageView.isPending,
    isFormAnalyticsLoading: recordFormAnalytics.isPending,
  };
}