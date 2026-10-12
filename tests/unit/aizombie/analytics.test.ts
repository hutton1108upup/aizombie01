import { describe, expect, it } from 'vitest';
import { analyticsPageUrl, analyticsReferrer } from '@/lib/site-analytics';

describe('production analytics boundaries', () => {
  it('excludes local, platform and private routes', () => {
    for (const value of [
      'http://localhost:3000/',
      'http://127.0.0.1:4247/',
      'https://aizombie01.duckweed1014.workers.dev/',
      'https://aizombietrend.video/dashboard',
      'https://aizombietrend.video/zh/auth/login',
      'https://aizombietrend.video/api/aizombie/jobs',
    ]) {
      expect(analyticsPageUrl(value)).toBeNull();
    }
  });
  it('keeps public route identity without URL query, hash or referrer details', () => {
    expect(
      analyticsPageUrl(
        'https://aizombietrend.video/zh/pricing?email=private@example.test#photo'
      )
    ).toBe('https://aizombietrend.video/zh/pricing');
    expect(
      analyticsReferrer('https://example.test/account/123?token=secret')
    ).toBe('https://example.test');
    expect(analyticsReferrer('data:private')).toBe('');
  });
});
