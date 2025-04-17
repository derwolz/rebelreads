import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SiGoogle } from "react-icons/si";

// Schema for beta key validation
const betaKeySchema = z.object({
  betaKey: z.string().min(1, "Beta key is required")
});

type BetaKeyFormData = z.infer<typeof betaKeySchema>;

interface GoogleBetaAuthDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoogleBetaAuthDialog({ isOpen, onOpenChange }: GoogleBetaAuthDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BetaKeyFormData>({
    resolver: zodResolver(betaKeySchema),
    defaultValues: {
      betaKey: "",
    },
  });
  
  // Reset form when dialog is closed
  useEffect(() => {
    if (!isOpen) {
      form.reset({ betaKey: "" });
      setIsSubmitting(false);
    }
  }, [isOpen, form]);

  const onSubmit = async (data: BetaKeyFormData) => {
    try {
      setIsSubmitting(true);
      
      // First, store the beta key in the server session
      const storeBetaKeyResponse = await fetch("/api/auth/google/store-beta-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ betaKey: data.betaKey }),
      });
      
      const storeBetaKeyResult = await storeBetaKeyResponse.json();
      
      if (storeBetaKeyResponse.ok && storeBetaKeyResult.success) {
        // Redirect to Google OAuth endpoint
        window.location.href = "/api/auth/google";
      } else {
        toast({
          title: "Invalid Beta Key",
          description: "The beta key you entered is invalid or has expired.",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem validating your beta key. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Optional: Enter Beta Key for Google Sign-In</DialogTitle>
          <DialogDescription>
            If you have a beta key, enter it below. You can still continue with Google without a beta key, but you may have limited access.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="betaKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Beta Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your beta key" {...field} />
                  </FormControl>
                  <FormDescription>
                    Optional: Enter your beta key for full access. If you don't have one, you can still sign in but with limited access.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2 justify-end">
              <Button 
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={() => window.location.href = '/api/auth/google'}
                variant="outline"
                className="gap-2"
              >
                <SiGoogle />
                Continue without beta key
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="gap-2"
              >
                <SiGoogle />
                Continue with beta key
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}