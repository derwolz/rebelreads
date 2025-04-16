import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserBlock } from "../types";
import { BLOCK_TYPE_OPTIONS } from "../constants";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Search, Ban, BookIcon, Building, User, Tag } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Type for search results
interface SearchResult {
  id: number;
  name: string;
  type?: string;
}

export function ContentFiltersSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchType, setSearchType] = useState<string>("author");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("author");

  // Function to get the icon based on block type
  const getBlockIcon = (blockType: string) => {
    switch (blockType) {
      case "author":
        return <User className="h-4 w-4 mr-2" />;
      case "publisher":
        return <Building className="h-4 w-4 mr-2" />;
      case "book":
        return <BookIcon className="h-4 w-4 mr-2" />;
      case "taxonomy":
        return <Tag className="h-4 w-4 mr-2" />;
      default:
        return <Ban className="h-4 w-4 mr-2" />;
    }
  };

  // Fetch all blocks
  const { data: allBlocks, isLoading } = useQuery<UserBlock[]>({
    queryKey: ["/api/filters"],
  });

  // Filter blocks by type for each tab
  const authorBlocks = allBlocks?.filter(block => block.blockType === "author") || [];
  const publisherBlocks = allBlocks?.filter(block => block.blockType === "publisher") || [];
  const bookBlocks = allBlocks?.filter(block => block.blockType === "book") || [];
  const taxonomyBlocks = allBlocks?.filter(block => block.blockType === "taxonomy") || [];

  // Add block mutation
  const addBlockMutation = useMutation({
    mutationFn: async (data: { blockType: string; blockId: number; blockName: string }) => {
      const response = await apiRequest("POST", "/api/filters", data);
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filters"] });
      setSearchResults([]);
      setSearchQuery("");
      toast({
        title: "Block added",
        description: "Content successfully blocked.",
      });
    },
    onError: (error: Error) => {
      if (error.message.includes("Block already exists")) {
        toast({
          title: "Already blocked",
          description: "This content is already in your block list.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to block content. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  // Remove block mutation
  const removeBlockMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/filters/${id}`);
      if (!response.ok) {
        throw new Error("Failed to remove block");
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filters"] });
      toast({
        title: "Block removed",
        description: "Content has been unblocked.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove block. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`/api/filters/search/${searchType}?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error("Search failed");
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Failed to search for content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle adding a block
  const handleAddBlock = (result: SearchResult) => {
    addBlockMutation.mutate({
      blockType: searchType,
      blockId: result.id,
      blockName: result.name
    });
  };

  // Handle removing a block
  const handleRemoveBlock = (id: number) => {
    removeBlockMutation.mutate(id);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Filters</CardTitle>
        <CardDescription>
          Manage what content you don't want to see in your recommendations and search results.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Search section */}
          <div className="space-y-2">
            <h3 className="font-medium">Search for content to block</h3>
            <div className="flex items-center space-x-2">
              <Select defaultValue={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Block type" />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_TYPE_OPTIONS.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex-1 relative">
                <Input
                  placeholder={`Search for a ${searchType}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <Button 
                  variant="ghost" 
                  className="absolute right-0 top-0 h-full px-3" 
                  onClick={handleSearch} 
                  disabled={isSearching || !searchQuery.trim()}
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search results */}
          {isSearching ? (
            <div className="grid gap-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="border rounded-md">
              <div className="p-3 border-b bg-muted/50">
                <h4 className="font-medium">Search Results</h4>
              </div>
              <div className="p-3 space-y-2">
                {searchResults.map((result) => (
                  <div key={result.id} className="flex justify-between items-center p-2 hover:bg-muted/40 rounded">
                    <div className="flex items-center">
                      {getBlockIcon(searchType)}
                      <span>{result.name}</span>
                      {result.type && (
                        <Badge variant="outline" className="ml-2">{result.type}</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddBlock(result)}
                      disabled={addBlockMutation.isPending}
                    >
                      Block
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Blocked content tabs */}
          <Tabs defaultValue="author" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="author">Authors</TabsTrigger>
              <TabsTrigger value="publisher">Publishers</TabsTrigger>
              <TabsTrigger value="book">Books</TabsTrigger>
              <TabsTrigger value="taxonomy">Taxonomies</TabsTrigger>
            </TabsList>
            <TabsContent value="author" className="space-y-4 pt-4">
              <h3 className="font-medium text-sm text-muted-foreground">Blocked Authors</h3>
              {isLoading ? (
                <div className="grid gap-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : authorBlocks.length > 0 ? (
                <div className="space-y-2">
                  {authorBlocks.map((block) => (
                    <div key={block.id} className="flex justify-between items-center p-2 border rounded hover:bg-muted/40">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        <span>{block.blockName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBlock(block.id)}
                        disabled={removeBlockMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No authors blocked.</p>
              )}
            </TabsContent>
            <TabsContent value="publisher" className="space-y-4 pt-4">
              <h3 className="font-medium text-sm text-muted-foreground">Blocked Publishers</h3>
              {isLoading ? (
                <div className="grid gap-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : publisherBlocks.length > 0 ? (
                <div className="space-y-2">
                  {publisherBlocks.map((block) => (
                    <div key={block.id} className="flex justify-between items-center p-2 border rounded hover:bg-muted/40">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        <span>{block.blockName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBlock(block.id)}
                        disabled={removeBlockMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No publishers blocked.</p>
              )}
            </TabsContent>
            <TabsContent value="book" className="space-y-4 pt-4">
              <h3 className="font-medium text-sm text-muted-foreground">Blocked Books</h3>
              {isLoading ? (
                <div className="grid gap-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : bookBlocks.length > 0 ? (
                <div className="space-y-2">
                  {bookBlocks.map((block) => (
                    <div key={block.id} className="flex justify-between items-center p-2 border rounded hover:bg-muted/40">
                      <div className="flex items-center">
                        <BookIcon className="h-4 w-4 mr-2" />
                        <span>{block.blockName}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveBlock(block.id)}
                        disabled={removeBlockMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No books blocked.</p>
              )}
            </TabsContent>
            <TabsContent value="taxonomy" className="space-y-4 pt-4">
              <h3 className="font-medium text-sm text-muted-foreground">Blocked Taxonomies</h3>
              {isLoading ? (
                <div className="grid gap-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : taxonomyBlocks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {taxonomyBlocks.map((block) => (
                    <Badge 
                      key={block.id} 
                      variant="secondary"
                      className="flex items-center gap-1 py-1 px-2"
                    >
                      {block.blockName}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveBlock(block.id)}
                      />
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No taxonomies blocked.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}