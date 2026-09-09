import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, Check, X, RefreshCw } from 'lucide-react';

interface ProposalCardProps {
  proposal: {
    proposalId: string;
    pickupPointName: string;
    pickupCoordinates: [number, number];
    proposedTime: string;
    status: 'PENDING' | 'CONFIRMED' | 'DENIED' | 'SUPERSEDED';
    proposedBy: string;
  };
  currentUserId: string;
  onConfirm: (proposalId: string) => void;
  onDeny: (proposalId: string) => void;
  onSuggestNew: () => void;
}

/**
 * ProposalCard
 * 
 * In-chat interactive card displaying a proposed pickup location and time.
 * Provides instant actions: Confirm, Deny, and Counter-Suggest.
 */
export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  currentUserId,
  onConfirm,
  onDeny,
  onSuggestNew,
}) => {
  const isAuthor = proposal.proposedBy === currentUserId;
  const isPending = proposal.status === 'PENDING';

  return (
    <Card className="my-2 border-primary/20 bg-primary/5 max-w-sm shadow-sm">
      <CardHeader className="p-3 pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-semibold text-primary flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> Proposed Pickup Spot
          </CardTitle>
          <Badge
            variant={
              proposal.status === 'CONFIRMED'
                ? 'success'
                : proposal.status === 'DENIED'
                ? 'destructive'
                : 'outline'
            }
          >
            {proposal.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-1 text-xs space-y-1">
        <p className="font-medium text-slate-800">{proposal.pickupPointName}</p>
        <p className="text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" /> Pickup Time: {proposal.proposedTime}
        </p>
      </CardContent>
      {isPending && (
        <CardFooter className="p-2 pt-0 flex gap-1 justify-end">
          {!isAuthor && (
            <>
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs px-2 gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onConfirm(proposal.proposalId)}
              >
                <Check className="h-3 w-3" /> Confirm
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs px-2 gap-1"
                onClick={() => onDeny(proposal.proposalId)}
              >
                <X className="h-3 w-3" /> Deny
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs px-2 gap-1"
            onClick={onSuggestNew}
          >
            <RefreshCw className="h-3 w-3" /> Suggest New
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
