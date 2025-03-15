import { useState } from "react";
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

export function FloatingSignup() {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const { toast } = useToast();

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
      const response = await fetch("/api/signup-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, isAuthor: false }),
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
      <div className="fixed bottom-8 right-8 z-50">
        <div className="relative">
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
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Our Community</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSignup} className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your email for updates"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" className="w-full">
              Sign Up
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}