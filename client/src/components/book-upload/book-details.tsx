import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StepComponentProps } from "./types";

export function BookDetailsStep({ formData, setFormData }: StepComponentProps) {
  const [characterInput, setCharacterInput] = useState("");

  const handleAddCharacter = () => {
    if (characterInput.trim() && !formData.characters.includes(characterInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        characters: [...prev.characters, characterInput.trim()],
      }));
      setCharacterInput("");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Book Details</h2>
      <div>
        <label className="block text-sm font-medium mb-1">
          Series (if part of one)
        </label>
        <Input
          value={formData.series}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, series: e.target.value }))
          }
          placeholder="Name of the series"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Setting</label>
        <Input
          value={formData.setting}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, setting: e.target.value }))
          }
          placeholder="Where/when does the story take place?"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Characters
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            value={characterInput}
            onChange={(e) => setCharacterInput(e.target.value)}
            placeholder="Add a character"
            onKeyPress={(e) => e.key === "Enter" && handleAddCharacter()}
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddCharacter}
          >
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.characters.map((char, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  characters: prev.characters.filter(
                    (_, i) => i !== index,
                  ),
                }))
              }
            >
              {char} ×
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}