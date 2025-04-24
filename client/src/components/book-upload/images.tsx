import React, { useState, useEffect } from "react";
import { Info, ExternalLink, RefreshCw } from "lucide-react";
import { UPLOAD_IMAGE_TYPES, IMAGE_TYPES } from "@shared/schema";
import { DragDropImage } from "@/components/drag-drop-image";
import { StepComponentProps, BookImageFile } from "./types";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { GeneratedImagePreview } from "./generated-image-preview";
import { generateDerivedImages } from "@/utils/image-processor";

export function ImagesStep({ formData, setFormData }: StepComponentProps) {
  const { toast } = useToast();
  
  // State to track when derived images have been generated
  const [derivedImagesGenerated, setDerivedImagesGenerated] = useState(false);
  
  // Handle image change for any image type
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
          error: hasError ? errorMessage : undefined,
          // If this is a full image, it's not considered generated
          isGenerated: imageType === 'full' ? false : prev.bookImages[imageType]?.isGenerated
        }
      };
      
      return {
        ...prev,
        bookImages: newImages
      };
    });
    
    // If this is a full-size image that was just uploaded, generate derived images
    if (imageType === 'full' && file && !hasError) {
      generateDerivedImagesFromFull(file);
    }
  };
  
  // Generate derived images (mini, book-card) from the full-size image
  const generateDerivedImagesFromFull = async (fullSizeFile: File) => {
    try {
      // Start the generation process
      toast({
        title: "Generating Images",
        description: "Creating smaller versions from your full-size image...",
      });
      
      // Generate the derived images on the client side
      const derivedImages = await generateDerivedImages(fullSizeFile);
      
      // Update the form data with the generated images
      setFormData((prev) => {
        const newImages = {
          ...prev.bookImages,
          'mini': {
            ...prev.bookImages['mini'],
            file: derivedImages.mini,
            isGenerated: true,
            sourceImageUrl: prev.bookImages['full'].file 
              ? URL.createObjectURL(prev.bookImages['full'].file) 
              : undefined
          },
          'book-card': {
            ...prev.bookImages['book-card'],
            file: derivedImages.bookCard,
            isGenerated: true,
            sourceImageUrl: prev.bookImages['full'].file 
              ? URL.createObjectURL(prev.bookImages['full'].file) 
              : undefined
          }
        };
        
        return {
          ...prev,
          bookImages: newImages
        };
      });
      
      // Mark derived images as generated
      setDerivedImagesGenerated(true);
      
      toast({
        title: "Images Generated",
        description: "Smaller versions have been created. You can review them below.",
      });
    } catch (error) {
      console.error('Error generating derived images:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate smaller images. Please try again or upload them manually.",
        variant: "destructive"
      });
    }
  };
  
  // Accept a generated image (just removes the isGenerated flag)
  const handleAcceptGeneratedImage = (imageType: string) => {
    setFormData((prev) => {
      const newImages = {
        ...prev.bookImages,
        [imageType]: {
          ...prev.bookImages[imageType],
          isGenerated: false
        }
      };
      
      return {
        ...prev,
        bookImages: newImages
      };
    });
    
    toast({
      title: "Image Accepted",
      description: `The generated ${imageType.replace('-', ' ')} image has been accepted.`
    });
  };
  
  // Reject a generated image (clears the file)
  const handleRejectGeneratedImage = (imageType: string) => {
    setFormData((prev) => {
      const newImages = {
        ...prev.bookImages,
        [imageType]: {
          ...prev.bookImages[imageType],
          file: null,
          isGenerated: false
        }
      };
      
      return {
        ...prev,
        bookImages: newImages
      };
    });
    
    toast({
      title: "Image Rejected",
      description: `The generated ${imageType.replace('-', ' ')} image has been discarded. You can upload your own.`
    });
  };
  
  // Regenerate a derived image
  const handleRegenerateImage = (imageType: string) => {
    // Only regenerate if there's a full-size image to work with
    if (formData.bookImages['full']?.file) {
      // Regenerate just this specific derived image
      if (imageType === 'mini' || imageType === 'book-card') {
        generateDerivedImagesFromFull(formData.bookImages['full'].file);
      }
    } else {
      toast({
        title: "Cannot Regenerate",
        description: "You need to upload a full-size image first.",
        variant: "destructive"
      });
    }
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
        return { width: 60, height: 96 };
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
      
      {/* Generated Images Preview */}
      {(formData.bookImages['mini']?.isGenerated || formData.bookImages['book-card']?.isGenerated) && (
        <div className="mb-4">
          <Card className="bg-muted/30 border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Generated Images Preview</CardTitle>
              <CardDescription>
                These images were automatically generated from your full-size image.
                You can accept them as is, regenerate them, or upload your own versions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Mini Image Preview */}
                {formData.bookImages['mini']?.isGenerated && (
                  <GeneratedImagePreview
                    imageType="mini"
                    imageData={formData.bookImages['mini']}
                    onAccept={() => handleAcceptGeneratedImage('mini')}
                    onReject={() => handleRejectGeneratedImage('mini')}
                    onRegenerate={() => handleRegenerateImage('mini')}
                  />
                )}
                
                {/* Book Card Image Preview */}
                {formData.bookImages['book-card']?.isGenerated && (
                  <GeneratedImagePreview
                    imageType="book-card"
                    imageData={formData.bookImages['book-card']}
                    onAccept={() => handleAcceptGeneratedImage('book-card')}
                    onReject={() => handleRejectGeneratedImage('book-card')}
                    onRegenerate={() => handleRegenerateImage('book-card')}
                  />
                )}
              </div>
              
              <div className="mt-4 pt-2 border-t flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  You can generate new images anytime after updating the full-size image
                </p>
                
                {formData.bookImages['full']?.file && (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (formData.bookImages['full'].file) {
                        generateDerivedImagesFromFull(formData.bookImages['full'].file);
                      }
                    }}
                    className="flex items-center gap-1"
                  >
                    <RefreshCw className="h-4 w-4" /> Regenerate All
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div>
        <h3 className="text-md font-medium mb-2">Additional Banner Images</h3>
        <p className="text-sm text-muted-foreground mb-4">
          These optional banner images can be used for promotional purposes.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          {(['vertical-banner', 'horizontal-banner'] as const).map((imageType) => {
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