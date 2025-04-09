import React from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import ProPaywall from './pro-paywall';

interface ProAnalyticsWrapperProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

/**
 * A wrapper component that conditionally displays analytics content based on Pro status
 * - If user is Pro, shows the full analytics content
 * - If user is not Pro, shows a blurred version with an upgrade prompt
 */
export default function ProAnalyticsWrapper({ 
  children, 
  title, 
  description 
}: ProAnalyticsWrapperProps) {
  const { user } = useAuth();
  const isPro = user?.isPro || false;

  return (
    <Card className="relative overflow-hidden">
      {title && (
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      
      <div className={`p-4 relative ${!isPro ? 'blur-sm pointer-events-none' : ''}`}>
        {children}
      </div>
      
      {!isPro && (
        <ProPaywall />
      )}
    </Card>
  );
}