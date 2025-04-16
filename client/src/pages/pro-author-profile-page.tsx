import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Author } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { ProLayout } from "@/components/pro-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageCropperDialog } from "@/components/image-cropper-dialog";

export default function ProAuthorProfilePage() {
  const { user, isAuthor } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cropperOpen, setCropperOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    author_name: "",
    bio: "",
    website: "",
    birth_date: null as Date | null,
    death_date: null as Date | null,
    author_image_url: "",
  });
  
  // Fetch author data
  const { data: author, isLoading } = useQuery<Author>({
    queryKey: ["/api/author-profile"],
    enabled: isAuthor,
  });
  
  // Update form data when author data loads
  useEffect(() => {
    if (author) {
      setFormData({
        author_name: author.author_name || "",
        bio: author.bio || "",
        website: author.website || "",
        birth_date: author.birth_date ? new Date(author.birth_date) : null,
        death_date: author.death_date ? new Date(author.death_date) : null,
        author_image_url: author.author_image_url || "",
      });
    }
  }, [author]);
  
  // Mutation for updating author profile
  const updateProfileMutation = useMutation({
    mutationFn: (data: typeof formData) => {
      return fetch("/api/author-profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      }).then(res => {
        if (!res.ok) throw new Error("Failed to update profile");
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/author-profile"] });
      toast({
        title: "Profile Updated",
        description: "Your author profile has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
      console.error("Profile update error:", error);
    },
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleCroppedImage = async (blob: Blob) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', blob, 'profile.jpg');
      
      const response = await fetch("/api/author-profile-image", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to upload image");

      const { author_image_url } = await response.json();

      setFormData(prev => ({
        ...prev,
        author_image_url,
      }));

      queryClient.invalidateQueries({ queryKey: ["/api/author-profile"] });

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
      console.error("Profile image upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <ProLayout>
      <div className="flex-1 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Author Profile</h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your author profile information visible to readers
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="author_name">Author Name</Label>
                  <Input 
                    id="author_name" 
                    name="author_name" 
                    value={formData.author_name} 
                    onChange={handleInputChange}
                    placeholder="Your pen name or author name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Biography</Label>
                  <Textarea 
                    id="bio" 
                    name="bio" 
                    value={formData.bio} 
                    onChange={handleInputChange}
                    placeholder="Tell readers about yourself"
                    className="min-h-[150px]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input 
                    id="website" 
                    name="website" 
                    value={formData.website} 
                    onChange={handleInputChange}
                    placeholder="https://your-website.com"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="birth_date">Birth Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.birth_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.birth_date ? (
                            format(formData.birth_date, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.birth_date || undefined}
                          onSelect={(date) => setFormData(prev => ({...prev, birth_date: date || null}))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="death_date">Death Date (if applicable)</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.death_date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.death_date ? (
                            format(formData.death_date, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.death_date || undefined}
                          onSelect={(date) => setFormData(prev => ({...prev, death_date: date || null}))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <Label>Profile Image</Label>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage
                        src={formData.author_image_url}
                        alt={formData.author_name}
                      />
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
                </div>
                
                <div className="pt-4">
                  <Button 
                    type="submit" 
                    className="w-full sm:w-auto"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        )}
      </div>
    </ProLayout>
  );
}