export const ALLOWED_UPLOAD_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function validateUploadedImage(file: File) {
  if (!(file instanceof File)) {
    return { ok: false as const, error: 'No file provided.' };
  }

  if (!ALLOWED_UPLOAD_MIME_TYPES[file.type]) {
    return { ok: false as const, error: 'Upload a JPEG, PNG, or WebP image.' };
  }

  if (file.size === 0 || file.size > MAX_UPLOAD_BYTES) {
    return { ok: false as const, error: 'Image must be smaller than 5MB.' };
  }

  return { ok: true as const };
}

export function sanitizeFilename(name: string, fallback = 'upload') {
  const normalized = name
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

  return normalized || fallback;
}

export function getCorsAllowedOrigins() {
  const raw = process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
