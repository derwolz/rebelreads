import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Search, Tag, GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface SortableTaxonomyItemProps {
  id: string;
  type: string;
  name: string;
  onRemove: () => void;
}

function SortableTaxonomyItem({ id, type, name, onRemove }: SortableTaxonomyItemProps) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition,
    isDragging 
  } = useSortable({ id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
  };
  
  const getTypeColor = () => {
    switch (type) {
      case 'genre':
        return 'bg-primary text-primary-foreground';
      case 'subgenre':
        return 'bg-secondary text-secondary-foreground';
      case 'theme':
        return 'bg-muted text-muted-foreground border-border';
      case 'trope':
        return 'bg-destructive text-destructive-foreground';
      default:
        return 'bg-primary text-primary-foreground';
    }
  };
  
  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "flex items-center justify-between p-2 mb-2 rounded-md border",
        isDragging ? "opacity-50 bg-muted" : "bg-card"
      )}
    >
      <div className="flex items-center gap-2">
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <Badge className={cn("capitalize", getTypeColor())}>
          {type}
        </Badge>
        <span className="text-sm">{name}</span>
      </div>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-7 w-7 p-0 rounded-full"
        onClick={onRemove}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

interface TaxonomyOption {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  type: string;
}

interface TaxonomySelectorProps {
  selectedTaxonomies: any[];
  onTaxonomiesChange: (taxonomies: any[]) => void;
}

export function TaxonomySelector({ selectedTaxonomies, onTaxonomiesChange }: TaxonomySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState('browse');
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Fetch all available taxonomies from the server
  const { data: taxonomies, isLoading } = useQuery<TaxonomyOption[]>({
    queryKey: ['/api/genres/taxonomies'],
    staleTime: 600000, // Cache for 10 minutes
  });
  
  // Filter taxonomies based on search query and type
  const filteredTaxonomies = taxonomies ? taxonomies.filter(taxonomy => {
    const matchesSearch = taxonomy.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (taxonomy.description && taxonomy.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || taxonomy.type === selectedType;
    return matchesSearch && matchesType;
  }) : [];
  
  // Check if a taxonomy is already selected
  const isTaxonomySelected = (taxonomyId: number) => {
    return selectedTaxonomies.some(item => item.taxonomyId === taxonomyId);
  };
  
  // Handle adding a taxonomy to the selection
  const handleAddTaxonomy = (taxonomy: TaxonomyOption) => {
    if (isTaxonomySelected(taxonomy.id)) return;
    
    const newItem = {
      taxonomyId: taxonomy.id,
      type: taxonomy.type,
      rank: selectedTaxonomies.length,
      name: taxonomy.name // Add this for UI display purposes
    };
    
    onTaxonomiesChange([...selectedTaxonomies, newItem]);
  };
  
  // Handle removing a taxonomy from the selection
  const handleRemoveTaxonomy = (index: number) => {
    const newItems = [...selectedTaxonomies];
    newItems.splice(index, 1);
    
    // Update ranks after removal
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      rank: idx
    }));
    
    onTaxonomiesChange(updatedItems);
  };
  
  // Handle reordering of taxonomies
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    if (active.id !== over.id) {
      const oldIndex = selectedTaxonomies.findIndex(item => `${item.taxonomyId}` === active.id);
      const newIndex = selectedTaxonomies.findIndex(item => `${item.taxonomyId}` === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(selectedTaxonomies, oldIndex, newIndex);
        
        // Update ranks after reordering
        const updatedItems = newItems.map((item, idx) => ({
          ...item,
          rank: idx
        }));
        
        onTaxonomiesChange(updatedItems);
      }
    }
  };
  
  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Taxonomy Preferences
        </CardTitle>
        <CardDescription>
          Select and prioritize the genres, themes, and tropes you prefer
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs 
          defaultValue="browse" 
          value={currentTab} 
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse</TabsTrigger>
            <TabsTrigger value="selected">
              Selected
              {selectedTaxonomies.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedTaxonomies.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* Browse Tab Content */}
          <TabsContent value="browse" className="pt-4">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search genres, themes, tropes..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select
                  value={selectedType}
                  onValueChange={setSelectedType}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="genre">Genres</SelectItem>
                    <SelectItem value="subgenre">Subgenres</SelectItem>
                    <SelectItem value="theme">Themes</SelectItem>
                    <SelectItem value="trope">Tropes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border rounded-md">
                {isLoading ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Loading taxonomies...
                  </div>
                ) : filteredTaxonomies.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    No taxonomies found. Try adjusting your search.
                  </div>
                ) : (
                  <div className="max-h-[300px] overflow-y-auto p-2">
                    {filteredTaxonomies.map((taxonomy) => (
                      <div key={taxonomy.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              taxonomy.type === 'genre' ? 'default' :
                              taxonomy.type === 'subgenre' ? 'secondary' :
                              taxonomy.type === 'theme' ? 'outline' : 'destructive'
                            } 
                            className="capitalize"
                          >
                            {taxonomy.type}
                          </Badge>
                          <span className="text-sm font-medium">{taxonomy.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddTaxonomy(taxonomy)}
                          disabled={isTaxonomySelected(taxonomy.id)}
                          className="h-7"
                        >
                          {isTaxonomySelected(taxonomy.id) ? 'Added' : 'Add'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Selected Tab Content */}
          <TabsContent value="selected" className="pt-4">
            {selectedTaxonomies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Tag className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-1">No taxonomies selected</h3>
                <p className="text-sm">
                  Switch to the Browse tab to select genres, themes, and tropes.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Drag items to reorder them based on priority. Items at the top will have higher priority in recommendations.
                </p>
                
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedTaxonomies.map(item => `${item.taxonomyId}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    {selectedTaxonomies.map((item, index) => (
                      <SortableTaxonomyItem
                        key={item.taxonomyId}
                        id={`${item.taxonomyId}`}
                        type={item.type}
                        name={item.name}
                        onRemove={() => handleRemoveTaxonomy(index)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <div className="w-full flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            {selectedTaxonomies.length} taxonomies selected
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onTaxonomiesChange([])}
              disabled={selectedTaxonomies.length === 0}
            >
              Clear All
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={() => setCurrentTab(currentTab === 'browse' ? 'selected' : 'browse')}
            >
              {currentTab === 'browse' ? 'View Selected' : 'Browse More'}
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}