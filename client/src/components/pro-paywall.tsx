import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle, LucideIcon, LineChart, MessageSquare, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

interface PlanOption {
  id: string;
  name: string;
  price: number;
  priceUnit: string;
  features: string[];
  bonusCredits?: number;
  isPopular?: boolean;
}

interface ProPaywallProps {
  onClose?: () => void;
  showPartialData?: boolean;
  children?: React.ReactNode;
}

export function ProPaywall({ onClose, showPartialData, children }: ProPaywallProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = React.useState("monthly");
  
  const monthlyPlans: PlanOption[] = [
    {
      id: "monthly",
      name: "Pro Monthly",
      price: 10,
      priceUnit: "month",
      features: [
        "Full analytics dashboard",
        "Priority review management",
        "Advanced book performance metrics",
        "Audience insights"
      ]
    }
  ];
  
  const yearlyPlans: PlanOption[] = [
    {
      id: "yearly",
      name: "Pro Annual",
      price: 100,
      priceUnit: "year",
      features: [
        "Full analytics dashboard",
        "Priority review management",
        "Advanced book performance metrics",
        "Audience insights"
      ],
      bonusCredits: 200,
      isPopular: true
    }
  ];

  const features = [
    {
      icon: LineChart,
      title: "Comprehensive Analytics",
      description: "Get detailed insights into your book performance and reader engagement"
    },
    {
      icon: MessageSquare,
      title: "Better Review Management",
      description: "Take control of your reviews with advanced management tools"
    },
    {
      icon: TrendingUp,
      title: "Drive Traffic to Books",
      description: "Optimize your marketing with data-driven insights"
    }
  ];

  // This is a dummy function to update the user's Pro status
  const upgradeToPro = useMutation({
    mutationFn: async (planId: string) => {
      // In a real implementation, this would process payment and then update the pro status
      return await apiRequest("POST", "/api/pro/upgrade", { planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Upgrade successful!",
        description: "You now have access to all Pro features.",
      });
      if (onClose) onClose();
    },
    onError: (error) => {
      toast({
        title: "Upgrade failed",
        description: (error as Error).message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  // Temporary testing function to set user as pro
  const setUserAsPro = useMutation({
    mutationFn: async (planId: string) => {
      return await apiRequest("POST", "/api/pro/test-upgrade", { planId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Pro access granted",
        description: "This is for testing only - you now have Pro access",
      });
      if (onClose) onClose();
    },
    onError: (error) => {
      toast({
        title: "Failed to set Pro status",
        description: (error as Error).message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = (planId: string) => {
    // Use test upgrade for now
    setUserAsPro.mutate(planId);
    // This would be the actual implementation with payment processing:
    // upgradeToPro.mutate(planId);
  };

  const renderPlanCard = (plan: PlanOption) => (
    <Card key={plan.id} className={`flex flex-col h-full ${plan.isPopular ? 'border-primary shadow-lg' : ''}`}>
      <CardHeader className="flex flex-col space-y-1.5">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
          {plan.isPopular && <Badge className="bg-primary hover:bg-primary/90">Best Value</Badge>}
        </div>
        <CardDescription>Perfect for authors seeking to grow their readership</CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="mb-4">
          <span className="text-3xl font-bold">${plan.price}</span>
          <span className="text-muted-foreground">/{plan.priceUnit}</span>
          {plan.bonusCredits && (
            <div className="mt-2 text-sm text-primary font-medium">
              Includes ${plan.bonusCredits} in promotional credits
            </div>
          )}
        </div>
        <ul className="space-y-2 mb-6">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start">
              <CheckCircle className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter className="mt-auto">
        <Button 
          className="w-full" 
          onClick={() => handleUpgrade(plan.id)}
          disabled={upgradeToPro.isPending || setUserAsPro.isPending}
        >
          {upgradeToPro.isPending || setUserAsPro.isPending 
            ? "Processing..." 
            : `Get Started`}
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="relative">
      {/* The full paywall content is only shown in the dialog */}
      <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2">Unlock Your Author Potential</h2>
          <p className="text-xl text-muted-foreground">
            Take your writing career to the next level with powerful analytics and tools
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="bg-muted/30">
              <CardHeader>
                <feature.icon className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mb-8">
          <Tabs defaultValue="monthly" value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-64 grid-cols-2 mx-auto mb-8">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Annual</TabsTrigger>
            </TabsList>
            
            <TabsContent value="monthly" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-8">
                {monthlyPlans.map(renderPlanCard)}
              </div>
            </TabsContent>
            
            <TabsContent value="yearly" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-1 gap-8">
                {yearlyPlans.map(renderPlanCard)}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}