import { useState, useEffect } from "react";
import { TaxonomySelector } from "@/components/taxonomy-selector";
import { GenreTaxonomy } from "@shared/schema";

export interface TaxonomyItem {
  id?: number;
  taxonomyId: number;
  rank: number;
  type: "genre" | "subgenre" | "theme" | "trope";
  name: string;
}

interface GenreSelectorProps {
  mode: "taxonomy";
  selected: TaxonomyItem[];
  onSelectionChange: (selected: TaxonomyItem[]) => void;
  onReorder?: (reordered: TaxonomyItem[]) => void;
  maxItems?: number;
  restrictLimits?: boolean;
  label?: string;
  helperText?: string;
  className?: string;
}

export function GenreSelector({
  mode,
  selected,
  onSelectionChange,
  onReorder,
  maxItems = 20,
  restrictLimits = true,
  label,
  helperText,
  className,
}: GenreSelectorProps) {
  // We're now directly passing through to the TaxonomySelector component
  return (
    <div className={className}>
      {label && <div className="text-lg font-medium mb-2">{label}</div>}
      {helperText && <p className="text-sm text-muted-foreground mb-4">{helperText}</p>}
      
      <TaxonomySelector
        selectedTaxonomies={selected}
        onTaxonomiesChange={onSelectionChange}
      />
    </div>
  );
}