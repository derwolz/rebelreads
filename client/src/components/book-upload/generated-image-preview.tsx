import React from "react";
import { X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BookImageFile } from "./types";

interface GeneratedImagePreviewProps {
  imageType: string;
  imageData: BookImageFile;
  onDelete: () => void;
}

export function GeneratedImagePreview({
  imageType,
  imageData,
  onDelete
}: GeneratedImagePreviewProps) {
  // Create a preview URL for the file
  const previewUrl = imageData.file ? URL.createObjectURL(imageData.file) : null;
  
  // Format image type for display
  const formattedType = imageType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  return (
    <Card className="overflow-hidden h-full">
      <CardContent className="p-0 h-full">
        {/* Top section with image preview */}
        <div className="relative h-full">
          {/* The preview image */}
          {previewUrl && (
            <div className="relative overflow-hidden h-full flex items-center justify-center bg-gradient-to-t from-black/10 to-transparent">
              <img 
                src={previewUrl} 
                alt={`Generated ${formattedType} preview`}
                className="object-contain max-w-full"
                style={{ 
                  width: imageData.width,
                  height: imageData.height
                }}
              />
              
              {/* Info label */}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-md">
                {formattedType} ({imageData.width}×{imageData.height})
              </div>
            </div>
          )}
          
          {/* Action button - only Delete/Replace */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 flex gap-2 justify-center">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    onClick={onDelete} 
                    variant="outline"
                    className="bg-white/10 hover:bg-white/20 border-transparent"
                  >
                    <X className="h-4 w-4 text-red-400" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete image (you can upload your own)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}