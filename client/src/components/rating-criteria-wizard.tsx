import React from "react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { RatingPreferencesSettings } from "./rating-preferences-settings";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RatingCriteriaWizard() {
  const { showRatingWizard, closeRatingWizard, setHasCompletedOnboarding } = useOnboarding();
  const { user } = useAuth();
  
  // Mutation to directly update hasCompletedOnboarding
  const { mutate: updateOnboardingStatus } = useMutation({
    mutationFn: async () => {
      return apiRequest('PATCH', '/api/user', { hasCompletedOnboarding: true });
    },
    onSuccess: () => {
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      closeRatingWizard();
    }
  });

  // Handle completion of wizard
  const handleComplete = () => {
    // The preferences endpoint will update hasCompletedOnboarding on the backend
    // The queryClient.invalidateQueries will be called by RatingPreferencesSettings
    setHasCompletedOnboarding(true);
    closeRatingWizard();
  };
  
  // Handle skipping of wizard
  const handleSkip = () => {
    // When skipping, we need to manually update hasCompletedOnboarding
    if (user && !user.hasCompletedOnboarding) {
      updateOnboardingStatus();
    } else {
      closeRatingWizard();
    }
  };

  return (
    <Dialog open={showRatingWizard} onOpenChange={(open) => !open && handleSkip()}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Customize Your Rating Experience</DialogTitle>
          <DialogDescription>

          </DialogDescription>
        </DialogHeader>
        
        <RatingPreferencesSettings 
          isWizard={true}
          onComplete={handleComplete}
          onSkip={handleSkip}
        />
      </DialogContent>
    </Dialog>
  );
}