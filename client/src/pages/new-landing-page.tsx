import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ArrowRight,
  CheckCircle,
  BarChart2,
  TrendingUp,
  Layers,
  Filter,
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
      <div className="bg-white/5 backdrop-blur-sm p-6 rounded-lg border border-primary/20">
        <h4 className="text-lg font-semibold mb-2 flex items-center">
          <span className="mr-2 text-primary">
            <CheckCircle size={18} />
          </span>
          For Authors
        </h4>
        <p className="text-muted-foreground">{forAuthors}</p>
      </div>
      <div className="bg-white/5 backdrop-blur-sm p-6 rounded-lg border border-primary/20">
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
            <Button 
              className="bg-[#EFA738] hover:bg-[#EFA738]/90 text-[#102b3F]  font-bold" 
              onClick={() => setLocation("/auth")}
            >
              Get Beta Access
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
            <h1 className="text-4xl md:text-6xl mt-8 md:mt-24 font-bold mb-6 bg-clip-text  ">
              Find Gems<br></br> Get Discovered
            </h1>
            <p className="text-xl md:text-2xl mb-16 md:mb-24 text-muted-foreground">
              Bold, original, yours — A storytelling platform for authors and
              readers.
            </p>
            <div className="max-w-md mx-auto w-full mb-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const email = (e.target as HTMLFormElement).email.value;
                  if (email) {
                    // You can add API call here to save the email
                    toast({
                      title: "Thank you for your interest!",
                      description:
                        "We'll notify you when beta access is available.",
                    });
                    (e.target as HTMLFormElement).reset();
                  }
                }}
                className="flex flex-row justify-center items-center"
              >
                <div className="bg-[#FFFFFF]/10 p-1 rounded-l-lg border border-[#EFA738]/30">
                  <Input
                    name="email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    className="border-0 bg-transparent focus-visible:ring-[#FFD700] text-white placeholder:text-white/70"
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-[#EFA738] hover:bg-[#FFD700]/90 text-black rounded-r-lg rounded-l-none font-medium py-6"
                >
                  Get Beta Access
                </Button>
              </form>
            </div>
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
              <div className="text-muted-foreground">
                Author profit retention
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">0%</div>
              <div className="text-muted-foreground">
                Hidden fees or commissions
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Access to analytics</div>
            </div>
          </div>
        </div>
      </section>

      {/* Direct Connection Section */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Direct Author-to-Reader Connection
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
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
            <div className="bg-white/5 backdrop-blur-sm p-8 rounded-lg border border-primary/20 flex justify-center items-center">
              <img
                src="/images/author-reader-connection.svg"
                alt="Author and reader connecting directly"
                className="w-full max-w-sm hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          <div className="my-24 relative overflow-hidden py-10 px-8 rounded-xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/5">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-10 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>

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
            <div className="order-2 md:order-1 bg-white/5 backdrop-blur-sm p-8 rounded-lg border border-primary/20 flex justify-center items-center">
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
                  <span>Authors keep 100% of their sales revenue</span>
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
                  <div className="p-2 rounded-full bg-primary/20">
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
                  <path d="M17 6.1H3" />
                  <path d="M21 12.1H3" />
                  <path d="M15.1 18H3" />
                </svg>
              }
            />

            <FeatureBox
              title="Fair Marketplace"
              description="A platform where quality matters more than marketing budgets."
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

      {/* Taxonomy Selector Section */}
      <section className="py-20 md:py-32 bg-gradient-to-br from-background to-black/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Your tastes are unique,{" "}
                <span className="text-primary">so tailor your experience</span>
              </h2>
              <p className="text-xl mb-8 text-muted-foreground">
                Customize your searches based on content, not on clicks. Our
                taxonomy system lets you find exactly what you're looking for.
              </p>
            </div>

            <div className="bg-black/30 backdrop-blur-md p-6 rounded-lg border border-primary/20 relative">
              <h3 className="text-xl font-bold mb-4">
                Find Your Perfect Match
              </h3>
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
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(0,0,0,0.8)",
                        borderColor: "rgba(160,108,213,0.5)",
                        color: "white",
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
                    <div className="text-sm text-muted-foreground">
                      Total Impressions
                    </div>
                    <div className="text-2xl font-bold">19,550</div>
                  </div>
                  <div className="bg-black/20 p-3 rounded">
                    <div className="text-sm text-muted-foreground">
                      Total Referrals
                    </div>
                    <div className="text-2xl font-bold">3836</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Level the playing field.
              </h2>
              <p className="text-xl mb-8 text-muted-foreground">
                Use advanced analytics to rival industry giants. Track reader
                engagement, monitor performance trends, and optimize your
                marketing strategy.
              </p>

              <div className="bg-black/20 backdrop-blur-sm p-6 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="text-primary" />
                  <h3 className="text-xl font-semibold">Real-time Insights</h3>
                </div>
                <p className="text-muted-foreground mb-4">
                  Monitor reader behavior, track marketing campaign performance,
                  and gain valuable insights about your audience. Make
                  data-driven decisions to grow your readership.
                </p>
                <div className="flex items-center gap-2 text-primary">
                  <TrendingUp size={16} />
                  <span className="text-sm">
                    +22.7% increase in referrals month-over-month
                  </span>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Reclaim your literary future
            </h2>
            <p className="text-xl mb-8">
              You'll have every tool to make your stories a success.
            </p>
            <div className="max-w-md mx-auto w-full mb-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const email = (e.target as HTMLFormElement).email.value;
                  if (email) {
                    // You can add API call here to save the email
                    toast({
                      title: "Thank you for your interest!",
                      description:
                        "We'll notify you when beta access is available.",
                    });
                    (e.target as HTMLFormElement).reset();
                  }
                }}
                className="flex flex-row justify-center items-center"
              >
                <div className="bg-[#FFFFFF]/10 p-1 rounded-l-lg border border-[#EFA738]/30">
                  <Input
                    name="email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    className="border-0 bg-transparent focus-visible:ring-[#FFD700] text-white placeholder:text-white/70"
                  />
                </div>
                <Button
                  type="submit"
                  className="bg-[#EFA738] hover:bg-[#FFD700]/90 text-black rounded-r-lg rounded-l-none font-medium py-6"
                >
                  Get Beta Access
                </Button>
              </form>
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
                A platform for authors and readers alike, creating a fair
                marketplace for literary works.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">For Authors</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary">
                    Analytics
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Marketing Tools
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Direct Sales
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Author Dashboard
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">For Readers</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary">
                    Discover Books
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Connect with Authors
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Reading Lists
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Book Recommendations
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-primary">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-primary">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-muted mt-12 pt-6 text-center text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()} Sirened. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewLandingPage;
