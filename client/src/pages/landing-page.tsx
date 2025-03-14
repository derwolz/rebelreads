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
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500 dark:from-blue-500 dark:via-blue-700 dark:to-blue-900 bg-300% animate-gradient-shift" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(0,100,255,0.3),transparent_70%)] animate-pulse" />
      </div>

      {/* Hero section with toggle */}
      <div className="min-h-[50vh] relative flex items-center justify-center">
        <div className="text-center space-y-8 z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-12 text-white dark:text-white/90 drop-shadow-lg">
            Where Stories Come Alive
          </h1>
          <div className="flex flex-col items-center gap-6">
            <span className="text-xl text-white/70 dark:text-white/50 font-medium">I am a</span>
            <div className="relative">
              <div className="absolute -inset-3 bg-gradient-to-r from-blue-400/50 to-blue-300 dark:from-blue-600/50 dark:to-blue-500 rounded-lg blur opacity-75 transition-all duration-500"
                style={{
                  transform: isAuthor ? 'translateX(100%)' : 'translateX(0)',
                }}
              />
              <div className="relative flex items-center gap-6 bg-white/10 dark:bg-black/10 backdrop-blur-md p-6 rounded-lg shadow-xl border border-white/20 dark:border-white/10">
                <span className={`text-2xl font-bold transition-colors duration-500 ${!isAuthor ? 'text-blue-300 dark:text-blue-400' : 'text-white/50'}`}>
                  Reader
                </span>
                <Switch
                  checked={isAuthor}
                  onCheckedChange={handleUserTypeChange}
                  className="h-12 w-12 data-[state=checked]:bg-blue-500 dark:data-[state=checked]:bg-blue-400"
                />
                <span className={`text-2xl font-bold transition-colors duration-500 ${isAuthor ? 'text-blue-300 dark:text-blue-400' : 'text-white/50'}`}>
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
          <div className="container mx-auto px-4 py-16 z-10">
            <div className="max-w-3xl mx-auto text-center bg-white/5 dark:bg-black/5 backdrop-blur-sm p-8 rounded-xl border border-white/10 dark:border-white/5">
              <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white dark:text-white/90">{panel.title}</h2>
              <p className="text-xl text-white/70 dark:text-white/50">{panel.description}</p>
            </div>
          </div>

          {/* Show scroll indicator on all panels except the last */}
          {index < panels.length - 1 && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce z-10">
              <ChevronDown className="w-8 h-8 text-white/50" />
            </div>
          )}
        </section>
      ))}

      {/* Fixed signup form at the bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/5 dark:bg-black/5 backdrop-blur-md border-t border-white/10 dark:border-white/5">
        <div className="container mx-auto px-4 py-4">
          <Card className="max-w-md mx-auto bg-white/10 dark:bg-black/10">
            <form onSubmit={handleSignup} className="p-4 flex gap-2">
              <Input
                type="email"
                placeholder="Enter your email for updates"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white/20 dark:bg-black/20 border-white/10 dark:border-white/5 text-white placeholder:text-white/50"
              />
              <Button type="submit" className="bg-blue-500 dark:bg-blue-400 hover:bg-blue-600 dark:hover:bg-blue-500 text-white">
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