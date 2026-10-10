import { z } from 'zod';

export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;
export const MIN_PHOTO_SIDE = 300;
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const creditPacks = [
  { id: 'single', name: 'Single', amount: 690, credits: 100, popular: false },
  { id: 'starter', name: 'Starter', amount: 990, credits: 300, popular: true },
  {
    id: 'creator',
    name: 'Creator',
    amount: 2490,
    credits: 900,
    popular: false,
  },
] as const;

// File ownership is checked on the server. Never accept arbitrary external URLs.
export const createJobSchema = z
  .object({
    mode: z.enum(['couple', 'pet']),
    quality: z.enum(['480p', '720p']),
    aspect: z.enum(['16:9', '9:16']),
    survivorFileId: z.string().uuid(),
    zombieFileId: z.string().uuid(),
    consent: z.literal(true),
    idempotencyKey: z.string().uuid(),
  })
  .strict();

export type VideoJobStatus = 'queued' | 'running' | 'done' | 'failed';
export interface VideoJobView {
  id: string;
  status: VideoJobStatus;
  quality: '480p' | '720p';
  aspect: '16:9' | '9:16';
  createdAt: number;
  error: string | null;
  videoUrl: string | null;
}

export function validatePhotoMetadata(file: { size: number; type: string }) {
  if (!PHOTO_TYPES.some((type) => type === file.type)) {
    throw new Error('Choose a JPG, PNG or WebP photo.');
  }
  if (file.size <= 0 || file.size > MAX_PHOTO_BYTES) {
    throw new Error('Each photo must be non-empty and no larger than 8 MB.');
  }
}

export function validatePhotoDimensions(width: number, height: number) {
  if (width < MIN_PHOTO_SIDE || height < MIN_PHOTO_SIDE) {
    throw new Error('Each side of the photo must be at least 300 pixels.');
  }
}
