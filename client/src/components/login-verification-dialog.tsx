import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface LoginVerificationDialogProps {
  isOpen: boolean;
  userId: number;
  maskedEmail: string;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export const LoginVerificationDialog = ({
  isOpen,
  userId,
  maskedEmail,
  onClose,
  onSuccess,
}: LoginVerificationDialogProps) => {
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleVerifyCode = async () => {
    if (!code || code.length < 6) {
      toast({
        title: "Invalid verification code",
        description: "Please enter a valid verification code",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiRequest("POST", "/api/verify-login", {
        userId,
        code,
      });

      if (response.status === 200) {
        const user = await response.json();
        
        // Update authentication state
        queryClient.setQueryData(["/api/user"], user);
        
        // Call success handler
        onSuccess(user);
        
        toast({
          title: "Success",
          description: "You have been successfully logged in",
        });
      } else {
        const data = await response.json();
        toast({
          title: "Verification failed",
          description: data.error || "Invalid verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Verification error",
        description: "An error occurred during verification",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle form submission when user presses Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleVerifyCode();
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);

    try {
      const response = await apiRequest("POST", "/api/resend-verification", {
        userId,
      });

      if (response.status === 200) {
        toast({
          title: "Verification code sent",
          description: `A new verification code has been sent to ${maskedEmail}`,
        });
      } else {
        const data = await response.json();
        toast({
          title: "Failed to resend code",
          description: data.error || "An error occurred while resending the code",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Resend error:", error);
      toast({
        title: "Error",
        description: "An error occurred while resending the verification code",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogTitle>Verify Your Login</DialogTitle>
      <DialogContent>
        <DialogDescription>
          For your security, we've sent a verification code to {maskedEmail}.
          Please enter the code below to complete your login.
        </DialogDescription>
        <div className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="verification-code">Verification Code</Label>
            <Input
              id="verification-code"
              placeholder="Enter your code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={8}
              autoComplete="off"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Didn't receive a code?{" "}
            <button
              onClick={handleResendCode}
              className="text-primary hover:underline focus:outline-none"
              disabled={isResending}
            >
              {isResending ? (0D811D
                <>
                  <Loader2 className="inline h-3 w-3 animate-spin mr-1" />
                  Resending...
                </>
              ) : (
                "Resend Code"
              )}
            </button>
          </div>
        </div>
        <div className="flex flex-row justify-between items-center">
        <Button variant="ghost" onClick={()=>{onClose()}} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button onClick={handleVerifyCode} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify"
          )}
        </Button>
          </div>
      </DialogContent>
    </Dialog>
  );
};