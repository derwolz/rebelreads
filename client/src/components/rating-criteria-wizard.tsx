import React from "react";
import { useOnboarding } from "@/hooks/use-onboarding";
import { RatingPreferencesSettings } from "./rating-preferences-settings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RatingCriteriaWizard() {
  const { showRatingWizard, closeRatingWizard, setHasCompletedOnboarding } = useOnboarding();

  // Handle completion of wizard
  const handleComplete = () => {
    setHasCompletedOnboarding(true);
    closeRatingWizard();
  };
  
  // Handle skipping of wizard
  const handleSkip = () => {
    closeRatingWizard();
  };

  return (
    <Dialog open={showRatingWizard} onOpenChange={(open) => !open && closeRatingWizard()}>
      <DialogContent className="sm:max-w-md md:max-w-lg">
        <DialogHeader>
          <DialogTitle>Customize Your Rating Experience</DialogTitle>
          <DialogDescription>
            Drag and reorder the criteria below to match what's most important to you when rating books.
            The order determines how much weight each criterion has in the overall rating.
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