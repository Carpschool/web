'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createSchoolAPI } from '@/lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Home, ArrowLeft, Plus, MapPin, Trash2 } from 'lucide-react';

export default function HomesPage() {
  const [homes, setHomes] = useState<any[]>([]);
  const [label, setLabel] = useState('Primary Home');
  const [address, setAddress] = useState('1234 Student Blvd, Vancouver, BC');
  const [latitude, setLatitude] = useState(49.2606);
  const [longitude, setLongitude] = useState(-123.246);
  const [radius, setRadius] = useState(75); // 10m to 200m
  const [schoolUrl, setSchoolUrl] = useState('');
  const [ticket, setTicket] = useState('');

  useEffect(() => {
    const url = localStorage.getItem('selected_school_url') || 'http://localhost:5001';
    setSchoolUrl(url);
    const storedTicket = localStorage.getItem('federation_ticket') || 'mock_student_alice';
    setTicket(storedTicket);

    const api = createSchoolAPI(url, storedTicket);
    api.listHomes().then((data) => setHomes(data || [])).catch(() => {});
  }, []);

  const handleCreateHome = async () => {
    if (!address.trim()) return;
    try {
      const api = createSchoolAPI(schoolUrl, ticket);
      const newHome = await api.createHome({
        label,
        address,
        latitude: Number(latitude) || 49.2606,
        longitude: Number(longitude) || -123.246,
        walkingRadiusMeters: radius,
      });
      setHomes((prev) => [...prev, newHome]);
      setAddress('');
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

            <div className="space-y-1">
              <label className="font-medium text-slate-700">Street Address</label>
              <Input
                placeholder="e.g. 5959 Student Union Blvd"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Latitude</label>
                <Input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-1">
                <label className="font-medium text-slate-700">Longitude</label>
                <Input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

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
