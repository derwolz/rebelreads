import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { IMAGE_TYPES, UPLOAD_IMAGE_TYPES } from "@shared/schema";
import type { Book } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookFormData, WizardControllerProps } from "./types";
import { 
  BookText, 
  Images, 
  Award, 
  BookOpen, 
  Calendar, 
  Tags, 
  FileText, 
  Link as LinkIcon, 
  Eye,
  Info,
  Loader2
} from "lucide-react";

// Import step components
import { BasicInfoStep } from "./basic-info";
import { ImagesStep } from "./images";
import { AwardsStep } from "./awards";
import { FormatsStep } from "./formats";
import { PublicationStep } from "./publication";
import { GenresStep } from "./genres";
import { BookDetailsStep } from "./book-details";
import { ReferralLinksStep } from "./referral-links";
import { PreviewStep } from "./preview";
import { TaxonomyItem } from "@/components/genre-selector";

const STEPS = [
  { 
    title: "Basic Information",
    component: BasicInfoStep,
    icon: <BookText aria-hidden="true" className="h-4 w-4" />
  },
  { 
    title: "Images",
    component: ImagesStep,
    icon: <Images aria-hidden="true" className="h-4 w-4" />
  },
  { 
    title: "Awards",
    component: AwardsStep,
    icon: <Award aria-hidden="true" className="h-4 w-4" />
  },
  { 
    title: "Formats",
    component: FormatsStep,
    icon: <BookOpen aria-hidden="true" className="h-4 w-4" />
  },
  { 
    title: "Publication",
    component: PublicationStep,
    icon: <Calendar aria-hidden="true" className="h-4 w-4" />
  },
  { 
    title: "Genres",
    component: GenresStep,
    icon: <Tags aria-hidden="true" className="h-4 w-4" />
  },
  { 
    title: "Book Details",
    component: BookDetailsStep,
    icon: <FileText aria-hidden="true" className="h-4 w-4" />
  },
  { 
    title: "Referral Links",
    component: ReferralLinksStep,
    icon: <LinkIcon aria-hidden="true" className="h-4 w-4" />
  },
  { 
    title: "Preview",
    component: PreviewStep,
    icon: <Eye aria-hidden="true" className="h-4 w-4" />
  },
];

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

