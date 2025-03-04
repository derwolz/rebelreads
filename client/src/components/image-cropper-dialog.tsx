import { useState, useRef } from "react";
import ReactCrop, { centerCrop, makeAspectCrop, Crop } from 'react-image-crop';
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

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
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
  const imageRef = useRef<HTMLImageElement | null>(null);
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
    setCrop(centerAspectCrop(width, height, 1));
    imageRef.current = e.currentTarget;
  }

  async function cropImage() {
    if (!imageRef.current || !crop) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;

    canvas.width = 500;
    canvas.height = 500;

    ctx.drawImage(
      imageRef.current,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      500,
      500
    );

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast({
            title: "Error",
            description: "Failed to process image",
            variant: "destructive",
          });
          return;
        }
        onCropComplete(blob);
        onOpenChange(false);
        setImgSrc('');
        setCrop(undefined);
      },
      'image/jpeg',
      0.9
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Upload Profile Picture</DialogTitle>
          <DialogDescription>
            Drag and drop an image or click to select. Then adjust the crop area to your liking.
          </DialogDescription>
        </DialogHeader>

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
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              aspect={1}
              circularCrop
            >
              <img
                ref={imageRef}
                alt="Upload"
                src={imgSrc}
                onLoad={onImageLoad}
                className="max-h-[400px] w-auto mx-auto"
              />
            </ReactCrop>
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
      </DialogContent>
    </Dialog>
  );
}
