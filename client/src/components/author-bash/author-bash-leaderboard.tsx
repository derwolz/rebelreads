import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Helper function for JSON requests
async function jsonRequest(url: string) {
  const res = await fetch(url, {
    method: 'GET',
    credentials: "include",
  });
  
  if (!res.ok) {
    const text = await res.text();
    try {
      const json = JSON.parse(text);
      throw json;
    } catch {
      throw new Error(text || res.statusText);
    }
  }
  
  return await res.json();
}
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Trophy, Medal, User } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AuthorResponse {
  id: number;
  questionId: number;
  authorId: number;
  text: string | null;
  imageUrl: string | null;
  retentionCount: number;
  impressionCount: number;
  createdAt: string;
  author: {
    author_name: string;
    author_image_url: string | null;
  };
  question: {
    question: string;
    weekNumber: number;
  };
}

interface Author {
  id: number;
  author_name: string;
  author_image_url: string | null;
  totalRetentions: number;
  user: {
    username: string;
  };
}

export default function AuthorBashLeaderboard() {
  const [activeTab, setActiveTab] = useState<string>("responses");

  // Fetch top responses
  const {
    data: topResponses,
    isLoading: isLoadingResponses,
    isError: isResponsesError,
  } = useQuery({
    queryKey: ["/api/authorbash/leaderboard/responses"],
    queryFn: () => jsonRequest("/api/authorbash/leaderboard/responses"),
  });

  // Fetch top authors
  const {
    data: topAuthors,
    isLoading: isLoadingAuthors,
    isError: isAuthorsError,
  } = useQuery({
    queryKey: ["/api/authorbash/leaderboard/authors"],
    queryFn: () => jsonRequest("/api/authorbash/leaderboard/authors"),
  });

  // Handle loading states
  if (isLoadingResponses || isLoadingAuthors) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading leaderboard data...</span>
      </div>
    );
  }

  // Handle error states
  if (isResponsesError && isAuthorsError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load leaderboard data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <Tabs defaultValue="responses" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="responses">Top Responses</TabsTrigger>
          <TabsTrigger value="authors">Top Authors</TabsTrigger>
        </TabsList>

        <TabsContent value="responses" className="mt-6">
          {topResponses && topResponses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {topResponses.map((response: AuthorResponse, index: number) => (
                <Card key={response.id} className="overflow-hidden">
                  {index < 3 && (
                    <div className="absolute top-2 right-2 z-10">
                      <Badge variant={index === 0 ? "default" : "outline"} className="bg-opacity-90">
                        {index === 0 && <Trophy className="h-3 w-3 mr-1 inline" />}
                        {index === 1 && <Medal className="h-3 w-3 mr-1 inline" />}
                        {index === 2 && <Medal className="h-3 w-3 mr-1 inline" />}
                        #{index + 1}
                      </Badge>
                    </div>
                  )}
                  {response.imageUrl && (
                    <div className="aspect-video overflow-hidden">
                      <img 
                        src={response.imageUrl} 
                        alt={response.text || "Author response"} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className={response.imageUrl ? "pt-4" : ""}>
                    {response.text && <p className="text-sm font-medium">{response.text}</p>}
                    <div className="flex items-center mt-3">
                      <Avatar className="h-6 w-6 mr-2">
                        <AvatarImage src={response.author.author_image_url || undefined} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs">{response.author.author_name}</span>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Week {response.question.weekNumber}</span>
                      <span>{response.retentionCount} retentions</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No responses data available yet.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="authors" className="mt-6">
          {topAuthors && topAuthors.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Author Rankings</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y">
                  {topAuthors.map((author: Author, index: number) => (
                    <li key={author.id} className="py-4 flex items-center gap-4">
                      <div className="w-8 text-center font-bold">
                        {index === 0 ? (
                          <Trophy className="h-6 w-6 text-yellow-500 mx-auto" />
                        ) : index === 1 ? (
                          <Medal className="h-6 w-6 text-gray-400 mx-auto" />
                        ) : index === 2 ? (
                          <Medal className="h-6 w-6 text-amber-600 mx-auto" />
                        ) : (
                          `#${index + 1}`
                        )}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={author.author_image_url || undefined} />
                        <AvatarFallback>
                          <User className="h-5 w-5" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium">{author.author_name}</h3>
                        <p className="text-sm text-muted-foreground">@{author.user.username}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold">{author.totalRetentions}</span>
                        <p className="text-xs text-muted-foreground">total retentions</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No author data available yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}