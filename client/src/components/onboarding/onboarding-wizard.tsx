import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useOnboarding } from '@/hooks/use-onboarding';
import OnboardingRatingPreferences from '@/components/onboarding/onboarding-rating-preferences';

const OnboardingWizard: React.FC = () => {
  const { 
    isOnboarding, 
    currentStep, 
    totalSteps, 
    nextStep, 
    prevStep, 
    completeOnboarding, 
    isLoading 
  } = useOnboarding();

  const progress = (currentStep / totalSteps) * 100;

  if (!isOnboarding) return null;

  return (
    <Dialog open={isOnboarding} modal>
      <DialogContent className="sm:max-w-3xl" onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Welcome to your reading journey!</DialogTitle>
          <DialogDescription className="text-center text-lg">
            Let's personalize your experience
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-1 text-sm text-muted-foreground">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
        </div>

        {currentStep === 1 && <OnboardingRatingPreferences />}

        <div className="flex justify-between mt-6">
          {currentStep > 1 ? (
            <Button variant="outline" onClick={prevStep} disabled={isLoading}>
              Back
            </Button>
          ) : (
            <div /> // Empty div for spacing
          )}
          
          {currentStep < totalSteps ? (
            <Button onClick={nextStep} disabled={isLoading}>
              Next
            </Button>
          ) : (
            <Button onClick={completeOnboarding} disabled={isLoading}>
              {isLoading ? 'Completing...' : 'Complete'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingWizard;