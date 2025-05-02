import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Info, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RATING_CRITERIA, RATING_CRITERIA_DESCRIPTIONS } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Default weight values
const DEFAULT_WEIGHTS = {
  enjoyment: 0.35,
  writing: 0.25,
  themes: 0.20,
  characters: 0.12,
  worldbuilding: 0.08
};

// Helper component for each criteria slider
function CriteriaSlider({ 
  id, 
  value,
  onChange,
  disabled
}: { 
  id: string; 
  value: number;
  onChange: (value: number) => void;
  disabled: boolean;
}) {
  // Capitalize the first letter of the criteria name
  const displayName = id.charAt(0).toUpperCase() + id.slice(1);
  
  // Description from the schema
  const description = RATING_CRITERIA_DESCRIPTIONS[id as keyof typeof RATING_CRITERIA_DESCRIPTIONS];
  
  // Convert weight to percentage for display
  const percentage = Math.round(value * 100);
  
  return (
    <div className="py-3 px-3 mb-3 bg-card border rounded-md shadow-sm transition-all">
      <div className="flex justify-between items-center mb-2">
        <div className="font-medium">{displayName}</div>
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-primary">{percentage}%</div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-muted-foreground cursor-help">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                  </svg>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="max-w-[200px]">
                  <p className="text-sm">{description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <Slider
        value={[percentage]}
        min={0}
        max={100}
        step={1}
        disabled={disabled}
        onValueChange={(values) => {
          onChange(values[0] / 100);
        }}
        className={disabled ? "opacity-70" : ""}
      />
    </div>
  );
}

interface RatingPreferencesSettingsProps {
  isWizard?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
  initialCriteriaOrder?: string[];
}

export function RatingPreferencesSettings({
  isWizard = false,
  onComplete,
  onSkip,
  initialCriteriaOrder,
}: RatingPreferencesSettingsProps) {
  const [currentWeights, setCurrentWeights] = useState<Record<string, number>>(DEFAULT_WEIGHTS);
  const [autoAdjust, setAutoAdjust] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query to get existing preferences (if any)
  const { isLoading: isLoadingPreferences, data: preferencesData } = useQuery<{
    id: number;
    userId: number;
    enjoyment: number;
    writing: number;
    themes: number;
    characters: number;
    worldbuilding: number;
    autoAdjust: boolean;
    createdAt: string;
    updatedAt: string;
  }>({
    queryKey: ['/api/rating-preferences'],
    staleTime: 60000,
    enabled: !initialCriteriaOrder, // Only run query if initialCriteriaOrder not provided
  });

  // Load weights from preferences data
  useEffect(() => {
    if (preferencesData) {
      // Set weights from database
      const weights = {
        enjoyment: preferencesData.enjoyment,
        writing: preferencesData.writing,
        themes: preferencesData.themes,
        characters: preferencesData.characters,
        worldbuilding: preferencesData.worldbuilding
      };
      
      setCurrentWeights(weights);
      
      // Set auto-adjust from database
      setAutoAdjust(preferencesData.autoAdjust ?? false);
    }
  }, [preferencesData]);

  // Handle slider change for a specific criteria
  const handleSliderChange = (id: string, value: number) => {
    // Calculate the adjustment needed for the other sliders
    const newWeights = { ...currentWeights };
    
    // If value is 1 (100%), set all others to nearly 0
    if (value >= 0.98) {
      // Special case: If slider is set to (nearly) max, set this to 100% and others to minimum
      const minValue = 0.001; // Very small value for others
      Object.keys(newWeights).forEach(key => {
        newWeights[key] = key === id ? 1 - (minValue * (Object.keys(newWeights).length - 1)) : minValue;
      });
      setCurrentWeights(newWeights);
      return;
    }
    
    // Set the new value for this slider
    newWeights[id] = value;
    
    // Get the total of all weights
    const newTotal = Object.values(newWeights).reduce((sum, val) => sum + val, 0);
    
    // If we're over 1.0, we need to reduce other values
    if (newTotal > 1) {
      // Get other criteria
      const otherCriteria = Object.keys(newWeights).filter(key => key !== id);
      const otherTotal = otherCriteria.reduce((sum, key) => sum + newWeights[key], 0);
      
      // Calculate how much we need to reduce the other values
      const reductionFactor = (1 - value) / otherTotal;
      
      // Apply reduction to other criteria
      otherCriteria.forEach(key => {
        newWeights[key] = Math.max(0.001, newWeights[key] * reductionFactor);
      });
    }
    
    // Final normalization to ensure exact sum of 1.0
    const finalTotal = Object.values(newWeights).reduce((sum, val) => sum + val, 0);
    const normalizer = 1 / finalTotal;
    
    Object.keys(newWeights).forEach(key => {
      newWeights[key] *= normalizer;
    });
    
    setCurrentWeights(newWeights);
  };

  // Toggle auto-adjust setting
  const handleAutoAdjustToggle = (checked: boolean) => {
    setAutoAdjust(checked);
  };
  
  // Mutation to save preferences
  const { mutate: savePreferences, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      // Send weights and autoAdjust setting
      return apiRequest('POST', '/api/rating-preferences', {
        ...currentWeights,
        autoAdjust: autoAdjust
      });
    },
    onSuccess: () => {
      toast({
        title: "Preferences Saved",
        description: "Your rating criteria preferences have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rating-preferences'] });
      
      // Call onComplete callback if provided (for wizard mode)
      if (onComplete) {
        onComplete();
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save your preferences. Please try again.",
        variant: "destructive",
      });
      console.error("Error saving preferences:", error);
    },
  });
  
  const handleSave = () => {
    savePreferences();
  };
  
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  // Content with sliders for each rating criteria
  const content = (
    <>
      <div className="flex items-center justify-between mb-4 pb-2 border-b">
        <div className="flex items-center gap-2">
          <Label htmlFor="auto-adjust" className="cursor-pointer">Auto adjust weights</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-muted-foreground cursor-help">
                  <Info className="h-4 w-4" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <div className="max-w-[240px]">
                  <p className="text-sm">When enabled, weights will be automatically balanced to maintain an optimal reading experience based on the platform's algorithm.</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Switch 
          id="auto-adjust" 
          checked={autoAdjust} 
          onCheckedChange={handleAutoAdjustToggle}
        />
      </div>
      
      {/* Display sliders in fixed order to prevent reordering */}
      <CriteriaSlider
        key="enjoyment"
        id="enjoyment"
        value={currentWeights.enjoyment || DEFAULT_WEIGHTS.enjoyment}
        onChange={(value) => handleSliderChange("enjoyment", value)}
        disabled={autoAdjust}
      />
      <CriteriaSlider
        key="writing"
        id="writing"
        value={currentWeights.writing || DEFAULT_WEIGHTS.writing}
        onChange={(value) => handleSliderChange("writing", value)}
        disabled={autoAdjust}
      />
      <CriteriaSlider
        key="themes"
        id="themes"
        value={currentWeights.themes || DEFAULT_WEIGHTS.themes}
        onChange={(value) => handleSliderChange("themes", value)}
        disabled={autoAdjust}
      />
      <CriteriaSlider
        key="characters"
        id="characters"
        value={currentWeights.characters || DEFAULT_WEIGHTS.characters}
        onChange={(value) => handleSliderChange("characters", value)}
        disabled={autoAdjust}
      />
      <CriteriaSlider
        key="worldbuilding"
        id="worldbuilding"
        value={currentWeights.worldbuilding || DEFAULT_WEIGHTS.worldbuilding}
        onChange={(value) => handleSliderChange("worldbuilding", value)}
        disabled={autoAdjust}
      />
      
      <div className="mt-4 text-sm text-muted-foreground">
        <p className="flex items-center">
          <Info className="w-4 h-4 mr-2" />
          Adjust the sliders to set how much each criterion influences your overall book ratings. All percentages always total to 100%.
        </p>
      </div>
    </>
  );

  // For regular settings page view
  if (!isWizard) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rating Preferences</CardTitle>
          <CardDescription>
            Customize how you rate books by prioritizing the criteria that matter most to you.
            Use the sliders below to adjust the importance of each rating factor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {content}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save preferences"}
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  // For wizard view
  return (
    <div className="py-4">
      {content}
      <div className="flex justify-between mt-6">
        {onSkip && (
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            disabled={isSaving}
          >
            Skip for now
          </Button>
        )}
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="ml-auto gap-1"
        >
          {isSaving ? "Saving..." : "Save preferences"}
          {!isSaving && <Check className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}