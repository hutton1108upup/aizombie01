import { expect, test } from '@playwright/test';
import { registerE2EUser, loginByForm } from '../fixtures/auth';
import { E2E_TEST_SECRET } from '../fixtures/test-data';

test('preview validates photos without uploading or starting generation', async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/api/aizombie'))
      mutations.push(request.url());
  });
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('generate-video')).toBeDisabled();
  const input = page.getByTestId('survivor-photo');
  await expect(input).toBeEnabled();
  await input.setInputFiles({
    name: 'large.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.alloc(8 * 1024 * 1024 + 1),
  });
  await expect(page.getByTestId('photo-error')).toBeVisible();
  await input.setInputFiles({
    name: 'invalid.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from('not an image'),
  });
  await expect(page.getByTestId('photo-error')).toBeVisible();
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    canvas.getContext('2d')?.fillRect(0, 0, 400, 400);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await input.setInputFiles({
    name: 'valid.png',
    mimeType: 'image/png',
    buffer: Buffer.from(png, 'base64'),
  });
  await expect(page.locator('#generator img')).toHaveCount(1);
  await expect(page.getByTestId('photo-error')).toHaveCount(0);
  expect(mutations).toEqual([]);
  await page.goto('/pricing');
  for (const id of ['single', 'starter', 'creator'])
    await expect(page.getByTestId(`credit-pack-${id}`)).toBeDisabled();
});

test('anonymous access and cross-origin mutation are rejected', async ({
  request,
  baseURL,
}) => {
  expect((await request.get('/api/aizombie/jobs')).status()).toBe(401);
  expect(
    (
      await request.get(
        '/api/aizombie/jobs/00000000-0000-4000-8000-000000000001'
      )
    ).status()
  ).toBe(401);
  expect(
    (
      await request.post('/api/aizombie/jobs', {
        headers: { Origin: baseURL ?? '' },
        data: {},
      })
    ).status()
  ).toBe(401);
  expect(
    (
      await request.post('/api/aizombie/jobs', {
        headers: { Origin: 'https://other.test' },
        data: {},
      })
    ).status()
  ).toBe(403);
});

test('job ownership, persistent history and safe deletion', async ({
  page,
  request,
  browser,
  baseURL,
}) => {
  const first = await registerE2EUser(request);
  const second = await registerE2EUser(request);
  const seeded = await request.post('/api/e2e/video-jobs', {
    headers: { 'x-e2e-secret': E2E_TEST_SECRET },
    data: { email: first.email },
  });
  expect(seeded.ok()).toBeTruthy();
  const body = (await seeded.json()) as { id: string };
  await loginByForm(page, first);
  const card = page.locator(`[data-job-id="${body.id}"]`);
  await expect(card).toBeVisible();
  await page.reload();
  await expect(card).toBeVisible();
  const otherContext = await browser.newContext({ baseURL });
  try {
    const otherPage = await otherContext.newPage();
    await loginByForm(otherPage, second);
    expect(
      (await otherPage.request.get(`/api/aizombie/jobs/${body.id}`)).status()
    ).toBe(404);
    expect(
      (
        await otherPage.request.delete(`/api/aizombie/jobs/${body.id}`, {
          headers: { Origin: baseURL ?? '' },
        })
      ).status()
    ).toBe(404);
    expect(
      (
        await otherPage.request.get(`/api/aizombie/jobs/${body.id}/video`)
      ).status()
    ).toBe(404);
    await expect(otherPage.locator(`[data-job-id="${body.id}"]`)).toHaveCount(
      0
    );
  } finally {
    await otherContext.close();
  }
  await card.getByRole('button').click();
  await expect(card).toHaveCount(0);
  expect(
    (await page.request.get(`/api/aizombie/jobs/${body.id}`)).status()
  ).toBe(404);
});

test('valid authenticated request fails closed without a fake task', async ({
  page,
  request,
  baseURL,
}) => {
  const user = await registerE2EUser(request);
  await loginByForm(page, user);
  const id = '00000000-0000-4000-8000-000000000001';
  const response = await page.request.post('/api/aizombie/jobs', {
    headers: { Origin: baseURL ?? '' },
    data: {
      mode: 'couple',
      quality: '480p',
      aspect: '16:9',
      survivorFileId: id,
      zombieFileId: id,
      consent: true,
      idempotencyKey: id,
    },
  });
  expect(response.status()).toBe(503);
  const jobs = await page.request.get('/api/aizombie/jobs');
  expect(await jobs.json()).toEqual({ jobs: [] });
});

test('terms alias redirects and product routes are in sitemap', async ({
  request,
}) => {
  const terms = await request.get('/terms-of-service', { maxRedirects: 0 });
  expect(terms.status()).toBe(308);
  expect(terms.headers().location).toContain('/terms');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  for (const path of [
    'ai-zombie-trend',
    'zombie-love-story',
    'zombie-pet',
    'ai-zombie-video-examples',
    'pricing',
  ])
    expect(sitemap).toContain(`/${path}</loc>`);
  expect(sitemap).not.toContain('/blog/');
});
