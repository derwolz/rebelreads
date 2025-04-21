import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepComponentProps } from "./types";
import { ReferralLink } from "@shared/schema";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface SortableReferralLinkProps {
  link: ReferralLink;
  index: number;
  onChange: (field: 'url' | 'customName', value: string) => void;
  onRemove: () => void;
}

function SortableReferralLink({
  link,
  index,
  onChange,
  onRemove,
}: SortableReferralLinkProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 flex-wrap w-full mb-2">
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab hover:text-primary"
        type="button"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex flex-col sm:flex-row gap-2 flex-1">
        <div className="flex-1">
          <Input
            value={link.customName || ""}
            onChange={(e) => onChange('customName', e.target.value)}
            className="text-sm h-8"
            placeholder="Link name (optional)"
          />
        </div>
        <div className="flex-[2]">
          <Input
            value={link.url}
            onChange={(e) => onChange('url', e.target.value)}
            className="text-sm h-8"
            placeholder="URL (https://...)"
          />
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onRemove} type="button">
        ×
      </Button>
    </div>
  );
}

export function ReferralLinksStep({ formData, setFormData }: StepComponentProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Referral Links</h2>
      <p className="text-sm text-muted-foreground">
        Add custom links where readers can purchase your book. You can optionally provide a name for each link.
      </p>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          const { active, over } = event;
          if (over && active.id !== over.id) {
            const oldIndex = Number(active.id);
            const newIndex = Number(over.id);
            setFormData((prev) => ({
              ...prev,
              referralLinks: arrayMove(
                prev.referralLinks,
                oldIndex,
                newIndex,
              ),
            }));
          }
        }}
      >
        <SortableContext
          items={formData.referralLinks.map((_, i) => i)}
          strategy={verticalListSortingStrategy}
        >
          {formData.referralLinks.map((link, index) => (
            <SortableReferralLink
              key={index}
              link={link}
              index={index}
              onChange={(field, value) => {
                const newLinks = [...formData.referralLinks];
                newLinks[index] = { ...link, [field]: value };
                setFormData((prev) => ({
                  ...prev,
                  referralLinks: newLinks,
                }));
              }}
              onRemove={() => {
                setFormData((prev) => ({
                  ...prev,
                  referralLinks: prev.referralLinks.filter(
                    (_, i) => i !== index,
                  ),
                }));
              }}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="flex gap-2 mt-2">
        <Button
          onClick={() => {
            // Import the retailer constant from schema to ensure type compatibility
            const newLink: ReferralLink = {
              retailer: "Custom", // Using "Custom" from RETAILER_OPTIONS
              url: "",
              customName: "", // Initially empty, can be filled by user
            };
            setFormData((prev) => ({
              ...prev,
              referralLinks: [...prev.referralLinks, newLink],
            }));
          }}
          type="button"
        >
          Add Link
        </Button>
        {formData.referralLinks.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setFormData((prev) => ({ ...prev, referralLinks: [] }))
            }
            type="button"
          >
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
}