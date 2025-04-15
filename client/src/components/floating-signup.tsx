import { useState, useEffect } from "react";
import { Music2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnimatedElement } from "@/components/scroll-animations";

export function FloatingSignup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isShown, setIsShown] = useState(false);
  const { toast } = useToast();
  
  // Delay showing the floating button until after user has scrolled a bit
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsShown(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email to sign up for updates.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate a random session ID for this signup if we don't have one from landing page
      const sessionId = window.localStorage.getItem('landingSessionId') || `floating-${Date.now()}-${Math.round(Math.random() * 1000000)}`;
      
      const response = await fetch("/api/signup-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          isAuthorInterest: false, 
          isPublisher: false,
          sessionId
        }),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Thank you for signing up. We'll keep you updated!",
        });
        setEmail("");
        setIsOpen(false);
      } else {
        throw new Error("Failed to sign up");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign up. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      {isShown && (
        <AnimatedElement
          animation="fade-in"
          delay={0.3}
          duration={1.0}
          className="fixed bottom-8 right-8 z-50"
        >
          <div className="relative transition-transform hover:scale-105 duration-300">
            {/* Pulsing circles */}
            <div className="absolute inset-0 animate-ping-slow rounded-full bg-[#FFD700]/30" />
            <div className="absolute inset-0 animate-ping-slower rounded-full bg-[#FFD700]/20" />

            {/* Main button */}
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className="h-16 w-16 rounded-full bg-[#FFD700] hover:bg-[#FFD700]/90 shadow-lg relative"
            >
              <Music2Icon className="h-8 w-8 text-background" />
            </Button>
          </div>
        </AnimatedElement>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-xl mb-2">
              <AnimatedElement animation="slide-down" delay={0.1} duration={0.5}>
                Join Our Community
              </AnimatedElement>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSignup} className="space-y-4">
            <AnimatedElement animation="slide-up" delay={0.2} duration={0.5}>
              <Input
                type="email"
                placeholder="Enter your email for updates"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="transition-all duration-300 focus:scale-105"
              />
            </AnimatedElement>
            <AnimatedElement animation="fade-in" delay={0.4} duration={0.5}>
              <Button 
                type="submit" 
                className="w-full transition-transform duration-300 hover:scale-105"
              >
                Sign Up
              </Button>
            </AnimatedElement>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}