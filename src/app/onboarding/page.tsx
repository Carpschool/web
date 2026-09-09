'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { CentralAPI, createSchoolAPI } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
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
} from 'lucide-react';

export default function OnboardingPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(true);
  const [schoolUrl, setSchoolUrl] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [ticket, setTicket] = useState('');
  const [profile, setProfile] = useState<any>(null);

  // Step 1: Role Selection (Single & Exclusive)
  const [role, setRole] = useState<'rider' | 'driver' | null>(null);

  // Step 2: Verification & Profile Details
  const [eduEmail, setEduEmail] = useState('');
  const [eduOtp, setEduOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isEduVerified, setIsEduVerified] = useState(false);

  // Driver-specific details
  const [personalEmail, setPersonalEmail] = useState('');
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [seatCapacity, setSeatCapacity] = useState(3);

  // Step 3: Primary Home Setup (Google Maps Places Search)
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
  const [homeSaved, setHomeSaved] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const skipSearchRef = useRef<boolean>(false);

  // Step 4: Submission
  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    const storedCode = localStorage.getItem('selected_school_code') || 'kjt';
    const storedUrl = localStorage.getItem('selected_school_url');

    if (!storedUrl) {
      router.push('/');
      return;
    }

    setSchoolCode(storedCode);
    setSchoolUrl(storedUrl);

    async function init() {
      try {
        let clerkToken = 'mock_student_alice';
        try {
          const t = await getToken();
          if (t) clerkToken = t;
        } catch {
          // Dev fallback
        }

        const ticketRes = await CentralAPI.getTicket(
          clerkToken,
          storedCode,
          storedCode === 'custom' ? (storedUrl || undefined) : undefined,
        );

        setTicket(ticketRes.ticket);
        localStorage.setItem('federation_ticket', ticketRes.ticket);

        const api = createSchoolAPI(storedUrl as string, ticketRes.ticket);
        const userProfile = await api.getProfile();
        setProfile(userProfile);

        // Pre-fill existing data if any
        if (userProfile.role) {
          setRole(userProfile.role);
        }
        if (userProfile.isEduVerified) {
          setIsEduVerified(true);
          setEduEmail(userProfile.eduEmail || '');
        }
        if (userProfile.personalEmail) {
          setPersonalEmail(userProfile.personalEmail);
        }
        if (userProfile.vehicle) {
          setVehicleMake(userProfile.vehicle.make || '');
          setVehicleModel(userProfile.vehicle.model || '');
          setVehicleColor(userProfile.vehicle.color || '');
          setLicensePlate(userProfile.vehicle.licensePlate || '');
          setSeatCapacity(userProfile.vehicle.totalSeatCapacity || 3);
        }

        // If user is already fully onboarded, direct them to dashboard
        if (userProfile.isOnboarded && userProfile.role) {
          router.push('/dashboard');
          return;
        }
      } catch (err) {
        console.error('Onboarding init error:', err);
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [getToken, router]);

  // Debounced Places Autocomplete
  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }

    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setPredictions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (data.predictions) {
          setPredictions(data.predictions);
          setShowDropdown(data.predictions.length > 0);
        }
      } catch (err) {
        console.error('Failed to autocomplete:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close places dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPrediction = async (prediction: { placeId: string; description: string }) => {
    setIsResolving(true);
    setShowDropdown(false);
    skipSearchRef.current = true;
    setSearchQuery(prediction.description);
    try {
      const res = await fetch(`/api/places/details?place_id=${encodeURIComponent(prediction.placeId)}`);
      const data = await res.json();
      if (data.latitude && data.longitude) {
        setLatitude(data.latitude);
        setLongitude(data.longitude);
        setSelectedAddress(data.formattedAddress || prediction.description);
      } else {
        alert(data.error || 'Failed to resolve location coordinates');
      }
    } catch (err: any) {
      alert(err.message || 'Error resolving place details');
    } finally {
      setIsResolving(false);
    }
  };

  // OTP handlers
  const handleSendOtp = async () => {
    if (!eduEmail.trim()) {
      alert('Please enter your university school email');
      return;
    }
    try {
      setIsSendingOtp(true);
      const api = createSchoolAPI(schoolUrl, ticket);
      await api.sendEduCode(eduEmail.trim());
      setIsOtpSent(true);
      alert(`A 6-digit verification code has been dispatched to ${eduEmail.trim()}`);
    } catch (err: any) {
      alert(err.message || 'Failed to send OTP code');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!eduOtp.trim()) {
      alert('Please enter the 6-digit verification code');
      return;
    }
    try {
      setIsVerifyingOtp(true);
      const api = createSchoolAPI(schoolUrl, ticket);
      await api.verifyEduCode(eduOtp.trim());
      setIsEduVerified(true);
      alert('University institutional email verified successfully!');
    } catch (err: any) {
      alert(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Save Home Handler
  const handleSaveHome = async () => {
    if (!selectedAddress || latitude === null || longitude === null) {
      alert('Please search and select your home address via Google Maps');
      return;
    }
    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      await api.createHome({
        label: homeLabel,
        address: selectedAddress,
        latitude,
        longitude,
        walkingRadiusMeters: radius,
      });
      setHomeSaved(true);
      setStep(4);
    } catch (err: any) {
      alert(err.message || 'Failed to save home location');
    }
  };

  // Final Completion Handler
  const handleFinishOnboarding = async () => {
    if (!role) {
      alert('Please select your account role');
      return;
    }
    try {
      setIsFinishing(true);
      const api = createSchoolAPI(schoolUrl, ticket);
      await api.updateProfile({
        role,
        isOnboarded: true,
        personalEmail: role === 'driver' ? personalEmail.trim() : undefined,
        vehicle:
          role === 'driver'
            ? {
                make: vehicleMake.trim(),
                model: vehicleModel.trim(),
                color: vehicleColor.trim(),
                licensePlate: licensePlate.trim(),
                totalSeatCapacity: Number(seatCapacity),
              }
            : undefined,
      });

      alert('Welcome to Carpschool! Your onboarding is complete.');
      if (role === 'driver') {
        router.push('/corridor');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to finish onboarding');
    } finally {
      setIsFinishing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Loading student onboarding...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
            <Car className="h-4 w-4" /> Carpschool Onboarding
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Set Up Your Campus Account
          </h1>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Each account is dedicated exclusively to either riding or driving. Complete this quick setup to get started.
          </p>
        </div>

        {/* Stepper Indicator */}
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          <div
            className={`p-2.5 rounded-lg border font-medium transition ${
              step === 1
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : step > 1
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            <div className="text-[10px] uppercase font-semibold">Step 1</div>
            <div>Account Role</div>
          </div>

          <div
            className={`p-2.5 rounded-lg border font-medium transition ${
              step === 2
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : step > 2
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            <div className="text-[10px] uppercase font-semibold">Step 2</div>
            <div>Verification</div>
          </div>

          <div
            className={`p-2.5 rounded-lg border font-medium transition ${
              step === 3
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : step > 3
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            <div className="text-[10px] uppercase font-semibold">Step 3</div>
            <div>Home Location</div>
          </div>

          <div
            className={`p-2.5 rounded-lg border font-medium transition ${
              step === 4
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-white text-slate-400 border-slate-200'
            }`}
          >
            <div className="text-[10px] uppercase font-semibold">Step 4</div>
            <div>Finished</div>
          </div>
        </div>

        {/* STEP 1: Exclusive Role Selection */}
        {step === 1 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">Choose Your Account Role</CardTitle>
              <CardDescription className="text-xs">
                To maintain privacy and prevent scheduling conflicts, an account can only be either a Rider or a Driver.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rider Option */}
                <div
                  onClick={() => setRole('rider')}
                  className={`p-5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between space-y-4 ${
                    role === 'rider'
                      ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                        <User className="h-5 w-5" />
                      </div>
                      {role === 'rider' && <Badge variant="default">Selected</Badge>}
                    </div>
                    <h3 className="font-bold text-base text-slate-900">Student Rider</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      I want to find rides to and from campus. I will post commute applications and walk up to 200m to meet my driver.
                    </p>
                  </div>

                  <div className="pt-2 border-t text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <Check className="h-3.5 w-3.5" /> Requires .edu Email Verification
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Check className="h-3.5 w-3.5" /> 4-Digit Passenger Boarding Safety PIN
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Check className="h-3.5 w-3.5" /> 100% Free Peer Ridesharing
                    </div>
                  </div>
                </div>

                {/* Driver Option */}
                <div
                  onClick={() => setRole('driver')}
                  className={`p-5 rounded-xl border-2 cursor-pointer transition flex flex-col justify-between space-y-4 ${
                    role === 'driver'
                      ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Car className="h-5 w-5" />
                      </div>
                      {role === 'driver' && <Badge variant="default">Selected</Badge>}
                    </div>
                    <h3 className="font-bold text-base text-slate-900">Student Driver</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      I drive to campus and want to carpool with fellow students along my commute corridor to reduce campus congestion.
                    </p>
                  </div>

                  <div className="pt-2 border-t text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <Check className="h-3.5 w-3.5" /> Requires .edu Email + Personal Contact Email
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Check className="h-3.5 w-3.5" /> Registered Vehicle & Capacity
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Check className="h-3.5 w-3.5" /> Corridor Matching & Safety Keypad
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                disabled={!role}
                onClick={() => setStep(2)}
                className="gap-2 text-xs"
              >
                Continue to Verification <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 2: Role Verification & Details */}
        {step === 2 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                {role === 'rider' ? 'Student Rider Verification' : 'Student Driver Verification'}
              </CardTitle>
              <CardDescription className="text-xs">
                {role === 'rider'
                  ? 'Verify your official university email to prove campus student status.'
                  : 'Verify your university email, personal contact email, and vehicle specifications.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Institutional School Email Verification */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-xs text-slate-900 flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-primary" /> Institutional University Email
                  </label>
                  {isEduVerified ? (
                    <Badge variant="success" className="gap-1 text-[10px]">
                      <Check className="h-3 w-3" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      Required
                    </Badge>
                  )}
                </div>

                {!isEduVerified ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="e.g. yourname@university.edu"
                        value={eduEmail}
                        onChange={(e) => setEduEmail(e.target.value)}
                        className="text-xs"
                      />
                      <Button
                        size="sm"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || !eduEmail.trim()}
                        className="text-xs whitespace-nowrap"
                      >
                        {isSendingOtp ? 'Sending...' : isOtpSent ? 'Resend Code' : 'Send Code'}
                      </Button>
                    </div>

                    {isOtpSent && (
                      <div className="flex gap-2 pt-2 border-t border-slate-200">
                        <Input
                          placeholder="6-digit verification code"
                          value={eduOtp}
                          onChange={(e) => setEduOtp(e.target.value.trim())}
                          maxLength={6}
                          className="text-xs font-mono tracking-wider"
                        />
                        <Button
                          size="sm"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp || eduOtp.length < 6}
                          className="text-xs"
                        >
                          {isVerifyingOtp ? 'Verifying...' : 'Verify Code'}
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-emerald-800 font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>{eduEmail} is verified for campus carpooling.</span>
                  </div>
                )}
              </div>

              {/* Driver-only details */}
              {role === 'driver' && (
                <div className="space-y-4">
                  {/* Personal Email */}
                  <div className="space-y-1.5">
                    <label className="font-semibold text-xs text-slate-800 flex items-center justify-between">
                      <span>Driver Personal Email (Contact)</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        Required for driver safety notices
                      </span>
                    </label>
                    <Input
                      type="email"
                      placeholder="e.g. personal.email@gmail.com"
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  {/* Vehicle Information */}
                  <div className="space-y-3 pt-3 border-t">
                    <label className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                      <Car className="h-4 w-4 text-primary" /> Vehicle Details
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] text-slate-600">Make</span>
                        <Input
                          placeholder="e.g. Toyota"
                          value={vehicleMake}
                          onChange={(e) => setVehicleMake(e.target.value)}
                          className="text-xs mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-600">Model</span>
                        <Input
                          placeholder="e.g. Prius"
                          value={vehicleModel}
                          onChange={(e) => setVehicleModel(e.target.value)}
                          className="text-xs mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-600">Color</span>
                        <Input
                          placeholder="e.g. Silver"
                          value={vehicleColor}
                          onChange={(e) => setVehicleColor(e.target.value)}
                          className="text-xs mt-1"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-600">License Plate</span>
                        <Input
                          placeholder="e.g. BC 789-XYZ"
                          value={licensePlate}
                          onChange={(e) => setLicensePlate(e.target.value)}
                          className="text-xs mt-1"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <span className="text-[11px] text-slate-600">Total Available Passenger Seats: </span>
                      <span className="font-bold text-primary font-mono text-xs">{seatCapacity} seats</span>
                      <Slider
                        min={1}
                        max={6}
                        step={1}
                        value={[seatCapacity]}
                        onValueChange={(vals) => setSeatCapacity(vals[0])}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep(1)} className="gap-1 text-xs">
                <ArrowLeft className="h-4 w-4" /> Back to Role
              </Button>
              <Button
                disabled={
                  !isEduVerified ||
                  (role === 'driver' && (!personalEmail.trim() || !licensePlate.trim()))
                }
                onClick={() => setStep(3)}
                className="gap-2 text-xs"
              >
                Continue to Home Location <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 3: Primary Home & Walking Radius Setup */}
        {step === 3 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" /> Primary Residence & Walking Radius
              </CardTitle>
              <CardDescription className="text-xs">
                Set your primary pickup/dropoff point. Our privacy architecture protects your doorstep by using a walking radius buffer (10m - 200m).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Location Label</label>
                <Input
                  value={homeLabel}
                  onChange={(e) => setHomeLabel(e.target.value)}
                  placeholder="e.g. Primary Residence, Dorm Room"
                  className="text-xs"
                />
              </div>

              {/* Google Maps Search Bar */}
              <div className="space-y-1.5 relative" ref={dropdownRef}>
                <label className="font-medium text-slate-700 flex items-center justify-between">
                  <span>Google Maps Address Search</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    Powered by Google Maps
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    {isSearching || isResolving ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </div>
                  <Input
                    type="text"
                    placeholder="Search street address, dorm, or landmark..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => {
                      if (predictions.length > 0) setShowDropdown(true);
                    }}
                    className="pl-9 pr-8 text-xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setPredictions([]);
                        setShowDropdown(false);
                      }}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {showDropdown && predictions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-slate-200 max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {predictions.map((p) => (
                      <button
                        key={p.placeId}
                        type="button"
                        onClick={() => handleSelectPrediction(p)}
                        className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5"
                      >
                        <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <div className="font-medium text-slate-800 text-xs truncate">{p.mainText}</div>
                          {p.secondaryText && (
                            <div className="text-[11px] text-slate-500 truncate">{p.secondaryText}</div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Resolved Address and Coordinates */}
              {selectedAddress && latitude !== null && longitude !== null && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md space-y-1 text-emerald-900">
                  <div className="flex items-center gap-1.5 font-medium text-xs">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>{selectedAddress}</span>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-700">
                    GPS Coordinates: [{latitude.toFixed(6)}, {longitude.toFixed(6)}]
                  </div>
                </div>
              )}

              {/* Walking Radius Slider */}
              <div className="space-y-2 pt-3 border-t">
                <div className="flex justify-between items-center">
                  <label className="font-medium text-slate-700">
                    Walking Radius (how far you are willing to walk to meet)
                  </label>
                  <span className="font-bold text-primary font-mono text-xs">
                    {radius} meters
                  </span>
                </div>
                <Slider
                  min={10}
                  max={200}
                  step={5}
                  value={[radius]}
                  onValueChange={(vals) => setRadius(vals[0])}
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>10m (doorstep)</span>
                  <span>100m (short block)</span>
                  <span>200m (maximum privacy buffer)</span>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep(2)} className="gap-1 text-xs">
                <ArrowLeft className="h-4 w-4" /> Back to Verification
              </Button>
              <Button
                disabled={!selectedAddress || latitude === null || longitude === null}
                onClick={handleSaveHome}
                className="gap-2 text-xs"
              >
                Save Home & Continue <ArrowRight className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* STEP 4: All Set / Completion */}
        {step === 4 && (
          <Card className="shadow-md">
            <CardHeader className="text-center">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <CardTitle className="text-xl">You're Ready for Carpschool!</CardTitle>
              <CardDescription className="text-xs">
                Review your profile information before entering the campus ridesharing network.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-lg border space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-slate-500 font-medium">Account Role</span>
                  <Badge variant="default" className="capitalize text-xs font-semibold">
                    {role === 'rider' ? '🎒 Student Rider' : '🚗 Student Driver'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-slate-500 font-medium">Institutional Email</span>
                  <span className="font-mono text-slate-800 font-medium flex items-center gap-1">
                    <Check className="h-3.5 w-3.5 text-emerald-600" /> {eduEmail}
                  </span>
                </div>

                {role === 'driver' && (
                  <>
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-slate-500 font-medium">Driver Personal Email</span>
                      <span className="font-mono text-slate-800">{personalEmail}</span>
                    </div>
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-slate-500 font-medium">Vehicle</span>
                      <span className="text-slate-800 font-medium">
                        {vehicleColor} {vehicleMake} {vehicleModel} ({licensePlate}) - {seatCapacity} seats
                      </span>
                    </div>
                  </>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Primary Home Location</span>
                  <div className="text-right">
                    <div className="font-medium text-slate-800">{selectedAddress}</div>
                    <div className="text-[10px] text-primary font-mono">{radius}m walking radius</div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                size="lg"
                disabled={isFinishing}
                onClick={handleFinishOnboarding}
                className="w-full text-xs font-semibold gap-2"
              >
                {isFinishing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Finalizing Setup...
                  </>
                ) : (
                  <>
                    Complete Onboarding & Start Carpooling <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
