import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { v4 as uuidv4 } from "uuid";
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
} from "@dnd-kit/sortable";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  HomepageSection, 
  HOMEPAGE_SECTION_TYPES, 
  DISPLAY_MODE_TYPES 
} from "@shared/schema";
import { SortableHomepageSection } from "./sortable-homepage-section";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  PlusCircle, 
  Check, 
  Info, 
  Loader2, 
  LayoutGrid, 
  GripVertical,
  Eye,
  EyeOff,
  Edit,
  Trash
} from "lucide-react";
import { ToolboxItem } from "./toolbox-item";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";

export function HomepageSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's genre views for custom sections
  const { data: genreViews } = useQuery({
    queryKey: ["/api/genre-preferences"],
  });

  // Fetch homepage layout
  const { data: sections, isLoading: isLoadingSections } = useQuery<HomepageSection[]>({
    queryKey: ["/api/homepage-layout"],
  });

  // Local state for layout sections
  const [activeSections, setActiveSections] = useState<HomepageSection[]>([]);
  const [toolboxSections, setToolboxSections] = useState<HomepageSection[]>([]);
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize sections after data is loaded
  useEffect(() => {
    if (sections) {
      const active = sections.filter(section => section.visible);
      setActiveSections(active);
      
      // Create toolbox items
      const toolbox: HomepageSection[] = [];
      
      // Add standard sections that aren't in the active list
      const standardSectionTypes = HOMEPAGE_SECTION_TYPES.filter(
        type => type !== 'custom_genre_view'
      );
      
      for (const type of standardSectionTypes) {
        if (!active.some(section => section.type === type)) {
          const defaultTitle = type
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          toolbox.push({
            id: uuidv4(),
            type: type,
            displayMode: 'carousel', // Default display mode
            title: defaultTitle,
            itemCount: 12, // Default item count
            visible: true,
          });
        }
      }
      
      // Add any custom genre views
      if (genreViews && Array.isArray(genreViews)) {
        genreViews.forEach((view: any) => {
          const existingSection = active.find(
            section => section.type === 'custom_genre_view' && section.customViewId === view.id
          );
          
          if (!existingSection) {
            toolbox.push({
              id: uuidv4(),
              type: 'custom_genre_view',
              displayMode: 'carousel',
              title: `Custom: ${view.name}`,
              itemCount: 12,
              customViewId: view.id,
              visible: true,
            });
          }
        });
      }
      
      setToolboxSections(toolbox);
    }
  }, [sections, genreViews]);

  // Save layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (sections: HomepageSection[]) => {
      const response = await fetch('/api/homepage-layout', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sections }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save homepage layout');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/homepage-layout'] });
      toast({
        title: 'Layout saved',
        description: 'Your homepage layout has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to save layout',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setActiveSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Handle adding a section
  const handleAddSection = (section: HomepageSection) => {
    setActiveSections((prev) => [...prev, section]);
    setToolboxSections((prev) => prev.filter((item) => item.id !== section.id));
  };

  // Handle removing a section
  const handleRemoveSection = (section: HomepageSection) => {
    setActiveSections((prev) => prev.filter((item) => item.id !== section.id));
    
    // Don't add custom view sections back to toolbox if user has deleted them
    if (section.type !== 'custom_genre_view' || (genreViews && Array.isArray(genreViews) && 
        genreViews.some((view: any) => view.id === section.customViewId))) {
      setToolboxSections((prev) => [...prev, { ...section, visible: true }]);
    }
  };

  // Handle updating a section
  const handleUpdateSection = (id: string, updates: Partial<HomepageSection>) => {
    setActiveSections((prev) =>
      prev.map((section) =>
        section.id === id ? { ...section, ...updates } : section
      )
    );
  };

  // Handle saving the layout
  const handleSaveLayout = () => {
    // Get all sections, including hidden ones
    const allSections = [
      ...activeSections,
      ...toolboxSections.map(section => ({ ...section, visible: false }))
    ];
    saveLayoutMutation.mutate(allSections);
  };

  // Loading skeleton
  if (isLoadingSections) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Homepage Layout</CardTitle>
          <CardDescription>Customize your reading experience</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage Layout</CardTitle>
        <CardDescription>
          Customize which book sections appear on your homepage and how they are displayed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Sections</TabsTrigger>
            <TabsTrigger value="available">Available Sections</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active">
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Drag to reorder sections</AlertTitle>
              <AlertDescription>
                The sections will appear on your homepage in the order shown below.
              </AlertDescription>
            </Alert>

            <div className="mb-6">
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={activeSections.map((section) => section.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {activeSections.length > 0 ? (
                    activeSections.map((section) => (
                      <SortableHomepageSection
                        key={section.id}
                        section={section}
                        onUpdate={(updates) => handleUpdateSection(section.id, updates)}
                        onRemove={() => handleRemoveSection(section)}
                      />
                    ))
                  ) : (
                    <div className="text-center p-8 border rounded-lg">
                      <p className="text-muted-foreground">
                        No active sections. Add sections from the "Available Sections" tab.
                      </p>
                    </div>
                  )}
                </SortableContext>
              </DndContext>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSaveLayout}
                disabled={saveLayoutMutation.isPending}
              >
                {saveLayoutMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Save Layout
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="available">
            <div className="grid gap-4">
              {toolboxSections.length > 0 ? (
                toolboxSections.map((section) => (
                  <ToolboxItem
                    key={section.id}
                    id={section.id}
                    title={section.title}
                    onClick={() => handleAddSection(section)}
                  />
                ))
              ) : (
                <div className="text-center p-8 border rounded-lg">
                  <p className="text-muted-foreground">
                    No available sections. All sections are active on your homepage.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}