import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, X, ChevronDown, Search, Info } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type GenreTaxonomy = {
  id: number;
  name: string;
  description: string | null;
  type: "genre" | "subgenre" | "trope" | "theme";
  parentId: number | null;
};

const TYPE_LABELS = {
  genre: "Genre",
  subgenre: "Subgenre",
  theme: "Theme",
  trope: "Trope",
};

interface StoryPreferenceSelectorProps {
  type: "genre" | "subgenre" | "theme" | "trope";
  selectedItems: Array<{id: number, name: string}>;
  onChange: (items: Array<{id: number, name: string}>) => void;
  maxItems: number;
  required?: boolean;
  parentGenreId?: number | null;
}

export const StoryPreferenceSelector: React.FC<StoryPreferenceSelectorProps> = ({
  type,
  selectedItems,
  onChange,
  maxItems,
  required = false,
  parentGenreId = null,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch all items of the specified type
  const { data: items, isLoading } = useQuery<GenreTaxonomy[]>({
    queryKey: [`/api/genres/types/${type}`, parentGenreId],
    staleTime: 60000, // Cache for 1 minute
  });
  
  // Filter items based on parent genre if applicable (for subgenres)
  const filteredItems = React.useMemo(() => {
    if (!items) return [];
    
    let filtered = items;
    
    // If this is a subgenre selector and a parent genre is selected, filter by parent
    if (type === "subgenre" && parentGenreId) {
      filtered = items.filter(item => item.parentId === parentGenreId);
    }
    
    // Filter by search query if present
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(query) || 
        (item.description && item.description.toLowerCase().includes(query))
      );
    }
    
    // Filter out already selected items
    const selectedIds = new Set(selectedItems.map(item => item.id));
    filtered = filtered.filter(item => !selectedIds.has(item.id));
    
    return filtered;
  }, [items, searchQuery, parentGenreId, selectedItems]);

  // Handle select item
  const handleSelect = (item: GenreTaxonomy) => {
    if (selectedItems.length >= maxItems) {
      // Replace the prompt with an alert or message if needed
      console.warn(`You can only select up to ${maxItems} ${type}s`);
      return;
    }
    
    const newSelectedItems = [...selectedItems, { id: item.id, name: item.name }];
    onChange(newSelectedItems);
    setOpen(false);
    setSearchQuery("");
  };
  
  // Handle remove item
  const handleRemove = (id: number) => {
    const newSelectedItems = selectedItems.filter(item => item.id !== id);
    onChange(newSelectedItems);
  };
  
  // Get label for the type
  const typeLabel = TYPE_LABELS[type];
  
  // Error or warning states
  const hasError = required && selectedItems.length === 0;
  const isAtMax = selectedItems.length >= maxItems;
  
  return (
    <Card className={cn(hasError && "border-destructive")}>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>{typeLabel}s</span>
          <span className="text-sm font-normal text-muted-foreground">
            {selectedItems.length} / {maxItems}
          </span>
        </CardTitle>
        <CardDescription>
          {required ? `Select at least 1 ${type}` : `Select up to ${maxItems} ${type}s`}
          {type === "subgenre" && !parentGenreId && (
            <span className="block text-amber-500 mt-1">
              Select a genre first to see related subgenres
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {selectedItems.map(item => (
              <Badge key={item.id} variant="secondary" className="pl-2">
                {item.name}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 ml-1 hover:bg-transparent"
                  onClick={() => handleRemove(item.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
            
            {selectedItems.length === 0 && (
              <div className="text-sm text-muted-foreground italic">
                No {type}s selected
              </div>
            )}
          </div>
          
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="justify-between w-full"
                disabled={isAtMax || (type === "subgenre" && !parentGenreId)}
              >
                {isAtMax 
                  ? `Maximum ${maxItems} ${type}s selected` 
                  : `Select ${typeLabel}s...`}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[300px]">
              <Command>
                <CommandInput 
                  placeholder={`Search ${type}s...`} 
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                {isLoading ? (
                  <div className="py-6 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                    <div className="mt-2 text-sm text-muted-foreground">Loading...</div>
                  </div>
                ) : (
                  <CommandList>
                    <CommandEmpty>No {type}s found.</CommandEmpty>
                    <CommandGroup>
                      {filteredItems.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={item.name}
                          onSelect={() => handleSelect(item)}
                          className="flex items-center justify-between"
                        >
                          <div className="flex-1 truncate">
                            <span>{item.name}</span>
                          </div>
                          
                          {item.description && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <Info className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs">
                                  <p>{item.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                )}
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  );
};