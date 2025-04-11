import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SortableGenreProps {
  id: number;
  label: string;
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
      className={cn(
        "flex items-center bg-background border rounded-md p-2 shadow-sm",
        isDragging && "opacity-50 z-10 shadow-md"
      )}
    >
      <button
        type="button"
        className="cursor-grab hover:text-primary mr-2"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 text-sm">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-2 hover:text-destructive"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}