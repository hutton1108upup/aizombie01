import { beforeEach, describe, expect, test, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('@/auth/auth', () => ({
  auth: { api: { getSession: mocks.getSession } },
}));
import {
  readSmallJson,
  requireSameOrigin,
  requireVideoUser,
} from '@/aizombie/access';

describe('video API access', () => {
  beforeEach(() => vi.clearAllMocks());
  test('requires a verified authenticated session', async () => {
    const request = new Request('https://example.test/api/aizombie/jobs');
    mocks.getSession.mockResolvedValue(null);
    expect((await requireVideoUser(request)).response?.status).toBe(401);
    mocks.getSession.mockResolvedValue({
      user: { id: 'a', emailVerified: false },
    });
    expect((await requireVideoUser(request)).response?.status).toBe(403);
    mocks.getSession.mockResolvedValue({
      user: { id: 'a', emailVerified: true },
    });
    expect(await requireVideoUser(request)).toEqual({ userId: 'a' });
  });
  test('rejects absent or cross-origin mutation origins', () => {
    expect(
      requireSameOrigin(new Request('https://example.test/api'))?.status
    ).toBe(403);
    expect(
      requireSameOrigin(
        new Request('https://example.test/api', {
          headers: { Origin: 'https://other.test' },
        })
      )?.status
    ).toBe(403);
    expect(
      requireSameOrigin(
        new Request('https://example.test/api', {
          headers: { Origin: 'https://example.test' },
        })
      )
    ).toBeNull();
  });
  test('limits the actual streamed body, even without Content-Length', async () => {
    await expect(
      readSmallJson(
        new Request('https://example.test/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: 'a'.repeat(4096) }),
        })
      )
    ).rejects.toThrow('too large');
    expect(
      await readSmallJson(
        new Request('https://example.test/api', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{"consent":true}',
        })
      )
    ).toEqual({ consent: true });
  });
});
