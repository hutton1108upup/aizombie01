import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const ids = JSON.parse(readFileSync('analytics.config.json', 'utf8'));
const localUrl = process.env.ANALYTICS_TEST_BASE_URL ?? 'http://127.0.0.1:4253';
const browser = await chromium.launch({ headless: true });
const local = await browser.newPage();
await local.goto(localUrl + '/', { waitUntil: 'networkidle' });
await local.waitForTimeout(3500);
assert.equal(
  await local
    .locator('script[src*="googletagmanager"],script#clarity-analytics')
    .count(),
  0
);
const page = await browser.newPage();
const vendors = [];
await page.route('https://www.googletagmanager.com/**', async (route) => {
  vendors.push(route.request().url());
  await route.fulfill({
    contentType: 'application/javascript',
    body: '/* test: no external collection */',
  });
});
await page.route('https://www.clarity.ms/**', async (route) => {
  vendors.push(route.request().url());
  await route.fulfill({
    contentType: 'application/javascript',
    body: '/* test: no external collection */',
  });
});
await page.route('https://aizombietrend.video/**', async (route) => {
  const u = new URL(route.request().url());
  const response = await page.request.fetch(localUrl + u.pathname + u.search, {
    method: route.request().method(),
  });
  await route.fulfill({ response });
});
await page.goto(
  'https://aizombietrend.video/?email=private@example.test#photo',
  { waitUntil: 'networkidle' }
);
await page.waitForTimeout(3500);
let events = await page.evaluate(() =>
  window.dataLayer.filter((e) => e[0] === 'event' && e[1] === 'page_view')
);
assert.equal(events.length, 1);
assert.equal(events[0][2].page_location, 'https://aizombietrend.video/');
assert.equal(vendors.filter((u) => u.includes('clarity')).length, 0);
await page.goto('https://aizombietrend.video/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3500);
assert.ok(vendors.some((u) => u.includes(ids.googleMeasurementId)));
assert.ok(vendors.some((u) => u.includes(ids.clarityProjectId)));
assert.equal(
  await page.locator('[data-clarity-mask="true"] input[type="file"]').count(),
  2
);
await page.locator('header a[href="/pricing"]').first().click();
await page.waitForURL('**/pricing');
await page.waitForTimeout(500);
events = await page.evaluate(() =>
  window.dataLayer.filter((e) => e[0] === 'event' && e[1] === 'page_view')
);
assert.equal(events.length, 2);
assert.equal(events[1][2].page_location, 'https://aizombietrend.video/pricing');
assert.equal(
  await page.evaluate(
    () => window.dataLayer.filter((e) => e[0] === 'config').length
  ),
  1
);
await browser.close();
console.log(
  'Analytics integration passed: local exclusion, sanitized URL, query recording exclusion, photo masking, one initial/one SPA page view and one config.'
);
