import { useState, useEffect } from "react";
import { BrandedNav } from "@/components/branded-nav";

const features = [
  {
    title: "Your Story Begins Here",
    description: "Every great author started with a dream. A story burning to be told. Your journey to becoming a published author starts now.",
  },
  {
    title: "Craft Your Masterpiece",
    description: "Our platform provides the tools and community you need to transform your ideas into polished manuscripts ready for the world.",
  },
  {
    title: "Connect With Your Audience",
    description: "Build a loyal readership, engage with your fans, and create a community around your stories.",
  },
  {
    title: "Grow Your Author Brand",
    description: "Track your performance, understand your readers, and make data-driven decisions to expand your reach.",
  },
  {
    title: "Shape Literary Futures",
    description: "Join a new generation of authors who are redefining storytelling in the digital age.",
  },
];

export default function HowItWorks() {
  const [sessionId] = useState(() => {
    // Try to reuse existing session ID from landing page
    const existingId = localStorage.getItem('landing_session_id');
    if (existingId) return existingId;

    // Create new session ID if none exists
    const newId = crypto.randomUUID();
    localStorage.setItem('landing_session_id', newId);
    return newId;
  });

  useEffect(() => {
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

    // Initialize or update session
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
              className="flex flex-col md:flex-row items-center gap-8 md:gap-12"
            >
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl md:text-3xl font-bold mb-4">
                  {feature.title}
                </h2>
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