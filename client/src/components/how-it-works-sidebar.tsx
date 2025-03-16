import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import DOMPurify from "dompurify";

interface HowItWorksSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content?: string;
}

export function HowItWorksSidebar({
  isOpen,
  onClose,
  title,
  content = "",
}: HowItWorksSidebarProps) {
  const sanitizedContent = content ? DOMPurify.sanitize(content) : "";

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">{title}</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100vh-8rem)] mt-6">
          <div 
            className="prose prose-sm dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: sanitizedContent || "No content available yet." }}
          />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}