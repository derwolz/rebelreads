import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquareText } from "lucide-react";
import FeedbackForm from "./feedback-form";

/**
 * A small button placed in the bottom left corner that opens the feedback form
 */
export default function FeedbackButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 rounded-full p-3 shadow-md z-50"
        size="icon"
        aria-label="Submit Feedback"
        title="Submit Feedback"
      >
        <MessageSquareText className="h-5 w-5" />
      </Button>
      
      <FeedbackForm isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}