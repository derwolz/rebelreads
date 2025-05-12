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
import { BetaKeyInput } from "@/components/beta-key-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Schema for beta key validation and user type
const googleAuthSchema = z.object({
  betaKey: z.string().optional(),
  userType: z.enum(["reader", "author"]),
});

type GoogleAuthFormData = z.infer<typeof googleAuthSchema>;

interface GoogleBetaAuthDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoogleBetaAuthDialog({ isOpen, onOpenChange }: GoogleBetaAuthDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<GoogleAuthFormData>({
    resolver: zodResolver(googleAuthSchema),
    defaultValues: {
      betaKey: "",
      userType: "reader", // Default to reader
    },
  });
  
  // Reset form when dialog is closed
  useEffect(() => {
    if (!isOpen) {
      form.reset({ 
        betaKey: "",
        userType: "reader"
      });
      setIsSubmitting(false);
    }
  }, [isOpen, form]);

  const onSubmit = async (data: GoogleAuthFormData) => {
    try {
      setIsSubmitting(true);
      
      // Store the beta key and user type in the server session
      const storeDataResponse = await fetch("/api/auth/google/store-beta-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          betaKey: data.betaKey,
          isAuthor: data.userType === "author" 
        }),
      });
      
      const storeDataResult = await storeDataResponse.json();
      
      if (storeDataResponse.ok && storeDataResult.success) {
        // Also store the data in localStorage for redundancy
        if (data.betaKey) {
          // Store the beta key in localStorage with a timestamp to expire it later if needed
          localStorage.setItem('sirened_beta_key', data.betaKey);
          localStorage.setItem('sirened_beta_key_timestamp', Date.now().toString());
        }
        
        // Store the userType selection
        localStorage.setItem('sirened_user_type', data.userType);
        
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
        description: "There was a problem processing your request. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Beta Key Required for Access</DialogTitle>
          <DialogDescription>
            A beta key is required to access the application. If you already have a beta key associated with your account, you can continue signing in without entering it again. Otherwise, please enter your beta key below.
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
                    <BetaKeyInput 
                      value={field.value} 
                      onChange={field.onChange}
                      placeholder="Enter beta key"
                    />
                  </FormControl>
                  <FormDescription>
                    Optional if you already have a beta key associated with your account. Otherwise, you must enter a valid beta key to access the application.
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
                type="submit"
                disabled={isSubmitting}
                className="gap-2"
              >
                <SiGoogle />
                Continue with Google
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}