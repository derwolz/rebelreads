import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, GripVertical } from "lucide-react";
import { AVAILABLE_GENRES, FORMAT_OPTIONS } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const RETAILER_OPTIONS = [
  "Amazon",
  "Barnes & Noble",
  "IndieBound",
  "Custom",
] as const;

interface ReferralLink {
  retailer: typeof RETAILER_OPTIONS[number];
  url: string;
  customName?: string;
}

interface SortableReferralLinkProps {
  link: ReferralLink;
  index: number;
  onChange: (value: string) => void;
  onRemove: () => void;
}

function SortableReferralLink({
  link,
  index,
  onChange,
  onRemove,
}: SortableReferralLinkProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2">
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab hover:text-primary"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-sm">{link.customName || link.retailer}:</span>
      <Input
        value={link.url}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm h-8"
      />
      <Button variant="ghost" size="sm" onClick={onRemove}>
        ×
      </Button>
    </div>
  );
}

export function BookUploader() {
  const { toast } = useToast();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [awards, setAwards] = useState<string[]>([]);
  const [characterInput, setCharacterInput] = useState("");
  const [awardInput, setAwardInput] = useState("");
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/books", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-books"] });
      toast({
        title: "Book uploaded",
        description: "Your book has been successfully uploaded.",
      });
      // Reset form
      const form = document.getElementById("book-form") as HTMLFormElement;
      form.reset();
      setCoverFile(null);
      setSelectedGenres([]);
      setSelectedFormats([]);
      setSelectedCharacters([]);
      setAwards([]);
      setReferralLinks([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!coverFile) {
      toast({
        title: "Upload failed",
        description: "Please select a cover image",
        variant: "destructive",
      });
      return;
    }

    if (selectedGenres.length === 0) {
      toast({
        title: "Upload failed",
        description: "Please select at least one genre",
        variant: "destructive",
      });
      return;
    }

    if (selectedFormats.length === 0) {
      toast({
        title: "Upload failed",
        description: "Please select at least one format",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData(e.currentTarget);
    formData.set("cover", coverFile);
    formData.set("genres", JSON.stringify(selectedGenres));
    formData.set("formats", JSON.stringify(selectedFormats));
    formData.set("characters", JSON.stringify(selectedCharacters));
    formData.set("awards", JSON.stringify(awards));
    formData.set("referralLinks", JSON.stringify(referralLinks));

    uploadMutation.mutate(formData);
  };

  const handleGenreSelect = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const handleFormatSelect = (format: string) => {
    if (selectedFormats.includes(format)) {
      setSelectedFormats(selectedFormats.filter(f => f !== format));
    } else {
      setSelectedFormats([...selectedFormats, format]);
    }
  };

  const addCharacter = () => {
    if (characterInput.trim()) {
      setSelectedCharacters([...selectedCharacters, characterInput.trim()]);
      setCharacterInput("");
    }
  };

  const addAward = () => {
    if (awardInput.trim()) {
      setAwards([...awards, awardInput.trim()]);
      setAwardInput("");
    }
  };

  return (
    <form id="book-form" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Book Title</label>
        <Input name="title" required />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Original Title (if different)</label>
        <Input name="originalTitle" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea name="description" required />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Series</label>
        <Input name="series" placeholder="Name of the series if part of one" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Setting</label>
        <Input name="setting" placeholder="Where/when does the story take place?" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Characters</label>
        <div className="flex gap-2 mb-2">
          <Input 
            value={characterInput}
            onChange={(e) => setCharacterInput(e.target.value)}
            placeholder="Add a character"
          />
          <Button type="button" variant="outline" onClick={addCharacter}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedCharacters.map((char, index) => (
            <Badge 
              key={index}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setSelectedCharacters(selectedCharacters.filter((_, i) => i !== index))}
            >
              {char} ×
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Awards</label>
        <div className="flex gap-2 mb-2">
          <Input 
            value={awardInput}
            onChange={(e) => setAwardInput(e.target.value)}
            placeholder="Add an award"
          />
          <Button type="button" variant="outline" onClick={addAward}>Add</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {awards.map((award, index) => (
            <Badge 
              key={index}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => setAwards(awards.filter((_, i) => i !== index))}
            >
              {award} ×
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Book Cover</label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Available Formats</label>
        <div className="flex flex-wrap gap-2">
          {FORMAT_OPTIONS.map((format) => (
            <Badge
              key={format}
              variant={selectedFormats.includes(format) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleFormatSelect(format)}
            >
              {format.charAt(0).toUpperCase() + format.slice(1)}
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Number of Pages</label>
        <Input 
          name="pageCount" 
          type="number" 
          min="1"
          placeholder="Number of pages"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Publication Date</label>
        <Input 
          name="publishedDate" 
          type="date"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">ISBN</label>
        <Input name="isbn" placeholder="ISBN number" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">ASIN</label>
        <Input name="asin" placeholder="Amazon ASIN (for Kindle editions)" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Language</label>
        <Input name="language" defaultValue="English" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Genres</label>
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_GENRES.map((genre) => (
              <Badge
                key={genre}
                variant={selectedGenres.includes(genre) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleGenreSelect(genre)}
              >
                {genre}
              </Badge>
            ))}
          </div>
          {selectedGenres.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Selected genres: {selectedGenres.join(", ")}
              {selectedGenres.length > 3 && (
                <span className="block mt-1 text-yellow-600">
                  Note: Only the first 3 genres will be displayed on the book card
                </span>
              )}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Referral Links</label>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(event) => {
            const { active, over } = event;
            if (over && active.id !== over.id) {
              const oldIndex = Number(active.id);
              const newIndex = Number(over.id);
              setReferralLinks(arrayMove(referralLinks, oldIndex, newIndex));
            }
          }}
        >
          <SortableContext
            items={referralLinks.map((_, i) => i)}
            strategy={verticalListSortingStrategy}
          >
            {referralLinks.map((link, index) => (
              <SortableReferralLink
                key={index}
                link={link}
                index={index}
                onChange={(newUrl) => {
                  const newLinks = [...referralLinks];
                  newLinks[index] = { ...link, url: newUrl };
                  setReferralLinks(newLinks);
                }}
                onRemove={() => {
                  setReferralLinks(referralLinks.filter((_, i) => i !== index));
                }}
              />
            ))}
          </SortableContext>
        </DndContext>
        <div className="flex gap-2 mt-2">
          <Select
            onValueChange={(value) => {
              const newLink: ReferralLink = {
                retailer: value as typeof RETAILER_OPTIONS[number],
                url: "",
                customName: value === "Custom" ? "" : undefined,
              };
              setReferralLinks([...referralLinks, newLink]);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Add retailer..." />
            </SelectTrigger>
            <SelectContent>
              {RETAILER_OPTIONS.map((retailer) => (
                <SelectItem key={retailer} value={retailer}>
                  {retailer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {referralLinks.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setReferralLinks([])}
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      <Button type="submit" disabled={uploadMutation.isPending}>
        {uploadMutation.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Upload Book
      </Button>
    </form>
  );
}