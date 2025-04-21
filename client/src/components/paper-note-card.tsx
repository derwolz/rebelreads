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
      <div 
        className="bg-amber-50 p-6 rounded-md shadow-md transform rotate-0 transition-transform hover:rotate-1 border border-amber-200"
        style={{
          backgroundImage: `
            linear-gradient(#f5ecce 1px, transparent 1px), 
            linear-gradient(90deg, #f5ecce 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          boxShadow: '2px 3px 10px rgba(0,0,0,0.2), 0 0 40px rgba(0,0,0,0.05) inset'
        }}
      >
        {/* Date stamp at the top */}
        <div className="text-xs text-amber-800/80 mb-3 font-mono border-b border-amber-200 pb-1 flex justify-between">
          <span className="font-bold">TIMESTAMP</span>
          <span>{formattedDate}</span>
        </div>
        
        {/* Note content with handwritten-like styling */}
        <div 
          className="text-gray-800 whitespace-pre-wrap leading-relaxed text-lg"
          style={{ 
            fontFamily: "'Caveat', cursive, 'Comic Sans MS', 'Segoe Script', 'Bradley Hand', cursive, sans-serif",
            textShadow: '0 0 1px rgba(0,0,0,0.1)'
          }}
        >
          {note.content}
        </div>
      </div>
    </div>
  );
}