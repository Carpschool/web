'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { createSchoolAPI } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Home, ArrowLeft, Plus, MapPin, Trash2, Search, Loader2, CheckCircle2, X } from 'lucide-react';

export default function HomesPage() {
  const [homes, setHomes] = useState<any[]>([]);
  const [label, setLabel] = useState('Primary Home');
  const [address, setAddress] = useState('5959 Student Union Blvd, Vancouver, BC');
  const [latitude, setLatitude] = useState<number | null>(49.2606);
  const [longitude, setLongitude] = useState<number | null>(-123.246);
  const [radius, setRadius] = useState(75); // 10m to 200m
  const [schoolUrl, setSchoolUrl] = useState('');
  const [ticket, setTicket] = useState('');

  // Search & autocomplete states
  const [searchQuery, setSearchQuery] = useState('');
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
  const skipNextSearchRef = useRef<boolean>(false);

  useEffect(() => {
    const url = localStorage.getItem('selected_school_url') || 'http://localhost:5001';
    setSchoolUrl(url);
    const storedTicket = localStorage.getItem('federation_ticket') || 'mock_student_alice';
    setTicket(storedTicket);

    const api = createSchoolAPI(url, storedTicket);
    api.listHomes().then((data) => setHomes(data || [])).catch(() => {});
  }, []);

  // Debounced places autocomplete search
  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
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
        console.error('Failed to autocomplete place:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPrediction = async (prediction: { placeId: string; description: string; mainText: string }) => {
    setIsResolving(true);
    setShowDropdown(false);
    skipNextSearchRef.current = true;
    setSearchQuery(prediction.description);
    try {
      const res = await fetch(`/api/places/details?place_id=${encodeURIComponent(prediction.placeId)}`);
      const data = await res.json();
      if (data.latitude && data.longitude) {
        setLatitude(data.latitude);
        setLongitude(data.longitude);
        setAddress(data.formattedAddress || prediction.description);
      } else {
        alert(data.error || 'Failed to resolve location coordinates');
      }
    } catch (err: any) {
      alert(err.message || 'Error resolving place details');
    } finally {
      setIsResolving(false);
    }
  };

  const handleCreateHome = async () => {
    if (!address.trim()) {
      alert('Please enter or search for an address');
      return;
    }
    if (latitude === null || longitude === null) {
      alert('Please search and select a location from Google Maps to resolve coordinates');
      return;
    }
    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      const newHome = await api.createHome({
        label,
        address,
        latitude,
        longitude,
        walkingRadiusMeters: radius,
      });
      setHomes((prev) => [...prev, newHome]);
      setSearchQuery('');
      alert('Home location saved successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to save home location');
    }
  };

  const handleDeleteHome = async (id: string) => {
    if (!confirm('Are you sure you want to remove this saved location?')) return;
    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      await api.deleteHome(id);
      setHomes((prev) => prev.filter((h) => h._id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete home');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Home className="h-6 w-6 text-primary" /> Saved Home Locations & Walking Radius
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Register your frequent pickup/dropoff points and adjust the maximum radius you are willing to walk (10m - 200m).
          </p>
        </div>

        {/* Add Home Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Add New Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Location Label</label>
              <Input
                placeholder="e.g. Primary Residence, Dorm Room, Work"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
              />
            </div>

            {/* Google Maps Places Search */}
            <div className="space-y-1.5 relative" ref={dropdownRef}>
              <label className="font-medium text-slate-700 flex items-center justify-between">
                <span>Google Maps Address Search</span>
                <span className="text-[10px] text-muted-foreground font-normal flex items-center gap-1">
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
                  placeholder="Search street, dorm, neighborhood, or landmark..."
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
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-md shadow-lg border border-slate-200 max-h-60 overflow-y-auto divide-y divide-slate-100">
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

            {/* Selected Address Display */}
            <div className="space-y-1">
              <label className="font-medium text-slate-700">Selected Address</label>
              <Input
                placeholder="Selected address will appear here"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="text-xs bg-slate-50/50"
              />
            </div>

            {/* Resolved GPS Coordinates Badge (Replaces manual lat/lng inputs) */}
            {latitude !== null && longitude !== null ? (
              <div className="flex items-center justify-between p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-md text-emerald-800 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-medium">GPS Coordinates: </span>
                    <span className="font-mono font-semibold">
                      {latitude.toFixed(6)}, {longitude.toFixed(6)}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full">
                  Google Maps Verified
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs">
                <Search className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Type an address above to resolve precise GPS coordinates.</span>
              </div>
            )}

            {/* Walking Radius Slider: 10m to 200m */}
            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between items-center">
                <label className="font-medium text-slate-700">
                  Walking Radius (how far you are willing to walk to meet a driver)
                </label>
                <span className="font-bold text-primary text-sm font-mono">
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
                <span>10 meters (doorstep)</span>
                <span>100 meters (short block)</span>
                <span>200 meters (couple blocks)</span>
              </div>
            </div>

            <Button onClick={handleCreateHome} className="w-full text-xs">
              Save Location
            </Button>
          </CardContent>
        </Card>

        {/* Existing Homes List */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Your Saved Locations
          </p>
          {homes.length === 0 ? (
            <p className="text-xs text-muted-foreground">No saved homes yet.</p>
          ) : (
            homes.map((h) => (
              <Card key={h._id}>
                <CardContent className="p-4 flex items-center justify-between text-xs">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-slate-900">{h.label}</h4>
                      <p className="text-slate-500">{h.address}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">
                        [{h.location?.coordinates?.[1]?.toFixed(4) ?? h.latitude}, {h.location?.coordinates?.[0]?.toFixed(4) ?? h.longitude}]
                      </p>
                      <p className="text-primary font-medium mt-1">
                        Walking radius: {h.walkingRadiusMeters} meters
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                    onClick={() => handleDeleteHome(h._id)}
                    title="Delete location"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
