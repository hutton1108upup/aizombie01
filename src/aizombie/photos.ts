import { validatePhotoDimensions, validatePhotoMetadata } from './contracts';

/** Preview only: photo bytes remain in this tab and are never sent to a server. */
export async function readPreviewPhoto(file: File): Promise<string> {
  validatePhotoMetadata(file);
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('This photo cannot be decoded. Choose another image.');
  });
  try {
    validatePhotoDimensions(bitmap.width, bitmap.height);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context)
      throw new Error('Photo preview is unavailable in this browser.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    // Re-encoding reduces preview memory and drops the original metadata.
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    bitmap.close();
  }
}
