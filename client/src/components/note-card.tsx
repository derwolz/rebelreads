import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Note } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface NoteCardProps {
  note: Note;
  className?: string;
}

export function NoteCard({ note, className = "" }: NoteCardProps) {
  // Format the timestamp to show how long ago it was modified
  const formattedDate = formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true });
  
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="bg-muted/30 py-2 px-4">
        <div className="text-xs text-muted-foreground">
          Last updated {formattedDate}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="whitespace-pre-wrap text-sm">{note.content}</div>
      </CardContent>
    </Card>
  );
}