import { useState, useEffect } from "react";
import iconWhite from "@/public/images/iconwhite.svg";
import icon from "@/public/images/icon.svg";
import { ChevronUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export default function AboutUs() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const { theme } = useTheme();
  
  // Scroll to top handler
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    // Track that user visited about us page
    const trackEvent = async () => {
      try {
        await fetch("/api/landing/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            type: "about_us_view",
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
  }, [sessionId]);

  return (
    <div className="bg-background min-h-screen">
      <header className="bg-primary text-primary-foreground py-4 sticky top-0 z-10">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <a href="/" className="flex items-center gap-2">
            <img 
              src={theme === "dark" ? iconWhite : icon} 
              alt="Sirened" 
              className="h-8 w-8" 
            />
            <span className="font-bold text-xl">Sirened</span>
          </a>
          <nav>
            <ul className="flex gap-6">
              <li>
                <a href="/landing" className="hover:text-primary-foreground/80">Home</a>
              </li>
              <li>
                <a href="/about-us" className="font-bold">About Us</a>
              </li>
              <li>
                <a href="/contact-us" className="hover:text-primary-foreground/80">Contact</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Sirened</h1>
          
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Sirened was founded with a simple yet ambitious vision: to transform how readers discover and engage with books in the digital age. We're building the most sophisticated book discovery platform that seamlessly blends advanced technology with intuitive user experience.
              </p>
              <p className="text-lg text-muted-foreground mb-4">
                Our mission is to create a space where readers can track their reading journeys, discover new books that truly resonate with their unique tastes, and connect with a community of like-minded book lovers.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Our Story</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Sirened began in 2023 when a group of passionate readers, technologists, and publishing experts came together with a shared frustration: finding the perfect next book to read was harder than it should be.
              </p>
              <p className="text-lg text-muted-foreground mb-4">
                Despite the abundance of books available online, the discovery process remained driven by bestseller lists, algorithms that prioritized popularity over personal taste, and recommendation systems that barely scratched the surface of what makes a book truly resonate with an individual reader.
              </p>
              <p className="text-lg text-muted-foreground mb-4">
                We set out to build something different—a platform that understands the nuanced relationship between readers and books, that respects the personal journey of reading, and that leverages technology to enhance rather than simplify the book discovery experience.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Our Values</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-2">Reader-Centric Innovation</h3>
                  <p className="text-muted-foreground">
                    Every feature we build starts with the question: "How does this enhance the reader's experience?" We're technology-forward but reader-focused.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-2">Depth Over Breadth</h3>
                  <p className="text-muted-foreground">
                    We believe in the power of deep engagement with books. Our platform encourages thoughtful reflection and meaningful connections rather than just counting pages or titles.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-2">Inclusivity in Literature</h3>
                  <p className="text-muted-foreground">
                    We're committed to highlighting diverse voices and perspectives in literature, ensuring our recommendation systems don't reinforce existing biases in publishing.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold mb-2">Respect for Privacy</h3>
                  <p className="text-muted-foreground">
                    Reading is personal. We build with privacy by design, giving readers control over their data and how it's used.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Looking Forward</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Sirened is just beginning its journey. We're constantly evolving, learning from our community, and refining our approach to create the ultimate book discovery platform.
              </p>
              <p className="text-lg text-muted-foreground mb-4">
                We invite readers, authors, publishers, and book lovers of all kinds to join us in reimagining what's possible when technology meets the timeless joy of reading.
              </p>
            </section>
          </div>
          
          <div className="mt-12 border-t pt-6">
            <p className="text-base text-muted-foreground">
              Have questions about Sirened? <a href="/contact-us" className="text-primary hover:underline">Contact our team</a>.
            </p>
          </div>
        </div>
        
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
      
      <footer className="bg-muted/30 border-t py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Sirened Publishing. All rights reserved.
          </p>
          <div className="mt-4 flex justify-center space-x-4 text-sm">
            <a href="/privacy-policy" className="text-muted-foreground hover:text-primary">Privacy Policy</a>
            <a href="/terms-of-service" className="text-muted-foreground hover:text-primary">Terms of Service</a>
            <a href="/cookie-policy" className="text-muted-foreground hover:text-primary">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}