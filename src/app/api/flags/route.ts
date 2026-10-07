import { auth, clerkClient } from '@clerk/nextjs/server';
export const dynamic = 'force-dynamic';
// Admin flags live in Clerk privateMetadata; only expose booleans for the signed-in user.
export async function GET() {
  const { userId } = await auth(); if (!userId) return new Response('Unauthorized', { status: 401 });
  const u = await (await clerkClient()).users.getUser(userId);
  const m: any = u.privateMetadata || {};
  const schools = Object.entries(m.school || {}).filter(([, v]: any) => v?.admin === true).map(([k]) => k);
  return Response.json({ admin: m.admin === true, schoolAdminOf: schools });
}
