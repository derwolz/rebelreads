import { useState } from "react";
import { useNavigate } from "wouter";
import { LoginVerificationDialog } from "@/components/login-verification-dialog";

interface UseLoginVerificationProps {
  onLoginSuccess?: (user: any) => void;
}

export function useLoginVerification({ onLoginSuccess }: UseLoginVerificationProps = {}) {
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [maskedEmail, setMaskedEmail] = useState("");
  const navigate = useNavigate();

  const handleLoginResponse = (response: Response) => {
    return response.json().then(data => {
      // If verification is needed (status 202)
      if (response.status === 202 && data.verificationNeeded) {
        setUserId(data.userId);
        setMaskedEmail(data.email || "your email");
        setVerificationDialogOpen(true);
        return null;
      }
      
      // Regular response handling
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }
      
      return data;
    });
  };

  const handleVerificationSuccess = (user: any) => {
    setVerificationDialogOpen(false);
    
    if (onLoginSuccess) {
      onLoginSuccess(user);
    } else {
      // Default behavior - navigate to home
      navigate("/");
    }
  };

  const closeVerificationDialog = () => {
    setVerificationDialogOpen(false);
  };

  const VerificationDialogComponent = userId ? (
    <LoginVerificationDialog
      isOpen={verificationDialogOpen}
      userId={userId}
      maskedEmail={maskedEmail}
      onClose={closeVerificationDialog}
      onSuccess={handleVerificationSuccess}
    />
  ) : null;

  return {
    handleLoginResponse,
    VerificationDialog: VerificationDialogComponent,
    closeVerificationDialog,
    isVerificationDialogOpen: verificationDialogOpen
  };
}