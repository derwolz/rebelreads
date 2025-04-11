import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { GenreSelector, TaxonomyItem } from "@/components/genre-selector";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableGenre } from "@/components/sortable-genre";
import { Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function GenrePreferencesSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for the selected tab
  const [activeTab, setActiveTab] = useState<"preferred" | "additional">("preferred");
  
  // Sensors for drag and drop functionality
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch existing genre preferences from the server
  const { data: preferences, isLoading } = useQuery({
    queryKey: ["/api/genre-preferences"],
    queryFn: async () => {
      const response = await fetch("/api/genre-preferences");
      if (!response.ok) {
        throw new Error("Failed to fetch genre preferences");
      }
      return response.json();
    }
  });

  // Local state for preferred and additional genres
  const [preferredGenres, setPreferredGenres] = useState<TaxonomyItem[]>([]);
  const [additionalGenres, setAdditionalGenres] = useState<TaxonomyItem[]>([]);

  // Initialize local state when preferences are loaded
  useEffect(() => {
    if (preferences) {
      setPreferredGenres(preferences.preferredGenres || []);
      setAdditionalGenres(preferences.additionalGenres || []);
    }
  }, [preferences]);

  // Mutation to save genre preferences changes
  const saveMutation = useMutation({
    mutationFn: async (data: {
      preferredGenres: TaxonomyItem[],
      additionalGenres: TaxonomyItem[]
    }) => {
      const response = await apiRequest("POST", "/api/genre-preferences", data);
      if (!response.ok) {
        throw new Error("Failed to save genre preferences");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/genre-preferences"] });
      toast({
        title: "Preferences saved",
        description: "Your genre preferences have been updated successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle reordering of genres
  const handleDragEnd = (event: DragEndEvent, type: "preferred" | "additional") => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      if (type === "preferred") {
        setPreferredGenres(items => {
          const oldIndex = items.findIndex(item => item.taxonomyId === active.id);
          const newIndex = items.findIndex(item => item.taxonomyId === over.id);
          
          // Update ranks after reordering
          const reordered = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
            ...item,
            rank: idx + 1
          }));
          
          return reordered;
        });
      } else {
        setAdditionalGenres(items => {
          const oldIndex = items.findIndex(item => item.taxonomyId === active.id);
          const newIndex = items.findIndex(item => item.taxonomyId === over.id);
          
          // Update ranks after reordering
          const reordered = arrayMove(items, oldIndex, newIndex).map((item, idx) => ({
            ...item,
            rank: idx + 1
          }));
          
          return reordered;
        });
      }
    }
  };

  // Handle saving changes
  const handleSave = () => {
    saveMutation.mutate({
      preferredGenres,
      additionalGenres
    });
  };

  // Handle removing a genre
  const handleRemoveGenre = (taxonomyId: number, type: "preferred" | "additional") => {
    if (type === "preferred") {
      setPreferredGenres(items => {
        const newItems = items.filter(item => item.taxonomyId !== taxonomyId);
        // Update ranks after removal
        return newItems.map((item, idx) => ({
          ...item,
          rank: idx + 1
        }));
      });
    } else {
      setAdditionalGenres(items => {
        const newItems = items.filter(item => item.taxonomyId !== taxonomyId);
        // Update ranks after removal
        return newItems.map((item, idx) => ({
          ...item,
          rank: idx + 1
        }));
      });
    }
  };

  // Handle selection of new genres
  const handleSelectionChange = (selected: TaxonomyItem[], type: "preferred" | "additional") => {
    if (type === "preferred") {
      setPreferredGenres(selected.map((item, idx) => ({
        ...item,
        rank: idx + 1
      })));
    } else {
      setAdditionalGenres(selected.map((item, idx) => ({
        ...item,
        rank: idx + 1
      })));
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
        <CardTitle>Genre Preferences</CardTitle>
        <CardDescription>
          Customize how genres are prioritized in your reading experience
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="preferred" value={activeTab} onValueChange={(value) => setActiveTab(value as "preferred" | "additional")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preferred">Primary Preferences</TabsTrigger>
            <TabsTrigger value="additional">Additional Suggestions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preferred" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Choose and order the genres you prefer most. These will determine the primary organization of your content.
              Drag and drop to change the order of importance.
            </div>
            
            <div className="my-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, "preferred")}
              >
                <SortableContext
                  items={preferredGenres.map(item => item.taxonomyId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {preferredGenres.map((genre) => (
                      <SortableGenre
                        key={genre.taxonomyId}
                        id={genre.taxonomyId}
                        label={genre.name}
                        onRemove={() => handleRemoveGenre(genre.taxonomyId, "preferred")}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">Add Primary Genres</h3>
              <GenreSelector
                mode="taxonomy"
                selected={preferredGenres}
                onSelectionChange={(selected) => handleSelectionChange(selected as TaxonomyItem[], "preferred")}
                maxItems={8}
                helperText="Select genres to customize your primary content view"
              />
            </div>
          </TabsContent>
          
          <TabsContent value="additional" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Select additional genres you're interested in for more diverse recommendations.
              These genres will be used for secondary suggestions.
            </div>
            
            <div className="my-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, "additional")}
              >
                <SortableContext
                  items={additionalGenres.map(item => item.taxonomyId)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {additionalGenres.map((genre) => (
                      <SortableGenre
                        key={genre.taxonomyId}
                        id={genre.taxonomyId}
                        label={genre.name}
                        onRemove={() => handleRemoveGenre(genre.taxonomyId, "additional")}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
            
            <div className="bg-muted p-4 rounded-md">
              <h3 className="font-medium mb-2">Add Additional Genres</h3>
              <GenreSelector
                mode="taxonomy"
                selected={additionalGenres}
                onSelectionChange={(selected) => handleSelectionChange(selected as TaxonomyItem[], "additional")}
                maxItems={12}
                helperText="Select genres to diversify your recommendations"
              />
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}