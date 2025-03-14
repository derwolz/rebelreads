import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useTheme } from "@/hooks/use-theme";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function LandingPage() {
  const [isAuthor, setIsAuthor] = useState(false);
  const [email, setEmail] = useState("");
  const { setTheme } = useTheme();
  const { toast } = useToast();

  // Switch theme based on user type
  const handleUserTypeChange = (checked: boolean) => {
    setIsAuthor(checked);
    setTheme(checked ? "dark" : "light");
  };

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
        body: JSON.stringify({ email, isAuthor }),
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

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Transform Your Story Journey
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Where authors and readers unite to create unforgettable literary experiences.
          </p>
        </div>

        <div className="flex justify-center mb-16">
          <div className="flex flex-col items-center gap-2">
            <span className="text-lg font-medium">I am a</span>
            <div className="flex items-center gap-2">
              <span className={!isAuthor ? "font-bold" : "text-muted-foreground"}>Reader</span>
              <Switch
                checked={isAuthor}
                onCheckedChange={handleUserTypeChange}
                className="data-[state=checked]:bg-primary"
              />
              <span className={isAuthor ? "font-bold" : "text-muted-foreground"}>Author</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">For Readers</h2>
            <ul className="space-y-4 mb-6">
              <li>✨ Discover your next favorite book</li>
              <li>📚 Connect with passionate readers</li>
              <li>🎯 Get personalized recommendations</li>
              <li>💬 Engage with authors directly</li>
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">For Authors</h2>
            <ul className="space-y-4 mb-6">
              <li>📈 Grow your readership</li>
              <li>🎯 Target your ideal audience</li>
              <li>📊 Track your book's performance</li>
              <li>🤝 Build a loyal community</li>
            </ul>
          </Card>
        </div>

        <div className="max-w-md mx-auto">
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4 text-center">
              Sign Up for Updates
            </h2>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Keep Me Updated
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default LandingPage;
