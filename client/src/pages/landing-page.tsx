import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";

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
    <div className="min-h-screen">
      {/* Fixed header with user type toggle */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-center items-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-lg font-medium">I am a</span>
            <div className="flex items-center gap-2">
              <span className={!isAuthor ? "font-bold" : "text-muted-foreground"}>Reader</span>
              <Switch
                checked={isAuthor}
                onCheckedChange={handleUserTypeChange}
                className="data-[state=checked]:bg-primary"
              />
              <span className={isAuthor ? "font-bold" : "text-muted-foreground"}>Author</span>
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
            <div className="max-w-3xl mx-auto text-center">
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