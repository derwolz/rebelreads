import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Book, UserTaxonomyPreference, UserTaxonomyItem } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/star-rating";
import { 
  BookOpen, 
  ThumbsUp, 
  Settings, 
  PlusCircle, 
  Tag, 
  CheckCircle2,
  X
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { TaxonomySelector } from "./taxonomy-selector";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function RecommendationsSidebar() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreateViewOpen, setIsCreateViewOpen] = useState(false);
  const [newPreferenceName, setNewPreferenceName] = useState('');
  const [selectedTaxonomies, setSelectedTaxonomies] = useState<any[]>([]);
  const [isCustomView, setIsCustomView] = useState(false);
  
  // Fetch default user taxonomy preference
  const { data: defaultPreference, isLoading: isLoadingPreference } = useQuery<UserTaxonomyPreference>({
    queryKey: ['/api/user-taxonomy/default-preference'],
    enabled: !!user,
    onError: () => {
      // Silently fail - user might not have created a preference yet
    }
  });
  
  // Fetch taxonomy items for default preference
  const { data: taxonomyItems, isLoading: isLoadingItems } = useQuery<Array<UserTaxonomyItem & { name: string; description: string | null }>>({
    queryKey: ['/api/user-taxonomy/preferences', defaultPreference?.id, 'items'],
    enabled: !!defaultPreference?.id,
  });
  
  // Fetch custom view preferences
  const { data: customViews, isLoading: isLoadingCustomViews } = useQuery<UserTaxonomyPreference[]>({
    queryKey: ['/api/user-taxonomy/custom-views'],
    enabled: !!user,
  });
  
  // Fetch recommendations based on user's taxonomy preferences
  const { data: recommendedBooks, isLoading: isLoadingBooks } = useQuery<Book[]>({
    queryKey: ['/api/books'],
    staleTime: 60000,
  });
  
  // Create preference mutation
  const createPreferenceMutation = useMutation({
    mutationFn: async (data: { name: string, isDefault: boolean, isCustomView: boolean }) => {
      const res = await fetch('/api/user-taxonomy/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        throw new Error('Failed to create preference');
      }
      
      return res.json();
    },
    onSuccess: async (newPreference) => {
      // Create taxonomy items for the new preference
      if (selectedTaxonomies.length > 0) {
        const itemsRes = await fetch(`/api/user-taxonomy/preferences/${newPreference.id}/items`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(selectedTaxonomies.map(item => ({
            taxonomyId: item.taxonomyId,
            type: item.type,
            rank: item.rank
          }))),
        });
        
        if (!itemsRes.ok) {
          throw new Error('Failed to add taxonomy items');
        }
      }
      
      // Invalidate queries to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/user-taxonomy/default-preference'] });
      queryClient.invalidateQueries({ queryKey: ['/api/user-taxonomy/custom-views'] });
      
      // Show success message
      toast({
        title: isCustomView ? 'Custom view created' : 'Preferences saved',
        description: isCustomView 
          ? 'Your custom view has been created successfully.' 
          : 'Your recommendation preferences have been saved.',
      });
      
      // Reset state and close dialog
      setNewPreferenceName('');
      setSelectedTaxonomies([]);
      setIsSettingsOpen(false);
      setIsCreateViewOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  const handleCreatePreference = () => {
    if (!newPreferenceName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a name for your preference.',
        variant: 'destructive',
      });
      return;
    }
    
    createPreferenceMutation.mutate({
      name: newPreferenceName,
      isDefault: !isCustomView,
      isCustomView: isCustomView,
    });
  };
  
  const isLoading = isLoadingPreference || isLoadingItems || isLoadingBooks;

  return (
    <>
      <Card className="w-full h-full">
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base flex items-center gap-2">
              <ThumbsUp className="h-4 w-4 text-primary" />
              Recommended for You
            </CardTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSettingsOpen(true)}
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription>
            {defaultPreference
              ? `Based on your "${defaultPreference.name}" preferences`
              : "Based on general preferences"}
          </CardDescription>
          
          {taxonomyItems && taxonomyItems.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {taxonomyItems.slice(0, 3).map((item) => (
                <Badge 
                  key={item.id}
                  variant={
                    item.type === 'genre' ? 'default' :
                    item.type === 'subgenre' ? 'secondary' :
                    item.type === 'theme' ? 'outline' : 'destructive'
                  }
                  className="text-xs"
                >
                  {item.name}
                </Badge>
              ))}
              {taxonomyItems.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{taxonomyItems.length - 3} more
                </Badge>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 pb-3 last:pb-0 border-b last:border-0">
                  <Skeleton className="w-10 h-14 rounded" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </>
          ) : (
            <>
              {recommendedBooks?.slice(0, 3).map((book) => (
                <div key={book.id} className="flex items-start gap-3 pb-3 last:pb-0 border-b last:border-0">
                  <div className="block w-10 h-14 shrink-0">
                    <Link href={`/books/${book.id}`}>
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        className="w-full h-full object-cover rounded cursor-pointer"
                      />
                    </Link>
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">
                      <Link href={`/books/${book.id}`}>
                        <span className="hover:text-primary cursor-pointer">{book.title}</span>
                      </Link>
                    </h4>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <span className="truncate">{book.author}</span>
                    </div>
                    <StarRating
                      rating={4}
                      readOnly
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </>
          )}
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-1 mt-2"
            asChild
          >
            <Link href="/books">
              <BookOpen className="h-4 w-4" />
              <span>View More Books</span>
            </Link>
          </Button>
        </CardContent>
        <CardFooter className="pt-0">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full gap-1 text-xs"
            onClick={() => {
              setIsCustomView(true);
              setIsCreateViewOpen(true);
            }}
          >
            <PlusCircle className="h-3 w-3" />
            <span>Add Custom View</span>
          </Button>
        </CardFooter>
      </Card>
      
      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Recommendation Preferences</DialogTitle>
            <DialogDescription>
              Choose your genre preferences to get personalized book recommendations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <Label htmlFor="preference-name">Preference Name</Label>
              <Input
                id="preference-name"
                placeholder="My Genre Preferences"
                value={newPreferenceName}
                onChange={(e) => setNewPreferenceName(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <TaxonomySelector
              selectedTaxonomies={selectedTaxonomies}
              onTaxonomiesChange={setSelectedTaxonomies}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePreference} disabled={createPreferenceMutation.isPending}>
              {createPreferenceMutation.isPending ? "Saving..." : "Save Preferences"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Custom View Dialog */}
      <Dialog open={isCreateViewOpen} onOpenChange={setIsCreateViewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create Custom View</DialogTitle>
            <DialogDescription>
              Create a custom view for your homepage based on specific genres, themes, and tropes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="mb-4">
              <Label htmlFor="view-name">View Name</Label>
              <Input
                id="view-name"
                placeholder="Fantasy Books"
                value={newPreferenceName}
                onChange={(e) => setNewPreferenceName(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <TaxonomySelector
              selectedTaxonomies={selectedTaxonomies}
              onTaxonomiesChange={setSelectedTaxonomies}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateViewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePreference} disabled={createPreferenceMutation.isPending}>
              {createPreferenceMutation.isPending ? "Creating..." : "Create View"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}