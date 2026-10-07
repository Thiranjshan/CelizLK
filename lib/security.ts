import { unlink } from 'node:fs/promises';
import path from 'node:path';

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

export function getRemovedUploadUrls(oldUrls: Array<string | null | undefined>, nextUrls: Array<string | null | undefined>) {
  const previous = new Set((oldUrls ?? []).filter((value): value is string => typeof value === 'string' && value.trim().length > 0));
  const next = new Set((nextUrls ?? []).filter((value): value is string => typeof value === 'string' && value.trim().length > 0));

  return [...previous].filter((url) => !next.has(url));
}

export function getUploadFilePath(url: string | null | undefined) {
  if (typeof url !== 'string') return null;

  const normalized = url.trim().split('?')[0].split('#')[0].replace(/\\/g, '/');
  if (!normalized.startsWith('/uploads/')) return null;

  const relativePath = normalized.replace(/^\/+/, '');
  return path.join(process.cwd(), 'public', relativePath);
}

export async function deleteUploadFileIfExists(url: string | null | undefined) {
  const filePath = getUploadFilePath(url);
  if (!filePath) return false;

  try {
    await unlink(filePath);
    return true;
  } catch (error: unknown) {
    const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: string }).code) : '';
    if (code === 'ENOENT' || code === 'ENOTDIR') return false;
    throw error;
  }
}

export function getCorsAllowedOrigins() {
  const raw = process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000';
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}
