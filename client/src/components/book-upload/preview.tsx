import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StepComponentProps } from "./types";

export function PreviewStep({ formData }: StepComponentProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Preview</h2>
      <p className="text-sm text-muted-foreground">
        Review your book information before submitting
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        <Card className="p-3 sm:p-4">
          <h3 className="font-medium mb-2 text-sm sm:text-base">Basic Information</h3>
          <dl className="space-y-1">
            <dt className="text-sm font-medium">Title</dt>
            <dd className="text-sm text-muted-foreground">
              {formData.title}
            </dd>
            <dt className="text-sm font-medium mt-2">Description</dt>
            <dd className="text-sm text-muted-foreground">
              {formData.description}
            </dd>
            <dt className="text-sm font-medium mt-2">Internal Details</dt>
            <dd className="text-sm text-muted-foreground">
              {formData.internal_details}
            </dd>
          </dl>
        </Card>
        <Card className="p-3 sm:p-4">
          <h3 className="font-medium mb-2 text-sm sm:text-base">Details</h3>
          <dl className="space-y-1">
            {formData.series && (
              <>
                <dt className="text-sm font-medium">Series</dt>
                <dd className="text-sm text-muted-foreground">
                  {formData.series}
                </dd>
              </>
            )}
            {formData.setting && (
              <>
                <dt className="text-sm font-medium mt-2">Setting</dt>
                <dd className="text-sm text-muted-foreground">
                  {formData.setting}
                </dd>
              </>
            )}
            {formData.characters.length > 0 && (
              <>
                <dt className="text-sm font-medium mt-2">Characters</dt>
                <dd className="flex flex-wrap gap-1">
                  {formData.characters.map((char, i) => (
                    <Badge key={i} variant="secondary">
                      {char}
                    </Badge>
                  ))}
                </dd>
              </>
            )}
          </dl>
        </Card>
        {formData.hasAwards && formData.awards.length > 0 && (
          <Card className="p-3 sm:p-4">
            <h3 className="font-medium mb-2 text-sm sm:text-base">Awards</h3>
            <div className="flex flex-wrap gap-1">
              {formData.awards.map((award, i) => (
                <Badge key={i} variant="secondary">
                  {award}
                </Badge>
              ))}
            </div>
          </Card>
        )}
        <Card className="p-3 sm:p-4">
          <h3 className="font-medium mb-2 text-sm sm:text-base">Formats & Publication</h3>
          <dl className="space-y-1">
            <dt className="text-sm font-medium">Available Formats</dt>
            <dd className="flex flex-wrap gap-1">
              {formData.formats.map((format, i) => (
                <Badge key={i} variant="secondary">
                  {format.charAt(0).toUpperCase() + format.slice(1)}
                </Badge>
              ))}
            </dd>
            <dt className="text-sm font-medium mt-2">Published</dt>
            <dd className="text-sm text-muted-foreground">
              {formData.publishedDate ? new Date(formData.publishedDate).toLocaleDateString() : "Not specified"}
            </dd>
            {formData.pageCount > 0 && (
              <>
                <dt className="text-sm font-medium mt-2">Pages</dt>
                <dd className="text-sm text-muted-foreground">
                  {formData.pageCount}
                </dd>
              </>
            )}
            {formData.isbn && (
              <>
                <dt className="text-sm font-medium mt-2">ISBN</dt>
                <dd className="text-sm text-muted-foreground">
                  {formData.isbn}
                </dd>
              </>
            )}
            {formData.asin && (
              <>
                <dt className="text-sm font-medium mt-2">ASIN</dt>
                <dd className="text-sm text-muted-foreground">
                  {formData.asin}
                </dd>
              </>
            )}
          </dl>
        </Card>
        <Card className="p-3 sm:p-4">
          <h3 className="font-medium mb-2 text-sm sm:text-base">Taxonomies</h3>
          {formData.genreTaxonomies && formData.genreTaxonomies.length > 0 ? (
            <div className="space-y-3">
              {/* Display taxonomies by type */}
              {["genre", "subgenre", "theme", "trope"].map(type => {
                const taxonomiesOfType = formData.genreTaxonomies!.filter(t => t.type === type);
                if (taxonomiesOfType.length === 0) return null;
                
                return (
                  <div key={type}>
                    <h4 className="text-sm font-medium capitalize mb-1">{type}s</h4>
                    <div className="flex flex-wrap gap-1">
                      {taxonomiesOfType.map((tax, i) => (
                        <Badge 
                          key={`${tax.type}-${tax.taxonomyId}`} 
                          variant={
                            tax.type === "genre" ? "default" :
                            tax.type === "subgenre" ? "secondary" :
                            tax.type === "theme" ? "outline" :
                            "destructive"
                          }
                        >
                          {tax.name} ({(1 / (1 + Math.log(tax.rank))).toFixed(2)})
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1">
              {formData.genreTaxonomies.map((tax: any, i: number) => (
                <Badge key={i} variant="secondary">
                  {tax.name}
                </Badge>
              ))}
            </div>
          )}
        </Card>
        {formData.referralLinks.length > 0 && (
          <Card className="p-3 sm:p-4">
            <h3 className="font-medium mb-2 text-sm sm:text-base">Referral Links</h3>
            <dl className="space-y-1">
              {formData.referralLinks.map((link, i) => (
                <div key={i} className="text-sm">
                  <dt className="font-medium">
                    {link.customName || link.retailer}
                  </dt>
                  <dd className="text-muted-foreground truncate">
                    {link.url}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        )}
      </div>
    </div>
  );
}