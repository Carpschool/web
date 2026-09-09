import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

interface UntrustedBannerProps {
  serverUrl: string;
}

/**
 * UntrustedBanner
 * 
 * Renders a prominent security warning banner when the student is connected
 * to a self-hosted, unverified custom School Server.
 */
export const UntrustedBanner: React.FC<UntrustedBannerProps> = ({ serverUrl }) => {
  return (
    <Alert variant="warning" className="mb-4">
      <ShieldAlert className="h-5 w-5 text-amber-600" />
      <AlertTitle className="text-amber-900 font-semibold">
        Untrusted School Server
      </AlertTitle>
      <AlertDescription className="text-amber-800 text-xs">
        You are connected to an unverified custom server at <span className="font-mono underline">{serverUrl}</span>.
        This server has not been vetted by Carpschool administrators. Proceed with caution.
      </AlertDescription>
    </Alert>
  );
};
