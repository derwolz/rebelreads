import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { BrandedNav } from "@/components/branded-nav";
import { FloatingSignup } from "@/components/floating-signup";
import { useTheme } from "@/hooks/use-theme";

interface ScrollSection {
  id: string;
  heading: string;
  subtext: string;
  imageSrc: string;
  backgroundColor: string;
}

export function ScrollLandingPage(): React.JSX.Element {
  const [scrollY, setScrollY] = useState(0);
  const [sessionId] = useState(() => crypto.randomUUID());
  const { setTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Define our content sections
  const sections: ScrollSection[] = [
    {
      id: "section-1",
      heading: "Welcome to a New Reading Experience",
      subtext: "", // No subtext for first section
      imageSrc: "/images/book-stack.svg",
      backgroundColor: "bg-primary/5"
    },
    {
      id: "section-2",
      heading: "Connect with Your Favorite Authors",
      subtext: "", // No subtext for second section
      imageSrc: "/images/author-writing.svg",
      backgroundColor: "bg-primary/10"
    },
    {
      id: "section-3",
      heading: "Explore New Literary Worlds",
      subtext: "Find your next favorite story in our vast collection",
      imageSrc: "/images/reading-adventure.svg",
      backgroundColor: "bg-primary/15"
    },
    {
      id: "section-4",
      heading: "Join Our Growing Community",
      subtext: "Be part of a network of passionate readers and writers",
      imageSrc: "/images/community-readers.svg",
      backgroundColor: "bg-primary/20"
    },
    {
      id: "section-5",
      heading: "Start Your Journey Today",
      subtext: "Sign up and unlock the full potential of your reading experience",
      imageSrc: "/images/journey-start.svg",
      backgroundColor: "bg-primary/25"
    }
  ];

  // Total scroll height of the page
  const totalHeight = sections.length * 100; // 100vh per section

  useEffect(() => {
    // Create a scroll container with the calculated height
    if (scrollRef.current) {
      scrollRef.current.style.height = `${totalHeight}vh`;
    }

    // Handle scroll events to update scrollY state
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    // Initialize session tracking
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
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("beforeunload", trackEndSession);
      trackEndSession();
    };
  }, [sessionId, totalHeight, sections.length]);
  
  // Calculate which section is currently active based on scroll position
  const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 0;
  const currentSectionIndex = Math.min(
    Math.floor(scrollY / windowHeight),
    sections.length - 1
  );
  
  // Calculate progress within the current section (0 to 1)
  const progressInSection = 
    (scrollY - (currentSectionIndex * windowHeight)) / windowHeight;

  // Track section view in analytics
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

  return (
    <div className="bg-background overflow-hidden" ref={containerRef}>
      <BrandedNav />
      
      {/* Create a container with the full scroll height */}
      <div className="relative" ref={scrollRef}>
        {/* Fixed viewport container that shows content based on scroll */}
        <div className="fixed top-0 left-0 w-full h-screen overflow-hidden">
          {/* Background color transitions with scroll */}
          <div 
            className={`absolute inset-0 transition-colors duration-300 ${
              sections[currentSectionIndex]?.backgroundColor || 'bg-primary/5'
            }`}
          />
          
          {/* Scroll indicator for first section */}
          {currentSectionIndex === 0 && progressInSection < 0.5 && (
            <div 
              className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce z-10"
              style={{ opacity: 1 - progressInSection * 2 }}
            >
              <ChevronDown className="w-8 h-8 text-primary" />
            </div>
          )}
          
          {/* Main Heading Container - Position depends on section */}
          <div 
            className={`absolute z-10 w-full px-6 transition-all duration-500 ${
              currentSectionIndex < 3 
                ? "top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center" 
                : "bottom-1/4 left-20 text-left max-w-md"
            }`}
            style={{
              transform: currentSectionIndex === 2 
                ? `translate(calc(-50% + ${progressInSection * 35}%), calc(-50% + ${progressInSection * 40}%))`
                : currentSectionIndex < 2 
                  ? "translate(-50%, -50%)" 
                  : "none",
              opacity: 1 // Main heading always has full opacity
            }}
          >
            {/* Current section's heading */}
            <h1 
              className="text-2xl md:text-3xl font-bold text-primary transition-all"
            >
              {sections[currentSectionIndex]?.heading}
            </h1>
            
            {/* Show subtext for sections that have it (after heading 2) */}
            {currentSectionIndex >= 2 && sections[currentSectionIndex]?.subtext && (
              <p 
                className="text-lg md:text-xl text-foreground/80 transition-all mt-4"
                style={{ 
                  opacity: progressInSection < 0.5 ? progressInSection * 2 : 1 
                }}
              >
                {sections[currentSectionIndex]?.subtext}
              </p>
            )}
          </div>
          
          {/* Stack of Previous Headings */}
          <div 
            className={`absolute z-20 transition-all duration-500 ${
              currentSectionIndex >= 3 
                ? "left-20 text-left" 
                : "left-1/2 transform -translate-x-1/2 text-center"
            }`}
            style={{
              // For index 0-1, headings are stacked in center
              // For index 2, they transition to bottom left
              // For index 3+, they stay at bottom left
              top: currentSectionIndex < 2 
                ? "30%" 
                : currentSectionIndex === 2 
                  ? `calc(30% + ${progressInSection * 20}%)` 
                  : "50%",
              left: currentSectionIndex < 2
                ? "50%" 
                : currentSectionIndex === 2
                  ? `calc(50% - ${progressInSection * 30}%)` 
                  : "20px",
              transform: currentSectionIndex < 3 
                ? "translateX(-50%)" 
                : "none"
            }}
          >
            {currentSectionIndex >= 1 && sections.slice(0, currentSectionIndex).reverse().map((section, index) => {
              // Reverse the array so older sections are at the top
              // Each heading is stacked below the previous one with proper spacing
              const stackPosition = index * 70; // Increased spacing between headings
              const opacity = 0.8 - (index * 0.15); // Gradually decrease opacity for older headings
              
              return (
                <div
                  key={section.id}
                  className="mb-10 transition-all duration-300" // Increased margin
                  style={{ 
                    transform: `translateY(${stackPosition}px)`, // Positive value to stack downwards
                    opacity: opacity,
                    // Animate the most recent previous heading based on scroll progress
                    ...(index === 0 && {
                      transform: `translateY(${stackPosition + (progressInSection * 20)}px)`,
                      opacity: opacity - (progressInSection * 0.1)
                    })
                  }}
                >
                  <h3 className="text-2xl md:text-3xl font-medium text-primary">
                    {section.heading}
                  </h3>
                </div>
              );
            })}
          </div>
          
          {/* Image for current section - only show after section 1 */}
          {currentSectionIndex >= 2 && (
            <div 
              className="absolute top-1/4 right-20 transform -translate-y-1/2 w-1/3 max-w-md"
              style={{ 
                opacity: progressInSection < 0.3 ? progressInSection * 3 : 1,
                transform: `translateY(-50%) scale(${0.9 + (progressInSection * 0.1)})` 
              }}
            >
              <img 
                src={sections[currentSectionIndex]?.imageSrc} 
                alt={`Illustration for ${sections[currentSectionIndex]?.heading}`}
                className="w-full h-auto"
              />
            </div>
          )}
        </div>
      </div>
      
      <FloatingSignup />
    </div>
  );
}

export default ScrollLandingPage;