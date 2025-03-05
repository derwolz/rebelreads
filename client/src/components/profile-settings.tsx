
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { User, UpdateProfile, SocialMediaLink } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema } from "@shared/schema";
import { PencilIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ImageCropperDialog } from "@/components/image-cropper-dialog";
import { SocialMediaLinks } from "@/components/social-media-links";

export function ProfileSettings({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [showImageCropper, setShowImageCropper] = useState(false);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);

  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: user.username,
      email: user.email,
      displayName: user.displayName || "",
      bio: user.bio || "",
      favoriteGenres: user.favoriteGenres || [],
      socialLinks: user.socialLinks || [],
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        email: user.email,
        displayName: user.displayName || "",
        bio: user.bio || "",
        favoriteGenres: user.favoriteGenres || [],
        socialLinks: user.socialLinks || [],
      });
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfile) => {
      const response = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to update profile");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["/api/user"]);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadProfileImageMutation = useMutation({
    mutationFn: async (imageFile: File) => {
      const formData = new FormData();
      formData.append("profileImage", imageFile);

      const response = await fetch("/api/user/profile-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload profile image");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["/api/user"]);
      form.setValue("profileImageUrl", data.profileImageUrl);
      toast({
        title: "Profile image updated",
        description: "Your profile image has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error uploading image",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setProfileImage(e.target.files[0]);
      setShowImageCropper(true);
    }
  };

  const handleCroppedImage = (blob: Blob) => {
    const file = new File([blob], "profile-image.jpg", { type: "image/jpeg" });
    uploadProfileImageMutation.mutate(file);
    setCroppedImage(URL.createObjectURL(blob));
    setShowImageCropper(false);
  };

  const onSubmit = (data: UpdateProfile) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-3xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>
              Update your personal information and public profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center">
                <div className="relative inline-block group">
                  <Avatar className="w-24 h-24 border">
                    <AvatarImage
                      src={
                        croppedImage ||
                        user.profileImageUrl ||
                        "https://github.com/shadcn.png"
                      }
                      alt={user.username}
                    />
                    <AvatarFallback>
                      {user.username.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white opacity-0 group-hover:opacity-100 rounded-full transition-opacity cursor-pointer">
                    <PencilIcon className="w-8 h-8" />
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      accept="image/*"
                      onChange={handleImageSelect}
                    />
                  </div>
                </div>
                <Label className="mt-2 text-center text-sm text-muted-foreground">
                  Profile Picture
                </Label>
              </div>

              <div className="space-y-4 flex-1">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="How you want to be addressed"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        This is the name that will be displayed to other users.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us a little bit about yourself"
                      className="resize-none min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="socialLinks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Social Media</FormLabel>
                  <FormControl>
                    <SocialMediaLinks
                      links={field.value as SocialMediaLink[] || []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Add links to your social media profiles.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium">Change Password</h3>
                <p className="text-sm text-muted-foreground">
                  Update your password to ensure account security.
                </p>
              </div>

              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button
              type="submit"
              disabled={updateProfileMutation.isLoading}
              className="w-full md:w-auto"
            >
              {updateProfileMutation.isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Form>

      <ImageCropperDialog
        isOpen={showImageCropper}
        onClose={() => setShowImageCropper(false)}
        imageFile={profileImage}
        onCropComplete={handleCroppedImage}
        aspectRatio={1}
      />
    </Card>
  );
}
