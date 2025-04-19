import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquareText } from "lucide-react";
import FeedbackForm from "./feedback-form";
import { useAuth } from "@/hooks/use-auth";

/**
 * A small button placed in the bottom left corner that opens the feedback form
 */
export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [showChatBubble, setShowChatBubble] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Check if the user is logged in and if we've shown the bubble before
    if (isAuthenticated && user) {
      const hasBubbleBeenShown = localStorage.getItem('feedback_bubble_shown');
      
      if (!hasBubbleBeenShown) {
        setShowChatBubble(true);
        
        // Auto-hide the bubble after 10 seconds
        const timeout = setTimeout(() => {
          setShowChatBubble(false);
        }, 10000);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [isAuthenticated, user]);

  // Hide the bubble and remember this in localStorage
  const handleBubbleClose = () => {
    setShowChatBubble(false);
    localStorage.setItem('feedback_bubble_shown', 'true');
  };

  return (
    <>
      <div className="fixed bottom-4 left-4 z-50 flex items-end">
        {showChatBubble && (
          <div className="mb-2 mr-3 max-w-[200px] rounded-lg bg-primary p-3 text-sm text-primary-foreground shadow-lg animate-fade-in relative">
            Click here to give feedback or report a bug
            <div className="absolute left-full bottom-4 h-4 w-4 -translate-x-1/2 overflow-hidden">
              <div className="absolute bottom-0 left-0 h-2 w-2 translate-x-1/2 rotate-45 bg-primary"></div>
            </div>
            <button
              onClick={handleBubbleClose}
              className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary-foreground text-primary text-xs"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        )}
        <Button
          onClick={() => {
            setIsOpen(true);
            if (showChatBubble) {
              handleBubbleClose();
            }
          }}
          className="rounded-full p-3 shadow-md"
          size="icon"
          aria-label="Submit Feedback"
          title="Submit Feedback"
        >
          <MessageSquareText className="h-5 w-5" />
        </Button>
      </div>
      
      <FeedbackForm isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}