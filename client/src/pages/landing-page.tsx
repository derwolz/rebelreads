import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";

const FloatingShape = ({ className }: { className?: string }) => (
  <div className={`absolute transition-all duration-20000 ease-in-out animate-float ${className}`}>
    <svg width="180" height="180" viewBox="0 0 120 120" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M60 10L110 95H10L60 10Z" />
    </svg>
  </div>
);

const CircleShape = ({ className }: { className?: string }) => (
  <div className={`absolute transition-all duration-25000 ease-in-out animate-float-delayed ${className}`}>
    <svg width="160" height="160" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="40" />
    </svg>
  </div>
);

const SquareShape = ({ className }: { className?: string }) => (
  <div className={`absolute transition-all duration-22000 ease-in-out animate-float-reverse ${className}`}>
    <svg width="140" height="140" viewBox="0 0 80 80" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="10" width="60" height="60" transform="rotate(45 40 40)" />
    </svg>
  </div>
);

const StarShape = ({ className }: { className?: string }) => (
  <div className={`absolute transition-all duration-23000 ease-in-out animate-float ${className}`}>
    <svg width="160" height="160" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5L61 39H97L68 61L79 95L50 73L21 95L32 61L3 39H39L50 5Z" />
    </svg>
  </div>
);

const HexagonShape = ({ className }: { className?: string }) => (
  <div className={`absolute transition-all duration-24000 ease-in-out animate-float-delayed ${className}`}>
    <svg width="170" height="170" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5L90 27.5V72.5L50 95L10 72.5V27.5L50 5Z" />
    </svg>
  </div>
);

export function LandingPage() {
  const [isAuthor, setIsAuthor] = useState(false);
  const [email, setEmail] = useState("");
  const [activePanel, setActivePanel] = useState(0);
  const { setTheme } = useTheme();
  const { toast } = useToast();

  // Switch theme based on user type
  const handleUserTypeChange = (checked: boolean) => {
    setIsAuthor(checked);
    setTheme(checked ? "dark" : "light");
  };

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
        body: JSON.stringify({ email, isAuthor }),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Thank you for signing up. We'll keep you updated!",
        });
        setEmail("");
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

  // Story panels content based on user type
  const panels = isAuthor ? [
    {
      title: "Your Story Begins Here",
      description: "Every great author started with a dream. A story burning to be told. Your journey to becoming a published author starts now.",
    },
    {
      title: "Craft Your Masterpiece",
      description: "Our platform provides the tools and community you need to transform your ideas into polished manuscripts ready for the world.",
    },
    {
      title: "Connect With Your Audience",
      description: "Build a loyal readership, engage with your fans, and create a community around your stories.",
    },
    {
      title: "Grow Your Author Brand",
      description: "Track your performance, understand your readers, and make data-driven decisions to expand your reach.",
    },
    {
      title: "Shape Literary Futures",
      description: "Join a new generation of authors who are redefining storytelling in the digital age.",
    }
  ] : [
    {
      title: "Discover Your Next Adventure",
      description: "Step into a world of endless possibilities. Your next favorite book is waiting to be discovered.",
    },
    {
      title: "Connect With Stories",
      description: "Find books that speak to your soul, curated just for you based on your unique tastes and interests.",
    },
    {
      title: "Join the Conversation",
      description: "Share your thoughts, connect with fellow readers, and be part of a vibrant literary community.",
    },
    {
      title: "Support Your Favorite Authors",
      description: "Follow authors you love, get updates on their latest works, and help shape the future of storytelling.",
    },
    {
      title: "Your Reading Journey Awaits",
      description: "Start your literary adventure today and become part of something bigger.",
    }
  ];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const newActivePanel = Math.floor((scrollPosition + windowHeight / 2) / windowHeight);
      setActivePanel(Math.min(newActivePanel, panels.length - 1));
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [panels.length]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <FloatingShape className="text-primary/20 top-1/4 left-1/4" />
        <CircleShape className="text-[#40E0D0]/30 top-1/3 right-1/4" />
        <SquareShape className="text-primary/15 bottom-1/4 left-1/3" />
        <FloatingShape className="text-[#40E0D0]/20 bottom-1/3 right-1/3 rotate-180" />
        <CircleShape className="text-primary/20 top-2/3 left-1/2" />
        <SquareShape className="text-primary/15 top-1/2 right-1/2 rotate-45" />
        <StarShape className="text-[#40E0D0]/25 bottom-1/4 right-1/4" />
        <HexagonShape className="text-primary/20 top-1/3 left-1/3" />
      </div>

      {/* Add blur overlay */}
      <div className="fixed inset-0 backdrop-blur-[20px] pointer-events-none" />

      {/* Hero section with toggle */}
      <div className="min-h-[50vh] relative flex items-center justify-center">
        <div className="text-center space-y-8 relative z-10 backdrop-blur-lg bg-background/70 p-12 rounded-2xl shadow-xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-12">
            Where Stories Come Alive
          </h1>
          <div className="flex flex-col items-center gap-6">
            <span className="text-xl text-muted-foreground font-medium">I am a</span>
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-r from-primary/50 to-primary rounded-lg blur opacity-75 transition-all duration-500"
                style={{
                  transform: isAuthor ? 'translateX(100%)' : 'translateX(0)',
                }}
              />
              <div className="relative flex items-center gap-6 bg-background/80 backdrop-blur-sm p-6 rounded-lg shadow-xl">
                <span className={`text-2xl font-bold transition-colors duration-500 ${!isAuthor ? 'text-primary' : 'text-muted-foreground'}`}>
                  Reader
                </span>
                <Switch
                  checked={isAuthor}
                  onCheckedChange={handleUserTypeChange}
                  className="h-12 w-12 data-[state=checked]:bg-primary"
                />
                <span className={`text-2xl font-bold transition-colors duration-500 ${isAuthor ? 'text-primary' : 'text-muted-foreground'}`}>
                  Author
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Story panels */}
      {panels.map((panel, index) => (
        <section
          key={index}
          className="min-h-screen flex items-center justify-center relative snap-start"
          style={{
            opacity: activePanel === index ? 1 : 0.3,
            transition: 'opacity 0.5s ease-in-out'
          }}
        >
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto text-center backdrop-blur-lg bg-background/70 p-12 rounded-2xl shadow-xl">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">{panel.title}</h2>
              <p className="text-xl text-muted-foreground">{panel.description}</p>
            </div>
          </div>

          {/* Show scroll indicator on all panels except the last */}
          {index < panels.length - 1 && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <ChevronDown className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </section>
      ))}

      {/* Fixed signup form at the bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Card className="max-w-md mx-auto">
            <form onSubmit={handleSignup} className="p-4 flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email for updates"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                Sign Up
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;