import React from "react";
import { Info } from "lucide-react";
import { UPLOAD_IMAGE_TYPES } from "@shared/schema";
import { DragDropImage } from "@/components/drag-drop-image";
import { StepComponentProps, BookImageFile } from "./types";

export function ImagesStep({ formData, setFormData }: StepComponentProps) {
  const handleImageChange = (
    imageType: string,
    file: File | null,
    hasError: boolean,
    errorMessage?: string
  ) => {
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Promotional Images</h2>
        <a 
          href="/image-guide" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline flex items-center gap-1"
        >
          <Info className="h-4 w-4" /> 
          Learn about image types
        </a>
      </div>
      
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
              onChange={(file, hasError, errorMessage) => 
                handleImageChange(imageType, file, hasError, errorMessage)
              }
              required={imageType === "book-detail" || imageType === "book-card" ? true : false}
            />
          );
        })}
      </div>
    </div>
  );
}