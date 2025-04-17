import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { GenreSelector, TaxonomyItem } from "@/components/genre-selector";
import {
  Trash2,
  Plus,
  PenLine,
  PlusCircle,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// Define types for the new schema
interface ViewGenre {
  id: number;
  viewId: number;
  taxonomyId: number;
  type: string;
  rank: number;
  createdAt: string;
  name?: string; // Added for UI display
}

interface GenreMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface GenreView {
  id: number;
  userId: number;
  name: string;
  rank: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  genres?: ViewGenre[]; // Added from API response
  genreMeta?: GenreMeta; // Metadata for pagination
}

export function GenrePreferencesSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local state for views and genres
  const [views, setViews] = useState<GenreView[]>([]);
  const [activeViewId, setActiveViewId] = useState<number | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20); // Load 20 genres at a time
  const [hasMoreGenres, setHasMoreGenres] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // Ref for intersection observer target
  const observerRef = useRef<HTMLDivElement>(null);

  // State for the create/edit view dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editViewId, setEditViewId] = useState<number | null>(null);
  const [newViewName, setNewViewName] = useState("");
  const [isDefaultView, setIsDefaultView] = useState(false);

  // Fetch existing genre views from the server with pagination
  const { data: viewsData, isLoading } = useQuery({
    queryKey: ["/api/genre-preferences", { page, limit }],
    queryFn: async () => {
      const response = await fetch(`/api/genre-preferences?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error("Failed to fetch genre views");
      }
      return response.json();
    },
  });

  // Function to load more genres for the active view
  const loadMoreGenres = async () => {
    if (!activeViewId || !activeView?.genreMeta) return;
    
    // Don't load more if we're already loading or if there are no more to load
    if (isLoadingMore || page >= (activeView.genreMeta.pages - 1)) return;
    
    setIsLoadingMore(true);
    try {
      // Make a direct request to fetch the next page of genres for the active view
      const nextPage = page + 1;
      const response = await fetch(`/api/genre-preferences?page=${nextPage}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error("Failed to load more genres");
      }
      
      const data = await response.json();
      
      // Update the views with the new genres loaded for the active view
      setViews(prevViews => {
        return prevViews.map(view => {
          if (view.id === activeViewId) {
            const matchingView = data.views.find((v: GenreView) => v.id === activeViewId);
            // Combine previously loaded genres with new ones if we found a matching view
            if (matchingView && matchingView.genres) {
              return {
                ...view,
                genres: [...(view.genres || []), ...(matchingView.genres || [])],
                genreMeta: matchingView.genreMeta // Update metadata
              };
            }
          }
          return view;
        });
      });
      
      // Update the page number
      setPage(nextPage);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load more genres",
        variant: "destructive",
      });
      console.error("Error loading more genres:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Set up the Intersection Observer to trigger loading more data
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreGenres && !isLoadingMore) {
          loadMoreGenres();
        }
      },
      { threshold: 0.1 }
    );
    
    if (observerRef.current) {
      observer.observe(observerRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [hasMoreGenres, isLoadingMore, activeViewId]);

  // Initialize local state when views are loaded
  useEffect(() => {
    if (viewsData?.views) {
      // Check if we're loading the first page
      if (page === 0) {
        setViews(viewsData.views);
      }

      // Only set the active view if it hasn't been set yet or if the current active view doesn't exist anymore
      if (
        viewsData.views.length > 0 && 
        (
          activeViewId === null || 
          !viewsData.views.some((v) => v.id === activeViewId)
        )
      ) {
        const defaultView = viewsData.views.find((v) => v.isDefault);
        setActiveViewId(defaultView ? defaultView.id : viewsData.views[0].id);
      }
      
      // Update hasMoreGenres based on metadata
      if (activeViewId) {
        const activeView = viewsData.views.find((v) => v.id === activeViewId);
        if (activeView && activeView.genreMeta) {
          const { total, limit, page: currentPage } = activeView.genreMeta;
          const hasMore = limit > 0 && total > (currentPage + 1) * limit;
          setHasMoreGenres(hasMore);
        }
      }
    }
  }, [viewsData, activeViewId, page, limit]);

  // Get the currently active view and its genres
  const activeView = views.find((v) => v.id === activeViewId);
  const activeViewGenres = activeView?.genres || [];

  // Handle the reordering of genres in a view with optimistic updates
  const handleTaxonomiesReorder = (viewId: number, reorderedTaxonomies: TaxonomyItem[]) => {
    if (!viewId) return;
    
    // Find the current view and store its genres as backup in case we need to revert
    const currentView = views.find(v => v.id === viewId);
    const backupGenres = currentView?.genres ? [...currentView.genres] : [];
    
    // Find the view index for optimistic update
    const viewIndex = views.findIndex(v => v.id === viewId);
    if (viewIndex === -1) return;
    
    // Make an optimistic update to the local state
    const updatedViews = [...views];
    if (currentView && updatedViews[viewIndex]) {
      // Update the genres with the new ordering in the local state
      updatedViews[viewIndex] = {
        ...currentView,
        genres: reorderedTaxonomies.map((tax, idx) => ({
          id: tax.id as number,
          viewId: viewId,
          taxonomyId: tax.taxonomyId,
          type: tax.type,
          rank: idx + 1,
          createdAt: new Date().toISOString(),
          name: tax.name
        }))
      };
      
      // Apply optimistic update
      setViews(updatedViews);
    }
    
    // Track success of all rank update operations
    let updatePromises: Promise<any>[] = [];
    let successCount = 0;
    let failureCount = 0;
    
    // For each reordered taxonomy, update its rank in the database
    reorderedTaxonomies.forEach((taxonomy, idx) => {
      if (taxonomy.id) {
        // Create a promise that resolves or rejects based on the mutation outcome
        const updatePromise = new Promise((resolve, reject) => {
          updateGenreRankMutation.mutate(
            {
              genreId: taxonomy.id as number,
              rank: idx + 1,
            },
            {
              onSuccess: () => {
                successCount++;
                resolve(true);
              },
              onError: (error) => {
                failureCount++;
                reject(error);
              }
            }
          );
        });
        
        updatePromises.push(updatePromise);
      }
    });
    
    // Wait for all updates to complete
    Promise.allSettled(updatePromises).then((results) => {
      // If any updates failed, revert to the backup
      if (failureCount > 0) {
        // Revert the view to its original state
        const revertedViews = [...views];
        if (viewIndex !== -1 && revertedViews[viewIndex]) {
          revertedViews[viewIndex] = {
            ...currentView!,
            genres: backupGenres
          };
          setViews(revertedViews);
        }
        
        // Show an error toast
        toast({
          title: "Error reordering taxonomies",
          description: `${failureCount} out of ${updatePromises.length} updates failed. The order has been reverted.`,
          variant: "destructive"
        });
      }
    });
  };

  // Mutations
  // Create a new view
  const createViewMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      rank: number;
      isDefault: boolean;
    }) => {
      const response = await apiRequest("POST", "/api/genre-views", data);
      if (!response.ok) {
        throw new Error("Failed to create genre view");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/genre-preferences"] });
      setIsCreateDialogOpen(false);
      setNewViewName("");
      setIsDefaultView(false);
      toast({
        title: "View created",
        description: "Your new genre view has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update an existing view
  const updateViewMutation = useMutation({
    mutationFn: async (data: {
      id: number;
      name?: string;
      rank?: number;
      isDefault?: boolean;
    }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/genre-views/${data.id}`,
        { name: data.name, rank: data.rank, isDefault: data.isDefault },
      );
      if (!response.ok) {
        throw new Error("Failed to update genre view");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/genre-preferences"] });
      setIsCreateDialogOpen(false);
      setNewViewName("");
      setIsDefaultView(false);
      setIsEditMode(false);
      setEditViewId(null);
      toast({
        title: "View updated",
        description: "Your genre view has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete a view
  const deleteViewMutation = useMutation({
    mutationFn: async (viewId: number) => {
      const response = await apiRequest("DELETE", `/api/genre-views/${viewId}`);
      if (!response.ok) {
        throw new Error("Failed to delete genre view");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/genre-preferences"] });
      toast({
        title: "View deleted",
        description: "Your genre view has been deleted successfully.",
      });

      // If we deleted the active view, select another view
      if (views.length > 0 && activeViewId) {
        const remainingViews = views.filter((v) => v.id !== activeViewId);
        if (remainingViews.length > 0) {
          setActiveViewId(remainingViews[0].id);
        } else {
          setActiveViewId(null);
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Add a genre to the view
  const addGenreMutation = useMutation({
    mutationFn: async (data: {
      viewId: number;
      taxonomyId: number;
      type: string;
      rank: number;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/genre-views/${data.viewId}/genres`,
        { taxonomyId: data.taxonomyId, type: data.type, rank: data.rank },
      );
      if (!response.ok) {
        throw new Error("Failed to add genre to view");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/genre-preferences"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove a genre from the view
  const removeGenreMutation = useMutation({
    mutationFn: async (genreId: number) => {
      const response = await apiRequest(
        "DELETE",
        `/api/view-genres/${genreId}`,
      );
      if (!response.ok) {
        throw new Error("Failed to remove genre from view");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/genre-preferences"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update genre ranks
  const updateGenreRankMutation = useMutation({
    mutationFn: async (data: { genreId: number; rank: number }) => {
      const response = await apiRequest(
        "PATCH",
        `/api/view-genres/${data.genreId}/rank`,
        { rank: data.rank },
      );
      if (!response.ok) {
        throw new Error("Failed to update genre rank");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/genre-preferences"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handler functions
  // Create/edit view
  const handleSaveView = () => {
    if (newViewName.trim() === "") {
      toast({
        title: "Invalid name",
        description: "Please enter a valid name for the view.",
        variant: "destructive",
      });
      return;
    }

    if (isEditMode && editViewId) {
      updateViewMutation.mutate({
        id: editViewId,
        name: newViewName,
        isDefault: isDefaultView,
      });
    } else {
      // For a new view, calculate the next rank
      const nextRank =
        views.length > 0 ? Math.max(...views.map((v) => v.rank)) + 1 : 1;

      createViewMutation.mutate({
        name: newViewName,
        rank: nextRank,
        isDefault: isDefaultView,
      });
    }
  };

  // Delete view
  const handleDeleteView = () => {
    if (activeViewId) {
      if (
        confirm(
          "Are you sure you want to delete this view? This action cannot be undone.",
        )
      ) {
        deleteViewMutation.mutate(activeViewId);
      }
    }
  };

  // Open edit dialog
  const handleEditView = () => {
    if (activeView) {
      setIsEditMode(true);
      setEditViewId(activeView.id);
      setNewViewName(activeView.name);
      setIsDefaultView(activeView.isDefault);
      setIsCreateDialogOpen(true);
    }
  };

  // Handle genre selection
  const handleGenreSelectionChange = (selected: TaxonomyItem[]) => {
    if (!activeViewId) return;

    // Find the currently selected items
    const currentGenres = activeViewGenres.map((g) => ({
      id: g.id,
      taxonomyId: g.taxonomyId
    }));
    
    // Find new items that aren't in the current selection
    const newGenres = selected.filter(
      (item) => !currentGenres.some(g => g.taxonomyId === item.taxonomyId),
    );

    // Find removed items that were in the current selection but not in the new selection
    const removedGenres = currentGenres.filter(
      (item) => !selected.some(s => s.taxonomyId === item.taxonomyId)
    );

    // Add each new genre to the view
    newGenres.forEach((genre) => {
      addGenreMutation.mutate({
        viewId: activeViewId,
        taxonomyId: genre.taxonomyId,
        type: genre.type,
        rank: activeViewGenres.length + 1,
      });
    });
    
    // Remove each deleted genre from the view
    removedGenres.forEach((genre) => {
      if (genre.id) {
        removeGenreMutation.mutate(genre.id);
      }
    });
  };

  // Handle removing a genre
  const handleRemoveGenre = (genreId: number) => {
    removeGenreMutation.mutate(genreId);
  };

  // Reset the dialog when it's closed
  const handleDialogChange = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (!open) {
      setIsEditMode(false);
      setEditViewId(null);
      setNewViewName("");
      setIsDefaultView(false);
    }
  };

  // Loading states
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Genre Preferences</CardTitle>
            <CardDescription>
              Create and customize multiple genre views for your reading
              experience
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogChange}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditMode(false);
                  setNewViewName("");
                  setIsDefaultView(false);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New View
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isEditMode ? "Edit Genre View" : "Create New Genre View"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="viewName">View Name</Label>
                  <Input
                    id="viewName"
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder="Enter a name for this view"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isDefault"
                    checked={isDefaultView}
                    onCheckedChange={setIsDefaultView}
                  />
                  <Label htmlFor="isDefault">Make this my default view</Label>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="submit"
                  onClick={handleSaveView}
                  disabled={
                    createViewMutation.isPending || updateViewMutation.isPending
                  }
                >
                  {createViewMutation.isPending || updateViewMutation.isPending
                    ? "Saving..."
                    : isEditMode
                      ? "Update View"
                      : "Create View"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {views.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              You don't have any genre views yet. Create your first view to get
              started.
            </p>
            <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Genre View
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        ) : (
          <>
            <Tabs
              defaultValue={activeViewId?.toString()}
              onValueChange={(value) => setActiveViewId(parseInt(value))}
              value={activeViewId?.toString()}
            >
              <TabsList className="flex overflow-x-auto pb-1">
                {views.map((view) => (
                  <TabsTrigger
                    key={view.id}
                    value={view.id.toString()}
                    className="whitespace-nowrap mr-1"
                  >
                    {view.name}
                    {view.isDefault && (
                      <span className="ml-1 text-[8px] text-primary">●</span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>

              {views.map((view) => (
                <TabsContent key={view.id} value={view.id.toString()}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-lg font-semibold">{view.name}</div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEditView}
                      >
                        <PenLine className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteView}
                        disabled={views.length === 1} // Prevent deleting the last view
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>



                  <div className="my-4">
                    <div className="space-y-2">
                      {view.genres?.length === 0 && (
                        <div className="p-4 border border-dashed rounded-md text-center text-muted-foreground">
                          <p>No genres added to this view yet</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="rounded-md">
  
                    <GenreSelector
                      mode="taxonomy"
                      selected={
                        view.genres?.map((g) => ({
                          id: g.id, // Pass the ID for drag-and-drop reordering
                          taxonomyId: g.taxonomyId,
                          type: g.type as
                            | "genre"
                            | "subgenre"
                            | "theme"
                            | "trope",
                          rank: g.rank,
                          name: g.name || "",
                        })) || []
                      }
                      onSelectionChange={(selected) =>
                        handleGenreSelectionChange(selected as TaxonomyItem[])
                      }
                      onReorder={(reordered) => 
                        handleTaxonomiesReorder(view.id, reordered as TaxonomyItem[])
                      }
                      maxItems={20}
                      restrictLimits={false}
                      helperText="Select genres to add to this view - no limits on selections. Drag to reorder."
                    />
                    
                    {/* Invisible element for intersection observer to detect scrolling to bottom */}
                    {view.genreMeta && hasMoreGenres && (
                      <div 
                        ref={observerRef}
                        className="h-4 mt-2"
                      />
                    )}
                    
                    {/* Loading indicator - only shown when loading more genres */}
                    {isLoadingMore && (
                      <div className="flex justify-center items-center py-2 text-sm text-muted-foreground">
                        <span className="animate-pulse">Loading more genres...</span>
                      </div>
                    )}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}