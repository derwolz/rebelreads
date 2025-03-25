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
          
          {/* Heading Stack Container */}
          <div className="absolute w-full h-full">
            {/* For Sections 0-1: Centered heading only */}
            {currentSectionIndex < 2 && (
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center w-full px-6 z-10 transition-all duration-500"
              >
                <h1 className="text-2xl md:text-3xl font-bold text-primary">
                  {sections[currentSectionIndex]?.heading}
                </h1>
              </div>
            )}
            
            {/* For Section 2+: Bottom left heading stack */}
            {currentSectionIndex >= 2 && (
              <div 
                className="absolute bottom-32 left-20 text-left max-w-md z-20 transition-all duration-500"
                style={{ 
                  opacity: 1,
                  transform: currentSectionIndex === 2 
                    ? `translateX(${-30 + (progressInSection * 30)}%)` 
                    : "none" 
                }}
              >
                {/* Stack all headings with current one at the bottom */}
                <div className="relative">
                  {/* Previous headings - in ascending order from bottom to top */}
                  {[...sections.slice(0, currentSectionIndex)].map((section, index) => {
                    // Calculate vertical position with older ones (lower index) higher up
                    // First section is at the top, then second, etc.
                    const reverseIndex = currentSectionIndex - index - 1; // Reverse the index
                    const stackPosition = (reverseIndex + 1) * 60; // Increased spacing between headings
                    const opacity = 0.3 + ((reverseIndex + 1) * 0.15); // More opacity for newer ones
                    
                    return (
                      <div
                        key={section.id}
                        className="absolute transition-all duration-300"
                        style={{ 
                          bottom: `${stackPosition}px`,
                          opacity: opacity,
                        }}
                      >
                        <h3 className="text-2xl md:text-3xl font-medium text-primary">
                          {section.heading}
                        </h3>
                      </div>
                    );
                  })}
                  
                  {/* Current section heading - at the bottom */}
                  <div className="relative transition-all duration-300">
                    <h2 className="text-2xl md:text-3xl font-bold text-primary">
                      {sections[currentSectionIndex]?.heading}
                    </h2>
                  </div>
                </div>
              </div>
            )}
            
            {/* Descriptive text in bottom right - appear for section 2+ */}
            {currentSectionIndex >= 2 && (
              <div 
                className="absolute bottom-32 right-20 max-w-md text-right z-10 transition-all duration-500"
                style={{ 
                  opacity: currentSectionIndex === 2 
                    ? progressInSection 
                    : 1,
                  transform: currentSectionIndex === 2
                    ? `translateX(${50 - (progressInSection * 50)}px)` 
                    : "none"
                }}
              >
                <p className="text-lg md:text-xl text-foreground/80">
                  {sections[currentSectionIndex]?.subtext}
                </p>
              </div>
            )}
            
            {/* Image for current section - only show after section 1 */}
            {currentSectionIndex >= 2 && (
              <div 
                className="absolute top-1/4 right-20 transform -translate-y-1/2 w-1/3 max-w-md z-5"
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
      </div>
      
      <FloatingSignup />
    </div>
  );
}

export default ScrollLandingPage;