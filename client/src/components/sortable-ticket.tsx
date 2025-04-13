import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, AlertTriangle, Lightbulb, HelpCircle } from "lucide-react";

type FeedbackTicket = {
  id: number;
  ticketNumber: string;
  userId: number | null;
  type: "bug_report" | "feature_request" | "general_feedback" | "question";
  title: string;
  description: string;
  status: "new" | "in_progress" | "resolved" | "closed";
  priority: number;
  assignedTo: number | null;
  deviceInfo: any;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

interface SortableTicketProps {
  ticket: FeedbackTicket;
  onClick: () => void;
}

export const SortableTicket: React.FC<SortableTicketProps> = ({ ticket, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: ticket.id.toString(),
    transition: {
      duration: 150, // Faster transitions for more responsive feel
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)' // Custom easing for smoother drag feel
    }
  });

  // Apply styles for dragging
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1000 : 1,
    // Use specific CSS position values that won't cause type errors
    position: isDragging ? 'relative' as const : 'static' as const,
  };

  // Get appropriate icon based on ticket type
  const getTicketIcon = () => {
    switch (ticket.type) {
      case "bug_report":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "feature_request":
        return <Lightbulb className="h-4 w-4 text-amber-500" />;
      case "question":
        return <HelpCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-slate-500" />;
    }
  };

  // Get priority badge color
  const getPriorityBadge = () => {
    switch (ticket.priority) {
      case 3:
        return <Badge variant="destructive">High</Badge>;
      case 2:
        return <Badge variant="secondary">Medium</Badge>;
      default:
        return <Badge variant="outline">Low</Badge>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-manipulation"
    >
      <Card 
        className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-l-4 border-l-primary"
        onClick={onClick}
      >
        <CardContent className="p-3 space-y-1.5">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1.5">
              {getTicketIcon()}
              <span className="text-xs font-mono text-slate-500">#{ticket.ticketNumber}</span>
            </div>
            {getPriorityBadge()}
          </div>
          <div className="font-medium line-clamp-2">{ticket.title}</div>
          <div className="text-xs text-slate-500 line-clamp-2">{ticket.description}</div>
        </CardContent>
      </Card>
    </div>
  );
};