import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Upload } from "lucide-react";

interface DragDropFileProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  maxSize?: number;
}

export function DragDropFile({ file, onFileChange, accept = "*", maxSize }: DragDropFileProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const validFile = files[0];

      if (!validFile) return;

      // Check file type
      if (accept !== "*" && !validFile.type.includes(accept.replace(".", ""))) {
        alert(`Please upload a ${accept} file`);
        return;
      }

      // Check file size
      if (maxSize && validFile.size > maxSize) {
        alert(`File size should be less than ${maxSize / (1024 * 1024)}MB`);
        return;
      }

      onFileChange(validFile);
    },
    [accept, maxSize, onFileChange]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files?.length) return;

      const validFile = files[0];

      // Check file size
      if (maxSize && validFile.size > maxSize) {
        alert(`File size should be less than ${maxSize / (1024 * 1024)}MB`);
        return;
      }

      onFileChange(validFile);
    },
    [maxSize, onFileChange]
  );

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer",
        isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/20",
        "transition-colors duration-200"
      )}
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      onClick={() => document.getElementById("fileInput")?.click()}
    >
      <input
        id="fileInput"
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileInput}
      />
      <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
      {file ? (
        <div>
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-muted-foreground">
            {(file.size / (1024 * 1024)).toFixed(2)}MB
          </p>
        </div>
      ) : (
        <div>
          <p className="font-medium">
            Drop your file here or click to browse
          </p>
          <p className="text-sm text-muted-foreground">
            Supports {accept} files up to {maxSize ? `${maxSize / (1024 * 1024)}MB` : "unlimited size"}
          </p>
        </div>
      )}
    </div>
  );
}
