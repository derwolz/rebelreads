import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepComponentProps } from "./types";
import { ReferralLink, RETAILER_OPTIONS } from "@shared/schema";
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

  // Helper functions to safely handle referral links
  const getSafeReferralLinks = () => {
    // Ensure referralLinks exists and is an array
    try {
      if (!formData.referralLinks || !Array.isArray(formData.referralLinks)) {
        console.warn("Invalid referralLinks detected, resetting to empty array", formData.referralLinks);
        return [];
      }

      // Check that each link has required properties
      return formData.referralLinks.map(link => {
        // Ensure each link has all required properties
        if (!link || typeof link !== 'object') {
          console.warn("Invalid link object detected, creating a new one");
          return { retailer: "Custom", url: "", customName: "" };
        }

        // Ensure URL is a string
        const url = typeof link.url === 'string' ? link.url : "";
        
        // Ensure retailer is valid enum value (or default to Custom)
        let retailer: typeof RETAILER_OPTIONS[number] = "Custom";
        if (typeof link.retailer === 'string') {
          // Check if it's a valid retailer option
          if (RETAILER_OPTIONS.includes(link.retailer as any)) {
            retailer = link.retailer as typeof RETAILER_OPTIONS[number];
          }
        }
        
        // Ensure customName is a string or undefined
        const customName = typeof link.customName === 'string' ? link.customName : "";
        
        return { 
          retailer, 
          url, 
          customName 
        };
      });
    } catch (error) {
      console.error("Error processing referralLinks:", error);
      return [];
    }
  };

  const safeSetReferralLinks = (newLinks: ReferralLink[]) => {
    try {
      // Log stringified version to check for JSON issues
      const jsonString = JSON.stringify(newLinks);
      console.log("Setting referral links, stringify successful");
      
      // Update form data with validated links
      setFormData(prev => ({
        ...prev,
        referralLinks: newLinks
      }));
    } catch (error) {
      console.error("Error stringifying referral links:", error);
      // If we can't stringify the links, they will cause JSON.parse errors later
      // Create clean links instead
      const cleanLinks = newLinks.map(link => {
        // Ensure retailer is a valid enum value
        let retailer: typeof RETAILER_OPTIONS[number] = "Custom";
        if (typeof link.retailer === 'string' && RETAILER_OPTIONS.includes(link.retailer as any)) {
          retailer = link.retailer as typeof RETAILER_OPTIONS[number];
        }
        
        return {
          retailer,
          url: typeof link.url === 'string' ? link.url : "",
          customName: typeof link.customName === 'string' ? link.customName : ""
        };
      });
      
      setFormData(prev => ({
        ...prev,
        referralLinks: cleanLinks
      }));
    }
  };

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
          try {
            const { active, over } = event;
            if (over && active.id !== over.id) {
              const oldIndex = Number(active.id);
              const newIndex = Number(over.id);
              
              // Get current links with validation
              const currentLinks = getSafeReferralLinks();
              
              // Perform the array move safely
              const reorderedLinks = arrayMove(currentLinks, oldIndex, newIndex);
              
              // Update with the reordered links
              safeSetReferralLinks(reorderedLinks);
            }
          } catch (error) {
            console.error("Error handling drag end:", error);
          }
        }}
      >
        <SortableContext
          items={getSafeReferralLinks().map((_, i) => i)}
          strategy={verticalListSortingStrategy}
        >
          {getSafeReferralLinks().map((link, index) => (
            <SortableReferralLink
              key={index}
              link={link}
              index={index}
              onChange={(field, value) => {
                try {
                  // Get current links with validation
                  const currentLinks = getSafeReferralLinks();
                  
                  // Create a new copy of the links
                  const newLinks = [...currentLinks];
                  
                  // Update the specific link
                  newLinks[index] = { 
                    ...newLinks[index], 
                    [field]: value 
                  };
                  
                  // Update form data with the new links
                  safeSetReferralLinks(newLinks);
                } catch (error) {
                  console.error("Error updating link:", error);
                }
              }}
              onRemove={() => {
                try {
                  // Get current links with validation
                  const currentLinks = getSafeReferralLinks();
                  
                  // Filter out the link to remove
                  const filteredLinks = currentLinks.filter((_, i) => i !== index);
                  
                  // Update form data with the filtered links
                  safeSetReferralLinks(filteredLinks);
                } catch (error) {
                  console.error("Error removing link:", error);
                }
              }}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="flex gap-2 mt-2">
        <Button
          onClick={() => {
            try {
              // Create a new link
              const newLink: ReferralLink = {
                retailer: "Custom",
                url: "",
                customName: "",
              };
              
              // Get current links with validation
              const currentLinks = getSafeReferralLinks();
              
              // Add the new link
              safeSetReferralLinks([...currentLinks, newLink]);
            } catch (error) {
              console.error("Error adding new link:", error);
            }
          }}
          type="button"
        >
          Add Link
        </Button>
        {getSafeReferralLinks().length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              try {
                // Reset referral links to empty array
                safeSetReferralLinks([]);
              } catch (error) {
                console.error("Error clearing links:", error);
              }
            }}
            type="button"
          >
            Clear All
          </Button>
        )}
      </div>
    </div>
  );
}