import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { BrandedNav } from "@/components/branded-nav";
import { HowItWorksSidebar } from "@/components/how-it-works-sidebar";
import { ChevronRight } from "lucide-react";

interface PanelData {
  title: string;
  description: string;
  image?: {
    src: string;
    alt: string;
  };
  hasExploreMore?: boolean;
  exploreContent?: string;
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

// Video background component
const VideoBackground = ({ isPlaying }: { isPlaying: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(err => {
          console.error("Error playing video:", err);
        });
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
      <video 
        ref={videoRef}
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
        poster="/images/book-discovery.svg"
      >
        {/* The video will be loaded dynamically */}
        <source src="/videos/landing-background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
    </div>
  );
};

// Card component that scrolls from side and expands
const ExpandingCard = ({ 
  children, 
  isActive, 
  onExpand 
}: { 
  children: React.ReactNode, 
  isActive: boolean,
  onExpand: () => void
}) => {
  const [expanded, setExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && !expanded) {
      // Animate card entering from side
      const timer = setTimeout(() => {
        setExpanded(true);
        onExpand();
      }, 800); // Time before card expands
      return () => clearTimeout(timer);
    }
    
    if (!isActive) {
      setExpanded(false);
    }
  }, [isActive, expanded, onExpand]);

  return (
    <div 
      ref={cardRef}
      className={`
        relative overflow-hidden transition-all duration-700 ease-in-out
        ${isActive ? 'opacity-100' : 'opacity-0 translate-x-full'}
        ${expanded ? 'w-full h-full' : 'w-[80%] h-[80%] rounded-xl m-8'}
      `}
    >
      {children}
    </div>
  );
};

