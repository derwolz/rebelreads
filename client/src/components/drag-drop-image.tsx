import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Image as ImageIcon } from "lucide-react";
import { IMAGE_TYPES } from "@shared/schema";

interface DragDropImageProps {
  value: File | null;
  onChange: (file: File) => void;
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
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(previewUrl || null);

  useEffect(() => {
    if (value) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(value);
    } else if (previewUrl) {
      setPreview(previewUrl);
    } else {
      setPreview(null);
    }
  }, [value, previewUrl]);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.[0]) {
      onChange(e.dataTransfer.files[0]);
    }
  };

  const handleButtonClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files?.[0]) {
        onChange(files[0]);
      }
    };
    input.click();
  };

  const getImageTypeLabel = () => {
    switch (imageType) {
      case "book-detail":
        return "Book Detail (480×600)";
      case "background":
        return "Background (1300×1500)";
      case "book-card":
        return "Book Card (256×440)";
      case "grid-item":
        return "Grid Item (56×212)";
      case "mini":
        return "Mini (48×64)";
      case "hero":
        return "Hero (1500×600)";
      default:
        return imageType;
    }
  };

  return (
    <Card
      className={`border-2 transition-colors ${
        dragOver ? "border-primary" : "border-dashed border-border"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center space-y-2 p-4 h-full">
        <div className="flex items-center justify-center text-xs font-medium bg-muted text-muted-foreground rounded-sm px-2 py-1">
          {getImageTypeLabel()} {required && <span className="text-red-500 ml-1">*</span>}
        </div>
        
        {preview ? (
          <>
            <div 
              className="relative overflow-hidden border rounded-md" 
              style={{ width: `${Math.min(width, 200)}px`, height: `${Math.min(height, 200)}px` }}
            >
              <img
                src={preview}
                alt={`${imageType} preview`}
                className="w-full h-full object-cover"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleButtonClick}>
              Change Image
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-full bg-muted p-2">
              <ImageIcon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Drag and drop image here
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleButtonClick}>
              <Upload className="w-3 h-3 mr-1" />
              Upload
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}