import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get('input');

  if (!input || input.trim().length === 0) {
    return NextResponse.json({ predictions: [] });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps API key not configured on server' }, { status: 500 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input.trim()
    )}&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places Autocomplete error:', data);
      return NextResponse.json(
        { error: data.error_message || data.status || 'Places Autocomplete failed' },
        { status: 400 }
      );
    }

    const predictions = (data.predictions || []).map((p: any) => ({
      placeId: p.place_id,
      description: p.description,
      mainText: p.structured_formatting?.main_text || p.description,
      secondaryText: p.structured_formatting?.secondary_text || '',
    }));

    return NextResponse.json({ predictions });
  } catch (error: any) {
    console.error('Failed to query Places API:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
