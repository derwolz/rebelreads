import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Pro Paywall component that displays an upgrade button over blurred content
 * and renders a checkout dialog when clicked
 */
export default function ProPaywall() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = (plan: 'monthly' | 'annual') => {
    setIsSubmitting(true);
    
    // Call the API to upgrade
    fetch('/api/pro/upgrade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ plan }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (response.ok) {
          toast({
            title: 'Upgrade successful!',
            description: 'You now have access to Pro features.',
          });
          // Close the dialog and reload to refresh user state
          setIsDialogOpen(false);
          window.location.reload();
        } else {
          throw new Error(data.error || 'Failed to upgrade');
        }
      })
      .catch((error) => {
        toast({
          title: 'Upgrade failed',
          description: error.message || 'An error occurred while upgrading',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  // For testing purposes, let's add a quick option to set as Pro
  const handleTestUpgrade = () => {
    setIsSubmitting(true);
    
    fetch('/api/test-auth/set-pro')
      .then(async (response) => {
        if (response.ok) {
          toast({
            title: 'Test upgrade successful!',
            description: 'You now have Pro status for testing.',
          });
          window.location.reload();
        } else {
          throw new Error('Failed to set Pro status');
        }
      })
      .catch(() => {
        toast({
          title: 'Test upgrade failed',
          description: 'Make sure you are logged in first',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 z-10">
        <h3 className="text-xl font-semibold mb-3">Unlock your Author Potential</h3>
        <Button onClick={() => setIsDialogOpen(true)} size="lg" className="font-semibold">
          Upgrade to Pro
        </Button>
      </div>

      {/* Pro Upgrade Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Upgrade to Pro</DialogTitle>
            <DialogDescription>
              Get detailed analytics and insights to boost your book's performance.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            {/* Monthly Plan */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly</CardTitle>
                <CardDescription>Perfect for short-term campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$10</div>
                <div className="text-sm text-muted-foreground">per month</div>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>Full analytics dashboard</li>
                  <li>Performance tracking</li>
                  <li>Advanced audience insights</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  onClick={() => handleUpgrade('monthly')}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Select Plan
                </Button>
              </CardFooter>
            </Card>

            {/* Annual Plan */}
            <Card className="border-primary">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Annual</CardTitle>
                    <CardDescription>Save and get more credits</CardDescription>
                  </div>
                  <Badge variant="default" className="px-3 py-1">
                    Best Value
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">$100</div>
                <div className="text-sm text-muted-foreground">per year</div>
                <div className="mt-1 text-sm text-primary font-medium">+ $200 in credits</div>
                <ul className="mt-4 space-y-2 text-sm">
                  <li>Everything in monthly</li>
                  <li>Priority support</li>
                  <li>$200 in promotional credits</li>
                  <li>Campaign planning tools</li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant="default" 
                  onClick={() => handleUpgrade('annual')}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Select Plan
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Test button - only in development */}
          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-2 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestUpgrade}
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Set as Pro (Testing Only)
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}