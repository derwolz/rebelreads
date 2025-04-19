import { useState, useEffect } from "react";
import iconWhite from "@/public/images/iconwhite.svg";
import icon from "@/public/images/icon.svg";
import { ChevronUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export default function PrivacyPolicy() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { theme } = useTheme();
  // Scroll to section handler
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80; // Account for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
      setActiveSection(id);
    }
  };

  // Scroll to top handler
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    // Track that user visited privacy policy page
    const trackEvent = async () => {
      try {
        await fetch("/api/landing/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            type: "privacy_policy_view",
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

  // Floating quick nav sections
  const sections = [
    { id: "introduction", label: "Introduction" },
    { id: "how-sirened-works", label: "How It Works" },
    { id: "business-model", label: "Business Model" },
    { id: "required-sharing", label: "Data Sharing" },
    { id: "information-collected", label: "Info We Collect" },
    { id: "information-usage", label: "How We Use Data" },
    { id: "legal", label: "Legal" },
    { id: "contact", label: "Contact Us" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-muted">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <img
            src={theme === "light" ? icon : iconWhite}
            alt="Sirened Logo"
            className="h-14 w-14"
          />
          <div className="flex items-center gap-4">
            <Button 
              className="bg-[#EFA738] hover:bg-[#EFA738]/90 text-[#102b3F] font-bold" 
              onClick={() => {
                setEmail("");
                setIsTypeDialogOpen(true);
              }}
            >
              Get Beta Access
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-24 relative">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-16">
          Sirened Privacy Policy
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="lg:w-2/3">
            <section id="introduction" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Introduction</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Welcome to Sirened, a book discovery platform that connects readers and authors through shared interests. 
                This Privacy Policy explains our unique approach to facilitating these connections. Sirened is free for 
                readers to use because authors fund the platform through their marketing investments.
              </p>
            </section>

            <section id="how-sirened-works" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">How Sirened Works</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Sirened serves as a discovery bridge between readers and authors through a simple process:
              </p>
              <ol className="list-decimal pl-8 text-lg text-muted-foreground space-y-2 mb-4">
                <li>You browse recommendations on our homepage</li>
                <li>You explore books that catch your interest</li>
                <li>You view book detail pages created by authors</li>
                <li>If interested, you click through to the author's external sales page</li>
              </ol>
              <p className="text-lg text-muted-foreground mb-4">
                At no point do you make purchases on Sirened itself. We simply facilitate discovery and connections, 
                with transactions happening on the author's own platforms.
              </p>
            </section>

            <section id="business-model" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Our Data-Driven Business Model</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Authors pay Sirened to connect with readers who have expressed interest in their type of work. 
                This author funding is what allows us to offer the platform completely free to readers. 
                In exchange for free access, readers share their anonymized interest data, which helps authors 
                better understand their audience.
              </p>
            </section>

            <section id="required-sharing" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Required Data Sharing</h2>
              <p className="text-lg text-muted-foreground mb-4 font-semibold">
                Important: By using Sirened, you consent to the sharing of your de-identified interest data with 
                authors and publishers. If you do not wish to have your anonymized interest data shared, you will 
                not be able to use Sirened's services.
              </p>
            </section>

            <section id="information-collected" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Information We Collect</h2>
              <p className="text-lg text-muted-foreground mb-4">
                When you use Sirened, we collect:
              </p>
              <ul className="list-disc pl-8 text-lg text-muted-foreground space-y-2 mb-4">
                <li><strong>Account information</strong>: Basic details like email address and username when you register</li>
                <li><strong>Reading preferences</strong>: Information about the genres, topics, and types of books you're interested in</li>
                <li><strong>Browsing behavior</strong>: How you interact with different book listings, which books you view, and what content catches your attention</li>
                <li><strong>Click-through activity</strong>: When you click to visit an author's external sales page</li>
              </ul>
              <p className="text-lg text-muted-foreground mb-4">
                What we DON'T collect:
              </p>
              <ul className="list-disc pl-8 text-lg text-muted-foreground space-y-2">
                <li>Purchase information (since purchases happen off our platform)</li>
                <li>IP addresses</li>
                <li>Precise geographic location</li>
                <li>Demographic information unless voluntarily provided</li>
              </ul>
            </section>

            <section id="information-usage" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">How We Use and Share Your Information</h2>
              <p className="text-lg text-muted-foreground mb-4">
                We use and share (in de-identified form) the information we collect to:
              </p>
              <ul className="list-disc pl-8 text-lg text-muted-foreground space-y-2 mb-6">
                <li>Build our interest taxonomy system that helps match readers with relevant authors</li>
                <li>Create segmented newsletters based on reading interests</li>
                <li>Allow authors to target their marketing to readers who are most likely to enjoy their work</li>
                <li>Improve the organization and discoverability of books on our platform</li>
                <li>Track the effectiveness of different book listings and presentations</li>
              </ul>

              <h3 className="text-xl font-bold mb-3">What We Share:</h3>
              <ul className="list-disc pl-8 text-lg text-muted-foreground space-y-2 mb-6">
                <li><strong>De-identified interest data</strong>: Anonymous information about reading preferences and browsing patterns</li>
                <li><strong>Aggregated statistics</strong>: Overall trends about what types of books are popular with different interest groups</li>
                <li><strong>Engagement metrics</strong>: Non-personalized data about how users interact with different book listings</li>
              </ul>

              <h3 className="text-xl font-bold mb-3">What We DON'T Share:</h3>
              <ul className="list-disc pl-8 text-lg text-muted-foreground space-y-2">
                <li>Email addresses</li>
                <li>Usernames</li>
                <li>Account credentials</li>
                <li>Individual browsing histories tied to identifiable users</li>
                <li>Personal contact information</li>
              </ul>
            </section>

            <section id="legal" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Legal Information</h2>
              
              <h3 className="text-xl font-bold mb-3">Legal Jurisdiction</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Sirened is headquartered in Wyoming, USA, with servers located in the Philippines. By using Sirened, 
                you agree that any disputes regarding this privacy policy will be governed by the laws of Wyoming, USA.
              </p>
              
              <h3 className="text-xl font-bold mb-3">Data Sharing Requirement</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Our business model is built on the sharing of de-identified interest data. To use Sirened, you must 
                consent to this data sharing. If you do not agree to these terms, you will not be able to use our services.
              </p>
              
              <h3 className="text-xl font-bold mb-3">Data Security</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Sirened implements reasonable security measures to protect the data we collect. While no method is 100% 
                secure, we strive to use appropriate measures to protect your information.
              </p>
              
              <h3 className="text-xl font-bold mb-3">Changes to This Policy</h3>
              <p className="text-lg text-muted-foreground mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any significant changes by 
                posting the new policy on this page.
              </p>
            </section>

            <section id="contact" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Contact Us</h2>
              <p className="text-lg text-muted-foreground mb-4">
                If you have questions about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="text-lg font-medium mb-8">privacy@sirened.com</p>
              
              <p className="text-base text-muted-foreground mt-8">
                <strong>Effective Date:</strong> April 15, 2025
              </p>
            </section>

            <Button
              onClick={scrollToTop}
              className="fixed bottom-4 right-4 rounded-full p-3 h-10 w-10"
              variant="outline"
              size="icon"
              aria-label="Scroll to top"
            >
              <ChevronUpIcon className="h-5 w-5" />
            </Button>
          </div>

          {/* TL;DR/Quick nav sidebar */}
          <div className="lg:w-1/3">
            <div className="sticky top-24 p-6 bg-muted rounded-lg border">
              <h3 className="text-xl font-bold mb-4">TL;DR: How Sirened Works</h3>
              <ul className="space-y-3 mb-6">
                <li className="flex gap-2">
                  <div className="flex-none">•</div>
                  <div><strong>Sirened is a discovery platform</strong> - we connect you with authors, not sell you books directly</div>
                </li>
                <li className="flex gap-2">
                  <div className="flex-none">•</div>
                  <div><strong>You pay nothing</strong> to use our platform - authors fund the service</div>
                </li>
                <li className="flex gap-2">
                  <div className="flex-none">•</div>
                  <div><strong>We share your reading interests</strong> (never your personal info) with authors</div>
                </li>
                <li className="flex gap-2">
                  <div className="flex-none">•</div>
                  <div><strong>This helps authors</strong> create better marketing and connect with ideal readers</div>
                </li>
                <li className="flex gap-2">
                  <div className="flex-none">•</div>
                  <div><strong>If you don't want to share data,</strong> Sirened isn't the right platform for you</div>
                </li>
              </ul>

              <div className="border-t pt-4 mt-4">
                <h4 className="font-medium mb-3">Quick Navigation</h4>
                <nav className="space-y-2">
                  {sections.map(section => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`block text-left w-full px-3 py-2 rounded-lg hover:bg-background transition-colors ${
                        activeSection === section.id ? "bg-background font-medium" : "text-muted-foreground"
                      }`}
                    >
                      {section.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-muted/30 border-t py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Sirened Publishing. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}