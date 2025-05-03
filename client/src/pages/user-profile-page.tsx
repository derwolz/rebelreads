import React, { useState, useEffect } from "react";
import { useLocation, useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookCard } from "@/components/book-card";
import { BookshelfCard } from "@/components/bookshelf-card";
import { SeashellRating } from "@/components/seashell-rating";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

// Icons
import { 
  UserIcon,
  UserPlusIcon, 
  UserMinusIcon, 
  BookmarkIcon, 
  BookOpenIcon,
  HeartIcon
} from "lucide-react";

interface UserProfileData {
  username: string;
  displayName: string;
  profileImageUrl: string | null;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  ratingPreferences: any | null;
  compatibility: {
    overall: string;
    score: number;
    normalizedDifference: number;
    criteria: Record<string, {
      compatibility: string;
      difference: number;
      normalized: number;
    }>;
  } | null;
  wishlist: Array<{
    book: any;
  }>;
  pinnedShelves: Array<any>;
  recommendedBooks: Array<{
    book: any;
  }>;
}

const UserProfilePage: React.FC = () => {
  const [, params] = useRoute("/:username");
  const username = params?.username || "";
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Check if this is the logged in user's profile
  const isOwnProfile = isAuthenticated && user?.username === username;
  
  // Get user profile data
  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: [username],
    queryFn: () => apiRequest(`/${username}`),
    enabled: !!username
  });
  
  // Get following status (if not own profile)
  const { data: followingData, isLoading: followingLoading } = useQuery({
    queryKey: [username, 'following-status'],
    queryFn: () => apiRequest(`/${username}/following-status`),
    enabled: !!username && isAuthenticated && !isOwnProfile
  });
  
  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: () => apiRequest(`/${username}/follow`, {
      method: 'POST'
    }),
    onSuccess: (data) => {
      // Show toast message
      toast({
        title: data.action === 'followed' ? 'Followed' : 'Unfollowed',
        description: data.action === 'followed' 
          ? `You are now following ${username}` 
          : `You are no longer following ${username}`,
        duration: 3000
      });
      
      // Invalidate following status query
      queryClient.invalidateQueries({ queryKey: [username, 'following-status'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update following status',
        variant: 'destructive',
        duration: 3000
      });
    }
  });
  
  // Handle follow/unfollow button click
  const handleFollowClick = () => {
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to follow users',
        variant: 'destructive',
        duration: 3000
      });
      return;
    }
    
    followMutation.mutate();
  };
  
  if (profileLoading) {
    return (
      <div className="container py-8">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-full md:w-1/4">
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <Skeleton className="h-24 w-24 rounded-full" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="w-full md:w-3/4">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-40 mb-4" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  if (profileError || !profileData) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-4">
              <UserIcon size={64} className="text-muted-foreground" />
              <h2 className="text-2xl font-bold">User Not Found</h2>
              <p className="text-muted-foreground">
                The profile you're looking for doesn't exist or is unavailable.
              </p>
              <Button asChild>
                <Link href="/">Go Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const { 
    displayName,
    profileImageUrl,
    bio,
    followerCount,
    followingCount,
    ratingPreferences,
    compatibility,
    wishlist,
    pinnedShelves,
    recommendedBooks
  } = profileData as UserProfileData;
  
  // Get first letter of username for avatar fallback
  const avatarFallback = displayName.charAt(0).toUpperCase();
  
  // Get following status
  const isFollowing = followingData?.isFollowing || false;
  
  return (
    <div className="container py-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar - Profile Info */}
        <div className="w-full lg:w-1/4 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileImageUrl || ""} alt={displayName} />
                  <AvatarFallback>{avatarFallback}</AvatarFallback>
                </Avatar>
                
                <div>
                  <h2 className="text-2xl font-bold">{displayName}</h2>
                  <p className="text-muted-foreground">@{username}</p>
                </div>
                
                <div className="flex space-x-4 text-sm">
                  <div>
                    <span className="font-bold">{followerCount}</span>
                    <span className="text-muted-foreground ml-1">Followers</span>
                  </div>
                  <div>
                    <span className="font-bold">{followingCount}</span>
                    <span className="text-muted-foreground ml-1">Following</span>
                  </div>
                </div>
                
                {!isOwnProfile && isAuthenticated && (
                  <Button 
                    variant={isFollowing ? "outline" : "default"}
                    onClick={handleFollowClick}
                    disabled={followMutation.isPending}
                    className="w-full"
                  >
                    {isFollowing ? (
                      <>
                        <UserMinusIcon className="mr-2 h-4 w-4" />
                        Unfollow
                      </>
                    ) : (
                      <>
                        <UserPlusIcon className="mr-2 h-4 w-4" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
                
                {bio && (
                  <div className="text-sm">
                    <p>{bio}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Rating Preferences (visible only to the profile owner) */}
          {isOwnProfile && ratingPreferences && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Rating Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(ratingPreferences).map(([key, value]) => {
                    if (['id', 'userId', 'createdAt', 'updatedAt', 'autoAdjust'].includes(key)) return null;
                    
                    return (
                      <div key={key} className="flex justify-between items-center">
                        <span className="capitalize">{key}</span>
                        <span className="font-medium">{Number(value).toFixed(2)}</span>
                      </div>
                    );
                  })}
                  
                  <div className="flex justify-between items-center pt-2 border-t">
                    <span>Auto-adjust</span>
                    <span>{ratingPreferences.autoAdjust ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Reading Compatibility (for logged in users viewing other profiles) */}
          {!isOwnProfile && isAuthenticated && compatibility && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reading Compatibility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <p className="font-semibold text-center mb-2">Overall</p>
                  <div className="flex justify-center mb-2">
                    <SeashellRating score={compatibility.score} />
                  </div>
                  <p className="text-center text-sm">{compatibility.overall}</p>
                </div>
                
                <Separator className="my-4" />
                
                <div className="space-y-3">
                  <p className="font-medium text-sm">Criteria Details:</p>
                  
                  {Object.entries(compatibility.criteria).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="capitalize text-sm">{key}</span>
                        <Badge variant={value.compatibility.includes("Compatible") ? "default" : "outline"}>
                          {value.compatibility}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Reading Compatibility Teaser (for non-logged in users) */}
          {!isAuthenticated && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reading Compatibility</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="blur-sm pointer-events-none">
                  <div className="mb-4">
                    <p className="font-semibold text-center mb-2">Overall</p>
                    <div className="flex justify-center mb-2">
                      <SeashellRating score={1} />
                    </div>
                    <p className="text-center text-sm">Sample Compatibility</p>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <div className="space-y-3">
                    <p className="font-medium text-sm">Criteria Details:</p>
                    
                    {["enjoyment", "writing", "themes", "characters", "worldbuilding"].map((key) => (
                      <div key={key} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="capitalize text-sm">{key}</span>
                          <Badge variant="outline">
                            Sample
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-4">
                  <p className="font-semibold text-center mb-4">Login to discover your reading compatibility</p>
                  <Button asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Main Content Area */}
        <div className="w-full lg:w-3/4">
          <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
              <TabsTrigger value="bookshelves">Bookshelves</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>
            
            {/* Overview Tab - Shows a bit of everything */}
            <TabsContent value="overview">
              <div className="space-y-8">
                {/* Wishlist Preview */}
                {wishlist.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl">Wishlist</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setActiveTab("wishlist")}
                        >
                          View All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {wishlist.slice(0, 3).map((item, index) => (
                          <BookCard key={index} book={item.book} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Pinned Bookshelves */}
                {pinnedShelves.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl">Pinned Bookshelves</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setActiveTab("bookshelves")}
                        >
                          View All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {pinnedShelves.slice(0, 3).map((shelf) => (
                          <Link key={shelf.id} href={`/book-shelf/share?username=${username}&shelfname=${shelf.title}`}>
                            <BookshelfCard
                              title={shelf.title}
                              coverImageUrl={shelf.coverImageUrl}
                            />
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Recommended Books */}
                {recommendedBooks.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl">Recommended Books</CardTitle>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setActiveTab("recommendations")}
                        >
                          View All
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {recommendedBooks.slice(0, 3).map((item, index) => (
                          <BookCard key={index} book={item.book} />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
            
            {/* Wishlist Tab */}
            <TabsContent value="wishlist">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookmarkIcon className="mr-2 h-5 w-5" />
                    Wishlist
                  </CardTitle>
                  <CardDescription>
                    Books {isOwnProfile ? "you've" : `${displayName} has`} added to wishlist
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {wishlist.length === 0 ? (
                    <div className="text-center py-6">
                      <BookmarkIcon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                      <h3 className="text-lg font-medium">No books in wishlist</h3>
                      <p className="text-muted-foreground">
                        {isOwnProfile 
                          ? "You haven't added any books to your wishlist yet." 
                          : `${displayName} hasn't added any books to their wishlist yet.`}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {wishlist.map((item, index) => (
                        <BookCard key={index} book={item.book} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Bookshelves Tab */}
            <TabsContent value="bookshelves">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpenIcon className="mr-2 h-5 w-5" />
                    Bookshelves
                  </CardTitle>
                  <CardDescription>
                    Shared bookshelves created by {isOwnProfile ? "you" : displayName}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {pinnedShelves.length === 0 ? (
                    <div className="text-center py-6">
                      <BookOpenIcon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                      <h3 className="text-lg font-medium">No shared bookshelves</h3>
                      <p className="text-muted-foreground">
                        {isOwnProfile 
                          ? "You haven't shared any bookshelves yet." 
                          : `${displayName} hasn't shared any bookshelves yet.`}
                      </p>
                      {isOwnProfile && (
                        <Button className="mt-4" asChild>
                          <Link href="/book-shelf">Manage Bookshelves</Link>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {pinnedShelves.map((shelf) => (
                        <Link key={shelf.id} href={`/book-shelf/share?username=${username}&shelfname=${shelf.title}`}>
                          <BookshelfCard
                            title={shelf.title}
                            coverImageUrl={shelf.coverImageUrl}
                          />
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Recommendations Tab */}
            <TabsContent value="recommendations">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HeartIcon className="mr-2 h-5 w-5" />
                    Recommended Books
                  </CardTitle>
                  <CardDescription>
                    Books {isOwnProfile ? "you've" : `${displayName} has`} enjoyed and recommended
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recommendedBooks.length === 0 ? (
                    <div className="text-center py-6">
                      <HeartIcon className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                      <h3 className="text-lg font-medium">No recommended books</h3>
                      <p className="text-muted-foreground">
                        {isOwnProfile 
                          ? "You haven't recommended any books yet." 
                          : `${displayName} hasn't recommended any books yet.`}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {recommendedBooks.map((item, index) => (
                        <BookCard key={index} book={item.book} />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;