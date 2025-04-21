import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MoveVertical, Info, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RATING_CRITERIA, RATING_CRITERIA_DESCRIPTIONS } from "@shared/schema";

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

// Weight values based on position (index)
const POSITION_WEIGHTS = [0.35, 0.25, 0.20, 0.12, 0.08];

// Helper component for each sortable criteria item
function SortableCriteriaItem({ 
  id, 
  index, 
  savedWeights,
  currentWeights
}: { 
  id: string; 
  index: number; 
  savedWeights?: any;
  currentWeights?: Record<string, number>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Capitalize the first letter of the criteria name
  const displayName = id.charAt(0).toUpperCase() + id.slice(1);
  
  // Description from the schema
  const description = RATING_CRITERIA_DESCRIPTIONS[id as keyof typeof RATING_CRITERIA_DESCRIPTIONS];
  
  // Weight percentage calculation priority:
  // 1. Current weights (after reordering)
  // 2. Saved weights from database
  // 3. Default position weights
  const weight = currentWeights && currentWeights[id] !== undefined
    ? currentWeights[id] * 100
    : savedWeights && savedWeights[id] !== undefined
      ? savedWeights[id] * 100
      : POSITION_WEIGHTS[index] * 100;
  
  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="flex items-center py-2 px-3 mb-2 bg-card border rounded-md shadow-sm hover:shadow-md transition-all group"
    >
      <div 
        {...attributes}
        {...listeners}
        className="mr-2 p-1 cursor-grab rounded hover:bg-muted"
      >
        <MoveVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="flex-1">
        <div className="font-medium">{displayName}</div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium text-primary">{weight.toFixed(0)}%</div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-muted-foreground cursor-help">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className="max-w-[200px]">
                <p className="text-sm">{description}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

interface RatingPreferencesSettingsProps {
  isWizard?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
  initialCriteriaOrder?: string[];
}

export function RatingPreferencesSettings({
  isWizard = false,
  onComplete,
  onSkip,
  initialCriteriaOrder,
}: RatingPreferencesSettingsProps) {
  const [criteriaOrder, setCriteriaOrder] = useState<string[]>(
    initialCriteriaOrder || [...RATING_CRITERIA]
  );
  const [currentWeights, setCurrentWeights] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle drag end - update criteria order
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = criteriaOrder.indexOf(active.id as string);
      const newIndex = criteriaOrder.indexOf(over.id as string);
      
      const newOrder = [...criteriaOrder];
      newOrder.splice(oldIndex, 1);
      newOrder.splice(newIndex, 0, active.id as string);
      
      
      
      // Generate new weights based on position
      const newWeights = updateWeightsForNewOrder(newOrder, currentWeights);
      
      
      // Update the weights state
      setCurrentWeights(newWeights);
      
      setCriteriaOrder(newOrder);
    }
  };

  // Query to get existing preferences (if any) - only if initialCriteriaOrder is not provided
  const { isLoading: isLoadingPreferences, data: preferencesData } = useQuery<{
    id: number;
    userId: number;
    enjoyment: number;
    writing: number;
    themes: number;
    characters: number;
    worldbuilding: number;
    createdAt: string;
    updatedAt: string;
  }>({
    queryKey: ['/api/rating-preferences'],
    staleTime: 60000,
    enabled: !initialCriteriaOrder, // Only run query if initialCriteriaOrder not provided
  });

  // Load criteria order and weights from preferences data only once on initial load
  useEffect(() => {
    if (preferencesData && !initialCriteriaOrder && Object.keys(currentWeights).length === 0) {
      // Derive criteria order from the weights - only on initial load
      const weights = {
        enjoyment: preferencesData.enjoyment,
        writing: preferencesData.writing,
        themes: preferencesData.themes,
        characters: preferencesData.characters,
        worldbuilding: preferencesData.worldbuilding
      };
      
      // Sort criteria by weight in descending order
      const derivedOrder = Object.entries(weights)
        .sort((a, b) => b[1] - a[1])
        .map(([criterion]) => criterion);
        
      setCriteriaOrder(derivedOrder);
      setCurrentWeights(weights); // Initialize current weights only once
      
      
    } else if (!preferencesData && Object.keys(currentWeights).length === 0) {
      // If no saved preferences, initialize with default weights based on initial order
      // Only do this once when the component mounts
      const defaultWeights = generateCriteriaWeights(criteriaOrder);
      setCurrentWeights(defaultWeights);
    }
  }, [preferencesData, initialCriteriaOrder]);
  
  // Helper function to generate criteria weights from order
  const generateCriteriaWeights = (order: string[]): Record<string, number> => {
    const weights: Record<string, number> = {};
    
    // Assign weights based on position in the user's criteria order
    order.forEach((criterion, index) => {
      weights[criterion] = POSITION_WEIGHTS[index];
    });
    
    
    return weights;
  };
  
  // Helper function to update weights for a new order
  const updateWeightsForNewOrder = (
    newOrder: string[], 
    existingWeights: Record<string, number>
  ): Record<string, number> => {
    const updatedWeights: Record<string, number> = {};
    
    // Always assign weights based on position in the list
    // This ensures that dragging an item to a new position 
    // always gives it the weight appropriate for that position
    newOrder.forEach((criterion, index) => {
      updatedWeights[criterion] = POSITION_WEIGHTS[index];
    });
    
    
    
    return updatedWeights;
  };
  
  // Mutation to save preferences
  // Note: This is the ONLY place where data is saved to the database.
  // There is NO autosave - changes are only persisted when the user
  // explicitly clicks the Save button to trigger this mutation.
  const { mutate: savePreferences, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      // Use current weights state instead of regenerating from order
      // This ensures we use the weights that reflect the most recent user changes
      
      
      // Send just the weights (individual columns, not nested objects)
      return apiRequest('POST', '/api/rating-preferences', currentWeights);
    },
    onSuccess: () => {
      toast({
        title: "Preferences Saved",
        description: "Your rating criteria preferences have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rating-preferences'] });
      
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
  
  const handleSave = () => {
    
    
    savePreferences();
  };
  
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  // Content is the same for both modes, only the container changes
  const content = (
    <>
      <div className="mb-4 flex items-center">
        <div className="flex-1">
          <h3 className="text-sm font-medium">Criteria</h3>
        </div>
        <div className="text-sm font-medium">Weight</div>
        <div className="w-8"></div>
      </div>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={criteriaOrder}
          strategy={verticalListSortingStrategy}
        >
          {criteriaOrder.map((id, index) => (
            <SortableCriteriaItem 
              key={id} 
              id={id} 
              index={index} 
              savedWeights={preferencesData ? preferencesData : undefined}
              currentWeights={currentWeights}
            />
          ))}
        </SortableContext>
      </DndContext>
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p className="flex items-center">
          <Info className="w-4 h-4 mr-2" />
          Drag to reorder. The higher an item is in the list, the more it affects the overall book rating.
        </p>
      </div>
    </>
  );

  // For regular settings page view
  if (!isWizard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rating Preferences</CardTitle>
          <CardDescription>
            Customize how you rate books by prioritizing the criteria that matter most to you.
            Drag and reorder the criteria below to match your preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save preferences"}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // For wizard view
  return (
    <div className="py-4">
      {content}
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
          disabled={isSaving}
          className="ml-auto gap-1"
        >
          {isSaving ? "Saving..." : "Save preferences"}
          {!isSaving && <Check className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}