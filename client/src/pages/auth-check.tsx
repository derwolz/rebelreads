import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function AuthCheckPage() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    async function verifyBetaKeyFromLocalStorage() {
      try {
        console.log("Checking for beta key in localStorage");
        
        // Try to get the beta key from localStorage
        const betaKey = localStorage.getItem("sirened_beta_key");
        const timestamp = localStorage.getItem("sirened_beta_key_timestamp");
        
        // If there's no beta key, just redirect to the home page
        if (!betaKey) {
          console.log("No beta key found in localStorage");
          setLocation("/");
          return;
        }
        
        console.log("Found beta key in localStorage:", betaKey);
        
        // Check if the key is recent enough (within the last 10 minutes)
        if (timestamp) {
          const storedTime = parseInt(timestamp, 10);
          const currentTime = Date.now();
          const tenMinutesInMs = 10 * 60 * 1000;
          
          if (currentTime - storedTime > tenMinutesInMs) {
            console.log("Beta key in localStorage is too old, clearing");
            localStorage.removeItem("sirened_beta_key");
            localStorage.removeItem("sirened_beta_key_timestamp");
            setLocation("/");
            return;
          }
        }
        
        // Verify the beta key with the server
        const response = await fetch("/api/auth/verify-local-beta-key", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ betaKey }),
        });
        
        const result = await response.json();
        
        // Clear the beta key from localStorage regardless of the result
        localStorage.removeItem("sirened_beta_key");
        localStorage.removeItem("sirened_beta_key_timestamp");
        
        if (response.ok && result.success) {
          console.log("Beta key verification successful");
          toast({
            title: "Beta Access Granted",
            description: "Your beta key has been verified successfully.",
          });
          setLocation("/");
        } else {
          console.error("Beta key verification failed:", result.message);
          toast({
            title: "Beta Key Error",
            description: result.message || "Your beta key could not be verified.",
            variant: "destructive",
          });
          setLocation("/landing");
        }
      } catch (error) {
        console.error("Error verifying beta key:", error);
        toast({
          title: "Verification Error",
          description: "There was a problem verifying your beta key. Please try again.",
          variant: "destructive",
        });
        setLocation("/landing");
      } finally {
        setIsVerifying(false);
      }
    }
    
    verifyBetaKeyFromLocalStorage();
  }, [setLocation, toast]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm w-full max-w-md p-6">
        <div className="flex flex-col items-center space-y-4 text-center">
          <h2 className="text-2xl font-bold">Verifying Beta Access</h2>
          <p className="text-muted-foreground">
            Please wait while we validate your beta key...
          </p>
          <div className="flex items-center justify-center m-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
}