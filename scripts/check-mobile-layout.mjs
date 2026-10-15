#!/usr/bin/env node
// Dev-only mobile layout regression check. Not part of the production bundle.
// Asserts, in a NORMAL (non full-page) 390x844 viewport and at 1440x900, that the
// bottom nav never covers the end of the page or a scrolled-to map, and that map
// controls and attribution stay inside the map without overlapping each other.
// Run: see scripts/README.md. Needs BASE_URL, QA_SIGNIN_TICKET (dev Clerk sign-in
// ticket for a synthetic user) and ROUTE_PATH (a page containing a map).
const { chromium } = await import('playwright').catch(() => import('playwright-core'));
import { mkdirSync } from 'node:fs';

const BASE = process.env.BASE_URL, TICKET = process.env.QA_SIGNIN_TICKET, ROUTE = process.env.ROUTE_PATH;
const OUT = process.env.SHOT_DIR || 'scripts/shots';
if (!BASE || !TICKET || !ROUTE) { console.error('BASE_URL, QA_SIGNIN_TICKET and ROUTE_PATH are required'); process.exit(2); }
mkdirSync(OUT, { recursive: true });

const fails = [];
const check = (name, ok, detail) => { console.log((ok ? 'PASS ' : 'FAIL ') + name + ' ' + detail); if (!ok) fails.push(name); };
const inside = (a, b, t = 0.5) => a.left >= b.left - t && a.right <= b.right + t && a.top >= b.top - t && a.bottom <= b.bottom + t;
const hit = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

const rects = () => {
  const vis = e => e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
  const r = e => { const b = e.getBoundingClientRect(); return { left: b.left, right: b.right, top: b.top, bottom: b.bottom }; };
  const nav = [...document.querySelectorAll('nav[aria-label="Main"]')].find(vis);
  const map = document.querySelector('[role="img"].maplibregl-map, .maplibregl-map');
  const q = s => [...(map?.querySelectorAll(s) || [])].filter(vis).map(r);
  return {
    vh: innerHeight,
    nav: nav && getComputedStyle(nav).position === 'fixed' ? r(nav) : null,
    map: map ? r(map) : null,
    zoom: q('.maplibregl-ctrl-group')[0] || null,
    attrib: q('.maplibregl-ctrl-attrib')[0] || null,
    last: (() => { let m = 0; document.querySelectorAll('#main-content *').forEach(e => { const b = e.getBoundingClientRect(); if (b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden') m = Math.max(m, b.bottom); }); return m; })(),
    docBottom: document.documentElement.scrollHeight,
  };
};

async function run(page, label, vp) {
  await page.setViewportSize(vp);
  // Routes preview needs a Google key; stub /api/route with a synthetic line so the map renders without external calls.
  if (process.env.ROUTE_STUB !== '0') await page.route('**/api/route*', r => r.fulfill({ json: { coordinates: [[-123.24, 49.27], [-123.243, 49.265], [-123.246, 49.26]], meters: 2100, seconds: 420 } }));
  await page.goto(BASE + ROUTE, { waitUntil: 'networkidle' });
  await page.waitForSelector('.maplibregl-map', { timeout: 30000 });
  await page.waitForTimeout(2500);
  const mobile = vp.width < 900;
  // 1. page end: content bottom must clear the fixed nav
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  let g = await page.evaluate(rects);
  if (mobile) {
    check(label + ' nav present', !!g.nav, '');
    check(label + ' page end clears nav', g.nav && Math.max(g.last, g.map?.bottom || 0) <= g.nav.top + 0.5, 'lastContent.bottom=' + Math.max(g.last, g.map?.bottom || 0).toFixed(1) + ' nav.top=' + g.nav?.top.toFixed(1));
  } else check(label + ' no fixed bottom nav', !g.nav, '');
  await page.screenshot({ path: OUT + '/' + label + '-pageend.png' });
  // 2. map scrolled into view (block: end)
  await page.evaluate(() => document.querySelector('.maplibregl-map').scrollIntoView({ block: 'end' }));
  await page.waitForTimeout(400);
  g = await page.evaluate(rects);
  if (mobile) check(label + ' map clears nav', g.nav && g.map.bottom <= g.nav.top + 0.5, 'map.bottom=' + g.map.bottom.toFixed(1) + ' nav.top=' + g.nav.top.toFixed(1));
  check(label + ' zoom controls inside map', !g.zoom || inside(g.zoom, g.map), JSON.stringify(g.zoom));
  check(label + ' attribution inside map', !!g.attrib && inside(g.attrib, g.map), JSON.stringify(g.attrib));
  if (g.zoom && g.attrib) check(label + ' controls vs attribution no overlap', !hit(g.zoom, g.attrib), '');
  if (mobile && g.attrib && g.nav) check(label + ' attribution not under nav', g.attrib.bottom <= g.nav.top + 0.5, 'attr.bottom=' + g.attrib.bottom.toFixed(1));
  await page.screenshot({ path: OUT + '/' + label + '-map.png' });
}

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE + '/sign-in?__clerk_ticket=' + encodeURIComponent(TICKET), { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await run(page, 'mobile390', { width: 390, height: 844 });
  await run(page, 'desktop1440', { width: 1440, height: 900 });
  await run(page, 'resize390', { width: 390, height: 844 }); // desktop -> mobile without new context
} finally { await browser.close(); }
if (fails.length) { console.error('FAILED: ' + fails.join(', ')); process.exit(1); }
console.log('ALL PASS');
