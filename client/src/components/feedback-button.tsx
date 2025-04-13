import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";
import FeedbackForm from "./feedback-form";

/**
 * FeedbackButton component
 * 
 * A floating button in the bottom right corner that opens a feedback form
 * when clicked. Used for beta users to submit feedback, report issues,
 * or request features.
 */
export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        className="fixed bottom-5 right-5 rounded-full p-3 shadow-lg z-50"
        onClick={() => setIsOpen(true)}
        aria-label="Open feedback form"
      >
        <MessageSquarePlus className="h-5 w-5" />
      </Button>
      
      <FeedbackForm 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
      />
    </>
  );
}