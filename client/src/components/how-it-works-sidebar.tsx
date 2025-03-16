import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Edit2, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface HowItWorksSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content?: string;
  isEditable?: boolean;
}

export function HowItWorksSidebar({
  isOpen,
  onClose,
  title,
  content = "",
  isEditable = false,
}: HowItWorksSidebarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editableContent, setEditableContent] = useState(content);

  const handleSave = async () => {
    try {
      await fetch("/api/landing/section-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: editableContent,
        }),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save content:", error);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">{title}</SheetTitle>
          {isEditable && (
            <div className="flex justify-end -mt-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (isEditing) {
                    handleSave();
                  } else {
                    setIsEditing(true);
                  }
                }}
              >
                {isEditing ? (
                  <Save className="h-4 w-4" />
                ) : (
                  <Edit2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          {isEditing ? (
            <Textarea
              value={editableContent}
              onChange={(e) => setEditableContent(e.target.value)}
              className="min-h-[300px]"
            />
          ) : (
            <div className="prose prose-sm dark:prose-invert">
              {editableContent || "No content available yet."}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
