'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LocationModal } from '@/components/location-modal';
import { ProposalCard } from '@/components/proposal-card';
import { createSchoolAPI } from '@/lib/api';
import {
  ArrowLeft,
  MessageSquare,
  MapPin,
  Send,
  Lock,
  KeyRound,
  CheckCircle,
  Flag,
  ShieldCheck,
} from 'lucide-react';

interface NegotiationChatPageProps {
  params: Promise<{ id: string }>;
}

export default function NegotiationChatPage({ params }: NegotiationChatPageProps) {
  const { id: negotiationId } = React.use(params);

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [negotiation, setNegotiation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [schoolUrl, setSchoolUrl] = useState('');
  const [ticket, setTicket] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [carpool, setCarpool] = useState<any>(null);
  const [boardingPinInput, setBoardingPinInput] = useState('');
  const [boardingSuccess, setBoardingSuccess] = useState(false);
  const [rideCompleted, setRideCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = localStorage.getItem('selected_school_url') || 'http://localhost:5001';
    const storedTicket = localStorage.getItem('federation_ticket') || 'mock_user_123';
    setSchoolUrl(url);
    setTicket(storedTicket);

    const api = createSchoolAPI(url, storedTicket);

    // Fetch user profile and negotiation details
    Promise.all([api.getProfile(), api.getNegotiation(negotiationId)])
      .then(([userProfile, negData]) => {
        if (userProfile) setCurrentUserId(userProfile._id);
        if (negData) {
          setNegotiation(negData);
          setMessages(negData.messages || []);
          setProposals(negData.proposals || []);
        }
      })
      .catch((err) => console.error('Error loading negotiation:', err))
      .finally(() => setLoading(false));
  }, [negotiationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, proposals]);

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;
    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      const newMsg = await api.sendMessage(negotiationId, messageInput.trim());
      setMessages((prev) => [...prev, newMsg]);
      setMessageInput('');
    } catch (err: any) {
      alert(err.message || 'Failed to send message');
    }
  };

  const handleSuggestPickupSubmit = async (data: any) => {
    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      const newProposal = await api.proposePickupPoint(negotiationId, data);
      setProposals((prev) => [
        ...prev.map((p) => (p.status === 'PENDING' ? { ...p, status: 'SUPERSEDED' } : p)),
        newProposal,
      ]);
    } catch (err: any) {
      alert(err.message || 'Failed to submit proposal');
    }
  };

  const handleRespondProposal = async (proposalId: string, action: 'CONFIRM' | 'DENY') => {
    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      await api.respondProposal(negotiationId, proposalId, action);
      setProposals((prev) =>
        prev.map((p) =>
          p.proposalId === proposalId
            ? { ...p, status: action === 'CONFIRM' ? 'CONFIRMED' : 'DENIED' }
            : p,
        ),
      );
    } catch (err: any) {
      alert(err.message || 'Failed to respond to proposal');
    }
  };

  const handleLockInCarpool = async () => {
    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      const lockedCarpool = await api.lockInCarpool(negotiationId);
      setCarpool(lockedCarpool);
      setNegotiation((prev: any) => ({ ...prev, status: 'LOCKED' }));
      alert('Carpool successfully locked in! Seat reserved.');
    } catch (err: any) {
      alert(err.message || 'Failed to lock in carpool');
    }
  };

  const handleBoardPassenger = async () => {
    if (!boardingPinInput.trim() || !carpool) return;

    // Single discrete GPS snapshot at boarding (zero live streaming)
    let latitude = 49.2615;
    let longitude = -123.2548;

    if (navigator.geolocation) {
      try {
        const pos: any = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch {
        console.warn('Using fallback coordinates for discrete boarding GPS snapshot');
      }
    }

    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      const riderId = carpool.passengers?.[0]?.riderId || currentUserId;
      await api.boardPassenger(carpool._id, {
        riderId: typeof riderId === 'object' ? riderId._id : riderId,
        pin: boardingPinInput.trim(),
        latitude,
        longitude,
      });
      setBoardingSuccess(true);
      alert(`Passenger Boarded! Discrete GPS snapshot recorded: [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);
    } catch (err: any) {
      alert(err.message || 'Invalid Boarding Safety PIN');
    }
  };

  const handleEndRide = async () => {
    if (!carpool) return;

    // Single discrete GPS snapshot at destination (zero live streaming, zero payments)
    let latitude = 49.2606;
    let longitude = -123.246;

    if (navigator.geolocation) {
      try {
        const pos: any = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch {
        console.warn('Using fallback coordinates for discrete destination GPS snapshot');
      }
    }

    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      await api.endRide(carpool._id, { latitude, longitude });
      setRideCompleted(true);
      alert(`Ride Completed! Discrete GPS snapshot recorded: [${latitude.toFixed(4)}, ${longitude.toFixed(4)}]`);
    } catch (err: any) {
      alert(err.message || 'Failed to end ride');
    }
  };

  const confirmedProposal = proposals.find((p) => p.status === 'CONFIRMED');
  const isDriver = negotiation?.driverId?._id === currentUserId || negotiation?.driverId === currentUserId;
  const isLocked = negotiation?.status === 'LOCKED';

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col">
      <div className="max-w-3xl w-full mx-auto flex-1 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {negotiation?.direction === 'HOME_TO_SCHOOL' ? 'Home → School' : 'School → Home'}
            </Badge>
            {isLocked && (
              <Badge variant="success" className="text-xs gap-1">
                <Lock className="h-3 w-3" /> Locked In
              </Badge>
            )}
          </div>
        </div>

        {/* Boarding PIN & Safety Console (Revealed upon Carpool Locking) */}
        {isLocked && (
          <Card className="border-emerald-500/40 bg-emerald-500/5">
            <CardHeader className="py-3 px-4 pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-emerald-800">
                <ShieldCheck className="h-5 w-5 text-emerald-600" /> Physical Boarding Safety Console
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Passenger View: PIN Display */}
                <div className="p-3 bg-white border rounded-md text-center space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium">Passenger Boarding PIN</span>
                  <div className="text-2xl font-mono font-bold tracking-widest text-primary">
                    {carpool?.passengers?.[0]?.boardingSafetyPin || '4261'}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Read this 4-digit PIN aloud to your driver when boarding the vehicle.
                  </p>
                </div>

                {/* Driver View: PIN Verification & Discrete GPS Console */}
                <div className="p-3 bg-white border rounded-md space-y-2">
                  <span className="text-[11px] text-slate-500 font-medium">Driver Verification</span>
                  {!boardingSuccess ? (
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        maxLength={4}
                        placeholder="4-digit PIN"
                        value={boardingPinInput}
                        onChange={(e) => setBoardingPinInput(e.target.value)}
                        className="text-xs text-center font-mono tracking-widest h-8"
                      />
                      <Button size="sm" className="h-8 text-xs gap-1" onClick={handleBoardPassenger}>
                        <KeyRound className="h-3.5 w-3.5" /> Board
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-700 font-medium">
                      <CheckCircle className="h-4 w-4" /> Passenger Verified & Boarded!
                    </div>
                  )}

                  {boardingSuccess && !rideCompleted && (
                    <Button
                      size="sm"
                      variant="default"
                      className="w-full text-xs h-8 gap-1 bg-slate-900 hover:bg-slate-800 text-white mt-1"
                      onClick={handleEndRide}
                    >
                      <Flag className="h-3.5 w-3.5" /> End Ride (Destination Snapshot)
                    </Button>
                  )}

                  {rideCompleted && (
                    <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Ride Completed Successfully!
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Chat & Negotiation Card */}
        <Card className="flex-1 flex flex-col overflow-hidden shadow-sm">
          <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              <CardTitle className="text-sm font-semibold">Carpool Negotiation Chat</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {!isLocked && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1 h-8"
                  onClick={() => setIsLocationModalOpen(true)}
                >
                  <MapPin className="h-3.5 w-3.5 text-primary" /> Suggest Pickup Point
                </Button>
              )}
              {confirmedProposal && !isLocked && (
                <Button
                  size="sm"
                  className="text-xs gap-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleLockInCarpool}
                >
                  <Lock className="h-3.5 w-3.5" /> Lock In Carpool
                </Button>
              )}
            </div>
          </CardHeader>

          {/* Chat Message Stream & Proposals */}
          <CardContent className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            <div className="p-2 bg-blue-50 border border-blue-200 text-blue-900 rounded-md text-[11px]">
              Coordinate an agreed pickup location and time. Tap "Suggest Pickup Point" to drop a pin within the walking radius (10m–200m). Either party can confirm or counter-propose.
            </div>

            {/* Render In-Chat Proposal Cards */}
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.proposalId || proposal._id}
                proposal={proposal}
                currentUserId={currentUserId}
                onConfirm={(id) => handleRespondProposal(id, 'CONFIRM')}
                onDeny={(id) => handleRespondProposal(id, 'DENY')}
                onSuggestNew={() => setIsLocationModalOpen(true)}
              />
            ))}

            {/* Chat Messages */}
            {messages.map((msg, idx) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div
                  key={idx}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-0.5`}
                >
                  <span className="text-[10px] text-slate-400">
                    {msg.senderName || (isMe ? 'You' : 'Peer')} •{' '}
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div
                    className={`p-2.5 rounded-lg max-w-sm ${
                      isMe ? 'bg-primary text-white' : 'bg-slate-100 text-slate-900'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Chat Input Footer */}
          {!isLocked && (
            <div className="p-3 border-t bg-white flex gap-2">
              <Input
                placeholder="Type a message or discuss pickup spots..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                className="text-xs"
              />
              <Button size="sm" className="h-10 px-3" onClick={handleSendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </Card>
      </div>

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
        onSubmit={handleSuggestPickupSubmit}
        walkingRadiusMeters={negotiation?.walkingRadiusMeters || 80}
      />
    </div>
  );
}
