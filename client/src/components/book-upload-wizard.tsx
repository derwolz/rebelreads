import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AVAILABLE_GENRES, FORMAT_OPTIONS, IMAGE_TYPES } from "@shared/schema";
import { cn } from "@/lib/utils";
import type { ReferralLink } from "@shared/schema";
import { BookCard } from "./book-card";
import { DragDropCover } from "@/components/drag-drop-cover";
import { DragDropImage } from "@/components/drag-drop-image";
import { GenreSelector, TaxonomyItem } from "@/components/genre-selector";

/**
 * Interface for storing book image files with their metadata
 */
interface BookImageFile {
  type: typeof IMAGE_TYPES[number];
  file: File | null;
  width: number;
  height: number;
  previewUrl?: string; // URL for existing images when editing
  error?: string; // Track validation errors
}
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { GripVertical } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit } from "lucide-react";
import type { Book, BookImage } from "@shared/schema";

const RETAILER_OPTIONS = [
  "Amazon",
  "Barnes & Noble",
  "IndieBound",
  "Custom",
] as const;

// BookImageFile interface is already defined at the top of the file

interface FormData {
  title: string;
  description: string;
  series: string;
  setting: string;
  characters: string[];
  hasAwards: boolean;
  awards: string[];
  formats: string[];
  pageCount: number;
  publishedDate: string;
  isbn: string;
  asin: string;
  language: string;
  originalTitle: string;
  referralLinks: ReferralLink[];
  internal_details: string;
  genreTaxonomies: TaxonomyItem[];
  // New field for book images
  bookImages: Record<typeof IMAGE_TYPES[number], BookImageFile>;
}

const STEPS = [
  "Basic Information",
  "Images",
  "Awards",
  "Formats",
  "Publication",
  "Genres",
  "Book Details",
  "Referral Links",
  "Preview",
] as const;

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

interface BookUploadWizardProps {
  onSuccess?: () => void;
  book?: Book;
}

