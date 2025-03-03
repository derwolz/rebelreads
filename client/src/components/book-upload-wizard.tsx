import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AVAILABLE_GENRES, FORMAT_OPTIONS } from "@shared/schema";
import { cn } from "@/lib/utils";
import type { ReferralLink } from "@shared/schema";
import { BookCard } from "./book-card";
import {DragDropCover} from "@/components/drag-drop-cover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Keep all the existing interfaces and type definitions

interface FormData {
  // Basic Info
  title: string;
  cover: File | null;
  description: string;
  // Details
  series: string;
  setting: string;
  characters: string[];
  // Awards
  hasAwards: boolean;
  awards: string[];
  // Formats
  formats: string[];
  // Publication
  pageCount: number;
  publishedDate: string;
  isbn: string;
  asin: string;
  language: string;
  // Genres
  genres: string[];
  // Additional
  originalTitle: string;
  referralLinks: ReferralLink[];
}

const STEPS = [
  "Basic Information",
  "Book Details",
  "Awards",
  "Formats",
  "Publication",
  "Genres",
  "Preview"
] as const;

export function BookUploadDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          Add Book
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Book</DialogTitle>
        </DialogHeader>
        <BookUploadWizard onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

interface BookUploadWizardProps {
  onSuccess?: () => void;
}

