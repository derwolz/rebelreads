import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

// Helper function for JSON requests
async function jsonRequest(url: string, options: { method: string; body: string }) {
  const res = await fetch(url, {
    method: options.method,
    headers: { "Content-Type": "application/json" },
    body: options.body,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle, CheckCircle, RotateCw, Trash2 } from "lucide-react";
import { Link } from "wouter";

interface CardResponse {
  id: number;
  questionId: number;
  authorId: number;
  imageUrl: string | null;
  text: string | null;
  retentionCount: number;
  impressionCount: number;
  author: {
    author_name: string;
    author_image_url: string | null;
  };
}

export default function AuthorBashGame() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [gameId, setGameId] = useState<number | null>(null);

  // Define game data type
  interface GameData {
    gameId: number;
    gameComplete: boolean;
    cards: CardResponse[];
  }

  // Define retained data type
  interface RetainedData {
    retainedCards: CardResponse[];
  }

  // Get three random responses for the user to choose from
  const {
    data: gameData,
    isLoading: isLoadingGame,
    isError: isGameError,
    error: gameErrorDetails,
    refetch: refetchGame,
  } = useQuery<GameData>({
    queryKey: ["/api/authorbash/game/cards"],
    enabled: !!user,
    queryFn: async () => {
      try {
        console.log("Fetching game cards...");
        const res = await fetch("/api/authorbash/game/cards", {
          method: "GET",
          credentials: "include",
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Game cards error response:", errorText);
          throw new Error(errorText);
        }
        
        const result = await res.json();
        console.log("Game cards result:", result);
        return result;
      } catch (error) {
        console.error("Error fetching game cards:", error);
        throw error;
      }
    },
  });
  
  // Set game ID when data is available
  React.useEffect(() => {
    if (gameData?.gameId) {
      setGameId(gameData.gameId);
    }
  }, [gameData]);

  // Get the user's currently retained cards
  const {
    data: retainedData,
    isLoading: isLoadingRetained,
    isError: isRetainedError,
    error: retainedErrorDetails,
    refetch: refetchRetained,
  } = useQuery<RetainedData>({
    queryKey: ["/api/authorbash/game/retained"],
    enabled: !!user,
    queryFn: async () => {
      try {
        console.log("Fetching retained cards...");
        const res = await fetch("/api/authorbash/game/retained", {
          method: "GET",
          credentials: "include",
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Retained cards error response:", errorText);
          throw new Error(errorText);
        }
        
        const result = await res.json();
        console.log("Retained cards result:", result);
        return result;
      } catch (error) {
        console.error("Error fetching retained cards:", error);
        throw error;
      }
    },
  });

  // Mutation for retaining a card
  const retainMutation = useMutation({
    mutationFn: (responseId: number) => {
      return jsonRequest("/api/authorbash/game/retain", {
        method: "POST",
        body: JSON.stringify({ responseId, gameId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authorbash/game/retained"] });
      refetchRetained();
      refetchGame();
      setSelectedCardId(null);
      toast({
        title: "Card retained!",
        description: "This card has been added to your selection.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.error || "Failed to retain card. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for replacing a card
  const replaceMutation = useMutation({
    mutationFn: ({ oldResponseId, newResponseId }: { oldResponseId: number; newResponseId: number }) => {
      return jsonRequest("/api/authorbash/game/replace", {
        method: "POST",
        body: JSON.stringify({ oldResponseId, newResponseId, gameId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/authorbash/game/retained"] });
      refetchRetained();
      refetchGame();
      setSelectedCardId(null);
      toast({
        title: "Card replaced!",
        description: "Your selection has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.error || "Failed to replace card. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle card selection
  const handleSelectCard = (cardId: number) => {
    setSelectedCardId(cardId);
  };

  // Handle card retention
  const handleRetainCard = () => {
    if (!selectedCardId) return;
    
    // If the user already has 3 retained cards, show modal to replace one
    if (retainedData?.retainedCards?.length >= 3) {
      // Let's just show a message for now
      toast({
        title: "Maximum cards retained",
        description: "You already have 3 cards retained. Please replace one of your existing cards.",
        variant: "destructive",
      });
      return;
    }
    
    retainMutation.mutate(selectedCardId);
  };

  // Handle card replacement
  const handleReplaceCard = (oldCardId: number) => {
    if (!selectedCardId) return;
    
    replaceMutation.mutate({ 
      oldResponseId: oldCardId, 
      newResponseId: selectedCardId 
    });
  };

  // Handle loading states
  if (!user) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-semibold mb-4">Sign in to Play</h3>
        <p className="mb-6">You need to be signed in to play AuthorBash.</p>
        <Button asChild>
          <Link href="/auth">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (isLoadingGame || isLoadingRetained) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading game...</span>
      </div>
    );
  }

  if (isGameError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load game data. Please try again later.
          <Button variant="outline" className="mt-4" onClick={() => refetchGame()}>
            <RotateCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // If the game is complete (no more cards)
  if (gameData?.gameComplete) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-primary mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-4">Game Complete!</h3>
        <p className="mb-6">You've viewed all the available responses. Check back later for more content!</p>
        <div className="flex justify-center gap-4">
          <Button asChild variant="outline">
            <Link href="/authorbash?tab=leaderboard">View Leaderboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Render the retained cards section
  const renderRetainedCards = () => {
    if (!retainedData || retainedData.retainedCards.length === 0) {
      return (
        <div className="text-center p-4 border rounded-md bg-muted/30">
          <p className="text-muted-foreground">No cards retained yet. Choose your favorites from below!</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {retainedData.retainedCards.map((card: CardResponse) => (
          <Card key={card.id} className="overflow-hidden">
            {card.imageUrl && (
              <div className="aspect-video overflow-hidden">
                <img 
                  src={card.imageUrl} 
                  alt={card.text || "Author response"} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardContent className={card.imageUrl ? "pt-4" : ""}>
              {card.text && <p className="text-sm font-medium">{card.text}</p>}
              <p className="text-xs text-muted-foreground mt-2">By {card.author.author_name}</p>
            </CardContent>
            <CardFooter className="bg-muted/30 p-2 flex justify-end">
              {selectedCardId && (
                <Button 
                  size="sm"
                  variant="destructive"
                  onClick={() => handleReplaceCard(card.id)}
                  disabled={replaceMutation.isPending}
                >
                  {replaceMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-1" /> Replace
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Your Retained Cards ({retainedData?.retainedCards?.length || 0}/3)</CardTitle>
        </CardHeader>
        <CardContent>
          {renderRetainedCards()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Choose Your Favorite</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            Select one card from these three to retain. You can keep up to three cards total.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {gameData?.cards.map((card: CardResponse) => (
              <Card 
                key={card.id} 
                className={`overflow-hidden cursor-pointer transition-all ${
                  selectedCardId === card.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
                }`}
                onClick={() => handleSelectCard(card.id)}
              >
                {card.imageUrl && (
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={card.imageUrl} 
                      alt={card.text || "Author response"} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <CardContent className={card.imageUrl ? "pt-4" : ""}>
                  {card.text && <p className="text-sm font-medium">{card.text}</p>}
                  <p className="text-xs text-muted-foreground mt-2">By {card.author.author_name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => refetchGame()}
            disabled={retainMutation.isPending}
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Skip These
          </Button>
          <Button 
            disabled={!selectedCardId || retainMutation.isPending} 
            onClick={handleRetainCard}
          >
            {retainMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Retain Selected
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}