const LandingPage = () => {
  const [isAuthor, setIsAuthor] = useState(false);
  const [email, setEmail] = useState("");
  const [activePanel, setActivePanel] = useState(0);
  const { setTheme } = useTheme();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [selectedPanel, setSelectedPanel] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
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

  const handleSidebarOpen = (panelTitle: string) => {
    setSelectedPanel(panelTitle);
    trackEvent("sidebar_view", { panelTitle });
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
          hasExploreMore: true,
          exploreContent: `<h3>Your Journey as an Author</h3>
          <p>Begin your authorial journey with us. We provide the tools, community, and support you need to bring your stories to life.</p>
          <h4>What You'll Find</h4>
          <ul>
            <li>Professional writing tools</li>
            <li>Community support</li>
            <li>Marketing assistance</li>
            <li>Publishing guidance</li>
          </ul>
          <p>Take the first step towards becoming a published author today.</p>`,
        },
        {
          title: "Every hero finds troubled waters",
          description:
            "Industry giants drown your business in fees, drowning your dreams. But, A new shore crests the horizon.",
          image: {
            src: "/images/manuscript.svg",
            alt: "Manuscript with editing tools",
          },
          hasExploreMore: true,
          exploreContent: `<h3>Troubled Waters</h3>
          <p>The publishing industry can be challenging for authors. High fees and complex processes can make it difficult to get your work published.</p>
          <h4>Our Solution</h4>
          <p>We offer a simple, affordable, and efficient way to publish your books. Our platform provides all the tools you need to publish and market your work.</p>
          <p>Let us help you navigate the troubled waters of the publishing industry.</p>`,
        },
        {
          title: "A song pierces the chaos",
          description:
            "Sirened calls you to a marketplace that’s yours—no fees, no paid rankings, just readers ready for your voice.",
          image: {
            src: "/images/community.svg",
            alt: "Author connecting with readers",
          },
          hasExploreMore: true,
          exploreContent: `<h3>A Song Pierces the Chaos</h3>
          <p>In the midst of the noise, Sirened stands out. It's your marketplace, free from fees and rankings. We are here to get your voice to readers.</p>
          <h4>Our Community</h4>
          <p>Join a thriving community of authors and readers who share a passion for storytelling. We're focused on fostering a supportive environment where creators can thrive.</p>
          <p>Break through the noise with Sirened.</p>`,
        },
        {
          title: "Your first step into the indie town square",
          description:
            "Step into Sirened’s indie square. Readers reach your books and you keep 100% of every sale.",
          image: {
            src: "/images/analytics.svg",
            alt: "Author analytics dashboard",
          },
          hasExploreMore: true,
          exploreContent: `<h3>Indie Town Square</h3>
          <p>Sirened provides a direct-to-reader marketplace, cutting out the middleman and ensuring you keep 100% of your sales.</p>
          <h4>What We Offer</h4>
          <ul>
            <li>Direct sales</li>
            <li>No fees</li>
            <li>Reader interaction</li>
            <li>Marketing support</li>
          </ul>
          <p>Start your journey in the indie town square today.</p>`,
        },
        {
          title: "Reclaim your Literary Future",
          description:
            "Team up with Siren, our analytics tools and organic engine lift your books from obscurity. Sign up and shape the future of indie publishing.",
          image: {
            src: "/images/future.svg",
            alt: "Future of storytelling",
          },
          hasExploreMore: true,
          exploreContent: `<h3>Reclaim Your Literary Future</h3>
          <p>Join Sirened and take control of your literary future. Our tools and community are designed to help you succeed.</p>
          <h4>How We Help</h4>
          <ul>
            <li>Analytics tracking</li>
            <li>Organic marketing support</li>
            <li>Reader engagement</li>
            <li>Community building</li>
          </ul>
          <p>Shape the future of indie publishing with Sirened.</p>`,
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
          hasExploreMore: true,
          exploreContent: `<h3>Your Hero's Journey</h3>
          <p>Embark on a literary adventure.  Discover books that captivate, move, and inspire.</p>
          <h4>Why Sirened?</h4>
          <ul>
            <li>Diverse selection of books</li>
            <li>Easy discovery tools</li>
            <li>Direct support for authors</li>
            <li>Engaging community</li>
          </ul>
          <p>Find your next favorite book today.</p>`,
        },
        {
          title: "Spellbound by a False Tune",
          description:
            "You crave adventure, but industry giants only offer a bargain bin. The storytellers you love, suffer in obscurity.",
          image: {
            src: "/images/book-connection.svg",
            alt: "Reader connecting with books",
          },
          hasExploreMore: true,
          exploreContent: `<h3>Spellbound by a False Tune</h3>
          <p>Many readers feel lost in the maze of traditional publishing. The industry giants often prioritize profit over quality, leaving amazing stories unheard.</p>
          <h4>A Better Way</h4>
          <p>Sirened is changing the narrative. Our platform provides a more direct connection between readers and independent authors, ensuring that quality stories get the attention they deserve.</p>
          <p>Discover something new with Sirened.</p>`,
        },
        {
          title: "A Song Breaks the Charm",
          description:
            "Discover a realm where your storytellers thrive, a place where quality trumps quantity. Sirened cuts through the chaos",
          image: {
            src: "/images/reader-community.svg",
            alt: "Reader community discussion",
          },
          hasExploreMore: true,
          exploreContent: `<h3>A Song Breaks the Charm</h3>
          <p>Sirened is a sanctuary for quality storytelling. We focus on fostering a supportive community where authors and readers connect directly.</p>
          <h4>Our Mission</h4>
          <p>To provide an independent publishing platform that celebrates originality, fosters connection, and provides authors the tools they need to share their stories with the world.</p>
          <p>Join the Sirened community.</p>`,
        },
        {
          title: "Step into the indie square",
          description:
            "Enter Sirened’s marketplace. Find stories worth their weight, sent straight from the creators’ doors.",
          image: {
            src: "/images/author-support.svg",
            alt: "Supporting favorite authors",
          },
          hasExploreMore: true,
          exploreContent: `<h3>The Indie Square</h3>
          <p>Discover books you'll love directly from independent authors. Sirened cuts out the middleman, allowing creators to connect with their audience directly.</p>
          <h4>What to Expect</h4>
          <ul>
            <li>Unique stories</li>
            <li>Direct author support</li>
            <li>A welcoming community</li>
            <li>High-quality writing</li>
          </ul>
          <p>Explore the Indie Square today.</p>`,
        },
        {
          title: "Support your storytellers",
          description:
            "Join Sirened — back indie authors directly, not the giants who bind them. Sign up and rewrite the ending",
          image: {
            src: "/images/reading-journey.svg",
            alt: "Reading journey visualization",
          },
          hasExploreMore: true,
          exploreContent: `<h3>Support Your Storytellers</h3>
          <p>By supporting independent authors, you're not just buying a book; you're investing in their creativity and helping them share their unique voices with the world.</p>
          <h4>Why Support Indies?</h4>
          <ul>
            <li>Support independent artists</li>
            <li>Discover unique stories</li>
            <li>Connect with authors</li>
            <li>Foster creativity</li>
          </ul>
          <p>Join us in supporting independent authors.</p>`,
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionIndex = parseInt(
              entry.target.getAttribute("data-section-index") || "0"
            );
            trackEvent("section_view", { sectionIndex });
          }
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll(".snap-section").forEach((section, index) => {
      section.setAttribute("data-section-index", index.toString());
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
                  className={`text-2xl font-bold relative ${
                    !isAuthor ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Reader
                  {!isAuthor && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/50 to-[#40E0D0]/50 rounded-full blur-sm" />
                  )}
                </button>
                <div className="text-2xl text-muted-foreground">or</div>
                <button
                  onClick={() => handleUserTypeChange(true)}
                  className={`text-2xl font-bold relative ${
                    isAuthor ? "text-primary" : "text-muted-foreground"
                  }`}
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
                    setActivePanel(index);
                  }
                },
                { threshold: 0.6 },
              );
              observer.observe(el);
            }}
            className="snap-section min-h-screen flex items-center justify-center relative snap-start"
            style={{
              height: "100vh",
            }}
          >
            {/* Video background that starts playing when expanded */}
            {activePanel === index && (
              <VideoBackground isPlaying={isVideoPlaying} />
            )}
            
            <ExpandingCard 
              isActive={activePanel === index}
              onExpand={() => setIsVideoPlaying(true)}
            >
              <div className="w-full h-full relative">
                {/* Content container with gradient overlay */}
                <div className="absolute inset-0 overflow-hidden rounded-xl">
                  {panel.image && !isVideoPlaying && (
                    <img
                      src={panel.image.src}
                      alt={panel.image.alt}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                {/* Text content with gradient overlay */}
                <div className="absolute inset-x-0 bottom-0 p-8 z-10 bg-gradient-to-t from-black to-transparent">
                  <div className="flex items-center justify-between">
                    <h2 className="text-4xl md:text-6xl font-bold text-white">{panel.title}</h2>
                    {panel.hasExploreMore && (
                      <button
                        onClick={() => handleSidebarOpen(panel.title)}
                        className="p-2 hover:bg-accent/30 rounded-full transition-colors"
                        aria-label="Explore more"
                      >
                        <ChevronRight className="h-6 w-6 text-white" />
                      </button>
                    )}
                  </div>
                  <p className="text-xl text-gray-200 mt-6">
                    {panel.description}
                  </p>
                </div>
              </div>
            </ExpandingCard>

            {index < panels.length - 1 && (
              <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 animate-bounce">
                <ChevronDown className="w-8 h-8 text-white" />
              </div>
            )}
          </section>
        ))}
      </div>

      {selectedPanel && (
        <HowItWorksSidebar
          isOpen={!!selectedPanel}
          onClose={() => setSelectedPanel(null)}
          title={selectedPanel}
          content={panels.find((p) => p.title === selectedPanel)
            ?.exploreContent}
        />
      )}
    </div>
  );
};

export default LandingPage;