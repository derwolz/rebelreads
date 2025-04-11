import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { HomepageSection, DISPLAY_MODE_TYPES } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Trash2,
  Edit,
  Save,
  X,
  LayoutGrid,
  Rows,
} from "lucide-react";

interface SortableHomepageSectionProps {
  section: HomepageSection;
  onUpdate: (updates: Partial<HomepageSection>) => void;
  onRemove: () => void;
}

export function SortableHomepageSection({
  section,
  onUpdate,
  onRemove,
}: SortableHomepageSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(section.title);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: section.id,
    disabled: isEditing,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSaveTitle = () => {
    onUpdate({ title: editTitle });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(section.title);
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group"
    >
      <Card className="border shadow-sm">
        <CardContent className="p-0">
          <Collapsible
            open={isOpen}
            onOpenChange={setIsOpen}
            className="w-full"
          >
            <div className="flex items-center p-3 gap-2">
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab p-1 hover:bg-muted rounded-sm"
              >
                <GripVertical className="h-5 w-5 text-muted-foreground" />
              </div>
              
              {isEditing ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-8"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSaveTitle}
                    className="h-8 w-8"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancelEdit}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex-1 font-medium">
                  {section.title}
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* Display mode toggle */}
                <Select
                  value={section.displayMode}
                  onValueChange={(value) => 
                    onUpdate({ 
                      displayMode: value as typeof DISPLAY_MODE_TYPES[number] 
                    })
                  }
                >
                  <SelectTrigger className="w-[120px] h-8">
                    <SelectValue placeholder="Display Mode">
                      <div className="flex items-center">
                        {section.displayMode === 'carousel' ? (
                          <Rows className="h-4 w-4 mr-2" />
                        ) : (
                          <LayoutGrid className="h-4 w-4 mr-2" />
                        )}
                        {section.displayMode === 'carousel' ? 'Carousel' : 'Grid'}
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="carousel">
                      <div className="flex items-center">
                        <Rows className="h-4 w-4 mr-2" />
                        Carousel
                      </div>
                    </SelectItem>
                    <SelectItem value="grid">
                      <div className="flex items-center">
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Grid
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Edit title button */}
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsEditing(true)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                
                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onRemove}
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              
                {/* Collapsible trigger */}
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
            
            <CollapsibleContent>
              <div className="px-4 pb-4 pt-2 space-y-4">
                {/* Item count */}
                <div className="grid gap-2">
                  <Label htmlFor="item-count">Number of items to display</Label>
                  <Select
                    value={section.itemCount.toString()}
                    onValueChange={(value) => 
                      onUpdate({ itemCount: parseInt(value) })
                    }
                  >
                    <SelectTrigger id="item-count" className="w-full">
                      <SelectValue placeholder="Select count" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 items</SelectItem>
                      <SelectItem value="20">20 items</SelectItem>
                      <SelectItem value="30">30 items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
}