import React from "react";
import { ReferralLink } from "@shared/schema";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface SortableReferralLinkProps {
  link: ReferralLink;
  index: number;
  onChange: (value: string) => void;
  onRemove: () => void;
}

export function SortableReferralLink({ link, index, onChange, onRemove }: SortableReferralLinkProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: index });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab hover:text-primary"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="flex items-center gap-1">
        {link.faviconUrl && (
          <img 
            src={link.faviconUrl} 
            alt=""
            className="w-4 h-4 inline-block" 
          />
        )}
        <span className="text-sm">{link.customName || link.retailer}:</span>
        {link.domain && (
          <span className="text-xs text-muted-foreground">({link.domain})</span>
        )}
      </div>
      <Input
        value={link.url}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm h-8"
      />
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
      >
        ×
      </Button>
    </div>
  );
}