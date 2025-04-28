import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import AuthorBashSubmission from "../components/author-bash/author-bash-submission";
import AuthorBashGame from "../components/author-bash/author-bash-game";
import AuthorBashLeaderboard from "../components/author-bash/author-bash-leaderboard";

export default function AuthorBashPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(
    // Get tab from URL query param or default to "play"
    typeof window !== 'undefined' 
      ? new URLSearchParams(window.location.search).get("tab") || "play"
      : "play"
  );

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", value);
      window.history.replaceState({}, "", url.toString());
    }
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">AuthorBash</CardTitle>
          <p className="text-muted-foreground mt-2">
            A creative experiment where authors respond to weekly questions with images and short text.
          </p>
        </CardHeader>
        <CardContent>
          <p>
            Each week, authors respond to a new question with an image and up to 200 characters of text.
            Readers browse these responses and keep the ones they like best. The most popular responses and
            authors appear on the leaderboard.
          </p>
        </CardContent>
      </Card>

      <Tabs 
        defaultValue="play" 
        value={activeTab} 
        onValueChange={handleTabChange}
        className="space-y-6"
      >
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="play">Play</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          {user?.isAuthor && (
            <TabsTrigger value="submit">Submit</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="play" className="space-y-6">
          <AuthorBashGame />
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <AuthorBashLeaderboard />
        </TabsContent>

        {user?.isAuthor && (
          <TabsContent value="submit" className="space-y-6">
            <AuthorBashSubmission />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}