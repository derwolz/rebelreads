import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";

interface ToolboxItemProps {
  id: string;
  title: string;
  onClick: () => void;
}

export function ToolboxItem({ id, title, onClick }: ToolboxItemProps) {
  return (
    <div
      className="flex items-center justify-between p-2 border rounded-md hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">{title}</span>
      </div>
      <Button
        variant="ghost" 
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-primary"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}