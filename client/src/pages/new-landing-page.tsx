import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CountUp } from "@/components/count-up";
import { AnimateOnScroll, AnimatedChart } from "@/components/scroll-animations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ArrowRight,
  CheckCircle,
  BarChart2,
  TrendingUp,
  Layers,
  Filter,
  BookOpen,
  PenTool,
} from "lucide-react";
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
  Area,
} from "recharts";

// Import logo files for different themes
import icon from "@/public/images/icon.svg";
import iconWhite from "@/public/images/iconwhite.svg";
// Logo component with theme awareness
const SirenedLogo = () => {
  const { theme } = useTheme();

  return (
    <div className="flex items-center">
      <img
        src={theme === "light" ? icon : iconWhite}
        height="64px"
        width={"64px"}
        alt="Sirened Logo"
      />
      <span className="text-xl font-bold text-foreground">Sirened</span>
    </div>
  );
};

// Feature Box Component
interface FeatureBoxProps {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const FeatureBox = ({ title, description, icon }: FeatureBoxProps) => (
  <div className="bg-white/5 backdrop-blur-sm p-6 rounded-none border border-primary/20 hover:border-primary/40 transition-all duration-300 h-full">
    <div className="text-primary mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-muted-foreground">{description}</p>
  </div>
);


// Value Proposition Component
interface ValuePropProps {
  title: string;
  description: string;
  forAuthors: string;
  forReaders: string;
}

const ValueProposition = ({
  title,
  description,
  forAuthors,
  forReaders,
}: ValuePropProps) => (
  <div className="mb-12">
    <h3 className="text-2xl font-bold mb-4 text-primary">{title}</h3>
    <p className="text-muted-foreground mb-6">{description}</p>
    <div className="grid md:grid-cols-2 gap-6">
      <div className="bg-white/5 backdrop-blur-sm p-6 rounded-none border border-primary/20">
        <h4 className="text-lg font-semibold mb-2 flex items-center">
          <span className="mr-2 text-primary">
            <CheckCircle size={18} />
          </span>
          For Authors
        </h4>
        <p className="text-muted-foreground">{forAuthors}</p>
      </div>
      <div className="bg-white/5 backdrop-blur-sm p-6 rounded-none border border-primary/20">
        <h4 className="text-lg font-semibold mb-2 flex items-center">
          <span className="mr-2 text-primary">
            <CheckCircle size={18} />
          </span>
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
  { name: "Jan", impressions: 1200, referrals: 420 },
  { name: "Feb", impressions: 1600, referrals: 398 },
  { name: "Mar", impressions: 2100, referrals: 541 },
  { name: "Apr", impressions: 2780, referrals: 708 },
  { name: "May", impressions: 1890, referrals: 527 },
  { name: "Jun", impressions: 2390, referrals: 812 },
  { name: "Jul", impressions: 3490, referrals: 430 },
];

const NewLandingPage = () => {
  const [email, setEmail] = useState("");
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const { setTheme } = useTheme();
  const { user, logoutMutation } = useAuth();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [selectedGenres, setSelectedGenres] = useState<any[]>([]);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isPublisher, setIsPublisher] = useState(false);

