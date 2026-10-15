// Proxies the internal tileserver-gl (TILESERVER_URL, not publicly exposed) under /tiles,
// rewriting absolute URLs in style/TileJSON so the browser keeps fetching through this app.
import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
const UP = (process.env.TILESERVER_URL || 'http://127.0.0.1:43880').replace(/\/$/, '');
const SAFE = /^[\w\-. ,%@{}]+$/;
export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
  if (process.env.CARPSCHOOL_QA_NO_TILES === '1') return qaTiles(path);
  if (!path.every(s => SAFE.test(decodeURIComponent(s)) && s !== '..')) return new Response('Bad path', { status: 400 });
  let r: Response;
  try { r = await fetch(UP + '/' + path.join('/'), { cache: 'no-store' }); } catch { return new Response('Tiles unavailable', { status: 502 }); }
  const type = r.headers.get('content-type') || 'application/octet-stream';
  const headers: Record<string, string> = { 'content-type': type, 'cache-control': r.ok ? 'public, max-age=86400' : 'no-store' };
  if (type.includes('json')) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host'); const proto = req.headers.get('x-forwarded-proto') || 'https';
    const text = (await r.text()).split(UP + '/').join(`${proto}://${host}/tiles/`);
    return new Response(text, { status: r.status, headers });
  }
  return new Response(r.body, { status: r.status, headers });
}

// Isolated QA only (no tileserver): serve a blank, label-free style so the map shell renders without a 502.
function qaTiles(path: string[]) {
  if (path.join('/') === 'styles/positron/style.json') return Response.json({ version: 8, name: 'qa-blank', sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#EDE8DC' } }] }, { headers: { 'cache-control': 'no-store' } });
  return new Response(null, { status: 204 });
}
