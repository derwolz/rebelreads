import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { GripVertical, Trash2, Plus } from "lucide-react";
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SurveyBuilderWizardProps {
  open: boolean;
  onClose: () => void;
}

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "open_question", label: "Open Question" },
  { value: "checkbox", label: "Checkbox" },
  { value: "ranking", label: "Item Ranking" },
] as const;

type QuestionType = (typeof QUESTION_TYPES)[number]["value"];

interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  required: boolean;
}

const surveySchema = z.object({
  title: z.string().min(1, "Survey title is required"),
  description: z.string(),
  questions: z.array(z.object({
    id: z.string(),
    type: z.enum(["multiple_choice", "open_question", "checkbox", "ranking"]),
    text: z.string().min(1, "Question text is required"),
    options: z.array(z.string()).optional(),
    required: z.boolean(),
  })).max(10, "Maximum 10 questions allowed"),
});

type SurveyForm = z.infer<typeof surveySchema>;

function SortableQuestion({ question, onUpdate, onDelete }: {
  question: Question;
  onUpdate: (id: string, updates: Partial<Question>) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card className="mb-4" ref={setNodeRef} style={style}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <button
            className="mt-1 cursor-move touch-none"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex-1 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <Input
                value={question.text}
                onChange={(e) => onUpdate(question.id, { text: e.target.value })}
                placeholder="Enter your question"
                className="flex-1"
              />
              <Select
                value={question.type}
                onValueChange={(value: QuestionType) => onUpdate(question.id, { type: value })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(question.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {(question.type === "multiple_choice" || question.type === "checkbox" || question.type === "ranking") && (
              <div className="space-y-2">
                <FormLabel>Options</FormLabel>
                {question.options?.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(question.options || [])];
                        newOptions[index] = e.target.value;
                        onUpdate(question.id, { options: newOptions });
                      }}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const newOptions = question.options?.filter((_, i) => i !== index);
                        onUpdate(question.id, { options: newOptions });
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newOptions = [...(question.options || []), ""];
                    onUpdate(question.id, { options: newOptions });
                  }}
                >
                  Add Option
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function SurveyBuilderWizard({ open, onClose }: SurveyBuilderWizardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [questions, setQuestions] = useState<Question[]>([]);
  const sensors = useSensors(useSensor(PointerSensor));

  const form = useForm<SurveyForm>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      title: "",
      description: "",
      questions: [],
    },
  });

  const createSurvey = useMutation({
    mutationFn: async (data: SurveyForm) => {
      const response = await fetch("/api/surveys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create survey");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/surveys"] });
      toast({
        title: "Survey Created",
        description: "Your survey has been created successfully.",
      });
      onClose();
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to create survey. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addQuestion = () => {
    if (questions.length >= 10) {
      toast({
        title: "Maximum Questions Reached",
        description: "You can only add up to 10 questions per survey.",
        variant: "destructive",
      });
      return;
    }

    const newQuestion: Question = {
      id: crypto.randomUUID(),
      type: "multiple_choice",
      text: "",
      options: [""],
      required: true,
    };

    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, ...updates } : q
    ));
  };

  const deleteQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((q) => q.id === active.id);
        const newIndex = items.findIndex((q) => q.id === over.id);

        const newItems = [...items];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);

        return newItems;
      });
    }
  };

  const onSubmit = (data: SurveyForm) => {
    const surveyData = {
      ...data,
      questions,
    };
    createSurvey.mutate(surveyData);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Survey</DialogTitle>
          <DialogDescription>
            Create a survey with up to 10 questions to gather feedback from your readers
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Survey Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter survey title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the purpose of your survey"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <FormLabel>Questions</FormLabel>
                <Button
                  type="button"
                  onClick={addQuestion}
                  disabled={questions.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Question
                </Button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={questions}
                  strategy={verticalListSortingStrategy}
                >
                  {questions.map((question) => (
                    <SortableQuestion
                      key={question.id}
                      question={question}
                      onUpdate={updateQuestion}
                      onDelete={deleteQuestion}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createSurvey.isPending || questions.length === 0}
              >
                {createSurvey.isPending ? "Creating..." : "Create Survey"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}