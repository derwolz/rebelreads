import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Type definitions
type ImageType = 'book-detail' | 'book-thumbnail' | 'book-banner' | 'author-avatar' | 'custom';

interface UploadedImage {
  filename: string;
  path: string;
  url: string;
  size: number;
  type: ImageType;
  uploadedAt: string;
}

// Schema for book image upload form
const bookImageSchema = z.object({
  imageType: z.string().min(1, "Please select an image type"),
  bookId: z.string().optional(),
  imageFile: z.any()
    .refine((file) => file?.length > 0, "Please select an image file")
    .refine((file) => {
      if (file?.[0]) {
        return file[0].type.startsWith('image/');
      }
      return false;
    }, "The selected file must be an image")
});

// Schema for profile image upload form
const profileImageSchema = z.object({
  userId: z.string().min(1, "Please enter a user ID"),
  imageFile: z.any()
    .refine((file) => file?.length > 0, "Please select an image file")
    .refine((file) => {
      if (file?.[0]) {
        return file[0].type.startsWith('image/');
      }
      return false;
    }, "The selected file must be an image")
});

export default function TestImageUpload() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedImageType, setSelectedImageType] = useState<ImageType>('book-detail');
  const [bookIdFilter, setBookIdFilter] = useState<string>('');
  const [images, setImages] = useState<UploadedImage[]>([]);

  // Book image upload form
  const bookForm = useForm<z.infer<typeof bookImageSchema>>({
    resolver: zodResolver(bookImageSchema),
    defaultValues: {
      imageType: 'book-detail',
      bookId: '',
    },
  });

  // Profile image upload form
  const profileForm = useForm<z.infer<typeof profileImageSchema>>({
    resolver: zodResolver(profileImageSchema),
    defaultValues: {
      userId: '',
    },
  });

  // Get list of images based on type and optional book ID
  const { data: imageList, isLoading, refetch } = useQuery({
    queryKey: ['images', selectedImageType, bookIdFilter],
    queryFn: async () => {
      let url = `/api/test-sirened-bucket/list?imageType=${selectedImageType}`;
      if (bookIdFilter) {
        url += `&bookId=${bookIdFilter}`;
      }
      const response = await fetch(url);
      return response.json();
    },
  });

  // Mutation for uploading book images
  const uploadBookImageMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/test-sirened-bucket/upload-book', {
        method: 'POST',
        body: data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
      toast({
        title: 'Success',
        description: 'Book image uploaded successfully',
      });
      bookForm.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to upload book image',
        variant: 'destructive',
      });
    },
  });

  // Mutation for uploading profile images
  const uploadProfileImageMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await fetch('/api/test-sirened-bucket/upload-profile', {
        method: 'POST',
        body: data,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
      toast({
        title: 'Success',
        description: 'Profile image uploaded successfully',
      });
      profileForm.reset();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to upload profile image',
        variant: 'destructive',
      });
    },
  });

  // Mutation for deleting images
  const deleteImageMutation = useMutation({
    mutationFn: async (storageKey: string) => {
      const response = await fetch(`/api/test-sirened-bucket/delete/${storageKey}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['images'] });
      toast({
        title: 'Success',
        description: 'Image deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete image',
        variant: 'destructive',
      });
    },
  });

  // Handle book image form submission
  const onSubmitBookImage = (values: z.infer<typeof bookImageSchema>) => {
    const formData = new FormData();
    
    // Add the image file to the form data
    if (values.imageFile?.[0]) {
      formData.append('image', values.imageFile[0]);
    }
    
    // Add image type to form data
    formData.append('imageType', values.imageType);
    
    // Add book ID if provided
    if (values.bookId) {
      formData.append('bookId', values.bookId);
    }
    
    // Submit the form
    uploadBookImageMutation.mutate(formData);
  };

  // Handle profile image form submission
  const onSubmitProfileImage = (values: z.infer<typeof profileImageSchema>) => {
    const formData = new FormData();
    
    // Add the image file to the form data
    if (values.imageFile?.[0]) {
      formData.append('image', values.imageFile[0]);
    }
    
    // Add user ID to form data
    formData.append('userId', values.userId);
    
    // Submit the form
    uploadProfileImageMutation.mutate(formData);
  };

  // Handle image deletion
  const handleDeleteImage = (storageKey: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      deleteImageMutation.mutate(storageKey);
    }
  };

  // Update images when image list changes
  useEffect(() => {
    if (imageList?.files && imageList.baseUrl) {
      const mappedImages = imageList.files.map((file: string) => ({
        filename: file.split('/').pop(),
        path: file,
        url: `${imageList.baseUrl}/${file}`,
        size: 0, // Size not available from API
        type: selectedImageType,
        uploadedAt: new Date().toISOString(), // Timestamp not available from API
      }));
      setImages(mappedImages);
    } else {
      setImages([]);
    }
  }, [imageList, selectedImageType]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Image Upload Testing</h1>
      
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload Images</TabsTrigger>
          <TabsTrigger value="view">View Uploaded Images</TabsTrigger>
        </TabsList>
        
        {/* Upload Tab */}
        <TabsContent value="upload">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Book Image Upload Form */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Book Image</CardTitle>
                <CardDescription>
                  Upload images for books like covers, thumbnails, and banners
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...bookForm}>
                  <form onSubmit={bookForm.handleSubmit(onSubmitBookImage)} className="space-y-6">
                    <FormField
                      control={bookForm.control}
                      name="imageType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select image type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="book-detail">Book Detail</SelectItem>
                              <SelectItem value="book-thumbnail">Book Thumbnail</SelectItem>
                              <SelectItem value="book-banner">Book Banner</SelectItem>
                              <SelectItem value="author-avatar">Author Avatar</SelectItem>
                              <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Select the type of image you are uploading
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={bookForm.control}
                      name="bookId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Book ID (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter book ID"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Associate this image with a specific book
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={bookForm.control}
                      name="imageFile"
                      render={({ field: { value, onChange, ...fieldProps } }) => (
                        <FormItem>
                          <FormLabel>Image File</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              {...fieldProps}
                              onChange={(e) => {
                                onChange(e.target.files);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Select an image file to upload (JPG, PNG, WebP, etc.)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={uploadBookImageMutation.isPending}
                      className="w-full"
                    >
                      {uploadBookImageMutation.isPending ? "Uploading..." : "Upload Book Image"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            {/* Profile Image Upload Form */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Profile Image</CardTitle>
                <CardDescription>
                  Upload user profile and avatar images
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onSubmitProfileImage)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>User ID</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter user ID"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Specify which user this profile image belongs to
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="imageFile"
                      render={({ field: { value, onChange, ...fieldProps } }) => (
                        <FormItem>
                          <FormLabel>Image File</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept="image/*"
                              {...fieldProps}
                              onChange={(e) => {
                                onChange(e.target.files);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Select an image file to upload (JPG, PNG, WebP, etc.)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={uploadProfileImageMutation.isPending}
                      className="w-full"
                    >
                      {uploadProfileImageMutation.isPending ? "Uploading..." : "Upload Profile Image"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* View Tab */}
        <TabsContent value="view">
          <Card>
            <CardHeader>
              <CardTitle>Uploaded Images</CardTitle>
              <CardDescription>
                View and manage images stored in Replit Object Storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <FormLabel>Filter by Image Type</FormLabel>
                    <Select
                      value={selectedImageType}
                      onValueChange={(value: ImageType) => setSelectedImageType(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select image type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="book-detail">Book Detail</SelectItem>
                        <SelectItem value="book-thumbnail">Book Thumbnail</SelectItem>
                        <SelectItem value="book-banner">Book Banner</SelectItem>
                        <SelectItem value="author-avatar">Author Avatar</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex-1">
                    <FormLabel>Book ID (Optional)</FormLabel>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        placeholder="Filter by Book ID"
                        value={bookIdFilter}
                        onChange={(e) => setBookIdFilter(e.target.value)}
                      />
                      <Button onClick={() => refetch()}>Filter</Button>
                    </div>
                  </div>
                </div>
              </div>
              
              {isLoading ? (
                <div className="text-center py-8">Loading images...</div>
              ) : images.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {images.map((image, index) => (
                    <Card key={index} className="overflow-hidden">
                      <div className="aspect-square relative">
                        <img
                          src={image.url}
                          alt={image.filename}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <CardFooter className="flex flex-col gap-2 p-4">
                        <div className="w-full truncate text-sm">{image.path}</div>
                        <div className="flex justify-between w-full">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(image.url, '_blank')}
                          >
                            View Full Size
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteImage(image.path)}
                            disabled={deleteImageMutation.isPending}
                          >
                            Delete
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  No images found. Upload some images to see them here.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}