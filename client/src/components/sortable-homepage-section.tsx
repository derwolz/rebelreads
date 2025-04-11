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

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative mb-4 border-2",
        isDragging ? "border-primary" : "border-input"
      )}
    >
      <div className="absolute top-3 left-3 cursor-grab touch-none" {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>
      
      <CardHeader className="pl-12">
        <div className="flex items-center justify-between">
          {isEditing ? (
            <Input
              value={section.title}
              onChange={handleTitleChange}
              className="max-w-[250px]"
              onBlur={() => setIsEditing(false)}
              autoFocus
            />
          ) : (
            <CardTitle className="flex items-center gap-2">
              {section.title}
              {section.visible ? (
                <Eye className="h-4 w-4 text-muted-foreground" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
            </CardTitle>
          )}
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsEditing(!isEditing)}
              title="Edit Section"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleVisibilityToggle}
              title={section.visible ? "Hide Section" : "Show Section"}
            >
              {section.visible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onRemove}
              title="Remove Section"
              className="text-destructive hover:text-destructive"
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Display Mode</label>
            <Select
              value={section.displayMode}
              onValueChange={handleDisplayModeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select display mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="carousel">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    <span>Carousel</span>
                  </div>
                </SelectItem>
                <SelectItem value="grid">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    <span>Grid</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-medium">Number of Items</label>
            <Input
              type="number"
              min={5}
              max={30}
              value={section.itemCount}
              onChange={handleItemCountChange}
            />
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Switch
              id={`visible-${section.id}`}
              checked={section.visible}
              onCheckedChange={handleVisibilityToggle}
            />
            <label
              htmlFor={`visible-${section.id}`}
              className="text-sm font-medium leading-none cursor-pointer"
            >
              {section.visible ? "Visible" : "Hidden"}
            </label>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {section.type.replace(/_/g, " ")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}