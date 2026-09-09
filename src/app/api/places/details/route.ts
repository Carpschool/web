import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get('place_id');

  if (!placeId) {
    return NextResponse.json({ error: 'place_id is required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Google Maps API key not configured on server' }, { status: 500 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
      placeId
    )}&fields=geometry,formatted_address,name&key=${apiKey}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 'OK') {
      console.error('Google Place Details error:', data);
      return NextResponse.json(
        { error: data.error_message || data.status || 'Failed to fetch place details' },
        { status: 400 }
      );
    }

    const result = data.result;
    const location = result?.geometry?.location;

    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return NextResponse.json({ error: 'Place has no valid geometry coordinates' }, { status: 400 });
    }

    return NextResponse.json({
      name: result.name || '',
      formattedAddress: result.formatted_address || '',
      latitude: location.lat,
      longitude: location.lng,
    });
  } catch (error: any) {
    console.error('Failed to query Place Details API:', error);
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
