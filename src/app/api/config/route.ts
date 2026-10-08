import { readFileSync } from 'node:fs';
export const dynamic = 'force-dynamic';
export function GET() {
  let central = process.env.NEXT_PUBLIC_CENTRAL_SERVER_URL || '';
  const f = process.env.CENTRAL_URL_FILE;
  if (f) { try { central = readFileSync(f, 'utf8').trim() || central; } catch {} }
  return Response.json({ central });
}
