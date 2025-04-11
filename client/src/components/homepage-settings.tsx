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
import { HomepageSection, HOMEPAGE_SECTION_TYPES, DISPLAY_MODE_TYPES } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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
            displayMode: 'carousel',
            title: defaultTitle,
            itemCount: 12,
            visible: false
          });
        }
      }
      
      // Add custom genre views if they're not already in active sections
      if (genreViews && Array.isArray(genreViews)) {
        genreViews.forEach(view => {
          if (!active.some(section => 
            section.type === 'custom_genre_view' && 
            section.customViewId === view.id
          )) {
            toolbox.push({
              id: uuidv4(),
              type: 'custom_genre_view',
              displayMode: 'carousel',
              title: view.name,
              itemCount: 12,
              visible: false,
              customViewId: view.id
            });
          }
        });
      }
      
      setToolboxSections(toolbox);
    }
  }, [sections, genreViews]);
  
  // Save homepage layout to the server
  const mutation = useMutation({
    mutationFn: async (updatedSections: HomepageSection[]) => {
      const response = await fetch('/api/homepage-layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedSections),
        credentials: 'include'
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
        description: 'Your homepage layout has been updated.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save homepage layout.',
        variant: 'destructive'
      });
    }
  });
  
  // Handle saving the layout
  const handleSave = () => {
    // Combine active and toolbox sections
    const allSections = [
      ...activeSections,
      ...toolboxSections
    ];
    
    mutation.mutate(allSections);
  };
  
  // Handle drag end for active sections
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setActiveSections(sections => {
        const oldIndex = sections.findIndex(section => section.id === active.id);
        const newIndex = sections.findIndex(section => section.id === over.id);
        
        return arrayMove(sections, oldIndex, newIndex);
      });
    }
  };
  
  // Add a section from toolbox to the active list
  const addSection = (sectionId: string) => {
    const section = toolboxSections.find(item => item.id === sectionId);
    
    if (section) {
      // Update the section to be visible
      const updatedSection = { ...section, visible: true };
      
      // Add to active sections
      setActiveSections([...activeSections, updatedSection]);
      
      // Remove from toolbox
      setToolboxSections(toolboxSections.filter(item => item.id !== sectionId));
    }
  };
  
  // Remove a section from active list
  const removeSection = (sectionId: string) => {
    const section = activeSections.find(item => item.id === sectionId);
    
    if (section) {
      // Update the section to be hidden
      const updatedSection = { ...section, visible: false };
      
      // Add to toolbox
      setToolboxSections([...toolboxSections, updatedSection]);
      
      // Remove from active sections
      setActiveSections(activeSections.filter(item => item.id !== sectionId));
    }
  };
  
  // Update section properties
  const updateSection = (
    sectionId: string, 
    updates: Partial<HomepageSection>
  ) => {
    setActiveSections(sections => 
      sections.map(section => 
        section.id === sectionId 
          ? { ...section, ...updates } 
          : section
      )
    );
  };
  
  // Loading state
  if (isLoadingSections) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Homepage Layout</CardTitle>
          <CardDescription>
            Loading your homepage layout...
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Homepage Layout</CardTitle>
        <CardDescription>
          Customize how your homepage appears by dragging and rearranging sections.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-[1fr_300px] gap-6">
          {/* Active Sections */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Current Layout</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag to reorder sections. Each section can be displayed as a carousel or grid.
              </p>
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={activeSections.map(section => section.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {activeSections.length === 0 ? (
                      <div className="flex items-center justify-center h-32 border rounded-md border-dashed text-muted-foreground">
                        <p>Drag sections from the toolbox to add them to your homepage</p>
                      </div>
                    ) : (
                      activeSections.map(section => (
                        <SortableHomepageSection
                          key={section.id}
                          section={section}
                          onUpdate={(updates) => updateSection(section.id, updates)}
                          onRemove={() => removeSection(section.id)}
                        />
                      ))
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>

          {/* Toolbox */}
          <div>
            <h3 className="text-lg font-medium mb-2">Toolbox</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Drag these sections to your homepage layout.
            </p>
            
            <div className="space-y-2 border rounded-md p-3">
              {toolboxSections.length === 0 ? (
                <div className="flex items-center justify-center h-24 text-muted-foreground">
                  <p>All sections are being used</p>
                </div>
              ) : (
                toolboxSections.map(section => (
                  <ToolboxItem
                    key={section.id}
                    id={section.id}
                    title={section.title}
                    onClick={() => addSection(section.id)}
                  />
                ))
              )}
            </div>
            
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">About This Page</h4>
              <p className="text-xs text-muted-foreground">
                This page lets you customize the layout of your homepage. 
                Drag sections from the toolbox to add them to your homepage, 
                and rearrange them in any order you prefer. You can toggle between 
                carousel and grid views for each section.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSave}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
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
      </CardFooter>
    </Card>
  );
}