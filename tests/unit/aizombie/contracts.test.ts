import { describe, expect, test } from 'vitest';
import {
  createJobSchema,
  validatePhotoDimensions,
  validatePhotoMetadata,
} from '@/aizombie/contracts';
import { productionConfigErrors } from '@/aizombie/readiness';

describe('video input and release boundaries', () => {
  test('rejects absent photos, missing consent and arbitrary photo URLs', () => {
    expect(createJobSchema.safeParse({}).success).toBe(false);
    expect(
      createJobSchema.safeParse({
        mode: 'couple',
        quality: '480p',
        aspect: '16:9',
        survivorPhoto: 'https://other.test/photo.png',
      }).success
    ).toBe(false);
  });
  test('rejects oversized, empty, unsupported and undersized photos', () => {
    expect(() =>
      validatePhotoMetadata({ size: 0, type: 'image/jpeg' })
    ).toThrow();
    expect(() =>
      validatePhotoMetadata({ size: 8 * 1024 * 1024 + 1, type: 'image/jpeg' })
    ).toThrow();
    expect(() =>
      validatePhotoMetadata({ size: 100, type: 'image/svg+xml' })
    ).toThrow();
    expect(() => validatePhotoDimensions(299, 400)).toThrow();
    expect(() =>
      validatePhotoMetadata({ size: 8 * 1024 * 1024, type: 'image/png' })
    ).not.toThrow();
    expect(() => validatePhotoDimensions(300, 300)).not.toThrow();
  });
  test('rejects local URLs, weak secrets and incomplete Google config', () => {
    expect(
      productionConfigErrors({
        baseUrl: 'http://localhost:3000',
        secret: 'e2e-secret',
        googleEnabled: true,
      })
    ).toHaveLength(3);
    expect(
      productionConfigErrors({
        baseUrl: 'https://example.test/path',
        secret: 'a'.repeat(32),
      })
    ).toHaveLength(1);
    expect(
      productionConfigErrors({
        baseUrl: 'https://example.test',
        secret: 'a'.repeat(32),
      })
    ).toEqual([]);
  });
});
