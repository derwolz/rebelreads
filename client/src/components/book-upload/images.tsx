import React from "react";
import { Info, ExternalLink } from "lucide-react";
import { UPLOAD_IMAGE_TYPES, IMAGE_TYPES } from "@shared/schema";
import { DragDropImage } from "@/components/drag-drop-image";
import { StepComponentProps, BookImageFile } from "./types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export function ImagesStep({ formData, setFormData }: StepComponentProps) {
  const { toast } = useToast();
  
  const handleImageChange = (
    imageType: string,
    file: File | null,
    hasError?: boolean,
    errorMessage?: string
  ) => {
    // Update form data with the new image file
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

  // Get image dimensions for a specific image type
  const getImageDimensions = (imageType: string): { width: number, height: number } => {
    switch(imageType) {
      case 'full':
        return { width: 1600, height: 2560 };
      case 'background':
        return { width: 1300, height: 1500 };
      case 'spine':
        return { width: 56, height: 256 };
      case 'hero':
        return { width: 1500, height: 600 };
      case 'book-cover':
        return { width: 480, height: 770 };
      case 'book-card':
        return { width: 256, height: 412 };
      case 'mini':
        return { width: 64, height: 40 };
      case 'vertical-banner':
        return { width: 400, height: 800 };
      case 'horizontal-banner':
        return { width: 800, height: 400 };
      default:
        return { width: 100, height: 100 };
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Book Images</h2>
      </div>

      <Alert className="bg-primary/10 border-primary">
        <div className="flex justify-between items-center w-full">
          <AlertDescription className="flex items-center gap-2 text-base">
            <Info className="h-5 w-5 text-primary" /> 
            All images must be exactly the specified dimensions
          </AlertDescription>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-primary text-primary hover:bg-primary/10"
            asChild
          >
            <a 
              href="/image-guide" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1"
            >
              <ExternalLink className="h-4 w-4" /> 
              Learn about image requirements
            </a>
          </Button>
        </div>
      </Alert>
      
      <div className="mb-4">
        <h3 className="text-md font-medium mb-2">Required Images</h3>
        <p className="text-sm text-muted-foreground mb-4">
          These images are required to create a book. The full-size image will be used to automatically generate the book-card and mini images.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          {UPLOAD_IMAGE_TYPES.map((imageType) => {
            // Make sure we have dimensions for this image type in the form data
            if (!formData.bookImages[imageType]) {
              const dimensions = getImageDimensions(imageType);
              setFormData((prev) => ({
                ...prev,
                bookImages: {
                  ...prev.bookImages,
                  [imageType]: {
                    type: imageType,
                    file: null,
                    width: dimensions.width,
                    height: dimensions.height
                  }
                }
              }));
            }
            
            const imageData = formData.bookImages[imageType];
            return (
              <DragDropImage
                key={imageType}
                imageType={imageType}
                value={imageData.file}
                width={imageData.width}
                height={imageData.height}
                previewUrl={imageData.previewUrl}
                onChange={(file, hasError = false, errorMessage) => 
                  handleImageChange(imageType, file, hasError, errorMessage)
                }
                required={imageType === "full" || imageType === "background" || imageType === "hero" ? true : false}
              />
            );
          })}
        </div>
      </div>
      
      <div>
        <h3 className="text-md font-medium mb-2">Additional Banner Images</h3>
        <p className="text-sm text-muted-foreground mb-4">
          These optional banner images can be used for promotional purposes.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          {['vertical-banner', 'horizontal-banner'].map((imageType) => {
            // Make sure we have dimensions for this image type in the form data
            if (!formData.bookImages[imageType]) {
              const dimensions = getImageDimensions(imageType);
              setFormData((prev) => ({
                ...prev,
                bookImages: {
                  ...prev.bookImages,
                  [imageType]: {
                    type: imageType,
                    file: null,
                    width: dimensions.width,
                    height: dimensions.height
                  }
                }
              }));
            }
            
            const imageData = formData.bookImages[imageType];
            return (
              <DragDropImage
                key={imageType}
                imageType={imageType}
                value={imageData.file}
                width={imageData.width}
                height={imageData.height}
                previewUrl={imageData.previewUrl}
                onChange={(file, hasError = false, errorMessage) => 
                  handleImageChange(imageType, file, hasError, errorMessage)
                }
                required={false}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}