import {
  useRef,
  useState,
  useEffect,
  ChangeEvent,
  ClipboardEvent,
  KeyboardEvent,
} from "react";
import { Input } from "@/components/ui/input";
import { FormControl } from "@/components/ui/form";

interface BetaKeyInputProps {
  value: string | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * A specialized input component for beta keys with the format XXXXX-XXXX-XXXX-XXXX
 * - Accepts paste events and distributes the characters across inputs
 * - Auto-advances to next input when a segment is filled
 * - Converts input to uppercase
 * - Strips special characters, allowing only letters and numbers
 */
export function BetaKeyInput({
  value,
  onChange,
  placeholder = "Enter beta key",
}: BetaKeyInputProps) {
  const [parts, setParts] = useState<string[]>(["", "", "", ""]);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  // Parse incoming value into segments on mount and when value changes externally
  useEffect(() => {
    if (!value) {
      setParts(["", "", "", ""]);
      return;
    }

    // If value comes in the format "part1-part2-part3-part4"
    const segments = value.split("-");
    const newParts = [
      segments[0] || "",
      segments.length > 1 ? segments[1] : "",
      segments.length > 2 ? segments[2] : "",
      segments.length > 3 ? segments[3] : "",
    ];
    setParts(newParts);
  }, [value]);

  // Whenever parts change, combine them and call the onChange handler
  useEffect(() => {
    // Combine the parts into a single string with hyphens and uppercase everything
    const combinedValue = parts.join("-").replace(/-+$/, "").toUpperCase(); // Remove trailing hyphens
    if (combinedValue !== value) {
      onChange(combinedValue || "");
    }
  }, [parts, onChange, value]);

  // Clean input to allow only alphanumeric characters and convert to uppercase
  const cleanInput = (input: string): string => {
    return input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  };

  const handleInputChange = (
    index: number,
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const cleaned = cleanInput(e.target.value);
    const maxLength = index === 0 ? 5 : 4; // First segment can have 5 chars, others 4

    // Update the current part
    const newParts = [...parts];
    newParts[index] = cleaned.slice(0, maxLength);
    setParts(newParts);

    // Auto-advance to next input when filled
    if (cleaned.length >= maxLength && index < inputRefs.length - 1) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handlePaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    const cleaned = cleanInput(pasteData);

    // Distribute pasted characters across inputs
    const newParts = [...parts];

    // Identify segments based on hyphens if present
    if (pasteData.includes("-")) {
      const segments = pasteData.split("-");
      for (
        let i = 0;
        i < segments.length && i + index < inputRefs.length;
        i++
      ) {
        const maxLength = i + index === 0 ? 5 : 4;
        newParts[i + index] = cleanInput(segments[i]).slice(0, maxLength);
      }
    } else {
      // Distribute characters across inputs
      let charIndex = 0;
      for (let i = index; i < inputRefs.length; i++) {
        const maxLength = i === 0 ? 5 : 4;
        const remaining = cleaned.slice(charIndex, charIndex + maxLength);
        newParts[i] = remaining;
        charIndex += maxLength;

        if (charIndex >= cleaned.length) break;
      }
    }

    setParts(newParts);

    // Focus the next empty input or the last input if all are filled
    const nextEmptyIndex = newParts.findIndex((part, idx) => {
      const maxLength = idx === 0 ? 5 : 4;
      return idx >= index && part.length < maxLength;
    });

    if (nextEmptyIndex !== -1) {
      inputRefs[nextEmptyIndex].current?.focus();
    } else {
      inputRefs[inputRefs.length - 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to go to previous input when current is empty
    if (e.key === "Backspace" && parts[index] === "" && index > 0) {
      inputRefs[index - 1].current?.focus();
    }

    // Handle right arrow to advance to next input at end of text
    if (
      e.key === "ArrowRight" &&
      index < inputRefs.length - 1 &&
      e.currentTarget.selectionStart === parts[index].length
    ) {
      inputRefs[index + 1].current?.focus();
    }

    // Handle left arrow to go to previous input at beginning of text
    if (
      e.key === "ArrowLeft" &&
      index > 0 &&
      e.currentTarget.selectionStart === 0
    ) {
      inputRefs[index - 1].current?.focus();
    }
  };

  return (
    <div className="flex flex-wrap flex-row space-x-2">
      <FormControl>
        <Input
          ref={inputRefs[0]}
          value={parts[0]}
          onChange={(e) => handleInputChange(0, e)}
          onPaste={(e) => handlePaste(0, e)}
          onKeyDown={(e) => handleKeyDown(0, e)}
          placeholder="XXXXX"
          className="text-center w-[9ch] font-mono uppercase"
          maxLength={5}
        />
      </FormControl>
      <FormControl>
        <Input
          ref={inputRefs[1]}
          value={parts[1]}
          onChange={(e) => handleInputChange(1, e)}
          onPaste={(e) => handlePaste(1, e)}
          onKeyDown={(e) => handleKeyDown(1, e)}
          placeholder="XXXX"
          className="text-center w-[7ch] font-mono uppercase"
          maxLength={4}
        />
      </FormControl>
      <FormControl>
        <Input
          ref={inputRefs[2]}
          value={parts[2]}
          onChange={(e) => handleInputChange(2, e)}
          onPaste={(e) => handlePaste(2, e)}
          onKeyDown={(e) => handleKeyDown(2, e)}
          placeholder="XXXX"
          className="text-center w-[7ch] font-mono uppercase"
          maxLength={4}
        />
      </FormControl>
      <FormControl>
        <Input
          ref={inputRefs[3]}
          value={parts[3]}
          onChange={(e) => handleInputChange(3, e)}
          onPaste={(e) => handlePaste(3, e)}
          onKeyDown={(e) => handleKeyDown(3, e)}
          placeholder="XXXX"
          className="text-center w-[7ch] font-mono uppercase"
          maxLength={4}
        />
      </FormControl>
    </div>
  );
}
