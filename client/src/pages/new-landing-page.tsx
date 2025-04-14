import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ArrowRight, CheckCircle, BarChart2, TrendingUp, Layers, Filter } from "lucide-react";
import { GenreSelector } from "@/components/genre-selector";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from "recharts";

// Logo component
const SirenedLogo = () => (
  <div className="flex items-center">
    <div className="w-8 h-8 mr-2 rounded-md flex items-center justify-center bg-primary">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 4L15 10H9L12 4Z" fill="white" />
        <path d="M9 10L6 16H18L15 10H9Z" fill="white" />
        <path d="M6 16L9 22H15L18 16H6Z" fill="white" />
      </svg>
    </div>
    <span className="text-xl font-bold text-foreground">Sirened</span>
  </div>
);

// Feature Box Component
interface FeatureBoxProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FeatureBox = ({ title, description, icon }: FeatureBoxProps) => (
  <div className="bg-white/5 backdrop-blur-sm p-6 rounded-lg border border-primary/20 hover:border-primary/40 transition-all duration-300 h-full">
    <div className="text-primary mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);

// Testimonial Component
interface TestimonialProps {
  quote: string;
  author: string;
  role: string;
}

const Testimonial = ({ quote, author, role }: TestimonialProps) => (
  <div className="bg-white/5 backdrop-blur-sm p-6 rounded-lg border border-primary/20">
    <p className="italic mb-4 text-muted-foreground">{quote}</p>
    <div className="font-medium">{author}</div>
    <div className="text-sm text-muted-foreground">{role}</div>
  </div>
);

// Value Proposition Component
interface ValuePropProps {
  title: string;
  description: string;
  forAuthors: string;
  forReaders: string;
}

const ValueProposition = ({ title, description, forAuthors, forReaders }: ValuePropProps) => (
  <div className="mb-12">
    <h3 className="text-2xl font-bold mb-4 text-primary">{title}</h3>
    <p className="text-muted-foreground mb-6">{description}</p>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white/5 backdrop-blur-sm p-6 rounded-lg border border-primary/20">
        <h4 className="text-lg font-semibold mb-2 flex items-center">
          <span className="mr-2 text-primary"><CheckCircle size={18} /></span>
          For Authors
        </h4>
        <p className="text-muted-foreground">{forAuthors}</p>
      </div>
      <div className="bg-white/5 backdrop-blur-sm p-6 rounded-lg border border-primary/20">
        <h4 className="text-lg font-semibold mb-2 flex items-center">
          <span className="mr-2 text-primary"><CheckCircle size={18} /></span>
          For Readers
        </h4>
        <p className="text-muted-foreground">{forReaders}</p>
      </div>
    </div>
  </div>
);

// Main component
// No need for sample taxonomy data as we're using the GenreSelector component

// Sample data for analytics chart
const analyticsData = [
  { name: 'Jan', impressions: 4000, referrals: 2400 },
  { name: 'Feb', impressions: 3000, referrals: 1398 },
  { name: 'Mar', impressions: 2000, referrals: 9800 },
  { name: 'Apr', impressions: 2780, referrals: 3908 },
  { name: 'May', impressions: 1890, referrals: 4800 },
  { name: 'Jun', impressions: 2390, referrals: 3800 },
  { name: 'Jul', impressions: 3490, referrals: 4300 },
];

const NewLandingPage = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { setTheme } = useTheme();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [selectedGenres, setSelectedGenres] = useState<any[]>([]);

  // Set theme
  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  // Handle email sign up
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email to sign up for updates.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/signup-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, isAuthor: false }),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Thank you for signing up. We'll keep you updated!",
        });
        setEmail("");
      } else {
        throw new Error("Failed to sign up");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign up. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Track session for analytics
  useState(() => {
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
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-muted">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <SirenedLogo />
          <div className="flex items-center gap-4">
            <Button variant="link" onClick={() => setLocation("/auth")}>
              Log In
            </Button>
            <Button onClick={() => setLocation("/auth")}>
              Sign Up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 -z-10"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-primary/10 blur-3xl -z-10"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full bg-primary/5 blur-3xl -z-10"></div>
        
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-foreground">
              Brand Strategy Platform for Authors and Readers Alike
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-muted-foreground">
              We're for both Authors & Readers
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="px-8" onClick={() => setLocation("/auth")}>
                Sign up now!
              </Button>
              <Button size="lg" variant="outline" className="px-8">
                Learn more
              </Button>
            </div>
            <form onSubmit={handleSignup} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-grow"
              />
              <Button type="submit">Get Started</Button>
            </form>
          </div>
        </div>
        
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-8 h-8 text-primary" />
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-10 bg-black/40 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">100%</div>
              <div className="text-muted-foreground">Author profit retention</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">0%</div>
              <div className="text-muted-foreground">Hidden fees or commissions</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Access to analytics</div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Our Values</h2>
          
          <ValueProposition 
            title="Freedom"
            description="Literary independence is at the core of everything we build."
            forAuthors="Sirened offers the tools and data to build a loyal readership and market books directly—without relying on third parties."
            forReaders="It's a discovery hub for fresh, bold, independent voices. No gatekeepers."
          />
          
          <ValueProposition 
            title="Independence"
            description="Take control of your literary journey."
            forAuthors="Own your brand, your audience, your data, and your future. Sirened helps you grow your empire."
            forReaders="Connect directly with authors. Support them without middlemen. Choose what matters to you."
          />
          
          <ValueProposition 
            title="Creativity"
            description="Express yourself without limits."
            forAuthors="Sirened supports unique genres, experimental formats, multilingual content, and the weird and wonderful."
            forReaders="Find stories you won't get anywhere else. Unpolished gems, unheard voices, and daring perspectives."
          />
          
          <ValueProposition 
            title="Quality"
            description="Excellence in everything we offer."
            forAuthors="Access pro-level tools, analytics, and design that help your content shine — without selling your soul."
            forReaders="Every author on Sirened is building something meaningful. Curation happens through craft, not clout."
          />
          
          <ValueProposition 
            title="Boldness"
            description="Stand out and make your mark."
            forAuthors="Be unapologetically you. Say what needs to be said. Sirened exists to amplify fearless, forward-thinking creators."
            forReaders="Dive into stories that take risks — emotionally, culturally, and creatively. Books that challenge, not just entertain."
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-black/20 to-transparent">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Transparent Tools. Real Results.</h2>
            <p className="text-xl text-muted-foreground">Empowering Creative Freedom and Discovery</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureBox 
              title="Author Tools"
              description="Everything you need to grow a loyal audience and promote your books directly."
              icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>}
            />
            
            <FeatureBox 
              title="Reader Discovery"
              description="Discover bold, original voices—just pure storytelling on your preference."
              icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-6.05-6.05a8.5 8.5 0 1 0-5.9 2.47 8.5 8.5 0 0 0 5.24-1.79l6.35 6.37z"/></svg>}
            />
            
            <FeatureBox 
              title="Real-time Analytics"
              description="Get real-time data on reader behavior, ad performance, and content engagement."
              icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>}
            />
            
            <FeatureBox 
              title="Clear Value"
              description="Know why a book is recommended, where it came from, and how to connect with the author."
              icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>}
            />
            
            <FeatureBox 
              title="Direct Connection"
              description="Connect directly with your readers or favorite authors without middlemen."
              icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 6.1H3"/><path d="M21 12.1H3"/><path d="M15.1 18H3"/></svg>}
            />
            
            <FeatureBox 
              title="Fair Marketplace"
              description="A platform where quality matters more than marketing budgets."
              icon={<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 18V6"/></svg>}
            />
          </div>
        </div>
      </section>

      {/* Taxonomy Selector Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-background to-black/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Your tastes are unique, <span className="text-primary">so tailor your experience</span>
              </h2>
              <p className="text-xl mb-8 text-muted-foreground">
                Customize your searches based on content, not on clicks. Our taxonomy system lets you find exactly what you're looking for.
              </p>
              
           
            </div>
            
            <div className="bg-black/30 backdrop-blur-md p-6 rounded-lg border border-primary/20">
              <h3 className="text-xl font-bold mb-4">Find Your Perfect Match</h3>
              {/* Use the actual GenreSelector component */}
              <GenreSelector 
                mode="taxonomy"
                selected={selectedGenres}
                onSelectionChange={setSelectedGenres}
                restrictLimits={false}
                label=""
                helperText="Select genres, themes, and tropes that interest you"
                className="pb-6"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Analytics Chart Section */}
      <section className="py-20 md:py-32 bg-black/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-black/30 backdrop-blur-md p-6 rounded-lg border border-primary/20">
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart
                    data={analyticsData}
                    margin={{
                      top: 20,
                      right: 20,
                      left: 0,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(0,0,0,0.8)', 
                        borderColor: 'rgba(160,108,213,0.5)',
                        color: 'white' 
                      }} 
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="impressions"
                      stackId="1"
                      stroke="rgba(160,108,213,1)"
                      fill="rgba(160,108,213,0.5)"
                    />
                    <Area
                      type="monotone"
                      dataKey="referrals"
                      stackId="1"
                      stroke="rgba(100,61,167,1)"
                      fill="rgba(100,61,167,0.5)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="bg-black/20 p-3 rounded">
                    <div className="text-sm text-muted-foreground">Total Impressions</div>
                    <div className="text-2xl font-bold">19,550</div>
                  </div>
                  <div className="bg-black/20 p-3 rounded">
                    <div className="text-sm text-muted-foreground">Total Referrals</div>
                    <div className="text-2xl font-bold">26,606</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Level the playing field.
              </h2>
              <p className="text-xl mb-8 text-muted-foreground">
                Use advanced analytics to rival industry giants. Track reader engagement, monitor performance trends, and optimize your marketing strategy.
              </p>
              
              <div className="bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="text-primary" />
                  <h3 className="text-xl font-semibold">Real-time Insights</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Monitor reader behavior, track marketing campaign performance, and gain valuable insights about your audience. Make data-driven decisions to grow your readership.
                </p>
                <div className="flex items-center gap-2 text-primary">
                  <TrendingUp size={16} />
                  <span className="text-sm">+22.7% increase in referrals month-over-month</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-background/90 -z-10"></div>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Reclaim your literary future</h2>
            <p className="text-xl mb-8">
              You'll have every tool to make your stories a success.
            </p>
            <Button size="lg" className="px-8" onClick={() => setLocation("/auth")}>
              Sign up now!
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">What Our Community Says</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Testimonial 
              quote="Sirened gave me the tools I needed to reach readers directly. My sales have increased 30% since I joined."
              author="Emma R."
              role="Fantasy Author"
            />
            <Testimonial 
              quote="I've discovered so many amazing indie authors that I would have never found on traditional platforms."
              author="Michael T."
              role="Avid Reader"
            />
            <Testimonial 
              quote="The analytics alone are worth it. I finally understand what resonates with my audience."
              author="Sarah J."
              role="Science Fiction Author"
            />
          </div>
        </div>
      </section>

      {/* Brand Positioning */}
      <section className="py-20 md:py-32 bg-black/20 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">Our Brand Positioning</h2>
          
          <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
            <div>
              <h3 className="text-2xl font-bold mb-4 text-primary">Selling Proposition</h3>
              <p className="text-muted-foreground">
                Sirened empowers authors by providing the tools they need to not only manage and promote their books but also access detailed analytics and directly connect with their readers. For readers, Sirened is a platform that makes it easy to discover new books and connect with authors they love.
              </p>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold mb-4 text-primary">Brand Promise</h3>
              <p className="text-muted-foreground">
                To provide a holistic, author-friendly platform that fosters meaningful connections with readers, allowing authors to succeed in the digital age and readers to find and support new talent.
              </p>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold mb-4 text-primary">Brand Voice</h3>
              <p className="text-muted-foreground">
                Warm, welcoming, supportive, and community-oriented. Sirened's tone conveys empowerment for authors and readers alike, offering a space where both can thrive together.
              </p>
            </div>
            
            <div>
              <h3 className="text-2xl font-bold mb-4 text-primary">Support your Storytellers</h3>
              <p className="text-muted-foreground">
                Join Sirened's elite readership today and directly support the authors who create the stories you love.
              </p>
              <Button className="mt-4" onClick={() => setLocation("/auth")}>
                Sign up now! <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/40 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <SirenedLogo />
              <p className="mt-4 text-muted-foreground">
                A platform for authors and readers alike, creating a fair marketplace for literary works.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">For Authors</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Analytics</a></li>
                <li><a href="#" className="hover:text-primary">Marketing Tools</a></li>
                <li><a href="#" className="hover:text-primary">Direct Sales</a></li>
                <li><a href="#" className="hover:text-primary">Author Dashboard</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">For Readers</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Discover Books</a></li>
                <li><a href="#" className="hover:text-primary">Connect with Authors</a></li>
                <li><a href="#" className="hover:text-primary">Reading Lists</a></li>
                <li><a href="#" className="hover:text-primary">Book Recommendations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary">About Us</a></li>
                <li><a href="#" className="hover:text-primary">Contact</a></li>
                <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-muted mt-12 pt-6 text-center text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Sirened. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewLandingPage;