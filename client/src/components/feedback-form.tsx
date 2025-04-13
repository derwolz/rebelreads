import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FeedbackFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackForm({ isOpen, onClose }: FeedbackFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketNumber, setTicketNumber] = useState<string | null>(null);
  
  const [type, setType] = useState("bug_report");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  // Reset form state when closing
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      
      // Reset form after it's closed
      setTimeout(() => {
        setType("bug_report");
        setTitle("");
        setDescription("");
        setTicketNumber(null);
      }, 300);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Title is required",
        description: "Please provide a brief title for your feedback.",
        variant: "destructive",
      });
      return;
    }
    
    if (!description.trim()) {
      toast({
        title: "Description is required",
        description: "Please provide details in the description field.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("/api/feedback", {
        method: "POST",
        body: JSON.stringify({
          type,
          title,
          description,
        }),
      });
      
      const data = await response.json();
      
      setTicketNumber(data.ticketNumber);
      
      toast({
        title: "Feedback submitted!",
        description: `Thank you for your feedback. Ticket #${data.ticketNumber} has been created.`,
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error submitting feedback",
        description: "There was a problem submitting your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {ticketNumber ? "Feedback Submitted" : "Submit Feedback"}
          </DialogTitle>
        </DialogHeader>
        
        {ticketNumber ? (
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <div className="text-xl font-medium">Thank you for your feedback!</div>
              <p className="text-muted-foreground">
                Your ticket number is: <span className="font-mono font-bold">{ticketNumber}</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                We'll review your feedback and may follow up if needed.
              </p>
            </div>
            <Button 
              className="w-full"
              onClick={handleClose}
            >
              Close
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-type">Feedback Type</Label>
              <RadioGroup 
                id="feedback-type" 
                value={type} 
                onValueChange={setType}
                className="flex flex-col space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="bug_report" id="bug_report" />
                  <Label htmlFor="bug_report">Bug Report</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="feature_request" id="feature_request" />
                  <Label htmlFor="feature_request">Feature Request</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="general_feedback" id="general_feedback" />
                  <Label htmlFor="general_feedback">General Feedback</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="question" id="question" />
                  <Label htmlFor="question">Question</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feedback-title">Title</Label>
              <Input 
                id="feedback-title"
                placeholder="Brief summary of your feedback"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="feedback-description">Description</Label>
              <Textarea 
                id="feedback-description"
                placeholder="Please provide details about your feedback, including any steps to reproduce bugs"
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>
            
            <DialogFooter className="sm:justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Feedback"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}