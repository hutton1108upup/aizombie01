import { expect, test } from '@playwright/test';
import { registerE2EUser, loginByForm } from '../fixtures/auth';

test('successful Test checkout opens the current Waffo store checkout URL', async ({
  page,
  request,
}) => {
  const user = await registerE2EUser(request);
  await loginByForm(page, user);
  const destination =
    'https://pancake.waffo.ai/store/ai-zombie-video/checkout/cs_test#token=fake';
  await page.route('**/api/aizombie/payments', async (route) => {
    await route.fulfill({
      json:
        route.request().method() === 'GET'
          ? { mode: 'test', credits: 0, orders: [] }
          : { mode: 'test', url: destination },
    });
  });
  await page.route(
    'https://pancake.waffo.ai/store/ai-zombie-video/checkout/cs_test',
    async (route) => {
      await route.fulfill({
        contentType: 'text/html',
        body: '<html><body>Test checkout</body></html>',
      });
    }
  );
  await page.goto('/dashboard/payments');
  await page.getByTestId('test-buy-single').click();
  await expect(page).toHaveURL(destination);
});

test('credit payment APIs require authentication and same-origin requests', async ({
  request,
  baseURL,
}) => {
  expect((await request.get('/api/aizombie/payments')).status()).toBe(401);
  expect(
    (
      await request.post('/api/aizombie/payments', {
        headers: { Origin: baseURL ?? 'http://localhost:3000' },
        data: { packId: 'single', requestId: crypto.randomUUID() },
      })
    ).status()
  ).toBe(401);
  expect(
    (
      await request.post('/api/aizombie/payments', {
        headers: { Origin: 'https://untrusted.example' },
        data: {},
      })
    ).status()
  ).toBe(403);
  expect(
    (
      await request.post('/api/aizombie/payments/webhook', { data: {} })
    ).status()
  ).toBe(503);
});

test('unconfigured Test payments cannot charge authenticated users', async ({
  page,
  request,
}) => {
  const user = await registerE2EUser(request);
  await loginByForm(page, user);
  await page.goto('/dashboard/payments');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByTestId('test-buy-single')).toHaveCount(0);
  expect(
    await page.evaluate(
      async () =>
        (
          await fetch('/api/aizombie/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              packId: 'single',
              requestId: crypto.randomUUID(),
            }),
          })
        ).status
    )
  ).toBe(503);
});

test('failed Test checkout retries preserve the server request identifier', async ({
  page,
  request,
}) => {
  const user = await registerE2EUser(request);
  await loginByForm(page, user);
  const inputs: unknown[] = [];
  await page.route('**/api/aizombie/payments', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ json: { mode: 'test', credits: 0, orders: [] } });
    } else {
      inputs.push(route.request().postDataJSON());
      await route.fulfill({
        status: 502,
        json: { error: 'Test provider unavailable' },
      });
    }
  });
  await page.goto('/dashboard/payments');
  await page.getByTestId('test-buy-starter').click();
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByTestId('test-buy-starter').click();
  await expect.poll(() => inputs.length).toBe(2);
  expect(inputs[0]).toEqual(inputs[1]);
  expect(inputs[0]).toEqual({
    packId: 'starter',
    requestId: expect.any(String),
  });
});
