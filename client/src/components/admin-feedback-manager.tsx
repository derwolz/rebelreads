import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SortableTicket } from "./sortable-ticket";
import { format } from "date-fns";

// Types for our feedback tickets
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

type TicketUpdate = {
  status?: string;
  priority?: number;
  assignedTo?: number | null;
};

// Component for the Kanban board column
const KanbanColumn: React.FC<{
  title: string;
  status: string;
  tickets: FeedbackTicket[];
  onTicketClick: (ticket: FeedbackTicket) => void;
}> = ({ title, status, tickets, onTicketClick }) => {
  // Style based on status
  const getHeaderStyle = () => {
    switch (status) {
      case "new":
        return "bg-blue-50 border-blue-200";
      case "in_progress":
        return "bg-amber-50 border-amber-200";
      case "resolved":
        return "bg-green-50 border-green-200";
      case "closed":
        return "bg-gray-50 border-gray-200";
      default:
        return "bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="flex flex-col min-w-[300px] max-w-[350px] h-full">
      <div className={`p-3 font-medium rounded-t-md ${getHeaderStyle()}`}>
        {title} ({tickets.length})
      </div>
      <div className="flex-1 overflow-y-auto bg-slate-50 p-2 rounded-b-md border border-slate-200">
        <SortableContext items={tickets.map(t => t.id.toString())} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {tickets.map((ticket) => (
              <SortableTicket 
                key={ticket.id} 
                ticket={ticket} 
                onClick={() => onTicketClick(ticket)} 
              />
            ))}
            {tickets.length === 0 && (
              <div className="text-center py-6 text-slate-400 italic text-sm">
                No tickets
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

// Format the priority level as text
const formatPriority = (priority: number): string => {
  switch (priority) {
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

// Format the priority level to badge variant
const priorityToBadgeVariant = (priority: number): "default" | "secondary" | "destructive" => {
  switch (priority) {
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

// Format the ticket type to display text
const formatTicketType = (type: string): string => {
  switch (type) {
    case "bug_report":
      return "Bug Report";
    case "feature_request":
      return "Feature Request";
    case "general_feedback":
      return "General Feedback";
    case "question":
      return "Question";
    default:
      return type;
  }
};

// Main Feedback Manager Component
export function AdminFeedbackManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicket, setSelectedTicket] = useState<FeedbackTicket | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // Setup DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Fetch all feedback tickets
  const { data: tickets, isLoading } = useQuery<FeedbackTicket[]>({
    queryKey: ["/api/feedback/admin/all"],
    queryFn: async () => {
      const response = await fetch("/api/feedback/admin/all");
      if (!response.ok) {
        throw new Error("Failed to fetch feedback tickets");
      }
      return response.json();
    },
  });

  // Update ticket mutation
  const updateTicketMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: TicketUpdate }) => {
      const response = await apiRequest("PATCH", `/api/feedback/admin/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feedback/admin/all"] });
      toast({
        title: "Ticket Updated",
        description: "The ticket has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update ticket: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const ticketId = parseInt(active.id.toString());
    const ticket = tickets?.find(t => t.id === ticketId);
    
    if (!ticket) return;
    
    // Determine the new status based on the container it was dropped into
    const dropContainerId = over.id.toString();
    let newStatus: string | undefined;
    
    if (dropContainerId.startsWith("container-")) {
      newStatus = dropContainerId.replace("container-", "");
    } else {
      // If dropped on another ticket, determine which container that ticket is in
      const overTicketId = parseInt(over.id.toString());
      const overTicket = tickets?.find(t => t.id === overTicketId);
      if (overTicket) {
        newStatus = overTicket.status;
      }
    }
    
    if (newStatus && newStatus !== ticket.status) {
      updateTicketMutation.mutate({
        id: ticket.id,
        updates: { status: newStatus }
      });
    }
  };

  // Handle ticket click to open detail dialog
  const handleTicketClick = (ticket: FeedbackTicket) => {
    setSelectedTicket(ticket);
    setIsDetailDialogOpen(true);
  };

  // Handle update priority
  const handleUpdatePriority = (priority: string) => {
    if (!selectedTicket) return;
    
    updateTicketMutation.mutate({
      id: selectedTicket.id,
      updates: { priority: parseInt(priority) }
    });
    
    // Update the selected ticket locally to show the change immediately
    setSelectedTicket(prev => {
      if (!prev) return null;
      return { ...prev, priority: parseInt(priority) };
    });
  };

  // Handle update status
  const handleUpdateStatus = (status: string) => {
    if (!selectedTicket) return;
    
    updateTicketMutation.mutate({
      id: selectedTicket.id,
      updates: { status }
    });
    
    // Update the selected ticket locally to show the change immediately
    setSelectedTicket(prev => {
      if (!prev) return null;
      return { ...prev, status: status as any };
    });
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch (error) {
      return "Invalid date";
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Group tickets by status
  const newTickets = tickets?.filter(t => t.status === "new") || [];
  const inProgressTickets = tickets?.filter(t => t.status === "in_progress") || [];
  const resolvedTickets = tickets?.filter(t => t.status === "resolved") || [];
  const closedTickets = tickets?.filter(t => t.status === "closed") || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Feedback Ticket Management</h3>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[calc(100vh-300px)]">
          <KanbanColumn 
            title="New" 
            status="new" 
            tickets={newTickets} 
            onTicketClick={handleTicketClick} 
          />
          <KanbanColumn 
            title="In Progress" 
            status="in_progress" 
            tickets={inProgressTickets} 
            onTicketClick={handleTicketClick} 
          />
          <KanbanColumn 
            title="Resolved" 
            status="resolved" 
            tickets={resolvedTickets} 
            onTicketClick={handleTicketClick} 
          />
          <KanbanColumn 
            title="Closed" 
            status="closed" 
            tickets={closedTickets} 
            onTicketClick={handleTicketClick} 
          />
        </div>
      </DndContext>

      {/* Ticket Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Ticket #{selectedTicket?.ticketNumber}</DialogTitle>
            <DialogDescription>
              View and manage feedback ticket details
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">Type</div>
                  <div>{formatTicketType(selectedTicket.type)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Priority</div>
                  <Select
                    defaultValue={selectedTicket.priority.toString()}
                    onValueChange={handleUpdatePriority}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Low</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium mb-1">Status</div>
                  <Select
                    defaultValue={selectedTicket.status}
                    onValueChange={handleUpdateStatus}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">Created</div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    {formatDate(selectedTicket.createdAt)}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Title</div>
                <div className="p-2 bg-gray-50 rounded border">{selectedTicket.title}</div>
              </div>

              <div>
                <div className="text-sm font-medium mb-1">Description</div>
                <div className="p-3 bg-gray-50 rounded border whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                  {selectedTicket.description}
                </div>
              </div>

              {selectedTicket.deviceInfo && (
                <div>
                  <div className="text-sm font-medium mb-1">Device Information</div>
                  <div className="p-2 bg-gray-50 rounded border text-xs font-mono overflow-x-auto">
                    <pre>{JSON.stringify(selectedTicket.deviceInfo, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}