'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LocationModal } from '@/components/location-modal';
import { ArrowLeft, MessageSquare, MapPin, Send } from 'lucide-react';

/**
 * NegotiationChatPage
 * 
 * Scaffolding for in-chat pickup point and time negotiation:
 * 1. Live Socket.io chat feed.
 * 2. "Suggest Pickup Point" action opening the LocationModal.
 * 3. Proposal cards with Confirm, Deny, Suggest New actions.
 * 4. Lock In Carpool button with 4-digit Boarding PIN generation.
 */
export default function NegotiationChatPage({ params }: { params: { id: string } }) {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [message, setMessage] = useState('');

  // TODO: Connect to School Server Socket.io room `negotiation:${params.id}`
  // TODO: Fetch negotiation history via GET /api/v1/negotiations/:id
  // TODO: Listen for 'new_message', 'proposal_update', 'proposal_status_changed', and 'carpool_locked'
  // TODO: Implement handleSendMessage (POST /api/v1/negotiations/:id/message)
  // TODO: Implement handleSuggestPickup (POST /api/v1/negotiations/:id/propose-pickup)
  // TODO: Implement handleRespondProposal (POST /api/v1/negotiations/:id/proposals/:proposalId/respond)
  // TODO: Implement handleLockInCarpool (POST /api/v1/negotiations/:id/lock-in)

  const handleSuggestPickupSubmit = (data: any) => {
    // TODO: Send proposal payload to School Server
    console.log('Proposed pickup:', data);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col">
      <div className="max-w-2xl w-full mx-auto flex-1 flex flex-col space-y-4">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <Card className="flex-1 flex flex-col overflow-hidden shadow-sm">
          <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-semibold">Carpool Negotiation Chat</CardTitle>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="text-xs gap-1 h-8"
              onClick={() => setIsLocationModalOpen(true)}
            >
              <MapPin className="h-3.5 w-3.5 text-primary" /> Suggest Pickup Point
            </Button>
          </CardHeader>

          {/* Chat Message Stream */}
          <CardContent className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            <div className="p-2 bg-blue-50 border border-blue-200 text-blue-900 rounded-md text-[11px]">
              Negotiate a pickup point and time. Tapping "Suggest Pickup Point" opens a map constrained to the rider's walking radius (10m - 200m).
            </div>

            {/* TODO: Render message stream and interactive ProposalCards */}
          </CardContent>

          {/* Chat Input Footer */}
          <div className="p-3 border-t bg-white flex gap-2">
            <Input
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="text-xs"
            />
            <Button size="sm" className="h-10 px-3">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSubmit={handleSuggestPickupSubmit}
      />
    </div>
  );
}
