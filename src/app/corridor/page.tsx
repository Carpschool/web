'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Compass } from 'lucide-react';

/**
 * DriverCorridorPage
 * 
 * Scaffolding for Driver Corridor Matching:
 * Allows drivers to browse nearby active rider applications along their route
 * (Home -> School or School -> Home) and initiate contact.
 */
export default function DriverCorridorPage() {
  // TODO: Fetch driver registered homes from School Server
  // TODO: Select commute direction (HOME_TO_SCHOOL vs SCHOOL_TO_HOME)
  // TODO: Call GET /api/v1/matching/riders to fetch nearby rider applications
  // TODO: Render interactive map with driver route and rider pickup bubbles (10m - 200m)
  // TODO: Handle "Reach Out" button to start negotiation channel (POST /api/v1/negotiations/start/:applicationId)

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Compass className="h-6 w-6 text-primary" /> Driver Commute Corridor
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse rider applications matching your commute path and initiate carpool negotiations.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Commute Route & Matching Map</CardTitle>
          </CardHeader>
          <CardContent className="h-64 border rounded-md m-4 flex flex-col items-center justify-center bg-slate-100 text-xs text-slate-500">
            <Compass className="h-8 w-8 text-primary/40 mb-2 animate-spin" />
            <p className="font-medium text-slate-700">Interactive Corridor Map</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              // TODO: Integrate MapLibre GL / Google Maps showing driver corridor and rider walking radius circles.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
