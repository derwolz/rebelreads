import React from "react";
import { Route, Switch, useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AuthorBashSubmission from "@/components/author-bash/author-bash-submission";
import AuthorBashGame from "@/components/author-bash/author-bash-game";
import AuthorBashLeaderboard from "@/components/author-bash/author-bash-leaderboard";
import { useAuth } from "@/hooks/use-auth";

export default function AuthorBashPage() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const isAuthor = user?.isAuthor || false;

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">AuthorBash</h1>
        <p className="text-xl text-muted-foreground">
          An experimental game mode where authors respond to weekly questions and readers vote on their favorites.
        </p>
      </div>

      <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
        <Tabs defaultValue="game" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="game">Play Game</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="submission" disabled={!isAuthor}>
              {isAuthor ? "Author Submission" : "Authors Only"}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="game" className="mt-6">
            <AuthorBashGame />
          </TabsContent>
          
          <TabsContent value="leaderboard" className="mt-6">
            <AuthorBashLeaderboard />
          </TabsContent>
          
          <TabsContent value="submission" className="mt-6">
            {isAuthor ? (
              <AuthorBashSubmission />
            ) : (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold mb-4">Author Access Only</h3>
                <p className="mb-6">Only authors can submit responses to the weekly question.</p>
                {user ? (
                  <Button asChild>
                    <Link href="/pro">Become an Author</Link>
                  </Button>
                ) : (
                  <Button asChild>
                    <Link href="/auth">Sign In</Link>
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}