export function BookUploadWizard({ onSuccess }: BookUploadWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    cover: null,
    description: "",
    series: "",
    setting: "",
    characters: [],
    hasAwards: false,
    awards: [],
    formats: [],
    pageCount: 0,
    publishedDate: "",
    isbn: "",
    asin: "",
    language: "English",
    genres: [],
    originalTitle: "",
    referralLinks: []
  });
  const [characterInput, setCharacterInput] = useState("");
  const [awardInput, setAwardInput] = useState("");

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formDataToSend = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "cover" && value instanceof File) {
          formDataToSend.append(key, value);
        } else if (Array.isArray(value)) {
          formDataToSend.append(key, JSON.stringify(value));
        } else if (value !== null) {
          formDataToSend.append(key, value.toString());
        }
      });

      const res = await fetch("/api/books", {
        method: "POST",
        body: formDataToSend,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-books"] });
      toast({
        title: "Success",
        description: "Your book has been uploaded successfully.",
      });
      // Reset form
      setFormData({
        title: "",
        cover: null,
        description: "",
        series: "",
        setting: "",
        characters: [],
        hasAwards: false,
        awards: [],
        formats: [],
        pageCount: 0,
        publishedDate: "",
        isbn: "",
        asin: "",
        language: "English",
        genres: [],
        originalTitle: "",
        referralLinks: []
      });
      setCurrentStep(0);
      onSuccess?.(); // Call onSuccess callback if provided
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddCharacter = () => {
    if (characterInput.trim()) {
      setFormData(prev => ({
        ...prev,
        characters: [...prev.characters, characterInput.trim()]
      }));
      setCharacterInput("");
    }
  };

  const handleAddAward = () => {
    if (awardInput.trim()) {
      setFormData(prev => ({
        ...prev,
        awards: [...prev.awards, awardInput.trim()]
      }));
      setAwardInput("");
    }
  };

  const handleFormatToggle = (format: string) => {
    setFormData(prev => ({
      ...prev,
      formats: prev.formats.includes(format)
        ? prev.formats.filter(f => f !== format)
        : [...prev.formats, format]
    }));
  };

  const handleGenreToggle = (genre: string) => {
    setFormData(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre]
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: // Basic Info
        return formData.title && formData.cover && formData.description;
      case 1: // Details
        return true; // Optional fields
      case 2: // Awards
        return !formData.hasAwards || (formData.hasAwards && formData.awards.length > 0);
      case 3: // Formats
        return formData.formats.length > 0;
      case 4: // Publication
        return formData.publishedDate !== ""; // Only require date
      case 5: // Genres
        return formData.genres.length > 0;
      case 6: // Preview
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Book Title</label>
              <Input
                value={formData.title}
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Book Cover</label>
              <DragDropCover
                title={formData.title}
                value={formData.cover}
                onChange={(file) => setFormData(prev => ({ ...prev, cover: file }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <Textarea
                value={formData.description}
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Book Details</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Series (if part of one)</label>
              <Input
                value={formData.series}
                onChange={e => setFormData(prev => ({ ...prev, series: e.target.value }))}
                placeholder="Name of the series"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Setting</label>
              <Input
                value={formData.setting}
                onChange={e => setFormData(prev => ({ ...prev, setting: e.target.value }))}
                placeholder="Where/when does the story take place?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Characters</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={characterInput}
                  onChange={e => setCharacterInput(e.target.value)}
                  placeholder="Add a character"
                  onKeyPress={e => e.key === 'Enter' && handleAddCharacter()}
                />
                <Button type="button" variant="outline" onClick={handleAddCharacter}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.characters.map((char, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      characters: prev.characters.filter((_, i) => i !== index)
                    }))}>
                    {char} ×
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Awards</h2>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Has this book won any awards?</label>
              <input
                type="checkbox"
                checked={formData.hasAwards}
                onChange={e => setFormData(prev => ({ ...prev, hasAwards: e.target.checked }))}
              />
            </div>
            {formData.hasAwards && (
              <div>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={awardInput}
                    onChange={e => setAwardInput(e.target.value)}
                    placeholder="Add an award"
                    onKeyPress={e => e.key === 'Enter' && handleAddAward()}
                  />
                  <Button type="button" variant="outline" onClick={handleAddAward}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.awards.map((award, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        awards: prev.awards.filter((_, i) => i !== index)
                      }))}>
                      {award} ×
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Available Formats</h2>
            <div className="grid grid-cols-2 gap-4">
              {FORMAT_OPTIONS.map((format) => (
                <Button
                  key={format}
                  variant={formData.formats.includes(format) ? "default" : "outline"}
                  className="h-24 text-lg"
                  onClick={() => handleFormatToggle(format)}
                >
                  {format.charAt(0).toUpperCase() + format.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Publication Information</h2>
            <div>
              <label className="block text-sm font-medium mb-1">Publication Date</label>
              <Input
                type="date"
                value={formData.publishedDate}
                onChange={e => setFormData(prev => ({ ...prev, publishedDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Number of Pages</label>
              <Input
                type="number"
                min="1"
                value={formData.pageCount || ""}
                onChange={e => setFormData(prev => ({ ...prev, pageCount: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ISBN</label>
              <Input
                value={formData.isbn}
                onChange={e => setFormData(prev => ({ ...prev, isbn: e.target.value }))}
                placeholder="ISBN number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ASIN</label>
              <Input
                value={formData.asin}
                onChange={e => setFormData(prev => ({ ...prev, asin: e.target.value }))}
                placeholder="Amazon ASIN (for Kindle editions)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Language</label>
              <Input
                value={formData.language}
                onChange={e => setFormData(prev => ({ ...prev, language: e.target.value }))}
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Genres</h2>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_GENRES.map((genre) => (
                <Badge
                  key={genre}
                  variant={formData.genres.includes(genre) ? "default" : "outline"}
                  className="cursor-pointer text-base px-4 py-2"
                  onClick={() => handleGenreToggle(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
            {formData.genres.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Selected genres: {formData.genres.join(", ")}
                {formData.genres.length > 3 && (
                  <span className="block mt-1 text-yellow-600">
                    Note: Only the first 3 genres will be displayed on the book card
                  </span>
                )}
              </p>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Preview</h2>
            <p className="text-sm text-muted-foreground">
              Review your book information before submitting
            </p>
            <div className="grid md:grid-cols-2 gap-8">
              <Card className="p-4">
                <h3 className="font-medium mb-2">Basic Information</h3>
                <dl className="space-y-1">
                  <dt className="text-sm font-medium">Title</dt>
                  <dd className="text-sm text-muted-foreground">{formData.title}</dd>
                  <dt className="text-sm font-medium mt-2">Description</dt>
                  <dd className="text-sm text-muted-foreground">{formData.description}</dd>
                </dl>
              </Card>
              <Card className="p-4">
                <h3 className="font-medium mb-2">Details</h3>
                <dl className="space-y-1">
                  {formData.series && (
                    <>
                      <dt className="text-sm font-medium">Series</dt>
                      <dd className="text-sm text-muted-foreground">{formData.series}</dd>
                    </>
                  )}
                  {formData.setting && (
                    <>
                      <dt className="text-sm font-medium mt-2">Setting</dt>
                      <dd className="text-sm text-muted-foreground">{formData.setting}</dd>
                    </>
                  )}
                  {formData.characters.length > 0 && (
                    <>
                      <dt className="text-sm font-medium mt-2">Characters</dt>
                      <dd className="flex flex-wrap gap-1">
                        {formData.characters.map((char, i) => (
                          <Badge key={i} variant="secondary">{char}</Badge>
                        ))}
                      </dd>
                    </>
                  )}
                </dl>
              </Card>
              {formData.hasAwards && formData.awards.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-medium mb-2">Awards</h3>
                  <div className="flex flex-wrap gap-1">
                    {formData.awards.map((award, i) => (
                      <Badge key={i} variant="secondary">{award}</Badge>
                    ))}
                  </div>
                </Card>
              )}
              <Card className="p-4">
                <h3 className="font-medium mb-2">Formats & Publication</h3>
                <dl className="space-y-1">
                  <dt className="text-sm font-medium">Available Formats</dt>
                  <dd className="flex flex-wrap gap-1">
                    {formData.formats.map((format, i) => (
                      <Badge key={i} variant="secondary">
                        {format.charAt(0).toUpperCase() + format.slice(1)}
                      </Badge>
                    ))}
                  </dd>
                  <dt className="text-sm font-medium mt-2">Published</dt>
                  <dd className="text-sm text-muted-foreground">
                    {new Date(formData.publishedDate).toLocaleDateString()}
                  </dd>
                  {formData.pageCount > 0 && (
                    <>
                      <dt className="text-sm font-medium mt-2">Pages</dt>
                      <dd className="text-sm text-muted-foreground">{formData.pageCount}</dd>
                    </>
                  )}
                  {formData.isbn && (
                    <>
                      <dt className="text-sm font-medium mt-2">ISBN</dt>
                      <dd className="text-sm text-muted-foreground">{formData.isbn}</dd>
                    </>
                  )}
                  {formData.asin && (
                    <>
                      <dt className="text-sm font-medium mt-2">ASIN</dt>
                      <dd className="text-sm text-muted-foreground">{formData.asin}</dd>
                    </>
                  )}
                </dl>
              </Card>
              <Card className="p-4">
                <h3 className="font-medium mb-2">Genres</h3>
                <div className="flex flex-wrap gap-1">
                  {formData.genres.map((genre, i) => (
                    <Badge key={i} variant="secondary">{genre}</Badge>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => (
            <div key={step} className="flex items-center">
              <Button
                variant={currentStep === index ? "default" : "ghost"}
                className={cn(
                  "h-8",
                  index > currentStep && "opacity-50 cursor-not-allowed"
                )}
                onClick={() => index <= currentStep && setCurrentStep(index)}
                disabled={index > currentStep}
              >
                {index + 1}
              </Button>
              {index < STEPS.length - 1 && (
                <div className="w-8 h-px bg-border" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="min-h-[400px]">
        {renderStep()}
      </div>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => prev - 1)}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        {currentStep === STEPS.length - 1 ? (
          <Button
            onClick={() => uploadMutation.mutate(formData)}
            disabled={uploadMutation.isPending || !canProceed()}
          >
            {uploadMutation.isPending ? "Uploading..." : "Submit"}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentStep(prev => prev + 1)}
            disabled={!canProceed()}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}