import { auth } from '@clerk/nextjs/server';
const n = (s: string | null) => { const v = (s || '').split(',').map(Number); return v.length === 2 && v.every(Number.isFinite) ? v : null; };
export async function GET(req: Request) {
  const { userId } = await auth(); if (!userId) return new Response('Unauthorized', { status: 401 });
  const u = new URL(req.url); const a = n(u.searchParams.get('from')), b = n(u.searchParams.get('to'));
  if (!a || !b) return Response.json({ error: 'from/to required as lng,lat' }, { status: 400 });
  const base = process.env.ROUTER_URL || 'https://router.project-osrm.org';
  try {
    const r = await fetch(`${base}/route/v1/driving/${a.join(',')};${b.join(',')}?overview=full&geometries=geojson`, { signal: AbortSignal.timeout(10000) });
    const j = await r.json(); if (j.code !== 'Ok') throw new Error(j.code);
    let c: number[][] = j.routes[0].geometry.coordinates;
    if (c.length > 900) { const step = Math.ceil(c.length / 900); c = c.filter((_, i) => i % step === 0 || i === c.length - 1); }
    return Response.json({ coordinates: c.map(p => [+p[0].toFixed(6), +p[1].toFixed(6)]), meters: j.routes[0].distance, seconds: j.routes[0].duration });
  } catch { return Response.json({ error: 'Routing is unavailable right now' }, { status: 502 }); }
}
