import { useState, useEffect } from "react";
import { BrandedNav } from "@/components/branded-nav";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";

const features = [
  {
    title: "You are the protagonist",
    description: "Every great author starts with a spark — yours ignites here.",
  },
  {
    title: "Every hero finds troubled waters",
    description: "Industry giants drown your business in fees, drowning your dreams. But, A new shore crests the horizon.",
  },
  {
    title: "A song pierces the chaos",
    description: "Sirened calls you to a marketplace that's yours—no fees, no paid rankings, just readers ready for your voice.",
  },
  {
    title: "Your first step into the indie town square",
    description: "Step into Sirened's indie square. Readers reach your books and you keep 100% of every sale.",
  },
  {
    title: "Reclaim your Literary Future",
    description: "Team up with Siren, our analytics tools and organic engine lift your books from obscurity. Sign up and shape the future of indie publishing.",
  }
];

export default function HowItWorks() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [, navigate] = useLocation();

  useEffect(() => {
    // Scroll to section if hash exists
    const hash = window.location.hash;
    if (hash) {
      const sectionIndex = parseInt(hash.replace('#section-', ''));
      const element = document.getElementById(`section-${sectionIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }

    // Track that user visited how-it-works page
    const trackEvent = async () => {
      try {
        await fetch("/api/landing/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            type: "how_it_works_click",
            data: {
              referrer: document.referrer,
            },
          }),
        });
      } catch (error) {
        console.error("Failed to track event:", error);
      }
    };

    trackEvent();

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

  const handleBackToLanding = (index: number) => {
    // Track the navigation event
    fetch("/api/landing/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        type: "back_to_landing_navigation",
        data: { fromSection: index },
      }),
    }).catch(console.error);

    // Navigate back to the landing page with the specific card index
    navigate(`/#card-${index}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <BrandedNav />

      <main className="container mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-16">
          How Sirened Works
        </h1>

        <div className="grid gap-12 md:gap-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              id={`section-${index}`}
              className="flex flex-col md:flex-row items-center gap-8 md:gap-12 scroll-mt-24"
            >
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl md:text-3xl font-bold">
                    {feature.title}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="transition-transform hover:-translate-x-1"
                    onClick={() => handleBackToLanding(index)}
                  >
                    <ChevronLeft className="h-8 w-8" />
                  </Button>
                </div>
                <p className="text-lg text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}