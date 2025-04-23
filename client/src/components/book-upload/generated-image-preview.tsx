import React, { useState, useEffect } from 'react';
import { Trash, Check, X, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { BookImageFile } from './types';

interface GeneratedImagePreviewProps {
  imageType: string;
  imageData: BookImageFile;
  onAccept: () => void;
  onReject: () => void;
  onRegenerate: () => void;
}

/**
 * Component for displaying auto-generated images with accept/reject functionality
 */
export function GeneratedImagePreview({
  imageType,
  imageData,
  onAccept,
  onReject,
  onRegenerate,
}: GeneratedImagePreviewProps) {
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Convert the File object to an object URL for display if it exists
  useEffect(() => {
    if (imageData.file) {
      const url = URL.createObjectURL(imageData.file);
      setPreviewUrl(url);
      
      // Clean up the URL when component unmounts
      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (imageData.previewUrl) {
      setPreviewUrl(imageData.previewUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [imageData.file, imageData.previewUrl]);

  // Format the image type for display (e.g., 'book-card' -> 'Book Card')
  const formatImageType = (type: string) => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className="p-4 bg-background">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-sm">{formatImageType(imageType)}</h3>
            <p className="text-xs text-muted-foreground">
              {imageData.width}x{imageData.height}px {imageData.isGenerated ? '(Auto-generated)' : ''}
            </p>
          </div>
          
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              onClick={onAccept}
              className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100"
              title="Accept this generated image"
            >
              <Check className="h-4 w-4" />
            </Button>
            
            <Button
              size="icon"
              variant="ghost"
              onClick={onReject}
              className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100"
              title="Reject this generated image"
            >
              <X className="h-4 w-4" />
            </Button>
            
            <Button
              size="icon"
              variant="ghost"
              onClick={onRegenerate}
              className="h-7 w-7 text-blue-600 hover:text-blue-700 hover:bg-blue-100"
              title="Regenerate this image"
            >
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div 
          className="relative border rounded overflow-hidden bg-muted/40 flex items-center justify-center" 
          style={{ 
            aspectRatio: `${imageData.width}/${imageData.height}`,
            maxHeight: '150px',
            width: 'auto'
          }}
        >
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt={`${formatImageType(imageType)} preview`}
              className="object-contain max-h-full max-w-full"
            />
          ) : (
            <div className="text-xs text-muted-foreground py-2">No preview available</div>
          )}
        </div>
      </div>
    </Card>
  );
}