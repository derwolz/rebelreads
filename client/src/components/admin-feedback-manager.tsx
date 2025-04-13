import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  DragStartEvent,
  DragOverEvent,
  DragCancelEvent,
  pointerWithin,
  rectIntersection,
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
import { Loader2, MessageSquare, Calendar, User, Plus, AlertTriangle, HelpCircle, Lightbulb, ClipboardList } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SortableTicket } from "./sortable-ticket";
import { format, isToday, isThisWeek, isThisMonth, isThisYear } from "date-fns";

// Admin note type
type AdminNote = {
  id: string;
  content: string;
  createdAt: string | Date;
  createdBy?: number;
};

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
  adminNotes: string | null; // Legacy field - keeping for backward compatibility
  adminNotesData: AdminNote[]; // Structured notes with timestamps
  deviceInfo: any;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
};

type TicketUpdate = {
  status?: string;
  priority?: number;
  assignedTo?: number | null;
  adminNotes?: string | null;
  adminNotesData?: AdminNote[];
};

// Component for the Kanban board column
const KanbanColumn: React.FC<{
  title: string;
  status: string;
  tickets: FeedbackTicket[];
  onTicketClick: (ticket: FeedbackTicket) => void;
}> = ({ title, status, tickets, onTicketClick }) => {
  // Set up droppable for the column
  const { setNodeRef: setColumnRef } = useDroppable({
    id: `container-${status}`
  });
  
  // Set up droppable for the content area
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `droppable-${status}`
  });
  
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

  // Add highlight style when a draggable is over the droppable area
  const getDroppableStyle = () => {
    return isOver 
      ? "flex-1 overflow-y-auto bg-slate-100 p-2 rounded-b-md border-2 border-primary" 
      : "flex-1 overflow-y-auto bg-slate-50 p-2 rounded-b-md border border-slate-200";
  };

  return (
    <div 
      ref={setColumnRef}
      className="flex flex-col min-w-[300px] max-w-[350px] h-full"
    >
      <div className={`p-3 font-medium rounded-t-md ${getHeaderStyle()}`}>
        {title} ({tickets.length})
      </div>
      <div 
        ref={setDroppableRef}
        className={getDroppableStyle()}
      >
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
  const { user } = useAuth();
  const [selectedTicket, setSelectedTicket] = useState<FeedbackTicket | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [initialStatus, setInitialStatus] = useState<string | null>(null);
  
  // Define form validation schema
  const createTicketSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters"),
    description: z.string().min(10, "Description must be at least 10 characters"),
    type: z.enum(["bug_report", "feature_request", "general_feedback", "question"]),
    priority: z.string().refine(value => ["1", "2", "3"].includes(value), "Priority must be 1, 2, or 3")
  });
  
  // Form for creating new tickets
  const createForm = useForm<z.infer<typeof createTicketSchema>>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "bug_report",
      priority: "2" // Default to medium priority
    }
  });
  
  // Create ticket mutation
  const createTicketMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createTicketSchema>) => {
      const response = await apiRequest("POST", "/api/feedback/admin/create", {
        title: data.title,
        description: data.description,
        type: data.type,
        priority: parseInt(data.priority),
        status: "new"
      });
      
      if (!response.ok) {
        throw new Error("Failed to create ticket");
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Success notification
      toast({
        title: "Success",
        description: "Ticket has been created successfully",
        variant: "default",
      });
      
      // Close the dialog and reset form
      setIsCreateDialogOpen(false);
      createForm.reset();
      
      // Refresh the ticket list
      queryClient.invalidateQueries({ queryKey: ["/api/feedback/admin/all"] });
    },
    onError: (error: Error) => {
      // Error notification
      toast({
        title: "Error",
        description: `Failed to create ticket: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Setup DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Configure the PointerSensor to use activationConstraint for better control
      activationConstraint: {
        // Require a small delay or movement before starting drag
        delay: 100,
        tolerance: 5,
      }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id.toString());
    
    // Store the original status for return if dropped in invalid area
    const ticketId = parseInt(active.id.toString());
    const ticket = tickets?.find(t => t.id === ticketId);
    if (ticket) {
      setInitialStatus(ticket.status);
    }
  };

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
      // Silently update by invalidating queries
      queryClient.invalidateQueries({ queryKey: ["/api/feedback/admin/all"] });
      // No success toast
    },
    onError: (error: Error) => {
      // Only show toast on error
      toast({
        title: "Error",
        description: `Failed to update ticket: ${error.message}`,
        variant: "destructive",
      });
      
      // Invalidate queries to revert to server state
      queryClient.invalidateQueries({ queryKey: ["/api/feedback/admin/all"] });
    },
  });

  // Handle drag end event
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    // Clear active ID
    setActiveId(null);
    
    // If there's no valid drop target, return to original column
    if (!over) {
      if (initialStatus && tickets) {
        const ticketId = parseInt(active.id.toString());
        const updatedTickets = tickets.map(t => {
          if (t.id === ticketId) {
            return { ...t, status: initialStatus as any };
          }
          return t;
        });
        queryClient.setQueryData(["/api/feedback/admin/all"], updatedTickets);
      }
      return;
    }
    
    const ticketId = parseInt(active.id.toString());
    const ticket = tickets?.find(t => t.id === ticketId);
    
    if (!ticket) return;
    
    // Determine the new status based on the container it was dropped into
    const dropContainerId = over.id.toString();
    let newStatus: string | undefined;
    
    if (dropContainerId.startsWith("container-")) {
      newStatus = dropContainerId.replace("container-", "");
    } else if (dropContainerId.startsWith("droppable-")) {
      // Check if it was dropped in a droppable area
      newStatus = dropContainerId.replace("droppable-", "");
    } else {
      // If dropped on another ticket, determine which container that ticket is in
      try {
        const overTicketId = parseInt(over.id.toString());
        const overTicket = tickets?.find(t => t.id === overTicketId);
        if (overTicket) {
          newStatus = overTicket.status;
        } else {
          // If no valid target, revert to original column
          newStatus = initialStatus || ticket.status;
        }
      } catch (error) {
        console.log("Error parsing ticket ID:", error);
        // Revert to original column on error
        newStatus = initialStatus || ticket.status;
      }
    }
    
    // Only update if there's a valid status and it's different from current
    if (newStatus && newStatus !== ticket.status) {
      // First, get a copy of all tickets
      const updatedTickets = tickets?.map(t => {
        // Update the status of the dragged ticket locally
        if (t.id === ticket.id) {
          return { ...t, status: newStatus as any };
        }
        return t;
      });
      
      // Update the local state immediately through the queryClient
      queryClient.setQueryData(["/api/feedback/admin/all"], updatedTickets);
      
      // Then update the backend silently only if it's a valid column status change
      // (not a revert to original position)
      if (newStatus !== initialStatus) {
        updateTicketMutation.mutate({
          id: ticket.id,
          updates: { status: newStatus }
        });
      }
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
    
    const priorityValue = parseInt(priority);
    
    // Update the selected ticket locally to show the change immediately
    setSelectedTicket(prev => {
      if (!prev) return null;
      return { ...prev, priority: priorityValue };
    });
    
    // Update all tickets data in case it's visible in the board
    if (tickets) {
      const updatedTickets = tickets.map(t => {
        if (t.id === selectedTicket.id) {
          return { ...t, priority: priorityValue };
        }
        return t;
      });
      
      // Update local state immediately
      queryClient.setQueryData(["/api/feedback/admin/all"], updatedTickets);
    }
    
    // Then update the backend silently
    updateTicketMutation.mutate({
      id: selectedTicket.id,
      updates: { priority: priorityValue }
    });
  };

  // Handle update status
  const handleUpdateStatus = (status: string) => {
    if (!selectedTicket) return;
    
    // Update the selected ticket locally to show the change immediately
    setSelectedTicket(prev => {
      if (!prev) return null;
      return { ...prev, status: status as any };
    });
    
    // Update all tickets data in case it's visible in the board
    if (tickets) {
      const updatedTickets = tickets.map(t => {
        if (t.id === selectedTicket.id) {
          return { ...t, status: status as any };
        }
        return t;
      });
      
      // Update local state immediately
      queryClient.setQueryData(["/api/feedback/admin/all"], updatedTickets);
    }
    
    // Then update the backend silently
    updateTicketMutation.mutate({
      id: selectedTicket.id,
      updates: { status }
    });
  };
  
  // Function to generate a unique ID for new notes
  const generateNoteId = () => {
    return Date.now().toString();
  };
  
  // State for the new note being added
  const [newNote, setNewNote] = useState<string>("");
  
  // Group notes by date category (today, this week, this month, this year, older)
  const groupNotesByDate = (notes: AdminNote[]) => {
    const today: AdminNote[] = [];
    const thisWeek: AdminNote[] = [];
    const thisMonth: AdminNote[] = [];
    const thisYear: AdminNote[] = [];
    const older: AdminNote[] = [];
    
    notes.forEach(note => {
      const noteDate = new Date(note.createdAt);
      
      if (isToday(noteDate)) {
        today.push(note);
      } else if (isThisWeek(noteDate)) {
        thisWeek.push(note);
      } else if (isThisMonth(noteDate)) {
        thisMonth.push(note);
      } else if (isThisYear(noteDate)) {
        thisYear.push(note);
      } else {
        older.push(note);
      }
    });
    
    // Return object with grouped notes, sorted in reverse chronological order (newest first)
    return {
      today: today.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      thisWeek: thisWeek.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      thisMonth: thisMonth.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      thisYear: thisYear.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      older: older.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    };
  };
  
  // Format time for notes display
  const formatNoteTime = (dateString: string | Date) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy h:mm a");
    } catch (error) {
      return "Invalid date";
    }
  };
  
  // Note display component for consistent rendering
  const NoteItem = ({ note }: { note: AdminNote }) => (
    <div key={note.id} className="bg-gray-50 p-3 rounded-md border text-sm">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{formatNoteTime(note.createdAt)}</span>
        {note.createdBy && (
          <span className="flex items-center">
            <User className="h-3 w-3 mr-1" />
            ID: {note.createdBy}
          </span>
        )}
      </div>
      <div className="whitespace-pre-wrap">{note.content}</div>
    </div>
  );
  
  // Legacy - handle update of the old admin notes field
  const handleUpdateAdminNotes = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    if (!selectedTicket) return;
    
    const adminNotes = event.target.value;
    
    // Only update if the value actually changed
    if (adminNotes === selectedTicket.adminNotes) return;
    
    // Update the selected ticket locally to show the change immediately
    setSelectedTicket(prev => {
      if (!prev) return null;
      return { ...prev, adminNotes };
    });
    
    // Update all tickets data in case it's visible in the board
    if (tickets) {
      const updatedTickets = tickets.map(t => {
        if (t.id === selectedTicket.id) {
          return { ...t, adminNotes };
        }
        return t;
      });
      
      // Update local state immediately
      queryClient.setQueryData(["/api/feedback/admin/all"], updatedTickets);
    }
    
    // Then update the backend silently
    updateTicketMutation.mutate({
      id: selectedTicket.id,
      updates: { adminNotes }
    });
  };
  
  // Add a new note to the ticket
  const handleAddNote = () => {
    if (!selectedTicket || !newNote.trim()) return;
    
    // Create the new note object
    const note: AdminNote = {
      id: generateNoteId(),
      content: newNote.trim(),
      createdAt: new Date(),
      createdBy: user?.id // Add the current user ID
    };
    
    // Create a new array with existing notes plus the new one
    const updatedNotes = selectedTicket.adminNotesData 
      ? [note, ...selectedTicket.adminNotesData]  // Add to beginning of array (newest first)
      : [note];
    
    // Update the selected ticket locally to show the change immediately
    setSelectedTicket(prev => {
      if (!prev) return null;
      return { ...prev, adminNotesData: updatedNotes };
    });
    
    // Update all tickets data in case it's visible in the board
    if (tickets) {
      const updatedTickets = tickets.map(t => {
        if (t.id === selectedTicket.id) {
          return { ...t, adminNotesData: updatedNotes };
        }
        return t;
      });
      
      // Update local state immediately
      queryClient.setQueryData(["/api/feedback/admin/all"], updatedTickets);
    }
    
    // Clear the input field
    setNewNote("");
    
    // Then update the backend silently
    updateTicketMutation.mutate({
      id: selectedTicket.id,
      updates: { adminNotesData: updatedNotes }
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
        <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          Create New Ticket
        </Button>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[
          // Define a custom modifier to make the dragged item follow mouse exactly
          ({transform: dragTransform}: {transform: {x: number, y: number, scaleX: number, scaleY: number}}) => ({
            ...dragTransform,
            x: dragTransform.x,
            y: dragTransform.y, 
            scaleX: 1,
            scaleY: 1,
          })
        ]}
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
        <DialogContent className="sm:max-w-[900px]">
          <DialogHeader>
            <DialogTitle>Ticket #{selectedTicket?.ticketNumber}</DialogTitle>
            <DialogDescription>
              View and manage feedback ticket details
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="flex gap-6">
              {/* Main ticket details */}
              <div className="flex-1 space-y-4">
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
                
                {/* Legacy Admin Notes Section - hidden */}
                <div className="hidden">
                  <Textarea
                    placeholder="Legacy notes field - not displayed"
                    defaultValue={selectedTicket.adminNotes || ""}
                    onBlur={handleUpdateAdminNotes}
                  />
                </div>
              </div>
              
              {/* Admin Notes Sidebar */}
              <div className="w-80 border-l pl-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-gray-500" />
                    <h3 className="text-md font-medium">Admin Notes</h3>
                  </div>
                  <div className="text-xs text-gray-500 italic">Private to admins</div>
                </div>
                
                {/* Add new note input */}
                <div className="mb-4">
                  <Textarea
                    className="min-h-[80px] text-sm"
                    placeholder="Add a new note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <Button 
                    size="sm" 
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="mt-2 w-full"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Note
                  </Button>
                </div>
                
                {/* Notes list with date grouping */}
                <div className="max-h-[350px] overflow-y-auto pr-2">
                  {selectedTicket.adminNotesData && selectedTicket.adminNotesData.length > 0 ? (
                    <>
                      {/* Group and display notes */}
                      {(() => {
                        const groupedNotes = groupNotesByDate(selectedTicket.adminNotesData);
                        
                        return (
                          <div className="space-y-4">
                            {/* Today's notes */}
                            {groupedNotes.today.length > 0 && (
                              <div>
                                <h4 className="text-xs font-medium uppercase text-gray-500 mb-2">Today</h4>
                                <div className="space-y-3">
                                  {groupedNotes.today.map(note => (
                                    <NoteItem key={note.id} note={note} />
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* This week's notes */}
                            {groupedNotes.thisWeek.length > 0 && (
                              <div>
                                <h4 className="text-xs font-medium uppercase text-gray-500 mb-2">This Week</h4>
                                <div className="space-y-3">
                                  {groupedNotes.thisWeek.map(note => (
                                    <NoteItem key={note.id} note={note} />
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* This month's notes */}
                            {groupedNotes.thisMonth.length > 0 && (
                              <div>
                                <h4 className="text-xs font-medium uppercase text-gray-500 mb-2">This Month</h4>
                                <div className="space-y-3">
                                  {groupedNotes.thisMonth.map(note => (
                                    <NoteItem key={note.id} note={note} />
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* This year's notes */}
                            {groupedNotes.thisYear.length > 0 && (
                              <div>
                                <h4 className="text-xs font-medium uppercase text-gray-500 mb-2">This Year</h4>
                                <div className="space-y-3">
                                  {groupedNotes.thisYear.map(note => (
                                    <NoteItem key={note.id} note={note} />
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Older notes */}
                            {groupedNotes.older.length > 0 && (
                              <div>
                                <h4 className="text-xs font-medium uppercase text-gray-500 mb-2">Older</h4>
                                <div className="space-y-3">
                                  {groupedNotes.older.map(note => (
                                    <NoteItem key={note.id} note={note} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-400 italic text-sm">
                      No notes yet. Add the first note above.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setIsDetailDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Ticket Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Feedback Ticket</DialogTitle>
            <DialogDescription>
              Create a new feedback ticket to track issues or feature requests
            </DialogDescription>
          </DialogHeader>

          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit((data) => {
              // Use the mutation to create the ticket
              createTicketMutation.mutate(data);
            })} className="space-y-4">
              <FormField
                control={createForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description of the issue or request" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Detailed description of the issue or feature request" 
                        className="min-h-[100px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bug_report">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              <span>Bug Report</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="feature_request">
                            <div className="flex items-center gap-2">
                              <Lightbulb className="h-4 w-4 text-amber-500" />
                              <span>Feature Request</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="general_feedback">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-slate-500" />
                              <span>General Feedback</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="question">
                            <div className="flex items-center gap-2">
                              <HelpCircle className="h-4 w-4 text-blue-500" />
                              <span>Question</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Low</SelectItem>
                          <SelectItem value="2">Medium</SelectItem>
                          <SelectItem value="3">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Ticket</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}