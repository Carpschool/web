'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth, UserButton } from '@clerk/nextjs';
import { CentralAPI, createSchoolAPI } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UntrustedBanner } from '@/components/untrusted-banner';
import { Home, Compass, MessageSquare, Car, ShieldCheck, Mail, ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [schoolUrl, setSchoolUrl] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [isTrusted, setIsTrusted] = useState(true);
  const [ticket, setTicket] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [eduCodeInput, setEduCodeInput] = useState('');
  const [eduEmailInput, setEduEmailInput] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedCode = localStorage.getItem('selected_school_code');
    const storedUrl = localStorage.getItem('selected_school_url');
    const storedTrusted = localStorage.getItem('is_trusted_school') === 'true';

    if (!storedUrl) {
      router.push('/');
      return;
    }

    setSchoolCode(storedCode || 'ubc');
    setSchoolUrl(storedUrl);
    setIsTrusted(storedTrusted);

    async function init() {
      try {
        const clerkToken = (await getToken()) || 'mock_user_123';
        const ticketRes = await CentralAPI.getTicket(
          clerkToken,
          storedCode || 'ubc',
          storedCode === 'custom' ? storedUrl : undefined,
        );

        setTicket(ticketRes.ticket);
        const schoolApi = createSchoolAPI(storedUrl, ticketRes.ticket);
        const userProfile = await schoolApi.getProfile();
        setProfile(userProfile);
      } catch (err) {
        console.error('Initialization error:', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [getToken, router]);

  const handleSendEduCode = async () => {
    if (!eduEmailInput.trim()) return;
    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      await api.sendEduCode(eduEmailInput.trim());
      setCodeSent(true);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleVerifyEduCode = async () => {
    if (!eduCodeInput.trim()) return;
    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      await api.verifyEduCode(eduCodeInput.trim());
      setProfile((prev: any) => ({ ...prev, isEduVerified: true, eduEmail: eduEmailInput }));
      alert('Verification successful! You can now post and join carpools.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="border-b bg-white sticky top-0 z-30">
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

        {/* Institutional Verification Card (if not yet verified) */}
        {profile && !profile.isEduVerified && (
          <Card className="border-primary/40 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-primary">
                <Mail className="h-5 w-5" /> Institutional .edu Email Verification Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-slate-600">
                To post or book carpools on this school server, you must verify enrollment using your official university email.
              </p>
              {!codeSent ? (
                <div className="flex gap-2 max-w-md">
                  <input
                    type="email"
                    placeholder="student@cs.ubc.ca"
                    value={eduEmailInput}
                    onChange={(e) => setEduEmailInput(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-xs"
                  />
                  <Button size="sm" onClick={handleSendEduCode}>
                    Send Code
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={eduCodeInput}
                    onChange={(e) => setEduCodeInput(e.target.value)}
                    className="flex h-9 w-32 rounded-md border border-input bg-white px-3 py-1 text-xs text-center font-mono tracking-widest"
                  />
                  <Button size="sm" onClick={handleVerifyEduCode}>
                    Verify
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/homes">
            <Card className="hover:border-primary transition cursor-pointer h-full">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                  <Home className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Saved Homes & Radius</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-500">
                Configure your home/dorm addresses and customize your walking radius slider (10m - 200m).
              </CardContent>
            </Card>
          </Link>

          <Link href="/corridor">
            <Card className="hover:border-primary transition cursor-pointer h-full">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                  <Compass className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Driver Matching Corridor</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-500">
                Browse rider applications along your commute corridor (Home to School or School to Home) and reach out to riders.
              </CardContent>
            </Card>
          </Link>

          <Link href="/homes">
            <Card className="hover:border-primary transition cursor-pointer h-full">
              <CardHeader>
                <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                  <Car className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">Rider Applications</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-500">
                Post a one-time date or recurring weekly commute request. Drivers will reach out directly.
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
