import { Note } from "@shared/schema";
import { format } from "date-fns";

interface PaperNoteCardProps {
  note: Note;
  className?: string;
}

export function PaperNoteCard({ note, className = "" }: PaperNoteCardProps) {


  
  return (
    <div className={`max-w-md mx-auto w-full h-auto ${className}`}>
      <div 
        className="  p-2 rounded-md shadow-md transform rotate-0 transition-transform  "

      >

        
        {/* Note content with handwritten-like styling */}
        <div 
          className="whitespace-pre-wrap leading-relaxed text-lg"
          style={{ 
            
            textShadow: '0 0 1px rgba(0,0,0,0.1)'
          }}
        >
          {note.content}
        </div>
      </div>
    </div>
  );
}