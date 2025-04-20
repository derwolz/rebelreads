import { Note } from "@shared/schema";
import { format } from "date-fns";

interface PaperNoteCardProps {
  note: Note;
  className?: string;
}

export function PaperNoteCard({ note, className = "" }: PaperNoteCardProps) {
  // Format the timestamp for display
  const formattedDate = format(new Date(note.updatedAt), "PPpp"); // e.g., "Apr 20, 2025, 8:30 PM"
  
  return (
    <div className={`max-w-md mx-auto ${className}`}>
      <div className="bg-amber-50 p-6 rounded-md shadow-md transform rotate-0 transition-transform hover:rotate-1 border border-amber-200">
        {/* Date stamp at the top */}
        <div className="text-xs text-amber-800/70 mb-3 font-mono border-b border-amber-200 pb-1">
          {formattedDate}
        </div>
        
        {/* Note content with handwritten-like styling */}
        <div 
          className="font-handwriting text-gray-800 whitespace-pre-wrap leading-relaxed text-lg"
          style={{ 
            fontFamily: "'Caveat', cursive, 'Apple Casual', 'Comic Sans MS', sans-serif",
          }}
        >
          {note.content}
        </div>
      </div>
    </div>
  );
}