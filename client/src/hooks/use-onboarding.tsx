import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { RATING_CRITERIA, RatingCriteria } from '@shared/schema';

type OnboardingContextType = {
  isOnboarding: boolean;
  currentStep: number;
  totalSteps: number;
  criteriaOrder: RatingCriteria[];
  setCriteriaOrder: (order: RatingCriteria[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeOnboarding: () => Promise<void>;
  saveRatingPreferences: () => Promise<void>;
  isLoading: boolean;
  descriptions: Record<RatingCriteria, string>;
};

// Criteria descriptions
const criteriaDescriptions: Record<RatingCriteria, string> = {
  enjoyment: "A measurement of how engaging the novel is. Fun, memorable, entertaining.",
  writing: "A measurement of wordchoice, plot, style, overall skill in presenting the book.",
  characters: "A measurement of how well characters are portrayed. The characters are interesting, engaging, real.",
  themes: "A measurement of the ideas. Are they well explored, or interesting.",
  worldbuilding: "A measurement of the world. Magic systems true to mechanics, physics, general believability of elements."
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user, isLoading: isAuthLoading } = useAuth();
  
  // State
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [criteriaOrder, setCriteriaOrder] = useState<RatingCriteria[]>(['enjoyment', 'writing', 'themes', 'characters', 'worldbuilding']);
  const [isLoading, setIsLoading] = useState(false);
  
  // Total number of steps in the onboarding process
  const totalSteps = 1;
  
  // Check if user needs onboarding
  useEffect(() => {
    if (user && !isAuthLoading && !user.hasCompletedOnboarding) {
      setIsOnboarding(true);
      
      // Fetch user's rating preferences if they exist
      const fetchPreferences = async () => {
        try {
          const response = await fetch('/api/account/rating-preferences');
          const data = await response.json();
          if (data && data.criteriaOrder) {
            setCriteriaOrder(data.criteriaOrder);
          }
        } catch (error) {
          console.error('Error fetching rating preferences:', error);
        }
      };
      
      fetchPreferences();
    }
  }, [user, isAuthLoading]);
  
  // Navigation functions
  const nextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, totalSteps]);
  
  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);
  
  // Save rating preferences
  const saveRatingPreferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/account/rating-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ criteriaOrder }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save preferences');
      }
      
      toast({
        title: 'Preferences saved',
        description: 'Your rating preferences have been updated.',
      });
    } catch (error) {
      console.error('Error saving rating preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save your preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [criteriaOrder, toast]);
  
  // Complete onboarding
  const completeOnboarding = useCallback(async () => {
    setIsLoading(true);
    try {
      await saveRatingPreferences();
      
      const response = await fetch('/api/account/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }
      
      // Update user data in cache
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      
      toast({
        title: 'Welcome aboard!',
        description: 'Your account is all set up.',
      });
      
      setIsOnboarding(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete setup. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [saveRatingPreferences, queryClient, toast]);
  
  const value = {
    isOnboarding,
    currentStep,
    totalSteps,
    criteriaOrder,
    setCriteriaOrder,
    nextStep,
    prevStep,
    completeOnboarding,
    saveRatingPreferences,
    isLoading,
    descriptions: criteriaDescriptions,
  };
  
  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};