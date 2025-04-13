import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Users, UserPlus, UserCog, Settings } from "lucide-react";
import { Redirect } from "wouter";
import { SalesPublisherManager } from "@/components/sales-publisher-manager";

export default function SalesPanel() {
  const { user } = useAuth();

  // Check if user is a seller
  const { data: sellerStatus, isLoading: checkingSeller } = useQuery({
    queryKey: ['/api/account/publisher-seller-status'],
    queryFn: async () => {
      const res = await fetch('/api/account/publisher-seller-status');
      if (!res.ok) {
        throw new Error('Failed to check seller status');
      }
      return res.json();
    }
  });

  if (checkingSeller) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If user is not a seller, redirect to home
  if (!sellerStatus?.isPublisherSeller) {
    return <Redirect to="/" />;
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Sales Panel</CardTitle>
          <CardDescription>Manage publishers and verify users</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="publishers">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="publishers" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Publishers</span>
              </TabsTrigger>
              <TabsTrigger value="verification" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <span>Verification Codes</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="publishers" className="py-4">
              <h3 className="text-lg font-semibold mb-4">Publisher Management</h3>
              <SalesPublisherManager />
            </TabsContent>
            
            <TabsContent value="verification" className="py-4">
              <h3 className="text-lg font-semibold mb-4">Verification Codes</h3>
              <p className="text-muted-foreground">
                Generate verification codes that can be used to verify publishers.
              </p>
              {/* Verification code generation component will go here */}
              <div className="text-center py-10 text-muted-foreground">
                Verification code management coming soon.
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="py-4">
              <h3 className="text-lg font-semibold mb-4">Sales Settings</h3>
              <div className="text-center text-muted-foreground py-10">
                Sales settings functionality coming soon.
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}