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
  const [error, setError] = useState<string | null>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (maxSize && file.size > maxSize) {
      return `File size should be less than ${maxSize / (1024 * 1024)}MB`;
    }

    // If accept is "*", skip type validation
    if (accept === "*") return null;

    // Split accept string into array of accepted types
    const acceptedTypes = accept.split(',').map(type => type.trim().toLowerCase());

    // For CSV files
    if (acceptedTypes.includes('.csv')) {
      const isCsv = file.name.toLowerCase().endsWith('.csv') || 
                   file.type === 'text/csv' ||
                   file.type === 'application/csv' ||
                   file.type === 'application/vnd.ms-excel' ||
                   file.type === 'text/plain'; // Some systems may use text/plain
      if (!isCsv) return `Please upload a valid CSV file`;
      return null;
    }

    // For .epub files, check both the extension and MIME type
    if (acceptedTypes.includes('.epub')) {
      const isEpub = file.name.toLowerCase().endsWith('.epub') || 
                    file.type === 'application/epub+zip';
      if (!isEpub) return `Please upload a valid EPUB file`;
    }

    // For .pdf files
    if (acceptedTypes.includes('.pdf')) {
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || 
                   file.type === 'application/pdf';
      if (!isPdf) return `Please upload a valid PDF file`;
    }

    // If none of the accepted types match
    return `Please upload a ${accept} file`;
  };

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
      setError(null);

      const files = Array.from(e.dataTransfer.files);
      const validFile = files[0];

      if (!validFile) return;

      const validationError = validateFile(validFile);
      if (validationError) {
        setError(validationError);
        return;
      }

      onFileChange(validFile);
    },
    [accept, maxSize, onFileChange]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const files = e.target.files;
      if (!files?.length) return;

      const validFile = files[0];

      const validationError = validateFile(validFile);
      if (validationError) {
        setError(validationError);
        return;
      }

      onFileChange(validFile);
    },
    [accept, maxSize, onFileChange]
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
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}