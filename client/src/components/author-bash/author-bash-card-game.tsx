import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragEndEvent,
} from "@dnd-kit/core";
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

// Card component with drag functionality
interface DraggableCardProps {
  card: CardResponse;
  isSelected: boolean;
  isDragging?: boolean;
  onClick: () => void;
  dragHandleProps?: any;
}

const DraggableCard: React.FC<DraggableCardProps> = ({ 
  card, 
  isSelected,
  isDragging = false,
  onClick,
  dragHandleProps = {}
}) => {
  return (
    <motion.div
      {...dragHandleProps}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`will-change-transform ${isDragging ? 'z-50' : 'z-10'}`}
    >
      <Card 
        className={`overflow-hidden cursor-move transition-all ${
          isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
        } ${isDragging ? 'opacity-75' : 'opacity-100'}`}
        onClick={onClick}
      >
        {card.imageUrl && (
          <div className="aspect-video overflow-hidden">
            <img 
              src={card.imageUrl} 
              alt={card.text || "Author response"} 
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        )}
        <CardContent className={`${card.imageUrl ? "pt-4" : "pt-6"} pb-6`}>
          {card.text && <p className="text-sm font-medium">{card.text}</p>}
          <p className="text-xs text-muted-foreground mt-2">By {card.author.author_name}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

// Drop zone for the "hand" area
const DropZone: React.FC<{
  children: React.ReactNode;
  isActive: boolean;
  id?: string; // Make id optional
}> = ({ children, isActive, id }) => {
  return (
    <div 
      id={id}
      className={`p-4 rounded-lg transition-colors ${
        isActive ? 'bg-primary/10 ring-2 ring-primary' : 'bg-secondary/30'
      }`}
    >
      {children}
    </div>
  );
};

export default function AuthorBashCardGame() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [gameId, setGameId] = useState<number | null>(null);
  const [activeDropZone, setActiveDropZone] = useState<string | null>(null);
  const [activeDragCard, setActiveDragCard] = useState<CardResponse | null>(null);
  const [dealAnimation, setDealAnimation] = useState(false);

  // Set up drag sensors
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

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
        const res = await fetch("/api/authorbash/game/cards", {
          method: "GET",
          credentials: "include",
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText);
        }
        
        const result = await res.json();
        return result;
      } catch (error) {
        console.error("Error fetching game cards:", error);
        throw error;
      }
    },
  });
  
  // Set game ID when data is available
  useEffect(() => {
    if (gameData?.gameId) {
      setGameId(gameData.gameId);
      setDealAnimation(true);
      
      // Reset the deal animation after cards are dealt
      const timeoutId = setTimeout(() => {
        setDealAnimation(false);
      }, 1000);
      
      return () => clearTimeout(timeoutId);
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
        const res = await fetch("/api/authorbash/game/retained", {
          method: "GET",
          credentials: "include",
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText);
        }
        
        const result = await res.json();
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
    setSelectedCardId(cardId === selectedCardId ? null : cardId);
  };

  // Handle card retention
  const handleRetainCard = () => {
    if (!selectedCardId) return;
    
    // If the user already has 3 retained cards, show modal to replace one
    if (retainedData?.retainedCards && retainedData.retainedCards.length >= 3) {
      // Let's just show a message for now
      toast({
        title: "Maximum cards retained",
        description: "You already have 3 cards retained. Please replace one of your existing cards or drag a new card onto an existing one.",
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

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragCard(null);
    
    if (!over) return;
    
    // If dragging to the "hand" area
    if (over.id === 'hand' && active.id) {
      const draggedCardId = Number(active.id);
      
      // If user already has max cards
      if (retainedData?.retainedCards && retainedData.retainedCards.length >= 3) {
        toast({
          title: "Maximum cards retained",
          description: "You already have 3 cards. Drag onto an existing card to replace it.",
          variant: "destructive",
        });
        return;
      }
      
      // Retain the card
      retainMutation.mutate(draggedCardId);
    }
    
    // If dragging onto an existing card in the hand (replacement)
    if (typeof over.id === 'string' && over.id.startsWith('retained-') && active.id) {
      const oldCardId = Number(over.id.replace('retained-', ''));
      const newCardId = Number(active.id);
      
      // Replace the card
      replaceMutation.mutate({
        oldResponseId: oldCardId,
        newResponseId: newCardId
      });
    }
    
    setActiveDropZone(null);
  };

  // Handle drag start
  const handleDragStart = (event: any) => {
    const { active } = event;
    const draggedCardId = Number(active.id);
    
    // Find the card data
    const draggedCard = gameData?.cards.find(card => card.id === draggedCardId);
    if (draggedCard) {
      setActiveDragCard(draggedCard);
    }
  };

  // Handle drag over
  const handleDragOver = (event: any) => {
    const { over } = event;
    setActiveDropZone(over?.id || null);
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
        <div className="text-center p-8 border rounded-md bg-muted/30">
          <p className="text-muted-foreground">Drag your favorite cards here or tap a card then press "Retain"</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AnimatePresence>
          {retainedData.retainedCards.map((card: CardResponse, index) => (
            <motion.div
              key={`retained-${card.id}`}
              id={`retained-${card.id}`}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                transition: { delay: index * 0.1 }
              }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative"
            >
              <Card className="overflow-hidden">
                {card.imageUrl && (
                  <div className="aspect-video overflow-hidden">
                    <img 
                      src={card.imageUrl} 
                      alt={card.text || "Author response"} 
                      className="w-full h-full object-cover"
                      draggable={false}
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
              {activeDropZone === `retained-${card.id}` && (
                <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-lg pointer-events-none"></div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
    >
      <div>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Hand ({retainedData?.retainedCards?.length || 0}/3)</CardTitle>
          </CardHeader>
          <CardContent>
            <DropZone isActive={activeDropZone === 'hand'} id="hand">
              {renderRetainedCards()}
            </DropZone>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              Drag cards to your hand or tap to select and then press "Retain". You can keep up to three cards total.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[200px]">
              <AnimatePresence>
                {gameData?.cards.map((card: CardResponse, index) => (
                  <motion.div
                    key={card.id}
                    layoutId={`card-${card.id}`}
                    initial={{ 
                      y: dealAnimation ? -200 : 0, 
                      opacity: dealAnimation ? 0 : 1,
                      rotateZ: dealAnimation ? (index - 1) * 5 : 0
                    }}
                    animate={{ 
                      y: 0, 
                      opacity: 1,
                      rotateZ: 0,
                      transition: { 
                        type: "spring", 
                        stiffness: 300, 
                        damping: 25,
                        delay: dealAnimation ? index * 0.15 : 0
                      }
                    }}
                  >
                    <DraggableCard
                      card={card}
                      isSelected={selectedCardId === card.id}
                      onClick={() => handleSelectCard(card.id)}
                      dragHandleProps={{
                        id: card.id.toString(),
                      }}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setDealAnimation(true);
                refetchGame();
              }}
              disabled={retainMutation.isPending}
            >
              <RotateCw className="mr-2 h-4 w-4" />
              Deal New Cards
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

      <DragOverlay>
        {activeDragCard && (
          <div className="transform scale-105">
            <DraggableCard
              card={activeDragCard}
              isSelected={false}
              isDragging={true}
              onClick={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}