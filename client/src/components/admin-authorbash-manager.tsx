import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash, Edit, Calendar, AlarmClock } from "lucide-react";
import { format, parseISO } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Question {
  id: number;
  question: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

interface Response {
  id: number;
  questionId: number;
  authorId: number;
  text: string | null;
  imageUrl: string | null;
  retentionCount: number;
  impressionCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    author_name: string;
    author_image_url: string | null;
  };
}

export function AdminAuthorBashManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // New question form state
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    weekNumber: 1,
    startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
    isActive: true,
  });

  // Edit question form state
  const [editQuestion, setEditQuestion] = useState({
    id: 0,
    question: "",
    weekNumber: 1,
    startDate: "",
    endDate: "",
    isActive: false,
  });

  // Query to fetch all questions
  const {
    data: questions,
    isLoading: loadingQuestions,
    refetch: refetchQuestions,
  } = useQuery({
    queryKey: ["/api/authorbash/admin/questions"],
    queryFn: async () => {
      const response = await fetch("/api/authorbash/admin/questions");
      if (!response.ok) {
        throw new Error("Failed to fetch questions");
      }
      return response.json();
    },
  });

  // Query to fetch responses for selected question
  const {
    data: responses,
    isLoading: loadingResponses,
  } = useQuery({
    queryKey: ["/api/authorbash/admin/responses", selectedQuestion?.id],
    queryFn: async () => {
      const response = await fetch(`/api/authorbash/admin/responses?questionId=${selectedQuestion?.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch responses");
      }
      return response.json();
    },
    enabled: !!selectedQuestion?.id,
  });

  // Handle form input changes for new question
  const handleNewQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewQuestion({
      ...newQuestion,
      [name]: value,
    });
  };

  // Handle switch change for new question
  const handleNewQuestionSwitchChange = (checked: boolean) => {
    setNewQuestion({
      ...newQuestion,
      isActive: checked,
    });
  };

  // Handle form input changes for edit question
  const handleEditQuestionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditQuestion({
      ...editQuestion,
      [name]: value,
    });
  };

  // Handle switch change for edit question
  const handleEditQuestionSwitchChange = (checked: boolean) => {
    setEditQuestion({
      ...editQuestion,
      isActive: checked,
    });
  };

  // Handle click on edit question
  const handleEditClick = (question: Question) => {
    setEditQuestion({
      id: question.id,
      question: question.question,
      weekNumber: question.weekNumber,
      startDate: format(parseISO(question.startDate), "yyyy-MM-dd'T'HH:mm"),
      endDate: format(parseISO(question.endDate), "yyyy-MM-dd'T'HH:mm"),
      isActive: question.isActive,
    });
    setIsEditDialogOpen(true);
  };

  // Handle click on question row to view responses
  const handleQuestionClick = (question: Question) => {
    setSelectedQuestion(question);
  };

  // Create new question
  const createQuestion = async () => {
    try {
      const response = await fetch("/api/authorbash/admin/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newQuestion,
          weekNumber: parseInt(newQuestion.weekNumber.toString()),
          startDate: new Date(newQuestion.startDate),
          endDate: new Date(newQuestion.endDate),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create question");
      }

      toast({
        title: "Question created",
        description: "The new question was created successfully.",
      });

      // Reset form and close dialog
      setNewQuestion({
        question: "",
        weekNumber: 1,
        startDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
        isActive: true,
      });
      setIsAddDialogOpen(false);

      // Refetch questions
      queryClient.invalidateQueries({ queryKey: ["/api/authorbash/admin/questions"] });
      refetchQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create question",
        variant: "destructive",
      });
    }
  };

  // Update existing question
  const updateQuestion = async () => {
    try {
      const response = await fetch(`/api/authorbash/admin/questions/${editQuestion.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editQuestion,
          weekNumber: parseInt(editQuestion.weekNumber.toString()),
          startDate: new Date(editQuestion.startDate),
          endDate: new Date(editQuestion.endDate),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update question");
      }

      toast({
        title: "Question updated",
        description: "The question was updated successfully.",
      });

      // Close dialog
      setIsEditDialogOpen(false);

      // Refetch questions
      queryClient.invalidateQueries({ queryKey: ["/api/authorbash/admin/questions"] });
      refetchQuestions();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update question",
        variant: "destructive",
      });
    }
  };

  // Delete question
  const deleteQuestion = async (id: number) => {
    if (!confirm("Are you sure you want to delete this question? This will also delete all associated responses.")) {
      return;
    }

    try {
      const response = await fetch(`/api/authorbash/admin/questions/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to delete question");
      }

      toast({
        title: "Question deleted",
        description: "The question and all its responses have been deleted.",
      });

      // Refetch questions
      queryClient.invalidateQueries({ queryKey: ["/api/authorbash/admin/questions"] });
      refetchQuestions();

      // If the deleted question was selected, reset selection
      if (selectedQuestion?.id === id) {
        setSelectedQuestion(null);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  // Format dates for display
  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), "MMM d, yyyy h:mm a");
  };

  // Check if a question is active (current date is between start and end dates)
  const isQuestionActive = (question: Question) => {
    const now = new Date();
    const start = parseISO(question.startDate);
    const end = parseISO(question.endDate);
    return now >= start && now <= end && question.isActive;
  };

  // Check if a question is future (current date is before start date)
  const isQuestionFuture = (question: Question) => {
    const now = new Date();
    const start = parseISO(question.startDate);
    return now < start && question.isActive;
  };

  // Check if a question is expired (current date is after end date)
  const isQuestionExpired = (question: Question) => {
    const now = new Date();
    const end = parseISO(question.endDate);
    return now > end || !question.isActive;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">AuthorBash Management</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Question
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Create New Question</DialogTitle>
              <DialogDescription>
                Create a new AuthorBash question for authors to respond to. 
                Set the week number, start and end dates, and whether it's active.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  name="question"
                  placeholder="e.g., What book changed your life and why?"
                  value={newQuestion.question}
                  onChange={handleNewQuestionChange}
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="weekNumber">Week Number</Label>
                  <Input
                    id="weekNumber"
                    name="weekNumber"
                    type="number"
                    min="1"
                    value={newQuestion.weekNumber}
                    onChange={handleNewQuestionChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="isActive" className="flex items-center justify-between">
                    Active
                    <Switch
                      id="isActive"
                      checked={newQuestion.isActive}
                      onCheckedChange={handleNewQuestionSwitchChange}
                    />
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="datetime-local"
                    value={newQuestion.startDate}
                    onChange={handleNewQuestionChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="datetime-local"
                    value={newQuestion.endDate}
                    onChange={handleNewQuestionChange}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" onClick={createQuestion}>Create Question</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Edit Question</DialogTitle>
              <DialogDescription>
                Update the AuthorBash question, dates, or status.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-question">Question</Label>
                <Textarea
                  id="edit-question"
                  name="question"
                  placeholder="e.g., What book changed your life and why?"
                  value={editQuestion.question}
                  onChange={handleEditQuestionChange}
                  className="min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-weekNumber">Week Number</Label>
                  <Input
                    id="edit-weekNumber"
                    name="weekNumber"
                    type="number"
                    min="1"
                    value={editQuestion.weekNumber}
                    onChange={handleEditQuestionChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-isActive" className="flex items-center justify-between">
                    Active
                    <Switch
                      id="edit-isActive"
                      checked={editQuestion.isActive}
                      onCheckedChange={handleEditQuestionSwitchChange}
                    />
                  </Label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-startDate">Start Date</Label>
                  <Input
                    id="edit-startDate"
                    name="startDate"
                    type="datetime-local"
                    value={editQuestion.startDate}
                    onChange={handleEditQuestionChange}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-endDate">End Date</Label>
                  <Input
                    id="edit-endDate"
                    name="endDate"
                    type="datetime-local"
                    value={editQuestion.endDate}
                    onChange={handleEditQuestionChange}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" onClick={updateQuestion}>Update Question</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="questions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="responses" disabled={!selectedQuestion}>Responses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>AuthorBash Questions</CardTitle>
              <CardDescription>
                Manage weekly questions for AuthorBash. Click on a question to view its responses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingQuestions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : questions && questions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Week</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.map((question: Question) => (
                      <TableRow 
                        key={question.id} 
                        className={
                          (selectedQuestion?.id === question.id ? "bg-muted/50 " : "") + 
                          "cursor-pointer hover:bg-muted/30"
                        }
                        onClick={() => handleQuestionClick(question)}
                      >
                        <TableCell>Week {question.weekNumber}</TableCell>
                        <TableCell className="max-w-md truncate">{question.question}</TableCell>
                        <TableCell>
                          <span className="flex items-center">
                            <Calendar className="mr-2 h-4 w-4" />
                            {formatDate(question.startDate)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center">
                            <AlarmClock className="mr-2 h-4 w-4" />
                            {formatDate(question.endDate)}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isQuestionActive(question) && (
                            <Badge className="bg-green-500">Active</Badge>
                          )}
                          {isQuestionFuture(question) && (
                            <Badge variant="outline" className="border-blue-500 text-blue-500">Scheduled</Badge>
                          )}
                          {isQuestionExpired(question) && (
                            <Badge variant="outline" className="border-gray-500 text-gray-500">Expired</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditClick(question)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteQuestion(question.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No questions found. Create your first AuthorBash question to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="responses" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Responses for Week {selectedQuestion?.weekNumber}
              </CardTitle>
              <CardDescription>
                {selectedQuestion?.question}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingResponses ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : responses && responses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Author</TableHead>
                      <TableHead>Response Text</TableHead>
                      <TableHead>Has Image</TableHead>
                      <TableHead>Retention Count</TableHead>
                      <TableHead>Impression Count</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((response: Response) => (
                      <TableRow key={response.id}>
                        <TableCell>{response.author.author_name}</TableCell>
                        <TableCell className="max-w-md truncate">
                          {response.text || <span className="text-muted-foreground italic">No text</span>}
                        </TableCell>
                        <TableCell>
                          {response.imageUrl ? 
                            <Badge variant="outline" className="border-green-500 text-green-500">Yes</Badge> : 
                            <Badge variant="outline" className="border-gray-500 text-gray-500">No</Badge>
                          }
                        </TableCell>
                        <TableCell>{response.retentionCount}</TableCell>
                        <TableCell>{response.impressionCount}</TableCell>
                        <TableCell>{formatDate(response.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No responses found for this question yet.
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                {responses ? responses.length : 0} total responses
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}