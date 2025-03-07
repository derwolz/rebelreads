import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StarRating } from "@/components/star-rating";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DatePicker } from "@/components/ui/date-picker";

export type BookFormat = "digital" | "softback" | "hardback" | "audio";
export type BookLength = "short" | "novella" | "novel" | "epic";
export type SortOption =
  | "rating"
  | "newest"
  | "oldest"
  | "length"
  | "popularity"
  | "price";

export interface FilterSidebarProps {
  genres: string[];
  onFilterChange: (filters: BookFilters) => void;
}

export interface BookFilters {
  genres: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  minRating: number;
  formats: BookFormat[];
  onSale: boolean;
  lengths: BookLength[];
  sortBy: SortOption;
  publishers: string[];
}

const defaultFilters: BookFilters = {
  genres: [],
  dateRange: {
    from: null,
    to: null,
  },
  minRating: 0,
  formats: [],
  onSale: false,
  lengths: [],
  sortBy: "rating",
  publishers: [],
};

export function FilterSidebar({ genres, onFilterChange }: FilterSidebarProps) {
  const [filters, setFilters] = useState<BookFilters>(defaultFilters);
  const [genreSearch, setGenreSearch] = useState("");

  const handleFilterChange = (newFilters: Partial<BookFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const toggleGenre = (genre: string) => {
    const newGenres = filters.genres.includes(genre)
      ? filters.genres.filter((g) => g !== genre)
      : [...filters.genres, genre];
    handleFilterChange({ genres: newGenres });
  };

  const toggleFormat = (format: BookFormat) => {
    const newFormats = filters.formats.includes(format)
      ? filters.formats.filter((f) => f !== format)
      : [...filters.formats, format];
    handleFilterChange({ formats: newFormats });
  };

  const toggleLength = (length: BookLength) => {
    const newLengths = filters.lengths.includes(length)
      ? filters.lengths.filter((l) => l !== length)
      : [...filters.lengths, length];
    handleFilterChange({ lengths: newLengths });
  };

  const filteredGenres = genres.filter((genre) =>
    genre.toLowerCase().includes(genreSearch.toLowerCase())
  );

  return (
    <div className="w-64 border-r p-4 space-y-6">
      <div>
        <Label>Sort By</Label>
        <Select
          value={filters.sortBy}
          onValueChange={(value: SortOption) =>
            handleFilterChange({ sortBy: value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select sorting" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="length">Length</SelectItem>
            <SelectItem value="popularity">Popularity</SelectItem>
            <SelectItem value="price">Price</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <Accordion type="multiple" defaultValue={["genres", "formats", "length"]}>
        <AccordionItem value="genres">
          <AccordionTrigger>Genres</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search genres..."
                  value={genreSearch}
                  onChange={(e) => setGenreSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {filteredGenres.map((genre) => (
                    <Badge
                      key={genre}
                      variant={
                        filters.genres.includes(genre) ? "default" : "outline"
                      }
                      className="mr-1 cursor-pointer"
                      onClick={() => toggleGenre(genre)}
                    >
                      {genre}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="dates">
          <AccordionTrigger>Publication Date</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              <div>
                <Label>From</Label>
                <DatePicker
                  selected={filters.dateRange.from}
                  onSelect={(date) =>
                    handleFilterChange({
                      dateRange: { ...filters.dateRange, from: date },
                    })
                  }
                />
              </div>
              <div>
                <Label>To</Label>
                <DatePicker
                  selected={filters.dateRange.to}
                  onSelect={(date) =>
                    handleFilterChange({
                      dateRange: { ...filters.dateRange, to: date },
                    })
                  }
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="rating">
          <AccordionTrigger>Minimum Rating</AccordionTrigger>
          <AccordionContent>
            <StarRating
              rating={filters.minRating}
              onChange={(rating) => handleFilterChange({ minRating: rating })}
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="formats">
          <AccordionTrigger>Formats</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {["digital", "softback", "hardback", "audio"].map((format) => (
                <Badge
                  key={format}
                  variant={
                    filters.formats.includes(format as BookFormat)
                      ? "default"
                      : "outline"
                  }
                  className="mr-1 cursor-pointer"
                  onClick={() => toggleFormat(format as BookFormat)}
                >
                  {format}
                </Badge>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="length">
          <AccordionTrigger>Length</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {["short", "novella", "novel", "epic"].map((length) => (
                <Badge
                  key={length}
                  variant={
                    filters.lengths.includes(length as BookLength)
                      ? "default"
                      : "outline"
                  }
                  className="mr-1 cursor-pointer"
                  onClick={() => toggleLength(length as BookLength)}
                >
                  {length}
                </Badge>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sale">
          <AccordionTrigger>Sale Status</AccordionTrigger>
          <AccordionContent>
            <div className="flex items-center space-x-2">
              <Switch
                checked={filters.onSale}
                onCheckedChange={(checked) =>
                  handleFilterChange({ onSale: checked })
                }
              />
              <Label>On Sale</Label>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          setFilters(defaultFilters);
          onFilterChange(defaultFilters);
        }}
      >
        Reset Filters
      </Button>
    </div>
  );
}
