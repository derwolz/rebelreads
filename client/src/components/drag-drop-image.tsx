import React, { useRef, useState } from 'react';
import { Upload, X, AlertCircle, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMAGE_TYPES } from '@shared/schema';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface DragDropImageProps {
  value: File | null;
  onChange: (file: File, hasError?: boolean, errorMessage?: string) => void;
  title?: string;
  previewUrl?: string;
  imageType: typeof IMAGE_TYPES[number];
  width: number;
  height: number;
  required?: boolean;
}

export function DragDropImage({
  value,
  onChange,
  title,
  previewUrl,
  imageType,
  width,
  height,
  required = false,
}: DragDropImageProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(previewUrl || null);
  const [error, setError] = useState<string | null>(null);

  // Use 100% width as requested by the user instead of scaling
  const displayHeight = 200; // Fixed display height

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        handleImageSelected(file);
      }
    }
  };

  // Process images by validating dimensions strictly
  const processImageForUpload = (img: HTMLImageElement, file: File, objectUrl: string) => {
    // Validate dimensions strictly for all image types
    const errorThreshold = 2; // Allow only 2px difference to account for metadata issues
    
    if (Math.abs(img.width - width) > errorThreshold || Math.abs(img.height - height) > errorThreshold) {
      const errorMessage = `Image must be exactly ${width}×${height} pixels. Your image is ${img.width}×${img.height}.`;
      setError(errorMessage);
      toast({
        title: "Incorrect image dimensions",
        description: errorMessage,
        variant: "destructive"
      });
      // Pass null as the file to free the slot
      onChange(null as any, true, errorMessage);
      URL.revokeObjectURL(objectUrl);
      return;
    }
    
    // For full images that will be used to generate other sizes, we need exact dimensions
    // but we also need to create book-card and mini variants server-side
    if (imageType === 'full') {
      // We'll pass the file without modifications, but tag it so the backend knows to generate variants
      setPreview(objectUrl);
      onChange(file, false);
    } else {
      // Create preview for display
      setPreview(objectUrl);
      
      // Pass the original file as it already has the correct dimensions
      onChange(file, false);
    }
  };

  const handleImageSelected = (file: File) => {
    setError(null);
    
    // Check file size first (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      const errorMessage = "Image is too large (max 5MB)";
      setError(errorMessage);
      toast({
        title: "Image too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      });
      // Pass null as the file to free the slot
      onChange(null as any, true, errorMessage);
      return;
    }
    
    // Create an Image object to check dimensions
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      // Process or validate the image
      processImageForUpload(img, file, objectUrl);
    };
    
    img.onerror = () => {
      const errorMessage = "Failed to load image";
      setError(errorMessage);
      toast({
        title: "Image error",
        description: "Failed to process the image. Please try another one.",
        variant: "destructive"
      });
      // Pass null as the file to free the slot
      onChange(null as any, true, errorMessage);
      URL.revokeObjectURL(objectUrl);
    };
    
    img.src = objectUrl;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageSelected(e.target.files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleClear = () => {
    setPreview(null);
    setError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    // Pass null as the file to free the slot completely
    onChange(null as any, false);
  };

  const getTypeLabel = (type: typeof IMAGE_TYPES[number]) => {
    switch(type) {
      case 'full':
        return 'Book Cover (1600×2560)';
      case 'background':
        return 'Background (1300×1500)';
      case 'book-card':
        return 'Book Card (260×435)';
      case 'spine':
        return 'Spine (56×212)';
      case 'mini':
        return 'Mini (64×40)';
      case 'hero':
        return 'Hero (1500×600)';
      default:
        return type;
    }
  };

  return (
    <div className={cn("space-y-2 border rounded-md p-2 sm:p-4", error && "border-destructive")}>
      <div className="text-xs sm:text-sm font-medium mb-1 sm:mb-2">
        {getTypeLabel(imageType)} {required && <span className="text-red-500">*</span>}
      </div>
      
      {preview || value ? (
        <div className="relative">
          <div style={{ width: "100%", height: displayHeight }} className="relative mx-auto">
            <img
              src={preview || URL.createObjectURL(value as File)}
              alt={title || 'Book image'}
              className="object-contain w-full h-full"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8"
              onClick={handleClear}
            >
              <X size={14} />
            </Button>
          </div>
          <div className="mt-1 sm:mt-2 text-center text-xs text-muted-foreground">
            Required size: {width}×{height} pixels
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer p-2 sm:p-4',
            isDragging ? 'border-primary bg-primary/10' : error ? 'border-destructive bg-destructive/10' : 'border-border'
          )}
          style={{ height: displayHeight + 20, minHeight: '80px' }}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {error ? (
            <AlertCircle size={20} className="text-destructive mb-1 sm:mb-2" />
          ) : (
            <Upload size={20} className="text-muted-foreground mb-1 sm:mb-2" />
          )}
          <p className="text-xs sm:text-sm text-center text-muted-foreground">
            Tap to select image
          </p>
          <p className="text-[10px] sm:text-xs text-center font-semibold text-primary mt-1">
            Required size: {width}×{height} pixels
          </p>

          {error && (
            <p className="text-[10px] sm:text-xs text-center text-destructive mt-1 sm:mt-2">
              {error}
            </p>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}