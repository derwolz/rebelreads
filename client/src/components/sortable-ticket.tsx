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
    boxShadow: isDragging ? '0 5px 15px rgba(0, 0, 0, 0.1)' : 'none',
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

  // Format priority badge variant
  const getPriorityBadgeVariant = () => {
    switch (ticket.priority) {
      case 1:
        return "default";
      case 2:
        return "secondary";
      case 3:
        return "destructive";
      default:
        return "default";
    }
  };

  // Format priority text
  const getPriorityText = () => {
    switch (ticket.priority) {
      case 1:
        return "Low";
      case 2:
        return "Medium";
      case 3:
        return "High";
      default:
        return "Unknown";
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md"
      onClick={(e) => {
        // Only proceed with click handler if not dragging
        if (!isDragging) {
          // Prevent default action
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }
      }}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              {getTicketIcon()}
              <span>{ticket.ticketNumber}</span>
            </div>
            <Badge variant={getPriorityBadgeVariant() as any}>
              {getPriorityText()}
            </Badge>
          </div>
          <div className="font-medium line-clamp-2">
            {ticket.title}
          </div>
          <div className="text-xs text-gray-500 line-clamp-2">
            {ticket.description.length > 100
              ? `${ticket.description.substring(0, 100)}...`
              : ticket.description}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};