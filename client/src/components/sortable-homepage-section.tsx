import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DISPLAY_MODE_TYPES, HomepageSection } from "@shared/schema";
import { 
  GripVertical, 
  Eye, 
  EyeOff, 
  Edit, 
  Trash,
  LayoutGrid, 
  SlidersHorizontal
} from "lucide-react";

interface SortableHomepageSectionProps {
  section: HomepageSection;
  onUpdate: (updates: Partial<HomepageSection>) => void;
  onRemove: () => void;
}

export function SortableHomepageSection({
  section,
  onUpdate,
  onRemove
}: SortableHomepageSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ title: e.target.value });
  };

  const handleItemCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value);
    if (!isNaN(count) && count >= 5 && count <= 30) {
      onUpdate({ itemCount: count });
    }
  };

  const handleVisibilityToggle = () => {
    onUpdate({ visible: !section.visible });
  };

  const handleDisplayModeChange = (value: string) => {
    onUpdate({ displayMode: value as typeof DISPLAY_MODE_TYPES[number] });
  };
  
  const updateItemCount = (count: number) => {
    onUpdate({ itemCount: count });
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative mb-4 border-2",
        isDragging ? "border-primary" : "border-input"
      )}
    >
      <div className="absolute top-0 bottom-0 left-0 w-8 flex items-center justify-center cursor-grab touch-none" {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-center p-3 sm:p-4 pl-10">
        {isEditing ? (
          <Input
            value={section.title}
            onChange={handleTitleChange}
            className="max-w-full sm:max-w-[250px] mb-3 sm:mb-0 sm:mr-auto"
            onBlur={() => setIsEditing(false)}
            autoFocus
          />
        ) : (
          <div 
            className="font-medium text-base sm:text-lg mb-3 sm:mb-0 sm:mr-auto cursor-pointer hover:underline" 
            onClick={() => setIsEditing(true)}
            title="Click to edit title"
          >
            {section.title}
          </div>
        )}
        
        <div className="flex flex-wrap gap-3 sm:space-x-4 sm:gap-0">
          <div className="flex items-center gap-2">
            <Button 
              variant={section.displayMode === "carousel" ? "default" : "outline"}
              size="sm"
              className="h-8 px-2 text-xs sm:text-sm"
              onClick={() => section.displayMode !== "carousel" && handleDisplayModeChange("carousel")}
            >
              Carousel
            </Button>
            <Button 
              variant={section.displayMode === "grid" ? "default" : "outline"}
              size="sm"
              className="h-8 px-2 text-xs sm:text-sm"
              onClick={() => section.displayMode !== "grid" && handleDisplayModeChange("grid")}
            >
              Grid
            </Button>
            <Button 
              variant={section.displayMode === "book_rack" ? "default" : "outline"}
              size="sm"
              className="h-8 px-2 text-xs sm:text-sm"
              onClick={() => section.displayMode !== "book_rack" && handleDisplayModeChange("book_rack")}
            >
              Book Rack
            </Button>
          </div>
          
          {(section.displayMode === "grid" || section.displayMode === "book_rack") && (
            <div className="flex items-center gap-1 sm:gap-2">
              <Button 
                variant={section.itemCount === 10 ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0 text-xs"
                onClick={() => updateItemCount(10)}
              >
                10
              </Button>
              <Button 
                variant={section.itemCount === 20 ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0 text-xs"
                onClick={() => updateItemCount(20)}
              >
                20
              </Button>
              <Button 
                variant={section.itemCount === 30 ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0 text-xs"
                onClick={() => updateItemCount(30)}
              >
                30
              </Button>
            </div>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onRemove}
            title="Remove Section"
            className="text-destructive hover:text-destructive h-8 w-8"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}