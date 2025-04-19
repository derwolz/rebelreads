import { useState, useEffect } from "react";
import iconWhite from "@/public/images/iconwhite.svg";
import icon from "@/public/images/icon.svg";
import { ChevronUpIcon, Mail, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function ContactUs() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { theme } = useTheme();
  const { toast } = useToast();
  
  // Form input handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Missing information",
        description: "Please fill out all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // In a real implementation, this would send the contact form data to an API endpoint
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message sent!",
        description: "We've received your message and will get back to you soon.",
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Message failed to send",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Scroll to top handler
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    // Track that user visited contact us page
    const trackEvent = async () => {
      try {
        await fetch("/api/landing/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            type: "contact_us_view",
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
                <a href="/about-us" className="hover:text-primary-foreground/80">About Us</a>
              </li>
              <li>
                <a href="/contact-us" className="font-bold">Contact</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            Have a question, suggestion, or just want to say hello? We'd love to hear from you! Fill out the form below or reach out to us directly using the contact information provided.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-3">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Email</h3>
                <p className="text-muted-foreground mb-2">For general inquiries:</p>
                <a href="mailto:support@sirened.com" className="text-primary hover:underline">
                  support@sirened.com
                </a>
              </div>
            </div>
            
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-3">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Phone</h3>
                <p className="text-muted-foreground mb-2">Customer support hours:</p>
                <p className="text-sm text-muted-foreground mb-1">Monday-Friday: 9am-5pm EST</p>
                <a href="tel:+1234567890" className="text-primary hover:underline">
                  +1 (555) 123-4567
                </a>
              </div>
            </div>
            
            <div className="rounded-lg border bg-card p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-primary/10 p-3">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Location</h3>
                <p className="text-muted-foreground mb-2">Our headquarters:</p>
                <address className="text-sm text-muted-foreground not-italic">
                  123 Book Avenue<br />
                  Suite 456<br />
                  New York, NY 10001
                </address>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border bg-card p-8 shadow-sm mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Send Us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address <span className="text-destructive">*</span></Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john.doe@example.com"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="What is your message about?"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
                <Textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="How can we help you?"
                  rows={6}
                  required
                />
              </div>
              
              <Button type="submit" className="w-full md:w-auto" disabled={isSubmitting}>
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
          
          <div className="rounded-lg border bg-card p-8 shadow-sm">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">For Business Inquiries</h2>
            
            <p className="text-muted-foreground mb-4">
              If you're interested in partnering with Sirened, or have a business opportunity to discuss, please contact our business development team at:
            </p>
            
            <a href="mailto:partners@sirened.com" className="text-primary hover:underline">
              partners@sirened.com
            </a>
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
      
      <footer className="bg-muted/30 border-t py-8 mt-12">
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