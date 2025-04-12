import { useState } from "react";
import { Check, ChevronsUpDown, GripVertical, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { AVAILABLE_GENRES } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GenreTaxonomy } from "@shared/schema";
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
  useSortable,
} from "@dnd-kit/sortable";

// Types for various genre selection modes
export type SimpleGenre = string;

export type TaxonomyItem = {
  id?: number;
  taxonomyId: number;
  rank: number;
  type: "genre" | "subgenre" | "theme" | "trope";
  name: string;
};

export type GenreSelectorMode = "simple" | "taxonomy";

interface GenreSelectorProps {
  /**
   * The mode of the genre selector
   * - "simple": String-based genre tags
   * - "taxonomy": Complex hierarchical taxonomy selection
   */
  mode: GenreSelectorMode;
  
  /**
   * Selected values (either string[] for simple mode or TaxonomyItem[] for taxonomy mode)
   */
  selected: SimpleGenre[] | TaxonomyItem[];
  
  /**
   * Callback for when selection changes
   */
  onSelectionChange: (selected: SimpleGenre[] | TaxonomyItem[]) => void;
  
  /**
   * Optional: Callback for when items are reordered through drag-and-drop (taxonomy mode only)
   */
  onReorder?: (reordered: TaxonomyItem[]) => void;
  
  /**
   * Optional: Max number of genres that can be selected (for simple mode)
   * Default: Unlimited
   */
  maxItems?: number;
  
  /**
   * Optional: Whether to show quick select buttons for common genres (simple mode only)
   * Default: true
   */
  showQuickSelect?: boolean;
  
  /**
   * Optional: Whether to allow creating custom genres (simple mode only)
   * Default: false
   */
  allowCustomGenres?: boolean;
  
  /**
   * Optional: Whether to restrict taxonomy selections to the limits (taxonomy mode only)
   * - true: Enforce limits (2 genres, 5 subgenres, 6 themes, 7 tropes)
   * - false: No limits on selections
   * Default: true (for book management)
   */
  restrictLimits?: boolean;
  
  /**
   * Optional: Label text for the component
   */
  label?: string;
  
  /**
   * Optional: Helper text for the component
   */
  helperText?: string;
  
  /**
   * Optional: Class name to apply to the container
   */
  className?: string;
}

export function GenreSelector({
  mode = "simple",
  selected,
  onSelectionChange,
  onReorder,
  maxItems,
  showQuickSelect = true,
  allowCustomGenres = false,
  restrictLimits = true,
  label = "Genres",
  helperText,
  className
}: GenreSelectorProps) {
  // Use this to decide which render mode to use
  if (mode === "simple") {
    return (
      <SimpleGenreSelector
        selectedGenres={selected as SimpleGenre[]}
        onGenresChange={(genres) => onSelectionChange(genres)}
        maxItems={maxItems}
        showQuickSelect={showQuickSelect}
        allowCustomGenres={allowCustomGenres}
        label={label}
        helperText={helperText}
        className={className}
      />
    );
  } else {
    return (
      <TaxonomyGenreSelector
        selectedTaxonomies={selected as TaxonomyItem[]}
        onTaxonomiesChange={(taxonomies) => onSelectionChange(taxonomies)}
        onTaxonomiesReorder={onReorder}
        restrictLimits={restrictLimits}
        label={label}
        helperText={helperText}
        className={className}
      />
    );
  }
}

interface SimpleGenreSelectorProps {
  selectedGenres: SimpleGenre[];
  onGenresChange: (genres: SimpleGenre[]) => void;
  maxItems?: number;
  showQuickSelect: boolean;
  allowCustomGenres: boolean;
  label?: string;
  helperText?: string;
  className?: string;
}

