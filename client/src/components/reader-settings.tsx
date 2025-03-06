import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AVAILABLE_GENRES, updateProfileSchema, SOCIAL_MEDIA_PLATFORMS, type SocialMediaLink, type UpdateProfile } from "@shared/schema";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageCropperDialog } from "./image-cropper-dialog";
import { PlusCircle, Trash2 } from "lucide-react";

export function ReaderSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);

  const form = useForm<UpdateProfile>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: user?.username || "",
      email: user?.email || "",
      displayName: user?.displayName || "",
      bio: user?.bio || "",
      favoriteGenres: user?.favoriteGenres || [AVAILABLE_GENRES[0]],
      profileImageUrl: user?.profileImageUrl || "",
      socialMediaLinks: user?.socialMediaLinks || []
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfile) => {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCroppedImage = async (croppedImage: Blob) => {
    const formData = new FormData();
    formData.append("profileImage", croppedImage, "profile.jpg");

    setIsUploading(true);
    try {
      const response = await fetch("/api/user/profile-image", {
        method: "POST",
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) throw new Error("Failed to upload image");

      const { profileImageUrl } = await response.json();

      form.setValue("profileImageUrl", profileImageUrl);

      queryClient.setQueryData(["/api/user"], (oldData: any) => ({
        ...oldData,
        profileImageUrl,
      }));

      toast({
        title: "Success",
        description: "Profile image updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload profile image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (data: UpdateProfile) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">Reader Profile</h2>
        <p className="text-sm text-muted-foreground">
          Update your reader profile information
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={form.watch("profileImageUrl")} alt={user?.username} />
          <AvatarFallback>👤</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            onClick={() => setCropperOpen(true)}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Change Profile Picture"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Click to upload or drag and drop
          </p>
        </div>
      </div>

      <ImageCropperDialog
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        onCropComplete={handleCroppedImage}
      />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="displayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  This is your public display name
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  Your unique username for logging in
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="favoriteGenres"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Favorite Genres</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const currentGenres = field.value || [];
                    if (currentGenres.includes(value)) {
                      field.onChange(currentGenres.filter(g => g !== value));
                    } else {
                      field.onChange([...currentGenres, value]);
                    }
                  }}
                  value={field.value?.[0]}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your favorite genres" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AVAILABLE_GENRES.map((genre) => (
                      <SelectItem
                        key={genre}
                        value={genre}
                        className={field.value?.includes(genre) ? "bg-primary/10" : ""}
                      >
                        {genre.charAt(0).toUpperCase() + genre.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Selected genres: {field.value?.map(g => g.charAt(0).toUpperCase() + g.slice(1)).join(", ")}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell us about yourself..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Write a brief description about yourself
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-medium mb-4">Social Media Links</h3>
            <div className="space-y-4">
              {form.watch("socialMediaLinks")?.map((link, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={link.platform}
                    onValueChange={(value: typeof SOCIAL_MEDIA_PLATFORMS[number]) => {
                      const newLinks = [...(form.getValues("socialMediaLinks") || [])] as SocialMediaLink[];
                      newLinks[index] = {
                        ...newLinks[index],
                        platform: value,
                        customName: value === "Custom" ? "" : undefined
                      };
                      form.setValue("socialMediaLinks", newLinks);
                    }}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOCIAL_MEDIA_PLATFORMS.map((platform) => (
                        <SelectItem key={platform} value={platform}>
                          {platform}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {link.platform === "Custom" && (
                    <Input
                      placeholder="Platform name"
                      value={link.customName || ""}
                      onChange={(e) => {
                        const newLinks = [...(form.getValues("socialMediaLinks") || [])] as SocialMediaLink[];
                        newLinks[index] = {
                          ...newLinks[index],
                          customName: e.target.value
                        };
                        form.setValue("socialMediaLinks", newLinks);
                      }}
                      className="w-[150px]"
                    />
                  )}

                  <Input
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) => {
                      const newLinks = [...(form.getValues("socialMediaLinks") || [])] as SocialMediaLink[];
                      newLinks[index] = {
                        ...newLinks[index],
                        url: e.target.value
                      };
                      form.setValue("socialMediaLinks", newLinks);
                    }}
                    className="flex-1"
                  />

                  <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    onClick={() => {
                      const newLinks = form.getValues("socialMediaLinks")?.filter((_, i) => i !== index) || [];
                      form.setValue("socialMediaLinks", newLinks);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {(!form.watch("socialMediaLinks") || form.watch("socialMediaLinks").length < 4) && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    const currentLinks = form.getValues("socialMediaLinks") || [];
                    form.setValue("socialMediaLinks", [
                      ...currentLinks,
                      { platform: "Twitter" as const, url: "" }
                    ]);
                  }}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add Social Media Link
                </Button>
              )}
            </div>
          </div>

          <Button type="submit" disabled={isUploading || updateProfileMutation.isPending}>
            Save Changes
          </Button>
        </form>
      </Form>
    </div>
  );
}