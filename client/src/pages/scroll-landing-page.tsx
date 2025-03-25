import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useLocation } from "wouter";
import { BrandedNav } from "@/components/branded-nav";
import { FloatingSignup } from "@/components/floating-signup";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface ScrollSection {
  id: string;
  heading: string;
  subtext: string;
  imageSrc: string;
  backgroundColor: string;
}

const ScrollLandingPage = (): React.JSX.Element => {
  const [activeSection, setActiveSection] = useState(0);
  const [previousSection, setPreviousSection] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [sessionId] = useState(() => crypto.randomUUID());
  const { setTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  
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

  useEffect(() => {
    // Handle scroll events to update active section
    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      
      // Calculate overall scroll progress (0 to 1)
      const scrollPercent = scrollTop / (docHeight - windowHeight);
      setScrollProgress(scrollPercent);
      
      // Determine active section based on scroll position
      const sectionHeight = windowHeight;
      const rawSectionIndex = Math.floor(scrollTop / sectionHeight);
      const adjustedSectionIndex = Math.min(rawSectionIndex, sections.length - 1);
      
      if (adjustedSectionIndex !== activeSection) {
        setPreviousSection(activeSection);
        setActiveSection(adjustedSectionIndex);
        
        // Track section view in analytics
        trackEvent("section_view", { sectionIndex: adjustedSectionIndex });
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    
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
  }, [activeSection, sessionId, sections.length]);
  
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
    <div 
      className="min-h-screen bg-background overflow-hidden"
      ref={containerRef}
    >
      <BrandedNav />
      
      {/* Full-height container for the scrollable content */}
      <div className="relative">
        {/* Sections container */}
        {sections.map((section, index) => (
          <div 
            key={section.id}
            className={`h-screen w-full flex flex-col items-center justify-center relative ${section.backgroundColor} transition-colors duration-700`}
            id={section.id}
          >
            {index === 0 && (
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce z-10">
                <ChevronDown className="w-8 h-8 text-primary" />
              </div>
            )}
            
            {/* Central heading for sections 0, 1, 2 */}
            {index <= 2 && activeSection === index && (
              <div className="container mx-auto px-4 text-center z-10">
                <motion.h1 
                  className="text-4xl md:text-6xl font-bold mb-6 text-primary"
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                >
                  {section.heading}
                </motion.h1>
                <motion.p 
                  className="text-xl md:text-2xl max-w-3xl mx-auto text-foreground/80"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                >
                  {section.subtext}
                </motion.p>
              </div>
            )}
            
            {/* Section 3+ layout - heading moves to bottom left, subtext to bottom right, image appears */}
            {index >= 3 && activeSection === index && (
              <>
                {/* Image at top */}
                <motion.div 
                  className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-1/2 max-w-xl"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7 }}
                >
                  <img 
                    src={section.imageSrc} 
                    alt={`Illustration for ${section.heading}`}
                    className="w-full h-auto"
                  />
                </motion.div>
                
                {/* Heading at bottom left */}
                <motion.div 
                  className="absolute bottom-24 left-10 md:left-20 max-w-md z-10"
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7 }}
                >
                  <h2 className="text-3xl md:text-4xl font-bold text-primary">
                    {section.heading}
                  </h2>
                </motion.div>
                
                {/* Subtext at bottom right */}
                <motion.div 
                  className="absolute bottom-24 right-10 md:right-20 max-w-md text-right z-10"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                >
                  <p className="text-lg md:text-xl text-foreground/80">
                    {section.subtext}
                  </p>
                </motion.div>
              </>
            )}
          </div>
        ))}
        
        {/* Fixed heading stack for sections 3+ */}
        <div className="fixed left-10 top-32 z-20 max-w-md pointer-events-none">
          <AnimatePresence>
            {activeSection >= 3 && activeSection < sections.length &&
              sections.slice(0, activeSection).map((section, index) => (
                <motion.div
                  key={section.id}
                  className="mb-4 opacity-60 hover:opacity-80 transition-opacity"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 0.6, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <h3 className="text-lg md:text-xl font-medium text-primary/80">
                    {section.heading}
                  </h3>
                </motion.div>
              ))
            }
          </AnimatePresence>
        </div>
      </div>
      
      <FloatingSignup />
    </div>
  );
};

export default ScrollLandingPage;