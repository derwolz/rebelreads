import React from "react";
import { Info, ExternalLink } from "lucide-react";
import { UPLOAD_IMAGE_TYPES } from "@shared/schema";
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

    
    // If this is the 'full' image upload, generate preview versions for book-card and mini from the full image
    if (imageType === 'full' && file && !hasError) {
      toast({
        title: "Full image uploaded",
        description: "This high-resolution image will be resized for the other image types during processing.",
      });
    }
    
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

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Promotional Images</h2>
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
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
        {UPLOAD_IMAGE_TYPES.map((imageType) => {
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
              required={imageType === "full" ? true : false}
            />
          );
        })}
      </div>
    </div>
  );
}