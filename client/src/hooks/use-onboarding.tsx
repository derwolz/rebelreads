import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuth } from './use-auth';
import { queryClient } from '../lib/queryClient';

type OnboardingContextType = {
  showRatingWizard: boolean;
  openRatingWizard: () => void;
  closeRatingWizard: () => void;
  setHasCompletedOnboarding: (value: boolean) => void;
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [showRatingWizard, setShowRatingWizard] = useState(false);
  const { user, isAuthenticated } = useAuth();
  
  // Check if the user needs to see the onboarding wizard
  useEffect(() => {
    if (isAuthenticated && user && !user.hasCompletedOnboarding) {
      // Show the wizard with a slight delay to ensure UI is ready
      const timer = setTimeout(() => {
        setShowRatingWizard(true);
      }, 1000); // 1 second delay
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);
  
  const openRatingWizard = () => setShowRatingWizard(true);
  const closeRatingWizard = () => setShowRatingWizard(false);
  
  // Update local user state when onboarding is completed
  const setHasCompletedOnboarding = (value: boolean) => {
    if (value) {
      // Close the wizard
      closeRatingWizard();
      
      // Only update if the user exists and hasn't completed onboarding yet
      if (user && !user.hasCompletedOnboarding) {
        // Invalidate the user query to refresh the user data
        // This will pick up the hasCompletedOnboarding=true set by the backend
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      }
    }
  };
  
  return (
    <OnboardingContext.Provider value={{
      showRatingWizard,
      openRatingWizard,
      closeRatingWizard,
      setHasCompletedOnboarding,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  
  return context;
}