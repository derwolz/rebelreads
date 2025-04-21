import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FORMAT_OPTIONS } from "@shared/schema";
import { StepComponentProps, BookFormatFile } from "./types";
import { FileText, Upload, X, Check } from "lucide-react";

export function FormatsStep({ formData, setFormData }: StepComponentProps) {
  // Create refs for file inputs
  const fileInputRefs = FORMAT_OPTIONS.reduce((acc, format) => {
    acc[format] = useRef<HTMLInputElement>(null);
    return acc;
  }, {} as Record<string, React.RefObject<HTMLInputElement>>);

  const handleFormatToggle = (format: string) => {
    setFormData((prev) => {
      if (prev.formats.includes(format)) {
        // If removing a format, also remove any associated file
        const newBookFiles = { ...prev.bookFiles };
        delete newBookFiles[format];
        
        return {
          ...prev,
          formats: prev.formats.filter((f) => f !== format),
          bookFiles: newBookFiles
        };
      } else {
        return {
          ...prev,
          formats: [...prev.formats, format],
        };
      }
    });
  };

  const handleFileChange = (formatType: string, file: File | null) => {
    setFormData((prev) => {
      const bookFile: BookFormatFile = {
        formatType,
        file,
        fileName: file?.name,
        fileSize: file?.size,
      };
      
      return {
        ...prev,
        bookFiles: {
          ...prev.bookFiles,
          [formatType]: bookFile
        }
      };
    });
  };

  const triggerFileInput = (format: string) => {
    fileInputRefs[format]?.current?.click();
  };

  const removeFile = (format: string) => {
    setFormData((prev) => {
      const newBookFiles = { ...prev.bookFiles };
      if (newBookFiles[format]) {
        newBookFiles[format] = {
          ...newBookFiles[format],
          file: null
        };
      }
      
      return {
        ...prev,
        bookFiles: newBookFiles
      };
    });
    
    // Also clear the file input
    if (fileInputRefs[format]?.current) {
      fileInputRefs[format].current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Available Formats</h2>
        <p className="text-sm text-muted-foreground">
          Select the formats your book is available in and upload the corresponding files
        </p>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        {FORMAT_OPTIONS.map((format) => (
          <Button
            key={format}
            variant={
              formData.formats.includes(format) ? "default" : "outline"
            }
            className="h-16 sm:h-24 text-sm sm:text-lg py-2"
            onClick={() => handleFormatToggle(format)}
            type="button"
          >
            {format.charAt(0).toUpperCase() + format.slice(1)}
          </Button>
        ))}
      </div>
      
      {formData.formats.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Upload Book Files</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formData.formats.map((format) => {
              const bookFile = formData.bookFiles?.[format];
              const hasFile = bookFile?.file || bookFile?.fileUrl;
              
              return (
                <Card key={format} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h4 className="font-medium">{format.charAt(0).toUpperCase() + format.slice(1)}</h4>
                      </div>
                      
                      {hasFile && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeFile(format)}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove file</span>
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {hasFile ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">File selected:</span> 
                          <span className="truncate">{bookFile.fileName || (bookFile.fileUrl && 'Uploaded file')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => triggerFileInput(format)}
                            className="w-full"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload {format} file
                          </Button>
                        </div>
                      )}
                      
                      <input
                        type="file"
                        ref={fileInputRefs[format]}
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleFileChange(format, file);
                        }}
                        accept={
                          format === 'digital' 
                            ? '.pdf,.epub,.mobi' 
                            : format === 'audiobook' 
                              ? 'audio/*,.zip' 
                              : '.pdf'
                        }
                      />
                      
                      {format === 'digital' && (
                        <p className="text-xs text-muted-foreground">
                          Accepted formats: PDF, EPUB, MOBI
                        </p>
                      )}
                      
                      {format === 'audiobook' && (
                        <p className="text-xs text-muted-foreground">
                          Accepted formats: Audio files or ZIP of audio files
                        </p>
                      )}
                      
                      {(format === 'softback' || format === 'hardback') && (
                        <p className="text-xs text-muted-foreground">
                          Recommended format: PDF
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}