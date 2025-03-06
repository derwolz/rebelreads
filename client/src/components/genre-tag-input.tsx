```typescript
import { useState, useEffect } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { AVAILABLE_GENRES } from "@shared/schema";

interface GenreTagInputProps {
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
}

export function GenreTagInput({ selectedGenres, onGenresChange }: GenreTagInputProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [availableGenres, setAvailableGenres] = useState<string[]>(AVAILABLE_GENRES);

  // Load existing genres from the server
  useEffect(() => {
    fetch("/api/genres")
      .then(res => res.json())
      .then(data => {
        setAvailableGenres(prev => Array.from(new Set([...prev, ...data])));
      })
      .catch(console.error);
  }, []);

  const addGenre = (genre: string) => {
    if (!selectedGenres.includes(genre)) {
      onGenresChange([...selectedGenres, genre]);
    }
  };

  const removeGenre = (genre: string) => {
    onGenresChange(selectedGenres.filter(g => g !== genre));
  };

  const handleSelect = (currentValue: string) => {
    setOpen(false);
    if (currentValue === "create-new") {
      const newGenre = searchValue.trim();
      if (newGenre && !availableGenres.includes(newGenre)) {
        setAvailableGenres(prev => [...prev, newGenre]);
        addGenre(newGenre);
      }
    } else {
      addGenre(currentValue);
    }
    setSearchValue("");
  };

  const commonGenres = AVAILABLE_GENRES.slice(0, 6); // Show first 6 common genres as quick buttons

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {commonGenres.map(genre => (
          <Button
            key={genre}
            variant={selectedGenres.includes(genre) ? "secondary" : "outline"}
            size="sm"
            onClick={() => selectedGenres.includes(genre) ? removeGenre(genre) : addGenre(genre)}
          >
            {genre}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="justify-between"
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
                {searchValue && (
                  <CommandItem value="create-new" onSelect={() => handleSelect("create-new")}>
                    Create "{searchValue}"
                  </CommandItem>
                )}
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
                      onSelect={handleSelect}
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
              {genre} ×
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
```
