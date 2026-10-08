// Proxies the internal tileserver-gl (TILESERVER_URL, not publicly exposed) under /tiles,
// rewriting absolute URLs in style/TileJSON so the browser keeps fetching through this app.
import { NextRequest } from 'next/server';
export const dynamic = 'force-dynamic';
const UP = (process.env.TILESERVER_URL || 'http://127.0.0.1:43880').replace(/\/$/, '');
const SAFE = /^[\w\-. ,%@{}]+$/;
export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params;
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
