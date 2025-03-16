import { useState, useEffect } from "react";
import { BrandedNav } from "@/components/branded-nav";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

interface Feature {
  title: string;
  description: string;
  showArrow?: boolean;
}

const readerFeatures: Feature[] = [
  {
    title: "You are the Hero",
    description: "Step into a world of endless possibilities. Your next favorite book is waiting to be discovered.",
    showArrow: true,
  },
  {
    title: "Spellbound by a False Tune",
    description: "You crave adventure, but industry giants only offer a bargain bin. The storytellers you love, suffer in obscurity.",
    showArrow: false,
  },
  {
    title: "A Song Breaks the Charm",
    description: "Discover a realm where your storytellers thrive, a place where quality trumps quantity. Sirened cuts through the chaos",
    showArrow: true,
  },
  {
    title: "Step into the indie square",
    description: "Enter Sirened's marketplace. Find stories worth their weight, sent straight from the creators' doors.",
    showArrow: true,
  },
  {
    title: "Support your storytellers",
    description: "Join Sirened — back indie authors directly, not the giants who bind them. Sign up and rewrite the ending",
    showArrow: false,
  },
];

const authorFeatures: Feature[] = [
  {
    title: "You are the protagonist",
    description: "Every great author starts with a spark — yours ignites here.",
    showArrow: true,
  },
  {
    title: "Every hero finds troubled waters",
    description: "Industry giants drown your business in fees, drowning your dreams. But, A new shore crests the horizon.",
    showArrow: true,
  },
  {
    title: "A song pierces the chaos",
    description: "Sirened calls you to a marketplace that's yours—no fees, no paid rankings, just readers ready for your voice.",
    showArrow: false,
  },
  {
    title: "Your first step into the indie town square",
    description: "Step into Sirened's indie square. Readers reach your books and you keep 100% of every sale.",
    showArrow: true,
  },
  {
    title: "Reclaim your Literary Future",
    description: "Team up with Siren, our analytics tools and organic engine lift your books from obscurity. Sign up and shape the future of indie publishing.",
    showArrow: false,
  },
];

export default function HowItWorks() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [isAuthor, setIsAuthor] = useState(false);
  const [, navigate] = useLocation();

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

  const features = isAuthor ? authorFeatures : readerFeatures;

  return (
    <div className="min-h-screen bg-background">
      <BrandedNav />

      <main className="container mx-auto px-4 py-16">
        <div className="flex justify-center gap-8 mb-16">
          <Button
            variant={isAuthor ? "outline" : "default"}
            onClick={() => setIsAuthor(false)}
          >
            For Readers
          </Button>
          <Button
            variant={isAuthor ? "default" : "outline"}
            onClick={() => setIsAuthor(true)}
          >
            For Authors
          </Button>
        </div>

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
                <h2 className="text-2xl md:text-3xl font-bold mb-4 flex items-center justify-center md:justify-start gap-4">
                  {feature.title}
                  {feature.showArrow && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="transition-transform hover:translate-x-1"
                      onClick={() => navigate("/")}
                    >
                      <ArrowRight className="h-6 w-6" />
                    </Button>
                  )}
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