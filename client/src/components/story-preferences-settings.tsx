import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MoveVertical, Info, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StoryPreferenceSelector } from "@/components/story-preference-selector";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Helper function to calculate weight using the formula 1/(1+ln(rank))
function calculateWeight(rank: number): number {
  return 1 / (1 + Math.log(rank));
}

// Helper component for each sortable item
function SortableItem({ 
  id, 
  rank,
  name,
  type
}: { 
  id: string;
  rank: number;
  name: string;
  type: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  // Get displayable type name
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  
  // Calculate weight with the formula 1/(1+ln(rank))
  const weight = calculateWeight(rank);
  const weightPercentage = Math.round(weight * 100);
  
  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="flex items-center p-3 mb-2 bg-card border rounded-md shadow-sm hover:shadow-md transition-all group"
    >
      <div 
        {...attributes}
        {...listeners}
        className="mr-2 p-1.5 cursor-grab rounded hover:bg-muted"
      >
        <MoveVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1">
        <div className="font-medium">{name}</div>
        <div className="text-xs text-muted-foreground">{typeLabel}</div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end">
          <div className="text-sm font-medium text-primary">{weightPercentage}%</div>
          <div className="text-xs text-muted-foreground">Rank: {rank}</div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Weight is calculated as 1/(1+ln(rank))</p>
              <p>Higher ranks (lower numbers) have more influence.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

interface StoryPreferencesSettingsProps {
  isWizard?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function StoryPreferencesSettings({
  isWizard = false,
  onComplete,
  onSkip,
}: StoryPreferencesSettingsProps) {
  // State for selected items
  const [selectedGenres, setSelectedGenres] = useState<Array<{id: number, name: string}>>([]);
  const [selectedSubgenres, setSelectedSubgenres] = useState<Array<{id: number, name: string}>>([]);
  const [selectedThemes, setSelectedThemes] = useState<Array<{id: number, name: string}>>([]);
  const [selectedTropes, setSelectedTropes] = useState<Array<{id: number, name: string}>>([]);
  
  // State for parent genre (used for filtering subgenres)
  const [parentGenreId, setParentGenreId] = useState<number | null>(null);
  
  // State for combined ranking
  const [combinedRanking, setCombinedRanking] = useState<Array<{
    id: string; // format: "type_id" e.g., "genre_1"
    itemId: number;
    type: string;
    name: string;
    rank: number;
  }>>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Define type for the response from the API
  interface StoryPreferencesResponse {
    id?: number;
    userId?: number;
    genres?: Array<{id: number, rank: number}>;
    subgenres?: Array<{id: number, rank: number}>;
    themes?: Array<{id: number, rank: number}>;
    tropes?: Array<{id: number, rank: number}>;
    combinedRanking?: Array<{id: number, type: string, rank: number, weight: number}>;
    createdAt?: string;
    updatedAt?: string;
  }

  // Query for existing preferences
  const { data: preferencesData, isLoading: isLoadingPreferences } = useQuery<StoryPreferencesResponse>({
    queryKey: ['/api/story-preferences'],
    staleTime: 60000,
  });
  
  // Combine all items into a single ranked list when selections change
  useEffect(() => {
    const allItems: Array<{id: string; itemId: number; type: string; name: string;}> = [
      ...selectedGenres.map(item => ({id: `genre_${item.id}`, itemId: item.id, type: 'genre', name: item.name})),
      ...selectedSubgenres.map(item => ({id: `subgenre_${item.id}`, itemId: item.id, type: 'subgenre', name: item.name})),
      ...selectedThemes.map(item => ({id: `theme_${item.id}`, itemId: item.id, type: 'theme', name: item.name})),
      ...selectedTropes.map(item => ({id: `trope_${item.id}`, itemId: item.id, type: 'trope', name: item.name})),
    ];
    
    // If combinedRanking has fewer items, add new ones at the end
    if (allItems.length > combinedRanking.length) {
      const existingIds = new Set(combinedRanking.map(item => item.id));
      const newItems = allItems.filter(item => !existingIds.has(item.id));
      
      // Assign ranks starting from the end of the current list
      const newRankedItems = newItems.map((item, index) => ({
        ...item,
        rank: combinedRanking.length + index + 1
      }));
      
      setCombinedRanking([...combinedRanking, ...newRankedItems]);
    } 
    // If combinedRanking has items that are no longer selected, remove them
    else if (allItems.length < combinedRanking.length) {
      const validIds = new Set(allItems.map(item => item.id));
      const filteredRanking = combinedRanking.filter(item => validIds.has(item.id));
      
      // Reorder ranks to be consecutive
      const reorderedRanking = filteredRanking.map((item, index) => ({
        ...item,
        rank: index + 1
      }));
      
      setCombinedRanking(reorderedRanking);
    }
  }, [selectedGenres, selectedSubgenres, selectedThemes, selectedTropes]);
  
  // Load existing preferences from API
  useEffect(() => {
    if (preferencesData && !isLoadingPreferences) {
      // Parse and set selected items from API data
      if (preferencesData.genres && Array.isArray(preferencesData.genres)) {
        // We need to fetch the actual genre names since the API only returns IDs
        fetchGenreNames(preferencesData.genres, 'genre');
      }
      
      if (preferencesData.subgenres && Array.isArray(preferencesData.subgenres)) {
        fetchGenreNames(preferencesData.subgenres, 'subgenre');
      }
      
      if (preferencesData.themes && Array.isArray(preferencesData.themes)) {
        fetchGenreNames(preferencesData.themes, 'theme');
      }
      
      if (preferencesData.tropes && Array.isArray(preferencesData.tropes)) {
        fetchGenreNames(preferencesData.tropes, 'trope');
      }
      
      // Set combined ranking if available
      if (preferencesData.combinedRanking && Array.isArray(preferencesData.combinedRanking)) {
        // We'll initially use the existing combined ranking, but then update it when we have the names
        const initialRanking = preferencesData.combinedRanking.map((item: any) => ({
          id: `${item.type}_${item.id}`,
          itemId: item.id,
          type: item.type,
          name: 'Loading...', // Will be updated when we have genre names
          rank: item.rank
        }));
        
        setCombinedRanking(initialRanking);
      }
    }
  }, [preferencesData, isLoadingPreferences]);
  
  // Helper function to fetch genre names by IDs
  const fetchGenreNames = async (items: Array<{id: number, rank: number}>, type: string) => {
    try {
      const promises = items.map(async (item) => {
        const response = await fetch(`/api/genres/${item.id}`);
        if (!response.ok) throw new Error(`Failed to fetch ${type} details`);
        const data = await response.json();
        return { id: item.id, name: data.name };
      });
      
      const results = await Promise.all(promises);
      
      // Update the corresponding state
      switch (type) {
        case 'genre':
          setSelectedGenres(results);
          if (results.length > 0 && !parentGenreId) {
            setParentGenreId(results[0].id);
          }
          break;
        case 'subgenre':
          setSelectedSubgenres(results);
          break;
        case 'theme':
          setSelectedThemes(results);
          break;
        case 'trope':
          setSelectedTropes(results);
          break;
      }
      
      // Update names in combined ranking
      updateCombinedRankingNames(results, type);
      
    } catch (error) {
      console.error(`Error fetching ${type} names:`, error);
      toast({
        title: "Error",
        description: `Failed to load your ${type} preferences. Please try again.`,
        variant: "destructive",
      });
    }
  };
  
  // Update names in the combined ranking
  const updateCombinedRankingNames = (items: Array<{id: number, name: string}>, type: string) => {
    setCombinedRanking(prev => prev.map(rankItem => {
      if (rankItem.type === type) {
        const matchingItem = items.find(item => item.id === rankItem.itemId);
        if (matchingItem) {
          return { ...rankItem, name: matchingItem.name };
        }
      }
      return rankItem;
    }));
  };
  
  // Handle drag end - update item ranks
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = combinedRanking.findIndex(item => item.id === active.id);
      const newIndex = combinedRanking.findIndex(item => item.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newRanking = [...combinedRanking];
        const movedItem = newRanking.splice(oldIndex, 1)[0];
        newRanking.splice(newIndex, 0, movedItem);
        
        // Update ranks to match new positions
        const updatedRanking = newRanking.map((item, index) => ({
          ...item,
          rank: index + 1
        }));
        
        setCombinedRanking(updatedRanking);
      }
    }
  };
  
  // Prepare data for submission
  const prepareSubmissionData = () => {
    // Extract and group by type
    const genres = combinedRanking
      .filter(item => item.type === 'genre')
      .map(item => ({ id: item.itemId, rank: item.rank }));
      
    const subgenres = combinedRanking
      .filter(item => item.type === 'subgenre')
      .map(item => ({ id: item.itemId, rank: item.rank }));
      
    const themes = combinedRanking
      .filter(item => item.type === 'theme')
      .map(item => ({ id: item.itemId, rank: item.rank }));
      
    const tropes = combinedRanking
      .filter(item => item.type === 'trope')
      .map(item => ({ id: item.itemId, rank: item.rank }));
      
    // Combine for API submission
    return {
      genres,
      subgenres,
      themes,
      tropes,
      combinedRanking: combinedRanking.map(item => ({
        id: item.itemId,
        type: item.type,
        rank: item.rank,
      }))
    };
  };
  
  // Mutation to save preferences
  const { mutate: savePreferences, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      const data = prepareSubmissionData();
      return apiRequest('POST', '/api/story-preferences', data);
    },
    onSuccess: () => {
      toast({
        title: "Preferences Saved",
        description: "Your story preferences have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/story-preferences'] });
      
      // Call onComplete callback if provided (for wizard mode)
      if (onComplete) {
        onComplete();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
      console.error("Error saving preferences:", error);
    },
  });
  
  // Check if selections meet the minimum requirements
  const isValid = useMemo(() => {
    return (
      selectedGenres.length >= 1 &&
      selectedThemes.length >= 1 &&
      selectedTropes.length >= 1
    );
  }, [selectedGenres.length, selectedThemes.length, selectedTropes.length]);
  
  // Handle save
  const handleSave = () => {
    if (!isValid) {
      toast({
        title: "Validation Error",
        description: "Please select at least one genre, one theme, and one trope.",
        variant: "destructive",
      });
      return;
    }
    
    savePreferences();
  };
  
  // Handle skip
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };
  
  // Main content
  const content = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <StoryPreferenceSelector 
          type="genre"
          selectedItems={selectedGenres}
          onChange={(items) => {
            setSelectedGenres(items);
            // Update parent genre for subgenre filtering
            if (items.length > 0) {
              setParentGenreId(items[0].id);
            } else {
              setParentGenreId(null);
            }
          }}
          maxItems={2}
          required={true}
        />
        
        <StoryPreferenceSelector 
          type="subgenre"
          selectedItems={selectedSubgenres}
          onChange={setSelectedSubgenres}
          maxItems={5}
          parentGenreId={parentGenreId}
        />
        
        <StoryPreferenceSelector 
          type="theme"
          selectedItems={selectedThemes}
          onChange={setSelectedThemes}
          maxItems={6}
          required={true}
        />
        
        <StoryPreferenceSelector 
          type="trope"
          selectedItems={selectedTropes}
          onChange={setSelectedTropes}
          maxItems={7}
          required={true}
        />
      </div>
      
      {!isValid && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Validation Error</AlertTitle>
          <AlertDescription>
            You must select at least one genre, one theme, and one trope.
          </AlertDescription>
        </Alert>
      )}
      
      {combinedRanking.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium">Importance Ranking</h3>
            <div className="text-sm text-muted-foreground">Drag to reorder</div>
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={combinedRanking.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {combinedRanking.map((item) => (
                <SortableItem 
                  key={item.id} 
                  id={item.id} 
                  rank={item.rank}
                  name={item.name}
                  type={item.type}
                />
              ))}
            </SortableContext>
          </DndContext>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p className="flex items-center">
              <Info className="w-4 h-4 mr-2" />
              Drag to reorder. Items higher in the list have more importance in recommendations. Weight is calculated using 1/(1+ln(rank)).
            </p>
          </div>
        </div>
      )}
    </>
  );
  
  // Render either as a card (for settings page) or plain (for wizard)
  if (!isWizard) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Story Preferences</CardTitle>
          <CardDescription>
            Select your preferred genres, themes, and tropes. Rank them in order of importance to get better book recommendations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingPreferences ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            content
          )}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isSaving || !isValid}
          >
            {isSaving ? "Saving..." : "Save preferences"}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Wizard view
  return (
    <div className="py-4">
      {isLoadingPreferences ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        content
      )}
      <div className="flex justify-between mt-6">
        {onSkip && (
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            disabled={isSaving}
          >
            Skip for now
          </Button>
        )}
        <Button 
          onClick={handleSave}
          disabled={isSaving || !isValid}
          className="ml-auto gap-1"
        >
          {isSaving ? "Saving..." : "Save preferences"}
          {!isSaving && <Check className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}