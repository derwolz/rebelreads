import React, { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Book, InsertUserPreferenceTaxonomy } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { BookOpen, ThumbsUp, PlusCircle, Save, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { GenreSelector } from "@/components/genre-selector";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function RecommendationsSidebar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedGenres, setSelectedGenres] = useState<string[]>(user?.favoriteGenres || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingView, setIsCreatingView] = useState(false);

  // Fetch recommendations based on user's rating preferences
  const { data: recommendedBooks, isLoading } = useQuery<Book[]>({
    queryKey: ['/api/books'],
    staleTime: 60000,
  });

  // Fetch user preference taxonomies
  const { data: preferenceTaxonomies, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['/api/user/preference-taxonomies'],
    // If the API route doesn't exist yet, this will fail silently and show empty state
    enabled: !!user?.id,
  });

  const savePreferencesMutation = useMutation({
    mutationFn: async (data: { genres: string[] }) => {
      return await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to save preferences");
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "Preferences saved",
        description: "Your recommendation preferences have been updated."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive"
      });
    }
  });

  const createViewMutation = useMutation({
    mutationFn: async () => {
      return await fetch("/api/user/preference-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taxonomies: selectedGenres }),
      }).then((res) => {
        if (!res.ok) throw new Error("Failed to create view");
        return res.json();
      });
    },
    onSuccess: () => {
      toast({
        title: "View created",
        description: "Your custom view has been created and is now available."
      });
      setIsCreatingView(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create view. Please try again.",
        variant: "destructive"
      });
      setIsCreatingView(false);
    }
  });

  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await savePreferencesMutation.mutateAsync({ genres: selectedGenres });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateView = async () => {
    setIsCreatingView(true);
    try {
      await createViewMutation.mutateAsync();
    } catch (error) {
      setIsCreatingView(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Profile Preferences Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            Your Preferences
          </CardTitle>
          <CardDescription>
            Customize what you want to see
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border p-3">
            <GenreSelector 
              mode="simple"
              selected={selectedGenres}
              onSelectionChange={setSelectedGenres}
              maxItems={3}
              showQuickSelect={true}
              allowCustomGenres={false}
              helperText="Select up to 3 genres you're interested in."
            />
          </div>
          <Button 
            onClick={handleSavePreferences} 
            disabled={isSaving}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>

      {/* Recommendations Card */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-primary" />
            Recommended for You
          </CardTitle>
          <CardDescription>
            Based on your preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 pb-3 last:pb-0 border-b last:border-0">
                  <Skeleton className="w-10 h-14 rounded" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </>
          ) : recommendedBooks && recommendedBooks.length > 0 ? (
            <>
              {recommendedBooks.slice(0, 3).map((book) => (
                <div key={book.id} className="flex items-start gap-3 pb-3 last:pb-0 border-b last:border-0">
                  <div className="block w-10 h-14 shrink-0">
                    <Link href={`/books/${book.id}`}>
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover rounded cursor-pointer"
                      />
                    </Link>
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      <Link href={`/books/${book.id}`}>
                        <span className="hover:text-primary cursor-pointer">{book.title}</span>
                      </Link>
                    </h4>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span className="truncate">{book.author}</span>
                    </div>
                    <StarRating
                      rating={4}
                      readOnly
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>No recommendations available yet.</p>
              <p className="text-xs mt-1">Save your preferences to get personalized recommendations.</p>
            </div>
          )}
          
          <Button variant="outline" size="sm" className="w-full gap-1 mt-2">
            <BookOpen className="h-4 w-4" />
            <span>View More Books</span>
          </Button>
        </CardContent>
        <CardFooter className="pt-0">
          <Button 
            variant="secondary" 
            size="sm" 
            className="w-full gap-1"
            onClick={handleCreateView}
            disabled={isCreatingView}
          >
            <PlusCircle className="h-4 w-4" />
            <span>{isCreatingView ? "Creating..." : "Create Custom View"}</span>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}