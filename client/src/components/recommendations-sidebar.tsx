import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Book, GenreTaxonomy } from "@shared/schema";
import { TaxonomyItem } from "@/components/genre-selector";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { BookOpen, ThumbsUp, Eye, Plus, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { GenreSelector } from "@/components/genre-selector";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Separator } from "@/components/ui/separator";

export function RecommendationsSidebar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [createViewDialogOpen, setCreateViewDialogOpen] = useState(false);
  const [selectedTaxonomies, setSelectedTaxonomies] = useState<GenreTaxonomy[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch recommendations based on user's rating preferences
  const { data: recommendedBooks, isLoading } = useQuery<Book[]>({
    queryKey: ['/api/books'],
    staleTime: 60000,
  });

  // Fetch user's existing genre taxonomies for preferences
  const { data: userGenrePreferences = [], isLoading: isLoadingPreferences } = useQuery<any[]>({
    queryKey: ['/api/user-genre-taxonomies'],
    staleTime: 60000,
    enabled: !!user,
  });

  // Fetch all available genres for selection
  const { data: allGenreTaxonomies = [], isLoading: isLoadingGenres } = useQuery<GenreTaxonomy[]>({
    queryKey: ['/api/genres', { type: 'genre' }],
    staleTime: 60000,
    enabled: createViewDialogOpen,
  });
  
  // Initialize selected taxonomies when dialog opens with current preferences
  useEffect(() => {
    if (createViewDialogOpen && userGenrePreferences.length > 0) {
      // Extract taxonomy objects from user preferences
      const taxonomies = userGenrePreferences.map((pref: any) => pref.taxonomy);
      setSelectedTaxonomies(taxonomies);
    }
  }, [createViewDialogOpen, userGenrePreferences]);

  // Mutation for saving user genre preferences
  const saveGenrePreferencesMutation = useMutation({
    mutationFn: async (taxonomies: GenreTaxonomy[]) => {
      return apiRequest('POST', '/api/user-genre-taxonomies', 
        taxonomies.map((taxonomy, index) => ({
          taxonomyId: taxonomy.id,
          position: index,
        }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user-genre-taxonomies'] });
      toast({
        title: "Success",
        description: "Your genre preferences have been saved",
      });
      setCreateViewDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save genre preferences",
        variant: "destructive",
      });
    },
  });

  // Handle saving the user's genre preferences
  const handleSaveGenrePreferences = async () => {
    setIsSaving(true);
    try {
      await saveGenrePreferencesMutation.mutateAsync(selectedTaxonomies);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Card className="w-full h-full mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-primary" />
            Recommended for You
          </CardTitle>
          <CardDescription>
            Based on your rating preferences
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
          ) : (
            <>
              {recommendedBooks?.slice(0, 3).map((book) => (
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
          )}
          
          <Button variant="outline" size="sm" className="w-full gap-1 mt-2">
            <BookOpen className="h-4 w-4" />
            <span>View More Books</span>
          </Button>
        </CardContent>
      </Card>

      {/* Genre Preferences Section */}
      <Card className="w-full h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4 text-primary" />
            Genre Preferences
          </CardTitle>
          <CardDescription>
            Customize your reading recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoadingPreferences ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 pb-3 last:pb-0">
                    <Skeleton className="h-4 w-full" />
                  </div>
                ))}
              </>
            ) : userGenrePreferences?.length ? (
              <>
                <div className="space-y-2">
                  {userGenrePreferences.map((pref: any, index: number) => (
                    <div 
                      key={pref.id} 
                      className="flex items-center justify-between p-2 bg-muted rounded-md"
                    >
                      <span className="text-sm">{pref.taxonomy?.name || 'Unknown Genre'}</span>
                      <span className="text-xs text-muted-foreground">Position: {index + 1}</span>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full" 
                  onClick={() => setCreateViewDialogOpen(true)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Edit Genre Preferences
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You haven't set up your genre preferences yet. Create a view based on your preferred genres to get more tailored recommendations.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full" 
                  onClick={() => setCreateViewDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Genre View
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create Genre View Dialog */}
      <Dialog open={createViewDialogOpen} onOpenChange={setCreateViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Genre Preferences View</DialogTitle>
            <DialogDescription>
              Select and prioritize your favorite genres to get personalized book recommendations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <GenreSelector 
              mode="taxonomy"
              selected={selectedTaxonomies}
              onSelectionChange={(selected) => setSelectedTaxonomies(selected as GenreTaxonomy[])}
              label="Genre Preferences"
              helperText="Select and order genres to customize your reading recommendations. The order determines their importance."
              maxItems={10}
            />
          </div>
          
          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setCreateViewDialogOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveGenrePreferences}
              disabled={isSaving || selectedTaxonomies.length === 0}
            >
              {isSaving ? "Saving..." : "Save Preferences"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}