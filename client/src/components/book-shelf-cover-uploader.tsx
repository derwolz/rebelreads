import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { X, Upload, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BookShelfCoverUploaderProps {
  value: File | string | null;
  onChange: (value: File | string | null) => void;
  onError?: (error: string | null) => void;
}

export function BookShelfCoverUploader({
  value,
  onChange,
  onError,
}: BookShelfCoverUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    typeof value === "string" ? value : null
  );
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const TARGET_WIDTH = 250;
  const TARGET_HEIGHT = 400;

  const displayHeight = 160; // Height for display in the form

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    if (onError) {
      onError(errorMessage);
    }
    toast({
      title: "Upload Error",
      description: errorMessage,
      variant: "destructive",
    });
  };

  const processImage = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      handleError("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB
      handleError("Image must be smaller than 5MB");
      return;
    }

    // Create an image element to get dimensions
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    
    img.onload = async () => {
      try {
        // Calculate scaling factor to maintain aspect ratio
        let width = img.width;
        let height = img.height;
        let scale = 1;
        
        // Scale down if needed
        if (width > TARGET_WIDTH || height > TARGET_HEIGHT) {
          const scaleX = TARGET_WIDTH / width;
          const scaleY = TARGET_HEIGHT / height;
          scale = Math.min(scaleX, scaleY);
          
          width = width * scale;
          height = height * scale;
        }
        
        // Create canvas for resizing
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Could not get canvas context");
        }
        
        // Draw the image on the canvas with scaling
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert canvas to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              handleError("Failed to process image");
              return;
            }
            
            // Create a file from the blob
            const resizedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            
            // Update the preview and value
            setPreview(URL.createObjectURL(resizedFile));
            onChange(resizedFile);
            setError(null);
            if (onError) {
              onError(null);
            }
          },
          "image/jpeg",
          0.92
        );
      } catch (error) {
        console.error("Error processing image:", error);
        handleError("Failed to process image");
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      handleError("Failed to load image");
    };
    
    img.src = objectUrl;
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImage(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImage(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const handleClear = () => {
    setPreview(null);
    onChange(null);
    setError(null);
    if (onError) {
      onError(null);
    }
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("space-y-2 border rounded-md p-2", error && "border-destructive")}>
      <div className="text-sm font-medium mb-1">Bookshelf Cover</div>
      
      {preview || (value && typeof value !== "string") ? (
        <div className="relative">
          <div style={{ width: "100%", height: displayHeight }} className="relative mx-auto">
            <img
              src={preview || (value && typeof value !== "string" ? URL.createObjectURL(value) : "")}
              alt="Bookshelf cover"
              className="object-contain w-full h-full"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-0 right-0 w-6 h-6"
              onClick={handleClear}
            >
              <X size={14} />
            </Button>
          </div>
          <div className="mt-1 text-center text-xs text-muted-foreground">
            Target size: {TARGET_WIDTH}×{TARGET_HEIGHT}
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer p-4',
            isDragging ? 'border-primary bg-primary/10' : error ? 'border-destructive bg-destructive/10' : 'border-border'
          )}
          style={{ height: displayHeight, minHeight: '80px' }}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {error ? (
            <AlertCircle size={20} className="text-destructive mb-2" />
          ) : (
            <Upload size={20} className="text-muted-foreground mb-2" />
          )}
          <p className="text-sm text-center text-muted-foreground">
            Drag & drop or click to upload
          </p>
          <p className="text-xs text-center text-muted-foreground mt-1">
            Target size: {TARGET_WIDTH}×{TARGET_HEIGHT}
          </p>
          {error && (
            <p className="text-xs text-center text-destructive mt-2">
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