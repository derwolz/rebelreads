import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Star, Zap } from "lucide-react";
import { getBetaEndDate } from "@shared/beta-constants";

interface AuthorBetaNotificationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthorBetaNotification({ isOpen, onClose }: AuthorBetaNotificationProps) {
  // Format the beta end date nicely
  const betaEndDateStr = getBetaEndDate().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl sm:text-2xl">Welcome to the Beta Program!</DialogTitle>
          <DialogDescription className="text-center pt-2">
            As an author during our beta period, you get exclusive access to all Pro features.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start space-x-3">
            <Star className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium">Pro Access Included</h4>
              <p className="text-sm text-muted-foreground">
                You've been automatically upgraded to Pro status until {betaEndDateStr} to help us test all features.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium">Enhanced Analytics & Tools</h4>
              <p className="text-sm text-muted-foreground">
                Explore advanced author tools including detailed analytics, promotional features, and more.
              </p>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Utility hook to manage showing the beta notification
export function useAuthorBetaNotification(isAuthor: boolean, isPro: boolean) {
  const [showNotification, setShowNotification] = useState(false);
  
  // Check local storage to see if we've shown the notification before
  useEffect(() => {
    if (isAuthor && isPro) {
      const hasShownNotification = localStorage.getItem('author_beta_notification_shown');
      if (!hasShownNotification) {
        setShowNotification(true);
      }
    }
  }, [isAuthor, isPro]);
  
  const closeNotification = () => {
    setShowNotification(false);
    localStorage.setItem('author_beta_notification_shown', 'true');
  };
  
  return {
    showNotification,
    closeNotification
  };
}