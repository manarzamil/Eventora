/**
 * Captures the screenshots used in README.md.
 *
 * Run against a server that is already up:
 *   npm run build && npm start
 *   node scripts/screenshots.mjs
 *
 * Output goes to docs/screenshots/. Regenerating them after a UI change keeps
 * the README honest — the images are always of the current build.
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.SHOT_BASE_URL ?? 'http://127.0.0.1:3000';
const OUT = 'docs/screenshots';

const CUSTOMER = { email: 'demo@eventora.demo', password: 'Demo!2345' };
const ADMIN = { email: 'admin@eventora.demo', password: 'Admin!2345' };

async function signIn(page, account) {
  await page.goto(`${BASE}/sign-in`, { waitUntil: 'networkidle' });
  await page.fill('input[name="email"]', account.email);
  await page.fill('input[name="password"]', account.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/`, { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(600);
}

async function shot(page, path, name, { full = false, wait = 900 } = {}) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(wait);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  console.log(`  ✔ ${name}.png`);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  // CHROMIUM_PATH lets a sandbox point at a preinstalled browser instead of
  // downloading one; without it Playwright uses its own managed install.
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
  );

  /* ------------------------------------------------------ signed-out, desktop */
  const guest = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const guestPage = await guest.newPage();

  console.log('→ public pages');
  await shot(guestPage, '/', '01-home');
  await shot(guestPage, '/destinations', '02-destinations');
  await shot(guestPage, '/destinations/kuwait', '03-cities');
  await shot(
    guestPage,
    '/destinations/united-arab-emirates/dubai?sort=recommended',
    '04-discovery',
  );
  await shot(
    guestPage,
    '/destinations/united-arab-emirates/dubai?categories=marine,outdoor&sort=price-asc',
    '05-discovery-filtered',
  );
  await shot(guestPage, '/categories', '06-categories');

  // Pick a real event slug from the API rather than hardcoding one.
  const slug = await guestPage.evaluate(async (base) => {
    const response = await fetch(`${base}/api/events?city=dubai&perPage=1&sort=recommended`);
    const body = await response.json();
    return body.data[0].slug;
  }, BASE);

  await shot(guestPage, `/events/${slug}`, '07-event-detail');
  await shot(guestPage, '/sign-in', '08-sign-in');

  /* --------------------------------------------------------------- customer */
  console.log('→ customer journey');
  const customer = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const customerPage = await customer.newPage();
  await signIn(customerPage, CUSTOMER);

  const sessionId = await customerPage.evaluate(
    async ({ base, slug }) => {
      const response = await fetch(`${base}/api/events/${slug}`);
      const body = await response.json();
      return body.data.sessions[0].id;
    },
    { base: BASE, slug },
  );

  await shot(customerPage, `/events/${slug}/book?session=${sessionId}&qty=2`, '09-checkout');

  // Create a booking through the UI so the confirmation screenshot is genuine.
  await customerPage.click('button[type="submit"]');
  await customerPage.waitForURL(/\/bookings\/EVT-/, { timeout: 20_000 });
  await customerPage.waitForTimeout(900);
  await customerPage.screenshot({ path: `${OUT}/10-confirmation.png` });
  console.log('  ✔ 10-confirmation.png');

  await shot(customerPage, '/bookings', '11-my-bookings');
  await shot(customerPage, '/favourites', '12-favourites');
  await shot(customerPage, '/account', '13-account');

  /* ------------------------------------------------------------------ admin */
  console.log('→ admin dashboard');
  const admin = await browser.newContext({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 2,
  });
  const adminPage = await admin.newPage();
  await signIn(adminPage, ADMIN);

  await shot(adminPage, '/admin', '14-admin-overview');
  await shot(adminPage, '/admin/events', '15-admin-events');

  const eventId = await adminPage.evaluate(async (base) => {
    const response = await fetch(`${base}/api/admin/events?perPage=1`);
    const body = await response.json();
    return body.data[0].id;
  }, BASE);

  await shot(adminPage, `/admin/events/${eventId}`, '16-admin-event-edit');
  await shot(adminPage, '/admin/bookings', '17-admin-bookings');
  await shot(adminPage, '/admin/destinations', '18-admin-destinations');
  await shot(adminPage, '/admin/users', '19-admin-users');

  /* ----------------------------------------------------------------- mobile */
  console.log('→ mobile');
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const mobilePage = await mobile.newPage();
  await shot(mobilePage, '/', '20-mobile-home');
  await shot(mobilePage, '/destinations/united-arab-emirates/dubai', '21-mobile-discovery');
  await shot(mobilePage, `/events/${slug}`, '22-mobile-event');

  await browser.close();
  console.log('\n✔ screenshots written to docs/screenshots/');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
