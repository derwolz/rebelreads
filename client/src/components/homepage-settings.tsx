import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { HOMEPAGE_SECTION_TYPES, DISPLAY_MODE_TYPES, HomepageSection } from "@shared/schema";
import { PlusCircle, Save, Undo, Info } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

// Define default sections that will be available
const DEFAULT_SECTIONS: HomepageSection[] = [
  {
    id: "authors-you-follow",
    type: "authors_you_follow",
    displayMode: "carousel",
    title: "Authors You Follow",
    itemCount: 10,
    visible: true,
  },
  {
    id: "popular",
    type: "popular",
    displayMode: "carousel",
    title: "Popular Books",
    itemCount: 10,
    visible: true,
  },
  {
    id: "you-may-also-like",
    type: "you_may_also_like",
    displayMode: "carousel",
    title: "You May Also Like",
    itemCount: 10,
    visible: true,
  },
  {
    id: "wishlist",
    type: "wishlist",
    displayMode: "carousel",
    title: "Your Wishlist",
    itemCount: 10,
    visible: true,
  },
  {
    id: "unreviewed",
    type: "unreviewed",
    displayMode: "carousel",
    title: "Books to Review",
    itemCount: 10,
    visible: true,
  },
  {
    id: "reviewed",
    type: "reviewed",
    displayMode: "carousel",
    title: "Your Reviewed Books",
    itemCount: 10,
    visible: true,
  },
  {
    id: "completed",
    type: "completed",
    displayMode: "carousel",
    title: "Completed Books",
    itemCount: 10,
    visible: true,
  },
];

// Convert section type to friendly display name
function getSectionTypeName(type: string): string {
  const typeMap: Record<string, string> = {
    authors_you_follow: "Authors You Follow",
    popular: "Popular Books",
    you_may_also_like: "You May Also Like",
    wishlist: "Your Wishlist",
    unreviewed: "Books to Review",
    reviewed: "Your Reviewed Books",
    completed: "Completed Books",
    custom_genre_view: "Custom Genre View",
  };
  
  return typeMap[type] || type;
}

