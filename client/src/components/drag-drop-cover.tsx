import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ImageIcon, Upload } from "lucide-react";

interface DragDropCoverProps {
  title: string;
  onChange: (file: File | null) => void;
  value: File | null;
}

export function DragDropCover({ title, onChange, value }: DragDropCoverProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    onChange(file);
  };

  const handleButtonClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div
      className={cn(
        "relative border-2 border-dashed rounded-lg p-6 transition-colors",
        isDragging ? "border-primary bg-primary/10" : "border-border",
        "hover:border-primary/50"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="flex flex-col items-center justify-center space-y-4 h-[300px]">
        {preview ? (
          <>
            <div className="relative w-48 h-72">
              <img
                src={preview}
                alt="Book cover preview"
                className="w-full h-full object-cover rounded-lg shadow-lg"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 rounded-b-lg">
                <p className="text-sm font-medium text-center truncate">
                  {title || 'Untitled Book'}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleButtonClick}>
              Change Cover
            </Button>
          </>
        ) : (
          <>
            <div className="rounded-full bg-muted p-4">
              <ImageIcon className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                Drag and drop your book cover here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to select a file
              </p>
            </div>
            <Button variant="outline" onClick={handleButtonClick}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Cover
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