export function BookUploadWizard({ onSuccess, book }: WizardControllerProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  // Local storage key for storing form data
  const LOCAL_STORAGE_KEY = "book_upload_form_data";
  
  // Fetch book taxonomies when editing a book
  const { data: bookTaxonomies } = useQuery<TaxonomyItem[]>({
    queryKey: ["/api/books", book?.id, "taxonomies"],
    queryFn: async () => {
      if (!book?.id) return [];
      const response = await fetch(`/api/books/${book.id}/taxonomies`);
      if (!response.ok) throw new Error("Failed to fetch book taxonomies");
      return response.json();
    },
    enabled: !!book?.id, // Only run this query if we have a book ID
  });
  
  // Helper function to create empty book images structure
  const createEmptyBookImages = (): Record<string, BookImageFile> => {
    const images: Partial<Record<string, BookImageFile>> = {};
    
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
    
    return images as Record<string, BookImageFile>;
  };
  
  // Initialize form data from local storage or defaults
  const [formData, setFormData] = useState<BookFormData>(() => {
    // If editing an existing book, don't use local storage
    if (book) {
      // Create book images structure with existing images if available
      const bookImages = createEmptyBookImages();
      
      // If the book has images, populate the URLs
      if (book.images && book.images.length > 0) {
        console.log("Book has images:", book.images.map(img => `${img.imageType}: ${img.imageUrl}`));
        
        // Initialize existing image URLs
        book.images.forEach(image => {
          const imageType = image.imageType;
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
        internal_details: book.internal_details || "",
        bookImages: bookImages,
      };
    }
    
    // Check if we have saved form data in local storage for a new book
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        
        // Reconstruct the formData object from saved data
        // Note: Files cannot be stored in localStorage, so bookImages will still have null files
        return {
          ...parsedData,
          bookImages: createEmptyBookImages() // Files can't be saved, so always create empty image containers
        };
      }
    } catch (error) {
      console.error("Error loading form data from local storage:", error);
    }
    
    // Return default empty form if no local storage data exists
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
  
  // Save form data to local storage whenever it changes
  useEffect(() => {
    // Only save to local storage if not editing an existing book
    if (!book) {
      try {
        // Create a copy of formData that excludes file objects which can't be serialized
        const dataToSave = {
          ...formData,
          // Remove file objects which can't be stored in localStorage
          bookImages: Object.fromEntries(
            Object.entries(formData.bookImages).map(([key, value]) => [
              key,
              { ...value, file: null }
            ])
          ),
        };
        
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (error) {
        console.error("Error saving form data to local storage:", error);
      }
    }
  }, [formData, book]);
  
  // Update form data when book taxonomies are loaded
  useEffect(() => {
    if (bookTaxonomies && bookTaxonomies.length > 0) {
      console.log("Loaded book taxonomies:", bookTaxonomies);
      setFormData(prevData => ({
        ...prevData,
        genreTaxonomies: bookTaxonomies
      }));
    }
  }, [bookTaxonomies]);

  const uploadMutation = useMutation({
    mutationFn: async (data: BookFormData) => {
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
      
      // Clear form data from local storage after successful submission
      if (!book) {
        try {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch (error) {
          console.error("Error removing form data from local storage:", error);
        }
      }
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${book ? "update" : "upload"} book: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Check if a specific step can be navigated to based on data availability
  const canSkipToStep = (stepIndex: number) => {
    // Always allow skipping to current or previous steps
    if (stepIndex <= currentStep) return true;

    // For future steps, check if all the necessary data is available
    // This is similar to canProceed but doesn't need to be as strict
    for (let i = 0; i < stepIndex; i++) {
      if (!canProceedFromStep(i)) return false;
    }
    
    return true;
  };

  // Check if we can proceed from the current step
  const canProceedFromStep = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Basic Information
        return !!formData.title && !!formData.description;
      case 1: // Images
        // Require at least book-detail and book-card images
        const requiredImageTypes = ["book-detail", "book-card"];
        return requiredImageTypes.every(type => 
          (formData.bookImages[type]?.file || formData.bookImages[type]?.previewUrl) && 
          !formData.bookImages[type]?.error
        );
      case 2: // Awards
        return !formData.hasAwards || formData.awards.length > 0;
      case 3: // Formats
        return formData.formats.length > 0;
      case 4: // Publication
        return !!formData.publishedDate;
      case 5: // Genres
        return formData.genreTaxonomies.length > 0;
      case 6: // Book Details
        return true; // No required fields in this step
      case 7: // Referral Links
        return formData.referralLinks.every(link => !!link.url);
      case 8: // Preview
        return true; // Preview step is always valid
      default:
        return false;
    }
  };

  // Handle image change - used by the ImagesStep component
  const handleImageChange = (imageType: string, file: File | null, hasError: boolean, errorMessage?: string) => {
    console.log(`Image change: ${imageType}, File: ${file?.name}, Error: ${hasError ? errorMessage : 'none'}`);
    
    setFormData((prev) => {
      const newImages = {
        ...prev.bookImages,
        [imageType]: {
          ...prev.bookImages[imageType],
          file,
          error: hasError ? errorMessage : undefined
        }
      };
      
      return {
        ...prev,
        bookImages: newImages
      };
    });
  };

  // Get validation errors for the current step
  const getCurrentStepErrors = (): string[] => {
    const errors: string[] = [];
    
    switch (currentStep) {
      case 0: // Basic Information
        if (!formData.title) errors.push("Title is required");
        if (!formData.description) errors.push("Description is required");
        break;
      case 1: // Images
        const requiredImageTypes = ["book-detail", "book-card"];
        requiredImageTypes.forEach(type => {
          if (!formData.bookImages[type]?.file && !formData.bookImages[type]?.previewUrl) {
            errors.push(`${type} image is required`);
          } else if (formData.bookImages[type]?.error) {
            errors.push(formData.bookImages[type].error || `${type} image has an error`);
          }
        });
        
        // Also check for errors in optional images that have been uploaded
        Object.entries(formData.bookImages)
          .filter(([type]) => !requiredImageTypes.includes(type))
          .forEach(([type, imageData]) => {
            if ((imageData.file || imageData.previewUrl) && imageData.error) {
              errors.push(imageData.error || `${type} image has an error`);
            }
          });
        break;
      case 2: // Awards
        if (formData.hasAwards && formData.awards.length === 0) {
          errors.push("Please add at least one award or uncheck the awards checkbox");
        }
        break;
      case 3: // Formats
        if (formData.formats.length === 0) {
          errors.push("Please select at least one format");
        }
        break;
      case 4: // Publication
        if (!formData.publishedDate) errors.push("Publication date is required");
        break;
      case 5: // Genres
        if (formData.genreTaxonomies.length === 0) {
          errors.push("Please select at least one genre");
        }
        break;
      case 7: // Referral Links
        formData.referralLinks.forEach((link, index) => {
          if (!link.url) {
            errors.push(`URL for link #${index + 1} is required`);
          } else if (!link.url.startsWith('http')) {
            errors.push(`URL for link #${index + 1} must start with http:// or https://`);
          }
        });
        break;
    }
    
    return errors;
  };

  // Handle navigation to the next step
  const handleNext = () => {
    const errors = getCurrentStepErrors();
    
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: (
          <ul className="list-disc pl-4">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        ),
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Handle navigation to the previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation check
    for (let i = 0; i < STEPS.length - 1; i++) {
      if (!canProceedFromStep(i)) {
        setCurrentStep(i);
        toast({
          title: "Validation Error",
          description: `Please complete the "${STEPS[i].title}" step before submitting.`,
          variant: "destructive",
        });
        return;
      }
    }
    
    uploadMutation.mutate(formData);
  };

  // Render the current step component
  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step navigation */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        {STEPS.map((step, index) => (
          <Button
            key={index}
            type="button"
            variant={index === currentStep ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-1 whitespace-nowrap"
            onClick={() => canSkipToStep(index) && setCurrentStep(index)}
            disabled={!canSkipToStep(index)}
          >
            {step.icon}
           
            <span className="inline sm:hidden">{index + 1}</span>
          </Button>
        ))}
      </div>

      {/* Current step content */}
      <div className="min-h-[300px]">
        <CurrentStepComponent formData={formData} setFormData={setFormData} />
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between">
        <div>
          {currentStep > 0 && (
            <Button type="button" variant="outline" onClick={handlePrevious}>
              Previous
            </Button>
          )}
          {currentStep === 0 && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowCancelConfirm(true)}
            >
              Cancel
            </Button>
          )}
        </div>
        <div>
          {currentStep < STEPS.length - 1 ? (
            <Button type="button" onClick={handleNext}>
              Next
            </Button>
          ) : (
            <Button 
              type="submit" 
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {book ? "Update Book" : "Create Book"}
            </Button>
          )}
        </div>
      </div>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will be lost if you cancel now. Do you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, continue editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onSuccess) onSuccess();
              }}
            >
              Yes, cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}

// Import the Edit icon and BookImageFile type
import { Edit } from "lucide-react";
import { BookImageFile } from "./types";