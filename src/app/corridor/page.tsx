'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createSchoolAPI } from '@/lib/api';
import {
  ArrowLeft,
  Compass,
  MapPin,
  Clock,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
  User,
} from 'lucide-react';

export default function DriverCorridorPage() {
  const router = useRouter();
  const [homes, setHomes] = useState<any[]>([]);
  const [selectedHomeId, setSelectedHomeId] = useState<string>('');
  const [direction, setDirection] = useState<'HOME_TO_SCHOOL' | 'SCHOOL_TO_HOME'>('HOME_TO_SCHOOL');
  const [matchingRiders, setMatchingRiders] = useState<any[]>([]);
  const [schoolUrl, setSchoolUrl] = useState('');
  const [ticket, setTicket] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const url = localStorage.getItem('selected_school_url') || 'http://localhost:5001';
    const storedTicket = localStorage.getItem('federation_ticket') || 'mock_driver_bob';
    setSchoolUrl(url);
    setTicket(storedTicket);

    const api = createSchoolAPI(url, storedTicket);
    api.getProfile().then((p) => {
      if (p && (!p.isOnboarded || !p.role)) {
        router.push('/onboarding');
        return;
      }
      if (p && p.role === 'rider') {
        alert('Driver Commute Corridor is exclusive to registered Driver accounts.');
        router.push('/dashboard');
        return;
      }
    }).catch(() => {});

    api.listHomes().then((userHomes) => {
      setHomes(userHomes || []);
      if (userHomes?.length > 0) {
        setSelectedHomeId(userHomes[0]._id);
      }
    }).catch(() => {});
  }, [router]);

  useEffect(() => {
    if (!selectedHomeId || !schoolUrl) return;

    setLoading(true);
    const api = createSchoolAPI(schoolUrl, ticket);
    api.getMatchingRiders(direction, selectedHomeId)
      .then((riders) => setMatchingRiders(riders || []))
      .catch((err) => console.error('Corridor matching error:', err))
      .finally(() => setLoading(false));
  }, [selectedHomeId, direction, schoolUrl, ticket]);

  const handleReachOut = async (applicationId: string) => {
    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      const negotiation = await api.startNegotiation(applicationId);
      router.push(`/chat/${negotiation._id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to initiate negotiation');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Compass className="h-6 w-6 text-primary" /> Driver Commute Corridor
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Browse prospective student riders whose walking radius intersects your commute path.
            </p>
          </div>
        </div>

        {/* Filter Controls Card */}
        <Card>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Departure Home Selection */}
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700">Driver Starting Location</label>
                {homes.length === 0 ? (
                  <div className="p-2 border rounded bg-slate-100 text-muted-foreground">
                    No homes saved. <Link href="/homes" className="text-primary underline">Add a home location</Link> first.
                  </div>
                ) : (
                  <select
                    value={selectedHomeId}
                    onChange={(e) => setSelectedHomeId(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-xs"
                  >
                    {homes.map((h) => (
                      <option key={h._id} value={h._id}>
                        {h.label} ({h.address})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Direction Toggle */}
              <div className="space-y-1.5">
                <label className="font-medium text-slate-700">Commute Direction</label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={direction === 'HOME_TO_SCHOOL' ? 'default' : 'outline'}
                    className="flex-1 text-xs"
                    onClick={() => setDirection('HOME_TO_SCHOOL')}
                  >
                    Morning (Home → Campus)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={direction === 'SCHOOL_TO_HOME' ? 'default' : 'outline'}
                    className="flex-1 text-xs"
                    onClick={() => setDirection('SCHOOL_TO_HOME')}
                  >
                    Afternoon (Campus → Home)
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Corridor Matching Results */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Nearby Prospective Riders ({matchingRiders.length})
            </p>
            <span className="text-[11px] text-muted-foreground">
              Sorted by spatial proximity along corridor
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
              Searching 2dsphere route corridor for rider homes...
            </div>
          ) : matchingRiders.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-xs text-slate-500 space-y-1">
                <p className="font-medium text-slate-700">No matching riders found in this corridor</p>
                <p className="text-[11px] text-muted-foreground">
                  Try switching commute directions or selecting a different driver home location.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchingRiders.map((app) => (
                <Card key={app._id} className="hover:border-primary/50 transition flex flex-col justify-between">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold">
                            {app.riderId?.fullName || 'Student Rider'}
                          </CardTitle>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            {app.riderId?.eduEmail}
                          </p>
                        </div>
                      </div>
                      <Badge variant="success" className="text-[10px] gap-0.5">
                        <ShieldCheck className="h-3 w-3" /> .edu Verified
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-1 space-y-2 text-xs">
                    <div className="flex items-center gap-1 text-slate-600">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span>Desired Time: <strong className="text-slate-900">{app.targetTime}</strong></span>
                      <span className="text-muted-foreground ml-1">
                        ({app.scheduleType === 'RECURRING' ? app.recurringDays?.join(', ') : app.targetDate})
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>Walking Radius: <strong className="text-slate-900">{app.walkingRadiusMeters} meters</strong></span>
                    </div>

                    {app.notes && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border italic">
                        "{app.notes}"
                      </p>
                    )}
                  </CardContent>

                  <CardFooter className="p-4 pt-0">
                    <Button
                      size="sm"
                      className="w-full text-xs gap-1.5"
                      onClick={() => handleReachOut(app._id)}
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Reach Out & Coordinate Pickup
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
