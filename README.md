# Carpschool web

Next.js (App Router) + Clerk + MUI client for Carpschool.

The web app talks to the central server for school discovery and federation tickets, then to the chosen school server for everything else. Maps use Leaflet with CARTO/OpenStreetMap tiles, place search goes through a server-side Google Places proxy, and drive routes come from an OSRM-compatible router.

## Run

```sh
cp .env.example .env   # fill in Clerk keys, central URL, Places key
npm ci
npm run dev
```

Production: `npm run build && node .next/standalone/server.js` (copy `.next/static` next to it), or use the Dockerfile.

## Admin

Admin access comes only from Clerk private metadata:

```json
{ "admin": false, "school": { "<schoolId>": { "admin": false } } }
```

Network admins can grant school admin from the Network admin page.
