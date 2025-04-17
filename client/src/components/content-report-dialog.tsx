import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { CONTENT_VIOLATION_TYPES } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface ContentReportDialogProps {
  bookId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContentReportDialog({ bookId, open, onOpenChange }: ContentReportDialogProps) {
  const [violationType, setViolationType] = useState<string>("");
  const [details, setDetails] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!violationType) {
      toast({
        title: "Error",
        description: "Please select a violation type",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiRequest("POST", `/api/books/${bookId}/report`, {
        violationType,
        details,
      });

      if (response.ok) {
        toast({
          title: "Report submitted",
          description: "Thank you for helping us maintain community standards.",
        });
        // Reset form
        setViolationType("");
        setDetails("");
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to submit report. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
          <DialogDescription>
            Help us maintain community standards by reporting inappropriate content.
            Our team will review this report and take appropriate action.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <Label htmlFor="violation-type" className="font-medium">
                Violation Type
              </Label>
              <RadioGroup 
                id="violation-type" 
                value={violationType}
                onValueChange={setViolationType}
                className="space-y-2"
              >
                {CONTENT_VIOLATION_TYPES.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <RadioGroupItem value={type} id={type} />
                    <Label htmlFor={type} className="cursor-pointer">
                      {type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="details" className="font-medium">
                Additional Details
              </Label>
              <Textarea
                id="details"
                placeholder="Please provide any additional details about the issue..."
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}