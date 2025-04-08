import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MoveVertical, Info } from "lucide-react";
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
function SortableCriteriaItem({ id, index }: { id: string; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Capitalize the first letter of the criteria name
  const displayName = id.charAt(0).toUpperCase() + id.slice(1);
  
  // Description from the schema
  const description = RATING_CRITERIA_DESCRIPTIONS[id as keyof typeof RATING_CRITERIA_DESCRIPTIONS];
  
  // Weight percentage for current position
  const weight = POSITION_WEIGHTS[index] * 100;
  
  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="flex items-center p-3 mb-2 bg-card border rounded-md shadow-sm hover:shadow-md transition-all"
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
        <div className="text-sm text-muted-foreground truncate">{description}</div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="text-sm font-medium text-primary">{weight.toFixed(0)}%</div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Info className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>{description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export function RatingPreferencesSettings() {
  const [criteriaOrder, setCriteriaOrder] = useState<string[]>([...RATING_CRITERIA]);
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
      
      setCriteriaOrder(newOrder);
    }
  };

  // Query to get existing preferences (if any)
  const { isLoading: isLoadingPreferences, data: preferencesData } = useQuery<{
    id: number;
    userId: number;
    criteriaOrder: string[];
    createdAt: string;
    updatedAt: string;
  }>({
    queryKey: ['/api/account/rating-preferences'],
    staleTime: 60000
  });

  // Update criteria order when data is received
  useEffect(() => {
    if (preferencesData && preferencesData.criteriaOrder) {
      setCriteriaOrder(preferencesData.criteriaOrder);
    }
  }, [preferencesData]);
  
  // Mutation to save preferences
  const { mutate: savePreferences, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/account/rating-preferences', {
        criteriaOrder
      });
    },
    onSuccess: () => {
      toast({
        title: "Preferences Saved",
        description: "Your rating criteria preferences have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/account/rating-preferences'] });
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
              <SortableCriteriaItem key={id} id={id} index={index} />
            ))}
          </SortableContext>
        </DndContext>
        
        <div className="mt-4 text-sm text-muted-foreground">
          <p className="flex items-center">
            <Info className="w-4 h-4 mr-2" />
            Drag to reorder. The higher an item is in the list, the more it affects the overall book rating.
          </p>
        </div>
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