import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, FileText, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Define types for our genre taxonomy data
type GenreTaxonomy = {
  id: number;
  name: string;
  description: string | null;
  type: "genre" | "subgenre" | "trope" | "theme";
  parentId: number | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

type NewGenreTaxonomy = {
  name: string;
  description: string;
  type: "genre" | "subgenre" | "trope" | "theme";
  parentId?: number | null;
};

// Component for displaying and managing genres
export const AdminGenresManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("genres");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState<NewGenreTaxonomy>({
    name: "",
    description: "",
    type: "genre",
    parentId: null,
  });
  const [editItem, setEditItem] = useState<GenreTaxonomy | null>(null);
  const [bulkImportText, setBulkImportText] = useState("");
  const [expandedGenres, setExpandedGenres] = useState<Record<number, boolean>>({});
  const [selectedParentGenreId, setSelectedParentGenreId] = useState<string>("none");

  // Query to get all genres
  const {
    data: genres,
    isLoading: isLoadingGenres,
    error: genresError,
  } = useQuery({
    queryKey: ["/api/genres", { type: "genre" }],
    queryFn: async () => {
      const response = await fetch(`/api/genres?type=genre`);
      if (!response.ok) throw new Error("Failed to fetch genres");
      return response.json() as Promise<GenreTaxonomy[]>;
    },
  });

  // Query to get all subgenres
  const {
    data: subgenres,
    isLoading: isLoadingSubgenres,
    error: subgenresError,
  } = useQuery({
    queryKey: ["/api/genres", { type: "subgenre" }],
    queryFn: async () => {
      const response = await fetch(`/api/genres?type=subgenre`);
      if (!response.ok) throw new Error("Failed to fetch subgenres");
      return response.json() as Promise<GenreTaxonomy[]>;
    },
  });

  // Query to get all tropes
  const {
    data: tropes,
    isLoading: isLoadingTropes,
    error: tropesError,
  } = useQuery({
    queryKey: ["/api/genres", { type: "trope" }],
    queryFn: async () => {
      const response = await fetch(`/api/genres?type=trope`);
      if (!response.ok) throw new Error("Failed to fetch tropes");
      return response.json() as Promise<GenreTaxonomy[]>;
    },
  });

  // Query to get all themes
  const {
    data: themes,
    isLoading: isLoadingThemes,
    error: themesError,
  } = useQuery({
    queryKey: ["/api/genres", { type: "theme" }],
    queryFn: async () => {
      const response = await fetch(`/api/genres?type=theme`);
      if (!response.ok) throw new Error("Failed to fetch themes");
      return response.json() as Promise<GenreTaxonomy[]>;
    },
  });

  // Mutation to create a new genre taxonomy item
  const createMutation = useMutation({
    mutationFn: async (item: NewGenreTaxonomy) => {
      const response = await fetch('/api/genres', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        throw new Error('Failed to create item');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Item created successfully",
      });
      setNewItem({
        name: "",
        description: "",
        type: "genre",
        parentId: null,
      });
      setIsAddDialogOpen(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/genres"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to update an existing genre taxonomy item
  const updateMutation = useMutation({
    mutationFn: async (item: GenreTaxonomy) => {
      const response = await fetch(`/api/genres/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: item.name,
          description: item.description,
          type: item.type,
          parentId: item.parentId,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update item');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Item updated successfully",
      });
      setEditItem(null);
      setIsEditDialogOpen(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/genres"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to delete a genre taxonomy item
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/genres/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete item');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/genres"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to import bulk data
  const importMutation = useMutation({
    mutationFn: async (items: any[]) => {
      const response = await fetch('/api/genres/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });
      if (!response.ok) {
        throw new Error('Failed to import items');
      }
      return response.json();
    },
    onSuccess: (data: { imported: number, total: number }) => {
      toast({
        title: "Import Complete",
        description: `Successfully imported ${data.imported} out of ${data.total} items`,
      });
      setBulkImportText("");
      setIsImportDialogOpen(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/genres"] });
    },
    onError: (error) => {
      toast({
        title: "Import Error",
        description: `Failed to import items: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    },
  });

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  // Handle form submission for creating a new item
  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }
    // If it's a subgenre, make sure parentId is set
    if (newItem.type === "subgenre" && !newItem.parentId) {
      toast({
        title: "Validation Error",
        description: "Parent genre is required for subgenres",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newItem);
  };

  // Handle form submission for updating an item
  const handleUpdateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    if (!editItem.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Name is required",
        variant: "destructive",
      });
      return;
    }
    // If it's a subgenre, make sure parentId is set
    if (editItem.type === "subgenre" && !editItem.parentId) {
      toast({
        title: "Validation Error",
        description: "Parent genre is required for subgenres",
        variant: "destructive",
      });
      return;
    }
    updateMutation.mutate(editItem);
  };

  // Handle deletion of an item
  const handleDeleteItem = (id: number) => {
    if (window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  // Handle bulk import
  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Parse CSV data
      const lines = bulkImportText.split("\n");
      if (lines.length <= 1) {
        toast({
          title: "Import Error",
          description: "No data to import or invalid format",
          variant: "destructive",
        });
        return;
      }
      
      const headers = lines[0].split(",").map(h => h.trim());
      const items = [];
      
      // Determine the current type based on the active tab
      const type = activeTab.slice(0, -1); // Remove 's' from the end (e.g., "genres" -> "genre")
      
      // Process the data based on the active tab
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;  // Skip empty lines
        
        const values = lines[i].split(",").map(v => v.trim());
        
        if (activeTab === "genres" || activeTab === "subgenres") {
          // For genres and subgenres
          const genre = values[0];
          const subgenre = values[1];
          const description = values[2] || "";
          
          if (activeTab === "genres" && genre) {
            items.push({
              name: genre,
              description: description,
              type: "genre"
            });
          } else if (activeTab === "subgenres" && subgenre && genre) {
            // For subgenres, we need to find the parent genre ID
            // We'll just store the parent genre name for now and process it later
            items.push({
              name: subgenre,
              description: description,
              type: "subgenre",
              parentGenreName: genre
            } as any); // Using any to avoid TypeScript errors
          }
        } else {
          // For tropes and themes
          const name = values[0];
          const description = values[1] || "";
          
          if (name) {
            items.push({
              name,
              description,
              type
            });
          }
        }
      }
      
      if (items.length === 0) {
        toast({
          title: "Import Error",
          description: "No valid items found to import",
          variant: "destructive",
        });
        return;
      }
      
      // For subgenres, we need to find parent genre IDs
      if (activeTab === "subgenres" && genres) {
        const genreMap = new Map(genres.map(g => [g.name.toLowerCase(), g.id]));
        
        // If a parent genre is selected in the dropdown, use it for all subgenres
        if (selectedParentGenreId && selectedParentGenreId !== "none") {
          const selectedParentId = parseInt(selectedParentGenreId);
          const selectedParentGenre = genres.find(g => g.id === selectedParentId);
          
          // Set the same parent genre for all subgenres
          for (const item of items as any[]) {
            item.parentId = selectedParentId;
            
            // Remove any parent genre name if it exists (from CSV data)
            if ('parentGenreName' in item) {
              delete (item as any).parentGenreName;
            }
          }
          
          toast({
            title: "Parent Genre Set",
            description: `All imported subgenres will use '${selectedParentGenre?.name}' as their parent genre.`,
          });
        } else {
          // No parent genre is selected, use the ones from CSV
          for (const item of items as any[]) {
            if (item.parentGenreName) {
              const parentId = genreMap.get(item.parentGenreName.toLowerCase());
              if (parentId) {
                item.parentId = parentId;
              } else {
                // Create a new parent genre if it doesn't exist
                toast({
                  title: "Warning",
                  description: `Parent genre '${item.parentGenreName}' not found. Subgenre will be created without a parent.`,
                });
              }
              // Safe to use any as we're dealing with dynamic data
              if ('parentGenreName' in item) {
                delete (item as any).parentGenreName;
              }
            }
          }
        }
      }
      
      importMutation.mutate(items);
    } catch (error) {
      toast({
        title: "Import Error",
        description: `Failed to parse import data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Toggle genre expansion
  const toggleGenreExpansion = (genreId: number) => {
    setExpandedGenres(prev => ({
      ...prev,
      [genreId]: !prev[genreId]
    }));
  };

  // Filter subgenres by parent genre
  const getSubgenresByParent = (parentId: number) => {
    if (!subgenres) return [];
    return subgenres.filter(sg => sg.parentId === parentId);
  };

  // Loading state
  if (isLoadingGenres || isLoadingSubgenres || isLoadingTropes || isLoadingThemes) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (genresError || subgenresError || tropesError || themesError) {
    return (
      <div className="p-4 text-red-500">
        <p>Error loading genre data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Genre Taxonomy Management</h2>
        <div className="space-x-2">
          <Dialog 
            open={isImportDialogOpen} 
            onOpenChange={(open) => {
              setIsImportDialogOpen(open);
              if (!open) {
                // Reset form state when dialog closes
                setSelectedParentGenreId("none");
                setBulkImportText("");
              }
            }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Import</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Import {activeTab}</DialogTitle>
                <DialogDescription>
                  Select the type of items you want to import and paste your CSV data below:
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleBulkImport}>
                <div className="space-y-4 mb-4">
                  <div>
                    <label htmlFor="import-type" className="text-sm font-medium mb-2 block">
                      Type to Import
                    </label>
                    <Select
                      value={activeTab}
                      onValueChange={handleTabChange}
                    >
                      <SelectTrigger id="import-type">
                        <SelectValue placeholder="Select type to import" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Type</SelectLabel>
                          <SelectItem value="genres">Genres</SelectItem>
                          <SelectItem value="subgenres">Subgenres</SelectItem>
                          <SelectItem value="tropes">Tropes</SelectItem>
                          <SelectItem value="themes">Themes</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {activeTab === "subgenres" && genres && genres.length > 0 && (
                    <div>
                      <label htmlFor="import-parent-genre" className="text-sm font-medium mb-2 block">
                        Parent Genre (optional)
                      </label>
                      <p className="text-xs text-muted-foreground mb-2">
                        If selected, all imported subgenres will be assigned to this parent genre.
                        Otherwise, parent genres should be specified in the CSV data.
                      </p>
                      <Select
                        value={selectedParentGenreId}
                        onValueChange={(value) => {
                          setSelectedParentGenreId(value);
                        }}
                      >
                        <SelectTrigger id="import-parent-genre">
                          <SelectValue placeholder="Select parent genre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Genres</SelectLabel>
                            <SelectItem value="none">None (use CSV values)</SelectItem>
                            {genres.map((genre) => (
                              <SelectItem key={genre.id} value={genre.id.toString()}>
                                {genre.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-muted-foreground mb-4">
                  <p className="font-medium mb-1">CSV Format:</p>
                  {activeTab === "genres" && (
                    <p>Format: "Genre,Subgenre,Description" (ignore Subgenre column)</p>
                  )}
                  {activeTab === "subgenres" && (
                    <p>Format: "Genre,Subgenre,Description" (both Genre and Subgenre required)</p>
                  )}
                  {(activeTab === "tropes" || activeTab === "themes") && (
                    <p>Format: "Name,Description"</p>
                  )}
                </div>
                <Textarea
                  value={bulkImportText}
                  onChange={(e) => setBulkImportText(e.target.value)}
                  placeholder={
                    activeTab === "genres" || activeTab === "subgenres"
                      ? "Genre,Subgenre,Description\nFantasy,,High fantasy and magical worlds\nScience Fiction,,Futuristic settings and technology"
                      : "Name,Description\nThe Chosen One,A character destined for greatness\nLove Triangle,Three characters caught in romantic entanglement"
                  }
                  className="h-48"
                />
                <DialogFooter className="mt-4">
                  <Button type="button" variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={importMutation.isPending}>
                    {importMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Import
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                <span>Add New</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new taxonomy item.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateItem}>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <label htmlFor="item-type" className="text-sm font-medium">
                      Type
                    </label>
                    <Select
                      value={newItem.type}
                      onValueChange={(value: "genre" | "subgenre" | "trope" | "theme") => {
                        setNewItem({ ...newItem, type: value, parentId: value === "subgenre" ? newItem.parentId : null });
                      }}
                    >
                      <SelectTrigger id="item-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Item Type</SelectLabel>
                          <SelectItem value="genre">Genre</SelectItem>
                          <SelectItem value="subgenre">Subgenre</SelectItem>
                          <SelectItem value="trope">Trope</SelectItem>
                          <SelectItem value="theme">Theme</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  {newItem.type === "subgenre" && (
                    <div className="space-y-2">
                      <label htmlFor="parent-genre" className="text-sm font-medium">
                        Parent Genre
                      </label>
                      <Select
                        value={newItem.parentId?.toString() || ""}
                        onValueChange={(value) => {
                          setNewItem({ ...newItem, parentId: value ? parseInt(value) : null });
                        }}
                      >
                        <SelectTrigger id="parent-genre">
                          <SelectValue placeholder="Select parent genre" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Genres</SelectLabel>
                            {genres?.map((genre) => (
                              <SelectItem key={genre.id} value={genre.id.toString()}>
                                {genre.name}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="item-name" className="text-sm font-medium">
                      Name
                    </label>
                    <Input
                      id="item-name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="Enter name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="item-description" className="text-sm font-medium">
                      Description
                    </label>
                    <Textarea
                      id="item-description"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      placeholder="Enter description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="genres" value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="genres">Genres</TabsTrigger>
          <TabsTrigger value="subgenres">Subgenres</TabsTrigger>
          <TabsTrigger value="tropes">Tropes</TabsTrigger>
          <TabsTrigger value="themes">Themes</TabsTrigger>
        </TabsList>

        <TabsContent value="genres" className="pt-4">
          {!genres?.length ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No genres found. Use the "Add New" button to create one.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableCaption>List of major genres.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {genres.map((genre) => {
                      const subgenresForGenre = getSubgenresByParent(genre.id);
                      const hasSubgenres = subgenresForGenre.length > 0;
                      const isExpanded = !!expandedGenres[genre.id];

                      return (
                        <React.Fragment key={genre.id}>
                          <TableRow className="group">
                            <TableCell className="font-medium">
                              <div className="flex items-center">
                                {hasSubgenres ? (
                                  <button
                                    onClick={() => toggleGenreExpansion(genre.id)}
                                    className="mr-2 text-muted-foreground hover:text-foreground"
                                  >
                                    {isExpanded ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </button>
                                ) : (
                                  <span className="mr-6" />
                                )}
                                {genre.name}
                              </div>
                            </TableCell>
                            <TableCell>{genre.description}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setEditItem(genre);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteItem(genre.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          {isExpanded && subgenresForGenre.map((subgenre) => (
                            <TableRow key={subgenre.id} className="bg-muted/50">
                              <TableCell className="font-medium pl-10">{subgenre.name}</TableCell>
                              <TableCell>{subgenre.description}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setEditItem(subgenre);
                                      setIsEditDialogOpen(true);
                                    }}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteItem(subgenre.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="subgenres" className="pt-4">
          {!subgenres?.length ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No subgenres found. Use the "Add New" button to create one.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableCaption>List of subgenres.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Parent Genre</TableHead>
                      <TableHead className="w-[200px]">Subgenre</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subgenres.map((subgenre) => {
                      const parentGenre = genres?.find(g => g.id === subgenre.parentId);

                      return (
                        <TableRow key={subgenre.id} className="group">
                          <TableCell className="font-medium">
                            {parentGenre?.name || "No parent"}
                          </TableCell>
                          <TableCell>{subgenre.name}</TableCell>
                          <TableCell>{subgenre.description}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditItem(subgenre);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteItem(subgenre.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tropes" className="pt-4">
          {!tropes?.length ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No tropes found. Use the "Add New" button to create one.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableCaption>List of tropes.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tropes.map((trope) => (
                      <TableRow key={trope.id} className="group">
                        <TableCell className="font-medium">{trope.name}</TableCell>
                        <TableCell>{trope.description}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditItem(trope);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteItem(trope.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="themes" className="pt-4">
          {!themes?.length ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No themes found. Use the "Add New" button to create one.
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <Table>
                  <TableCaption>List of themes.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right w-[120px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {themes.map((theme) => (
                      <TableRow key={theme.id} className="group">
                        <TableCell className="font-medium">{theme.name}</TableCell>
                        <TableCell>{theme.description}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditItem(theme);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteItem(theme.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update the details of the selected item.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateItem}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="edit-item-type" className="text-sm font-medium">
                  Type
                </label>
                <Input
                  id="edit-item-type"
                  value={editItem?.type || ""}
                  disabled
                  readOnly
                />
              </div>

              {editItem?.type === "subgenre" && (
                <div className="space-y-2">
                  <label htmlFor="edit-parent-genre" className="text-sm font-medium">
                    Parent Genre
                  </label>
                  <Select
                    value={editItem?.parentId?.toString() || ""}
                    onValueChange={(value) => {
                      setEditItem(
                        editItem
                          ? { ...editItem, parentId: value ? parseInt(value) : null }
                          : null
                      );
                    }}
                  >
                    <SelectTrigger id="edit-parent-genre">
                      <SelectValue placeholder="Select parent genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Genres</SelectLabel>
                        {genres?.map((genre) => (
                          <SelectItem key={genre.id} value={genre.id.toString()}>
                            {genre.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="edit-item-name" className="text-sm font-medium">
                  Name
                </label>
                <Input
                  id="edit-item-name"
                  value={editItem?.name || ""}
                  onChange={(e) =>
                    setEditItem(editItem ? { ...editItem, name: e.target.value } : null)
                  }
                  placeholder="Enter name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="edit-item-description" className="text-sm font-medium">
                  Description
                </label>
                <Textarea
                  id="edit-item-description"
                  value={editItem?.description || ""}
                  onChange={(e) =>
                    setEditItem(editItem ? { ...editItem, description: e.target.value } : null)
                  }
                  placeholder="Enter description"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};