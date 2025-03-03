import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export function BookUploader() {
  const { toast } = useToast();
  const [coverFile, setCoverFile] = useState<File | null>(null);
  
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiRequest("POST", "/api/books", formData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-books"] });
      toast({
        title: "Book uploaded",
        description: "Your book has been successfully uploaded.",
      });
      // Reset form
      const form = document.getElementById("book-form") as HTMLFormElement;
      form.reset();
      setCoverFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (coverFile) {
      formData.append("cover", coverFile);
    }
    uploadMutation.mutate(formData);
  };

  return (
    <form id="book-form" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Book Title</label>
        <Input name="title" required />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <Textarea name="description" required />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Book Cover</label>
        <Input
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
          required
        />
      </div>

      <Button type="submit" disabled={uploadMutation.isPending}>
        {uploadMutation.isPending && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        Upload Book
      </Button>
    </form>
  );
}
