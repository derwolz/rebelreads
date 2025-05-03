import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Info, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RATING_CRITERIA_DESCRIPTIONS } from "@shared/schema";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

// Weight criteria as array for easier iteration
const WEIGHT_CRITERIA = [
  "enjoyment",
  "writing",
  "themes",
  "characters",
  "worldbuilding"
];

interface RatingPreferencesSettingsProps {
  isWizard?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
}

export function RatingPreferencesSettings({
  isWizard = false,
  onComplete,
  onSkip,
}: RatingPreferencesSettingsProps) {
  // State for the current weights
  const [weights, setWeights] = useState<Record<string, number>>({
    enjoyment: 0.35,
    writing: 0.25,
    themes: 0.20,
    characters: 0.12,
    worldbuilding: 0.08
  });
  
  // State for auto adjust
  const [autoAdjust, setAutoAdjust] = useState<boolean>(false);
  
  // For toast notifications
  const { toast } = useToast();
  
  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Query to get existing preferences
  const { data: preferencesData } = useQuery<{
    id: number;
    userId: number;
    enjoyment: number;
    writing: number;
    themes: number;
    characters: number;
    worldbuilding: number;
    autoAdjust: boolean;
  }>({
    queryKey: ['/api/rating-preferences'],
    staleTime: 60000,
  });

  // Load weights from preferences data when it's available
  useEffect(() => {
    if (preferencesData) {
      console.log("Loading preferences from database:", preferencesData);
      setWeights({
        enjoyment: parseFloat(preferencesData.enjoyment.toString()),
        writing: parseFloat(preferencesData.writing.toString()),
        themes: parseFloat(preferencesData.themes.toString()),
        characters: parseFloat(preferencesData.characters.toString()),
        worldbuilding: parseFloat(preferencesData.worldbuilding.toString())
      });
      setAutoAdjust(preferencesData.autoAdjust);
    }
  }, [preferencesData]);

  // Handle slider change for a specific criteria
  const handleSliderChange = (id: string, newPercentage: number) => {
    console.log(`Changing ${id} to ${newPercentage}%`);
    
    // Don't do anything if auto-adjust is on
    if (autoAdjust) return;
    
    // Get current values
    const currentWeights = { ...weights };
    
    // Set the new value for this slider (as decimal, not percentage)
    const newValue = newPercentage / 100;
    
    // Get other criteria
    const otherCriteria = WEIGHT_CRITERIA.filter(key => key !== id);
    
    // Get sum of other criteria values
    const otherSum = otherCriteria.reduce((sum, key) => sum + currentWeights[key], 0);
    
    // Calculate how much we need to adjust other criteria to maintain sum of 1.0
    let remainingWeight = 1.0 - newValue;
    
    // If remainingWeight is less than or equal to 0, set minimum values for other criteria
    if (remainingWeight <= 0.01) {
      // Special case: this slider is set to (nearly) 100%
      const minWeight = 0.001;
      otherCriteria.forEach(key => {
        currentWeights[key] = minWeight;
      });
      // Adjust this slider to make total exactly 1.0
      currentWeights[id] = 1.0 - (minWeight * otherCriteria.length);
    } 
    else {
      // Normal case: proportionally adjust other sliders
      const adjustmentRatio = remainingWeight / otherSum;
      
      // Apply the adjustment ratio to other criteria
      otherCriteria.forEach(key => {
        currentWeights[key] = currentWeights[key] * adjustmentRatio;
      });
      
      // Set the new value for this slider
      currentWeights[id] = newValue;
    }
    
    // Update state with the new weights
    setWeights(currentWeights);
  };

  // Toggle auto-adjust
  const handleAutoAdjustToggle = (checked: boolean) => {
    setAutoAdjust(checked);
  };
  
  // Save preferences mutation
  const { mutate: savePreferences, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/rating-preferences', {
        ...weights,
        autoAdjust
      });
    },
    onSuccess: () => {
      toast({
        title: "Preferences Saved",
        description: "Your rating criteria preferences have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/rating-preferences'] });
      
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
  
  // Save preferences
  const handleSave = () => {
    savePreferences();
  };
  
  // Skip for wizard mode
  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
  };

  // JSX for sliders and content
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
      
      {/* Enjoyment slider */}
      <div className="py-3 px-3 mb-3 bg-card border rounded-md shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <div className="font-medium">Enjoyment</div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-primary">{Math.round(weights.enjoyment * 100)}%</div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-muted-foreground cursor-help">
                    <Info className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="max-w-[200px]">
                    <p className="text-sm">{RATING_CRITERIA_DESCRIPTIONS.enjoyment}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={Math.round(weights.enjoyment * 100)} 
          onChange={(e) => handleSliderChange("enjoyment", parseInt(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          disabled={autoAdjust}
        />
      </div>
      
      {/* Writing slider */}
      <div className="py-3 px-3 mb-3 bg-card border rounded-md shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <div className="font-medium">Writing</div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-primary">{Math.round(weights.writing * 100)}%</div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-muted-foreground cursor-help">
                    <Info className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="max-w-[200px]">
                    <p className="text-sm">{RATING_CRITERIA_DESCRIPTIONS.writing}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={Math.round(weights.writing * 100)} 
          onChange={(e) => handleSliderChange("writing", parseInt(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          disabled={autoAdjust}
        />
      </div>
      
      {/* Themes slider */}
      <div className="py-3 px-3 mb-3 bg-card border rounded-md shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <div className="font-medium">Themes</div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-primary">{Math.round(weights.themes * 100)}%</div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-muted-foreground cursor-help">
                    <Info className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="max-w-[200px]">
                    <p className="text-sm">{RATING_CRITERIA_DESCRIPTIONS.themes}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={Math.round(weights.themes * 100)} 
          onChange={(e) => handleSliderChange("themes", parseInt(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          disabled={autoAdjust}
        />
      </div>
      
      {/* Characters slider */}
      <div className="py-3 px-3 mb-3 bg-card border rounded-md shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <div className="font-medium">Characters</div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-primary">{Math.round(weights.characters * 100)}%</div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-muted-foreground cursor-help">
                    <Info className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="max-w-[200px]">
                    <p className="text-sm">{RATING_CRITERIA_DESCRIPTIONS.characters}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={Math.round(weights.characters * 100)} 
          onChange={(e) => handleSliderChange("characters", parseInt(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer" 
          disabled={autoAdjust}
        />
      </div>
      
      {/* Worldbuilding slider */}
      <div className="py-3 px-3 mb-3 bg-card border rounded-md shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <div className="font-medium">Worldbuilding</div>
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-primary">{Math.round(weights.worldbuilding * 100)}%</div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-muted-foreground cursor-help">
                    <Info className="h-4 w-4" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <div className="max-w-[200px]">
                    <p className="text-sm">{RATING_CRITERIA_DESCRIPTIONS.worldbuilding}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={Math.round(weights.worldbuilding * 100)} 
          onChange={(e) => handleSliderChange("worldbuilding", parseInt(e.target.value))}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
          disabled={autoAdjust}
        />
      </div>
      
      {/* Help text */}
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