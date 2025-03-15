import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";

const FloatingShape = ({ className }: { className?: string }) => (
  <div
    className={`absolute  transition-all duration-400 animate-pulse animate-float ${className}`}
  >
    <svg
      width="380"
      height="380"
      viewBox="0 0 120 120"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M60 10L110 95H10L60 10Z" />
    </svg>
  </div>
);

const CircleShape = ({ className }: { className?: string }) => (
  <div
    className={`absolute transition-all duration-14000 ease-in-out animate-float-delayed ${className}`}
  >
    <svg
      width="560"
      height="560"
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="50" cy="50" r="40" />
    </svg>
  </div>
);

const SquareShape = ({ className }: { className?: string }) => (
  <div
    className={`absolute  transition-all duration-1350 ease-in-out animate-float-reverse ${className}`}
  >
    <svg
      width="540"
      height="540"
      viewBox="0 0 80 80"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="10" y="10" width="80" height="80" transform="rotate(45 40 40)" />
    </svg>
  </div>
);

const StarShape = ({ className }: { className?: string }) => (
  <div
    className={`absolute transition-all duration-1400 ease-in-out animate-float ${className}`}
  >
    <svg
      width="520"
      height="520"
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M50 5L61 39H97L68 61L79 95L50 73L21 95L32 61L3 39H39L50 5Z" />
    </svg>
  </div>
);

const HexagonShape = ({ className }: { className?: string }) => (
  <div
    className={`absolute transition-all duration-1550 ease-in-out animate-float-delayed ${className}`}
  >
    <svg
      width="570"
      height="570"
      viewBox="0 0 100 100"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M50 5L90 27.5V72.5L50 95L10 72.5V27.5L50 5Z" />
    </svg>
  </div>
);

const LandingPage = () => {
  const [isAuthor, setIsAuthor] = useState(false);
  const [email, setEmail] = useState("");
  const [activePanel, setActivePanel] = useState(0);
  const { setTheme } = useTheme();
  const { toast } = useToast();

  const handleUserTypeChange = (isAuthor: boolean) => {
    setIsAuthor(isAuthor);
    setTheme(isAuthor ? "dark" : "light");
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

  const panels = isAuthor
    ? [
        {
          title: "Your Story Begins Here",
          description:
            "Every great author started with a dream. A story burning to be told. Your journey to becoming a published author starts now.",
        },
        {
          title: "Craft Your Masterpiece",
          description:
            "Our platform provides the tools and community you need to transform your ideas into polished manuscripts ready for the world.",
        },
        {
          title: "Connect With Your Audience",
          description:
            "Build a loyal readership, engage with your fans, and create a community around your stories.",
        },
        {
          title: "Grow Your Author Brand",
          description:
            "Track your performance, understand your readers, and make data-driven decisions to expand your reach.",
        },
        {
          title: "Shape Literary Futures",
          description:
            "Join a new generation of authors who are redefining storytelling in the digital age.",
        },
      ]
    : [
        {
          title: "Discover Your Next Adventure",
          description:
            "Step into a world of endless possibilities. Your next favorite book is waiting to be discovered.",
        },
        {
          title: "Connect With Stories",
          description:
            "Find books that speak to your soul, curated just for you based on your unique tastes and interests.",
        },
        {
          title: "Join the Conversation",
          description:
            "Share your thoughts, connect with fellow readers, and be part of a vibrant literary community.",
        },
        {
          title: "Support Your Favorite Authors",
          description:
            "Follow authors you love, get updates on their latest works, and help shape the future of storytelling.",
        },
        {
          title: "Your Reading Journey Awaits",
          description:
            "Start your literary adventure today and become part of something bigger.",
        },
      ];

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('section');
      const viewportHeight = window.innerHeight;
      const scrollPosition = window.scrollY;

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();

        // Calculate how far the section is from the center of the viewport
        const distanceFromCenter = Math.abs(rect.top + rect.height / 2 - viewportHeight / 2);

        // If this section is closest to the center, make it active
        if (distanceFromCenter < viewportHeight / 2) {
          setActivePanel(index);

          // Add class for centered effect
          section.classList.add('section-centered');

          // Calculate progress through this section
          const progress = -rect.top / (viewportHeight - rect.height);

          if (progress > 0.7) { // Starting to leave viewport
            section.style.opacity = Math.max(0, 1 - (progress - 0.7) * 3);
          } else {
            section.style.opacity = "1";
          }
        } else {
          section.classList.remove('section-centered');
        }

        // Add entrance animation class when section comes into view
        if (rect.top < viewportHeight && rect.bottom > 0) {
          section.classList.add('section-visible');
        } else {
          section.classList.remove('section-visible');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden scroll-smooth">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <FloatingShape className="text-primary/30 top-1/3 left-[35%]" />
        <CircleShape className="text-[#40E0D0]/30 top-1/4 right-[40%]" />
        <SquareShape className="text-primary/35 bottom-[45%] left-[45%]" />
        <FloatingShape className="text-[#40E0D0]/20 bottom-[40%] right-[35%] rotate-180" />
        <CircleShape className="text-primary/20 top-[05%] left-[20%]" />
        <SquareShape className="text-primary/15 top-[35%] right-[45%] rotate-45" />
        <StarShape className="text-[#40E0D0]/20 bottom-[35%] right-[30%]" />
        <HexagonShape className="text-[#40E0D0]/20 top-[40%] left-[40%]" />
      </div>

      <div className="fixed inset-0 backdrop-blur-[80px] pointer-events-none" />

      {/* Hero section */}
      <section className="min-h-screen flex items-center justify-center relative snap-center transition-transform duration-700 ease-in-out section-visible">
        <div className="text-center space-y-12 relative z-10 backdrop-blur-lg bg-background/70 p-12 rounded-2xl shadow-xl">
          <h1 className="text-5xl md:text-7xl font-bold">
            Where Stories Come Alive
          </h1>
          <div className="flex flex-col items-center gap-8">
            <span className="text-xl text-muted-foreground">I am a</span>
            <div className="flex gap-12 items-center">
              <button
                onClick={() => handleUserTypeChange(false)}
                className={`text-2xl font-bold relative ${!isAuthor ? "text-primary" : "text-muted-foreground"}`}
              >
                Reader
                {!isAuthor && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-[#40E0D0]/50 rounded-full blur-sm" />
                )}
              </button>
              <div className="text-2xl text-muted-foreground">or</div>
              <button
                onClick={() => handleUserTypeChange(true)}
                className={`text-2xl font-bold relative ${isAuthor ? "text-primary" : "text-muted-foreground"}`}
              >
                Author
                {isAuthor && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#40E0D0]/50 to-primary/50 rounded-full blur-sm" />
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Content panels */}
      {panels.map((panel, index) => (
        <section
          key={index}
          className={`
            min-h-screen flex items-center justify-center relative 
            snap-center transition-all duration-700 ease-in-out
            transform translate-y-0 opacity-0
            section-visible:opacity-100 section-visible:translate-y-0
            section-centered:scale-105
          `}
        >
          <div className="container mx-auto px-4 py-16">
            <div className="max-w-3xl mx-auto text-center backdrop-blur-lg bg-background/70 p-12 rounded-2xl shadow-xl">
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                {panel.title}
              </h2>
              <p className="text-xl text-muted-foreground">
                {panel.description}
              </p>
            </div>
          </div>

          {index < panels.length - 1 && (
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
              <ChevronDown className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </section>
      ))}

      {/* Email signup form */}
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
              <Button type="submit">Sign Up</Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;