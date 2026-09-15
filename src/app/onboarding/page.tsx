'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { CentralAPI, createSchoolAPI, School } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { UntrustedBanner } from '@/components/untrusted-banner';
import {
  School as SchoolIcon,
  Car,
  User,
  ShieldCheck,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Search,
  Loader2,
  X,
  Mail,
  Check,
  AlertCircle,
  Globe,
  Compass,
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  // Onboarding Wizard 4 Steps
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Step 1: Select School (Verified + Other School)
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoadingSchools, setIsLoadingSchools] = useState(true);
  const [schoolCode, setSchoolCode] = useState('');
  const [schoolUrl, setSchoolUrl] = useState('');
  const [isTrustedSchool, setIsTrustedSchool] = useState(true);
  const [showOtherSchool, setShowOtherSchool] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [isConnectingSchool, setIsConnectingSchool] = useState(false);
  const [schoolMetadata, setSchoolMetadata] = useState<any>(null);

  // Auth & Session
  const [ticket, setTicket] = useState('');
  const [profile, setProfile] = useState<any>(null);

  // Step 2: Choose Driver or Rider (Exclusive single role)
  const [role, setRole] = useState<'rider' | 'driver' | null>(null);

  // Step 3: School Email Verification via School Server
  const [eduEmail, setEduEmail] = useState('');
  const [eduOtp, setEduOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isEduVerified, setIsEduVerified] = useState(false);

  // Step 4: Complete Profile (Vehicle details + License Plate + Home Location)
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [seatCapacity, setSeatCapacity] = useState(3);
  const [personalEmail, setPersonalEmail] = useState('');

  // Primary Home Setup (Google Maps Places)
  const [homeLabel, setHomeLabel] = useState('Primary Residence');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [radius, setRadius] = useState(80);
  const [predictions, setPredictions] = useState<Array<{
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
  }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const skipSearchRef = useRef<boolean>(false);

  const [isFinishing, setIsFinishing] = useState(false);

  // Load school directory on mount
  useEffect(() => {
    CentralAPI.getSchools()
      .then((data) => setSchools(data))
      .catch((err) => console.error('Failed to load schools directory:', err))
      .finally(() => {
        setIsLoadingSchools(false);
        setLoadingInitial(false);
      });
  }, []);

  // Connect to school and issue Federation Ticket
  const handleConnectSchool = async (code: string, url: string, isTrusted: boolean) => {
    setIsConnectingSchool(true);
    try {
      let clerkToken = 'mock_student_alice';
      try {
        const t = await getToken();
        if (t) clerkToken = t;
      } catch {
        // Fallback for mock environments
      }

      const cleanUrl = url.trim().replace(/\/+$/, '');
      const ticketRes = await CentralAPI.getTicket(
        clerkToken,
        code,
        code === 'custom' ? cleanUrl : undefined,
      );

      setTicket(ticketRes.ticket);
      setSchoolUrl(cleanUrl);
      setSchoolCode(code);
      setIsTrustedSchool(isTrusted);

      localStorage.setItem('selected_school_code', code);
      localStorage.setItem('selected_school_url', cleanUrl);
      localStorage.setItem('is_trusted_school', isTrusted ? 'true' : 'false');
      localStorage.setItem('federation_ticket', ticketRes.ticket);

      const api = createSchoolAPI(cleanUrl, ticketRes.ticket);
      const [meta, userProfile] = await Promise.all([
        api.getMetadata().catch(() => null),
        api.getProfile().catch(() => null),
      ]);

      if (meta) setSchoolMetadata(meta);
      if (userProfile) {
        setProfile(userProfile);
        if (userProfile.role) setRole(userProfile.role);
        if (userProfile.isEduVerified) {
          setIsEduVerified(true);
          setEduEmail(userProfile.eduEmail || '');
        }
        if (userProfile.vehicle) {
          setVehicleMake(userProfile.vehicle.make || '');
          setVehicleModel(userProfile.vehicle.model || '');
          setVehicleColor(userProfile.vehicle.color || '');
          setLicensePlate(userProfile.vehicle.licensePlate || '');
          setSeatCapacity(userProfile.vehicle.totalSeatCapacity || 3);
        }
        if (userProfile.personalEmail) setPersonalEmail(userProfile.personalEmail);
      }

      setStep(2);
    } catch (err: any) {
      alert(`Failed to connect to school server: ${err.message}`);
    } finally {
      setIsConnectingSchool(false);
    }
  };

  // Step 3: Check if verification is required for current role
  const isVerificationRequired =
    role === 'driver'
      ? schoolMetadata?.requireEduVerificationForDrivers !== false
      : schoolMetadata?.requireEduVerificationForRiders !== false;

  const handleSendOtp = async () => {
    if (!eduEmail.trim()) {
      alert('Please enter your university school email');
      return;
    }
    setIsSendingOtp(true);
    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      const res = await api.sendEduCode(eduEmail.trim().toLowerCase());
      if (res.message) {
        setIsOtpSent(true);
        alert(res.message);
      }
    } catch (err: any) {
      alert(`Error dispatching OTP: ${err.message}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!eduOtp.trim()) {
      alert('Please enter the 6-digit verification code');
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      const res = await api.verifyEduCode(eduOtp.trim());
      if (res.isEduVerified) {
        setIsEduVerified(true);
        alert('Institutional school email verified successfully!');
      } else {
        alert(res.message || 'Verification failed. Please check your code.');
      }
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Google Maps Places Autocomplete Search
  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setPredictions(data.predictions || []);
        setShowDropdown((data.predictions || []).length > 0);
      } catch (err) {
        console.error('Failed to query places autocomplete:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectPrediction = async (placeId: string, description: string) => {
    skipSearchRef.current = true;
    setSearchQuery(description);
    setSelectedAddress(description);
    setShowDropdown(false);
    setIsResolving(true);

    try {
      const res = await fetch(`/api/places/details?place_id=${encodeURIComponent(placeId)}&placeId=${encodeURIComponent(placeId)}`);
      const details = await res.json();
      if (details.latitude && details.longitude) {
        setLatitude(details.latitude);
        setLongitude(details.longitude);
        if (details.formattedAddress) {
          setSelectedAddress(details.formattedAddress);
          setSearchQuery(details.formattedAddress);
        }
      } else {
        alert('Could not resolve precise GPS coordinates for this address.');
      }
    } catch (err: any) {
      alert(`Failed to resolve place coordinates: ${err.message}`);
    } finally {
      setIsResolving(false);
    }
  };

  // Step 4: Finalize Profile & Complete Onboarding
  const handleCompleteOnboarding = async () => {
    if (!role) {
      alert('Please select a role');
      setStep(2);
      return;
    }

    if (role === 'driver') {
      if (!licensePlate.trim()) {
        alert('Drivers must enter their vehicle license plate number.');
        return;
      }
      if (!vehicleMake.trim() || !vehicleModel.trim()) {
        alert('Please enter vehicle make and model.');
        return;
      }
      if (!personalEmail.trim()) {
        alert('Drivers must provide a personal contact email.');
        return;
      }
    }

    if (latitude === null || longitude === null || !selectedAddress.trim()) {
      alert('Please search and select your primary home location using Google Maps.');
      return;
    }

    setIsFinishing(true);
    try {
      const api = createSchoolAPI(schoolUrl, ticket);

      // 1. Save primary home location
      await api.createHome({
        label: homeLabel.trim() || 'Primary Residence',
        address: selectedAddress,
        latitude,
        longitude,
        walkingRadiusMeters: radius,
      });

      // 2. Update profile with role, vehicle, personalEmail, and isOnboarded: true
      await api.updateProfile({
        role,
        isOnboarded: true,
        personalEmail: role === 'driver' ? personalEmail.trim().toLowerCase() : undefined,
        vehicle:
          role === 'driver'
            ? {
                make: vehicleMake.trim(),
                model: vehicleModel.trim(),
                color: vehicleColor.trim() || 'Unspecified',
                licensePlate: licensePlate.trim().toUpperCase(),
                totalSeatCapacity: Number(seatCapacity),
              }
            : undefined,
      });

      alert('Onboarding complete! Welcome to Carpschool.');
      router.push('/dashboard');
    } catch (err: any) {
      alert(`Failed to finalize profile: ${err.message}`);
    } finally {
      setIsFinishing(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="text-sm font-medium text-slate-600">Initializing Carpschool Onboarding...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header & Step Indicator */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Car className="h-4 w-4" /> Carpschool 2.0 Student Onboarding
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {step === 1 && '1. Select Your School'}
            {step === 2 && '2. Choose Driver or Rider Role'}
            {step === 3 && '3. Verify School Email'}
            {step === 4 && '4. Complete Profile & Home Location'}
          </h1>
          <p className="text-xs text-slate-500">
            Step {step} of 4 &mdash; Decentralized campus ridesharing with zero payments.
          </p>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  step === i ? 'w-8 bg-primary' : step > i ? 'w-2 bg-emerald-500' : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* =================================================================== */}
        {/* STEP 1: SELECT SCHOOL                                               */}
        {/* =================================================================== */}
        {step === 1 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <SchoolIcon className="h-5 w-5 text-primary" /> Select Your University Campus
              </CardTitle>
              <CardDescription className="text-xs">
                Connect to your institution&apos;s verified school server, or use an untrusted self-hosted node.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Verified School Servers
                </p>

                {isLoadingSchools ? (
                  <div className="p-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading school directory...
                  </div>
                ) : schools.length === 0 ? (
                  <div className="p-4 border rounded-md text-xs text-slate-500 text-center bg-slate-50">
                    No verified schools found in central directory.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {schools.map((school) => (
                      <div
                        key={school._id || school.schoolCode}
                        onClick={() => handleConnectSchool(school.schoolCode, school.baseUrl, true)}
                        className={`p-3.5 border rounded-lg flex items-center justify-between transition cursor-pointer hover:border-primary hover:bg-slate-50/80 ${
                          schoolCode === school.schoolCode ? 'border-primary bg-primary/5 ring-1 ring-primary' : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900">{school.officialName}</span>
                            <Badge variant="success" className="text-[10px] gap-0.5">
                              <ShieldCheck className="h-3 w-3" /> Verified
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">{school.baseUrl}</p>
                        </div>
                        {isConnectingSchool && schoolCode === school.schoolCode ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <ArrowRight className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Other School Button */}
              <div className="pt-3 border-t">
                {!showOtherSchool ? (
                  <Button
                    variant="outline"
                    className="w-full text-xs flex items-center justify-center gap-2 border-dashed"
                    onClick={() => setShowOtherSchool(true)}
                  >
                    <Globe className="h-4 w-4" /> Other School (Connect to Custom / Untrusted Server)
                  </Button>
                ) : (
                  <div className="p-3 border rounded-lg bg-slate-50 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Globe className="h-4 w-4 text-amber-600" /> Other School Server URL
                      </p>
                      <button
                        onClick={() => setShowOtherSchool(false)}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        Cancel
                      </button>
                    </div>

                    <Input
                      placeholder="https://rides.myschool.org or http://localhost:5000"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="text-xs bg-white"
                    />

                    {customUrl.trim() && <UntrustedBanner serverUrl={customUrl} />}

                    <Button
                      size="sm"
                      className="w-full text-xs"
                      disabled={!customUrl.trim() || isConnectingSchool}
                      onClick={() => handleConnectSchool('custom', customUrl, false)}
                    >
                      {isConnectingSchool ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Connecting...
                        </>
                      ) : (
                        'Connect to Other School'
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* =================================================================== */}
        {/* STEP 2: CHOOSE DRIVER OR RIDER                                     */}
        {/* =================================================================== */}
        {step === 2 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" /> Choose Your Account Role
              </CardTitle>
              <CardDescription className="text-xs">
                Carpschool strictly isolates accounts to either a Student Rider or a Student Driver.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rider Card */}
                <div
                  onClick={() => setRole('rider')}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
                    role === 'rider'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                        <User className="h-5 w-5" />
                      </div>
                      {role === 'rider' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Student Rider</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Request rides to/from campus along common student corridors. Zero platform fees, zero tips.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                    ✓ Commute Requests &bull; In-Chat Proposals &bull; Boarding PIN
                  </div>
                </div>

                {/* Driver Card */}
                <div
                  onClick={() => setRole('driver')}
                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all flex flex-col justify-between ${
                    role === 'driver'
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                        <Car className="h-5 w-5" />
                      </div>
                      {role === 'driver' && <CheckCircle2 className="h-5 w-5 text-primary" />}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Student Driver</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Offer rides along your existing commute route. Vehicle registration and license plate required.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                    ✓ Corridor Matching &bull; License Plate &bull; Seat Booking
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-xs gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Change School
              </Button>
              <Button size="sm" disabled={!role} onClick={() => setStep(3)} className="text-xs gap-1.5">
                Continue to Verification <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* =================================================================== */}
        {/* STEP 3: VERIFY SCHOOL EMAIL VIA SCHOOL SERVER                       */}
        {/* =================================================================== */}
        {step === 3 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Institutional School Email Verification
              </CardTitle>
              <CardDescription className="text-xs">
                Verification handled directly by the autonomous school server for {schoolMetadata?.officialName || schoolCode}.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {isVerificationRequired ? (
                /* Verification Required for this role */
                <div className="space-y-4">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-blue-600" /> Mandatory Institutional Verification
                    </p>
                    <p className="text-[11px] text-blue-800">
                      {schoolMetadata?.officialName || 'Your school'} requires all {role === 'driver' ? 'Drivers' : 'Riders'} to verify an institutional address (allowed domains: {schoolMetadata?.allowedEmailDomains?.join(', ') || '.edu'}).
                    </p>
                  </div>

                  {/* Email Input & Send OTP */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700">Official University Email Address</label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="you@ubc.ca or student@kjt.lol"
                        value={eduEmail}
                        onChange={(e) => setEduEmail(e.target.value)}
                        disabled={isEduVerified || isOtpSent}
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        variant={isEduVerified ? 'secondary' : 'outline'}
                        onClick={handleSendOtp}
                        disabled={isEduVerified || isSendingOtp || !eduEmail.trim()}
                        className="text-xs whitespace-nowrap"
                      >
                        {isSendingOtp ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Sending...
                          </>
                        ) : isEduVerified ? (
                          'Verified'
                        ) : isOtpSent ? (
                          'Resend Code'
                        ) : (
                          'Send OTP Code'
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* OTP Verification Input */}
                  {isOtpSent && !isEduVerified && (
                    <div className="p-3 border rounded-lg bg-slate-50 space-y-2">
                      <label className="text-xs font-semibold text-slate-700">Enter 6-Digit Verification Code</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="123456"
                          maxLength={6}
                          value={eduOtp}
                          onChange={(e) => setEduOtp(e.target.value)}
                          className="text-xs tracking-widest text-center font-mono font-semibold"
                        />
                        <Button
                          size="sm"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp || eduOtp.trim().length !== 6}
                          className="text-xs whitespace-nowrap"
                        >
                          {isVerifyingOtp ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Verifying...
                            </>
                          ) : (
                            'Verify OTP'
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Verified Confirmation */}
                  {isEduVerified && (
                    <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <div>
                          <p className="text-xs font-semibold text-emerald-900">Email Verified</p>
                          <p className="text-[11px] text-emerald-700 font-mono">{eduEmail}</p>
                        </div>
                      </div>
                      <Badge variant="success" className="text-xs">Verified</Badge>
                    </div>
                  )}
                </div>
              ) : (
                /* Verification NOT Required by School Configuration */
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <h4 className="font-semibold text-sm">School Email Verification Not Required</h4>
                    </div>
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      {schoolMetadata?.officialName || 'Your school server'} does not mandate institutional email verification for {role === 'driver' ? 'Drivers' : 'Riders'}. You may proceed directly to profile completion.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-medium text-slate-600">
                      Optional: School Email (Optional for contact display)
                    </label>
                    <Input
                      type="email"
                      placeholder="student@school.edu (Optional)"
                      value={eduEmail}
                      onChange={(e) => setEduEmail(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-xs gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Back to Role
              </Button>
              <Button
                size="sm"
                disabled={isVerificationRequired && !isEduVerified}
                onClick={() => setStep(4)}
                className="text-xs gap-1.5"
              >
                Continue to Complete Profile <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* =================================================================== */}
        {/* STEP 4: COMPLETE PROFILE (LICENSE PLATE + HOME LOCATION)            */}
        {/* =================================================================== */}
        {step === 4 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" /> Complete Your Student Profile
              </CardTitle>
              <CardDescription className="text-xs">
                {role === 'driver'
                  ? 'Enter required vehicle license plate and set your primary home location.'
                  : 'Set your primary home location and walking radius for corridor matching.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {/* Driver Vehicle Details & Required License Plate */}
              {role === 'driver' && (
                <div className="p-4 border rounded-xl bg-slate-50 space-y-3">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Driver Vehicle Registration
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* License Plate - REQUIRED */}
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        Car License Plate Number <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        placeholder="e.g. BC 123-KJT"
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value)}
                        className="text-xs uppercase font-mono font-bold tracking-wider"
                      />
                      <p className="text-[10px] text-slate-500">
                        Displayed to confirmed passengers for physical boarding verification.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Vehicle Make *</label>
                      <Input
                        placeholder="e.g. Tesla, Honda, Toyota"
                        value={vehicleMake}
                        onChange={(e) => setVehicleMake(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Vehicle Model *</label>
                      <Input
                        placeholder="e.g. Model 3, Civic, Corolla"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Vehicle Color</label>
                      <Input
                        placeholder="e.g. White, Black, Silver"
                        value={vehicleColor}
                        onChange={(e) => setVehicleColor(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-slate-700">Passenger Seat Capacity</label>
                      <Input
                        type="number"
                        min={1}
                        max={6}
                        value={seatCapacity}
                        onChange={(e) => setSeatCapacity(parseInt(e.target.value) || 3)}
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                        Driver Personal Contact Email <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="email"
                        placeholder="e.g. yourname@gmail.com"
                        value={personalEmail}
                        onChange={(e) => setPersonalEmail(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Primary Residence & Google Maps Search */}
              <div className="p-4 border rounded-xl bg-white space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Primary Home Location & Walking Radius
                  </h3>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Location Label</label>
                  <Input
                    placeholder="Primary Residence, Off-Campus Dorm, etc."
                    value={homeLabel}
                    onChange={(e) => setHomeLabel(e.target.value)}
                    className="text-xs"
                  />
                </div>

                {/* Google Maps Search Bar */}
                <div className="relative space-y-1" ref={dropdownRef}>
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Street Address (Google Maps Search) *</span>
                    {isResolving && (
                      <span className="text-[11px] text-primary flex items-center gap-1 font-normal">
                        <Loader2 className="h-3 w-3 animate-spin" /> Resolving GPS coordinates...
                      </span>
                    )}
                  </label>

                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Type address, neighborhood, or landmark..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-8 text-xs"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedAddress('');
                          setLatitude(null);
                          setLongitude(null);
                        }}
                        className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-slate-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Predictions Dropdown */}
                  {showDropdown && predictions.length > 0 && (
                    <div className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-56 overflow-y-auto divide-y">
                      {predictions.map((p) => (
                        <div
                          key={p.placeId}
                          onClick={() => handleSelectPrediction(p.placeId, p.description)}
                          className="p-2.5 hover:bg-slate-50 cursor-pointer text-xs flex items-start gap-2"
                        >
                          <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-900">{p.mainText}</p>
                            <p className="text-[11px] text-muted-foreground">{p.secondaryText}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Resolved Coordinates Confirmation */}
                {latitude !== null && longitude !== null && (
                  <div className="p-2.5 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <div>
                        <span className="font-semibold text-emerald-950">GPS Coordinates Verified</span>
                        <p className="text-[10px] text-emerald-700 font-mono">
                          [{latitude.toFixed(6)}, {longitude.toFixed(6)}]
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-white text-emerald-700 border-emerald-300">
                      Google Maps Verified
                    </Badge>
                  </div>
                )}

                {/* Walking Radius Slider */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-medium text-slate-700 flex items-center gap-1.5">
                      <Compass className="h-3.5 w-3.5 text-slate-500" /> Acceptable Walking Radius
                    </label>
                    <span className="font-bold text-primary font-mono">{radius} meters</span>
                  </div>
                  <Slider
                    min={10}
                    max={200}
                    step={5}
                    value={[radius]}
                    onValueChange={(val) => setRadius(val[0])}
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>10m (Doorstep pickup)</span>
                    <span>100m</span>
                    <span>200m (Short 2-min walk)</span>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t pt-4">
              <Button variant="ghost" size="sm" onClick={() => setStep(3)} className="text-xs gap-1.5">
                <ArrowLeft className="h-4 w-4" /> Back to Verification
              </Button>
              <Button
                size="sm"
                onClick={handleCompleteOnboarding}
                disabled={isFinishing || latitude === null || (role === 'driver' && !licensePlate.trim())}
                className="text-xs gap-1.5 bg-primary hover:bg-primary/90"
              >
                {isFinishing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> Completing Onboarding...
                  </>
                ) : (
                  <>
                    Complete & Enter Dashboard <Check className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </main>
  );
}
