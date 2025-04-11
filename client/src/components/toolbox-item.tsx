import { Button } from "@/components/ui/button";

interface ToolboxItemProps {
  id: string;
  title: string;
  onClick: () => void;
}

export function ToolboxItem({ id, title, onClick }: ToolboxItemProps) {
  return (
    <Button
      variant="outline"
      className="w-full justify-start py-6 mb-2 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex flex-col items-start">
        <span className="font-medium">{title}</span>
        <span className="text-xs text-muted-foreground mt-1">
          Click to add to your homepage
        </span>
      </div>
    </Button>
  );
}