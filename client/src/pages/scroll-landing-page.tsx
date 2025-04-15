import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ChevronDown, User, Book } from "lucide-react";
import { BrandedNav } from "@/components/branded-nav";
import { FloatingSignup } from "@/components/floating-signup";
import { BookMetricsDashboard } from "@/components/book-metrics-dashboard";
import { useTheme } from "@/hooks/use-theme";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { CountUp } from "@/components/count-up";

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
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  
  // Check for nobeta query parameter and log out the user if present
  useEffect(() => {
    // Check if the URL has nobeta=true parameter and user is logged in
    const searchParams = new URLSearchParams(window.location.search);
    const noBeta = searchParams.get('nobeta');
    
    if (noBeta === 'true' && user) {
      // User doesn't have beta access but is logged in with Google - log them out
      logoutMutation.mutate();
      
      toast({
        title: "Thank you for your interest!",
        description: "We'll notify you when beta access is available for your account.",
      });
      
      // Remove the nobeta parameter from the URL to prevent repeated logouts
      searchParams.delete('nobeta');
      const newUrl = window.location.pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, [user, logoutMutation, toast]);

  // User type state (Author or Reader)
  const [userType, setUserType] = useState<"author" | "reader">("author");

  // Author and Reader content variations
  const contentVariations = {
    author: {
      sections: [
        {
          id: "section-1",
          heading: "You are the Protagonist",
          subtext: "Every great author starts with a spark — yours ignites here", // No subtext for first section
          imageSrc: "/images/book-stack.svg",
          backgroundColor: "bg-primary/5",
        },
        {
          id: "section-2",
          heading: "Every hero finds troubled waters.",
          subtext: "Industry giants drown your writing in fees, but a new future crests the horizon", // No subtext for second section
          imageSrc: "/images/author-writing.svg",
          backgroundColor: "bg-primary/10",
        },
        {
          id: "section-3",
          heading: "A song pierces the chaos",
          subtext: "Sirened calls you to a fair market. No hidden fees, no paid rankings, just readers waiting for your book.",
          imageSrc: "/images/reading-adventure.svg",
          backgroundColor: "bg-primary/15",
        },
        {
          id: "section-4",
          heading: "Step into the town square.",
          subtext: "You wrote your book, now let us help you find readers. At our fair marketplace, you control your sales and keep 100% of your profits.",
          imageSrc: "/images/community-readers.svg", // This won't be used but kept for fallback
          backgroundColor: "bg-primary/20",
        },
        {
          id: "section-5",
          heading: "Reclaim your literary future.",
          subtext:
            "Sign up today. With access to our qualified readership, advanced analytics, and a fair search engine, You'll have every tool to make your stories a success.",
          imageSrc: "/images/journey-start.svg",
          backgroundColor: "bg-primary/25",
        },
      ],
    },
    reader: {
      sections: [
        {
          id: "section-1",
          heading: "You are the Hero",
          subtext: "Crawling through labyrinthian suggestions, you seek a perfect story around every bend.", // No subtext for first section
          imageSrc: "/images/book-stack.svg",
          backgroundColor: "bg-primary/5",
        },
        {
          id: "section-2",
          heading: "Spellbound by a False Tune",
          subtext: "You crave adventure and the industry giants only offer the bargain bin. Storytellers reach for your ears, but fail to pass their gates.", // No subtext for second section
          imageSrc: "/images/author-writing.svg",
          backgroundColor: "bg-primary/10",
        },
        {
          id: "section-3",
          heading: "A Song breaks the Charm",
          subtext: "Discover a realm where storytellers thrive. A place where quality trumps quantity.",
          imageSrc: "/images/reading-adventure.svg",
          backgroundColor: "bg-primary/15",
        },
        {
          id: "section-4",
          heading: "Step into the town square",
          subtext: "Enter Sirened's marketplace. Where your reviews affect your suggestions. Ensuring the themes you care about make it to your hands.",
          imageSrc: "/images/community-readers.svg",
          backgroundColor: "bg-primary/20",
        },
        {
          id: "section-5",
          heading: "Support your Storytellers",
          subtext: "Join Sirened's elite readership — back your favorite authors directly, not the giants that leave them in obscurity.",
          imageSrc: "/images/journey-start.svg",
          backgroundColor: "bg-primary/25",
        },
      ],
    },
  };

  // Track events for analytics
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

  // Toggle between Author and Reader modes
  const toggleUserType = useCallback(() => {
    const newUserType = userType === "author" ? "reader" : "author";
    setUserType(newUserType);

    // Update theme based on user type
    setTheme(newUserType === "author" ? "dark" : "light");

    // Update URL hash for direct access
    window.location.hash = newUserType;

    // Track the mode change
    trackEvent("mode_change", { mode: newUserType });
  }, [userType, setTheme, sessionId]);

  // Check URL hash on component mount to determine initial mode
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash === "reader" || hash === "author") {
      setUserType(hash as "author" | "reader");
      setTheme(hash === "author" ? "dark" : "light");
    }
  }, [setTheme]);

  // Use dynamic content based on selected user type
  const sections: ScrollSection[] = contentVariations[userType].sections;

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
  const windowHeight = typeof window !== "undefined" ? window.innerHeight : 0;
  const currentSectionIndex = Math.min(
    Math.floor(scrollY / windowHeight),
    sections.length - 1,
  );

  // Calculate progress within the current section (0 to 1)
  const progressInSection =
    (scrollY - currentSectionIndex * windowHeight) / windowHeight;

  // Determine visibility and opacity of heading stack based on section transitions
  const shouldShowHeadstack =
    !(currentSectionIndex === 1 && progressInSection >= 0.8) &&
    !(currentSectionIndex === 2 && progressInSection < 0.2);

  // Calculate the fade-out opacity at the end of section 2
  const fadeOutOpacity =
    currentSectionIndex === 1 && progressInSection >= 0.8
      ? 1 - (progressInSection - 0.8) * 5 // Scale from 1 to 0 in last 20% of section 1
      : 1;

  // Calculate the fade-in opacity at the beginning of section 3
  const fadeInOpacity =
    currentSectionIndex === 2 && progressInSection <= 0.2
      ? progressInSection * 5 // Scale from 0 to 1 in first 20% of section 2
      : 1;

  // Combined opacity effect
  const transitionOpacity = Math.min(fadeOutOpacity, fadeInOpacity);

  // Calculate positions based on section index with snap animation
  const headingStackPosition = {
    bottom: currentSectionIndex < 2 ? "50%" : "32px", // Snap to final position
    left: currentSectionIndex < 2 ? "50%" : "20px", // Snap to final position
    transform: currentSectionIndex < 2 ? "translate(-50%, 50%)" : "none",
    opacity: shouldShowHeadstack ? transitionOpacity : 0,
  };

  // Style properties with proper casting for TypeScript
  const containerStyle = {
    textAlign: (currentSectionIndex < 2 ? "center" : "left") as
      | "center"
      | "left",
    width: currentSectionIndex < 2 ? "100%" : "auto",
    maxWidth: currentSectionIndex < 2 ? "none" : "500px",
  };

  // Calculate image and subtext opacity with same timing as headings
  const elementsOpacity =
    currentSectionIndex === 2
      ? progressInSection <= 0.2
        ? progressInSection * 5
        : 1
      : currentSectionIndex > 2
        ? 1
        : 0;

  return (
    <div className="overflow-hidden" ref={containerRef}>
      <BrandedNav />


      {/* User type toggle button - only show in first section or when scrolling to it */}
      {currentSectionIndex === 0 && (
        <div
          className="fixed bottom-1/3 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-500"
          style={{ opacity: 1 - progressInSection * 2 }} // Fade out as user scrolls
        >
          <button
            className="mode-toggle-button flex items-center justify-center gap-2.5 text-white px-4 py-2 rounded-md bg-black/30 backdrop-blur-sm  transition-colors"
            onClick={toggleUserType}
            aria-label={`Switch to ${userType === "author" ? "reader" : "author"} mode`}
          >
            {userType === "author" ? (
              <>
                <span>Author</span>
              </>
            ) : (
              <>
                <span>Reader</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Create a container with the full scroll height */}
      <div className="relative" ref={scrollRef}>
        {/* Fixed viewport container that shows content based on scroll */}
        <div className="fixed top-0 left-0 w-full h-screen overflow-hidden">
          {/* Remove background color since we're using wave background */}

          {/* Scroll indicator for first section */}
          {currentSectionIndex === 0 && progressInSection < 0.5 && (
            <div
              className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce z-10"
              style={{ opacity: 1 - progressInSection * 2 }}
            >
              <ChevronDown className="w-8 h-8 text-white drop-shadow-[0_2px_5px_rgba(0,0,0,1)]" />
            </div>
          )}

          {/* Heading stack container */}
          <div
            className={`absolute z-20 transition-all duration-500 ${!shouldShowHeadstack ? "pointer-events-none" : ""}`}
            style={{
              ...headingStackPosition,
              ...containerStyle,
            }}
          >
            {/* Stack all headings with current one at the bottom */}
            <div className="relative">
              {/* Previous headings - in ascending order from bottom to top */}
              {currentSectionIndex > 0 &&
                sections.slice(0, currentSectionIndex).map((section, index) => {
                  // Calculate vertical position with older ones (lower index) higher up
                  const reverseIndex = currentSectionIndex - index - 1; // Reverse the index

                  // Calculate initial vertical position
                  let stackPosition = (reverseIndex + 1) * 60; // Spacing between headings

                  // Add animation effect for the first heading when the second section is active
                  if (currentSectionIndex === 1 && index === 0) {
                    // Smoothly move heading 1 upward as user scrolls through section 2
                    stackPosition += progressInSection * 20; // Adjust travel distance (in pixels)
                  }

                  // Opacity calculation with emphasis on the newest one
                  const opacity = 0.3 + (reverseIndex + 1) * 0.15; // More opacity for newer ones

                  // Determine the text alignment and position for proper centering
                  const textAlignClass =
                    currentSectionIndex === 1 && index === 0
                      ? "text-center w-full left-0"
                      : "";

                  return (
                    <div
                      key={section.id}
                      className={`absolute transition-all duration-300 ${textAlignClass}`}
                      style={{
                        bottom: `${stackPosition}px`,
                        opacity: opacity,
                        width:
                          currentSectionIndex === 1 && index === 0
                            ? "100%"
                            : "auto",
                      }}
                    >
                      <h3 className="text-2xl md:text-3xl font-medium text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] shadow-black">
                        {section.heading}
                      </h3>
                    </div>
                  );
                })}

              {/* Current section heading - at the bottom */}
              <div className="relative transition-all duration-300">
                <h2 className="text-2xl md:text-3xl font-bold text-white drop-shadow-[0_2px_5px_rgba(0,0,0,1)]">
                  {sections[currentSectionIndex]?.heading}
                </h2>
              </div>
            </div>
          </div>

          {/* Descriptive text - appear for section 2+ */}
          {currentSectionIndex >= 2 && (
            <div
              className={`absolute bottom-32 max-w-md z-10 transition-all duration-500 ${
                currentSectionIndex >= sections.length - 2
                  ? "left-1/2 -translate-x-1/2 text-center" // Center text for last two panels
                  : "right-20 text-right" // Keep right alignment for other panels
              }`}
              style={{
                opacity: elementsOpacity,
                transform:
                  currentSectionIndex === 2 && progressInSection <= 0.2
                    ? `translateX(${50 - progressInSection * 5 * 50}px)`
                    : "none",
              }}
            >
              <p className="text-lg md:text-xl text-white/90 drop-shadow-[0_1px_3px_rgba(0,0,0,1)] bg-black/20 backdrop-blur-sm p-4 rounded-lg">
                {sections[currentSectionIndex]?.subtext}
              </p>
            </div>
          )}

          {/* Content for sections - conditional rendering based on section index */}
          {currentSectionIndex >= 2 && (
            <>
              {/* Show dashboard for section 4 */}
              {currentSectionIndex === 3 ? (
                <div
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-4xl z-5"
                  style={{
                    opacity: elementsOpacity,
                    transform: `translate(-50%, -50%) scale(${0.9 + progressInSection * 0.1})`,
                  }}
                >
                  <BookMetricsDashboard />
                </div>
              ) : (
                /* Show regular image for other sections */
                <div
                  className={`absolute top-1/4 transform -translate-y-1/2 w-1/3 max-w-md z-5 ${
                    currentSectionIndex >= sections.length - 2 
                      ? "left-1/2 -translate-x-1/2" // Center the image in the last two panels
                      : "right-20" // Keep right positioning for other panels
                  }`}
                  style={{
                    opacity: elementsOpacity,
                    transform: `translateY(-50%) scale(${0.9 + progressInSection * 0.1})`,
                  }}
                >
                  <img
                    src={sections[currentSectionIndex]?.imageSrc}
                    alt={`Illustration for ${sections[currentSectionIndex]?.heading}`}
                    className="w-full h-auto"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <FloatingSignup />
    </div>
  );
}

export default ScrollLandingPage;
