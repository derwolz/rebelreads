import { useEffect, useState } from "react";
import { useLocation, useSearch } from "wouter";
import { PaperNoteCard } from "@/components/paper-note-card";
import { Note } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function NoteCardPage() {
  const [location, navigate] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  const [notFound, setNotFound] = useState(false);
  
  // Extract parameters from query string
  const searchParams = new URLSearchParams(search);
  const noteId = searchParams.get("id");
  const username = searchParams.get("username");
  const shelfname = searchParams.get("shelfname");
  
  // Fetch the note data
  const { data: note, isLoading, error } = useQuery<Note>({
    queryKey: [`/api/notes/${noteId}`],
    enabled: !!noteId,
    retry: false,
    onSuccess: () => {},
    onError: () => {
      setNotFound(true);
    }
  } as any); // Type assertion to avoid TypeScript error

  // Display error if note ID is missing
  useEffect(() => {
    if (!noteId) {
      setNotFound(true);
    }
  }, [noteId]);

  // Handle going back to the bookshelf
  const handleBackToShelf = () => {
    if (username && shelfname) {
      navigate(`/book-shelf/share?username=${encodeURIComponent(username)}&shelfname=${encodeURIComponent(shelfname)}`);
    } else {
      navigate('/');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={handleBackToShelf}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Bookshelf
        </Button>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Loading note...</p>
          </div>
        ) : notFound || error ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Note Not Found</h2>
            <p className="text-gray-600 mb-6">
              The note you're looking for could not be found. It may have been deleted or moved.
            </p>
            <Button onClick={handleBackToShelf}>
              Return to Bookshelf
            </Button>
          </div>
        ) : note ? (
          <div className="transition-all duration-500 transform hover:rotate-0">
            <PaperNoteCard note={note} className="max-w-2xl mx-auto" />
          </div>
        ) : null}
      </div>
    </main>
  );
}