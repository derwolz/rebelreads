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
    style={{transition: "all 0.1s ease-in-out"}}
    className={`absolute  animate-float ${className}`}
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
    className={`absolute transition-all duration-800 ease-in-out animate-float-delayed ${className}`}
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
    className={`absolute transition-all duration-1350 ease-in-out animate-float-reverse ${className}`}
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
      const emailSignupHeight = 80; // Height of the email signup bar
      const adjustedViewportHeight = viewportHeight - emailSignupHeight;
      const scrollPosition = window.scrollY;

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const distanceFromTop = rect.top;
        const container = section.querySelector('.container');

        if (!container) return;

        let rotation = 0;
        let translateZ = 0;
        const isLastSection = index === sections.length - 1;

        // Calculate rotation based on viewport position
        if (distanceFromTop <= viewportHeight && distanceFromTop >= -viewportHeight) {
          // Card coming into view
          if (distanceFromTop > 0) {
            rotation = Math.min(45, (distanceFromTop / viewportHeight) * 90);
            translateZ = Math.min(500, (distanceFromTop / viewportHeight) * 1000);
          } 
          // Card in view
          else if (distanceFromTop > -viewportHeight) {
            rotation = Math.max(-45, (distanceFromTop / viewportHeight) * 90);
            translateZ = Math.max(-500, (distanceFromTop / viewportHeight) * 1000);
          }

          // Keep last card centered
          if (isLastSection && distanceFromTop < viewportHeight / 2) {
            rotation = 0;
            translateZ = 0;
          }
        }

        // Apply the transforms
        container.style.setProperty('--rotation', `${rotation}deg`);
        container.style.setProperty('--translate-z', `${translateZ}px`);

        // Calculate opacity based on distance from adjusted center viewport
        let opacity = 0;
        const centerViewport = adjustedViewportHeight / 2;
        const distanceFromCenter = Math.abs(distanceFromTop + centerViewport);

        if (distanceFromTop <= 0 && distanceFromTop >= -adjustedViewportHeight) {
          // Fade in as card approaches center
          opacity = Math.max(0, 1 - (distanceFromCenter / (adjustedViewportHeight * 0.5)));
        } else if (distanceFromTop > 0 && distanceFromTop <= adjustedViewportHeight) {
          // Start fading in from off-screen
          opacity = Math.max(0, 1 - (distanceFromTop / (adjustedViewportHeight * 0.5)));
        }

        // Ensure last card stays visible when centered
        if (isLastSection && distanceFromTop < adjustedViewportHeight / 3) {
          opacity = 1;
        }

        container.style.opacity = opacity.toString();

        // Update active panel
        if (Math.abs(distanceFromTop) < adjustedViewportHeight / 2) {
          setActivePanel(index);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call to set up first card
    return () => window.removeEventListener('scroll', handleScroll);
  }, [panels.length]);

  return (
    <div className="min-h-screen relative overflow-hidden">
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

      <div className="fixed inset-0 backdrop-blur-[45px] pointer-events-none" />

      {/* Hero section with text buttons */}
      <section className="min-h-screen flex items-center justify-center relative">
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

      {panels.map((panel, index) => (
        <section
          key={index}
          className="min-h-screen flex items-center justify-center relative snap-start transition-all duration-500"
          style={{ 
            opacity: 1,
            perspective: "1500px",
            transformStyle: "preserve-3d"
          }}
        >
          <div 
            className="container mx-auto px-4 py-16 relative"
            style={{
              transform: `rotate3d(1, 1, 0, var(--rotation)) translateZ(var(--translate-z))`,
              transformOrigin: "top right",
              transition: "all 0.8s ease-out",
            }}
          >
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
            <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 animate-bounce">
              <ChevronDown className="w-8 h-8 text-muted-foreground" />
            </div>
          )}
        </section>
      ))}

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