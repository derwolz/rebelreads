import React from "react";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { StepComponentProps } from "./types";

export function PublicationStep({ formData, setFormData }: StepComponentProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Publication Information</h2>
      <DatePicker
        label="Publication Date"
        placeholder="Select publication date"
        selected={formData.publishedDate ? new Date(formData.publishedDate) : null}
        onSelect={(date) =>
          setFormData((prev) => ({
            ...prev,
            publishedDate: date ? date.toISOString().split('T')[0] : "",
          }))
        }
        fromYear={1800}
        toYear={new Date().getFullYear() + 2}
      />
      <div>
        <label className="block text-sm font-medium mb-1">
          Number of Pages
        </label>
        <Input
          type="number"
          min="1"
          value={formData.pageCount || ""}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              pageCount: parseInt(e.target.value) || 0,
            }))
          }
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">ISBN</label>
        <Input
          value={formData.isbn}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, isbn: e.target.value }))
          }
          placeholder="ISBN number"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">ASIN</label>
        <Input
          value={formData.asin}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, asin: e.target.value }))
          }
          placeholder="Amazon ASIN (for Kindle editions)"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Language</label>
        <Input
          value={formData.language}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, language: e.target.value }))
          }
        />
      </div>
    </div>
  );
}