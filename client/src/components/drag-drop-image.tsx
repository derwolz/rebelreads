import React, { useRef, useState } from 'react';
import { Upload, X, AlertCircle } from 'lucide-react';
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
      onChange(file, true, errorMessage);
      return;
    }
    
    // Create an Image object to check dimensions
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = () => {
      // Allow a small tolerance (±10 pixels) for image dimensions
      const tolerance = 10;
      const widthMatches = Math.abs(img.width - width) <= tolerance;
      const heightMatches = Math.abs(img.height - height) <= tolerance;
      
      if (!widthMatches || !heightMatches) {
        const errorMessage = `Image must be ${width}×${height} pixels`;
        setError(errorMessage);
        toast({
          title: "Wrong image dimensions",
          description: `The image must be ${width}×${height} pixels, but got ${img.width}×${img.height}`,
          variant: "destructive"
        });
        
        // Pass the file but with error information
        onChange(file, true, errorMessage);
        URL.revokeObjectURL(objectUrl);
        return;
      }
      
      // Image is valid, proceed
      onChange(file, false);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      URL.revokeObjectURL(objectUrl);
    };
    
    img.onerror = () => {
      const errorMessage = "Failed to load image";
      setError(errorMessage);
      toast({
        title: "Image error",
        description: "Failed to process the image. Please try another one.",
        variant: "destructive"
      });
      onChange(file, true, errorMessage);
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
  };

  const getTypeLabel = (type: typeof IMAGE_TYPES[number]) => {
    switch(type) {
      case 'book-detail':
        return 'Book Detail (480×600)';
      case 'background':
        return 'Background (1300×1500)';
      case 'book-card':
        return 'Book Card (256×440)';
      case 'grid-item':
        return 'Grid Item (56×212)';
      case 'mini':
        return 'Mini (48×64)';
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
            Required size: {width}×{height}
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
          <p className="text-[10px] sm:text-xs text-center text-muted-foreground mt-1">
            Required size: {width}×{height}
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