export function BookUploadDialog({ book }: { book?: Book }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {book ? (
          <Button variant="outline" size="sm" className="h-9">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        ) : (
          <Button className="w-full">Add Book</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{book ? "Edit Book" : "Add New Book"}</DialogTitle>
        </DialogHeader>
        <BookUploadWizard onSuccess={() => setOpen(false)} book={book} />
      </DialogContent>
    </Dialog>
  );
}

export function BookUploadWizard({ onSuccess, book }: BookUploadWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [showCoverUpload, setShowCoverUpload] = useState(!book);
  const [formData, setFormData] = useState<FormData>(() => {
    // Create default empty book images structure
    const createEmptyBookImages = (): Record<typeof IMAGE_TYPES[number], BookImageFile> => {
      const images: Partial<Record<typeof IMAGE_TYPES[number], BookImageFile>> = {};
      
      // Initialize each image type with empty values
      IMAGE_TYPES.forEach(type => {
        let width = 0;
        let height = 0;
        
        // Set dimensions based on image type
        switch (type) {
          case "book-detail":
            width = 480;
            height = 600;
            break;
          case "background":
            width = 1300;
            height = 1500;
            break;
          case "book-card":
            width = 256;
            height = 440;
            break;
          case "grid-item":
            width = 56;
            height = 212;
            break;
          case "mini":
            width = 48;
            height = 64;
            break;
          case "hero":
            width = 1500;
            height = 600;
            break;
        }
        
        images[type] = {
          type,
          file: null,
          width,
          height
        };
      });
      
      return images as Record<typeof IMAGE_TYPES[number], BookImageFile>;
    };
    
    if (book) {
      // Create book images structure with existing images if available
      const bookImages = createEmptyBookImages();
      
      // If the book has images, populate the URLs
      if (book.images && book.images.length > 0) {
        console.log("Book has images:", book.images.map(img => `${img.imageType}: ${img.imageUrl}`));
        
        // Initialize existing image URLs
        book.images.forEach(image => {
          const imageType = image.imageType as typeof IMAGE_TYPES[number];
          if (bookImages[imageType]) {
            // Store the image URL in the existing structure
            bookImages[imageType].previewUrl = image.imageUrl;
            console.log(`Set preview URL for ${imageType}: ${image.imageUrl}`);
          }
        });
      }
      
      return {
        title: book.title,
        description: book.description,
        series: book.series || "",
        setting: book.setting || "",
        characters: book.characters || [],
        hasAwards: (book.awards || []).length > 0,
        awards: book.awards || [],
        formats: book.formats,
        pageCount: book.pageCount ?? 0,
        publishedDate: book.publishedDate ?? "",
        isbn: book.isbn || "",
        asin: book.asin || "",
        language: book.language,
        genreTaxonomies: ((book as any).genreTaxonomies as TaxonomyItem[]) || [],
        originalTitle: book.originalTitle || "",
        referralLinks: book.referralLinks || [],
        internal_details: book.internal_details || "", // Initialize from book data
        bookImages: bookImages,
      };
    }
    
    return {
      title: "",
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
      originalTitle: "",
      referralLinks: [],
      internal_details: "",
      genreTaxonomies: [],
      bookImages: createEmptyBookImages(),
    };
  });
  const [characterInput, setCharacterInput] = useState("");
  const [awardInput, setAwardInput] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (book) {
        // For updates, send only changed fields as JSON
        const changedFields: Record<string, any> = {};

        Object.entries(data).forEach(([key, value]) => {
          const bookValue = book[key as keyof Book];

          // Skip unchanged values
          if (value === bookValue) return;

          // Skip empty strings
          if (value === "") return;

          // Handle special cases
          if (key === "cover" && value instanceof File) {
            changedFields[key] = value;
          } else if (Array.isArray(value)) {
            if (JSON.stringify(value) !== JSON.stringify(bookValue)) {
              changedFields[key] = value;
            }
          } else if (value !== null && value !== undefined) {
            changedFields[key] = value;
          }
        });

        // If we have a new cover, use FormData
        if (changedFields.cover instanceof File) {
          const formData = new FormData();

          // Add the cover file
          formData.append("cover", changedFields.cover);

          // Add other changed fields
          Object.entries(changedFields).forEach(([key, value]) => {
            if (key !== "cover") {
              formData.append(
                key,
                Array.isArray(value) ? JSON.stringify(value) : String(value),
              );
            }
          });

          const response = await fetch(`/api/books/${book.id}`, {
            method: "PATCH",
            body: formData,
            credentials: "include",
          });

          if (!response.ok) throw new Error(await response.text());
          return response.json();
        }

        // If no new cover, send as JSON
        const response = await fetch(`/api/books/${book.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(changedFields),
        });

        if (!response.ok) throw new Error(await response.text());
        return response.json();
      }

      // For new books, keep existing FormData logic
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === "cover" && value instanceof File) {
          formData.append(key, value);
        } else if (key === "bookImages" && typeof value === "object") {
          // Handle book images
          console.log("Processing bookImages in formData:", value);
          Object.entries(value as Record<string, BookImageFile>).forEach(([imageType, imageData]) => {
            console.log(`Processing image type: ${imageType}, has file:`, !!imageData.file);
            if (imageData.file) {
              formData.append(`bookImage_${imageType}`, imageData.file);
              formData.append(`bookImageType_${imageType}`, imageType);
              console.log(`Added image file for ${imageType} to formData`);
            }
          });
        } else if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined && value !== "") {
          formData.append(key, value.toString());
        }
      });

      const response = await fetch("/api/books", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-books"] });
      toast({
        title: "Success",
        description: book
          ? "Book updated successfully."
          : "Book uploaded successfully.",
      });
      
      // Create default empty book images structure
      const emptyBookImages = (): Record<typeof IMAGE_TYPES[number], BookImageFile> => {
        const images: Partial<Record<typeof IMAGE_TYPES[number], BookImageFile>> = {};
        
        // Initialize each image type with empty values
        IMAGE_TYPES.forEach(type => {
          let width = 0;
          let height = 0;
          
          // Set dimensions based on image type
          switch (type) {
            case "book-detail":
              width = 480;
              height = 600;
              break;
            case "background":
              width = 1300;
              height = 1500;
              break;
            case "book-card":
              width = 256;
              height = 440;
              break;
            case "grid-item":
              width = 56;
              height = 212;
              break;
            case "mini":
              width = 48;
              height = 64;
              break;
            case "hero":
              width = 1500;
              height = 600;
              break;
          }
          
          images[type] = {
            type,
            file: null,
            width,
            height
          };
        });
        
        return images as Record<typeof IMAGE_TYPES[number], BookImageFile>;
      };
      
      // Reset form with empty values
      setFormData({
        title: "",
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
        originalTitle: "",
        referralLinks: [],
        internal_details: "",
        genreTaxonomies: [],
        bookImages: emptyBookImages(),
      });
      
      setCurrentStep(0);
      onSuccess?.();
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
      setFormData((prev) => ({
        ...prev,
        characters: [...prev.characters, characterInput.trim()],
      }));
      setCharacterInput("");
    }
  };

  const handleAddAward = () => {
    if (awardInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        awards: [...prev.awards, awardInput.trim()],
      }));
      setAwardInput("");
    }
  };

  const handleFormatToggle = (format: string) => {
    setFormData((prev) => ({
      ...prev,
      formats: prev.formats.includes(format)
        ? prev.formats.filter((f) => f !== format)
        : [...prev.formats, format],
    }));
  };
  
  const handleImageChange = (imageType: typeof IMAGE_TYPES[number], file: File, hasError?: boolean, errorMessage?: string) => {
    console.log(`Image changed for ${imageType}:`, file.name, file.size, hasError ? `Error: ${errorMessage}` : 'No errors');
    setFormData((prev) => ({
      ...prev,
      bookImages: {
        ...prev.bookImages,
        [imageType]: {
          ...prev.bookImages[imageType],
          file,
          error: hasError ? errorMessage : undefined
        }
      }
    }));
    console.log(`Updated form data bookImages for ${imageType}:`, !!file);
  };

  // Legacy genre toggle removed

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return formData.title && formData.description;
      case 1:
        // Validate that all required images are provided (either file or previewUrl) AND have no dimension errors
        console.log("Checking required images:", formData.bookImages);
        
        // Check if all required images are provided
        const imageStatuses = Object.entries(formData.bookImages).map(([type, img]) => 
          `${type}: ${img.file ? 'Yes (File)' : (img.previewUrl ? 'Yes (Existing)' : 'No')}${img.error ? ` - ERROR: ${img.error}` : ''}`
        );
        console.log("Image statuses:", imageStatuses);
        
        // Check for both presence and no errors
        const hasAllRequiredImages = Object.values(formData.bookImages).every(img => 
          (img.file !== null || img.previewUrl !== undefined)
        );
        
        const hasNoErrors = Object.values(formData.bookImages).every(img => !img.error);
        
        console.log("All required images provided:", hasAllRequiredImages);
        console.log("No dimension errors:", hasNoErrors);
        
        return hasAllRequiredImages && hasNoErrors;
      case 2:
        return (
          !formData.hasAwards ||
          (formData.hasAwards && formData.awards.length > 0)
        );
      case 3:
        return formData.formats.length > 0;
      case 4:
        return formData.publishedDate !== "";
      case 5:
        // Validate that there are at least 5 taxonomies total
        return formData.genreTaxonomies.length >= 5;
      case 6:
        // Images were moved to page 2, so this step is now something else
        return true;
      case 7:
        return true;
      case 8:
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
              <label className="block text-sm font-medium mb-1">
                Book Title
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
              />
            </div>
      
            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Internal Details
              </label>
              <p className="text-sm text-muted-foreground mb-2">
                Write about the themes, details and characters of your book. We will use this to match and suggest books.
              </p>
              <Textarea
                value={formData.internal_details}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    internal_details: e.target.value,
                  }))
                }
                className="min-h-[200px]"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Book Images</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Upload different images for your book to be displayed in various contexts. All images are required.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              {IMAGE_TYPES.map((imageType) => {
                const imageData = formData.bookImages[imageType];
                return (
                  <DragDropImage
                    key={imageType}
                    imageType={imageType}
                    value={imageData.file}
                    width={imageData.width}
                    height={imageData.height}
                    previewUrl={imageData.previewUrl}
                    onChange={(file, hasError, errorMessage) => handleImageChange(imageType, file, hasError, errorMessage)}
                    required={true}
                  />
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Awards</h2>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">
                Has this book won any awards?
              </label>
              <input
                type="checkbox"
                checked={formData.hasAwards}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    hasAwards: e.target.checked,
                  }))
                }
              />
            </div>
            {formData.hasAwards && (
              <div>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={awardInput}
                    onChange={(e) => setAwardInput(e.target.value)}
                    placeholder="Add an award"
                    onKeyPress={(e) => e.key === "Enter" && handleAddAward()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddAward}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.awards.map((award, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          awards: prev.awards.filter((_, i) => i !== index),
                        }))
                      }
                    >
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              {FORMAT_OPTIONS.map((format) => (
                <Button
                  key={format}
                  variant={
                    formData.formats.includes(format) ? "default" : "outline"
                  }
                  className="h-16 sm:h-24 text-sm sm:text-lg py-2"
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
              <label className="block text-sm font-medium mb-1">
                Publication Date
              </label>
              <Input
                type="date"
                value={formData.publishedDate}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    publishedDate: e.target.value,
                  }))
                }
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Number of Pages
              </label>
              <Input
                type="number"
                min="1"
                value={formData.pageCount || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pageCount: parseInt(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ISBN</label>
              <Input
                value={formData.isbn}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, isbn: e.target.value }))
                }
                placeholder="ISBN number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">ASIN</label>
              <Input
                value={formData.asin}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, asin: e.target.value }))
                }
                placeholder="Amazon ASIN (for Kindle editions)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Language</label>
              <Input
                value={formData.language}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, language: e.target.value }))
                }
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Select Genres, Themes, and Tropes</h2>
            
            <GenreSelector
              mode="taxonomy"
              selected={formData.genreTaxonomies || []}
              onSelectionChange={(taxonomies) => 
                setFormData((prev) => ({ ...prev, genreTaxonomies: taxonomies as TaxonomyItem[] }))
              }
              restrictLimits={true}
              label="Book Taxonomies"
              helperText="Select and rank categories that describe your book. The order determines their importance in search results."
            />
          
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Book Details</h2>
            <div>
              <label className="block text-sm font-medium mb-1">
                Series (if part of one)
              </label>
              <Input
                value={formData.series}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, series: e.target.value }))
                }
                placeholder="Name of the series"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Setting</label>
              <Input
                value={formData.setting}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, setting: e.target.value }))
                }
                placeholder="Where/when does the story take place?"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Characters
              </label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={characterInput}
                  onChange={(e) => setCharacterInput(e.target.value)}
                  placeholder="Add a character"
                  onKeyPress={(e) => e.key === "Enter" && handleAddCharacter()}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddCharacter}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.characters.map((char, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        characters: prev.characters.filter(
                          (_, i) => i !== index,
                        ),
                      }))
                    }
                  >
                    {char} ×
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );
      
      case 7:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Referral Links</h2>
            <p className="text-sm text-muted-foreground">
              Add links where readers can purchase your book
            </p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                const { active, over } = event;
                if (over && active.id !== over.id) {
                  const oldIndex = Number(active.id);
                  const newIndex = Number(over.id);
                  setFormData((prev) => ({
                    ...prev,
                    referralLinks: arrayMove(
                      prev.referralLinks,
                      oldIndex,
                      newIndex,
                    ),
                  }));
                }
              }}
            >
              <SortableContext
                items={formData.referralLinks.map((_, i) => i)}
                strategy={verticalListSortingStrategy}
              >
                {formData.referralLinks.map((link, index) => (
                  <SortableReferralLink
                    key={index}
                    link={link}
                    index={index}
                    onChange={(newUrl) => {
                      const newLinks = [...formData.referralLinks];
                      newLinks[index] = { ...link, url: newUrl };
                      setFormData((prev) => ({
                        ...prev,
                        referralLinks: newLinks,
                      }));
                    }}
                    onRemove={() => {
                      setFormData((prev) => ({
                        ...prev,
                        referralLinks: prev.referralLinks.filter(
                          (_, i) => i !== index,
                        ),
                      }));
                    }}
                  />
                ))}
              </SortableContext>
            </DndContext>

            <div className="flex gap-2 mt-2">
              <Select
                onValueChange={(value) => {
                  const newLink: ReferralLink = {
                    retailer: value as (typeof RETAILER_OPTIONS)[number],
                    url: "",
                    customName: value === "Custom" ? "" : undefined,
                  };
                  setFormData((prev) => ({
                    ...prev,
                    referralLinks: [...prev.referralLinks, newLink],
                  }));
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
              {formData.referralLinks.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, referralLinks: [] }))
                  }
                >
                  Clear All
                </Button>
              )}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Preview</h2>
            <p className="text-sm text-muted-foreground">
              Review your book information before submitting
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
              <Card className="p-3 sm:p-4">
                <h3 className="font-medium mb-2 text-sm sm:text-base">Basic Information</h3>
                <dl className="space-y-1">
                  <dt className="text-sm font-medium">Title</dt>
                  <dd className="text-sm text-muted-foreground">
                    {formData.title}
                  </dd>
                  <dt className="text-sm font-medium mt-2">Description</dt>
                  <dd className="text-sm text-muted-foreground">
                    {formData.description}
                  </dd>
                  <dt className="text-sm font-medium mt-2">Internal Details</dt>
                  <dd className="text-sm text-muted-foreground">
                    {formData.internal_details}
                  </dd>
                </dl>
              </Card>
              <Card className="p-3 sm:p-4">
                <h3 className="font-medium mb-2 text-sm sm:text-base">Details</h3>
                <dl className="space-y-1">
                  {formData.series && (
                    <>
                      <dt className="text-sm font-medium">Series</dt>
                      <dd className="text-sm text-muted-foreground">
                        {formData.series}
                      </dd>
                    </>
                  )}
                  {formData.setting && (
                    <>
                      <dt className="text-sm font-medium mt-2">Setting</dt>
                      <dd className="text-sm text-muted-foreground">
                        {formData.setting}
                      </dd>
                    </>
                  )}
                  {formData.characters.length > 0 && (
                    <>
                      <dt className="text-sm font-medium mt-2">Characters</dt>
                      <dd className="flex flex-wrap gap-1">
                        {formData.characters.map((char, i) => (
                          <Badge key={i} variant="secondary">
                            {char}
                          </Badge>
                        ))}
                      </dd>
                    </>
                  )}
                </dl>
              </Card>
              {formData.hasAwards && formData.awards.length > 0 && (
                <Card className="p-3 sm:p-4">
                  <h3 className="font-medium mb-2 text-sm sm:text-base">Awards</h3>
                  <div className="flex flex-wrap gap-1">
                    {formData.awards.map((award, i) => (
                      <Badge key={i} variant="secondary">
                        {award}
                      </Badge>
                    ))}
                  </div>
                </Card>
              )}
              <Card className="p-3 sm:p-4">
                <h3 className="font-medium mb-2 text-sm sm:text-base">Formats & Publication</h3>
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
                      <dd className="text-sm text-muted-foreground">
                        {formData.pageCount}
                      </dd>
                    </>
                  )}
                  {formData.isbn && (
                    <>
                      <dt className="text-sm font-medium mt-2">ISBN</dt>
                      <dd className="text-sm text-muted-foreground">
                        {formData.isbn}
                      </dd>
                    </>
                  )}
                  {formData.asin && (
                    <>
                      <dt className="text-sm font-medium mt-2">ASIN</dt>
                      <dd className="text-sm text-muted-foreground">
                        {formData.asin}
                      </dd>
                    </>
                  )}
                </dl>
              </Card>
              <Card className="p-3 sm:p-4">
                <h3 className="font-medium mb-2 text-sm sm:text-base">Taxonomies</h3>
                {formData.genreTaxonomies && formData.genreTaxonomies.length > 0 ? (
                  <div className="space-y-3">
                    {/* Display taxonomies by type */}
                    {["genre", "subgenre", "theme", "trope"].map(type => {
                      const taxonomiesOfType = formData.genreTaxonomies!.filter(t => t.type === type);
                      if (taxonomiesOfType.length === 0) return null;
                      
                      return (
                        <div key={type}>
                          <h4 className="text-sm font-medium capitalize mb-1">{type}s</h4>
                          <div className="flex flex-wrap gap-1">
                            {taxonomiesOfType.map((tax, i) => (
                              <Badge 
                                key={`${tax.type}-${tax.taxonomyId}`} 
                                variant={
                                  tax.type === "genre" ? "default" :
                                  tax.type === "subgenre" ? "secondary" :
                                  tax.type === "theme" ? "outline" :
                                  "destructive"
                                }
                              >
                                {tax.name} ({(1 / (1 + Math.log(tax.rank))).toFixed(2)})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {formData.genreTaxonomies.map((tax: any, i: number) => (
                      <Badge key={i} variant="secondary">
                        {tax.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
              {formData.referralLinks.length > 0 && (
                <Card className="p-4">
                  <h3 className="font-medium mb-2">Referral Links</h3>
                  <dl className="space-y-1">
                    {formData.referralLinks.map((link, i) => (
                      <div key={i} className="text-sm">
                        <dt className="font-medium">
                          {link.customName || link.retailer}
                        </dt>
                        <dd className="text-muted-foreground truncate">
                          {link.url}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between mb-6">
        <div className="flex items-center overflow-x-auto pb-2 hide-scrollbar">
          <div className="flex items-center gap-1 sm:gap-2">
            {STEPS.map((step, index) => (
              <div key={step} className="flex items-center">
                <Button
                  variant={currentStep === index ? "default" : "ghost"}
                  className={cn(
                    "h-7 w-7 sm:h-8 sm:w-8 p-0",
                    index > currentStep && "opacity-50 cursor-not-allowed",
                  )}
                  onClick={() => index <= currentStep && setCurrentStep(index)}
                  disabled={index > currentStep}
                >
                  <span className="text-xs sm:text-sm">{index + 1}</span>
                </Button>
                {index < STEPS.length - 1 && (
                  <div className="w-3 sm:w-6 h-px bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="hidden sm:block text-sm font-medium">
          {STEPS[currentStep]}
        </div>
      </div>
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div className="min-h-[400px]">{renderStep()}</div>

      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 sm:justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((prev) => prev - 1)}
          disabled={currentStep === 0}
          className="sm:max-w-[100px] w-full"
        >
          Previous
        </Button>
        <div className="text-xs text-center text-muted-foreground mt-1 mb-2 sm:hidden">
          Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
        </div>
        {currentStep === STEPS.length - 1 ? (
          <Button
            onClick={() => uploadMutation.mutate(formData)}
            disabled={uploadMutation.isPending || !canProceed()}
            className="sm:max-w-[100px] w-full"
          >
            {uploadMutation.isPending
              ? book
                ? "Updating..."
                : "Uploading..."
              : book
                ? "Update"
                : "Submit"}
          </Button>
        ) : (
          <Button
            onClick={() => setCurrentStep((prev) => prev + 1)}
            disabled={!canProceed()}
            className="sm:max-w-[100px] w-full"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}