function SimpleGenreSelector({
  selectedGenres,
  onGenresChange,
  maxItems,
  showQuickSelect,
  allowCustomGenres,
  label,
  helperText,
  className
}: SimpleGenreSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Load existing genres from the server using React Query
  const { data: customGenres = [] } = useQuery({
    queryKey: ["/api/genres", { type: "genre" }],
    queryFn: async () => {
      const res = await fetch("/api/genres?type=genre");
      if (!res.ok) throw new Error("Failed to fetch genres");
      return res.json();
    }
  });

  // Create a list of genre names from the genre taxonomy objects
  const genreNames = (customGenres || []).map((g: any) => g.name || "").filter(Boolean);
  
  // Combine built-in and custom genres
  const availableGenres = Array.from(new Set([...AVAILABLE_GENRES, ...genreNames]));

  const isMaxSelected = maxItems !== undefined && selectedGenres.length >= maxItems;

  const addGenre = (genre: string) => {
    if (isMaxSelected) return;
    
    if (!selectedGenres.includes(genre)) {
      onGenresChange([...selectedGenres, genre]);
    }
  };

  const removeGenre = (genre: string) => {
    onGenresChange(selectedGenres.filter(g => g !== genre));
  };

  const handleSelect = (currentValue: string) => {
    setOpen(false);
    if (currentValue === "create-new" && allowCustomGenres) {
      const newGenre = searchValue.trim();
      if (newGenre && !availableGenres.includes(newGenre)) {
        addGenre(newGenre);
      }
    } else {
      addGenre(currentValue);
    }
    setSearchValue("");
  };

  const commonGenres = AVAILABLE_GENRES.slice(0, 6); // Show first 6 common genres as quick buttons

  return (
    <div className={cn("space-y-4", className)}>
      {label && <div className="text-sm font-medium mb-1">{label}</div>}
      
      {helperText && <div className="text-sm text-muted-foreground mb-3">{helperText}</div>}
      
      {showQuickSelect && (
        <div className="flex flex-wrap gap-2">
          {commonGenres.map(genre => (
            <Button
              key={genre}
              variant={selectedGenres.includes(genre) ? "secondary" : "outline"}
              size="sm"
              onClick={() => selectedGenres.includes(genre) ? removeGenre(genre) : addGenre(genre)}
              disabled={isMaxSelected && !selectedGenres.includes(genre)}
            >
              {genre}
            </Button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between"
              disabled={isMaxSelected}
            >
              Add genre...
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0">
            <Command>
              <CommandInput
                placeholder="Search or create genre..."
                value={searchValue}
                onValueChange={setSearchValue}
              />
              <CommandEmpty>
                {searchValue && allowCustomGenres && (
                  <CommandItem value="create-new" onSelect={() => handleSelect("create-new")}>
                    Create "{searchValue}"
                  </CommandItem>
                )}
                {!allowCustomGenres && "No genres found."}
              </CommandEmpty>
              <CommandGroup>
                {availableGenres
                  .filter(genre => 
                    genre.toLowerCase().includes(searchValue.toLowerCase()) &&
                    !selectedGenres.includes(genre)
                  )
                  .map(genre => (
                    <CommandItem
                      key={genre}
                      value={genre}
                      onSelect={() => handleSelect(genre)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedGenres.includes(genre) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {genre}
                    </CommandItem>
                  ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="flex flex-wrap gap-2">
          {selectedGenres.map(genre => (
            <Badge
              key={genre}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => removeGenre(genre)}
            >
              {genre} <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
        
        {maxItems !== undefined && (
          <div className="text-xs text-muted-foreground">
            {selectedGenres.length} of {maxItems} selected
            {selectedGenres.length > 3 && (
              <span className="block mt-1 text-yellow-600">
                Note: Only the first 3 genres will be displayed on the book card
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Sortable genre item with drag and drop capability
interface SortableGenreItemProps {
  id: string;
  taxonomy: TaxonomyItem;
  index: number;
  calculateImportance: (rank: number) => string;
  onRemove: () => void;
}

function SortableGenreItem({ id, taxonomy, index, calculateImportance, onRemove }: SortableGenreItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : '',
    transition,
    zIndex: isDragging ? 50 : undefined,
  } as React.CSSProperties;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-2 border rounded-md",
        isDragging && "opacity-80 shadow-lg"
      )}
    >
      <div className="flex items-center space-x-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 cursor-grab touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </Button>
        <Badge variant={
          taxonomy.type === "genre" ? "default" :
          taxonomy.type === "subgenre" ? "secondary" :
          taxonomy.type === "theme" ? "outline" :
          "destructive"
        }>
          {taxonomy.type}
        </Badge>
        <span className="font-medium">{taxonomy.name}</span>
      </div>
      <div className="flex items-center space-x-2">
        <span className="text-xs text-muted-foreground">
          Rank: {taxonomy.rank}, Importance: {calculateImportance(taxonomy.rank)}
        </span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-7 w-7 text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface TaxonomyGenreSelectorProps {
  selectedTaxonomies: TaxonomyItem[];
  onTaxonomiesChange: (taxonomies: TaxonomyItem[]) => void;
  onTaxonomiesReorder?: (taxonomies: TaxonomyItem[]) => void;
  restrictLimits?: boolean;
  label?: string;
  helperText?: string;
  className?: string;
}

function TaxonomyGenreSelector({
  selectedTaxonomies,
  onTaxonomiesChange,
  onTaxonomiesReorder,
  restrictLimits = true,
  label,
  helperText,
  className
}: TaxonomyGenreSelectorProps) {
  const [tab, setTab] = useState<"genre" | "subgenre" | "theme" | "trope">("genre");
  const [search, setSearch] = useState("");
  
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
        return genres.filter(g => 
          g.name.toLowerCase().includes(searchLower) &&
          !selectedTaxonomies.some(st => st.taxonomyId === g.id && st.type === "genre")
        );
      case "subgenre":
        return subgenres.filter(g => 
          g.name.toLowerCase().includes(searchLower) &&
          !selectedTaxonomies.some(st => st.taxonomyId === g.id && st.type === "subgenre")
        );
      case "theme":
        return themes.filter(g => 
          g.name.toLowerCase().includes(searchLower) &&
          !selectedTaxonomies.some(st => st.taxonomyId === g.id && st.type === "theme")
        );
      case "trope":
        return tropes.filter(g => 
          g.name.toLowerCase().includes(searchLower) &&
          !selectedTaxonomies.some(st => st.taxonomyId === g.id && st.type === "trope")
        );
      default:
        return [];
    }
  };

  // Get selected taxonomies by type
  const getSelectedByType = (type: "genre" | "subgenre" | "theme" | "trope") => {
    return selectedTaxonomies.filter(item => item.type === type);
  };

  // Check if a taxonomy type has reached its maximum allowed count
  const isMaxReached = (type: "genre" | "subgenre" | "theme" | "trope") => {
    // If limits are not restricted, always return false (no limit)
    if (!restrictLimits) return false;
    
    const count = getSelectedByType(type).length;
    switch (type) {
      case "genre": return count >= 2;
      case "subgenre": return count >= 5;
      case "theme": return count >= 6;
      case "trope": return count >= 7;
      default: return false;
    }
  };

  // Check if a taxonomy is required and missing
  const isMissingRequired = (type: "genre" | "subgenre" | "theme" | "trope") => {
    // If limits are not restricted, nothing is required
    if (!restrictLimits) return false;
    
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
      }
    ]);
  };

  // Remove a taxonomy from the selection
  const removeTaxonomy = (index: number) => {
    const updatedTaxonomies = [...selectedTaxonomies];
    updatedTaxonomies.splice(index, 1);
    
    // Reorder ranks after removal
    const rerankedTaxonomies = updatedTaxonomies.map((tax, idx) => ({
      ...tax,
      rank: idx + 1
    }));
    
    onTaxonomiesChange(rerankedTaxonomies);
  };

  // Handle drag end for taxonomy reordering
  const handleGenreDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Extract the indexes from the ids
      const activeIdParts = String(active.id).split('-');
      const overIdParts = String(over.id).split('-');
      
      // The last part of the id is the index
      const oldIndex = parseInt(activeIdParts[activeIdParts.length - 1]);
      const newIndex = parseInt(overIdParts[overIdParts.length - 1]);

      if (!isNaN(oldIndex) && !isNaN(newIndex) && 
          oldIndex >= 0 && oldIndex < selectedTaxonomies.length && 
          newIndex >= 0 && newIndex < selectedTaxonomies.length) {
        // Create a new array with the new order
        const reordered = arrayMove(selectedTaxonomies, oldIndex, newIndex);
        
        // Update the ranks based on the new order
        const rerankedTaxonomies = reordered.map((tax, idx) => ({
          ...tax,
          rank: idx + 1
        }));
        
        // Update local state
        onTaxonomiesChange(rerankedTaxonomies);
        
        // Call the reorder callback if provided, for backend persistence
        if (onTaxonomiesReorder) {
          onTaxonomiesReorder(rerankedTaxonomies);
        }
      }
    }
  };
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate importance value based on rank
  const calculateImportance = (rank: number) => {
    return (1 / (1 + Math.log(rank))).toFixed(3);
  };

  return (
    <div className={cn("space-y-6", className)}>
      <div className="grid gap-2">
        {label && <h3 className="text-lg font-medium">{label}</h3>}
        
        {helperText ? (
          <p className="text-sm text-muted-foreground">{helperText}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Select the taxonomies that best describe your book. The order determines their importance.
          </p>
        )}
        
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
              <Tabs defaultValue="genre" value={tab} onValueChange={(v: string) => setTab(v as "genre" | "subgenre" | "theme" | "trope")}>
                <TabsList className="grid grid-cols-4 mb-4">
                  <TabsTrigger value="genre" className={isMissingRequired("genre") ? "border-destructive" : ""}>
                    Genres {
                      restrictLimits
                        ? isMaxReached("genre") ? "(2/2)" : `(${getSelectedByType("genre").length}/2)`
                        : `(${getSelectedByType("genre").length})`
                    }
                  </TabsTrigger>
                  <TabsTrigger value="subgenre">
                    Subgenres {
                      restrictLimits
                        ? isMaxReached("subgenre") ? "(5/5)" : `(${getSelectedByType("subgenre").length}/5)`
                        : `(${getSelectedByType("subgenre").length})`
                    }
                  </TabsTrigger>
                  <TabsTrigger value="theme" className={isMissingRequired("theme") ? "border-destructive" : ""}>
                    Themes {
                      restrictLimits
                        ? isMaxReached("theme") ? "(6/6)" : `(${getSelectedByType("theme").length}/6)`
                        : `(${getSelectedByType("theme").length})`
                    }
                  </TabsTrigger>
                  <TabsTrigger value="trope" className={isMissingRequired("trope") ? "border-destructive" : ""}>
                    Tropes {
                      restrictLimits
                        ? isMaxReached("trope") ? "(7/7)" : `(${getSelectedByType("trope").length}/7)`
                        : `(${getSelectedByType("trope").length})`
                    }
                  </TabsTrigger>
                </TabsList>
                
                <div className="relative mb-4">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`Search ${tab}s...`}
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
                
                <TabsContent value="genre" className="m-0">
                  <div className="font-medium mb-2">
                    {restrictLimits 
                      ? "Select up to 2 genres (required)" 
                      : "Select as many genres as you want"}
                  </div>
                  <ScrollArea className="h-52 border rounded-md p-2">
                    <div className="space-y-2">
                      {filteredTaxonomies().map((genre) => (
                        <div key={genre.id} className="flex items-center justify-between">
                          <Label
                            htmlFor={`genre-${genre.id}`}
                            className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-muted rounded"
                          >
                            <Checkbox
                              id={`genre-${genre.id}`}
                              checked={selectedTaxonomies.some(
                                (t) => t.taxonomyId === genre.id && t.type === "genre"
                              )}
                              disabled={isMaxReached("genre")}
                              onCheckedChange={() => addTaxonomy(genre)}
                            />
                            <span>{genre.name}</span>
                          </Label>
                          {genre.description && (
                            <span className="text-xs text-muted-foreground">{genre.description}</span>
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
                    {restrictLimits 
                      ? "Select up to 5 subgenres (optional)" 
                      : "Select as many subgenres as you want"}
                  </div>
                  <ScrollArea className="h-52 border rounded-md p-2">
                    <div className="space-y-2">
                      {filteredTaxonomies().map((subgenre) => (
                        <div key={subgenre.id} className="flex items-center justify-between">
                          <Label
                            htmlFor={`subgenre-${subgenre.id}`}
                            className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-muted rounded"
                          >
                            <Checkbox
                              id={`subgenre-${subgenre.id}`}
                              checked={selectedTaxonomies.some(
                                (t) => t.taxonomyId === subgenre.id && t.type === "subgenre"
                              )}
                              disabled={isMaxReached("subgenre")}
                              onCheckedChange={() => addTaxonomy(subgenre)}
                            />
                            <span>{subgenre.name}</span>
                          </Label>
                          {subgenre.description && (
                            <span className="text-xs text-muted-foreground">{subgenre.description}</span>
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
                    {restrictLimits 
                      ? "Select up to 6 themes (at least 1 required)" 
                      : "Select as many themes as you want"}
                  </div>
                  <ScrollArea className="h-52 border rounded-md p-2">
                    <div className="space-y-2">
                      {filteredTaxonomies().map((theme) => (
                        <div key={theme.id} className="flex items-center justify-between">
                          <Label
                            htmlFor={`theme-${theme.id}`}
                            className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-muted rounded"
                          >
                            <Checkbox
                              id={`theme-${theme.id}`}
                              checked={selectedTaxonomies.some(
                                (t) => t.taxonomyId === theme.id && t.type === "theme"
                              )}
                              disabled={isMaxReached("theme")}
                              onCheckedChange={() => addTaxonomy(theme)}
                            />
                            <span>{theme.name}</span>
                          </Label>
                          {theme.description && (
                            <span className="text-xs text-muted-foreground">{theme.description}</span>
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
                    {restrictLimits 
                      ? "Select up to 7 tropes (at least 1 required)" 
                      : "Select as many tropes as you want"}
                  </div>
                  <ScrollArea className="h-52 border rounded-md p-2">
                    <div className="space-y-2">
                      {filteredTaxonomies().map((trope) => (
                        <div key={trope.id} className="flex items-center justify-between">
                          <Label
                            htmlFor={`trope-${trope.id}`}
                            className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-muted rounded"
                          >
                            <Checkbox
                              id={`trope-${trope.id}`}
                              checked={selectedTaxonomies.some(
                                (t) => t.taxonomyId === trope.id && t.type === "trope"
                              )}
                              disabled={isMaxReached("trope")}
                              onCheckedChange={() => addTaxonomy(trope)}
                            />
                            <span>{trope.name}</span>
                          </Label>
                          {trope.description && (
                            <span className="text-xs text-muted-foreground">{trope.description}</span>
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
                  onDragEnd={handleGenreDragEnd}
                >
                  <SortableContext
                    items={selectedTaxonomies.map((item, index) => `${item.type}-${item.taxonomyId}-${index}`)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {selectedTaxonomies.map((taxonomy, index) => (
                        <SortableGenreItem 
                          key={`${taxonomy.type}-${taxonomy.taxonomyId}-${index}`}
                          id={`${taxonomy.type}-${taxonomy.taxonomyId}-${index}`}
                          taxonomy={taxonomy}
                          index={index}
                          calculateImportance={calculateImportance}
                          onRemove={() => removeTaxonomy(index)}
                        />
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