import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useBeta } from "@/hooks/use-beta";
import { Redirect, useLocation } from "wouter";
import { AuthModal } from "@/components/auth-modal";
import { Button } from "@/components/ui/button";
import { useAuthModal } from "@/hooks/use-auth-modal";

export default function AuthWallPage() {
  const { user } = useAuth();
  const { isBetaActive } = useBeta();
  const { setIsOpen } = useAuthModal();
  const [location] = useLocation();
  
  // List of paths that are always allowed
  const allowedPaths = ["/landing", "/how-it-works", "/partner", "/scroll-landing", "/wave-demo"];
  const isAllowedPath = allowedPaths.some(path => location.startsWith(path));
  const isApiPath = location.startsWith("/api");

  // Immediately open auth modal
  useEffect(() => {
    setIsOpen(true);
    return () => setIsOpen(false);
  }, [setIsOpen]);

  // Redirect cases
  if (!isBetaActive) {
    // If beta is not active, redirect to homepage
    return <Redirect to="/" />;
  }
  
  if (user) {
    // If user is logged in, redirect to homepage
    return <Redirect to="/" />;
  }
  
  if (isAllowedPath || isApiPath) {
    // If accessing allowed public paths, let them through
    return <Redirect to={location} />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Private Beta</h1>
          <p className="text-lg text-muted-foreground">
            This site is currently in private beta. Please log in with your beta access credentials.
          </p>
          <Button 
            size="lg" 
            className="mt-4"
            onClick={() => setIsOpen(true)}
          >
            Login to Access
          </Button>
          <p className="text-sm text-muted-foreground mt-8">
            Don&apos;t have an account? <br />
            <Button variant="link" onClick={() => setIsOpen(true)}>
              Register with your beta key
            </Button>
          </p>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border">
          <Button 
            variant="outline" 
            onClick={() => window.location.href = "/landing"}
          >
            Learn more about our platform
          </Button>
        </div>
      </div>
      
      {/* AuthModal will be shown based on the isOpen state */}
    </div>
  );
}