  // Check for nobeta query parameter and log out the user if present
  useEffect(() => {
    // Check if the URL has nobeta=true parameter and user is logged in
    const searchParams = new URLSearchParams(window.location.search);
    const noBeta = searchParams.get('nobeta');
    
    if (noBeta === 'true' && user) {
      // User doesn't have beta access but is logged in - log them out
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

  // Set theme
  useEffect(() => {
    setTheme("dark");
  }, [setTheme]);

  // Submit the form after user selects their type
  const submitEmailSignup = async () => {
    try {
      const response = await fetch("/api/signup-interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          isAuthorInterest: isAuthor,
          isPublisher: isPublisher,
          sessionId
        }),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Thank you for signing up. We'll keep you updated!",
        });
        setEmail("");
        setIsTypeDialogOpen(false);
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

  // Handle email sign up - open the dialog first
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email to sign up for updates.",
        variant: "destructive",
      });
      return;
    }
    
    // Open dialog for user type selection
    setIsTypeDialogOpen(true);
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
      {/* Author/Reader Selection Dialog */}
      <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tell us about yourself</DialogTitle>
            <DialogDescription>
              Select which best describes you to help us personalize your experience
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <Button
              variant={isAuthor ? "default" : "outline"}
              className={`flex flex-col items-center justify-center h-32 ${isAuthor ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => {
                setIsAuthor(true);
                setIsPublisher(false);
              }}
            >
              <PenTool className="h-8 w-8 mb-2" />
              <span className="font-medium">I'm an Author</span>
            </Button>
            
            <Button
              variant={!isAuthor && !isPublisher ? "default" : "outline"}
              className={`flex flex-col items-center justify-center h-32 ${!isAuthor && !isPublisher ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => {
                setIsAuthor(false);
                setIsPublisher(false);
              }}
            >
              <BookOpen className="h-8 w-8 mb-2" />
              <span className="font-medium">I'm a Reader</span>
            </Button>
            
            <Button
              variant={isPublisher ? "default" : "outline"}
              className={`flex flex-col items-center justify-center h-32 md:col-span-2 ${isPublisher ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => {
                setIsAuthor(false);
                setIsPublisher(true);
              }}
            >
              <BarChart2 className="h-8 w-8 mb-2" />
              <span className="font-medium">I'm a Publisher</span>
            </Button>
          </div>
          
          <DialogFooter>
            <Button 
              onClick={submitEmailSignup} 
              className="w-full"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-muted">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <SirenedLogo />
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

      {/* Hero Section */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 -z-10"></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-none bg-primary/10 blur-3xl -z-10"></div>
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-none bg-primary/5 blur-3xl -z-10"></div>

        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <AnimateOnScroll type="fade-in">
              <h1 className="text-4xl md:text-6xl mt-8 md:mt-24 font-bold mb-6 bg-clip-text">
                Find Gems<br></br> Get Discovered
              </h1>
            </AnimateOnScroll>
            
            <AnimateOnScroll type="slide-up" delay="short">
              <p className="text-xl md:text-2xl mb-16 md:mb-24 text-muted-foreground">
                Bold, original, yours — A storytelling platform for authors and
                readers.
              </p>
            </AnimateOnScroll>
            
            <AnimateOnScroll type="slide-up" delay="medium">
              <div className="max-w-md mx-auto w-full mb-8">
                <form
                  onSubmit={handleSignup}
                  className="flex flex-row justify-center items-center"
                >
                  <div className="bg-[#FFFFFF]/10 p-1 rounded-none border border-[#EFA738]/30">
                    <Input
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="Enter your email"
                      className="border-0 bg-transparent focus-visible:ring-[#FFD700] text-white placeholder:text-white/70"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="bg-[#EFA738] hover:bg-[#FFD700]/90 text-black rounded-none font-medium py-6"
                  >
                    Get Beta Access
                  </Button>
                </form>
              </div>
            </AnimateOnScroll>
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
            <AnimateOnScroll type="slide-up" delay="none">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">
                  <CountUp end={100} duration={1000} suffix="%" />
                </div>
                <div className="text-muted-foreground">
                  Author profit retention
                </div>
              </div>
            </AnimateOnScroll>
            
            <AnimateOnScroll type="slide-up" delay="short">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">0%</div>
                <div className="text-muted-foreground">
                  Hidden fees or commissions
                </div>
              </div>
            </AnimateOnScroll>
            
            <AnimateOnScroll type="slide-up" delay="medium">
              <div>
                <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                <div className="text-muted-foreground">Access to analytics</div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Direct Connection Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <AnimateOnScroll type="fade-in">
            <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
              Direct Author-to-Reader Connection
            </h2>
          </AnimateOnScroll>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <AnimateOnScroll type="slide-left">
              <div>
                <h3 className="text-2xl font-bold mb-4 text-primary">
                  Personal Stories for Unique Readers
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Authors write personal stories for readers as unique as they
                  are. On Sirened, we believe that every reader deserves content
                  that speaks directly to them.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-primary mr-2 flex-shrink-0 mt-0.5" />
                    <span>
                      Personalized reading recommendations based on your
                      preferences
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-primary mr-2 flex-shrink-0 mt-0.5" />
                    <span>
                      Connect with authors who share your values and interests
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-primary mr-2 flex-shrink-0 mt-0.5" />
                    <span>
                      Discover hidden gems that traditional publishing might
                      overlook
                    </span>
                  </li>
                </ul>
              </div>
            </AnimateOnScroll>
            
            <AnimateOnScroll type="slide-right">
              <div className="bg-white/5 backdrop-blur-sm p-8 rounded-none border border-primary/20 flex justify-center items-center">
                <img
                  src="/images/author-reader-connection.svg"
                  alt="Author and reader connecting directly"
                  className="w-full max-w-sm hover:scale-105 transition-transform duration-300"
                />
              </div>
            </AnimateOnScroll>
          </div>

          <div className="my-24 relative overflow-hidden py-10 px-8 rounded-none bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-none blur-3xl"></div>
            <div className="absolute -bottom-20 -left-10 w-60 h-60 bg-white/5 rounded-none blur-3xl"></div>

            <div className="text-center max-w-3xl mx-auto relative z-10">
              <h3 className="text-2xl md:text-3xl font-bold mb-5 bg-clip-text text-transparent bg-gradient-to-r from-white to-primary-foreground">
                "Storytelling is a conversation between author and reader. We're
                just removing the noise in between."
              </h3>
              <p className="text-lg text-primary/80 italic">
                — Sirened Founder
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mt-20">
            <div className="order-2 md:order-1 bg-white/5 backdrop-blur-sm p-8 rounded-none border border-primary/20 flex justify-center items-center">
              <img
                src="/images/author-store.svg"
                alt="Author-owned bookstore"
                className="w-full max-w-sm hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="order-1 md:order-2">
              <h3 className="text-2xl font-bold mb-4 text-primary">
                Any Bookstore Anywhere
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Connect your readers directly to your books however you want.
                When you own your sales, you control your destiny.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>Authors keep <CountUp end={100} duration={1000} suffix="%" /> of their sales revenue</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>
                    Complete creative control over your brand and marketing
                  </span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-primary mr-2 flex-shrink-0 mt-0.5" />
                  <span>Build meaningful relationships with your audience</span>
                </li>
              </ul>
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-none bg-primary/20">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M12 2v20" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </div>
                  <p className="font-medium">
                    Take control of your writing career and build sustainable
                    income
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-black/20 to-transparent">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Transparent Tools. Real Results.
            </h2>
            <p className="text-xl text-muted-foreground">
              Empowering Creative Freedom and Discovery
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureBox
              title="Author Tools"
              description="Everything you need to grow a loyal audience and promote your books directly."
              icon={
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              }
            />

            <FeatureBox
              title="Reader Discovery"
              description="Discover bold, original voices—just pure storytelling on your preference."
              icon={
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m21 21-6.05-6.05a8.5 8.5 0 1 0-5.9 2.47 8.5 8.5 0 0 0 5.24-1.79l6.35 6.37z" />
                </svg>
              }
            />

            <FeatureBox
              title="Real-time Analytics"
              description="Get real-time data on reader behavior, ad performance, and content engagement."
              icon={
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3v18h18" />
                  <path d="m19 9-5 5-4-4-3 3" />
                </svg>
              }
            />

            <FeatureBox
              title="Clear Value"
              description="Know why a book is recommended, where it came from, and how to connect with the author."
              icon={
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 12 2 2 4-4" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              }
            />

            <FeatureBox
              title="Direct Connection"
              description="Connect directly with your readers or favorite authors without middlemen."
              icon={
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect width="4" height="12" x="2" y="9" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              }
            />

            <FeatureBox
              title="Monetization Freedom"
              description="Monetize your work your way without platform commissions or restrictions."
              icon={
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                  <path d="M12 18V6" />
                </svg>
              }
            />
          </div>
        </div>
      </section>

      {/* Data-Driven Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">
            Data-Driven Insights
          </h2>

          <div className="grid md:grid-cols-2 gap-16 items-center mb-16">
            <AnimateOnScroll type="slide-left">
              <div className="bg-white/5 backdrop-blur-sm p-6 rounded-none border border-primary/20">
                <h3 className="text-2xl font-bold mb-4 text-primary">
                  Reader Analytics
                </h3>
                <p className="text-lg text-muted-foreground mb-6">
                  Understand how readers interact with your content and make informed decisions:
                </p>

                <AnimatedChart>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                      data={analyticsData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorImpressions" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#A06CD5" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#A06CD5" stopOpacity={0.1} />
                        </linearGradient>
                        <linearGradient id="colorReferrals" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EFA738" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#EFA738" stopOpacity={0.1} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#888888" />
                      <YAxis stroke="#888888" />
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1a1a1a",
                          borderColor: "#333",
                          color: "#fff",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="impressions"
                        stroke="#A06CD5"
                        fillOpacity={1}
                        fill="url(#colorImpressions)"
                        name="Content Views"
                      />
                      <Area
                        type="monotone"
                        dataKey="referrals"
                        stroke="#EFA738"
                        fillOpacity={1}
                        fill="url(#colorReferrals)"
                        name="Reader Referrals"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </AnimatedChart>
              </div>
            </AnimateOnScroll>

            <AnimateOnScroll type="slide-right">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <h3 className="text-2xl font-bold mb-4 text-primary">
                    Audience Intelligence
                  </h3>
                  <p className="text-lg text-muted-foreground mb-6">
                    Make data-informed decisions with comprehensive analytics that are easy to understand.
                  </p>
                  <ul className="space-y-4">
                    <AnimateOnScroll type="slide-right" delay="short">
                      <li className="flex items-start">
                        <div className="bg-primary/20 p-2 rounded-none mr-3 flex-shrink-0">
                          <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Engagement Insights</h4>
                          <p className="text-muted-foreground">
                            See which chapters keep readers engaged and where they drop off.
                          </p>
                        </div>
                      </li>
                    </AnimateOnScroll>
                    <AnimateOnScroll type="slide-right" delay="medium">
                      <li className="flex items-start">
                        <div className="bg-primary/20 p-2 rounded-none mr-3 flex-shrink-0">
                          <Filter className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Demographic Filters</h4>
                          <p className="text-muted-foreground">
                            Understand your audience with detailed demographic and interest data.
                          </p>
                        </div>
                      </li>
                    </AnimateOnScroll>
                    <AnimateOnScroll type="slide-right" delay="long">
                      <li className="flex items-start">
                        <div className="bg-primary/20 p-2 rounded-none mr-3 flex-shrink-0">
                          <Layers className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold mb-1">Conversion Tracking</h4>
                          <p className="text-muted-foreground">
                            Follow the journey from discovery to purchase with detailed conversion analytics.
                          </p>
                        </div>
                      </li>
                    </AnimateOnScroll>
                  </ul>
                  <AnimateOnScroll type="fade-in" delay="long">
                    <div className="mt-6">
                      <Button className="bg-primary/90 hover:bg-primary">
                        <span>Learn More</span>
                        <ArrowRight size={16} className="ml-1" />
                      </Button>
                    </div>
                  </AnimateOnScroll>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-black/20 to-transparent flex justify-center center-items">
        <div className=" w-64 md:w-[85vw] backdrop-blur-md p-6  ">
          <h3 className=" text-center  font-bold mb-12">
            Find Your Perfect Match
          </h3>
          {/* Use the actual GenreSelector component */}
          <div className="p-6 bg-black/20 border rounded-none border-white/20">
            <div className="text-lg font-medium mb-1">
            You are multi-faceted, so why limit yourself to one profile?
            </div>
          <GenreSelector
            mode="taxonomy"
            selected={selectedGenres}
            onSelectionChange={setSelectedGenres}
            restrictLimits={false}
            label=""
            helperText="Select genres, themes, and tropes that interest you"
            className="pb-6"
          />
            <Button className="bg-primary/90 float-right hover:bg-primary">
              <span>Start a new profile</span>
              <ArrowRight size={16} className="ml-1" />
            </Button>

            
            </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center">
            How Sirened Transforms Publishing
          </h2>

          <ValueProposition
            title="Fair Compensation"
            description="The current publishing model takes significant royalties from authors while providing limited value."
            forAuthors={`Keep <CountUp end={100} duration={1000} suffix="%" /> of your sales with no platform fees. Set your own prices and offer any format you want.`}
            forReaders="Support authors directly, knowing that your purchase directly benefits their work rather than intermediaries."
          />

          <ValueProposition
            title="Content Discovery"
            description="Traditional discovery is based on marketing budgets rather than quality or reader preferences."
            forAuthors="Get discovered based on the quality of your work, not your marketing budget. Reach the exact readers who will love your books."
            forReaders="Discover books tailored to your unique taste, not what's being pushed by publishers or algorithms."
          />

          <ValueProposition
            title="Community Connection"
            description="The traditional publishing model creates distance between authors and readers."
            forAuthors="Build direct relationships with your readers. Get immediate feedback and engage in meaningful discussions."
            forReaders="Connect directly with authors you love. Share feedback and be part of the creative journey."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-primary/10 to-transparent">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">
              Join the Storytelling Revolution
            </h2>
            <p className="text-xl text-muted-foreground mb-12">
              Whether you're an author looking to connect with readers or a
              reader seeking bold new voices, Sirened is for you.
            </p>

            <div className="max-w-md mx-auto w-full mb-8">
              <form
                onSubmit={handleSignup}
                className="flex flex-row justify-center items-center"
              >
                <div className="bg-[#FFFFFF]/10 p-1 rounded-none border border-[#EFA738]/30">
                  <Input
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                    className="border-0 bg-transparent focus-visible:ring-[#FFD700] text-white placeholder:text-white/70"
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-[#EFA738] hover:bg-[#FFD700]/90 text-black rounded-none font-medium py-6"
                >
                  Get Beta Access
                </Button>
              </form>
            </div>

            <div className="text-sm text-muted-foreground">
              By signing up, you agree to our{" "}
              <a href="#" className="text-primary underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-primary underline">
                Privacy Policy
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-black/40 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <SirenedLogo />
            <div className="mt-6 md:mt-0 flex gap-4">
              <Button variant="outline" size="icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </Button>
              <Button variant="outline" size="icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </Button>
              <Button variant="outline" size="icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                </svg>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-bold mb-4">For Readers</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    Discover Books
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    Reading Preferences
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    Beta Access
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    Reading Lists
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">For Authors</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    Author Dashboard
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    Analytics Tools
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    Book Publishing
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    Marketing Resources
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">For Publishers</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    Publisher Portal
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    Catalog Management
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    Author Relationships
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    Integration APIs
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-primary">
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 mt-8 text-center text-muted-foreground text-sm">
            <p>&copy; {new Date().getFullYear()} Sirened Publishing. All rights reserved.</p>
            <div className="mt-2 flex justify-center gap-4">
              <a href="#" className="hover:text-primary">
                Terms of Service
              </a>
              <a href="#" className="hover:text-primary">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-primary">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewLandingPage;