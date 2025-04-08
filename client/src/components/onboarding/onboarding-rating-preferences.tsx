import React, { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Info } from 'lucide-react';
import { RATING_CRITERIA, RatingCriteria } from '@shared/schema';
import { useOnboarding } from '@/hooks/use-onboarding';

// Component for each sortable criteria item
interface SortableItemProps {
  id: RatingCriteria;
  index: number;
  description: string;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, index, description }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  // Weights corresponding to positions
  const weights = ['35%', '25%', '20%', '12%', '8%'];
  const weight = weights[index];
  
  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card className="border border-primary/20 hover:border-primary/50 transition-all">
        <CardContent className="p-4 flex items-center">
          <div className="mr-3 cursor-grab" {...attributes} {...listeners}>
            <GripVertical size={20} className="text-muted-foreground" />
          </div>
          
          <div className="flex flex-1 items-center justify-between">
            <div className="flex items-center">
              <Badge className="mr-2 bg-primary/20 text-primary hover:bg-primary/30">
                {weight}
              </Badge>
              <span className="font-medium capitalize">{id}</span>
            </div>
            
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Info size={16} />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 p-4">
                <p>{description}</p>
              </HoverCardContent>
            </HoverCard>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const OnboardingRatingPreferences: React.FC = () => {
  const { criteriaOrder, setCriteriaOrder, descriptions, saveRatingPreferences, isLoading } = useOnboarding();
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = criteriaOrder.indexOf(active.id as RatingCriteria);
      const newIndex = criteriaOrder.indexOf(over.id as RatingCriteria);
      
      const newOrder = arrayMove(criteriaOrder, oldIndex, newIndex);
      setCriteriaOrder(newOrder);
    }
  };
  
  return (
    <div className="py-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold mb-2">How do you judge a book?</h3>
        <p className="text-muted-foreground">
          Drag and reorder these criteria based on what matters most to you when reading.
          The order determines how ratings are weighted.
        </p>
      </div>
      
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={criteriaOrder} strategy={verticalListSortingStrategy}>
          {criteriaOrder.map((criteria, index) => (
            <SortableItem 
              key={criteria} 
              id={criteria} 
              index={index}
              description={descriptions[criteria]} 
            />
          ))}
        </SortableContext>
      </DndContext>
      
      <div className="mt-6">
        <Button
          variant="outline"
          onClick={() => saveRatingPreferences()}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Saving...' : 'Save preferences'}
        </Button>
        <p className="text-sm text-muted-foreground text-center mt-2">
          You can change these preferences later in your account settings.
        </p>
      </div>
    </div>
  );
};

export default OnboardingRatingPreferences;