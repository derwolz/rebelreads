import React, { useState, useEffect } from "react";
import { Check, ChevronsUpDown, X, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
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
  const [search, setSearch] = useState("");

  // Generate the query params based on type and parentId
  const generateQueryParams = () => {
    let params = `type=${type}`;
    if (type === "subgenre" && parentGenreId) {
      params += `&parentId=${parentGenreId}`;
    }
    return params;
  };

  // Fetch data
  const { data: items, isLoading } = useQuery<GenreTaxonomy[]>({
    queryKey: ["/api/genres", { type, parentId: parentGenreId }],
    queryFn: async () => {
      const response = await fetch(`/api/genres?${generateQueryParams()}`);
      if (!response.ok) throw new Error(`Failed to fetch ${type}s`);
      return response.json();
    },
  });

  // Remove an item from selection
  const removeItem = (itemId: number) => {
    onChange(selectedItems.filter(item => item.id !== itemId));
  };

  // Handle select - add an item if it's not already selected and we're under the max
  const handleSelect = (item: GenreTaxonomy) => {
    if (selectedItems.some(i => i.id === item.id)) {
      // Item already selected, remove it
      removeItem(item.id);
    } else if (selectedItems.length < maxItems) {
      // Add new item
      onChange([...selectedItems, { id: item.id, name: item.name }]);
    }
    setOpen(false);
  };

  const displayType = type.charAt(0).toUpperCase() + type.slice(1) + (type !== "genre" ? "s" : "s");
  const remainingCount = maxItems - selectedItems.length;

  return (
    <div className="flex flex-col space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={`${type}-selector`} className="text-sm font-medium">
          {displayType}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        <span className="text-xs text-muted-foreground">
          {remainingCount === 0 
            ? `Maximum ${maxItems} selected` 
            : `Select up to ${remainingCount} more`}
        </span>
      </div>
      
      <div className="space-y-3">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between"
              disabled={isLoading || (selectedItems.length >= maxItems)}
              id={`${type}-selector`}
            >
              {`Select ${displayType.toLowerCase()}`}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput 
                placeholder={`Search ${displayType.toLowerCase()}...`} 
                className="h-9"
                value={search}
                onValueChange={setSearch}
              />
              {isLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <>
                  <CommandEmpty>No {displayType.toLowerCase()} found.</CommandEmpty>
                  <CommandGroup className="max-h-60 overflow-y-auto">
                    {items?.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.name}
                        onSelect={() => handleSelect(item)}
                      >
                        <div className="flex items-center w-full">
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedItems.some(i => i.id === item.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex-1">
                            <div>{item.name}</div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground truncate max-w-xs">
                                {item.description}
                              </div>
                            )}
                          </div>
                          {item.description && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                  <p className="max-w-xs">{item.description}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </Command>
          </PopoverContent>
        </Popover>

        {selectedItems.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedItems.map(item => (
              <Badge
                key={item.id}
                variant="secondary"
                className="cursor-pointer group flex items-center gap-1"
              >
                <span>{item.name}</span>
                <X 
                  className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" 
                  onClick={() => removeItem(item.id)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};