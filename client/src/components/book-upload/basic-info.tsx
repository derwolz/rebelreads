import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StepComponentProps } from "./types";

export function BasicInfoStep({ formData, setFormData }: StepComponentProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Basic Information</h2>
      <div>
        <label className="block text-sm font-medium mb-1">
          Book Title
        </label>
        <Input
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          Description
        </label>
        <Textarea
          value={formData.description}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
          required
        />
      </div>

    </div>
  );
}