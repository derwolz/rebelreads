import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GenreSelector, TaxonomyItem } from "@/components/genre-selector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export function GenrePreferencesSettings() {
  const { user } = useAuth();
  const [primaryGenres, setPrimaryGenres] = useState<TaxonomyItem[]>([]);
  const [additionalGenres, setAdditionalGenres] = useState<TaxonomyItem[]>([]);
  const [activeTab, setActiveTab] = useState("primary");

  // Fetch user's genre preferences
  const { data: preferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ['/api/genre-preferences'],
    queryFn: async () => {
      const res = await fetch('/api/genre-preferences');
      if (!res.ok) throw new Error('Failed to fetch genre preferences');
      return res.json();
    },
    enabled: !!user,
  });

  // Save genre preferences mutation
  const { mutate: savePreferences, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/genre-preferences', {
        preferredGenres: primaryGenres,
        additionalGenres: additionalGenres
      });
    },
    onSuccess: () => {
      toast({
        title: "Preferences saved",
        description: "Your genre preferences have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/genre-preferences'] });
    },
    onError: (error) => {
      toast({
        title: "Error saving preferences",
        description: "There was a problem saving your genre preferences. Please try again.",
        variant: "destructive",
      });
      console.error('Error saving genre preferences:', error);
    }
  });

  // Initialize form when preferences are loaded
  useEffect(() => {
    if (preferences) {
      setPrimaryGenres(preferences.preferredGenres || []);
      setAdditionalGenres(preferences.additionalGenres || []);
    }
  }, [preferences]);

  const handleSave = () => {
    savePreferences();
  };

  if (isLoadingPreferences) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Genre Preferences</CardTitle>
        <CardDescription>
          Customize your genre preferences to enhance your reading experience and recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="primary" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="primary">Primary Preferences</TabsTrigger>
            <TabsTrigger value="additional">Additional Suggestions</TabsTrigger>
          </TabsList>
          
          <TabsContent value="primary">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Primary Genre Preferences</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  These genres will be prioritized in your feed and used to determine content order.
                </p>
              </div>
              <GenreSelector
                mode="taxonomy"
                selected={primaryGenres}
                onSelectionChange={(genres) => setPrimaryGenres(genres as TaxonomyItem[])}
                label="Preferred Genres"
                helperText="Select and order your favorite genres. Drag to reorder."
              />
            </div>
          </TabsContent>
          
          <TabsContent value="additional">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Additional Genre Suggestions</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  These genres will be used to recommend additional books you might enjoy.
                </p>
              </div>
              <GenreSelector
                mode="taxonomy"
                selected={additionalGenres}
                onSelectionChange={(genres) => setAdditionalGenres(genres as TaxonomyItem[])}
                label="Additional Genres"
                helperText="Select genres you'd like to explore more."
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}