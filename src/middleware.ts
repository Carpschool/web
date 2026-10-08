import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
const isPublic = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)', '/api/config', '/tiles(.*)', '/maplibre(.*)']);
export default clerkMiddleware(async (auth, req) => { if (!isPublic(req)) await auth.protect(); });
export const config = { matcher: ['/((?!_next|.*\\.(?:css|js|png|jpg|svg|ico|woff2?|map)).*)', '/(api|trpc)(.*)'] };
