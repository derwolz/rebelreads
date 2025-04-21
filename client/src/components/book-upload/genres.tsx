import React from "react";
import { GenreSelector, TaxonomyItem } from "@/components/genre-selector";
import { StepComponentProps } from "./types";

export function GenresStep({ formData, setFormData }: StepComponentProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Select Genres, Themes, and Tropes</h2>
      
      <GenreSelector
        mode="taxonomy"
        selected={formData.genreTaxonomies || []}
        onSelectionChange={(taxonomies) => 
          setFormData((prev) => ({ ...prev, genreTaxonomies: taxonomies as TaxonomyItem[] }))
        }
        restrictLimits={true}
        label="Book Taxonomies"
        helperText="Select and rank categories that describe your book. The order determines their importance in search results."
      />
    </div>
  );
}