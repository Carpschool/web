'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CentralAPI, School } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UntrustedBanner } from '@/components/untrusted-banner';
import { School as SchoolIcon, Car, ShieldCheck, ArrowRight, Globe } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [customUrl, setCustomUrl] = useState('');
  const [selectedCustom, setSelectedCustom] = useState(false);

  useEffect(() => {
    CentralAPI.getSchools()
      .then((data) => setSchools(data))
      .catch((err) => console.error('Failed to load schools:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSelectSchool = (school: School) => {
    localStorage.setItem('selected_school_code', school.schoolCode);
    localStorage.setItem('selected_school_url', school.baseUrl);
    localStorage.setItem('is_trusted_school', 'true');
    router.push('/dashboard');
  };

  const handleSelectCustom = () => {
    if (!customUrl.trim()) return;
    const cleanUrl = customUrl.trim().replace(/\/+$/, '');
    localStorage.setItem('selected_school_code', 'custom');
    localStorage.setItem('selected_school_url', cleanUrl);
    localStorage.setItem('is_trusted_school', 'false');
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Car className="h-4 w-4" /> Carpschool 2.0
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Campus Ridesharing Network
          </h1>
          <p className="text-sm text-slate-600">
            Decentralized student carpooling. Zero payments, zero live GPS tracking, physical boarding safety PINs.
          </p>
        </div>

        {/* School Picker Card */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <SchoolIcon className="h-5 w-5 text-primary" /> Select Your University
            </CardTitle>
            <CardDescription className="text-xs">
              Choose your verified institution from the central directory, or enter a self-hosted custom server.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Trusted Schools List */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Verified School Servers
              </p>
              {loading ? (
                <p className="text-xs text-muted-foreground animate-pulse">Loading directory...</p>
              ) : schools.length === 0 ? (
                <div className="p-3 border rounded-md text-xs text-slate-500 text-center bg-slate-50">
                  No verified schools listed yet. You can connect to a custom server below.
                </div>
              ) : (
                schools.map((school) => (
                  <div
                    key={school._id || school.schoolCode}
                    onClick={() => handleSelectSchool(school)}
                    className="p-3 border rounded-md flex items-center justify-between hover:bg-slate-50 cursor-pointer transition"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-slate-900">
                          {school.officialName}
                        </span>
                        <Badge variant="success" className="text-[10px] gap-0.5">
                          <ShieldCheck className="h-3 w-3" /> Verified
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {school.baseUrl}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))
              )}
            </div>

            {/* Custom / Untrusted Server Accordion */}
            <div className="pt-3 border-t space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" /> Custom / Self-Hosted School Server
                </p>
              </div>

              <div className="space-y-2">
                <Input
                  placeholder="https://rides.myschool.org"
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    setSelectedCustom(true);
                  }}
                  className="text-xs"
                />
                {selectedCustom && customUrl && (
                  <UntrustedBanner serverUrl={customUrl} />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={handleSelectCustom}
                  disabled={!customUrl.trim()}
                >
                  Connect to Custom Server
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