export function HomepageSettings() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [availableSections, setAvailableSections] = useState<HomepageSection[]>([]);
  const [activeTab, setActiveTab] = useState("active");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Configure the sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch user's homepage layout
  const { data: userSections, isLoading } = useQuery({
    queryKey: ["/api/homepage-layout"],
    queryFn: async () => {
      const response = await fetch("/api/homepage-layout");
      if (!response.ok) {
        throw new Error("Failed to fetch homepage layout");
      }
      return response.json();
    },
  });

  // Fetch user's custom genre views
  const { data: genreViews } = useQuery({
    queryKey: ["/api/genre-preferences"],
    queryFn: async () => {
      const response = await fetch("/api/genre-preferences");
      if (!response.ok) {
        throw new Error("Failed to fetch genre preferences");
      }
      return response.json();
    },
  });

  // Initialize sections from API data or use defaults
  useEffect(() => {
    if (userSections) {
      // If user has saved sections, use those
      setSections(userSections);
      
      // Filter out sections that are already in the user's layout
      const userSectionIds = userSections.map((section: HomepageSection) => section.type);
      const remainingSections = DEFAULT_SECTIONS.filter(
        (section) => !userSectionIds.includes(section.type)
      );
      
      setAvailableSections(remainingSections);
    } else if (!isLoading) {
      // If no saved layout, use default sections
      setSections(DEFAULT_SECTIONS);
      setAvailableSections([]);
    }
  }, [userSections, isLoading]);

  // Add genre view sections when they load
  useEffect(() => {
    if (genreViews?.views) {
      const customViews = genreViews.views.map((view) => ({
        id: `custom-view-${view.id}`,
        type: "custom_genre_view" as const,
        displayMode: "carousel" as const,
        title: view.name,
        itemCount: 10,
        customViewId: view.id,
        visible: true,
      }));

      // Add to available sections if they're not already in active sections
      const activeSectionIds = sections.map(s => s.customViewId?.toString());
      const filteredCustomViews = customViews.filter(
        (view) => !activeSectionIds.includes(view.customViewId?.toString())
      );
      
      if (filteredCustomViews.length > 0) {
        setAvailableSections(prev => [...prev, ...filteredCustomViews]);
      }
    }
  }, [genreViews, sections]);

  // Mutation for saving homepage layout
  const saveMutation = useMutation({
    mutationFn: async (newSections: HomepageSection[]) => {
      const response = await fetch("/api/homepage-layout", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ sections: newSections }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update homepage layout");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Homepage layout saved",
        description: "Your homepage layout has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/homepage-layout"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save layout",
        description: "There was an error saving your homepage layout.",
        variant: "destructive",
      });
      console.error("Error saving homepage layout:", error);
    },
  });

  // Handle drag end event for reordering sections
  function handleDragEnd(event: any) {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setSections((items) => {
        const activeIndex = items.findIndex((item) => item.id === active.id);
        const overIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, activeIndex, overIndex);
      });
    }
  }

  // Add a section from the available sections to active sections
  function addSection(section: HomepageSection) {
    // Add to active sections
    setSections([...sections, {...section, id: uuidv4()}]);
    
    // Remove from available sections
    setAvailableSections(
      availableSections.filter((s) => s.id !== section.id)
    );
  }

  // Remove a section from active sections
  function removeSection(sectionId: string) {
    const sectionToRemove = sections.find((s) => s.id === sectionId);
    
    if (sectionToRemove) {
      // Remove from active sections
      setSections(sections.filter((s) => s.id !== sectionId));
      
      // Add back to available sections if it's a standard section type
      if (DEFAULT_SECTIONS.some((s) => s.type === sectionToRemove.type) ||
          sectionToRemove.type === "custom_genre_view") {
        setAvailableSections([...availableSections, sectionToRemove]);
      }
    }
  }

  // Toggle a section's visibility
  function toggleSectionVisibility(sectionId: string) {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, visible: !section.visible }
          : section
      )
    );
  }

  // Toggle display mode between carousel and grid
  function toggleDisplayMode(sectionId: string) {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? { 
              ...section, 
              displayMode: section.displayMode === "carousel" ? "grid" : "carousel" 
            }
          : section
      )
    );
  }

  // Update item count for grid display mode
  function updateItemCount(sectionId: string, count: number) {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, itemCount: count }
          : section
      )
    );
  }

  // Handle saving the layout
  function saveLayout() {
    saveMutation.mutate(sections);
  }

  // Reset to last saved layout
  function resetLayout() {
    if (userSections) {
      setSections(userSections);
      toast({
        title: "Layout reset",
        description: "Your homepage layout has been reset to the last saved version.",
      });
    }
  }

  if (isLoading) {
    return <div className="flex justify-center p-4">Loading homepage settings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Homepage Layout</h2>
          <p className="text-muted-foreground">
            Customize which sections appear on your homepage and their order.
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={resetLayout} 
            disabled={saveMutation.isPending}
          >
            <Undo className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={saveLayout} 
            disabled={saveMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Layout
          </Button>
        </div>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Tip</AlertTitle>
        <AlertDescription>
          Drag sections to reorder them. Toggle visibility to show or hide a section.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="active">Active Sections</TabsTrigger>
          <TabsTrigger value="available">Available Sections</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="pt-4">
          <ScrollArea className="h-[550px] pr-4">
            <div className="space-y-4">
              {sections.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
                  <p className="text-muted-foreground">No sections added yet.</p>
                  <Button variant="link" onClick={() => setActiveTab("available")}>
                    Add sections from the available list
                  </Button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                      {sections.map((section) => (
                        <div key={section.id}>
                          <Card className={!section.visible ? "opacity-60" : ""}>
                            <CardHeader className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="flex items-center gap-2">
                                    {section.title}
                                    {!section.visible && <Badge variant="outline">Hidden</Badge>}
                                    {section.customViewId && <Badge>Custom View</Badge>}
                                  </CardTitle>
                                  <CardDescription>
                                    {getSectionTypeName(section.type)}
                                  </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => toggleSectionVisibility(section.id)}
                                  >
                                    {section.visible ? "Hide" : "Show"}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => removeSection(section.id)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                              <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">Display Mode:</span>
                                  <div className="flex gap-2">
                                    <Button 
                                      variant={section.displayMode === "carousel" ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => section.displayMode !== "carousel" && toggleDisplayMode(section.id)}
                                    >
                                      Carousel
                                    </Button>
                                    <Button 
                                      variant={section.displayMode === "grid" ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => section.displayMode !== "grid" && toggleDisplayMode(section.id)}
                                    >
                                      Grid
                                    </Button>
                                  </div>
                                </div>
                                
                                {section.displayMode === "grid" && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">Number of items:</span>
                                    <div className="flex gap-2">
                                      <Button 
                                        variant={section.itemCount === 10 ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => updateItemCount(section.id, 10)}
                                      >
                                        10
                                      </Button>
                                      <Button 
                                        variant={section.itemCount === 20 ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => updateItemCount(section.id, 20)}
                                      >
                                        20
                                      </Button>
                                      <Button 
                                        variant={section.itemCount === 30 ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => updateItemCount(section.id, 30)}
                                      >
                                        30
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="available" className="pt-4">
          <ScrollArea className="h-[550px] pr-4">
            {availableSections.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 border rounded-lg">
                <p className="text-muted-foreground">No additional sections available.</p>
                <Button variant="link" onClick={() => setActiveTab("active")}>
                  Go back to active sections
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {availableSections.map((section) => (
                  <Card key={section.id}>
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {section.title}
                            {section.customViewId && <Badge>Custom View</Badge>}
                          </CardTitle>
                          <CardDescription>
                            {getSectionTypeName(section.type)}
                          </CardDescription>
                        </div>
                        <Button 
                          onClick={() => addSection(section)}
                          size="sm"
                        >
                          <PlusCircle className="h-4 w-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}