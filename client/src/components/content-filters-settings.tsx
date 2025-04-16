import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { BLOCK_TYPE_OPTIONS, UserBlock } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchResult {
  id: number;
  name: string;
  type?: string;
}

export function ContentFiltersSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<typeof BLOCK_TYPE_OPTIONS[number]>("author");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  // Get all blocks for the user
  const { data: blocks, isLoading, refetch } = useQuery({
    queryKey: ["/api/filters"],
    retry: false,
  });

  // Filter blocks by type
  const filteredBlocks = blocks?.filter(
    (block: UserBlock) => block.blockType === selectedType
  ) || [];

  // Add a new block
  const addBlockMutation = useMutation({
    mutationFn: async (data: { blockType: string; blockId: number; blockName: string }) => {
      const response = await apiRequest("POST", "/api/filters", data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add block");
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filters"] });
      toast({
        title: "Block added",
        description: "Content has been successfully blocked",
      });
      setSearchQuery("");
      setSearchResults([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add block",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove a block
  const removeBlockMutation = useMutation({
    mutationFn: async (blockId: number) => {
      const response = await apiRequest("DELETE", `/api/filters/${blockId}`);
      if (!response.ok) {
        throw new Error("Failed to remove block");
      }
      return blockId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/filters"] });
      toast({
        title: "Block removed",
        description: "Content block has been removed",
      });
    },
    onError: () => {
      toast({
        title: "Failed to remove block",
        description: "An error occurred while removing the block",
        variant: "destructive",
      });
    },
  });

  // Handle search for content to block
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/filters/search/${selectedType}?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error("Search failed");
      }
      const results = await response.json();
      setSearchResults(results);
    } catch (error) {
      toast({
        title: "Search failed",
        description: "Failed to search for content",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Add a new block from search results
  const handleAddBlock = (result: SearchResult) => {
    addBlockMutation.mutate({
      blockType: selectedType,
      blockId: result.id,
      blockName: result.name,
    });
  };

  // Clear search results
  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Filters</CardTitle>
        <CardDescription>
          Block specific authors, publishers, books, or taxonomies from appearing in your recommendations and search results.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="author" onValueChange={(value) => setSelectedType(value as any)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="author">Authors</TabsTrigger>
            <TabsTrigger value="publisher">Publishers</TabsTrigger>
            <TabsTrigger value="book">Books</TabsTrigger>
            <TabsTrigger value="taxonomy">Genres/Topics</TabsTrigger>
          </TabsList>

          {BLOCK_TYPE_OPTIONS.map((type) => (
            <TabsContent key={type} value={type} className="space-y-4">
              {/* Search for content to block */}
              <div className="flex space-x-2 mb-4">
                <div className="flex-1">
                  <Input
                    placeholder={`Search for ${type}s to block...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                >
                  {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
                {searchResults.length > 0 && (
                  <Button variant="outline" onClick={handleClearSearch}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Search results */}
              {searchResults.length > 0 && (
                <Card className="mb-4">
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm">Search Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[200px]">
                      <ul className="space-y-2">
                        {searchResults.map((result) => (
                          <li
                            key={result.id}
                            className="flex justify-between items-center p-2 rounded-md hover:bg-muted"
                          >
                            <div className="flex-1">
                              <span>{result.name}</span>
                              {result.type && (
                                <Badge variant="outline" className="ml-2">
                                  {result.type}
                                </Badge>
                              )}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddBlock(result)}
                              disabled={addBlockMutation.isPending}
                            >
                              Block
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Current blocked content */}
              <div>
                <h3 className="text-sm font-medium mb-2">Blocked {type}s</h3>
                {isLoading ? (
                  <div className="flex justify-center items-center h-20">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : filteredBlocks.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No {type}s are currently blocked.
                  </p>
                ) : (
                  <ScrollArea className="h-[220px]">
                    <ul className="space-y-2">
                      {filteredBlocks.map((block: UserBlock) => (
                        <li
                          key={block.id}
                          className="flex justify-between items-center p-2 rounded-md hover:bg-muted"
                        >
                          <span>{block.blockName}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeBlockMutation.mutate(block.id)}
                            disabled={removeBlockMutation.isPending}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="secondary" onClick={() => refetch()} className="gap-2">
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}