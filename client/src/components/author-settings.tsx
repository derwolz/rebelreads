import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Book, ReferralLink } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { BookUploadDialog } from "@/components/book-upload-wizard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableReferralLink } from "./sortable-referral-link";
import { apiRequest } from "@/lib/queryClient";

export interface AuthorSettingsProps {
  userBooks?: Book[];
}

export function AuthorSettings({ userBooks }: AuthorSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editedReferralLinks, setEditedReferralLinks] = useState<{ [bookId: number]: ReferralLink[] }>({});

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const promoteBookMutation = useMutation({
    mutationFn: async (bookId: number) => {
      const res = await apiRequest("POST", `/api/books/${bookId}/promote`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-books"] });
      toast({
        title: "Book promoted",
        description: "Your book promotion request has been submitted.",
      });
    },
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (bookId: number) => {
      const res = await apiRequest("DELETE", `/api/books/${bookId}`);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-books"] });
      toast({
        title: "Book deleted",
        description: "Your book has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateBookMutation = useMutation({
    mutationFn: async (data: { id: number; referralLinks: ReferralLink[] }) => {
      const res = await apiRequest("PATCH", `/api/books/${data.id}`, { referralLinks: data.referralLinks });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-books"] });
      toast({
        title: "Book updated",
        description: "Your book has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const initializeBookReferralLinks = (bookId: number, links: ReferralLink[] = []) => {
    if (!editedReferralLinks[bookId]) {
      setEditedReferralLinks(prev => ({
        ...prev,
        [bookId]: links
      }));
    }
  };

  const updateBookReferralLinks = (bookId: number, links: ReferralLink[]) => {
    setEditedReferralLinks(prev => ({
      ...prev,
      [bookId]: links
    }));
  };

  const handleDragEnd = (event: any, bookId: number) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      const links = [...(editedReferralLinks[bookId] || [])];
      const oldIndex = active.id;
      const newIndex = over.id;
      
      const newLinks = arrayMove(links, oldIndex, newIndex);
      updateBookReferralLinks(bookId, newLinks);
    }
  };

  const handleLinkChange = (bookId: number, index: number, url: string) => {
    const links = [...(editedReferralLinks[bookId] || [])];
    links[index] = { ...links[index], url };
    updateBookReferralLinks(bookId, links);
  };

  const handleLinkRemove = (bookId: number, index: number) => {
    const links = [...(editedReferralLinks[bookId] || [])].filter((_, i) => i !== index);
    updateBookReferralLinks(bookId, links);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Author Settings</CardTitle>
        <CardDescription>
          Manage your published books and upload new ones
        </CardDescription>
      </CardHeader>
      <CardContent>
        <BookUploadDialog />
        <div className="mt-8 grid gap-6">
          {userBooks?.map((book) => {
            if (!editedReferralLinks[book.id]) {
              initializeBookReferralLinks(book.id, book.referralLinks as ReferralLink[]);
            }
            
            return (
              <div key={book.id} className="border rounded-lg p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-medium">{book.title}</h3>
                      <p className="text-sm text-muted-foreground">{book.authorName}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => promoteBookMutation.mutate(book.id)}
                      >
                        Promote
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-destructive/10 hover:bg-destructive/20 border-destructive/20 text-destructive hover:text-destructive"
                          >
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <div className="mb-4">
                              This action cannot be undone. This will permanently delete your book
                              and remove it from our servers.
                            </div>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteBookMutation.mutate(book.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Referral Links</h4>
                      <Button
                        type="button"
                        onClick={() => {
                          const links = editedReferralLinks[book.id] || [];
                          updateBookMutation.mutate({
                            id: book.id,
                            referralLinks: links,
                          });
                        }}
                        size="sm"
                        variant="secondary"
                      >
                        Save Links
                      </Button>
                    </div>
                    
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => handleDragEnd(event, book.id)}
                    >
                      <SortableContext
                        items={Array.from({ length: (editedReferralLinks[book.id] || []).length }, (_, i) => i)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2">
                          {(editedReferralLinks[book.id] || []).map((link, index) => (
                            <SortableReferralLink
                              key={index}
                              link={link}
                              index={index}
                              onChange={(value) => handleLinkChange(book.id, index, value)}
                              onRemove={() => handleLinkRemove(book.id, index)}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}