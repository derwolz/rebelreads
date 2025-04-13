import { useState, useRef } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// This function creates a centered crop with the correct aspect ratio
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  // Calculate the maximum size we can make the crop while maintaining aspect ratio
  let cropWidth = mediaWidth;
  let cropHeight = cropWidth / aspect;
  
  // If crop height is greater than media height, calculate based on height instead
  if (cropHeight > mediaHeight) {
    cropHeight = mediaHeight;
    cropWidth = cropHeight * aspect;
  }
  
  // Center the crop
  const x = (mediaWidth - cropWidth) / 2;
  const y = (mediaHeight - cropHeight) / 2;
  
  // Return values in percentage for react-image-crop
  return {
    unit: '%',
    width: (cropWidth * 100) / mediaWidth,
    height: (cropHeight * 100) / mediaHeight,
    x: (x * 100) / mediaWidth,
    y: (y * 100) / mediaHeight,
  };
}

// This function converts a percentage crop to a pixel crop
function convertToPixelCrop(
  crop: Crop,
  imageWidth: number,
  imageHeight: number
): PixelCrop {
  return {
    unit: 'px',
    x: Math.round((crop.x * imageWidth) / 100),
    y: Math.round((crop.y * imageHeight) / 100),
    width: Math.round((crop.width * imageWidth) / 100),
    height: Math.round((crop.height * imageHeight) / 100),
  };
}

interface ImageCropperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCropComplete: (croppedImage: Blob) => void;
}

export function ImageCropperDialog({ open, onOpenChange, onCropComplete }: ImageCropperDialogProps) {
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const { toast } = useToast();

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) {
    setError(null);
    let files: FileList | null;

    if ('dataTransfer' in e) {
      e.preventDefault();
      files = e.dataTransfer.files;
    } else {
      files = e.target.files;
    }

    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError('Image must be smaller than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      const imageUrl = reader.result?.toString() || '';
      setImgSrc(imageUrl);

      // Load the image to get dimensions
      const img = new Image();
      img.onload = () => {
        if (img.width < 200 || img.height < 200) {
          setError('Image must be at least 200x200 pixels');
          setImgSrc('');
          return;
        }
      };
      img.src = imageUrl;
    });
    reader.readAsDataURL(file);
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    // Set the image ref
    imgRef.current = e.currentTarget;
    
    // Calculate initial crop
    const initialCrop = centerAspectCrop(width, height, 1);
    setCrop(initialCrop);
    
    // Debug info - log the image dimensions and initial crop
    console.log('Image dimensions:', width, height);
    console.log('Initial crop:', initialCrop);
  }

  async function cropImage() {
    if (!imgRef.current || !crop) {
      toast({
        title: "Error",
        description: "Unable to process the image",
        variant: "destructive",
      });
      return;
    }

    try {
      const image = imgRef.current;
      
      // Convert from percentage crop to pixel crop
      const pixelCrop = convertToPixelCrop(
        crop,
        image.naturalWidth,
        image.naturalHeight
      );
      
      // Debug info - log the pixel crop
      console.log('Pixel crop:', pixelCrop);
      
      // Create a canvas for the cropped image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        toast({
          title: "Error",
          description: "Canvas context not available",
          variant: "destructive",
        });
        return;
      }

      // Set the canvas size (output size for our profile picture)
      const outputSize = 500;
      canvas.width = outputSize;
      canvas.height = outputSize;

      // Fill with white background (for transparent images)
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      
      // Draw the cropped portion of the image
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          toast({
            title: "Error",
            description: "Failed to create image",
            variant: "destructive",
          });
          return;
        }
        
        // Send the cropped image to the parent component
        onCropComplete(blob);
        
        // Reset the component state
        setImgSrc('');
        setCrop(undefined);
        onOpenChange(false);
      }, 'image/jpeg', 0.95);

    } catch (error) {
      console.error('Error cropping image:', error);
      toast({
        title: "Error",
        description: "Failed to process image",
        variant: "destructive",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Upload Profile Picture</DialogTitle>
          <DialogDescription>
            Drag and drop an image or click to select. Then adjust the crop area to your liking.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 pt-2">
          {!imgSrc ? (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onDragOver={(e) => e.preventDefault()}
              onDrop={onSelectFile}
              onClick={() => document.getElementById('image-input')?.click()}
            >
              <input
                id="image-input"
                type="file"
                accept="image/*"
                onChange={onSelectFile}
                className="hidden"
              />
              <p>Drag image here or click to upload</p>
              <p className="text-sm text-muted-foreground mt-2">
                Recommended: Square image, 500x500px or larger
              </p>
              {error && (
                <p className="text-sm text-destructive mt-2">{error}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative max-w-full overflow-hidden rounded-md">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    alt="Upload"
                    src={imgSrc}
                    onLoad={onImageLoad}
                    className="max-h-[400px] w-auto mx-auto"
                    crossOrigin="anonymous"
                  />
                </ReactCrop>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setImgSrc('');
                    setCrop(undefined);
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={cropImage}>
                  Upload
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}