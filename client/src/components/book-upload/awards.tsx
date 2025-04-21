import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StepComponentProps } from "./types";

export function AwardsStep({ formData, setFormData }: StepComponentProps) {
  const [awardInput, setAwardInput] = useState("");

  const handleAddAward = () => {
    if (awardInput.trim() && !formData.awards.includes(awardInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        awards: [...prev.awards, awardInput.trim()],
      }));
      setAwardInput("");
    }
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Awards</h2>
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">
          Has this book won any awards?
        </label>
        <input
          type="checkbox"
          checked={formData.hasAwards}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              hasAwards: e.target.checked,
            }))
          }
        />
      </div>
      {formData.hasAwards && (
        <div>
          <div className="flex gap-2 mb-2">
            <Input
              value={awardInput}
              onChange={(e) => setAwardInput(e.target.value)}
              placeholder="Add an award"
              onKeyPress={(e) => e.key === "Enter" && handleAddAward()}
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddAward}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {formData.awards.map((award, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="cursor-pointer"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    awards: prev.awards.filter((_, i) => i !== index),
                  }))
                }
              >
                {award} ×
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}