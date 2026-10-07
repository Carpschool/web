import { auth, clerkClient } from '@clerk/nextjs/server';
// Central admins assign school admins by editing Clerk privateMetadata.school[<schoolId>].admin.
export async function POST(req: Request) {
  const { userId } = await auth(); if (!userId) return new Response('Unauthorized', { status: 401 });
  const c = await clerkClient(); const caller = await c.users.getUser(userId);
  if ((caller.privateMetadata as any)?.admin !== true) return Response.json({ message: 'Network admin required' }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b || typeof b.email !== 'string' || !/^[a-f0-9]{24}$/.test(b.schoolId) || typeof b.admin !== 'boolean') return Response.json({ message: 'email, schoolId, admin required' }, { status: 400 });
  const found = await c.users.getUserList({ emailAddress: [b.email.trim().toLowerCase()], limit: 1 });
  const u = found.data[0]; if (!u) return Response.json({ message: 'No account with that email' }, { status: 404 });
  const m: any = u.privateMetadata || {}; const school = { ...(m.school || {}), [b.schoolId]: { ...(m.school?.[b.schoolId] || {}), admin: b.admin } };
  await c.users.updateUserMetadata(u.id, { privateMetadata: { ...m, admin: m.admin === true, school } });
  return Response.json({ ok: true, userId: u.id });
}
