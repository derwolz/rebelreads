import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

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
import { Button } from "@/components/ui/button";

const verificationSchema = z.object({
  code: z.string().min(6, { message: "Verification code must be at least 6 characters" }),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

interface LoginVerificationDialogProps {
  userId: number | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginVerificationDialog({ 
  userId, 
  isOpen, 
  onOpenChange 
}: LoginVerificationDialogProps) {
  const { verifyLoginMutation } = useAuth();
  const [resendInProgress, setResendInProgress] = useState(false);
  
  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  });
  
  const handleResendCode = async () => {
    if (!userId || resendInProgress) return;
    
    setResendInProgress(true);
    try {
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          userId, 
          type: "login_verification" 
        }),
      });
      
      if (response.ok) {
        // Show success message
        alert("Verification code has been resent. Please check your email.");
      } else {
        const data = await response.json();
        alert(data.error || "Failed to resend verification code. Please try again.");
      }
    } catch (error) {
      console.error("Error resending verification code:", error);
      alert("An error occurred while resending the verification code.");
    } finally {
      setResendInProgress(false);
    }
  };
  
  const onSubmit = (data: VerificationFormData) => {
    if (!userId) return;
    
    verifyLoginMutation.mutate({
      userId,
      code: data.code,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        form.reset();
      },
    });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verify Your Login</DialogTitle>
          <DialogDescription>
            We've sent a verification code to your email. Please enter it below to continue.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Verification Code</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your verification code" 
                      {...field} 
                      autoComplete="one-time-code"
                    />
                  </FormControl>
                  <FormDescription>
                    The code was sent to your email address for security purposes.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleResendCode}
                disabled={resendInProgress || verifyLoginMutation.isPending}
              >
                {resendInProgress ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Resend Code"
                )}
              </Button>
              
              <Button 
                type="submit" 
                disabled={verifyLoginMutation.isPending}
              >
                {verifyLoginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}