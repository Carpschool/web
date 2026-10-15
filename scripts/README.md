# Dev-only checks

`check-mobile-layout.mjs` is a Playwright geometry + screenshot check for the mobile bottom nav and map overlays. It is not bundled with the app and adds no dependency to package.json.

It asserts, in a normal 390x844 viewport, at 1440x900 and after a 1440 to 390 resize, that the fixed bottom nav never covers the end of the page or a map scrolled into view, and that map zoom controls and attribution stay inside the map and do not overlap each other or the nav. Screenshots go to `scripts/shots` (gitignored).

Run against a dev server with a synthetic dev Clerk user (never production):

```sh
npx -y -p playwright playwright install chromium
BASE_URL=https://your-dev-origin \
QA_SIGNIN_TICKET=<single-use dev Clerk sign-in ticket> \
ROUTE_PATH=/drives/<id> \
NODE_PATH=$(npm root -g) node scripts/check-mobile-layout.mjs
```

`ROUTE_PATH` must be a page with a map, for example `/drives/new` after a route preview or a drive detail page. Exit code is 0 only if every assertion passes.

## Local run (no Docker network / tunnel)

Run against `http://localhost:3000` with dev-only Clerk keys and synthetic fixtures.
```
npm i --no-save playwright-core   # outside the repo is fine
BASE_URL=http://localhost:3000 QA_SIGNIN_TICKET=<dev clerk sign-in ticket for the synthetic driver> \
ROUTE_PATH=/drives/new CHROME_PATH=/path/to/chrome SHOT_DIR=/tmp/shots node scripts/check-mobile-layout.mjs
```
`/api/route` is stubbed with a synthetic line (set ROUTE_STUB=0 to use the real backend). Tiles may be an offline stub; the check asserts layout geometry only, not tile rendering. On /drives/new the unfixed code fails the nav-clearance and attribution assertions.
