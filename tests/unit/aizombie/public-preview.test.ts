import { expect, test } from 'vitest';
import { publicPreviewResponse } from '@/aizombie/public-preview';
import { productionConfigErrors } from '@/aizombie/readiness';

test('public preview serves marketing but blocks every stateful path', async () => {
  expect(
    publicPreviewResponse(new Request('https://example.test/'))
  ).toBeNull();
  expect(
    publicPreviewResponse(new Request('https://example.test/assets/app.js'))
  ).toBeNull();
  expect(
    await publicPreviewResponse(
      new Request('https://example.test/api/auth/get-session')
    )?.json()
  ).toBeNull();
  for (const path of [
    '/api/aizombie/jobs',
    '/api/storage/file',
    '/api/webhooks/stripe',
    '/_serverFn/anything',
  ]) {
    expect(
      publicPreviewResponse(new Request(`https://example.test${path}`))?.status
    ).toBe(503);
  }
  expect(
    publicPreviewResponse(
      new Request('https://example.test/', { method: 'POST' })
    )?.status
  ).toBe(503);
  expect(
    publicPreviewResponse(new Request('https://example.test/zh/dashboard'))
      ?.status
  ).toBe(303);
  expect(
    publicPreviewResponse(
      new Request('https://example.test/api/e2e/video-jobs')
    )?.status
  ).toBe(404);
});

test('only an account-disabled public preview can omit an auth secret', () => {
  expect(
    productionConfigErrors({
      baseUrl: 'https://example.test',
      authEnabled: false,
    })
  ).toEqual([]);
  expect(
    productionConfigErrors({
      baseUrl: 'https://example.test',
      authEnabled: true,
    })
  ).toHaveLength(1);
});
