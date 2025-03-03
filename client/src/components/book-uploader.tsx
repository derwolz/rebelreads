import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { AVAILABLE_GENRES } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export function BookUploader() {
  const { toast } = useToast();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

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

    const formData = new FormData(e.currentTarget);
    formData.set("cover", coverFile);
    formData.set("genres", JSON.stringify(selectedGenres));

    uploadMutation.mutate(formData);
  };

  const handleGenreSelect = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  return (
    <form id="book-form" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Book Title</label>
        <Input name="title" required />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea name="description" required />
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

      <Button type="submit" disabled={uploadMutation.isPending}>
        {uploadMutation.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Upload Book
      </Button>
    </form>
  );
}