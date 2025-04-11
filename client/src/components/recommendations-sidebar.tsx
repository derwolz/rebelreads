import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Book, InsertUserPreferenceTaxonomy, PreferenceTaxonomy } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { BookOpen, ThumbsUp, PlusCircle, Save, Settings } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { GenreSelector } from "@/components/genre-selector";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Define interface for preference taxonomy items with position and weight
interface PreferenceTaxonomyItem {
  id: number;
  name: string;
  taxonomyType: string;
  position: number;
  weight: number;
}

// Import the TaxonomyItem type from the GenreSelector component
import { TaxonomyItem } from "@/components/genre-selector";

export function RecommendationsSidebar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for managing selected taxonomies
  const [selectedTaxonomies, setSelectedTaxonomies] = useState<TaxonomyItem[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingView, setIsCreatingView] = useState(false);

  // Fetch recommendations based on user's rating preferences
  const { data: recommendedBooks, isLoading } = useQuery<Book[]>({
    queryKey: ['/api/books'],
    staleTime: 60000,
  });

  // Fetch all available preference taxonomies
  const { data: availableTaxonomies, isLoading: isLoadingTaxonomies } = useQuery<PreferenceTaxonomy[]>({
    queryKey: ['/api/preferences/taxonomies'],
    enabled: !!user?.id,
  });

  // Fetch user preference taxonomies
  const { data: userPreferenceTaxonomies, isLoading: isLoadingPreferences } = useQuery<PreferenceTaxonomyItem[]>({
    queryKey: ['/api/user/preference-taxonomies'],
    enabled: !!user?.id,
  });

  // Load user preferences when available
  useEffect(() => {
    if (userPreferenceTaxonomies?.length) {
      // Convert to TaxonomyItem format for the genre selector
      const convertedTaxonomies = userPreferenceTaxonomies.map(tax => ({
        id: tax.id,
        taxonomyId: tax.id,
        rank: tax.position || 0,
        type: (tax.taxonomyType === 'genre' ? 'genre' : 
               tax.taxonomyType === 'subgenre' ? 'subgenre' : 
               tax.taxonomyType === 'theme' ? 'theme' : 'trope') as "genre" | "subgenre" | "theme" | "trope",
        name: tax.name
      }));
      setSelectedTaxonomies(convertedTaxonomies);
      
      // Extract genre names for simple mode
      const genreNames = userPreferenceTaxonomies
        .filter(tax => tax.taxonomyType === 'genre')
        .map(tax => tax.name);
      setSelectedGenres(genreNames);
    } else if (user?.favoriteGenres?.length) {
      // Fallback to user's favorite genres if no taxonomies
      setSelectedGenres(user.favoriteGenres);
    }
  }, [userPreferenceTaxonomies, user]);

  // Save user preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (data: { genreNames: string[] }) => {
      return await fetch("/api/preferences/update-favorites", {
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
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user/preference-taxonomies'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save preferences. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Create user preference view mutation
  const createViewMutation = useMutation({
    mutationFn: async () => {
      // Map selected genres to taxonomy IDs if available
      const taxonomyIds = availableTaxonomies
        ? selectedGenres.map(genreName => {
            const taxonomy = availableTaxonomies.find(t => t.name === genreName);
            return taxonomy ? taxonomy.id : 0;
          }).filter(id => id !== 0)
        : [];
        
      return await fetch("/api/preferences/create-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          taxonomyIds,
          // Add default position and weight
          defaultPosition: 0,
          defaultWeight: 1.0
        }),
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
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/user/preference-taxonomies'] });
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

  // Handle saving preferences
  const handleSavePreferences = async () => {
    setIsSaving(true);
    try {
      await savePreferencesMutation.mutateAsync({ genreNames: selectedGenres });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle creating a view
  const handleCreateView = async () => {
    if (selectedGenres.length === 0) {
      toast({
        title: "No genres selected",
        description: "Please select at least one genre to create a view.",
        variant: "destructive"
      });
      return;
    }
    
    setIsCreatingView(true);
    try {
      await createViewMutation.mutateAsync();
    } catch (error) {
      setIsCreatingView(false);
    }
  };

  // Helper function to handle the type conversion for GenreSelector
  const handleGenreSelectionChange = (selected: string[] | TaxonomyItem[]) => {
    // When in simple mode, we'll always get string[]
    if (Array.isArray(selected) && selected.length > 0 && typeof selected[0] === 'string') {
      setSelectedGenres(selected as string[]);
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
              onSelectionChange={handleGenreSelectionChange}
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