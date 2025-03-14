import { useQuery } from "@tanstack/react-query";
import { Book } from "@shared/schema";
import { BookCard } from "@/components/book-card";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [isAuthorMode, setIsAuthorMode] = useState(false);
  const [email, setEmail] = useState("");

  // Toggle between author and reader modes
  const toggleMode = () => {
    setIsAuthorMode(!isAuthorMode);
    setTheme(isAuthorMode ? "light" : "dark");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual signup logic
    toast({
      title: "Thanks for signing up!",
      description: "We'll keep you updated on our latest features.",
    });
    setEmail("");
  };

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto">
          <div className="space-y-2">
            <Label htmlFor="mode-toggle" className="text-lg">
              I am a
            </Label>
            <div className="flex items-center justify-center gap-4">
              <span className={!isAuthorMode ? "font-bold" : ""}>Reader</span>
              <Switch
                id="mode-toggle"
                checked={isAuthorMode}
                onCheckedChange={toggleMode}
              />
              <span className={isAuthorMode ? "font-bold" : ""}>Author</span>
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            {isAuthorMode
              ? "Transform Your Writing Journey"
              : "Discover Your Next Great Read"}
          </h1>
          <p className="text-xl text-muted-foreground">
            {isAuthorMode
              ? "Connect with readers, track performance, and grow your audience with powerful tools designed for authors."
              : "Find personalized book recommendations, join reading communities, and connect with your favorite authors."}
          </p>

          {/* Email Signup Form */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Stay Updated</CardTitle>
              <CardDescription>
                Sign up to receive updates about our latest features and book recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="flex gap-4">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit">Sign Up</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {isAuthorMode ? (
            <>
              <FeatureCard
                title="Powerful Analytics"
                description="Track your book's performance, reader engagement, and sales metrics in real-time."
              />
              <FeatureCard
                title="Marketing Tools"
                description="Create targeted campaigns, promotional materials, and connect with your audience effectively."
              />
              <FeatureCard
                title="Author Community"
                description="Join a community of writers, share experiences, and get valuable insights."
              />
              <FeatureCard
                title="Publishing Support"
                description="Get guidance on publishing options, pricing strategies, and distribution channels."
              />
            </>
          ) : (
            <>
              <FeatureCard
                title="Personalized Recommendations"
                description="Discover books tailored to your interests and reading preferences."
              />
              <FeatureCard
                title="Reading Challenges"
                description="Set reading goals, track progress, and earn rewards for your achievements."
              />
              <FeatureCard
                title="Book Clubs"
                description="Join virtual book clubs, discuss your favorite reads, and connect with fellow readers."
              />
              <FeatureCard
                title="Author Interactions"
                description="Engage directly with authors through Q&As, live events, and exclusive content."
              />
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}