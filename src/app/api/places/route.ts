import { auth } from '@clerk/nextjs/server';
export async function GET(req: Request) {
  const { userId } = await auth(); if (!userId) return new Response('Unauthorized', { status: 401 });
  const key = process.env.GOOGLE_MAPS_API_KEY; if (!key) return Response.json({ error: 'Places not configured' }, { status: 503 });
  const u = new URL(req.url); const q = u.searchParams.get('q'); const id = u.searchParams.get('id');
  if (id) {
    if (!/^[A-Za-z0-9_-]{10,300}$/.test(id)) return new Response('Bad id', { status: 400 });
    const r = await fetch(`https://places.googleapis.com/v1/places/${id}?fields=location,formattedAddress,displayName`, { headers: { 'X-Goog-Api-Key': key } });
    const j = await r.json(); if (!r.ok) return Response.json({ error: 'Lookup failed' }, { status: 502 });
    return Response.json({ address: j.formattedAddress, name: j.displayName?.text, lat: j.location.latitude, lng: j.location.longitude });
  }
  if (!q || q.length > 200) return Response.json({ suggestions: [] });
  const body: any = { input: q };
  const lat = Number(u.searchParams.get('lat')), lng = Number(u.searchParams.get('lng'));
  if (Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng)) body.locationBias = { circle: { center: { latitude: lat, longitude: lng }, radius: 40000 } };
  const r = await fetch('https://places.googleapis.com/v1/places:autocomplete', { method: 'POST', headers: { 'X-Goog-Api-Key': key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json(); if (!r.ok) return Response.json({ error: 'Search failed' }, { status: 502 });
  return Response.json({ suggestions: (j.suggestions || []).filter((s: any) => s.placePrediction).map((s: any) => ({ id: s.placePrediction.placeId, main: s.placePrediction.structuredFormat?.mainText?.text ?? s.placePrediction.text.text, secondary: s.placePrediction.structuredFormat?.secondaryText?.text ?? '' })) });
}
