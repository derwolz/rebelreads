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
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Trash2,
  Plus,
  PenLine,
  PlusCircle,
  Move,
  GripVertical,
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

interface GenreView {
  id: number;
  userId: number;
  name: string;
  rank: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  genres?: ViewGenre[]; // Added from API response
}

export function GenrePreferencesSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Local state for views and genres
  const [views, setViews] = useState<GenreView[]>([]);
  const [activeViewId, setActiveViewId] = useState<number | null>(null);

  // State for the create/edit view dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editViewId, setEditViewId] = useState<number | null>(null);
  const [newViewName, setNewViewName] = useState("");
  const [isDefaultView, setIsDefaultView] = useState(false);

  // Sensors for drag and drop functionality
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Fetch existing genre views from the server
  const { data: viewsData, isLoading } = useQuery({
    queryKey: ["/api/genre-preferences"],
    queryFn: async () => {
      const response = await fetch("/api/genre-preferences");
      if (!response.ok) {
        throw new Error("Failed to fetch genre views");
      }
      return response.json();
    },
  });

  // Initialize local state when views are loaded
  useEffect(() => {
    if (viewsData?.views) {
      setViews(viewsData.views);

      // Set active view to the default view or the first view if available
      if (viewsData.views.length > 0) {
        const defaultView = viewsData.views.find((v: GenreView) => v.isDefault);
        setActiveViewId(defaultView ? defaultView.id : viewsData.views[0].id);
      }
    }
  }, [viewsData]);

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
    const currentGenres = activeViewGenres.map((g) => g.taxonomyId);

    // Find new items that aren't in the current selection
    const newGenres = selected.filter(
      (item) => !currentGenres.includes(item.taxonomyId),
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
  };

  // Handle removing a genre
  const handleRemoveGenre = (genreId: number) => {
    removeGenreMutation.mutate(genreId);
  };

  // Handle reordering of views
  const handleViewDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && views.length > 1) {
      // Get the old and new index
      const oldIndex = views.findIndex((item) => item.id === Number(active.id));
      const newIndex = views.findIndex((item) => item.id === Number(over.id));

      if (oldIndex !== -1 && newIndex !== -1) {
        // Create a new array with the new order
        const reordered = arrayMove(views, oldIndex, newIndex);

        // Update the local state immediately for better UX
        setViews(reordered);

        // Update the ranks for all views
        reordered.forEach((view, idx) => {
          updateViewMutation.mutate({
            id: view.id,
            rank: idx + 1,
          });
        });
      }
    }
  };

  // Sortable view component
  interface SortableViewProps {
    id: number;
    value: string;
    isDefault: boolean;
    children: React.ReactNode;
  }

  function SortableView({ id, value, isDefault, children }: SortableViewProps) {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn("flex items-center", isDragging && "opacity-50 z-10")}
      >
        <button
          type="button"
          className="cursor-grab hover:text-primary mr-1"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <TabsTrigger value={value} className="relative">
          {children}
          {isDefault && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full -mt-0.5 -mr-0.5"></span>
          )}
        </TabsTrigger>
      </div>
    );
  }

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
                  Create First View
                </Button>
              </DialogTrigger>
              <DialogContent>
                {/* Same dialog content as above */}
                <DialogHeader>
                  <DialogTitle>Create New Genre View</DialogTitle>
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
                    disabled={createViewMutation.isPending}
                  >
                    {createViewMutation.isPending
                      ? "Creating..."
                      : "Create View"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        ) : (
          <>
            <Tabs
              value={activeViewId?.toString() || ""}
              onValueChange={(value) => setActiveViewId(parseInt(value))}
              className="mb-6"
            >
              <div className="mb-4">
                <div className="mb-2 text-sm text-muted-foreground">
                  Drag and drop to reorder your views.
                </div>
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleViewDragEnd}
                >
                  <TabsList className="flex flex-wrap gap-1">
                    <SortableContext
                      items={views.map((view) => view.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {views.map((view) => (
                        <SortableView
                          key={view.id}
                          id={view.id}
                          value={view.id.toString()}
                          isDefault={view.isDefault}
                        >
                          {view.name}
                        </SortableView>
                      ))}
                    </SortableContext>
                  </TabsList>
                </DndContext>
              </div>

              {views.map((view) => (
                <TabsContent
                  key={view.id}
                  value={view.id.toString()}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium">{view.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {view.isDefault ? "Default View • " : ""}
                        {view.genres?.length || 0} genres
                      </p>
                    </div>
                    <div className="flex gap-2">
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

                  <div className="bg-muted p-4 rounded-md">
  
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
