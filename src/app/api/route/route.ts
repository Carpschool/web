import { auth } from '@clerk/nextjs/server';
// Driving route via Google Routes API, server-side only (key never reaches the browser).
const n = (s: string | null) => { const v = (s || '').split(',').map(Number); return v.length === 2 && v.every(Number.isFinite) && Math.abs(v[0]) <= 180 && Math.abs(v[1]) <= 90 ? v : null; };
function decode(str: string) { const out: number[][] = []; let i = 0, lat = 0, lng = 0; while (i < str.length) { for (const k of [0, 1]) { let r = 0, s = 0, b; do { b = str.charCodeAt(i++) - 63; r |= (b & 31) << s; s += 5; } while (b >= 32); const d = r & 1 ? ~(r >> 1) : r >> 1; if (k) lng += d; else lat += d; } out.push([lng / 1e5, lat / 1e5]); } return out; }
export async function GET(req: Request) {
  const { userId } = await auth(); if (!userId) return new Response('Unauthorized', { status: 401 });
  const key = process.env.GOOGLE_MAPS_API_KEY; if (!key) return Response.json({ error: 'Routing not configured' }, { status: 503 });
  const u = new URL(req.url); const a = n(u.searchParams.get('from')), b = n(u.searchParams.get('to'));
  if (!a || !b) return Response.json({ error: 'from/to required as lng,lat' }, { status: 400 });
  const wp = (p: number[]) => ({ location: { latLng: { latitude: p[1], longitude: p[0] } } });
  try {
    const r = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', { method: 'POST', signal: AbortSignal.timeout(10000),
      headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline', 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin: wp(a), destination: wp(b), travelMode: 'DRIVE', routingPreference: 'TRAFFIC_UNAWARE', polylineQuality: 'OVERVIEW' }) });
    const j = await r.json(); const rt = j.routes?.[0]; if (!r.ok || !rt) throw new Error();
    let c = decode(rt.polyline.encodedPolyline);
    if (c.length > 900) { const step = Math.ceil(c.length / 900); c = c.filter((_, i) => i % step === 0 || i === c.length - 1); }
    return Response.json({ coordinates: c.map(p => [+p[0].toFixed(6), +p[1].toFixed(6)]), meters: rt.distanceMeters, seconds: parseInt(rt.duration) || 0 });
  } catch { return Response.json({ error: 'Routing is unavailable right now' }, { status: 502 }); }
}
