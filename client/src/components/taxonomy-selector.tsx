import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { CardHeader } from "@/components/ui/card";
import { CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, X } from "lucide-react";
import { GenreTaxonomy } from "@shared/schema";
import { SortableGenre } from "@/components/sortable-genre";

interface TaxonomySelectorProps {
  selectedTaxonomies: {
    id?: number;
    taxonomyId: number;
    rank: number;
    type: "genre" | "subgenre" | "theme" | "trope";
    name: string;
  }[];
  onTaxonomiesChange: (
    taxonomies: {
      id?: number;
      taxonomyId: number;
      rank: number;
      type: "genre" | "subgenre" | "theme" | "trope";
      name: string;
    }[],
  ) => void;
}

export function TaxonomySelector({
  selectedTaxonomies,
  onTaxonomiesChange,
}: TaxonomySelectorProps) {
  const [tab, setTab] = useState<"genre" | "subgenre" | "theme" | "trope">(
    "genre",
  );
  const [search, setSearch] = useState("");

  // Set up drag sensors for DnD
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Query to get all genres
  const { data: genres = [] } = useQuery<GenreTaxonomy[]>({
    queryKey: ["/api/genres", { type: "genre" }],
    queryFn: async () => {
      const response = await fetch(`/api/genres?type=genre`);
      if (!response.ok) throw new Error("Failed to fetch genres");
      return response.json();
    },
  });

  // Query to get all subgenres
  const { data: subgenres = [] } = useQuery<GenreTaxonomy[]>({
    queryKey: ["/api/genres", { type: "subgenre" }],
    queryFn: async () => {
      const response = await fetch(`/api/genres?type=subgenre`);
      if (!response.ok) throw new Error("Failed to fetch subgenres");
      return response.json();
    },
  });

  // Query to get all themes
  const { data: themes = [] } = useQuery<GenreTaxonomy[]>({
    queryKey: ["/api/genres", { type: "theme" }],
    queryFn: async () => {
      const response = await fetch(`/api/genres?type=theme`);
      if (!response.ok) throw new Error("Failed to fetch themes");
      return response.json();
    },
  });

  // Query to get all tropes
  const { data: tropes = [] } = useQuery<GenreTaxonomy[]>({
    queryKey: ["/api/genres", { type: "trope" }],
    queryFn: async () => {
      const response = await fetch(`/api/genres?type=trope`);
      if (!response.ok) throw new Error("Failed to fetch tropes");
      return response.json();
    },
  });

  // Filter taxonomies based on search term
  const filteredTaxonomies = () => {
    const searchLower = search.toLowerCase();
    switch (tab) {
      case "genre":
        return genres.filter(
          (g) =>
            g.name.toLowerCase().includes(searchLower) &&
            !selectedTaxonomies.some(
              (st) => st.taxonomyId === g.id && st.type === "genre",
            ),
        );
      case "subgenre":
        return subgenres.filter(
          (g) =>
            g.name.toLowerCase().includes(searchLower) &&
            !selectedTaxonomies.some(
              (st) => st.taxonomyId === g.id && st.type === "subgenre",
            ),
        );
      case "theme":
        return themes.filter(
          (g) =>
            g.name.toLowerCase().includes(searchLower) &&
            !selectedTaxonomies.some(
              (st) => st.taxonomyId === g.id && st.type === "theme",
            ),
        );
      case "trope":
        return tropes.filter(
          (g) =>
            g.name.toLowerCase().includes(searchLower) &&
            !selectedTaxonomies.some(
              (st) => st.taxonomyId === g.id && st.type === "trope",
            ),
        );
      default:
        return [];
    }
  };

  // Get selected taxonomies by type
  const getSelectedByType = (
    type: "genre" | "subgenre" | "theme" | "trope",
  ) => {
    return selectedTaxonomies.filter((item) => item.type === type);
  };

  // Check if a taxonomy type has reached its maximum allowed count
  const isMaxReached = (type: "genre" | "subgenre" | "theme" | "trope") => {
    const count = getSelectedByType(type).length;
    switch (type) {
      case "genre":
        return count >= 2;
      case "subgenre":
        return count >= 5;
      case "theme":
        return count >= 6;
      case "trope":
        return count >= 7;
      default:
        return false;
    }
  };

  // Check if a taxonomy is required and missing
  const isMissingRequired = (
    type: "genre" | "subgenre" | "theme" | "trope",
  ) => {
    const count = getSelectedByType(type).length;
    switch (type) {
      case "genre":
      case "theme":
      case "trope":
        return count === 0;
      default:
        return false;
    }
  };

  // Add a taxonomy to the selection
  const addTaxonomy = (taxonomy: GenreTaxonomy) => {
    if (isMaxReached(taxonomy.type as any)) return;

    // Add to the end of the list with the next rank number
    const newRank = selectedTaxonomies.length + 1;

    onTaxonomiesChange([
      ...selectedTaxonomies,
      {
        taxonomyId: taxonomy.id,
        type: taxonomy.type as "genre" | "subgenre" | "theme" | "trope",
        rank: newRank,
        name: taxonomy.name,
      },
    ]);
  };

  // Remove a taxonomy from the selection
  const removeTaxonomy = (index: number) => {
    const updatedTaxonomies = [...selectedTaxonomies];
    updatedTaxonomies.splice(index, 1);

    // Reorder ranks after removal
    const rerankedTaxonomies = updatedTaxonomies.map((tax, idx) => ({
      ...tax,
      rank: idx + 1,
    }));

    onTaxonomiesChange(rerankedTaxonomies);
  };

  // Move a taxonomy up or down in the ranking
  const moveTaxonomy = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === selectedTaxonomies.length - 1)
    ) {
      return; // Cannot move beyond boundaries
    }

    const updatedTaxonomies = [...selectedTaxonomies];
    const swapIndex = direction === "up" ? index - 1 : index + 1;

    // Swap the items
    [updatedTaxonomies[index], updatedTaxonomies[swapIndex]] = [
      updatedTaxonomies[swapIndex],
      updatedTaxonomies[index],
    ];

    // Update ranks after swapping
    const rerankedTaxonomies = updatedTaxonomies.map((tax, idx) => ({
      ...tax,
      rank: idx + 1,
    }));

    onTaxonomiesChange(rerankedTaxonomies);
  };

  // Calculate importance value based on rank
  const calculateImportance = (rank: number) => {
    return (1 / (1 + Math.log(rank))).toFixed(3);
  };

  // Handle drag end event for reordering taxonomies
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = selectedTaxonomies.findIndex(
        (item) => `${item.type}-${item.taxonomyId}` === active.id,
      );
      const newIndex = selectedTaxonomies.findIndex(
        (item) => `${item.type}-${item.taxonomyId}` === over.id,
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        // Reorder the items
        const reorderedItems = arrayMove(
          [...selectedTaxonomies],
          oldIndex,
          newIndex,
        );

        // Update the ranks
        const rerankedItems = reorderedItems.map((item, idx) => ({
          ...item,
          rank: idx + 1,
        }));

        onTaxonomiesChange(rerankedItems);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-2">
        <h3 className="text-lg font-medium">Genres, Themes, and Tropes</h3>
        <p className="text-sm text-muted-foreground">
          Select the taxonomies that best describe your book. The order
          determines their importance.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Taxonomy selection panel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Add Taxonomies</CardTitle>
              <CardDescription>
                Select from available taxonomies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="genre"
                value={tab}
                onValueChange={(v: string) =>
                  setTab(v as "genre" | "subgenre" | "theme" | "trope")
                }
              >
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger
                    value="genre"
                    className={
                      isMissingRequired("genre") ? "border-destructive" : ""
                    }
                  >
                    Genres{" "}
                    {isMaxReached("genre")
                      ? "(2/2)"
                      : `(${getSelectedByType("genre").length}/2)`}
                  </TabsTrigger>
                  <TabsTrigger value="subgenre">
                    Subgenres{" "}
                    {isMaxReached("subgenre")
                      ? "(5/5)"
                      : `(${getSelectedByType("subgenre").length}/5)`}
                  </TabsTrigger>
                  <TabsTrigger
                    value="theme"
                    className={
                      isMissingRequired("theme") ? "border-destructive" : ""
                    }
                  >
                    Themes{" "}
                    {isMaxReached("theme")
                      ? "(6/6)"
                      : `(${getSelectedByType("theme").length}/6)`}
                  </TabsTrigger>
                  <TabsTrigger
                    value="trope"
                    className={
                      isMissingRequired("trope") ? "border-destructive" : ""
                    }
                  >
                    Tropes{" "}
                    {isMaxReached("trope")
                      ? "(7/7)"
                      : `(${getSelectedByType("trope").length}/7)`}
                  </TabsTrigger>
                </TabsList>

                <div className="relative mb-4">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${tab}s...`}
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSearch(e.target.value)
                    }
                    className="pl-8"
                  />
                </div>

                <TabsContent value="genre" className="m-0">
                  <div className="font-medium mb-2">
                    Select up to 2 genres (required)
                  </div>
                  <ScrollArea className="h-96 border rounded-md p-2">
                    <div className="space-y-2">
                      {filteredTaxonomies().map((genre) => (
                        <div
                          key={genre.id}
                          className="flex items-center justify-between"
                        >
                          <Label
                            htmlFor={`genre-${genre.id}`}
                            className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-muted rounded"
                          >
                            <Checkbox
                              id={`genre-${genre.id}`}
                              checked={selectedTaxonomies.some(
                                (t) =>
                                  t.taxonomyId === genre.id &&
                                  t.type === "genre",
                              )}
                              disabled={isMaxReached("genre")}
                              onCheckedChange={() => addTaxonomy(genre)}
                            />
                            <span>{genre.name}</span>
                          </Label>
                          {genre.description && (
                            <span className="text-xs text-muted-foreground">
                              {genre.description}
                            </span>
                          )}
                        </div>
                      ))}
                      {filteredTaxonomies().length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                          No additional genres found
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="subgenre" className="m-0">
                  <div className="font-medium mb-2">
                    Select up to 5 subgenres (optional)
                  </div>
                  <ScrollArea className="h-96 border rounded-md p-2">
                    <div className="space-y-2">
                      {filteredTaxonomies().map((subgenre) => (
                        <div
                          key={subgenre.id}
                          className="flex items-center justify-between"
                        >
                          <Label
                            htmlFor={`subgenre-${subgenre.id}`}
                            className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-muted rounded"
                          >
                            <Checkbox
                              id={`subgenre-${subgenre.id}`}
                              checked={selectedTaxonomies.some(
                                (t) =>
                                  t.taxonomyId === subgenre.id &&
                                  t.type === "subgenre",
                              )}
                              disabled={isMaxReached("subgenre")}
                              onCheckedChange={() => addTaxonomy(subgenre)}
                            />
                            <span>{subgenre.name}</span>
                          </Label>
                          {subgenre.description && (
                            <span className="text-xs text-muted-foreground">
                              {subgenre.description}
                            </span>
                          )}
                        </div>
                      ))}
                      {filteredTaxonomies().length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                          No additional subgenres found
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="theme" className="m-0">
                  <div className="font-medium mb-2">
                    Select up to 6 themes (at least 1 required)
                  </div>
                  <ScrollArea className="h-96 border rounded-md p-2">
                    <div className="space-y-2">
                      {filteredTaxonomies().map((theme) => (
                        <div
                          key={theme.id}
                          className="flex items-center justify-between"
                        >
                          <Label
                            htmlFor={`theme-${theme.id}`}
                            className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-muted rounded"
                          >
                            <Checkbox
                              id={`theme-${theme.id}`}
                              checked={selectedTaxonomies.some(
                                (t) =>
                                  t.taxonomyId === theme.id &&
                                  t.type === "theme",
                              )}
                              disabled={isMaxReached("theme")}
                              onCheckedChange={() => addTaxonomy(theme)}
                            />
                            <span>{theme.name}</span>
                          </Label>
                          {theme.description && (
                            <span className="text-xs text-muted-foreground">
                              {theme.description}
                            </span>
                          )}
                        </div>
                      ))}
                      {filteredTaxonomies().length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                          No additional themes found
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="trope" className="m-0">
                  <div className="font-medium mb-2">
                    Select up to 7 tropes (at least 1 required)
                  </div>
                  <ScrollArea className="h-96 border rounded-md p-2">
                    <div className="space-y-2">
                      {filteredTaxonomies().map((trope) => (
                        <div
                          key={trope.id}
                          className="flex items-center justify-between"
                        >
                          <Label
                            htmlFor={`trope-${trope.id}`}
                            className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-muted rounded"
                          >
                            <Checkbox
                              id={`trope-${trope.id}`}
                              checked={selectedTaxonomies.some(
                                (t) =>
                                  t.taxonomyId === trope.id &&
                                  t.type === "trope",
                              )}
                              disabled={isMaxReached("trope")}
                              onCheckedChange={() => addTaxonomy(trope)}
                            />
                            <span>{trope.name}</span>
                          </Label>
                          {trope.description && (
                            <span className="text-xs text-muted-foreground">
                              {trope.description}
                            </span>
                          )}
                        </div>
                      ))}
                      {filteredTaxonomies().length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">
                          No additional tropes found
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Selected taxonomies and reordering */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Selected Taxonomies</CardTitle>
              <CardDescription>
                Drag and drop to reorder by importance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedTaxonomies.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground border rounded-md">
                  No taxonomies selected yet
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={selectedTaxonomies.map(
                      (t) => `${t.type}-${t.taxonomyId}`,
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {selectedTaxonomies.map((taxonomy, index) => (
                        <div
                          key={`${taxonomy.type}-${taxonomy.taxonomyId}`}
                          className="relative"
                        >
                          <SortableGenre
                            id={`${taxonomy.type}-${taxonomy.taxonomyId}`}
                            label={
                              <div className="flex items-center space-x-2">
                                <Badge
                                  variant={
                                    taxonomy.type === "genre"
                                      ? "default"
                                      : taxonomy.type === "subgenre"
                                        ? "secondary"
                                        : taxonomy.type === "theme"
                                          ? "outline"
                                          : "destructive"
                                  }
                                >
                                  {taxonomy.type}
                                </Badge>
                                <span className="font-medium">
                                  {taxonomy.name}
                                </span>
                                <span className="text-xs text-muted-foreground ml-2">
                                  Rank: {taxonomy.rank}, Importance:{" "}
                                  {calculateImportance(taxonomy.rank)}
                                </span>
                              </div>
                            }
                            onRemove={() => removeTaxonomy(index)}
                          />
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
