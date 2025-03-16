import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { ChevronDown, ChevronRight, ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import { BrandedNav } from "@/components/branded-nav";

interface PanelData {
  title: string;
  description: string;
  image?: {
    src: string;
    alt: string;
  };
}

const FloatingShape = ({ className }: { className?: string }) => (
  <div
    style={{ transition: "all 0.1s ease-in-out" }}
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
  const [, setLocation] = useLocation();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [, navigate] = useLocation();

  useEffect(() => {
    // Initialize session
    fetch("/api/landing/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        deviceInfo: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          screenSize: `${window.screen.width}x${window.screen.height}`,
        },
      }),
    });

    // Track session end
    const trackEndSession = async () => {
      try {
        await fetch(`/api/landing/session/${sessionId}/end`, {
          method: "POST",
        });
      } catch (error) {
        console.error("Failed to track session end:", error);
      }
    };

    window.addEventListener("beforeunload", trackEndSession);
    return () => {
      window.removeEventListener("beforeunload", trackEndSession);
      trackEndSession();
    };
  }, [sessionId]);

  const trackEvent = async (type: string, data = {}) => {
    try {
      await fetch("/api/landing/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          type,
          data,
        }),
      });
    } catch (error) {
      console.error("Failed to track event:", error);
    }
  };

  const handleUserTypeChange = (isAuthor: boolean) => {
    setIsAuthor(isAuthor);
    setTheme(isAuthor ? "dark" : "light");
    window.history.replaceState(null, "", `#${isAuthor ? "author" : "reader"}`);
    trackEvent("theme_change", { theme: isAuthor ? "author" : "reader" });
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

    trackEvent("signup_click");

    try {
      const response = await fetch("/api/signup-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          isAuthor,
          sessionId,
        }),
      });

      if (response.ok) {
        trackEvent("signup_complete");
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

  const panels: PanelData[] = isAuthor
    ? [
        {
          title: "You are the protagonist",
          description:
            "Every great author starts with a spark — yours ignites here.",
          image: {
            src: "/images/author-journey.svg",
            alt: "Author writing at desk",
          },
        },
        {
          title: "Every hero finds troubled waters",
          description:
            "Industry giants drown your business in fees, drowning your dreams. But, A new shore crests the horizon.",
          image: {
            src: "/images/manuscript.svg",
            alt: "Manuscript with editing tools",
          },
        },
        {
          title: "A song pierces the chaos",
          description:
            "Sirened calls you to a marketplace that’s yours—no fees, no paid rankings, just readers ready for your voice.",
          image: {
            src: "/images/community.svg",
            alt: "Author connecting with readers",
          },
        },
        {
          title: "Your first step into the indie town square",
          description:
            "Step into Sirened’s indie square. Readers reach your books and you keep 100% of every sale.",
          image: {
            src: "/images/analytics.svg",
            alt: "Author analytics dashboard",
          },
        },
        {
          title: "Reclaim your Literary Future",
          description:
            "Team up with Siren, our analytics tools and organic engine lift your books from obscurity. Sign up and shape the future of indie publishing.",
          image: {
            src: "/images/future.svg",
            alt: "Future of storytelling",
          },
        },
      ]
    : [
        {
          title: "You are the Hero",
          description:
            "Step into a world of endless possibilities. Your next favorite book is waiting to be discovered.",
          image: {
            src: "/images/book-discovery.svg",
            alt: "Book discovery journey",
          },
        },
        {
          title: "Spellbound by a False Tune",
          description:
            "You crave adventure, but industry giants only offer a bargain bin. The storytellers you love, suffer in obscurity.",
          image: {
            src: "/images/book-connection.svg",
            alt: "Reader connecting with books",
          },
        },
        {
          title: "A Song Breaks the Charm",
          description:
            "Discover a realm where your storytellers thrive, a place where quality trumps quantity. Sirened cuts through the chaos",
          image: {
            src: "/images/reader-community.svg",
            alt: "Reader community discussion",
          },
        },
        {
          title: "Step into the indie square",
          description:
            "Enter Sirened’s marketplace. Find stories worth their weight, sent straight from the creators’ doors.",
          image: {
            src: "/images/author-support.svg",
            alt: "Supporting favorite authors",
          },
        },
        {
          title: "Support your storytellers",
          description:
            "Join Sirened — back indie authors directly, not the giants who bind them. Sign up and rewrite the ending",
          image: {
            src: "/images/reading-journey.svg",
            alt: "Reading journey visualization",
          },
        },
      ];
  const getRotationAndTranslate = (index: number) => {
    const rotationValue = index * 20;
    const translateZValue = 100;
    return {
      "--rotation": `${rotationValue}deg`,
      "--translate-z": `${translateZValue}px`,
    };
  };

  const handleHowItWorksNavigation = (index: number) => {
    trackEvent("how_it_works_navigation", { panelIndex: index });
    navigate(`/how-it-works#section-${index}`);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionIndex = parseInt(entry.target.getAttribute("data-section-index") || "0");
            trackEvent("section_view", { sectionIndex });
          }
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll('.snap-section').forEach((section, index) => {
      section.setAttribute('data-section-index', index.toString());
      observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BrandedNav />
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

      <div className="scroll-container h-screen overflow-y-auto scroll-smooth snap-y snap-mandatory scroll-snap-align:center">
        <section className="snap-section min-h-screen flex items-center justify-center relative snap-start ">
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
            ref={(el) => {
              if (!el) return;
              const observer = new IntersectionObserver(
                ([entry]) => {
                  if (entry.isIntersecting) {
                    el.classList.remove("section-hidden");
                    el.classList.add("section-visible");
                    const content = el.querySelector(".section-content");
                    if (content) {
                      content.classList.remove("card-animate-out");
                      content.classList.add("card-animate");
                      content.classList.add("card-animate-in");
                    }
                  } else {
                    const content = el.querySelector(".section-content");
                    if (content) {
                      content.classList.remove("card-animate-in");
                      content.classList.add("card-animate-out");
                    }
                    setTimeout(() => {
                      if (!entry.isIntersecting) {
                        el.classList.remove("section-visible");
                        el.classList.add("section-hidden");
                      }
                    }, 500);
                  }
                },
                { threshold: 0.5 },
              );
              observer.observe(el);
            }}
            className="snap-section overflow-none min-h-screen flex items-center justify-between relative snap-start section-hidden"
            style={{
              transformStyle: "preserve-3d",
              willChange: "transform",
              height: "100vh",
            }}
          >
            <div
              className="container mx-auto px-4 py-16 relative section-content"
              style={{
                transform: `rotate3d(2, 1, 0.5, var(--rotation)) translateZ(var(--translate-z))`,
                transformOrigin: "85% 15%",
                transition: "all 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <div className="max-w-3xl min-h-full mx-auto text-center backdrop-blur-lg bg-background/70 p-12 rounded-2xl shadow-xl">
                {panel.image && (
                  <div className="mb-8 relative w-full aspect-[3/2] rounded-lg overflow-hidden">
                    <img
                      src={panel.image.src}
                      alt={panel.image.alt}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="transition-transform hover:-translate-x-1"
                    onClick={() => {
                      if (index > 0) {
                        const prevSection = document.querySelector(`section:nth-child(${index})`);
                        if (prevSection) prevSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    disabled={index === 0}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                  <h2 className="text-4xl md:text-6xl font-bold">{panel.title}</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="transition-transform hover:translate-x-1"
                    onClick={() => handleHowItWorksNavigation(index)}
                  >
                    <ChevronRight className="h-8 w-8" />
                  </Button>
                </div>
                <p className="text-xl text-muted-foreground">{panel.description}</p>
              </div>
            </div>

            {index < panels.length - 1 && (
              <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 animate-bounce">
                <ChevronDown className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
};

export default LandingPage;