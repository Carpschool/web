'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { CentralAPI, createSchoolAPI } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { UntrustedBanner } from '@/components/untrusted-banner';
import {
  Home,
  Compass,
  Car,
  ShieldCheck,
  Mail,
  Plus,
  Clock,
  MapPin,
  Trash2,
  Calendar,
  Layers,
  User,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [schoolUrl, setSchoolUrl] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [isTrusted, setIsTrusted] = useState(true);
  const [ticket, setTicket] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [personalEmailInput, setPersonalEmailInput] = useState('');
  const [userRole, setUserRole] = useState<'rider' | 'driver'>('rider');
  const [isSavingPersonalEmail, setIsSavingPersonalEmail] = useState(false);
  const [homes, setHomes] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [eduCodeInput, setEduCodeInput] = useState('');
  const [eduEmailInput, setEduEmailInput] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [isCreatingApp, setIsCreatingApp] = useState(false);

  // New application form state
  const [appHomeId, setAppHomeId] = useState('');
  const [appDirection, setAppDirection] = useState<'HOME_TO_SCHOOL' | 'SCHOOL_TO_HOME'>('HOME_TO_SCHOOL');
  const [appScheduleType, setAppScheduleType] = useState<'ONE_TIME' | 'RECURRING'>('RECURRING');
  const [appTargetDate, setAppTargetDate] = useState('2026-09-15');
  const [appRecurringDays, setAppRecurringDays] = useState<string[]>(['MONDAY', 'WEDNESDAY', 'FRIDAY']);
  const [appTargetTime, setAppTargetTime] = useState('08:30');
  const [appNotes, setAppNotes] = useState('');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedCode = localStorage.getItem('selected_school_code') || 'ubc';
    const storedUrl = localStorage.getItem('selected_school_url');
    const storedTrusted = localStorage.getItem('is_trusted_school') === 'true';

    if (!storedUrl) {
      router.push('/');
      return;
    }

    const currentSchoolUrl = storedUrl;
    setSchoolCode(storedCode);
    setSchoolUrl(currentSchoolUrl);
    setIsTrusted(storedTrusted);

    async function init() {
      try {
        let clerkToken = 'mock_student_alice';
        try {
          const t = await getToken();
          if (t) clerkToken = t;
        } catch {
          // Fallback to mock token in dev
        }

        const ticketRes = await CentralAPI.getTicket(
          clerkToken,
          storedCode,
          storedCode === 'custom' ? currentSchoolUrl : undefined,
        );

        setTicket(ticketRes.ticket);
        localStorage.setItem('federation_ticket', ticketRes.ticket);

        const schoolApi = createSchoolAPI(currentSchoolUrl, ticketRes.ticket);
        const [userProfile, userHomes, userApps] = await Promise.all([
          schoolApi.getProfile(),
          schoolApi.listHomes(),
          schoolApi.listMyApplications(),
        ]);

        // Redirect to onboarding if student has not completed onboarding flow
        if (userProfile && (!userProfile.isOnboarded || !userProfile.role)) {
          router.push('/onboarding');
          return;
        }

        setProfile(userProfile);
        if (userProfile?.personalEmail) setPersonalEmailInput(userProfile.personalEmail);
        const activeRole = userProfile?.role || (userProfile?.userRoles?.includes('driver') ? 'driver' : 'rider');
        setUserRole(activeRole);
        setHomes(userHomes || []);
        if (userHomes?.length > 0) setAppHomeId(userHomes[0]._id);
        setApplications(userApps || []);
      } catch (err) {
        console.error('Dashboard init error:', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [getToken, router]);

  const handleSavePersonalEmail = async () => {
    if (!personalEmailInput.trim()) return;
    try {
      setIsSavingPersonalEmail(true);
      const api = createSchoolAPI(schoolUrl, ticket);
      const updated = await api.updateProfile({
        personalEmail: personalEmailInput.trim(),
        userRoles: userRole === 'driver' ? ['driver', 'rider'] : ['rider'],
      });
      setProfile(updated);
      alert('Personal email updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update personal email');
    } finally {
      setIsSavingPersonalEmail(false);
    }
  };


  const handleSendEduCode = async () => {
    if (!eduEmailInput.trim()) return;
    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      await api.sendEduCode(eduEmailInput.trim());
      setCodeSent(true);
      alert(`A 6-digit OTP code has been sent to ${eduEmailInput.trim()}`);
    } catch (err: any) {
      alert(err.message || 'Failed to send verification code');
    }
  };

  const handleVerifyEduCode = async () => {
    if (!eduCodeInput.trim()) return;
    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      await api.verifyEduCode(eduCodeInput.trim());
      setProfile((prev: any) => ({ ...prev, isEduVerified: true, eduEmail: eduEmailInput }));
      alert('Verification successful! You can now post carpool applications and match with drivers.');
    } catch (err: any) {
      alert(err.message || 'Verification failed');
    }
  };

  const handleCreateApplication = async () => {
    if (!appHomeId) {
      alert('Please save a home location first');
      return;
    }
    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      const newApp = await api.createApplication({
        homeId: appHomeId,
        direction: appDirection,
        scheduleType: appScheduleType,
        targetDate: appScheduleType === 'ONE_TIME' ? appTargetDate : undefined,
        recurringDays: appScheduleType === 'RECURRING' ? appRecurringDays : undefined,
        targetTime: appTargetTime,
        notes: appNotes,
      });
      setApplications((prev) => [newApp, ...prev]);
      setIsCreatingApp(false);
      alert('Carpool application posted successfully! Drivers along your corridor will now be able to reach out.');
    } catch (err: any) {
      alert(err.message || 'Failed to post application');
    }
  };

  const handleCancelApplication = async (id: string) => {
    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      await api.cancelApplication(id);
      setApplications((prev) => prev.filter((a) => a._id !== id));
      alert('Application cancelled.');
    } catch (err: any) {
      alert(err.message || 'Failed to cancel application');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="border-b bg-white sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Car className="h-6 w-6 text-primary" />
            <div>
              <span className="font-bold text-slate-900 text-sm">Carpschool</span>
              <span className="text-xs text-muted-foreground ml-2 font-mono">
                {schoolCode.toUpperCase()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UserButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        {!isTrusted && <UntrustedBanner serverUrl={schoolUrl} />}

        {/* Institutional .edu Email Verification */}
        {profile && !profile.isEduVerified && (
          <Card className="border-primary/40 bg-primary/5 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Mail className="h-5 w-5" /> Institutional .edu Email Verification Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-slate-600">
                To post or book carpools on this school server, verify your student enrollment using your university email.
              </p>
              {!codeSent ? (
                <div className="flex gap-2 max-w-md">
                  <Input
                    type="email"
                    placeholder="student@ubc.ca"
                    value={eduEmailInput}
                    onChange={(e) => setEduEmailInput(e.target.value)}
                    className="text-xs bg-white"
                  />
                  <Button size="sm" onClick={handleSendEduCode}>
                    Send OTP Code
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 max-w-md">
                  <Input
                    type="text"
                    maxLength={6}
                    placeholder="6-digit OTP"
                    value={eduCodeInput}
                    onChange={(e) => setEduCodeInput(e.target.value)}
                    className="text-xs w-32 text-center font-mono tracking-widest bg-white"
                  />
                  <Button size="sm" onClick={handleVerifyEduCode}>
                    Verify OTP
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Profile & Role Configuration: Rider vs Driver Policies */}
        {profile && (
          <Card className="shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" /> Student Role & Verification Status
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your account is dedicated to a single campus role to prevent corridor scheduling conflicts.
                </p>
              </div>
              <Badge
                variant={userRole === 'driver' ? 'default' : 'secondary'}
                className="text-xs px-3 py-1 gap-1.5 font-semibold"
              >
                {userRole === 'driver' ? <Car className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
                {userRole === 'driver' ? 'Student Driver Account' : 'Student Rider Account'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {/* Verification Status Pills */}
              <div className="flex flex-wrap gap-2 items-center">
                <div className="flex items-center gap-1.5 p-2 rounded border bg-slate-50">
                  <ShieldCheck className={`h-4 w-4 ${profile.isEduVerified ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-semibold text-slate-700">Institutional School Email: </span>
                    <span className="text-slate-600">{profile.eduEmail || 'Not verified'}</span>
                  </div>
                  {profile.isEduVerified ? (
                    <Badge className="bg-emerald-600 text-[10px] ml-1">Verified</Badge>
                  ) : (
                    <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px] ml-1">Unverified</Badge>
                  )}
                </div>

                {userRole === 'driver' && (
                  <div className="flex items-center gap-1.5 p-2 rounded border bg-slate-50">
                    <Mail className={`h-4 w-4 ${profile.personalEmail ? 'text-emerald-600' : 'text-amber-500'}`} />
                    <div>
                      <span className="font-semibold text-slate-700">Driver Personal Email: </span>
                      <span className="text-slate-600">{profile.personalEmail || 'Not configured'}</span>
                    </div>
                    {profile.personalEmail ? (
                      <Badge className="bg-emerald-600 text-[10px] ml-1">Configured</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-[10px] ml-1">Required</Badge>
                    )}
                  </div>
                )}

                {userRole === 'driver' && profile.vehicle && (
                  <div className="flex items-center gap-1.5 p-2 rounded border bg-slate-50">
                    <Car className="h-4 w-4 text-primary" />
                    <div>
                      <span className="font-semibold text-slate-700">Vehicle: </span>
                      <span className="text-slate-600">
                        {profile.vehicle.color} {profile.vehicle.make} {profile.vehicle.model} ({profile.vehicle.licensePlate})
                      </span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] ml-1">
                      {profile.vehicle.totalSeatCapacity} Seats
                    </Badge>
                  </div>
                )}
              </div>

              {/* Driver Personal Email Setup Input */}
              {userRole === 'driver' && (
                <div className="pt-2 border-t space-y-2">
                  <label className="font-medium text-slate-700 block">
                    Driver Personal Contact Email (Required for driver corridor matching & notifications)
                  </label>
                  <div className="flex gap-2 max-w-md">
                    <Input
                      type="email"
                      placeholder="e.g. personal.name@gmail.com"
                      value={personalEmailInput}
                      onChange={(e) => setPersonalEmailInput(e.target.value)}
                      className="text-xs bg-white"
                    />
                    <Button
                      size="sm"
                      onClick={handleSavePersonalEmail}
                      disabled={isSavingPersonalEmail}
                    >
                      {isSavingPersonalEmail ? 'Saving...' : 'Save Personal Email'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Nav Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/homes">
            <Card className="hover:border-primary transition cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                  <Home className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Saved Homes & Walking Radius</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-500">
                Configure your home/dorm locations with a custom walking radius slider (10m to 200m).
              </CardContent>
            </Card>
          </Link>

          {userRole === 'driver' ? (
            <Link href="/corridor">
              <Card className="hover:border-primary transition cursor-pointer h-full border-primary/40 bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                    <Compass className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-base">Driver Commute Corridor</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-slate-500">
                  Search for prospective student riders along your route corridor and initiate in-chat negotiations.
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card className="h-full bg-slate-50/60 border-dashed">
              <CardHeader className="pb-2">
                <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center mb-1">
                  <Compass className="h-5 w-5" />
                </div>
                <CardTitle className="text-base text-slate-400">Driver Commute Corridor</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-400">
                Corridor driving and seat matching is exclusive to registered Driver accounts.
              </CardContent>
            </Card>
          )}
        </div>

        {/* Role-Specific Actions: Driver Console vs Rider Applications */}
        {userRole === 'driver' ? (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-blue-50/20 to-transparent shadow-sm">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-[10px]">Driver Console</Badge>
                  <h3 className="font-bold text-base text-slate-900">Commute Corridor & Seat Matching</h3>
                </div>
                <p className="text-xs text-slate-600 max-w-lg">
                  As a registered Driver, you pick up prospective student riders living along your commute corridor.
                  Open the corridor matching map to view prospective riders and start negotiations.
                </p>
              </div>
              <Link href="/corridor">
                <Button className="text-xs gap-1.5 whitespace-nowrap">
                  <Compass className="h-4 w-4" /> Open Driver Corridor
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Car className="h-5 w-5 text-primary" /> Your Commute Applications
                </h2>
                <p className="text-xs text-slate-500">
                  Post commute requests so drivers travelling along your corridor can contact you.
                </p>
              </div>
              <Button
                size="sm"
                className="text-xs gap-1"
                onClick={() => setIsCreatingApp(!isCreatingApp)}
              >
                <Plus className="h-4 w-4" /> {isCreatingApp ? 'Close' : 'New Commute Request'}
              </Button>
            </div>

          {/* New Application Wizard */}
          {isCreatingApp && (
            <Card className="border-primary/30 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Post Commute Application</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Saved Home */}
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Pickup Location</label>
                    {homes.length === 0 ? (
                      <p className="text-muted-foreground p-2 border rounded">
                        No homes saved. Please <Link href="/homes" className="text-primary underline">save a home</Link> first.
                      </p>
                    ) : (
                      <select
                        value={appHomeId}
                        onChange={(e) => setAppHomeId(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-xs"
                      >
                        {homes.map((h) => (
                          <option key={h._id} value={h._id}>
                            {h.label} ({h.address}) - {h.walkingRadiusMeters}m radius
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Direction */}
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Direction</label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={appDirection === 'HOME_TO_SCHOOL' ? 'default' : 'outline'}
                        className="flex-1 text-xs"
                        onClick={() => setAppDirection('HOME_TO_SCHOOL')}
                      >
                        Morning (Home → Campus)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={appDirection === 'SCHOOL_TO_HOME' ? 'default' : 'outline'}
                        className="flex-1 text-xs"
                        onClick={() => setAppDirection('SCHOOL_TO_HOME')}
                      >
                        Afternoon (Campus → Home)
                      </Button>
                    </div>
                  </div>

                  {/* Schedule Type */}
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Schedule Type</label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={appScheduleType === 'RECURRING' ? 'default' : 'outline'}
                        className="flex-1 text-xs"
                        onClick={() => setAppScheduleType('RECURRING')}
                      >
                        Weekly Recurring
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={appScheduleType === 'ONE_TIME' ? 'default' : 'outline'}
                        className="flex-1 text-xs"
                        onClick={() => setAppScheduleType('ONE_TIME')}
                      >
                        One-Time Trip
                      </Button>
                    </div>
                  </div>

                  {/* Target Time */}
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Desired Arrival/Departure Time</label>
                    <Input
                      type="time"
                      value={appTargetTime}
                      onChange={(e) => setAppTargetTime(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Notes / Dropoff Preferences</label>
                  <Input
                    placeholder="e.g. Near Computer Science building or Engineering block"
                    value={appNotes}
                    onChange={(e) => setAppNotes(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <Button size="sm" className="w-full text-xs" onClick={handleCreateApplication}>
                  Publish Commute Application
                </Button>
              </CardContent>
            </Card>
          )}

          {/* List of active applications */}
          <div className="space-y-3">
            {applications.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-xs text-muted-foreground">
                  No commute applications active. Post one above to get matched with drivers.
                </CardContent>
              </Card>
            ) : (
              applications.map((app) => (
                <Card key={app._id} className="shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {app.direction === 'HOME_TO_SCHOOL' ? 'Home → School' : 'School → Home'}
                        </Badge>
                        <Badge
                          variant={app.status === 'MATCHED' ? 'success' : 'secondary'}
                          className="text-[10px]"
                        >
                          {app.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 text-slate-700 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-primary" /> {app.targetTime}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-primary" /> {app.walkingRadiusMeters}m walk radius
                        </span>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Calendar className="h-3.5 w-3.5" />
                          {app.scheduleType === 'RECURRING'
                            ? app.recurringDays?.join(', ')
                            : app.targetDate}
                        </span>
                      </div>

                      {app.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">"{app.notes}"</p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400 hover:text-red-600 h-8 px-2"
                      onClick={() => handleCancelApplication(app._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
      </main>
    </div>
  );
}
