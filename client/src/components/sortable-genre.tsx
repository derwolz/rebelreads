import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SortableGenreProps {
  id: string | number;
  label: ReactNode;
  onRemove: () => void;
}

export function SortableGenre({ id, label, onRemove }: SortableGenreProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "flex items-center bg-background border rounded-md p-2 shadow-sm cursor-grab",
        isDragging && "opacity-50 z-10 shadow-md"
      )}
    >
      <span className="flex-1 text-sm">{label}</span>
      <button
        type="button"
        onClick={(e) => {
          // Stop propagation to prevent triggering drag
          e.stopPropagation();
          onRemove();
        }}
        className="ml-2 hover:text-destructive cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}