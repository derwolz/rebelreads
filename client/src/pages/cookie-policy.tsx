import { useState, useEffect } from "react";
import iconWhite from "@/public/images/iconwhite.svg";
import icon from "@/public/images/icon.svg";
import { ChevronUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export default function CookiePolicy() {
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
    // Track that user visited cookie policy page
    const trackEvent = async () => {
      try {
        await fetch("/api/landing/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            type: "cookie_policy_view",
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
    { id: "what-are-cookies", label: "What Are Cookies" },
    { id: "how-we-use-cookies", label: "How We Use Cookies" },
    { id: "types-of-cookies", label: "Types of Cookies" },
    { id: "third-party-cookies", label: "Third-Party Cookies" },
    { id: "managing-cookies", label: "Managing Cookies" },
    { id: "updates", label: "Policy Updates" },
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
                window.location.href = '/';
              }}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-24 relative">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-16">
          Sirened Cookie Policy
        </h1>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main content */}
          <div className="lg:w-2/3">
            <section id="introduction" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Introduction</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Welcome to Sirened's Cookie Policy. This policy explains how we use cookies and similar technologies 
                to enhance your experience on our book discovery platform. Our cookies help us track user actions, 
                store data inputs, and provide a personalized browsing experience. By using Sirened, you consent to our 
                use of cookies in accordance with this policy.
              </p>
            </section>

            <section id="what-are-cookies" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">What Are Cookies</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Cookies are small text files that are placed on your device when you visit a website. They are widely 
                used to make websites work more efficiently and provide valuable information to website owners. Cookies 
                allow a website to recognize your device, remember your preferences, and understand how you interact with 
                the site. Sirened uses cookies to improve our services and enhance your user experience.
              </p>
            </section>

            <section id="how-we-use-cookies" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">How We Use Cookies</h2>
              <p className="text-lg text-muted-foreground mb-4">
                At Sirened, we use cookies for the following purposes:
              </p>
              <ul className="list-disc pl-8 text-lg text-muted-foreground space-y-2 mb-4">
                <li><strong>User Activity Tracking</strong>: We track how you interact with our platform, including the 
                  pages you visit, books you explore, and features you use. This helps us understand user behavior and 
                  improve our service.</li>
                <li><strong>Session Management</strong>: Cookies help maintain your session, remember your login status, 
                  and ensure a seamless browsing experience.</li>
                <li><strong>Preference Storage</strong>: We store your preferences, such as language settings, theme 
                  choices, and other customization options.</li>
                <li><strong>Performance Monitoring</strong>: Cookies help us monitor and analyze the performance of our 
                  website, identifying areas for improvement.</li>
                <li><strong>Feature Functionality</strong>: Some features of our platform require cookies to function 
                  properly, including interactive elements and navigation tools.</li>
              </ul>
            </section>

            <section id="types-of-cookies" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Types of Cookies We Use</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Sirened uses various types of cookies:
              </p>
              <ul className="list-disc pl-8 text-lg text-muted-foreground space-y-2 mb-4">
                <li><strong>Essential Cookies</strong>: These cookies are necessary for the fundamental functions of our 
                  website. Without these cookies, the site would not operate correctly. They enable core functionality 
                  such as security, network management, and account access.</li>
                <li><strong>Functional Cookies</strong>: These cookies enhance the functionality of our website by storing 
                  your preferences. They remember choices you make, such as your language preference or text size, to 
                  provide a more personalized experience.</li>
                <li><strong>Performance Cookies</strong>: These cookies collect information about how you interact with 
                  our website, helping us improve its functionality. They help us understand which pages are most 
                  frequently visited and how users move around the site.</li>
                <li><strong>Targeting/Advertising Cookies</strong>: These cookies collect information about your browsing 
                  habits to make advertising more relevant to you and your interests. They help us better understand the 
                  effectiveness of our marketing campaigns.</li>
              </ul>
            </section>

            <section id="third-party-cookies" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Third-Party Cookies</h2>
              <p className="text-lg text-muted-foreground mb-4">
                In addition to our own cookies, Sirened may also use various third-party cookies to report usage 
                statistics and deliver advertisements on and through the Service. These are cookies from other domains 
                that we partner with for certain functions of our website. Third-party cookies may include:
              </p>
              <ul className="list-disc pl-8 text-lg text-muted-foreground space-y-2 mb-4">
                <li><strong>Analytics Providers</strong>: These help us understand how users interact with our website, 
                  providing insights into areas for improvement.</li>
                <li><strong>Marketing Services</strong>: These services use cookies to help us deliver more relevant 
                  advertising and marketing communications.</li>
                <li><strong>Social Media Platforms</strong>: If you use social media features on our site, these 
                  platforms may set cookies that track your activity.</li>
              </ul>
              <p className="text-lg text-muted-foreground mb-4">
                We have limited control over these third-party cookies. We recommend checking the privacy policies of 
                these third parties to understand how they use your data.
              </p>
            </section>

            <section id="managing-cookies" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Managing Cookies</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Most web browsers allow you to manage your cookie preferences. You can set your browser to refuse cookies 
                or delete certain cookies. Generally, you can also manage similar technologies in the same way that you 
                manage cookies – using your browser's preferences.
              </p>
              <p className="text-lg text-muted-foreground mb-4">
                The following links show how to adjust the cookie settings on commonly used browsers:
              </p>
              <ul className="list-disc pl-8 text-lg text-muted-foreground space-y-2 mb-4">
                <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Chrome</a></li>
                <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Mozilla Firefox</a></li>
                <li><a href="https://support.apple.com/guide/safari/manage-cookies-and-website-data-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Safari</a></li>
                <li><a href="https://support.microsoft.com/en-us/help/4027947/microsoft-edge-delete-cookies" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Microsoft Edge</a></li>
              </ul>
              <p className="text-lg text-muted-foreground mb-4">
                Please note that restricting cookies may impact the functionality of our website. Disabling certain cookies 
                may limit your ability to use some features of the Sirened platform.
              </p>
            </section>

            <section id="updates" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Policy Updates</h2>
              <p className="text-lg text-muted-foreground mb-4">
                We may update our Cookie Policy from time to time. Any changes will be posted on this page with an updated 
                effective date. We encourage you to periodically review this page to stay informed about our cookie practices.
              </p>
            </section>

            <section id="contact" className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Contact Us</h2>
              <p className="text-lg text-muted-foreground mb-4">
                If you have questions about this Cookie Policy or our data practices, please contact us at:
              </p>
              <p className="text-lg font-medium mb-8">privacy@sirened.com</p>
              
              <p className="text-base text-muted-foreground mt-8">
                <strong>Effective Date:</strong> April 19, 2025
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
              <h3 className="text-xl font-bold mb-4">TL;DR: How We Use Cookies</h3>
              <ul className="space-y-3 mb-6">
                <li className="flex gap-2">
                  <div className="flex-none">•</div>
                  <div><strong>We use cookies to track</strong> how you interact with our platform</div>
                </li>
                <li className="flex gap-2">
                  <div className="flex-none">•</div>
                  <div><strong>Cookies help us remember</strong> your preferences and login status</div>
                </li>
                <li className="flex gap-2">
                  <div className="flex-none">•</div>
                  <div><strong>We use different types</strong> of cookies for various functions</div>
                </li>
                <li className="flex gap-2">
                  <div className="flex-none">•</div>
                  <div><strong>You can manage cookies</strong> through your browser settings</div>
                </li>
                <li className="flex gap-2">
                  <div className="flex-none">•</div>
                  <div><strong>Disabling cookies</strong> may limit some features of our platform</div>
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