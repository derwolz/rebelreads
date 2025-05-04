import React, { useState } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookCard } from "@/components/book-card";
import { BookshelfCard } from "@/components/bookshelf-card";
import { SeashellRating } from "@/components/seashell-rating";
import { RatingSimilarityIcon } from "@/components/rating-similarity-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/api-helpers";
import { queryClient } from "@/lib/queryClient";

// Icons
import { 
  UserIcon,
  UserPlusIcon, 
  UserMinusIcon, 
  BookmarkIcon, 
  BookOpenIcon,
  HeartIcon,
  LockIcon
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
  
  // Check if this is the logged in user's profile
  const isOwnProfile = isAuthenticated && user?.username === username;
  
  // Get user profile data
  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: [username],
    queryFn: async () => {
      return apiRequest<UserProfileData>(`/api/users/${username}`);
    },
    enabled: !!username
  });
  
  // Get following status (if not own profile)
  const { data: followingData, isLoading: followingLoading } = useQuery({
    queryKey: [username, 'following-status'],
    queryFn: async () => {
      return apiRequest<{isFollowing: boolean}>(`/api/users/${username}/following-status`);
    },
    enabled: !!username && isAuthenticated && !isOwnProfile
  });
  
  // Get rating preferences based on whether it's own profile or not
  const { data: ratingData, isLoading: ratingLoading } = useQuery({
    queryKey: [username, 'ratings', isOwnProfile ? 'own' : 'comparison'],
    queryFn: async () => {
      if (isOwnProfile) {
        return apiRequest(`/api/users/${username}/ratings`);
      } else {
        return apiRequest(`/api/users/${username}/ratings-comparison`);
      }
    },
    enabled: !!username && isAuthenticated // Only load if authenticated
  });
  
  // Get genre preferences based on whether it's own profile or not
  const { data: genreData, isLoading: genreLoading } = useQuery({
    queryKey: [username, 'genres', isOwnProfile ? 'own' : 'comparison'],
    queryFn: async () => {
      if (isOwnProfile) {
        return apiRequest(`/api/users/${username}/genres`);
      } else {
        return apiRequest(`/api/users/${username}/genre-comparison`);
      }
    },
    enabled: !!username && isAuthenticated // Only load if authenticated
  });
  
  // Follow/unfollow mutation
  const followMutation = useMutation({
    mutationFn: async () => {
      return apiRequest<{success: boolean, action: 'followed' | 'unfollowed'}>(`/api/users/${username}/follow`, {
        method: 'POST'
      });
    },
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
          
          {/* Reading Compatibility - Using New API Routes */}
          {isAuthenticated && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reading Compatibility</CardTitle>
              </CardHeader>
              <CardContent>
                {ratingLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ) : isOwnProfile ? (
                  // Own profile - show personal rating preferences
                  <div className="space-y-2">
                    {ratingData?.preferences && (
                      <>
                        <p className="font-medium text-sm">Your Rating Preferences:</p>
                        {Object.entries(ratingData.preferences).map(([key, value]) => {
                          if (['id', 'userId', 'createdAt', 'updatedAt', 'autoAdjust'].includes(key)) return null;
                          
                          return (
                            <div key={key} className="flex justify-between items-center">
                              <span className="capitalize text-sm">{key}</span>
                              <span className="font-medium">{Number(value).toFixed(2)}</span>
                            </div>
                          );
                        })}
                        <div className="pt-2 border-t mt-2">
                          <p className="font-medium text-sm mt-2">Genre Preferences:</p>
                          {genreLoading ? (
                            <Skeleton className="h-6 w-full" />
                          ) : (
                            <div className="space-y-1 mt-1">
                              {genreData?.genreViews?.length > 0 ? (
                                genreData.genreViews.slice(0, 3).map((view: any, index: number) => (
                                  <div key={index} className="flex justify-between items-center">
                                    <span className="text-sm">{view.name}</span>
                                    <Badge>{view.genres?.length || 0} genres</Badge>
                                  </div>
                                ))
                              ) : (
                                <p className="text-sm text-muted-foreground">No genre preferences set</p>
                              )}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  // Other user profile - show compatibility with the new compact design
                  <div className="space-y-6">
                    {ratingData && (
                      <>
                        {/* Overall compatibility section */}
                        <div className="flex flex-col items-center space-y-2 mb-4">
                          <h3 className="text-sm font-medium">Overall Compatibility</h3>
                          {ratingData.compatibility && (
                            <SeashellRating 
                              compatibilityScore={ratingData.compatibility.score} 
                              compatibilityLabel={ratingData.compatibility.overall}
                              isLoggedIn={true} 
                            />
                          )}
                        </div>
                        
                        <Separator />
                        
                        {/* Individual rating criteria */}
                        <div className="space-y-3">
                          <h3 className="text-sm font-medium text-center">Reading Preferences</h3>
                          <div className="flex flex-wrap justify-center gap-4 mt-2">
                            {['enjoyment', 'writing', 'themes', 'characters', 'worldbuilding'].map(criterion => {
                              // Get both users' values for this criterion
                              const user1Value = parseFloat(ratingData.currentUser.preferences?.[criterion] || "0");
                              const user2Value = parseFloat(ratingData.targetUser.preferences?.[criterion] || "0");
                              
                              // Calculate difference/similarity
                              const difference = Math.abs(user1Value - user2Value);
                              
                              return (
                                <RatingSimilarityIcon
                                  key={criterion}
                                  criterion={criterion}
                                  similarity={difference}
                                  label={`${criterion}: ${Math.round((1 - difference) * 100)}% similar`}
                                  size="md"
                                />
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Genre compatibility section */}
                        {!genreLoading && genreData && (
                          <>
                            <Separator />
                            <div className="space-y-3">
                              <h3 className="text-sm font-medium text-center">Genre Compatibility</h3>
                              
                              {/* Show genre compatibility rating */}
                              {genreData.compatibility && (
                                <div className="flex justify-center mt-2 mb-3">
                                  <SeashellRating 
                                    compatibilityScore={genreData.compatibility.score} 
                                    compatibilityLabel={genreData.compatibility.overall}
                                    isLoggedIn={true}
                                    showLabel={false}
                                  />
                                </div>
                              )}
                              
                              {/* Show common genres */}
                              <div className="mt-3">
                                <p className="text-xs text-center text-muted-foreground mb-2">Top genres in common:</p>
                                <div className="flex flex-wrap justify-center gap-1">
                                  {genreData.currentUser.genreViews?.length > 0 && 
                                   genreData.targetUser.genreViews?.length > 0 ? (
                                    genreData.currentUser.genreViews
                                      .flatMap((view: any) => view.genres || [])
                                      .filter((genre: any) => 
                                        genreData.targetUser.genreViews
                                          .flatMap((view: any) => view.genres || [])
                                          .some((targetGenre: any) => targetGenre.taxonomyId === genre.taxonomyId)
                                      )
                                      .slice(0, 5)
                                      .map((genre: any, index: number) => (
                                        <Badge key={index} variant="outline" className="capitalize">
                                          {genre.taxonomy?.name || "Genre"}
                                        </Badge>
                                      ))
                                  ) : (
                                    <p className="text-xs text-muted-foreground">
                                      {genreData.currentUser.genreViews?.length === 0 
                                        ? "Set up your preferences to see common genres" 
                                        : "This user hasn't set genre preferences"}
                                    </p>
                                  )}
                                  
                                  {/* Show "no common genres" message if needed */}
                                  {genreData.currentUser.genreViews?.length > 0 && 
                                   genreData.targetUser.genreViews?.length > 0 &&
                                   genreData.currentUser.genreViews
                                    .flatMap((view: any) => view.genres || [])
                                    .filter((genre: any) => 
                                      genreData.targetUser.genreViews
                                        .flatMap((view: any) => view.genres || [])
                                        .some((targetGenre: any) => targetGenre.taxonomyId === genre.taxonomyId)
                                    ).length === 0 && (
                                    <p className="text-xs text-muted-foreground">No common genres found</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                )}
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
                    <p className="font-semibold text-center mb-2">Overall Compatibility</p>
                    <div className="flex justify-center mb-2">
                      <SeashellRating 
                        compatibilityScore={1} 
                        compatibilityLabel="Sample compatibility" 
                        isLoggedIn={false}
                      />
                    </div>
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
                  <p className="font-semibold text-center mb-4">Create an account to see compatibility</p>
                  <Button asChild>
                    <Link href="/auth">Sign Up</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Main Content Area */}
        <div className="w-full lg:w-3/4">
          <div className="space-y-8">
            {/* Bio Section */}
            {bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <UserIcon className="mr-2 h-5 w-5" />
                    About
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{bio}</p>
                </CardContent>
              </Card>
            )}
            
            {/* Wishlist Section */}
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
            
            {/* Bookshelves Section */}
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
                      <BookshelfCard
                        key={shelf.id}
                        id={shelf.id}
                        title={shelf.title}
                        coverImageUrl={shelf.coverImageUrl}
                        bookCount={shelf.bookCount || 0}
                        username={username}
                        featuredBooks={shelf.books}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Recommended Books Section */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;