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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Available Formats</h2>
        <p className="text-sm text-muted-foreground">
          Select the formats your book is available in
        </p>
      </div>
      
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

      {formData.formats.length > 0 && (
        <div className="mt-4 p-4 border rounded bg-muted/20">
          <h3 className="text-sm font-medium mb-2">Selected formats:</h3>
          <div className="flex flex-wrap gap-2">
            {formData.formats.map(format => (
              <div 
                key={format} 
                className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
              >
                {format.charAt(0).toUpperCase() + format.slice(1)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}