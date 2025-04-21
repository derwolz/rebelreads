import React from "react";
import { Button } from "@/components/ui/button";
import { FORMAT_OPTIONS } from "@shared/schema";
import { StepComponentProps } from "./types";

export function FormatsStep({ formData, setFormData }: StepComponentProps) {
  const handleFormatToggle = (format: string) => {
    setFormData((prev) => {
      if (prev.formats.includes(format)) {
        return {
          ...prev,
          formats: prev.formats.filter((f) => f !== format),
        };
      } else {
        return {
          ...prev,
          formats: [...prev.formats, format],
        };
      }
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Available Formats</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
        {FORMAT_OPTIONS.map((format) => (
          <Button
            key={format}
            variant={
              formData.formats.includes(format) ? "default" : "outline"
            }
            className="h-16 sm:h-24 text-sm sm:text-lg py-2"
            onClick={() => handleFormatToggle(format)}
            type="button"
          >
            {format.charAt(0).toUpperCase() + format.slice(1)}
          </Button>
        ))}
      </div>
    </div>
  );
}