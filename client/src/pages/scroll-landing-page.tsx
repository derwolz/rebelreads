import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
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
      subtext: "Discover a platform where stories come to life",
      imageSrc: "/images/book-stack.svg",
      backgroundColor: "bg-primary/5"
    },
    {
      id: "section-2",
      heading: "Connect with Your Favorite Authors",
      subtext: "Follow and engage with creators who inspire you",
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
      
      // Track section view in analytics if needed
      const windowHeight = window.innerHeight;
      const currentSectionIndex = Math.min(
        Math.floor(window.scrollY / windowHeight),
        sections.length - 1
      );
      
      // You could add section tracking logic here if needed
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
  
  // Determine which headings should be visible in the stack
  const visibleHeadings = currentSectionIndex >= 3 
    ? sections.slice(0, currentSectionIndex)
    : [];
  
  // Calculate the transition progress
  const transitionToBottomLeft = currentSectionIndex >= 2 ? Math.min(progressInSection, 1) : 0;
  
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
          
          {/* Center heading - initial state (sections 0-2) */}
          {currentSectionIndex <= 2 && (
            <div 
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10 w-full px-6"
              style={{
                opacity: currentSectionIndex === 2 ? 1 - transitionToBottomLeft : 1,
                transform: currentSectionIndex === 2 
                  ? `translate(-50%, calc(-50% + ${transitionToBottomLeft * 35}vh))`
                  : 'translate(-50%, -50%)'
              }}
            >
              <h1 className="text-4xl md:text-6xl font-bold mb-6 text-primary">
                {sections[currentSectionIndex]?.heading}
              </h1>
              <p className="text-xl md:text-2xl max-w-3xl mx-auto text-foreground/80">
                {sections[currentSectionIndex]?.subtext}
              </p>
            </div>
          )}
          
          {/* Layout for section 3+ with heading at bottom left and subtext at bottom right */}
          {currentSectionIndex >= 2 && (
            <>
              {/* Image at top */}
              <div 
                className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-1/2 max-w-xl"
                style={{ 
                  opacity: currentSectionIndex === 2 ? transitionToBottomLeft : 1,
                  transform: `translate(-50%, 0) scale(${
                    currentSectionIndex === 2 
                      ? 0.8 + (transitionToBottomLeft * 0.2) 
                      : 1
                  })` 
                }}
              >
                <img 
                  src={sections[currentSectionIndex]?.imageSrc} 
                  alt={`Illustration for ${sections[currentSectionIndex]?.heading}`}
                  className="w-full h-auto"
                />
              </div>
              
              {/* Heading at bottom left */}
              <div 
                className="absolute bottom-24 left-10 md:left-20 max-w-md z-10"
                style={{ 
                  opacity: currentSectionIndex === 2 ? transitionToBottomLeft : 1,
                  transform: currentSectionIndex === 2
                    ? `translateX(${-50 + (transitionToBottomLeft * 50)}px)`
                    : 'translateX(0)'
                }}
              >
                <h2 className="text-3xl md:text-4xl font-bold text-primary">
                  {sections[currentSectionIndex]?.heading}
                </h2>
              </div>
              
              {/* Subtext at bottom right */}
              <div 
                className="absolute bottom-24 right-10 md:right-20 max-w-md text-right z-10"
                style={{ 
                  opacity: currentSectionIndex === 2 ? transitionToBottomLeft : 1,
                  transform: currentSectionIndex === 2
                    ? `translateX(${50 - (transitionToBottomLeft * 50)}px)`
                    : 'translateX(0)'
                }}
              >
                <p className="text-lg md:text-xl text-foreground/80">
                  {sections[currentSectionIndex]?.subtext}
                </p>
              </div>
            </>
          )}
          
          {/* Fixed heading stack for sections 3+ */}
          <div className="fixed left-10 top-32 z-20 max-w-md pointer-events-none">
            {currentSectionIndex >= 3 && visibleHeadings.map((section, index) => {
              // Calculate vertical position based on index and scroll progress
              const topOffset = index * 2.5;
              
              return (
                <div
                  key={section.id}
                  className="mb-4 opacity-60 hover:opacity-80 transition-opacity"
                  style={{ 
                    transform: `translateY(${topOffset - (progressInSection * 2)}rem)`,
                    opacity: 0.6 - (index * 0.1)
                  }}
                >
                  <h3 className="text-lg md:text-xl font-medium text-primary/80">
                    {section.heading}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      <FloatingSignup />
    </div>
  );
}

export default ScrollLandingPage;